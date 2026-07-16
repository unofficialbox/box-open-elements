import { BaseElement } from "../../core/index.js";
import { FocusRestore, getTabbableElements } from "../../foundations/a11y/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-popover";

export type PopoverPlacement = "bottom" | "top" | "start" | "end";

const resolvePlacement = (value: string | null): PopoverPlacement => {
  if (value === "top" || value === "start" || value === "end" || value === "bottom") {
    return value;
  }
  return "bottom";
};

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
  }

  [part="trigger"] {
    appearance: none;
    min-height: 2rem;
    padding: 0.4rem 0.7rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 86%, var(--boe-token-surface-surface, #ffffff) 14%);
    border-radius: 0.7rem;
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
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      background ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  ${boeNeutralInteractiveStyles('[part="trigger"]')}

  [part="surface"] {
    position: absolute;
    z-index: 30;
    inset-block-start: calc(100% + 0.35rem);
    inset-inline-start: 0;
    width: min(21rem, calc(100vw - 5rem));
    padding: 0.7rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 86%, var(--boe-token-surface-surface, #ffffff) 14%);
    border-radius: 0.7rem;
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

  :host([placement="top"]) [part="surface"] {
    inset-block-start: auto;
    inset-block-end: calc(100% + 0.35rem);
  }

  :host([placement="start"]) [part="surface"] {
    inset-block-start: 0;
    inset-inline-start: auto;
    inset-inline-end: calc(100% + 0.35rem);
  }

  :host([placement="end"]) [part="surface"] {
    inset-block-start: 0;
    inset-inline-start: calc(100% + 0.35rem);
  }

  [part="surface"][hidden] {
    display: none;
  }
`;

export class BoxPopoverElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "open", "placement"];
  }

  private openValue = false;
  private wasOpen = false;
  private documentListenersBound = false;
  private triggerEl!: HTMLButtonElement;
  private surfaceEl!: HTMLElement;
  private readonly focusRestore = new FocusRestore();

  private readonly onDocumentKeydown = (event: KeyboardEvent): void => {
    if (!this.openValue || event.key !== "Escape") {
      return;
    }
    event.preventDefault();
    this.hide();
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
    if (this.disabled && nextOpen) {
      return;
    }
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

  get placement(): PopoverPlacement {
    return resolvePlacement(this.getAttribute("placement"));
  }

  set placement(value: PopoverPlacement) {
    this.setAttribute("placement", value);
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    if (value) {
      this.setAttribute("disabled", "");
      if (this.openValue) {
        this.hide();
      }
    } else {
      this.removeAttribute("disabled");
    }
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
      if (this.disabled && this.hasAttribute("open")) {
        this.openValue = false;
        this.removeAttribute("open");
        this.syncDocumentListeners();
        if (this.isRendered) {
          this.update();
        }
      } else {
        this.openValue = this.hasAttribute("open");
        this.syncDocumentListeners();
      }
    }
    if (name === "disabled" && this.disabled && this.openValue) {
      this.hide();
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  show(): void {
    if (this.disabled) {
      return;
    }
    this.open = true;
  }

  hide(): void {
    this.open = false;
  }

  toggle(): void {
    if (this.disabled) {
      return;
    }
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

  private focusSurface(): void {
    const candidates: HTMLElement[] = [];
    const slot = this.surfaceEl.querySelector("slot");
    for (const node of slot?.assignedElements({ flatten: true }) ?? []) {
      if (!(node instanceof HTMLElement)) {
        continue;
      }
      candidates.push(...getTabbableElements(node));
      if (
        candidates.length === 0 &&
        !node.hasAttribute("disabled") &&
        (node.matches("button, a[href], input:not([type='hidden']), select, textarea") || node.tabIndex >= 0)
      ) {
        candidates.push(node);
      }
    }
    candidates.push(...getTabbableElements(this.surfaceEl));
    (candidates[0] ?? this.surfaceEl).focus();
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${popoverStyles}</style>
      <div part="container">
        <button type="button" part="trigger" id="boe-popover-trigger" aria-haspopup="dialog" aria-controls="boe-popover-surface"></button>
        <div part="surface" role="dialog" id="boe-popover-surface" aria-labelledby="boe-popover-trigger" tabindex="-1" hidden>
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
    this.surfaceEl.addEventListener("keydown", event => {
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
    if (this.disabled) {
      this.triggerEl.setAttribute("disabled", "");
    } else {
      this.triggerEl.removeAttribute("disabled");
    }

    const justOpened = this.openValue && !this.wasOpen;
    const justClosed = !this.openValue && this.wasOpen;
    this.surfaceEl.hidden = !this.openValue;
    this.syncDocumentListeners();

    if (justOpened) {
      this.focusRestore.capture(this.triggerEl);
      queueMicrotask(() => this.focusSurface());
    } else if (justClosed) {
      this.focusRestore.restore();
    }

    this.wasOpen = this.openValue;
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
