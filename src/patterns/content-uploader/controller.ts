import { Controller } from "../../core/controller.js";
import { resolveUploadRejection, summarizeUploadQueue } from "./types.js";
import type {
  UploadFileLike,
  UploadQueueItem,
  UploaderEvents,
  UploaderSessionConfig,
  UploaderState,
} from "./types.js";

const DEFAULT_CONCURRENCY = 2;

const isAbortError = (error: unknown): boolean =>
  error instanceof Error && (error.name === "AbortError" || error.message === "AbortError");

/**
 * Headless upload queue: validates files against the session constraints,
 * runs up to `concurrency` transport uploads at a time, tracks per-item
 * progress, and supports cancel / retry / remove. The transport does the
 * actual moving of bytes; this controller never touches the network.
 */
export class ContentUploaderController extends Controller<UploaderState, UploaderEvents> {
  readonly config: UploaderSessionConfig;

  private counter = 0;

  private readonly files = new Map<string, UploadFileLike>();

  private readonly abortControllers = new Map<string, AbortController>();

  /** Directory path -> the in-flight or settled promise for its folder id. */
  private readonly folderIds = new Map<string, Promise<string>>();

  /**
   * Aborted only when the controller is destroyed.
   *
   * Folder creation is shared by every file in that folder, so it cannot belong
   * to any one of them: cancelling the file that happened to start first would
   * abort the shared request and fail all its siblings — as an abort, so they
   * would report themselves cancelled by the person, which never happened.
   */
  private readonly lifetime =
    typeof AbortController === "function" ? new AbortController() : null;

  constructor(config: UploaderSessionConfig) {
    super({ items: [], uploading: false });
    this.config = config;
  }

  get concurrency(): number {
    const value = this.config.concurrency ?? DEFAULT_CONCURRENCY;
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_CONCURRENCY;
  }

  get autoStart(): boolean {
    return this.config.autoStart ?? true;
  }

  /**
   * Slots left before `fileLimit` is reached. Settled items still count: the
   * limit is on the queue a person is looking at, not on throughput.
   */
  private remainingCapacity(): number {
    const limit = this.config.fileLimit;
    if (limit === undefined || !Number.isFinite(limit)) {
      return Number.POSITIVE_INFINITY;
    }
    return Math.max(0, Math.floor(limit) - this.state.items.length);
  }

  /**
   * Resolve a directory path to a destination folder id, creating each segment
   * that does not exist yet.
   *
   * The **promise** is memoised rather than the id, because concurrent uploads
   * into the same folder resolve the same path at the same moment; caching only
   * the settled value would let two of them each create "docs" and scatter the
   * files across two folders with the same name.
   */
  private resolveFolderId(path: string): Promise<string> {
    if (!path) {
      return Promise.resolve(this.config.folderId);
    }

    const existing = this.folderIds.get(path);
    if (existing) {
      return existing;
    }

    const separator = path.lastIndexOf("/");
    const parentPath = separator > 0 ? path.slice(0, separator) : "";
    const name = separator > 0 ? path.slice(separator + 1) : path;

    const pending = (async () => {
      const parentFolderId = await this.resolveFolderId(parentPath);
      const createFolder = this.config.transport.createFolder;
      if (!createFolder) {
        throw new Error("This transport cannot create folders");
      }
      const signal = this.lifetime?.signal;
      const result = await createFolder.call(this.config.transport, {
        name,
        parentFolderId,
        token: this.config.token,
        ...(signal ? { signal } : {}),
      });
      return result.folderId;
    })();

    this.folderIds.set(path, pending);
    // A failed creation must not be cached, or every file in that folder fails
    // against a poisoned entry instead of retrying the folder.
    void pending.catch(() => {
      if (this.folderIds.get(path) === pending) {
        this.folderIds.delete(path);
      }
    });

    return pending;
  }

