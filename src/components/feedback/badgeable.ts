import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-badgeable";

/** Corners a badge can be pinned to, matching box-ui-elements' Badgeable. */
const CORNERS = ["top-left", "top-right", "bottom-left", "bottom-right"] as const;
type Corner = (typeof CORNERS)[number];

const badgeableStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="container"] {
    position: relative;
    display: inline-flex;
  }

  [part="badge"] {
    position: absolute;
    z-index: 1;
    display: inline-flex;
    pointer-events: none;
  }

  /* Slotted badge content stays interactive (e.g. a dismiss button). */
  [part="badge"] ::slotted(*) {
    pointer-events: auto;
  }

  [part="badge"][hidden] {
    display: none;
  }

  [part="badge"][data-corner="top-left"] { inset-block-start: 0; inset-inline-start: 0; transform: translate(-35%, -35%); }
  [part="badge"][data-corner="top-right"] { inset-block-start: 0; inset-inline-end: 0; transform: translate(35%, -35%); }
  [part="badge"][data-corner="bottom-left"] { inset-block-end: 0; inset-inline-start: 0; transform: translate(-35%, 35%); }
  [part="badge"][data-corner="bottom-right"] { inset-block-end: 0; inset-inline-end: 0; transform: translate(35%, 35%); }
`;

/**
 * Overlays badges on the corners of its content — the box-ui-elements
 * `Badgeable` wrapper. The subject goes in the default slot; each corner is a
 * named slot (`top-left`, `top-right`, `bottom-left`, `bottom-right`). Corners
 * with no assigned content are hidden so they don't capture pointer events.
 */
export class BoxBadgeableElement extends BaseElement {
  private corners = new Map<Corner, { wrapper: HTMLElement; slot: HTMLSlotElement }>();

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${badgeableStyles}</style>
      <span part="container">
        <slot></slot>
        ${CORNERS.map(
          corner =>
            `<span part="badge" data-corner="${corner}" hidden><slot name="${corner}"></slot></span>`,
        ).join("")}
      </span>
    `;

    this.corners.clear();
    for (const corner of CORNERS) {
      const wrapper = this.shadowRoot.querySelector<HTMLElement>(`[data-corner="${corner}"]`)!;
      const slot = wrapper.querySelector("slot")!;
      this.corners.set(corner, { wrapper, slot });
    }
  }

  protected setupListeners(): void {
    for (const { wrapper, slot } of this.corners.values()) {
      slot.addEventListener("slotchange", () => {
        wrapper.hidden = slot.assignedNodes({ flatten: true }).length === 0;
      });
    }
  }

  protected update(): void {
    for (const { wrapper, slot } of this.corners.values()) {
      wrapper.hidden = slot.assignedNodes({ flatten: true }).length === 0;
    }
  }
}

export const defineBoxBadgeableElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxBadgeableElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxBadgeableElement;
  }

  customElements.define(tagName, BoxBadgeableElement);
  return BoxBadgeableElement;
};
