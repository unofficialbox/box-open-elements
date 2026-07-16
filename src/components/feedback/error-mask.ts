import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-error-mask";

const errorMaskStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="error-mask"] {
    display: grid;
    justify-items: center;
    gap: 0.55rem;
    padding: 0.75rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke-danger, #f0b7b2) 82%, transparent);
    border-radius: 0.7rem;
    background: color-mix(in srgb, var(--boe-token-surface-surface-danger, #fdecea) 60%, var(--boe-token-surface-surface, #ffffff) 40%);
    text-align: center;
  }

  [part="icon"] {
    display: grid;
    place-items: center;
    inline-size: 2.75rem;
    block-size: 2.75rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--boe-token-surface-surface-danger, #fdecea) 55%, var(--boe-token-surface-surface, #ffffff) 45%);
    color: var(--boe-token-text-text-danger, #b3261e);
  }

  [part="icon"] svg {
    inline-size: 1.5rem;
    block-size: 1.5rem;
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

  [part~="message"][hidden] {
    display: none;
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
    padding: 0.45rem 0.75rem;
    cursor: pointer;
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, transform ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="action"]:hover {
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 88%, black 12%);
  }

  [part="action"]:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
    outline-offset: 2px;
  }

  [part="action"][hidden] {
    display: none;
  }
`;

/**
 * A full-section error state that masks a region that failed to load — distinct
 * from `box-empty-state` (a "nothing here yet" affordance). It announces
 * assertively via `role="alert"` and offers an optional retry action that emits
 * a `retry` event; the host owns the actual reload.
 */
export class BoxErrorMaskElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["action-label", "description", "heading", "message"];
  }

  private titleEl!: HTMLElement;
  private messageEl!: HTMLElement;
  private actionEl: HTMLButtonElement | null = null;

  get heading(): string {
    return this.getAttribute("heading") ?? "Something went wrong";
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
      <style>${errorMaskStyles}</style>
      <section part="error-mask" role="alert" aria-live="assertive">
        <span part="icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>
            <path d="M12 9v4"/>
            <path d="M12 17h.01"/>
          </svg>
        </span>
        <h2 part="title"></h2>
        <span part="message description" hidden></span>
      </section>
    `;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.messageEl = this.shadowRoot.querySelector('[part~="message"]')!;
  }

  private syncActionButton(): void {
    const section = this.shadowRoot?.querySelector('[part="error-mask"]');
    if (!section) {
      return;
    }

    if (this.actionLabel) {
      if (!this.actionEl) {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("part", "action");
        button.addEventListener("click", () => {
          this.dispatchEvent(
            new CustomEvent("retry", {
              bubbles: true,
              composed: true,
              detail: { label: this.actionLabel },
            }),
          );
        });
        section.append(button);
        this.actionEl = button;
      }
      this.actionEl.textContent = this.actionLabel;
    } else if (this.actionEl) {
      this.actionEl.remove();
      this.actionEl = null;
    }
  }

  protected update(): void {
    if (!this.titleEl) {
      return;
    }

    this.titleEl.textContent = this.heading;

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

export const defineBoxErrorMaskElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxErrorMaskElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxErrorMaskElement;
  }

  customElements.define(tagName, BoxErrorMaskElement);
  return BoxErrorMaskElement;
};
