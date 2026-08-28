import { afterEach, describe, expect, it, vi } from "vitest";

import type { DropZone } from "../../../src/components/files/drop-zone.js";
import { ContentUploader } from "../../../src/patterns/content-uploader/content-uploader.js";
import type {
  CreateFolderRequest,
  UploadRequest,
  UploadTransport,
} from "../../../src/patterns/content-uploader/types.js";

ContentUploader.register();

const flushMicrotasks = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const file = (name: string, size = 10): { name: string; size: number } => ({ name, size });

const resolvingTransport = (): UploadTransport => ({
  uploadFile: vi.fn().mockImplementation(async (request: UploadRequest) => {
    request.onProgress?.(1);
    return { fileId: `remote-${request.fileName}` };
  }),
});

const mountUploader = async (
  transport: UploadTransport,
  configure?: (element: ContentUploader) => void,
): Promise<ContentUploader> => {
  const element = document.createElement("box-content-uploader") as ContentUploader;
  element.transport = transport;
  element.folderId = "0";
  element.token = "token";
  configure?.(element);
  document.body.append(element);
  await flushMicrotasks();
  return element;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("box-content-uploader", () => {
  it("renders the drop zone and hides the footer while the queue is empty", async () => {
    const element = await mountUploader(resolvingTransport());

    expect(element.shadowRoot?.querySelector('[part="drop-zone"]')).not.toBeNull();
    expect((element.shadowRoot?.querySelector('[part="footer"]') as HTMLElement).hidden).toBe(true);
  });

  it("queues files selected through the drop zone and uploads them", async () => {
    const transport = resolvingTransport();
    const element = await mountUploader(transport);
    const succeeded = vi.fn();
    element.addEventListener("item-succeeded", succeeded);

    const dropZone = element.shadowRoot?.querySelector('[part="drop-zone"]') as HTMLElement;
    dropZone.dispatchEvent(
      new CustomEvent("files-selected", { bubbles: true, detail: { files: [file("report.pdf", 2048)] } }),
    );
    await flushMicrotasks();

    expect(succeeded).toHaveBeenCalledTimes(1);
    const row = element.shadowRoot?.querySelector('[part="row"]') as HTMLElement;
    expect(row.dataset.status).toBe("succeeded");
    expect(row.textContent).toContain("report.pdf");
    expect(row.textContent).toContain("2.0 KB");
    expect(element.shadowRoot?.textContent).toContain("1 of 1 uploaded");
  });

  it("patches progress in place without rebuilding the row", async () => {
    let reportProgress: ((fraction: number) => void) | undefined;
    const transport: UploadTransport = {
      uploadFile: vi.fn().mockImplementation(
        (request: UploadRequest) =>
          new Promise(() => {
            reportProgress = request.onProgress;
          }),
      ),
    };
    const element = await mountUploader(transport);

    element.addFiles([file("a.pdf")]);
    await flushMicrotasks();

    const row = element.shadowRoot?.querySelector('[part="row"]');
    const bar = element.shadowRoot?.querySelector('[part="row-progress"]');
    reportProgress?.(0.5);
    await flushMicrotasks();

    expect(element.shadowRoot?.querySelector('[part="row"]')).toBe(row);
    expect(element.shadowRoot?.querySelector('[part="row-progress"]')).toBe(bar);
    expect((bar as HTMLElement).getAttribute("value")).toBe("50");
  });

  it("wires the row actions to cancel and retry", async () => {
    const transport: UploadTransport = {
      uploadFile: vi.fn().mockImplementation(
        (request: UploadRequest) =>
          new Promise((resolve, reject) => {
            request.signal?.addEventListener("abort", () => reject(new Error("AbortError")));
          }),
      ),
    };
    const element = await mountUploader(transport);

    element.addFiles([file("a.pdf")]);
    await flushMicrotasks();

    (element.shadowRoot?.querySelector('[data-action="cancel"]') as HTMLButtonElement).click();
    await flushMicrotasks();

    const row = element.shadowRoot?.querySelector('[part="row"]') as HTMLElement;
    expect(row.dataset.status).toBe("cancelled");
    expect(element.shadowRoot?.querySelector('[data-action="retry"]')).not.toBeNull();

    (element.shadowRoot?.querySelector('[data-action="retry"]') as HTMLButtonElement).click();
    await flushMicrotasks();
    expect((element.shadowRoot?.querySelector('[part="row"]') as HTMLElement).dataset.status).toBe(
      "uploading",
    );
  });

  it("shows the error message on failed rows and clears completed items", async () => {
    let attempts = 0;
    const transport: UploadTransport = {
      uploadFile: vi.fn().mockImplementation(async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error("quota exceeded");
        }
        return { fileId: "remote" };
      }),
    };
    const element = await mountUploader(transport);

    element.addFiles([file("bad.pdf"), file("good.pdf")]);
    await flushMicrotasks();

    expect(element.shadowRoot?.querySelector('[part="row-error"]')?.textContent).toBe("quota exceeded");

    (element.shadowRoot?.querySelector('[part="clear-completed"]') as HTMLButtonElement).click();
    await flushMicrotasks();

    // The failed row stays for retry; the succeeded row is gone.
    const rows = element.shadowRoot?.querySelectorAll('[part="row"]');
    expect(rows).toHaveLength(1);
    expect((rows?.[0] as HTMLElement).dataset.status).toBe("failed");
  });

  it("re-dispatches rejections and honours the constraint attributes", async () => {
    const element = await mountUploader(resolvingTransport(), el => {
      el.extensions = ["pdf"];
      el.maxFileSize = 1024;
    });
    const rejected = vi.fn();
    element.addEventListener("item-rejected", rejected);

    element.addFiles([file("notes.txt"), file("big.pdf", 4096)]);
    await flushMicrotasks();

    expect(rejected).toHaveBeenCalledTimes(2);
    expect(rejected.mock.calls[0]?.[0]?.detail).toMatchObject({ reason: "extension-not-allowed" });
    expect(rejected.mock.calls[1]?.[0]?.detail).toMatchObject({ reason: "file-too-large" });
    expect(element.shadowRoot?.querySelectorAll('[part="row"]')).toHaveLength(0);
  });

  it("waits for start() when auto-start is disabled", async () => {
    const transport = resolvingTransport();
    const element = await mountUploader(transport, el => {
      el.autoStart = false;
    });

    element.addFiles([file("a.pdf")]);
    await flushMicrotasks();
    expect((element.shadowRoot?.querySelector('[part="row"]') as HTMLElement).dataset.status).toBe("queued");

    element.start();
    await flushMicrotasks();
    expect((element.shadowRoot?.querySelector('[part="row"]') as HTMLElement).dataset.status).toBe(
      "succeeded",
    );
  });

  it("recreates a dropped folder tree through the transport", async () => {
    const created: Array<{ name: string; parentFolderId: string }> = [];
    const transport: UploadTransport = {
      ...resolvingTransport(),
      createFolder: vi.fn().mockImplementation(async (request: CreateFolderRequest) => {
        created.push({ name: request.name, parentFolderId: request.parentFolderId });
        return { folderId: `folder-${created.length}` };
      }),
    };
    const element = await mountUploader(transport);

    const dropZone = element.shadowRoot?.querySelector('[part="drop-zone"]') as HTMLElement;
    dropZone.dispatchEvent(
      new CustomEvent("files-selected", {
        bubbles: true,
        detail: {
          entries: [
            { file: file("q1.pdf"), path: "docs/2026" },
            { file: file("q2.pdf"), path: "docs/2026" },
          ],
        },
      }),
    );
    await flushMicrotasks();

    // "docs" then "2026" inside it — and only once each, though two files
    // wanted the same folder at the same moment.
    expect(created).toEqual([
      { name: "docs", parentFolderId: "0" },
      { name: "2026", parentFolderId: "folder-1" },
    ]);
    const uploads = (transport.uploadFile as ReturnType<typeof vi.fn>).mock.calls;
    expect(uploads.map(([request]) => request.folderId)).toEqual(["folder-2", "folder-2"]);
  });

  it("refuses a folder drop the transport cannot recreate rather than flattening it", async () => {
    const element = await mountUploader(resolvingTransport());
    const rejected = vi.fn();
    element.addEventListener("item-rejected", rejected);

    const dropZone = element.shadowRoot?.querySelector('[part="drop-zone"]') as HTMLElement;
    dropZone.dispatchEvent(
      new CustomEvent("files-selected", {
        bubbles: true,
        detail: { entries: [{ file: file("q1.pdf"), path: "docs" }] },
      }),
    );
    await flushMicrotasks();

    expect(rejected.mock.calls[0]?.[0]?.detail).toMatchObject({ reason: "folder-unsupported" });
    expect(element.shadowRoot?.querySelectorAll('[part="row"]')).toHaveLength(0);
  });

  it("caps the queue at the file limit", async () => {
    const element = await mountUploader(resolvingTransport(), el => {
      el.fileLimit = 2;
    });
    const rejected = vi.fn();
    element.addEventListener("item-rejected", rejected);

    element.addFiles([file("a.pdf"), file("b.pdf"), file("c.pdf")]);
    await flushMicrotasks();

    expect(element.shadowRoot?.querySelectorAll('[part="row"]')).toHaveLength(2);
    expect(rejected).toHaveBeenCalledTimes(1);
    expect(rejected.mock.calls[0]?.[0]?.detail).toMatchObject({ reason: "file-limit-reached" });
  });

  it("defaults the file limit to 100", async () => {
    const element = await mountUploader(resolvingTransport(), el => {
      el.autoStart = false;
    });

    element.addFiles(Array.from({ length: 101 }, (_, index) => file(`f-${index}.pdf`)));
    await flushMicrotasks();

    expect(element.shadowRoot?.querySelectorAll('[part="row"]')).toHaveLength(100);
  });

  it("passes directories through to the drop zone's browse dialog", async () => {
    const element = await mountUploader(resolvingTransport(), el => {
      el.directories = true;
    });

    const dropZone = element.shadowRoot?.querySelector('[part="drop-zone"]') as DropZone;
    expect(dropZone.directories).toBe(true);

    element.directories = false;
    await flushMicrotasks();
    expect(dropZone.directories).toBe(false);
  });

  it("emits queue-drained with the final tally", async () => {
    const element = await mountUploader(resolvingTransport());
    const drained = vi.fn();
    element.addEventListener("queue-drained", drained);

    element.addFiles([file("a.pdf"), file("b.pdf")]);
    await flushMicrotasks();

    expect(drained.mock.calls.at(-1)?.[0]?.detail).toEqual({ succeeded: 2, failed: 0, cancelled: 0 });
  });
});
