import { BaseElement } from "../../core/index.js";
import { boeBrandInteractiveStyles } from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-empty-state";

const emptyStateStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="empty-state"] {
    display: grid;
    justify-items: center;
    gap: 0.55rem;
    padding: 1.1rem 1rem;
    border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: 0.75rem;
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, var(--boe-token-surface-surface, #ffffff) 6%);
    text-align: center;
  }

  [part="title"] {
          margin: 0;
          font: inherit;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--boe-token-text-text, #222222);
  }

  [part~="message"] {
    max-width: 32rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    line-height: 1.5;
  }

  [part="action"] {
    appearance: none;
    margin-top: 0.4rem;
    border: 1px solid transparent;
    border-radius: 999px;
    background: var(--boe-token-surface-surface-brand, #0061d5);
    color: var(--boe-token-text-text-on-brand, #ffffff);
    font: inherit;
    font-weight: 600;
    padding: 0.5rem 0.9rem;
    cursor: pointer;
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, transform ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  ${boeBrandInteractiveStyles('[part="action"]')}

  [part="action"][hidden] {
    display: none;
  }
`;

export class BoxEmptyStateElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["action-label", "description", "heading", "message"];
  }

  private titleEl!: HTMLElement;
  private messageEl!: HTMLElement;
  private actionEl!: HTMLButtonElement;

  get heading(): string {
    return this.getAttribute("heading") ?? "Nothing here yet";
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

  get actionLabel(): string {
    return this.getAttribute("action-label") ?? "";
  }

  set actionLabel(value: string) {
    this.setAttribute("action-label", value);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${emptyStateStyles}</style>
      <section part="empty-state" role="status" aria-live="polite">
        <h2 part="title"></h2>
        <span part="message description"></span>
        <button type="button" part="action" hidden></button>
      </section>
    `;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.messageEl = this.shadowRoot.querySelector('[part~="message"]')!;
    this.actionEl = this.shadowRoot.querySelector('[part="action"]')!;
  }

  protected setupListeners(): void {
    this.actionEl.addEventListener("click", () => {
      this.dispatchEvent(
        new CustomEvent("action", {
          bubbles: true,
          composed: true,
          detail: { action: "primary", label: this.actionLabel },
        }),
      );
    });
  }

  protected update(): void {
    if (!this.titleEl) {
      return;
    }

    this.titleEl.textContent = this.heading;
    this.messageEl.textContent = this.message;

    if (this.actionLabel) {
      this.actionEl.hidden = false;
      this.actionEl.textContent = this.actionLabel;
    } else {
      this.actionEl.hidden = true;
      this.actionEl.textContent = "";
    }
  }
}

export const defineBoxEmptyStateElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxEmptyStateElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxEmptyStateElement;
  }

  customElements.define(tagName, BoxEmptyStateElement);
  return BoxEmptyStateElement;
};