  /**
   * Validate and enqueue files. Rejected files emit `itemRejected` and never
   * enter the queue. Returns the accepted queue items.
   */
  addFiles(files: UploadFileLike[]): UploadQueueItem[] {
    return this.addEntries(files.map(file => ({ file, path: "" })));
  }

  /**
   * Enqueue files that carry a directory path, as a dropped folder does.
   *
   * A path is only honoured when the transport can create folders. Without
   * that capability the files are refused rather than flattened into the
   * destination root — see `UploadTransport.createFolder`.
   */
  addEntries(entries: Array<{ file: UploadFileLike; path?: string }>): UploadQueueItem[] {
    const added: UploadQueueItem[] = [];
    const canCreateFolders = typeof this.config.transport.createFolder === "function";
    // Counted against the live queue, so two drops in a row cannot together
    // exceed the limit the way two independent checks would let them.
    let remaining = this.remainingCapacity();

    for (const entry of entries) {
      const { file } = entry;
      const path = entry.path ?? "";

      if (path && !canCreateFolders) {
        this.emit("itemRejected", { file, reason: "folder-unsupported" });
        continue;
      }

      const rejection = resolveUploadRejection(file, this.config);
      if (rejection) {
        this.emit("itemRejected", { file, reason: rejection });
        continue;
      }

      if (remaining <= 0) {
        this.emit("itemRejected", { file, reason: "file-limit-reached" });
        continue;
      }
      remaining -= 1;

      this.counter += 1;
      const item: UploadQueueItem = {
        id: `upload-${this.counter}`,
        name: file.name,
        size: file.size,
        status: "queued",
        progress: 0,
        ...(path ? { path } : {}),
      };
      this.files.set(item.id, file);
      added.push(item);
    }

    if (added.length) {
      this.setItems([...this.state.items, ...added]);
      for (const item of added) {
        this.emit("itemAdded", { item });
      }
      if (this.autoStart) {
        this.start();
      }
    }

    return added;
  }

  /** Begin (or resume) uploading queued items, up to the concurrency limit. */
  start(): void {
    this.pump();
  }

  /** Abort an in-flight upload or withdraw a queued item. */
  cancelItem(itemId: string): void {
    const item = this.getItem(itemId);
    if (!item) {
      return;
    }

    if (item.status === "uploading") {
      // The upload promise handler transitions the item to "cancelled".
      this.abortControllers.get(itemId)?.abort();
      return;
    }

    if (item.status === "queued") {
      const cancelled = this.patchItem(itemId, { status: "cancelled" });
      if (cancelled) {
        this.emit("itemCancelled", { item: cancelled });
      }
      this.checkDrained();
    }
  }

  /** Requeue a failed or cancelled item and resume the pump. */
  retryItem(itemId: string): void {
    const item = this.getItem(itemId);
    if (!item || (item.status !== "failed" && item.status !== "cancelled")) {
      return;
    }

    this.patchItem(itemId, { status: "queued", progress: 0, errorMessage: undefined });
    this.start();
  }

  /** Drop a settled item from the queue. In-flight items must be cancelled first. */
  removeItem(itemId: string): void {
    const item = this.getItem(itemId);
    if (!item || item.status === "uploading") {
      return;
    }

    this.files.delete(itemId);
    this.setItems(this.state.items.filter(entry => entry.id !== itemId));
    this.emit("itemRemoved", { itemId });
  }

  /** Drop every settled (succeeded / cancelled) item; failed stay for retry. */
  clearCompleted(): void {
    const remaining = this.state.items.filter(
      item => item.status !== "succeeded" && item.status !== "cancelled",
    );
    if (remaining.length === this.state.items.length) {
      return;
    }

    for (const item of this.state.items) {
      if (item.status === "succeeded" || item.status === "cancelled") {
        this.files.delete(item.id);
      }
    }
    this.setItems(remaining);
  }

  destroy(): void {
    for (const abortController of this.abortControllers.values()) {
      abortController.abort();
    }
    this.abortControllers.clear();
    this.lifetime?.abort();
    this.folderIds.clear();
    super.destroy();
  }

