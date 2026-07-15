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
    container-type: inline-size;
    container-name: boe-app-shell;
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

  [part="nav"][hidden],
  [part="aside"][hidden],
  [part="footer"][hidden] {
    display: none;
  }

  [part="frame"]:not(:has([part="nav"]:not([hidden]))):not(:has([part="aside"]:not([hidden]))) {
    grid-template-columns: 1fr;
  }

  [part="frame"]:has([part="nav"]:not([hidden])):not(:has([part="aside"]:not([hidden]))) {
    grid-template-columns: minmax(11rem, auto) 1fr;
  }

  [part="frame"]:not(:has([part="nav"]:not([hidden]))):has([part="aside"]:not([hidden])) {
    grid-template-columns: 1fr minmax(11rem, auto);
  }

  [part="footer"] {
    padding: 0.75rem 1.15rem;
    border-top: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 68%, transparent);
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, var(--boe-token-surface-surface, #ffffff) 6%);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-size: 0.86rem;
  }

  /* Narrow shells stack nav → main → aside instead of a three-column frame. */
  @container boe-app-shell (max-width: 48rem) {
    [part="frame"] {
      grid-template-columns: 1fr;
    }

    [part="frame"]:has([part="nav"]:not([hidden])):not(:has([part="aside"]:not([hidden]))),
    [part="frame"]:not(:has([part="nav"]:not([hidden]))):has([part="aside"]:not([hidden])),
    [part="frame"]:has([part="nav"]:not([hidden])):has([part="aside"]:not([hidden])) {
      grid-template-columns: 1fr;
    }

    [part="nav"] {
      border-right: 0;
      border-bottom: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 68%, transparent);
    }

    [part="aside"] {
      border-left: 0;
      border-top: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 68%, transparent);
    }
  }
`;

export class BoxAppShellElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["heading", "nav-label", "aside-label"];
  }

  private shellEl!: HTMLElement;
  private titleEl!: HTMLElement;
  private navEl!: HTMLElement;
  private asideEl!: HTMLElement;
  private footerEl!: HTMLElement;
  private navSlot!: HTMLSlotElement;
  private asideSlot!: HTMLSlotElement;
  private footerSlot!: HTMLSlotElement;
  private slotObserver: MutationObserver | null = null;

  get heading(): string {
    return this.getAttribute("heading") ?? "App Shell";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get navLabel(): string {
    return this.getAttribute("nav-label") ?? "Primary";
  }

  set navLabel(value: string) {
    this.setAttribute("nav-label", value);
  }

  get asideLabel(): string {
    return this.getAttribute("aside-label") ?? "Context";
  }

  set asideLabel(value: string) {
    this.setAttribute("aside-label", value);
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
    this.navEl = this.shadowRoot.querySelector('[part="nav"]')!;
    this.asideEl = this.shadowRoot.querySelector('[part="aside"]')!;
    this.footerEl = this.shadowRoot.querySelector('[part="footer"]')!;
    this.navSlot = this.shadowRoot.querySelector('slot[name="nav"]')!;
    this.asideSlot = this.shadowRoot.querySelector('slot[name="aside"]')!;
    this.footerSlot = this.shadowRoot.querySelector('slot[name="footer"]')!;
  }

  protected setupListeners(): void {
    this.navSlot.addEventListener("slotchange", () => this.syncLandmarkVisibility());
    this.asideSlot.addEventListener("slotchange", () => this.syncLandmarkVisibility());
    this.footerSlot.addEventListener("slotchange", () => this.syncLandmarkVisibility());
    // Cover hosts (incl. jsdom) that do not emit slotchange for light-DOM appends.
    this.slotObserver = new MutationObserver(() => this.syncLandmarkVisibility());
    this.slotObserver.observe(this, {
      childList: true,
    });
  }

  disconnectedCallback(): void {
    this.slotObserver?.disconnect();
    this.slotObserver = null;
  }

  private hasNamedSlotContent(name: string, slot: HTMLSlotElement): boolean {
    // Prefer direct light-DOM children — jsdom often leaves slot.assignedNodes() empty
    // even when slotted children are present.
    if (Array.from(this.children).some(el => el.getAttribute("slot") === name)) {
      return true;
    }
    return slot.assignedNodes({ flatten: true }).length > 0;
  }

  private syncLandmarkVisibility(): void {
    if (!this.navEl || !this.asideEl || !this.footerEl) {
      return;
    }
    this.navEl.hidden = !this.hasNamedSlotContent("nav", this.navSlot);
    this.asideEl.hidden = !this.hasNamedSlotContent("aside", this.asideSlot);
    this.footerEl.hidden = !this.hasNamedSlotContent("footer", this.footerSlot);
  }

  protected update(): void {
    if (!this.shellEl || !this.titleEl || !this.navEl || !this.asideEl) {
      return;
    }

    const heading = this.heading;
    this.shellEl.setAttribute("aria-label", heading);
    this.titleEl.textContent = heading;
    this.navEl.setAttribute("aria-label", this.navLabel);
    this.asideEl.setAttribute("aria-label", this.asideLabel);
    this.syncLandmarkVisibility();
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
