import { ContentUploaderController } from "./controller.js";
import { summarizeUploadQueue } from "./types.js";
import type {
  UploadFileLike,
  UploadItemStatus,
  UploadQueueItem,
  UploadTransport,
  UploaderEvents,
  UploaderSessionConfig,
  UploaderState,
} from "./types.js";
import { formatItemSize } from "../content-explorer/adapters/item-summary.js";
import { DropZone } from "../../components/files/drop-zone.js";
import { ProgressBar } from "../../components/feedback/progress-bar.js";
import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-content-uploader";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const readPositiveNumber = (value: string | null): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

const readTokenList = (value: string | null): string[] =>
  value
    ? value
        .split(",")
        .map(entry => entry.trim())
        .filter(Boolean)
    : [];

const STATUS_LABELS: Record<UploadItemStatus, string> = {
  queued: "Queued",
  uploading: "Uploading",
  succeeded: "Uploaded",
  failed: "Failed",
  cancelled: "Cancelled",
};

/** Actions rendered for a row, by status. */
const rowActions = (status: UploadItemStatus): Array<{ action: string; label: string }> => {
  switch (status) {
    case "queued":
    case "uploading":
      return [{ action: "cancel", label: "Cancel" }];
    case "failed":
    case "cancelled":
      return [
        { action: "retry", label: "Retry" },
        { action: "remove", label: "Remove" },
      ];
    case "succeeded":
      return [{ action: "remove", label: "Remove" }];
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
};


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="panel"] {
          display: grid;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: var(--boe-token-surface-surface, #ffffff);
        }

        [part="queue"] {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.45rem;
        }

        [part="queue"]:empty {
          display: none;
        }

        [part="row"] {
          display: grid;
          gap: 0.35rem;
          padding: 0.55rem 0.6rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 52%, transparent);
          border-radius: ${boeRadius.large};
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 82%, transparent);
          transition: border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="row"][data-status="failed"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 40%, transparent);
        }

        [part="row-header"] {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        [part="row-name"] {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 600;
        }

        [part="row-size"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.8rem;
        }

        [part="row-status"] {
          display: inline-flex;
          padding: 0.18rem 0.5rem;
          border-radius: 999px;
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.75rem;
          font-weight: 600;
        }

        [part="row"][data-status="succeeded"] [part="row-status"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26a27b) 14%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26a27b) 78%, black 22%);
        }

        [part="row"][data-status="failed"] [part="row-status"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 12%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 74%, black 26%);
        }

        [part="row-error"] {
          margin: 0;
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 74%, black 26%);
          font-size: 0.8rem;
        }

        [part="row-actions"] {
          display: flex;
          gap: 0.4rem;
        }

        [part="row-action"] {
          appearance: none;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.3rem 0.65rem;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 60%, transparent);
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="row-action"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
        }

        [part="row-action"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="footer"] {
          display: flex;
          align-items: center;
          gap: ${boePanel.gap};
        }

        [part="footer"][hidden] {
          display: none;
        }

        [part="summary"] {
          flex: 1;
          font-size: 0.85rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="clear-completed"] {
          appearance: none;
          font: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.4rem 0.7rem;
          border-radius: ${boeRadius.control};
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          cursor: pointer;
        }

        [part="clear-completed"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
        }

        [part="clear-completed"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }
      `;

export class ContentUploader extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return [
      "auto-start",
      "concurrency",
      "drop-label",
      "drop-message",
      "extensions",
      "folder-id",
      "language",
      "max-file-size",
      "token",
    ];
  }

  private controller: ContentUploaderController | null = null;

  private pendingStart = false;

  private unsubscribeFns: Array<() => void> = [];

  private transportValue: UploadTransport | null = null;

  private dropZoneEl!: DropZone;

  private queueEl!: HTMLElement;

  private footerEl!: HTMLElement;

  private summaryEl!: HTMLElement;

  private queueSignature = "";

  get folderId(): string | null {
    return this.getAttribute("folder-id");
  }

  set folderId(value: string | null) {
    this.updateStringAttribute("folder-id", value);
  }

  get token(): string | null {
    return this.getAttribute("token");
  }

  set token(value: string | null) {
    this.updateStringAttribute("token", value);
  }

  get language(): string | null {
    return this.getAttribute("language");
  }

  set language(value: string | null) {
    this.updateStringAttribute("language", value);
  }

  get concurrency(): number | undefined {
    return readPositiveNumber(this.getAttribute("concurrency"));
  }

  set concurrency(value: number | undefined) {
    if (typeof value === "number" && value > 0) {
      this.setAttribute("concurrency", String(value));
      return;
    }

    this.removeAttribute("concurrency");
  }

  /** Uploads start as files are added unless `auto-start="false"`. */
  get autoStart(): boolean {
    return this.getAttribute("auto-start") !== "false";
  }

  set autoStart(value: boolean) {
    if (value) {
      this.removeAttribute("auto-start");
      return;
    }

    this.setAttribute("auto-start", "false");
  }

  /** Comma-separated in markup, e.g. `extensions="pdf,docx"`. */
  get extensions(): string[] {
    return readTokenList(this.getAttribute("extensions"));
  }

  set extensions(value: string[]) {
    if (value.length) {
      this.setAttribute("extensions", value.join(","));
      return;
    }

    this.removeAttribute("extensions");
  }

  /** Maximum accepted file size in bytes. */
  get maxFileSize(): number | undefined {
    return readPositiveNumber(this.getAttribute("max-file-size"));
  }

  set maxFileSize(value: number | undefined) {
    if (typeof value === "number" && value > 0) {
      this.setAttribute("max-file-size", String(value));
      return;
    }

    this.removeAttribute("max-file-size");
  }

  get dropLabel(): string {
    return this.getAttribute("drop-label") ?? "Upload files";
  }

  set dropLabel(value: string) {
    this.setAttribute("drop-label", value);
  }

  get dropMessage(): string {
    return this.getAttribute("drop-message") ?? "Drag files here or click to browse.";
  }

  set dropMessage(value: string) {
    this.setAttribute("drop-message", value);
  }

  get transport(): UploadTransport | null {
    return this.transportValue;
  }

  set transport(value: UploadTransport | null) {
    this.transportValue = value;
    this.scheduleStart();
  }

  get state(): Readonly<UploaderState> | null {
    return this.controller?.getState() ?? null;
  }

  /** The live queue controller. Null until configured. */
  get uploaderController(): ContentUploaderController | null {
    return this.controller;
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    // Drop-zone copy is presentation-only; everything else re-creates the queue.
    if (name !== "drop-label" && name !== "drop-message") {
      this.scheduleStart();
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.scheduleStart();
  }

  disconnectedCallback(): void {
    this.teardownController();
  }

  addFiles(files: UploadFileLike[]): UploadQueueItem[] {
    return this.controller?.addFiles(files) ?? [];
  }

  start(): void {
    this.controller?.start();
  }

  cancelItem(itemId: string): void {
    this.controller?.cancelItem(itemId);
  }

  retryItem(itemId: string): void {
    this.controller?.retryItem(itemId);
  }

  removeItem(itemId: string): void {
    this.controller?.removeItem(itemId);
  }

  clearCompleted(): void {
    this.controller?.clearCompleted();
  }

  private updateStringAttribute(name: string, value: string | null): void {
    if (value === null || value === "") {
      this.removeAttribute(name);
      return;
    }

    this.setAttribute(name, value);
  }

  private scheduleStart(): void {
    if (this.pendingStart) {
      return;
    }

    this.pendingStart = true;
    queueMicrotask(() => {
      this.pendingStart = false;
      this.startController();
    });
  }

  private startController(): void {
    if (!this.isConnected) {
      return;
    }

    const config = this.readConfig();
    if (!config) {
      this.teardownController();
      if (this.isRendered) {
        this.update();
      }
      return;
    }

    this.teardownController();
    const controller = new ContentUploaderController(config);
    this.controller = controller;
    this.subscribeToController(controller);
    if (this.isRendered) {
      this.update();
    }
  }

  private readConfig(): UploaderSessionConfig | null {
    if (!this.transportValue || !this.folderId || !this.token) {
      return null;
    }

    return {
      autoStart: this.autoStart,
      concurrency: this.concurrency,
      extensions: this.extensions.length ? this.extensions : undefined,
      folderId: this.folderId,
      language: this.language ?? undefined,
      maxFileSizeBytes: this.maxFileSize,
      token: this.token,
      transport: this.transportValue,
    };
  }

  private subscribeToController(controller: ContentUploaderController): void {
    const events: Array<[keyof UploaderEvents, string]> = [
      ["itemAdded", "item-added"],
      ["itemRejected", "item-rejected"],
      ["itemStarted", "item-started"],
      ["itemProgress", "item-progress"],
      ["itemSucceeded", "item-succeeded"],
      ["itemFailed", "item-failed"],
      ["itemCancelled", "item-cancelled"],
      ["itemRemoved", "item-removed"],
      ["queueChanged", "queue-changed"],
      ["queueDrained", "queue-drained"],
    ];

    this.unsubscribeFns = events.map(([eventName, domEventName]) =>
      controller.subscribe(eventName, payload => {
        this.dispatchEvent(
          new CustomEvent(domEventName, {
            bubbles: true,
            composed: true,
            detail: payload,
          }),
        );
        if (this.isRendered) {
          this.update();
        }
      }),
    );
  }

  private teardownController(): void {
    for (const unsubscribe of this.unsubscribeFns) {
      unsubscribe();
    }
    this.unsubscribeFns = [];

    this.controller?.destroy();
    this.controller = null;
    this.queueSignature = "";
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <div part="panel">
        <box-drop-zone part="drop-zone"></box-drop-zone>
        <ul part="queue" aria-label="Upload queue"></ul>
        <footer part="footer" hidden>
          <span part="summary" role="status" aria-live="polite"></span>
          <button type="button" part="clear-completed">Clear completed</button>
        </footer>
      </div>
    `;
    this.dropZoneEl = this.shadowRoot.querySelector('[part="drop-zone"]') as DropZone;
    this.queueEl = this.shadowRoot.querySelector('[part="queue"]')!;
    this.footerEl = this.shadowRoot.querySelector('[part="footer"]')!;
    this.summaryEl = this.shadowRoot.querySelector('[part="summary"]')!;
  }

  protected setupListeners(): void {
    this.dropZoneEl.addEventListener("files-selected", event => {
      const files = (event as CustomEvent<{ files?: UploadFileLike[] }>).detail?.files ?? [];
      if (files.length) {
        this.addFiles(files);
      }
    });

    this.queueEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part="row-action"]') as HTMLButtonElement | null;
      if (!button || !this.queueEl.contains(button)) {
        return;
      }

      const itemId = button.getAttribute("data-item-id");
      const action = button.getAttribute("data-action");
      if (!itemId || !action) {
        return;
      }

      if (action === "cancel") {
        this.cancelItem(itemId);
      } else if (action === "retry") {
        this.retryItem(itemId);
      } else if (action === "remove") {
        this.removeItem(itemId);
      }
    });

    this.footerEl.querySelector('[part="clear-completed"]')?.addEventListener("click", () => {
      this.clearCompleted();
    });
  }

  private rebuildQueue(items: readonly UploadQueueItem[]): void {
    this.queueEl.innerHTML = items
      .map(item => {
        const actions = rowActions(item.status)
          .map(
            ({ action, label }) => `
              <button
                type="button"
                part="row-action"
                data-action="${action}"
                data-item-id="${escapeHtml(item.id)}"
                aria-label="${label} ${escapeHtml(item.name)}"
              >${label}</button>
            `,
          )
          .join("");

        return `
          <li part="row" data-item-id="${escapeHtml(item.id)}" data-status="${item.status}">
            <div part="row-header">
              <span part="row-name">${escapeHtml(item.name)}</span>
              <span part="row-size">${escapeHtml(formatItemSize(item.size))}</span>
              <span part="row-status">${STATUS_LABELS[item.status]}</span>
            </div>
            <box-progress-bar
              part="row-progress"
              label="${escapeHtml(`${item.name} upload progress`)}"
              max="100"
              value="${String(Math.round(item.progress * 100))}"
            ></box-progress-bar>
            ${item.errorMessage ? `<p part="row-error">${escapeHtml(item.errorMessage)}</p>` : ""}
            <div part="row-actions">${actions}</div>
          </li>
        `;
      })
      .join("");
  }

  private patchQueueProgress(items: readonly UploadQueueItem[]): void {
    for (const item of items) {
      const row = Array.from(this.queueEl.children).find(
        child => (child as HTMLElement).dataset.itemId === item.id,
      );
      const bar = row?.querySelector('[part="row-progress"]') as ProgressBar | null;
      if (bar) {
        bar.value = Math.round(item.progress * 100);
      }
    }
  }

  protected update(): void {
    if (!this.queueEl) {
      return;
    }

    this.dropZoneEl.label = this.dropLabel;
    this.dropZoneEl.message = this.dropMessage;

    const items = this.controller?.getState().items ?? [];

    // Structural changes rebuild the rows; progress ticks patch the bars in
    // place so in-row focus (Cancel while uploading) survives.
    const signature = JSON.stringify(
      items.map(item => [item.id, item.status, item.errorMessage ?? null]),
    );
    if (signature !== this.queueSignature) {
      this.queueSignature = signature;
      this.rebuildQueue(items);
    }
    this.patchQueueProgress(items);

    const summary = summarizeUploadQueue(items);
    this.footerEl.hidden = summary.total === 0;
    const active = summary.queued + summary.uploading;
    this.summaryEl.textContent =
      active > 0
        ? `Uploading ${String(summary.uploading)} · ${String(summary.queued)} queued`
        : `${String(summary.succeeded)} of ${String(summary.total)} uploaded${summary.failed ? ` · ${String(summary.failed)} failed` : ""}`;
  }
}

DropZone.register();
ProgressBar.register();
ContentUploader.register();
