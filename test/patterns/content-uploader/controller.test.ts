import { describe, expect, it, vi } from "vitest";

import { ContentUploaderController } from "../../../src/patterns/content-uploader/controller.js";
import { resolveUploadRejection, summarizeUploadQueue } from "../../../src/patterns/content-uploader/types.js";
import type {
  CreateFolderRequest,
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

/** A transport that can also create folders, recording what it was asked for. */
const folderCapableTransport = (): UploadTransport & {
  createdFolders: Array<{ name: string; parentFolderId: string }>;
  uploadedTo: string[];
} => {
  const createdFolders: Array<{ name: string; parentFolderId: string }> = [];
  const uploadedTo: string[] = [];
  let nextId = 0;

  return {
    createdFolders,
    uploadedTo,
    createFolder: vi.fn().mockImplementation(async request => {
      createdFolders.push({ name: request.name, parentFolderId: request.parentFolderId });
      nextId += 1;
      return { folderId: `folder-${nextId}` };
    }),
    uploadFile: vi.fn().mockImplementation(async (request: UploadRequest) => {
      uploadedTo.push(request.folderId);
      return { fileId: `remote-${request.fileName}` };
    }),
  };
};

describe("ContentUploaderController — file limit", () => {
  it("rejects past the limit rather than enqueueing without bound", async () => {
    const controller = createController(resolvingTransport(), { fileLimit: 2, autoStart: false });
    const rejected = vi.fn();
    controller.subscribe("itemRejected", rejected);

    const added = controller.addFiles([file("a"), file("b"), file("c")]);

    expect(added).toHaveLength(2);
    expect(rejected).toHaveBeenCalledTimes(1);
    expect(rejected.mock.calls[0]![0].reason).toBe("file-limit-reached");
  });

  it("counts the live queue, so two drops cannot together exceed the limit", () => {
    const controller = createController(resolvingTransport(), { fileLimit: 2, autoStart: false });

    expect(controller.addFiles([file("a"), file("b")])).toHaveLength(2);
    expect(controller.addFiles([file("c")])).toHaveLength(0);
  });

  it("is unbounded when no limit is configured", () => {
    const controller = createController(resolvingTransport(), { autoStart: false });

    expect(controller.addFiles([file("a"), file("b"), file("c")])).toHaveLength(3);
  });
});

describe("ContentUploaderController — folder uploads", () => {
  it("refuses a foldered file when the transport cannot create folders", () => {
    // Flattening into the destination root would scatter a hundred files out of
    // the structure they were dropped in, and there is no undo for that.
    const controller = createController(resolvingTransport(), { autoStart: false });
    const rejected = vi.fn();
    controller.subscribe("itemRejected", rejected);

    const added = controller.addEntries([{ file: file("q1.pdf"), path: "docs/2026" }]);

    expect(added).toHaveLength(0);
    expect(rejected.mock.calls[0]![0].reason).toBe("folder-unsupported");
  });

  it("still accepts loose files when the transport cannot create folders", () => {
    const controller = createController(resolvingTransport(), { autoStart: false });

    expect(controller.addEntries([{ file: file("a.txt"), path: "" }])).toHaveLength(1);
  });

  it("creates each path segment and uploads into the leaf", async () => {
    const transport = folderCapableTransport();
    const controller = createController(transport);

    controller.addEntries([{ file: file("q1.pdf"), path: "docs/2026" }]);
    await flush();

    expect(transport.createdFolders).toEqual([
      { name: "docs", parentFolderId: "0" },
      { name: "2026", parentFolderId: "folder-1" },
    ]);
    expect(transport.uploadedTo).toEqual(["folder-2"]);
  });

  it("creates a shared folder once even when its files upload concurrently", async () => {
    // Two files in the same folder resolve the same path at the same moment.
    // Caching only the settled id would let both create "docs" and split the
    // upload across two folders with the same name.
    const transport = folderCapableTransport();
    const controller = createController(transport, { concurrency: 4 });

    controller.addEntries([
      { file: file("a.pdf"), path: "docs" },
      { file: file("b.pdf"), path: "docs" },
      { file: file("c.pdf"), path: "docs" },
    ]);
    await flush();

    expect(transport.createdFolders).toEqual([{ name: "docs", parentFolderId: "0" }]);
    expect(transport.uploadedTo).toEqual(["folder-1", "folder-1", "folder-1"]);
  });

  it("uploads a loose file straight to the destination", async () => {
    const transport = folderCapableTransport();
    const controller = createController(transport);

    controller.addFiles([file("a.txt")]);
    await flush();

    expect(transport.createdFolders).toEqual([]);
    expect(transport.uploadedTo).toEqual(["0"]);
  });

  it("fails the item, not the queue, when a folder cannot be created", async () => {
    const transport: UploadTransport = {
      createFolder: vi.fn().mockRejectedValue(new Error("Insufficient scope")),
      uploadFile: vi.fn().mockResolvedValue({ fileId: "remote" }),
    };
    const controller = createController(transport);
    const failed = vi.fn();
    controller.subscribe("itemFailed", failed);

    controller.addEntries([{ file: file("q1.pdf"), path: "docs" }]);
    await flush();

    expect(failed).toHaveBeenCalledTimes(1);
    expect(failed.mock.calls[0]![0].item.errorMessage).toBe("Insufficient scope");
    expect(transport.uploadFile).not.toHaveBeenCalled();
  });

  it("retries folder creation rather than caching the failure", async () => {
    // A poisoned cache entry would fail every later file in that folder against
    // an error that has already been resolved.
    let attempts = 0;
    const transport: UploadTransport = {
      createFolder: vi.fn().mockImplementation(async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error("transient");
        }
        return { folderId: "folder-ok" };
      }),
      uploadFile: vi.fn().mockResolvedValue({ fileId: "remote" }),
    };
    const controller = createController(transport, { concurrency: 1 });

    const [first] = controller.addEntries([{ file: file("a.pdf"), path: "docs" }]);
    await flush();
    controller.retryItem(first!.id);
    await flush();

    expect(attempts).toBe(2);
    expect(transport.uploadFile).toHaveBeenCalledTimes(1);
  });

  it("does not fail a folder's siblings when one of its files is cancelled", async () => {
    // Folder creation is shared by every file in that folder. Binding it to
    // whichever file started first meant cancelling that one file aborted the
    // shared request and took its siblings down with it — reported as
    // cancellations, which the person never asked for.
    let releaseFolder: ((result: { folderId: string }) => void) | undefined;
    const transport: UploadTransport = {
      // Honours its signal, as a real fetch-backed transport does — that is
      // what made the shared-signal bug bite.
      createFolder: vi.fn().mockImplementation(
        (request: CreateFolderRequest) =>
          new Promise<{ folderId: string }>((resolve, reject) => {
            releaseFolder = resolve;
            request.signal?.addEventListener("abort", () => {
              const aborted = new Error("AbortError");
              aborted.name = "AbortError";
              reject(aborted);
            });
          }),
      ),
      uploadFile: vi.fn().mockImplementation(async (request: UploadRequest) => ({
        fileId: `remote-${request.fileName}`,
      })),
    };
    const controller = createController(transport, { concurrency: 2 });

    const [first, second] = controller.addEntries([
      { file: file("a.pdf"), path: "docs" },
      { file: file("b.pdf"), path: "docs" },
    ]);
    await flush();

    // Both are waiting on the one folder; cancel only the first.
    controller.cancelItem(first!.id);
    releaseFolder?.({ folderId: "folder-1" });
    await flush();

    const items = controller.getState().items;
    expect(items.find(item => item.id === first!.id)?.status).toBe("cancelled");
    expect(items.find(item => item.id === second!.id)?.status).toBe("succeeded");
    expect(transport.createFolder).toHaveBeenCalledTimes(1);
  });

  it("records the path on the queue item, so a host can show it", () => {
    const transport = folderCapableTransport();
    const controller = createController(transport, { autoStart: false });

    const [item] = controller.addEntries([{ file: file("q1.pdf"), path: "docs/2026" }]);

    expect(item!.path).toBe("docs/2026");
  });
});
