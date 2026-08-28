import { BaseElement } from "../../core/index.js";
import {
  type UploadEntry,
  captureDropEntries,
  collectEntries,
  entriesFromFileList,
} from "../../foundations/files/index.js";
import {
  boeFocusRingShadow,
  boeFocusVisibleStyles,
} from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-drop-zone";

const dropZoneStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="zone"] {
    position: relative;
    display: grid;
    gap: 0.55rem;
    justify-items: start;
    padding: 0.75rem;
    border: 1.5px dashed color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, var(--boe-token-stroke-stroke, #e8e8e8) 84%);
    border-radius: ${boeRadius.large};
    background: var(--boe-token-surface-surface-secondary, #fbfbfb);
    cursor: pointer;
    transition:
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      background ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="zone"]:hover {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part="zone"]:active {
    background: color-mix(in srgb, var(--boe-token-surface-surface-hover, #f4f4f4) 70%, var(--boe-token-surface-surface-secondary, #fbfbfb) 30%);
  }

  [part="zone"]:focus-within {
    outline: none;
    box-shadow: ${boeFocusRingShadow};
  }

  [part="zone"][data-dragging="true"] {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
    background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
    box-shadow:
      inset 0 0 0 1px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent),
      0 14px 28px rgba(15, 23, 42, 0.05);
  }

  [part="input"] {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    opacity: 0;
    pointer-events: none;
  }

  ${boeFocusVisibleStyles('[part="input"]')}

  [part="label"] {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.25;
  }

  [part~="description"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    line-height: 1.5;
    max-width: 34ch;
  }
`;

export class DropZone extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["description", "directories", "label", "message"];
  }

  private dragging = false;
  private zoneEl!: HTMLLabelElement;
  private inputEl!: HTMLInputElement;
  private labelEl!: HTMLElement;
  private messageEl!: HTMLElement;

  get label(): string {
    return this.getAttribute("label") ?? "Upload files";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? this.description ?? "Drag files here or click to browse.";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get description(): string {
    return this.getAttribute("description") ?? this.getAttribute("message") ?? "";
  }

  set description(value: string) {
    this.setAttribute("description", value);
  }

  /**
   * Make the browse dialog pick a folder rather than files.
   *
   * Drag-and-drop reads folders regardless — a dropped directory is always
   * traversed. This only governs the click-to-browse path, where the platform
   * makes it either/or: an input is a file picker or a folder picker, never
   * both.
   */
  get directories(): boolean {
    return this.hasAttribute("directories");
  }

  set directories(value: boolean) {
    this.toggleAttribute("directories", value);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${dropZoneStyles}</style>
      <label part="zone">
        <input type="file" part="input" multiple />
        <strong part="label"></strong>
        <span part="description message"></span>
      </label>
    `;
    this.zoneEl = this.shadowRoot.querySelector('[part="zone"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.messageEl = this.shadowRoot.querySelector('[part~="description"]')!;
  }

  protected setupListeners(): void {
    this.zoneEl.addEventListener("dragenter", event => {
      event.preventDefault();
      this.dragging = true;
      this.update();
    });
    this.zoneEl.addEventListener("dragover", event => {
      event.preventDefault();
    });
    this.zoneEl.addEventListener("dragleave", event => {
      event.preventDefault();
      if (event.target === this.zoneEl) {
        this.dragging = false;
        this.update();
      }
    });
    this.zoneEl.addEventListener("drop", event => {
      event.preventDefault();
      this.dragging = false;
      this.update();

      // Captured synchronously: the DataTransferItemList is emptied the moment
      // this handler returns, so awaiting anything before reading it loses the
      // drop entirely. Traversal happens afterwards, off the captured entries.
      const captured = captureDropEntries(event.dataTransfer);
      void collectEntries(captured).then(entries => {
        this.emitSelection(entries);
      });
    });
    this.inputEl.addEventListener("change", () => {
      // `webkitdirectory` reports the tree through each file's
      // webkitRelativePath rather than through entries.
      this.emitSelection(entriesFromFileList(Array.from(this.inputEl.files ?? [])));
    });
  }

  /**
   * Report a selection.
   *
   * `files` stays a flat list so existing hosts keep working unchanged;
   * `entries` adds the directory each file came from, which is the only way a
   * host can recreate a dropped folder. Nothing is dispatched for an empty
   * selection — a drag that lands on the zone carrying no files is not an
   * upload of nothing.
   */
  private emitSelection(entries: UploadEntry[]): void {
    if (!entries.length) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("files-selected", {
        bubbles: true,
        composed: true,
        detail: { entries, files: entries.map(entry => entry.file) },
      }),
    );
  }

  protected update(): void {
    if (!this.zoneEl) {
      return;
    }

    this.zoneEl.dataset.dragging = String(this.dragging);
    this.labelEl.textContent = this.label;
    this.messageEl.textContent = this.message;
    // webkitdirectory turns the browse dialog into a folder picker. It is a
    // property as well as an attribute, and only the property is honoured
    // reliably once the input exists.
    const directories = this.directories;
    this.inputEl.toggleAttribute("webkitdirectory", directories);
    (this.inputEl as HTMLInputElement & { webkitdirectory: boolean }).webkitdirectory = directories;
  }
}

DropZone.register();
