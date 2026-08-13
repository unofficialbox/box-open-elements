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
   * Validate and enqueue files. Rejected files emit `itemRejected` and never
   * enter the queue. Returns the accepted queue items.
   */
  addFiles(files: UploadFileLike[]): UploadQueueItem[] {
    const added: UploadQueueItem[] = [];

    for (const file of files) {
      const rejection = resolveUploadRejection(file, this.config);
      if (rejection) {
        this.emit("itemRejected", { file, reason: rejection });
        continue;
      }

      this.counter += 1;
      const item: UploadQueueItem = {
        id: `upload-${this.counter}`,
        name: file.name,
        size: file.size,
        status: "queued",
        progress: 0,
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
      const result = await this.config.transport.uploadFile({
        file,
        fileName: item.name,
        folderId: this.config.folderId,
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
