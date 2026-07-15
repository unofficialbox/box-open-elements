import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-nav-sidebar";

const navSidebarStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="sidebar"] {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    block-size: 100%;
    inline-size: 15rem;
    padding: 0.9rem 0.8rem;
    box-sizing: border-box;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: 0.95rem;
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, var(--boe-token-surface-surface, #ffffff) 6%);
    color: var(--boe-token-text-text, #222222);
    overflow: hidden;
    transition: inline-size 160ms ease;
  }

  /* Collapsed: shrink to an icon strip. The header and footer usually hold
     branding and labels, so they hide; the body (icon nav) stays. */
  [part="sidebar"][data-collapsed="true"] {
    inline-size: 3.75rem;
    padding-inline: 0.55rem;
  }

  [part="header"],
  [part="footer"] {
    display: block;
    min-block-size: 0;
  }

  [part="sidebar"][data-collapsed="true"] [part="header"],
  [part="sidebar"][data-collapsed="true"] [part="footer"] {
    display: none;
  }

  [part="body"] {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    flex: 1 1 auto;
    min-block-size: 0;
    overflow-y: auto;
  }

  [part="footer"] {
    padding-block-start: 0.75rem;
    border-top: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 68%, transparent);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-size: 0.86rem;
  }
`;

/**
 * A collapsible navigation rail for the explorer/workspace shell. It owns no
 * transport and no routing: it is structure (a labelled `<nav>` with header,
 * body, and footer slots) plus a reflected `collapsed` state that narrows the
 * rail to its icon strip. Pair it with `box-sidebar-toggle-button`, wiring the
 * button's `toggle` event to this element's `collapsed` property.
 */
export class BoxNavSidebarElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["collapsed", "label"];
  }

  private sidebarEl!: HTMLElement;

  get collapsed(): boolean {
    return this.hasAttribute("collapsed");
  }

  set collapsed(value: boolean) {
    this.toggleAttribute("collapsed", value);
  }

  get label(): string {
    return this.getAttribute("label") ?? "Sidebar";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${navSidebarStyles}</style>
      <nav part="sidebar">
        <div part="header">
          <slot name="header"></slot>
        </div>
        <div part="body">
          <slot></slot>
        </div>
        <div part="footer">
          <slot name="footer"></slot>
        </div>
      </nav>
    `;
    this.sidebarEl = this.shadowRoot.querySelector('[part="sidebar"]')!;
  }

  protected update(): void {
    if (!this.sidebarEl) {
      return;
    }

    this.sidebarEl.dataset.collapsed = this.collapsed ? "true" : "false";
    this.sidebarEl.setAttribute("aria-label", this.label);
  }
}

export const defineBoxNavSidebarElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxNavSidebarElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxNavSidebarElement;
  }

  customElements.define(tagName, BoxNavSidebarElement);
  return BoxNavSidebarElement;
};
