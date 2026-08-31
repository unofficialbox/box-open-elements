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
import {
  DESIGN_SYSTEM_CHANGE_EVENT,
  resolveDesignIllustration,
} from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-content-uploader";

/** Matches the box-ui-elements ceiling, so a port behaves the same way. */
const DEFAULT_FILE_LIMIT = 100;

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

        /* The host's own display would otherwise beat the UA rule for [hidden],
           leaving the element on screen when a host hides it. */
        :host([hidden]) {
          display: none !important;
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

        /* The footer is a bar rather than a caption: Close sits apart on the
           left, the queue-level actions group on the right, as they do in
           box-ui-elements. */
        /* Wraps rather than squeezes: in a narrow column the summary would
           otherwise concertina onto three lines and the button labels break
           mid-phrase. Wrapped, the action group drops to its own row intact. */
        [part="footer"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem ${boePanel.gap};
          padding-block-start: ${boePanel.gap};
          border-block-start: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
        }

        [part="footer"][hidden] {
          display: none;
        }

        [part="summary"] {
          /* Takes the slack but never forces a wrap of its own: it is a status
             line, not a reason for the buttons to be squeezed. */
          flex: 1 1 auto;
          min-inline-size: 0;
          font-size: 0.85rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="footer-actions"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: flex-end;
          /* Keeps the group right-aligned once the footer wraps it onto its
             own row. */
          margin-inline-start: auto;
          gap: 0.5rem;
        }

        [part~="action"] {
          appearance: none;
          font: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.5rem 0.9rem;
          border-radius: ${boeRadius.control};
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          cursor: pointer;
          /* A label that breaks mid-phrase reads as two controls. */
          white-space: nowrap;
          transition:
            background ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
            border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part~="action"]:hover:not(:disabled) {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
        }

        [part~="action"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        /* Disabled, not removed: the control keeps its place so the footer does
           not reflow as the queue changes, and stays discoverable. */
        [part~="action"]:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        [part~="action-primary"] {
          border-color: transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-color, #ffffff);
        }

        [part~="action-primary"]:hover:not(:disabled) {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 86%, black 14%);
          border-color: transparent;
        }

        [part="close"][hidden] {
          display: none;
        }
      `;

export class ContentUploader extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return [
      "auto-start",
      "closable",
      "concurrency",
      "drop-label",
      "drop-message",
      "directories",
      "extensions",
      "file-limit",
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

  private updateScheduled = false;

  private closeEl!: HTMLButtonElement;

  private cancelEl!: HTMLButtonElement;

  private uploadEl!: HTMLButtonElement;

  private clearCompletedEl!: HTMLButtonElement;

  private illustrationEl!: HTMLElement;

  private illustrationSignature = "";

  private readonly handleDesignSystemChange = (): void => {
    if (this.isRendered) {
      this.renderIllustration();
    }
  };

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

  /**
   * Most files the queue will hold, default 100 — the same ceiling
   * box-ui-elements uses. Further files are rejected with
   * `file-limit-reached` rather than enqueued.
   *
   * A default matters here in a way it does not for the other constraints: a
   * dropped folder can carry thousands of files, and an unbounded queue has no
   * back pressure at all.
   */
  get fileLimit(): number {
    const raw = Number(this.getAttribute("file-limit"));
    return Number.isFinite(raw) && raw >= 1 ? Math.floor(raw) : DEFAULT_FILE_LIMIT;
  }

  set fileLimit(value: number) {
    this.setAttribute("file-limit", String(value));
  }

  /**
   * Make the browse dialog pick a folder rather than files.
   *
   * Dropping a folder works either way; the platform only forces the choice on
   * the click-to-browse path.
   */
  get directories(): boolean {
    return this.hasAttribute("directories");
  }

  set directories(value: boolean) {
    this.toggleAttribute("directories", value);
  }

  /**
   * Show the Close control. On by default, matching box-ui-elements; a host
   * that owns its own dismissal (a drawer with its own close button) sets
   * `closable="false"` rather than styling ours away.
   */
  get closable(): boolean {
    return this.getAttribute("closable") !== "false";
  }

  set closable(value: boolean) {
    if (value) {
      this.removeAttribute("closable");
      return;
    }

    this.setAttribute("closable", "false");
  }

  /**
   * Headline of the empty state. Defaults to the box-ui-elements wording, and
   * names folders too when they can be uploaded, so the invitation matches what
   * the zone will actually accept.
   */
  get dropLabel(): string {
    return (
      this.getAttribute("drop-label") ??
      (this.directories ? "Drag and drop files and folders" : "Drag and drop files")
    );
  }

  set dropLabel(value: string) {
    this.setAttribute("drop-label", value);
  }

  /**
   * Optional supporting line under the headline. Empty by default: the browse
   * controls say what to do, and a sentence repeating them is noise.
   */
  get dropMessage(): string {
    return this.getAttribute("drop-message") ?? "";
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

  /**
   * Attributes that only affect how the drop zone presents itself. Everything
   * else feeds the session config, so changing it re-creates the queue.
   */
  private static readonly PRESENTATION_ATTRIBUTES = new Set([
    "closable",
    "directories",
    "drop-label",
    "drop-message",
  ]);

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (!ContentUploader.PRESENTATION_ATTRIBUTES.has(name)) {
      this.scheduleStart();
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  connectedCallback(): void {
    globalThis.addEventListener?.(DESIGN_SYSTEM_CHANGE_EVENT, this.handleDesignSystemChange);
    super.connectedCallback();
    this.scheduleStart();
  }

  disconnectedCallback(): void {
    globalThis.removeEventListener?.(DESIGN_SYSTEM_CHANGE_EVENT, this.handleDesignSystemChange);
    this.teardownController();
  }

  addFiles(files: UploadFileLike[]): UploadQueueItem[] {
    return this.controller?.addFiles(files) ?? [];
  }

  /**
   * Queue files that carry a directory path relative to the destination, the
   * way a dropped folder does. Requires `createFolder` on the transport;
   * without it each pathed file is rejected with `folder-unsupported`.
   */
  addEntries(entries: Array<{ file: UploadFileLike; path?: string }>): UploadQueueItem[] {
    return this.controller?.addEntries(entries) ?? [];
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
      fileLimit: this.fileLimit,
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
        this.scheduleUpdate();
      }),
    );
  }

  /**
   * Coalesce the re-render for a burst of controller events.
   *
   * A folder drop adds up to `fileLimit` items in one go, each emitting its own
   * `itemAdded`; rendering per event rebuilt the whole queue once per file,
   * which is quadratic in the size of the drop. One render per microtask turn
   * gives the same result for a fraction of the work.
   */
  private scheduleUpdate(): void {
    if (!this.isRendered || this.updateScheduled) {
      return;
    }

    this.updateScheduled = true;
    queueMicrotask(() => {
      this.updateScheduled = false;
      if (this.isRendered) {
        this.update();
      }
    });
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
        <box-drop-zone part="drop-zone" variant="hero">
          <span slot="illustration" part="drop-illustration"></span>
        </box-drop-zone>
        <ul part="queue" aria-label="Upload queue"></ul>
        <footer part="footer">
          <button type="button" part="action close">Close</button>
          <span part="summary" role="status" aria-live="polite"></span>
          <span part="footer-actions">
            <button type="button" part="action clear-completed">Clear completed</button>
            <button type="button" part="action cancel">Cancel</button>
            <button type="button" part="action action-primary upload">Upload</button>
          </span>
        </footer>
      </div>
    `;
    this.dropZoneEl = this.shadowRoot.querySelector('[part="drop-zone"]') as DropZone;
    this.queueEl = this.shadowRoot.querySelector('[part="queue"]')!;
    this.footerEl = this.shadowRoot.querySelector('[part="footer"]')!;
    this.summaryEl = this.shadowRoot.querySelector('[part="summary"]')!;
    this.closeEl = this.shadowRoot.querySelector('[part~="close"]')!;
    this.cancelEl = this.shadowRoot.querySelector('[part~="cancel"]')!;
    this.uploadEl = this.shadowRoot.querySelector('[part~="upload"]')!;
    this.clearCompletedEl = this.shadowRoot.querySelector('[part~="clear-completed"]')!;
    this.illustrationEl = this.shadowRoot.querySelector('[part="drop-illustration"]')!;
  }

  /**
   * Paints the empty-state art from the active design system, so a host that
   * registers its own system gets its own illustration without touching this.
   *
   * Resolved during update rather than at template time: a host may register or
   * switch design systems after the element upgrades, and the art has to follow.
   */
  private renderIllustration(): void {
    const markup = resolveDesignIllustration("upload-cloud") ?? "";
    if (markup !== this.illustrationSignature) {
      this.illustrationSignature = markup;
      this.illustrationEl.innerHTML = markup;
    }
  }

  protected setupListeners(): void {
    this.dropZoneEl.addEventListener("files-selected", event => {
      const detail = (event as CustomEvent<{
        entries?: Array<{ file: UploadFileLike; path: string }>;
        files?: UploadFileLike[];
      }>).detail;

      // Prefer entries: they carry the folder each file came from. `files` is
      // the flat fallback for a host dispatching this event by hand.
      const entries =
        detail?.entries ?? (detail?.files ?? []).map(file => ({ file, path: "" }));
      if (entries.length) {
        this.controller?.addEntries(entries);
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

    this.clearCompletedEl.addEventListener("click", () => {
      this.clearCompleted();
    });

    this.uploadEl.addEventListener("click", () => {
      this.start();
    });

    this.cancelEl.addEventListener("click", () => {
      this.cancelAll();
    });

    // The uploader does not own the surface it sits in — a dialog, a drawer, a
    // page — so Close reports the intent and the host decides what closing
    // means. Cancellable, so a host can refuse.
    this.closeEl.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true, cancelable: true }));
    });
  }

  /** Cancel every item still queued or in flight. Settled items are untouched. */
  cancelAll(): void {
    const controller = this.controller;
    if (!controller) {
      return;
    }

    for (const item of controller.getState().items) {
      if (item.status === "queued" || item.status === "uploading") {
        controller.cancelItem(item.id);
      }
    }
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
              hide-label
              label="${escapeHtml(item.name)}"
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

    this.renderIllustration();
    this.dropZoneEl.label = this.dropLabel;
    this.dropZoneEl.message = this.dropMessage;
    this.dropZoneEl.directories = this.directories;
    // Greys out the files the queue would reject anyway, so the picker stops
    // offering a choice that ends in a rejection. The queue's own check still
    // decides — `accept` is advisory, and does nothing for a drop.
    // A leading dot is optional in `extensions`, as it is for the queue check.
    this.dropZoneEl.accept = this.extensions
      .map(extension => `.${extension.replace(/^\./, "")}`)
      .join(",");

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
    const active = summary.queued + summary.uploading;

    // The empty state and the queue are alternatives, not neighbours: the
    // illustration is the invitation, and once files are in the queue the list
    // is what a person needs to see. Dropping still works over the list.
    this.dropZoneEl.hidden = summary.total > 0;

    // The footer stays put with its controls disabled rather than appearing
    // when the first file lands — a bar that materialises under the pointer is
    // how people click the wrong thing.
    this.uploadEl.disabled = summary.queued === 0;
    this.cancelEl.disabled = active === 0;
    this.clearCompletedEl.disabled = summary.succeeded + summary.cancelled === 0;
    // Closing mid-upload would abandon transfers in flight, so Close waits.
    // box-ui-elements disables it for any non-empty queue; that would trap a
    // person on a finished queue with no way out, so it is only held while
    // something is actually running.
    this.closeEl.disabled = active > 0;
    this.closeEl.hidden = !this.closable;

    this.summaryEl.textContent =
      summary.total === 0
        ? ""
        : active > 0
          ? `Uploading ${String(summary.uploading)} · ${String(summary.queued)} queued`
          : `${String(summary.succeeded)} of ${String(summary.total)} uploaded${summary.failed ? ` · ${String(summary.failed)} failed` : ""}`;
  }
}

DropZone.register();
ProgressBar.register();
ContentUploader.register();
