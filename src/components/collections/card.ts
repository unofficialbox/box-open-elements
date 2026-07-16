import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-card";

const cardStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="card"] {
    display: grid;
    gap: 0.55rem;
    padding: 0.7rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, var(--boe-token-surface-surface, #ffffff) 18%);
    border-radius: 0.75rem;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, var(--boe-token-surface-surface, #ffffff) 12%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 86%, var(--boe-token-surface-surface-secondary, #fbfbfb) 14%) 100%
      );
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.82),
      0 14px 28px rgba(15, 23, 42, 0.04);
  }

  [part="header"] {
    display: grid;
    gap: 0.35rem;
  }

  [part="eyebrow"] {
    color: var(--boe-token-surface-surface-brand, #0061d5);
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  [part~="title"] {
    margin: 0;
    font: inherit;
    font-size: 1.04rem;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.02em;
  }

  [part="body"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    line-height: 1.55;
  }

  [part="eyebrow"][hidden],
  [part~="title"][hidden] {
    display: none;
  }
`;

export class BoxCardElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["eyebrow", "heading"];
  }

  private eyebrowEl!: HTMLElement;
  private titleEl!: HTMLElement;

  get eyebrow(): string {
    return this.getAttribute("eyebrow") ?? "";
  }

  set eyebrow(value: string) {
    this.setAttribute("eyebrow", value);
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${cardStyles}</style>
      <article part="card">
        <header part="header">
          <span part="eyebrow" hidden></span>
          <h2 part="title heading" hidden></h2>
        </header>
        <div part="body">
          <slot></slot>
        </div>
      </article>
    `;
    this.eyebrowEl = this.shadowRoot.querySelector('[part="eyebrow"]')!;
    this.titleEl = this.shadowRoot.querySelector('[part~="title"]')!;
  }

  protected update(): void {
    if (!this.eyebrowEl || !this.titleEl) {
      return;
    }

    const eyebrow = this.eyebrow;
    const heading = this.heading;

    this.eyebrowEl.textContent = eyebrow;
    this.eyebrowEl.hidden = !eyebrow;

    this.titleEl.textContent = heading;
    this.titleEl.hidden = !heading;
  }
}

export const defineBoxCardElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxCardElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxCardElement;
  }

  customElements.define(tagName, BoxCardElement);
  return BoxCardElement;
};
