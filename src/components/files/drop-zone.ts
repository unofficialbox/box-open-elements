import { BaseElement } from "../../core/index.js";
import {
  boeFocusRingShadow,
  boeFocusVisibleStyles,
} from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-drop-zone";

const dropZoneStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
    font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
  }

  [part="zone"] {
    position: relative;
    display: grid;
    gap: 0.55rem;
    justify-items: start;
    padding: 0.75rem;
    border: 1.5px dashed color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, var(--boe-token-stroke-stroke, #e8e8e8) 84%);
    border-radius: 0.75rem;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 86%, var(--boe-token-surface-surface, #ffffff) 14%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 4%, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #fbfbfb) 8%) 100%
      );
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
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 76%, var(--boe-token-surface-surface, #ffffff) 24%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-surface-item-surface-selected, #f2f7fd) 72%, var(--boe-token-surface-surface, #ffffff) 18%) 100%
      );
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

export class BoxDropZoneElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["description", "label", "message"];
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
      const files = Array.from(event.dataTransfer?.files ?? []);
      this.dispatchEvent(
        new CustomEvent("files-selected", {
          bubbles: true,
          composed: true,
          detail: { files },
        }),
      );
      this.update();
    });
    this.inputEl.addEventListener("change", () => {
      const files = Array.from(this.inputEl.files ?? []);
      this.dispatchEvent(
        new CustomEvent("files-selected", {
          bubbles: true,
          composed: true,
          detail: { files },
        }),
      );
    });
  }

  protected update(): void {
    if (!this.zoneEl) {
      return;
    }

    this.zoneEl.dataset.dragging = String(this.dragging);
    this.labelEl.textContent = this.label;
    this.messageEl.textContent = this.message;
  }
}

export const defineBoxDropZoneElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxDropZoneElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxDropZoneElement;
  }

  customElements.define(tagName, BoxDropZoneElement);
  return BoxDropZoneElement;
};
