import { afterEach, describe, expect, it, vi } from "vitest";

import type { DropZone } from "../../../src/components/files/drop-zone.js";
import { registerBoxDefaultDesignSystem } from "../../../src/foundations/tokens/index.js";
import { ContentUploader } from "../../../src/patterns/content-uploader/content-uploader.js";
import type {
  CreateFolderRequest,
  UploadRequest,
  UploadTransport,
} from "../../../src/patterns/content-uploader/types.js";

ContentUploader.register();
// The empty-state art comes from the active design system, so that a host with
// its own system gets its own illustration. Without one registered the uploader
// degrades to copy plus controls, which is what an unstyled consumer sees.
registerBoxDefaultDesignSystem({ setActive: true });

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
  it("shows the empty state and a disabled action bar while the queue is empty", async () => {
    const element = await mountUploader(resolvingTransport());

    const dropZone = element.shadowRoot?.querySelector('[part="drop-zone"]') as HTMLElement;
    expect(dropZone).not.toBeNull();
    expect(dropZone.hidden).toBe(false);

    // The bar stays put with its controls disabled rather than appearing when
    // the first file lands — a footer that materialises under the pointer is
    // how people click the wrong thing.
    expect((element.shadowRoot?.querySelector('[part="footer"]') as HTMLElement).hidden).toBe(false);
    expect((element.shadowRoot?.querySelector('[part~="upload"]') as HTMLButtonElement).disabled).toBe(true);
    expect((element.shadowRoot?.querySelector('[part~="cancel"]') as HTMLButtonElement).disabled).toBe(true);
    expect((element.shadowRoot?.querySelector('[part~="close"]') as HTMLButtonElement).disabled).toBe(false);
  });

  it("paints the empty state with the design system's upload illustration", async () => {
    const element = await mountUploader(resolvingTransport());

    const art = element.shadowRoot?.querySelector('[part="drop-illustration"]') as HTMLElement;
    expect(art.querySelector("svg")).not.toBeNull();
    expect(art.closest("box-drop-zone")?.getAttribute("variant")).toBe("hero");
  });

  it("swaps the empty state for the queue once files are added", async () => {
    const element = await mountUploader(resolvingTransport(), el => {
      el.autoStart = false;
    });

    element.addFiles([file("a.pdf")]);
    await flushMicrotasks();

    // The invitation and the list are alternatives, not neighbours.
    expect((element.shadowRoot?.querySelector('[part="drop-zone"]') as HTMLElement).hidden).toBe(true);
    expect(element.shadowRoot?.querySelectorAll('[part="row"]')).toHaveLength(1);
  });

  it("starts the queue from the Upload button when auto-start is off", async () => {
    const transport = resolvingTransport();
    const element = await mountUploader(transport, el => {
      el.autoStart = false;
    });

    element.addFiles([file("a.pdf")]);
    await flushMicrotasks();

    const upload = element.shadowRoot?.querySelector('[part~="upload"]') as HTMLButtonElement;
    expect(upload.disabled).toBe(false);
    upload.click();
    await flushMicrotasks();

    expect((element.shadowRoot?.querySelector('[part="row"]') as HTMLElement).dataset.status).toBe(
      "succeeded",
    );
  });

  it("cancels everything still in flight from the Cancel button", async () => {
    // Honours its signal, as a real transport does: an upload that ignores
    // abort can only be abandoned, never confirmed cancelled.
    const transport: UploadTransport = {
      uploadFile: vi.fn().mockImplementation(
        (request: UploadRequest) =>
          new Promise((_resolve, reject) => {
            request.signal?.addEventListener("abort", () => {
              const aborted = new Error("AbortError");
              aborted.name = "AbortError";
              reject(aborted);
            });
          }),
      ),
    };
    const element = await mountUploader(transport, el => {
      el.concurrency = 1;
    });

    element.addFiles([file("a.pdf"), file("b.pdf")]);
    await flushMicrotasks();

    (element.shadowRoot?.querySelector('[part~="cancel"]') as HTMLButtonElement).click();
    await flushMicrotasks();

    const statuses = Array.from(element.shadowRoot?.querySelectorAll('[part="row"]') ?? []).map(
      row => (row as HTMLElement).dataset.status,
    );
    expect(statuses).toEqual(["cancelled", "cancelled"]);
  });

  it("reports Close as an intent rather than closing itself", async () => {
    const element = await mountUploader(resolvingTransport());
    const closed = vi.fn();
    element.addEventListener("close", closed);

    (element.shadowRoot?.querySelector('[part~="close"]') as HTMLButtonElement).click();

    // The uploader does not own the surface it sits in, so the host decides
    // what closing means; the element stays exactly where it was.
    expect(closed).toHaveBeenCalledTimes(1);
    expect(closed.mock.calls[0]?.[0]?.cancelable).toBe(true);
    expect(element.isConnected).toBe(true);
  });

  it("holds Close while uploads are running, and releases it when they settle", async () => {
    let finish: ((result: { fileId: string }) => void) | undefined;
    const transport: UploadTransport = {
      uploadFile: vi.fn().mockImplementation(
        () =>
          new Promise<{ fileId: string }>(resolve => {
            finish = resolve;
          }),
      ),
    };
    const element = await mountUploader(transport);
    const close = element.shadowRoot?.querySelector('[part~="close"]') as HTMLButtonElement;

    element.addFiles([file("a.pdf")]);
    await flushMicrotasks();
    expect(close.disabled).toBe(true);

    finish?.({ fileId: "remote-a" });
    await flushMicrotasks();

    // box-ui-elements keeps Close disabled for any non-empty queue, which traps
    // a person on a finished queue; it is only held while work is in flight.
    expect(close.disabled).toBe(false);
  });

  it("hides Close when the host owns dismissal", async () => {
    const element = await mountUploader(resolvingTransport(), el => {
      el.closable = false;
    });

    expect((element.shadowRoot?.querySelector('[part~="close"]') as HTMLElement).hidden).toBe(true);
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

    (element.shadowRoot?.querySelector('[part~="clear-completed"]') as HTMLButtonElement).click();
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

  it("narrows the browse dialog to the allowed extensions", async () => {
    const element = await mountUploader(resolvingTransport(), el => {
      // A leading dot is optional, as it is for the queue's own check.
      el.extensions = ["pdf", ".docx"];
    });

    const dropZone = element.shadowRoot?.querySelector('[part="drop-zone"]') as DropZone;
    expect(dropZone.accept).toBe(".pdf,.docx");
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