  private getItem(itemId: string): UploadQueueItem | undefined {
    return this.state.items.find(item => item.id === itemId);
  }

  private setItems(items: UploadQueueItem[]): void {
    this.setState({
      items,
      uploading: items.some(item => item.status === "uploading"),
    });
    this.emit("queueChanged", { items });
  }

  private patchItem(itemId: string, patch: Partial<UploadQueueItem>): UploadQueueItem | undefined {
    let patched: UploadQueueItem | undefined;
    const items = this.state.items.map(item => {
      if (item.id !== itemId) {
        return item;
      }
      patched = { ...item, ...patch };
      return patched;
    });
    if (patched) {
      this.setItems(items);
    }
    return patched;
  }

  private pump(): void {
    while (
      summarizeUploadQueue(this.state.items).uploading < this.concurrency &&
      this.state.items.some(item => item.status === "queued")
    ) {
      const next = this.state.items.find(item => item.status === "queued");
      if (!next) {
        return;
      }
      void this.uploadItem(next.id);
    }
  }

  private async uploadItem(itemId: string): Promise<void> {
    const file = this.files.get(itemId);
    const item = this.getItem(itemId);
    if (!file || !item || item.status !== "queued") {
      return;
    }

    const abortController = typeof AbortController === "function" ? new AbortController() : null;
    if (abortController) {
      this.abortControllers.set(itemId, abortController);
    }

    const started = this.patchItem(itemId, { status: "uploading", progress: 0 });
    if (started) {
      this.emit("itemStarted", { item: started });
    }

    try {
      // Resolved per upload rather than at enqueue time, so a folder is only
      // created when a file in it actually starts — a queue cancelled before it
      // ran leaves no empty folders behind.
      const folderId = await this.resolveFolderId(item.path ?? "");
      // Cancelling during folder creation cannot abort the shared request, so
      // the cancellation is honoured here instead, before any bytes move.
      if (abortController?.signal.aborted) {
        // A plain Error, not a DOMException: the latter is not `instanceof
        // Error` in a browser, so the abort check below would miss it and the
        // item would report itself failed rather than cancelled.
        const aborted = new Error("AbortError");
        aborted.name = "AbortError";
        throw aborted;
      }

      const result = await this.config.transport.uploadFile({
        file,
        fileName: item.name,
        folderId,
        token: this.config.token,
        language: this.config.language,
        ...(abortController ? { signal: abortController.signal } : {}),
        onProgress: fraction => {
          const clamped = Math.max(0, Math.min(1, fraction));
          const progressed = this.patchItem(itemId, { progress: clamped });
          if (progressed) {
            this.emit("itemProgress", { item: progressed });
          }
        },
      });

      const succeeded = this.patchItem(itemId, {
        status: "succeeded",
        progress: 1,
        fileId: result.fileId,
      });
      if (succeeded) {
        this.emit("itemSucceeded", { item: succeeded });
      }
    } catch (error) {
      if (abortController?.signal.aborted || isAbortError(error)) {
        const cancelled = this.patchItem(itemId, { status: "cancelled" });
        if (cancelled) {
          this.emit("itemCancelled", { item: cancelled });
        }
      } else {
        const message = error instanceof Error ? error.message : "Upload failed";
        const failed = this.patchItem(itemId, { status: "failed", errorMessage: message });
        if (failed) {
          this.emit("itemFailed", { item: failed });
        }
      }
    } finally {
      this.abortControllers.delete(itemId);
      this.pump();
      this.checkDrained();
    }
  }

  private checkDrained(): void {
    const summary = summarizeUploadQueue(this.state.items);
    if (summary.total > 0 && summary.queued === 0 && summary.uploading === 0) {
      this.emit("queueDrained", {
        succeeded: summary.succeeded,
        failed: summary.failed,
        cancelled: summary.cancelled,
      });
    }
  }
}
