import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";
import {
  boeFocusVisibleStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-nudge";

const nudgeStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="nudge"] {
    display: flex;
    align-items: flex-start;
    gap: 0.55rem;
    padding: 0.55rem 0.7rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 24%, var(--boe-token-surface-surface, #ffffff));
    border-radius: ${boeRadius.large};
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 7%, var(--boe-token-surface-surface, #ffffff));
    color: var(--boe-token-text-text, #222222);
  }

  [part="icon"] {
    flex: none;
    display: grid;
    place-items: center;
    inline-size: 1.5rem;
    block-size: 1.5rem;
    color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="icon"] svg {
    inline-size: 1.15rem;
    block-size: 1.15rem;
  }

  [part="content"] {
    display: grid;
    gap: 0.15rem;
    flex: 1 1 auto;
    line-height: 1.4;
    font-size: 0.88rem;
  }

  [part~="title"] {
    font-weight: 700;
  }

  [part~="title"][hidden] {
    display: none;
  }

  [part="message"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="message"][hidden] {
    display: none;
  }

  [part="action"] {
    appearance: none;
    justify-self: start;
    margin-top: 0.2rem;
    padding: 0;
    border: 0;
    background: none;
    color: var(--boe-token-surface-surface-brand, #0061d5);
    font: inherit;
    font-size: 0.85rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  [part="action"]:hover:not(:disabled) {
    color: var(--boe-token-surface-surface-brand-hover, #006ae9);
  }

  [part="action"]:active:not(:disabled) {
    color: var(--boe-token-surface-surface-brand-pressed, #004eaa);
  }

  ${boeFocusVisibleStyles('[part="action"]')}

  [part="action"]:disabled {
    cursor: not-allowed;
    opacity: 0.55;
    box-shadow: none;
  }

  [part="dismiss"] {
    appearance: none;
    flex: none;
    inline-size: 1.4rem;
    block-size: 1.4rem;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    cursor: pointer;
  }

  [part="dismiss"] svg {
    inline-size: 0.8rem;
    block-size: 0.8rem;
  }

  ${boeNeutralInteractiveStyles('[part="dismiss"]')}
`;

/**
 * A compact inline nudge — a lightweight hint or promotion pointing at a nearby
 * feature, smaller than `box-alert`. It carries an optional primary action
 * (emits `action`) and can be dismissed (emits `dismiss` and hides). Announced
 * politely via `role="status"`; the host decides what the action does.
 */
export class BoxNudgeElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["action-label", "heading", "message", "open"];
  }

  private openValue = true;
  private hostEl!: HTMLElement;
  private headingEl: HTMLElement | null = null;
  private messageEl: HTMLElement | null = null;
  private actionEl: HTMLButtonElement | null = null;

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
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    this.setAttribute("message", value);
  }

  get actionLabel(): string {
    return this.getAttribute("action-label") ?? "";
  }

  set actionLabel(value: string) {
    this.setAttribute("action-label", value);
  }

  connectedCallback(): void {
    // Open by default; dismiss() (via the `open` property) manages the closed state.
    this.openValue = true;
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
      <style>${nudgeStyles}</style>
      <div part="host"></div>
    `;
    this.hostEl = this.shadowRoot.querySelector('[part="host"]')!;
  }

  protected setupListeners(): void {
    this.hostEl.addEventListener("click", event => {
      const target = event.target as HTMLElement;
      if (target.closest('[part="dismiss"]')) {
        this.dismiss();
        return;
      }
      if (target.closest('[part="action"]')) {
        this.dispatchEvent(
          new CustomEvent("action", {
            bubbles: true,
            composed: true,
            detail: { label: this.actionLabel },
          }),
        );
      }
    });
  }

  private ensureOpenStructure(): void {
    if (this.hostEl.querySelector('[part="nudge"]')) {
      this.headingEl = this.hostEl.querySelector('[part~="title"]');
      this.messageEl = this.hostEl.querySelector('[part="message"]');
      this.actionEl = this.hostEl.querySelector('[part="action"]');
      return;
    }

    this.hostEl.innerHTML = `
      <div part="nudge" role="status" aria-live="polite">
        <span part="icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18h6"/>
            <path d="M10 22h4"/>
            <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1v.2h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z"/>
          </svg>
        </span>
        <div part="content">
          <h2 part="heading title" hidden></h2>
          <span part="message" hidden></span>
        </div>
        <button type="button" part="dismiss" aria-label="Dismiss">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
        </button>
      </div>
    `;
    this.headingEl = this.hostEl.querySelector('[part~="title"]');
    this.messageEl = this.hostEl.querySelector('[part="message"]');
    this.actionEl = null;
  }

  private syncActionButton(): void {
    const content = this.hostEl.querySelector('[part="content"]');
    if (!content) {
      return;
    }

    if (this.actionLabel) {
      if (!this.actionEl) {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("part", "action");
        content.append(button);
        this.actionEl = button;
      }
      this.actionEl.textContent = this.actionLabel;
    } else if (this.actionEl) {
      this.actionEl.remove();
      this.actionEl = null;
    }
  }

  protected update(): void {
    if (!this.hostEl) {
      return;
    }

    if (!this.openValue) {
      this.hostEl.innerHTML = "";
      this.headingEl = null;
      this.messageEl = null;
      this.actionEl = null;
      return;
    }

    this.ensureOpenStructure();
    if (!this.headingEl || !this.messageEl) {
      return;
    }

    if (this.heading) {
      this.headingEl.hidden = false;
      this.headingEl.textContent = this.heading;
    } else {
      this.headingEl.hidden = true;
      this.headingEl.textContent = "";
    }

    if (this.message) {
      this.messageEl.hidden = false;
      this.messageEl.textContent = this.message;
    } else {
      this.messageEl.hidden = true;
      this.messageEl.textContent = "";
    }

    this.syncActionButton();
  }
}

export const defineBoxNudgeElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxNudgeElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxNudgeElement;
  }

  customElements.define(tagName, BoxNudgeElement);
  return BoxNudgeElement;
};
