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

  /* Without this, the host's own display:block beats the UA rule for [hidden]
     and the element stays visible when a host hides it. */
  :host([hidden]) {
    display: none;
  }

  [part="zone"] {
    position: relative;
    display: grid;
    gap: 0.55rem;
    justify-items: start;
    padding: 0.75rem;
    text-align: start;
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

  /* The inputs are never the focusable control — the browse buttons are — so
     they are taken out of the tab order rather than merely hidden. */
  [part~="file-input"] {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    opacity: 0;
    pointer-events: none;
  }

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

  [part="actions"] {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25rem 0.5rem;
  }

  [part~="browse"] {
    appearance: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    font-weight: 600;
    color: var(--boe-token-surface-surface-brand, #0061d5);
    text-decoration: none;
    cursor: pointer;
    border-radius: ${boeRadius.control};
  }

  [part~="browse"]:hover {
    text-decoration: underline;
  }

  ${boeFocusVisibleStyles('[part~="browse"]')}

  [part="separator"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  /* Hero: the full-height empty state, centred, with room for an illustration.
     Matches the shape box-ui-elements gives its uploader. */
  :host([variant="hero"]) [part="zone"] {
    justify-items: center;
    align-content: center;
    gap: 0.35rem;
    min-block-size: 18rem;
    padding: 2rem 1.5rem;
    text-align: center;
  }

  :host([variant="hero"]) [part="label"] {
    font-size: 1.0625rem;
  }

  :host([variant="hero"]) [part~="description"] {
    max-width: 42ch;
  }

  [part="illustration"] {
    display: none;
  }

  :host([variant="hero"]) [part="illustration"] {
    display: block;
    /* The art carries its own padding inside the viewBox, so the box is set a
       little larger than the 130px box-ui-elements uses for the drawn area. */
    inline-size: min(10.5rem, 70%);
    margin-block-end: 0.15rem;
  }

  ::slotted([slot="illustration"]) {
    display: block;
    inline-size: 100%;
    block-size: auto;
  }
`;

export class DropZone extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return [
      "accept",
      "browse-label",
      "description",
      "directories",
      "folder-label",
      "label",
      "message",
      "variant",
    ];
  }

  private dragging = false;
  private zoneEl!: HTMLLabelElement;
  private inputEl!: HTMLInputElement;
  private folderInputEl!: HTMLInputElement;
  private labelEl!: HTMLElement;
  private messageEl!: HTMLElement;
  private browseEl!: HTMLButtonElement;
  private folderBrowseEl!: HTMLButtonElement;
  private separatorEl!: HTMLElement;
  private illustrationEl!: HTMLElement;

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
   * Offer folder selection from the browse controls as well as files.
   *
   * A single `<input>` is either a file picker or a folder picker, never both —
   * so this adds a *second* control backed by its own `webkitdirectory` input
   * rather than converting the first, which is how box-ui-elements does it and
   * means a person is never made to choose between the two.
   *
   * Drag-and-drop reads folders regardless; a dropped directory is always
   * traversed whatever this is set to.
   */
  get directories(): boolean {
    return this.hasAttribute("directories");
  }

  set directories(value: boolean) {
    this.toggleAttribute("directories", value);
  }

  /** Text of the file-browse control. */
  get browseLabel(): string {
    return this.getAttribute("browse-label") ?? "Browse your device";
  }

  set browseLabel(value: string) {
    this.setAttribute("browse-label", value);
  }

  /** Text of the folder-browse control, shown only when `directories` is set. */
  get folderLabel(): string {
    return this.getAttribute("folder-label") ?? "Select folders";
  }

  set folderLabel(value: string) {
    this.setAttribute("folder-label", value);
  }

  /**
   * `"compact"` (default) keeps the small inline target; `"hero"` is the tall
   * centred empty state, with room for an illustration in the `illustration`
   * slot.
   */
  get variant(): string {
    return this.getAttribute("variant") === "hero" ? "hero" : "compact";
  }

  set variant(value: string) {
    this.setAttribute("variant", value);
  }

  /**
   * What the browse dialog offers, in the `<input accept>` syntax —
   * `".pdf,.docx"` or `"image/*"`.
   *
   * A hint, never a guarantee: it greys out other files in the picker, but a
   * person can still choose "All files", and it has no effect at all on a drop.
   * Whatever accepts the selection afterwards stays the real check.
   */
  get accept(): string {
    return this.getAttribute("accept") ?? "";
  }

  set accept(value: string) {
    if (value) {
      this.setAttribute("accept", value);
      return;
    }

    this.removeAttribute("accept");
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    // A div rather than a label wrapping the input: the browse controls are
    // real buttons, and a button inside a label is both ambiguous to assistive
    // technology and prone to firing the picker twice.
    this.shadowRoot.innerHTML = `
      <style>${dropZoneStyles}</style>
      <div part="zone">
        <input type="file" part="input file-input" multiple tabindex="-1" aria-hidden="true" />
        <input type="file" part="folder-input file-input" multiple tabindex="-1" aria-hidden="true" webkitdirectory />
        <span part="illustration"><slot name="illustration"></slot></span>
        <strong part="label"></strong>
        <span part="description message"></span>
        <span part="actions">
          <button type="button" part="browse browse-files"></button>
          <span part="separator" hidden>or</span>
          <button type="button" part="browse browse-folders" hidden></button>
        </span>
      </div>
    `;
    this.zoneEl = this.shadowRoot.querySelector('[part="zone"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part~="input"]')!;
    this.folderInputEl = this.shadowRoot.querySelector('[part~="folder-input"]')!;
    this.browseEl = this.shadowRoot.querySelector('[part~="browse-files"]')!;
    this.folderBrowseEl = this.shadowRoot.querySelector('[part~="browse-folders"]')!;
    this.separatorEl = this.shadowRoot.querySelector('[part="separator"]')!;
    this.illustrationEl = this.shadowRoot.querySelector('[part="illustration"]')!;
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
      const skipped: string[] = [];
      void collectEntries(captured, name => skipped.push(name)).then(entries => {
        this.emitSelection(entries, skipped);
      });
    });
    // Clicking the body of the zone still opens the file picker, as it did when
    // the zone was a label. Clicks that land on a button are left alone, or the
    // picker would be asked to open twice.
    this.zoneEl.addEventListener("click", event => {
      if ((event.target as HTMLElement).closest('[part~="browse"]')) {
        return;
      }
      this.inputEl.click();
    });

    this.browseEl.addEventListener("click", () => {
      this.inputEl.click();
    });
    this.folderBrowseEl.addEventListener("click", () => {
      this.folderInputEl.click();
    });

    for (const input of [this.inputEl, this.folderInputEl]) {
      input.addEventListener("change", () => {
        // A folder picked through `webkitdirectory` reports its tree through
        // each file's webkitRelativePath rather than through entries.
        this.emitSelection(entriesFromFileList(Array.from(input.files ?? [])));
        // Cleared so choosing the same folder twice in a row still fires.
        input.value = "";
      });
    }
  }

  /**
   * Report a selection.
   *
   * `files` stays a flat list so existing hosts keep working unchanged;
   * `entries` adds the directory each file came from, which is the only way a
   * host can recreate a dropped folder. `skipped` names anything the browser
   * refused to read, so a lost file is reported rather than simply absent.
   *
   * Nothing is dispatched when there is nothing to say — a drag that lands on
   * the zone carrying no files is not an upload of nothing. A drop where
   * everything was skipped still reports, because that is a failure, not
   * silence.
   */
  private emitSelection(entries: UploadEntry[], skipped: string[] = []): void {
    if (!entries.length && !skipped.length) {
      return;
    }

    this.dispatchEvent(
      new CustomEvent("files-selected", {
        bubbles: true,
        composed: true,
        detail: { entries, files: entries.map(entry => entry.file), skipped },
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
    // Hidden rather than left empty, so it does not open a gap in the stack.
    this.messageEl.hidden = this.message.trim() === "";
    this.browseEl.textContent = this.browseLabel;
    this.folderBrowseEl.textContent = this.folderLabel;

    // The folder control is a second input rather than a mode on the first, so
    // files and folders are both reachable instead of mutually exclusive.
    const directories = this.directories;
    this.folderBrowseEl.hidden = !directories;
    this.separatorEl.hidden = !directories;
    // webkitdirectory is a property as well as an attribute, and only the
    // property is honoured reliably once the input exists.
    (this.folderInputEl as HTMLInputElement & { webkitdirectory: boolean }).webkitdirectory = true;
    // A folder picker offers folders, so an extension filter would only mislead.
    this.inputEl.accept = this.accept;

    this.illustrationEl.hidden = this.variant !== "hero";
  }
}

DropZone.register();
