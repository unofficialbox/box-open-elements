import { describe, expect, it, vi } from "vitest";

import { ContentUploaderController } from "../../../src/patterns/content-uploader/controller.js";
import { resolveUploadRejection, summarizeUploadQueue } from "../../../src/patterns/content-uploader/types.js";
import type {
  UploadRequest,
  UploadTransport,
  UploaderSessionConfig,
} from "../../../src/patterns/content-uploader/types.js";

const file = (name: string, size = 10): { name: string; size: number } => ({ name, size });

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const createController = (
  transport: UploadTransport,
  overrides: Partial<UploaderSessionConfig> = {},
): ContentUploaderController =>
  new ContentUploaderController({
    folderId: "0",
    token: "token",
    transport,
    ...overrides,
  });

const resolvingTransport = (): UploadTransport => ({
  uploadFile: vi.fn().mockImplementation(async (request: UploadRequest) => {
    request.onProgress?.(1);
    return { fileId: `remote-${request.fileName}` };
  }),
});

describe("resolveUploadRejection", () => {
  it("accepts anything without constraints", () => {
    expect(resolveUploadRejection(file("a.bin"), {})).toBeNull();
  });

  it("rejects by extension allowlist, case-insensitively", () => {
    expect(resolveUploadRejection(file("Deck.PDF"), { extensions: ["pdf"] })).toBeNull();
    expect(resolveUploadRejection(file("notes.txt"), { extensions: [".pdf"] })).toBe("extension-not-allowed");
    expect(resolveUploadRejection(file("README"), { extensions: ["md"] })).toBe("extension-not-allowed");
  });

  it("rejects oversized files", () => {
    expect(resolveUploadRejection(file("big.pdf", 2048), { maxFileSizeBytes: 1024 })).toBe("file-too-large");
    expect(resolveUploadRejection(file("ok.pdf", 1024), { maxFileSizeBytes: 1024 })).toBeNull();
  });
});

describe("ContentUploaderController happy path", () => {
  it("auto-uploads added files and reports lifecycle events", async () => {
    const transport = resolvingTransport();
    const controller = createController(transport);
    const events: string[] = [];
    (["itemAdded", "itemStarted", "itemProgress", "itemSucceeded", "queueDrained"] as const).forEach(name =>
      controller.subscribe(name, () => events.push(name)),
    );

    const added = controller.addFiles([file("report.pdf", 2048)]);
    expect(added).toHaveLength(1);
    await flush();

    const item = controller.getState().items[0]!;
    expect(item.status).toBe("succeeded");
    expect(item.progress).toBe(1);
    expect(item.fileId).toBe("remote-report.pdf");
    expect(events).toEqual(["itemAdded", "itemStarted", "itemProgress", "itemSucceeded", "queueDrained"]);
    expect(transport.uploadFile).toHaveBeenCalledWith(
      expect.objectContaining({ fileName: "report.pdf", folderId: "0", token: "token" }),
    );
  });

  it("emits itemRejected for constrained files and never queues them", () => {
    const transport = resolvingTransport();
    const controller = createController(transport, { extensions: ["pdf"], maxFileSizeBytes: 100 });
    const rejected = vi.fn();
    controller.subscribe("itemRejected", rejected);

    const added = controller.addFiles([file("notes.txt"), file("big.pdf", 200), file("ok.pdf", 50)]);

    expect(added.map(item => item.name)).toEqual(["ok.pdf"]);
    expect(rejected).toHaveBeenCalledTimes(2);
    expect(rejected.mock.calls[0]?.[0]).toMatchObject({ reason: "extension-not-allowed" });
    expect(rejected.mock.calls[1]?.[0]).toMatchObject({ reason: "file-too-large" });
  });

  it("respects the concurrency limit", async () => {
    const resolvers: Array<() => void> = [];
    const transport: UploadTransport = {
      uploadFile: vi.fn().mockImplementation(
        () =>
          new Promise(resolve => {
            resolvers.push(() => resolve({ fileId: "f" }));
          }),
      ),
    };
    const controller = createController(transport, { concurrency: 2 });

    controller.addFiles([file("a.pdf"), file("b.pdf"), file("c.pdf")]);
    await flush();

    expect(summarizeUploadQueue(controller.getState().items)).toMatchObject({ uploading: 2, queued: 1 });

    resolvers[0]!();
    await flush();
    expect(summarizeUploadQueue(controller.getState().items)).toMatchObject({
      uploading: 2,
      queued: 0,
      succeeded: 1,
    });

    resolvers[1]!();
    resolvers[2]!();
    await flush();
    expect(summarizeUploadQueue(controller.getState().items)).toMatchObject({ succeeded: 3 });
  });

  it("waits for start() when autoStart is off", async () => {
    const transport = resolvingTransport();
    const controller = createController(transport, { autoStart: false });

    controller.addFiles([file("a.pdf")]);
    await flush();
    expect(controller.getState().items[0]?.status).toBe("queued");
    expect(transport.uploadFile).not.toHaveBeenCalled();

    controller.start();
    await flush();
    expect(controller.getState().items[0]?.status).toBe("succeeded");
  });
});

