import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-app-shell";

const appShellStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="shell"] {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 100%;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: 0.95rem;
    background: var(--boe-token-surface-surface, #ffffff);
    color: var(--boe-token-text-text, #222222);
    overflow: hidden;
  }

  [part="header"] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.85rem;
    padding: 0.95rem 1.15rem;
    border-bottom: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 68%, transparent);
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, var(--boe-token-surface-surface, #ffffff) 6%);
  }

  [part="header-main"] {
    display: grid;
    gap: 0.2rem;
  }

  [part="header-main"] ::slotted([slot="eyebrow"]) {
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="title"] {
    margin: 0;
    font: inherit;
    font-size: 1.2rem;
    font-weight: 700;
    line-height: 1.2;
  }

  [part="header-actions"] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.55rem;
  }

  [part="frame"] {
    display: grid;
    grid-template-columns: minmax(11rem, auto) 1fr minmax(11rem, auto);
    align-items: stretch;
    min-height: 0;
  }

  [part="nav"] {
    padding: 1rem 0.95rem;
    border-right: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 68%, transparent);
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, var(--boe-token-surface-surface, #ffffff) 6%);
  }

  [part="main"] {
    min-width: 0;
    padding: 1.15rem;
    background: var(--boe-token-surface-surface, #ffffff);
  }

  [part="aside"] {
    padding: 1rem 0.95rem;
    border-left: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 68%, transparent);
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, var(--boe-token-surface-surface, #ffffff) 6%);
  }

  [part="footer"] {
    padding: 0.75rem 1.15rem;
    border-top: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 68%, transparent);
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, var(--boe-token-surface-surface, #ffffff) 6%);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-size: 0.86rem;
  }
`;

export class BoxAppShellElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["heading"];
  }

  private shellEl!: HTMLElement;
  private titleEl!: HTMLElement;

  get heading(): string {
    return this.getAttribute("heading") ?? "App Shell";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${appShellStyles}</style>
      <section part="shell">
        <header part="header">
          <div part="header-main">
            <slot name="eyebrow"></slot>
            <h2 part="title"></h2>
          </div>
          <div part="header-actions">
            <slot name="header-actions"></slot>
          </div>
        </header>
        <div part="frame">
          <nav part="nav" aria-label="Primary">
            <slot name="nav"></slot>
          </nav>
          <main part="main">
            <slot></slot>
          </main>
          <aside part="aside" aria-label="Context">
            <slot name="aside"></slot>
          </aside>
        </div>
        <footer part="footer">
          <slot name="footer"></slot>
        </footer>
      </section>
    `;
    this.shellEl = this.shadowRoot.querySelector('[part="shell"]')!;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
  }

  protected update(): void {
    if (!this.shellEl || !this.titleEl) {
      return;
    }

    const heading = this.heading;
    this.shellEl.setAttribute("aria-label", heading);
    this.titleEl.textContent = heading;
  }
}

export const defineBoxAppShellElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxAppShellElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxAppShellElement;
  }

  customElements.define(tagName, BoxAppShellElement);
  return BoxAppShellElement;
};
