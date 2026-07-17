import { BaseElement } from "../../core/index.js";
import { boeRadius, boeSpace } from "../../foundations/geometry/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-alert";

const toneAccessibleLabel = (tone: string): string => {
  switch (tone) {
    case "success":
      return "Success";
    case "error":
      return "Error";
    case "warning":
      return "Warning";
    case "inprogress":
      return "In progress";
    case "info":
      return "Info";
    default:
      return tone.charAt(0).toUpperCase() + tone.slice(1);
  }
};

const alertStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
    font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
  }

  :host([hidden]) {
    display: none;
  }

  [part="alert"] {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: ${boeSpace[3]};
    margin: ${boeSpace[3]} 0;
    padding: 14px 10px;
    border: 1px solid var(--boe-token-text-text-secondary, #6f6f6f);
    border-radius: ${boeRadius.med};
    background: var(--boe-token-surface-surface-secondary, #f4f4f4);
    color: var(--boe-token-text-text, #222222);
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="alert"][data-tone="info"] {
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, #fff);
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 50%, #fff);
  }

  [part="alert"][data-tone="success"] {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 10%, #fff);
    border-color: var(--boe-token-surface-status-surface-success, #26c281);
  }

  [part="alert"][data-tone="error"] {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 10%, #fff);
    border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 50%, #fff);
  }

  [part="alert"][data-tone="warning"],
  [part="alert"][data-tone="inprogress"] {
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 10%, #fff);
    border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 50%, #fff);
  }

  [part="content"] {
    display: grid;
    gap: ${boeSpace[1]};
    line-height: 1.45;
  }

  [part="title"] {
    margin: 0;
    font: inherit;
    font-weight: 700;
    color: var(--boe-token-text-text, #222222);
  }

  [part="title"][hidden] {
    display: none;
  }

  [part~="description"] {
    color: var(--boe-token-text-text, #222222);
  }

  [part~="description"][hidden] {
    display: none;
  }

  .sr-only {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    clip-path: inset(50%);
    white-space: nowrap;
    border: 0;
  }

  [part="dismiss"] {
    appearance: none;
    flex: none;
    border: 0;
    border-radius: ${boeRadius.med};
    background: transparent;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font: inherit;
    font-size: 13px;
    font-weight: 700;
    padding: ${boeSpace[1]} ${boeSpace[2]};
    cursor: pointer;
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  ${boeNeutralInteractiveStyles('[part="dismiss"]')}
`;

export class BoxAlertElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["description", "heading", "message", "open", "tone"];
  }

  private openValue = true;
  private alertEl!: HTMLElement;
  private toneLabelEl!: HTMLElement;
  private titleEl!: HTMLElement;
  private messageEl!: HTMLElement;
  private dismissEl!: HTMLButtonElement;

  get open(): boolean {
    return this.openValue;
  }

  set open(value: boolean) {
    const nextValue = Boolean(value);
    if (this.openValue === nextValue) {
      return;
    }

    this.openValue = nextValue;
    if (nextValue) {
      this.setAttribute("open", "");
    } else {
      this.removeAttribute("open");
    }
    this.dispatchEvent(new CustomEvent("open-changed", { bubbles: true, composed: true, detail: { open: nextValue } }));
    if (this.isRendered) {
      this.update();
    }
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get message(): string {
    return this.getAttribute("message") ?? this.description;
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

  get tone(): string {
    return this.getAttribute("tone") ?? "info";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  connectedCallback(): void {
    this.openValue = this.hasAttribute("open") || !this.hasAttribute("open");
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "open") {
      this.openValue = this.hasAttribute("open");
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  dismiss(): void {
    if (!this.openValue) {
      return;
    }

    this.open = false;
    this.dispatchEvent(new CustomEvent("dismiss", { bubbles: true, composed: true }));
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${alertStyles}</style>
      <div part="alert" role="status" aria-live="polite">
        <div part="content">
          <span part="tone-label" class="sr-only"></span>
          <h2 part="title" id="alert-title" hidden></h2>
          <span part="description message" hidden></span>
        </div>
        <button type="button" part="dismiss" aria-label="Dismiss alert">Dismiss</button>
      </div>
    `;
    this.alertEl = this.shadowRoot.querySelector('[part="alert"]')!;
    this.toneLabelEl = this.shadowRoot.querySelector('[part="tone-label"]')!;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.messageEl = this.shadowRoot.querySelector('[part~="description"]')!;
    this.dismissEl = this.shadowRoot.querySelector('[part="dismiss"]')!;
  }

  protected setupListeners(): void {
    this.dismissEl.addEventListener("click", () => {
      this.dismiss();
    });
  }

  protected update(): void {
    if (!this.alertEl) {
      return;
    }

    const visible = this.openValue && Boolean(this.heading || this.message);
    this.hidden = !visible;
    if (!visible) {
      return;
    }

    this.alertEl.dataset.tone = this.tone;
    this.toneLabelEl.textContent = toneAccessibleLabel(this.tone);

    if (this.heading) {
      this.alertEl.setAttribute("aria-labelledby", "alert-title");
      this.alertEl.removeAttribute("aria-label");
      this.titleEl.hidden = false;
      this.titleEl.textContent = this.heading;
    } else {
      this.alertEl.removeAttribute("aria-labelledby");
      const accessibleName = this.message
        ? `${toneAccessibleLabel(this.tone)}: ${this.message}`
        : toneAccessibleLabel(this.tone);
      this.alertEl.setAttribute("aria-label", accessibleName);
      this.titleEl.hidden = true;
      this.titleEl.textContent = "";
    }

    if (this.message) {
      this.messageEl.hidden = false;
      this.messageEl.textContent = this.message;
    } else {
      this.messageEl.hidden = true;
      this.messageEl.textContent = "";
    }
  }
}

export const defineBoxAlertElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxAlertElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxAlertElement;
  }

  customElements.define(tagName, BoxAlertElement);
  return BoxAlertElement;
};
