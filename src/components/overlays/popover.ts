import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-popover";

const popoverStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="container"] {
    position: relative;
    display: inline-grid;
    justify-items: start;
    gap: 0.5rem;
  }

  [part="trigger"] {
    appearance: none;
    min-height: 2rem;
    padding: 0.4rem 0.78rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 86%, var(--boe-token-surface-surface, #ffffff) 14%);
    border-radius: 0.85rem;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, var(--boe-token-surface-surface-secondary, #fbfbfb) 8%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 20%, var(--boe-token-surface-surface, #ffffff) 80%) 100%
      );
    color: var(--boe-token-text-text, #1f1e1b);
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.74),
      0 10px 22px rgba(15, 23, 42, 0.04);
    transition:
      border-color 140ms ease,
      background 140ms ease,
      box-shadow 140ms ease;
  }

  [part="trigger"]:hover {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-item-surface-hover, #eef4fb) 48%, var(--boe-token-surface-surface, #ffffff) 52%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 84%, var(--boe-token-surface-item-surface-hover, #eef4fb) 16%) 100%
      );
  }

  [part="trigger"]:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
    outline-offset: 2px;
  }

  [part="surface"] {
    width: min(21rem, calc(100vw - 5rem));
    padding: 0.95rem 1rem 1rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 86%, var(--boe-token-surface-surface, #ffffff) 14%);
    border-radius: 1.1rem;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 82%, var(--boe-token-surface-surface-secondary, #fbfbfb) 18%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%, var(--boe-token-surface-surface, #ffffff) 88%) 100%
      );
    color: var(--boe-token-text-text, #1f1e1b);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      0 18px 38px rgba(15, 23, 42, 0.12);
    line-height: 1.5;
  }

  [part="surface"][hidden] {
    display: none;
  }
`;

export class BoxPopoverElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label", "open"];
  }

  private openValue = false;
  private documentListenersBound = false;
  private triggerEl!: HTMLButtonElement;
  private surfaceEl!: HTMLElement;

  private readonly onDocumentKeydown = (event: KeyboardEvent): void => {
    if (!this.openValue || event.key !== "Escape") {
      return;
    }
    event.preventDefault();
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    const originatedInside = path.some(node => node === this);
    this.hide();
    if (originatedInside) {
      this.triggerEl?.focus();
    }
  };

  private readonly onOutsidePointer = (event: Event): void => {
    if (!this.openValue) {
      return;
    }
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    if (!path.some(node => node === this)) {
      this.hide();
    }
  };

  get open(): boolean {
    return this.openValue;
  }

  set open(value: boolean) {
    const nextOpen = Boolean(value);
    if (this.openValue === nextOpen) {
      return;
    }

    this.openValue = nextOpen;

    if (nextOpen) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }

    this.syncDocumentListeners();
    this.dispatchEvent(new CustomEvent("open-changed", { bubbles: true, composed: true, detail: { open: nextOpen } }));
    if (this.isRendered) {
      this.update();
    }
  }

  get label(): string {
    return this.getAttribute("label") ?? "Details";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.syncDocumentListeners();
  }

  disconnectedCallback(): void {
    this.unbindDocumentListeners();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "open") {
      this.openValue = this.hasAttribute("open");
      this.syncDocumentListeners();
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  show(): void {
    this.open = true;
  }

  hide(): void {
    this.open = false;
  }

  toggle(): void {
    if (this.openValue) {
      this.hide();
    } else {
      this.show();
    }
  }

  private bindDocumentListeners(): void {
    if (this.documentListenersBound) {
      return;
    }
    document.addEventListener("keydown", this.onDocumentKeydown);
    document.addEventListener("pointerdown", this.onOutsidePointer);
    this.documentListenersBound = true;
  }

  private unbindDocumentListeners(): void {
    if (!this.documentListenersBound) {
      return;
    }
    document.removeEventListener("keydown", this.onDocumentKeydown);
    document.removeEventListener("pointerdown", this.onOutsidePointer);
    this.documentListenersBound = false;
  }

  private syncDocumentListeners(): void {
    if (this.openValue && this.isConnected) {
      this.bindDocumentListeners();
    } else {
      this.unbindDocumentListeners();
    }
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${popoverStyles}</style>
      <div part="container">
        <button type="button" part="trigger" id="boe-popover-trigger" aria-haspopup="dialog" aria-controls="boe-popover-surface"></button>
        <div part="surface" role="dialog" id="boe-popover-surface" aria-labelledby="boe-popover-trigger" hidden>
          <slot></slot>
        </div>
      </div>
    `;
    this.triggerEl = this.shadowRoot.querySelector('[part="trigger"]')!;
    this.surfaceEl = this.shadowRoot.querySelector('[part="surface"]')!;
  }

  protected setupListeners(): void {
    this.triggerEl.addEventListener("click", () => {
      this.toggle();
    });
    this.triggerEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        this.hide();
      }
    });
  }

  protected update(): void {
    if (!this.triggerEl || !this.surfaceEl) {
      return;
    }

    this.triggerEl.textContent = this.label;
    this.triggerEl.setAttribute("aria-expanded", this.openValue ? "true" : "false");
    this.surfaceEl.hidden = !this.openValue;
    this.syncDocumentListeners();
  }
}

export const defineBoxPopoverElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxPopoverElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxPopoverElement;
  }

  customElements.define(tagName, BoxPopoverElement);
  return BoxPopoverElement;
};
