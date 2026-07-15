import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-section";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const TITLE_ID = "box-section-title";

const sectionStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="section"] {
    display: grid;
    gap: 0.85rem;
  }

  [part="header"] {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.85rem;
  }

  [part="header-main"] {
    display: grid;
    gap: 0.25rem;
  }

  [part="eyebrow"] {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="title"] {
    margin: 0;
    font: inherit;
    font-size: 1.15rem;
    font-weight: 700;
    line-height: 1.25;
    color: var(--boe-token-text-text, #222222);
  }

  [part="description"] {
    margin: 0;
    font-size: 0.9rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="actions"] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  [part="body"] {
    min-inline-size: 0;
  }
`;

/**
 * A titled content region: an optional eyebrow, a heading, an optional
 * description, an `actions` slot for header controls, and a default slot for
 * content. The `<section>` is labelled by its heading via `aria-labelledby` so
 * it is announced as a named region. Layout-only — it owns no behavior.
 */
export class BoxSectionElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["description", "eyebrow", "heading"];
  }

  private headerMainEl!: HTMLElement;

  get heading(): string {
    return this.getAttribute("heading") ?? "Section";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get eyebrow(): string {
    return this.getAttribute("eyebrow") ?? "";
  }

  set eyebrow(value: string) {
    this.setAttribute("eyebrow", value);
  }

  get description(): string {
    return this.getAttribute("description") ?? "";
  }

  set description(value: string) {
    this.setAttribute("description", value);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${sectionStyles}</style>
      <section part="section" aria-labelledby="${TITLE_ID}">
        <header part="header">
          <div part="header-main"></div>
          <div part="actions">
            <slot name="actions"></slot>
          </div>
        </header>
        <div part="body">
          <slot></slot>
        </div>
      </section>
    `;
    this.headerMainEl = this.shadowRoot.querySelector('[part="header-main"]')!;
  }

  protected update(): void {
    if (!this.headerMainEl) {
      return;
    }

    const heading = this.heading;
    const eyebrow = this.eyebrow;
    const description = this.description;
    const eyebrowMarkup = eyebrow ? `<span part="eyebrow">${escapeHtml(eyebrow)}</span>` : "";
    const descriptionMarkup = description
      ? `<p part="description">${escapeHtml(description)}</p>`
      : "";

    this.headerMainEl.innerHTML = `
      ${eyebrowMarkup}
      <h2 part="title heading" id="${TITLE_ID}">${escapeHtml(heading)}</h2>
      ${descriptionMarkup}
    `;
  }
}

export const defineBoxSectionElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSectionElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSectionElement;
  }

  customElements.define(tagName, BoxSectionElement);
  return BoxSectionElement;
};