describe("ContentUploaderController cancel / retry / remove", () => {
  it("cancels an in-flight upload through its abort signal", async () => {
    const transport: UploadTransport = {
      uploadFile: vi.fn().mockImplementation(
        (request: UploadRequest) =>
          new Promise((resolve, reject) => {
            request.signal?.addEventListener("abort", () => {
              reject(new Error("AbortError"));
            });
          }),
      ),
    };
    const controller = createController(transport);
    const cancelled = vi.fn();
    controller.subscribe("itemCancelled", cancelled);

    const [item] = controller.addFiles([file("a.pdf")]);
    await flush();
    expect(controller.getState().items[0]?.status).toBe("uploading");

    controller.cancelItem(item!.id);
    await flush();

    expect(controller.getState().items[0]?.status).toBe("cancelled");
    expect(cancelled).toHaveBeenCalledTimes(1);
  });

  it("cancels a queued item without touching the transport", async () => {
    const transport: UploadTransport = {
      uploadFile: vi.fn().mockImplementation(() => new Promise(() => {})),
    };
    const controller = createController(transport, { concurrency: 1 });

    const added = controller.addFiles([file("a.pdf"), file("b.pdf")]);
    await flush();

    controller.cancelItem(added[1]!.id);
    expect(controller.getState().items[1]?.status).toBe("cancelled");
    expect(transport.uploadFile).toHaveBeenCalledTimes(1);
  });

  it("marks failures with the error message and retries them", async () => {
    let attempts = 0;
    const transport: UploadTransport = {
      uploadFile: vi.fn().mockImplementation(async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error("network down");
        }
        return { fileId: "remote-1" };
      }),
    };
    const controller = createController(transport);
    const failed = vi.fn();
    controller.subscribe("itemFailed", failed);

    const [item] = controller.addFiles([file("a.pdf")]);
    await flush();

    expect(controller.getState().items[0]).toMatchObject({ status: "failed", errorMessage: "network down" });
    expect(failed).toHaveBeenCalledTimes(1);

    controller.retryItem(item!.id);
    await flush();

    expect(controller.getState().items[0]).toMatchObject({ status: "succeeded", fileId: "remote-1" });
  });

  it("removes settled items and clears completed ones", async () => {
    const transport = resolvingTransport();
    const controller = createController(transport);
    const removed = vi.fn();
    controller.subscribe("itemRemoved", removed);

    const added = controller.addFiles([file("a.pdf"), file("b.pdf")]);
    await flush();

    controller.removeItem(added[0]!.id);
    expect(removed).toHaveBeenCalledWith({ itemId: added[0]!.id });
    expect(controller.getState().items).toHaveLength(1);

    controller.clearCompleted();
    expect(controller.getState().items).toHaveLength(0);
  });

  it("keeps failed items when clearing completed", async () => {
    const transport: UploadTransport = {
      uploadFile: vi.fn().mockRejectedValue(new Error("nope")),
    };
    const controller = createController(transport);

    controller.addFiles([file("a.pdf")]);
    await flush();

    controller.clearCompleted();
    expect(controller.getState().items).toHaveLength(1);
    expect(controller.getState().items[0]?.status).toBe("failed");
  });

  it("reports queueDrained with final counts", async () => {
    let attempts = 0;
    const transport: UploadTransport = {
      uploadFile: vi.fn().mockImplementation(async () => {
        attempts += 1;
        if (attempts === 2) {
          throw new Error("bad file");
        }
        return { fileId: `remote-${String(attempts)}` };
      }),
    };
    const controller = createController(transport, { concurrency: 1 });
    const drained = vi.fn();
    controller.subscribe("queueDrained", drained);

    controller.addFiles([file("a.pdf"), file("b.pdf")]);
    await flush();

    expect(drained).toHaveBeenLastCalledWith({ succeeded: 1, failed: 1, cancelled: 0 });
  });
});
