import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-nav-sidebar";

const navSidebarStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
    /* Consumers hide label spans with: [data-nav-label] { display: var(--boe-nav-label-display, inline); } */
    --boe-nav-label-display: inline;
  }

  :host([collapsed]) {
    --boe-nav-label-display: none;
  }

  [part="sidebar"] {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    block-size: 100%;
    inline-size: 14rem;
    padding: 0.65rem 0.6rem;
    box-sizing: border-box;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: 0.7rem;
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, var(--boe-token-surface-surface, #ffffff) 6%);
    color: var(--boe-token-text-text, #222222);
    overflow: hidden;
    transition: inline-size ${boeMotionDuration.medium} ${boeMotionEasing.standard};
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

  /* Icon-strip contract: slotted anchors/buttons lay out as nav rows. Pair with
     [data-nav-icon] / [data-nav-label] in light DOM (see docs example). */
  [part="body"] ::slotted(a),
  [part="body"] ::slotted(button) {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    min-block-size: 1.9rem;
    padding: 0.3rem 0.45rem;
    border-radius: 0.5rem;
    color: inherit;
    text-decoration: none;
    font: inherit;
    box-sizing: border-box;
  }

  [part="body"] ::slotted(button) {
    appearance: none;
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: start;
    width: 100%;
  }

  [part="body"] ::slotted(a:hover),
  [part="body"] ::slotted(button:hover) {
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface, #ffffff) 92%);
  }

  [part="sidebar"][data-collapsed="true"] ::slotted(a),
  [part="sidebar"][data-collapsed="true"] ::slotted(button) {
    justify-content: center;
    padding-inline: 0.25rem;
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
 *
 * Collapsed icon contract: slot `a`/`button` rows with an icon and a
 * `[data-nav-label]` span. Host exposes `--boe-nav-label-display` (`none` when
 * collapsed) so light-DOM CSS can hide labels without piercing the shadow tree.
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
