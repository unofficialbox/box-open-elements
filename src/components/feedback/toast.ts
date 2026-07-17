import { BaseElement } from "../../core/index.js";
import { boeRadius, boeSpace } from "../../foundations/geometry/index.js";
import { boeFocusVisibleStyles } from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-toast";

const toastStyles = `
  :host {
    display: block;
    inline-size: fit-content;
    max-inline-size: 100%;
    color: inherit;
    font: inherit;
    font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
  }

  :host([hidden]) {
    display: none;
  }

  [part="toast"] {
    display: inline-flex;
    align-items: center;
    gap: ${boeSpace[3]};
    min-height: 48px;
    max-inline-size: min(100%, 572px);
    padding: 10px 10px 10px 20px;
    border: 2px solid var(--boe-token-text-text, #222222);
    border-radius: ${boeRadius.large};
    background: var(--boe-token-surface-surface-secondary, #f4f4f4);
    color: var(--boe-token-text-text, #222222);
    box-shadow: 0 2px 6px rgb(0 0 0 / 15%);
  }

  [part="toast"][data-tone="success"] {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 20%, #fff);
    border-color: var(--boe-token-surface-status-surface-success, #26c281);
  }

  [part="toast"][data-tone="error"] {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 20%, #fff);
    border-color: var(--boe-token-surface-status-surface-error, #ed3757);
  }

  [part="toast"][data-tone="warning"],
  [part="toast"][data-tone="inprogress"] {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 20%, #fff);
    border-color: var(--boe-token-surface-status-surface-inprogress, #f5b31b);
  }

  [part="message"] {
    flex: 1 1 auto;
    min-inline-size: 0;
    padding-inline-end: ${boeSpace[3]};
    font-size: 15px;
    font-weight: 700;
    line-height: 1.35;
  }

  [part="dismiss"] {
    appearance: none;
    flex: 0 0 auto;
    border: 1px solid var(--boe-token-text-text, #222222);
    border-radius: ${boeRadius.med};
    background: transparent;
    color: var(--boe-token-text-text, #222222);
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    padding: 7px 13px;
    cursor: pointer;
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="dismiss"]:hover:not(:disabled) {
    background: rgb(0 0 0 / 6%);
  }

  [part="dismiss"]:active:not(:disabled) {
    background: rgb(0 0 0 / 10%);
  }

  ${boeFocusVisibleStyles('[part="dismiss"]')}

  [part="dismiss"]:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    box-shadow: none;
  }
`;

export class BoxToastElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["message", "open", "tone"];
  }

  private openValue = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private toastEl!: HTMLElement;
  private messageEl!: HTMLElement;
  private dismissEl!: HTMLButtonElement;

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

    this.dispatchEvent(new CustomEvent("open-changed", { bubbles: true, composed: true, detail: { open: nextOpen } }));
    if (this.isRendered) {
      this.update();
    }
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "info";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  disconnectedCallback(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "open") {
      this.openValue = this.hasAttribute("open");
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  show(message?: string, options?: { duration?: number; tone?: string }): void {
    if (typeof message === "string") {
      this.message = message;
    }
    if (options?.tone) {
      this.tone = options.tone;
    }

    this.open = true;

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    const duration = options?.duration ?? 2500;
    if (duration > 0) {
      this.timeoutId = setTimeout(() => {
        this.hide();
      }, duration);
    }
  }

  hide(): void {
    this.open = false;
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${toastStyles}</style>
      <div part="toast" role="status" aria-live="polite">
        <span part="message"></span>
        <button type="button" part="dismiss">Dismiss</button>
      </div>
    `;
    this.toastEl = this.shadowRoot.querySelector('[part="toast"]')!;
    this.messageEl = this.shadowRoot.querySelector('[part="message"]')!;
    this.dismissEl = this.shadowRoot.querySelector('[part="dismiss"]')!;
  }

  protected setupListeners(): void {
    this.dismissEl.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("dismiss", { bubbles: true, composed: true }));
      this.hide();
    });
  }

  protected update(): void {
    if (!this.toastEl) {
      return;
    }

    const visible = this.openValue && Boolean(this.message);
    this.hidden = !visible;
    if (!visible) {
      return;
    }

    this.toastEl.dataset.tone = this.tone;
    this.messageEl.textContent = this.message;
  }
}

export const defineBoxToastElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxToastElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxToastElement;
  }

  customElements.define(tagName, BoxToastElement);
  return BoxToastElement;
};
