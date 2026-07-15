import { BaseElement } from "../../core/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-sidebar-toggle-button";

const sidebarToggleButtonStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="button"] {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 2.1rem;
    block-size: 2.1rem;
    padding: 0;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: 0.6rem;
    background: var(--boe-token-surface-surface, #ffffff);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    cursor: pointer;
    transition: background 140ms ease, border-color 140ms ease, color 140ms ease;
  }

  [part="button"] svg {
    inline-size: 1.1rem;
    block-size: 1.1rem;
  }

  ${boeNeutralInteractiveStyles('[part="button"]')}

  [part="button"]:hover:not(:disabled) {
    color: var(--boe-token-text-text, #222222);
  }

  /* Rotate the chevron to point the way the next activation will move. */
  [part="button"][data-expanded="false"] svg {
    transform: scaleX(-1);
  }
`;

/**
 * A disclosure control that expands and collapses a companion `box-nav-sidebar`.
 * It owns only its own `expanded` state and announces changes with a `toggle`
 * event (`detail.expanded`); a host wires that to the sidebar's `collapsed`
 * property. `controls` reflects to `aria-controls` so assistive tech can tie the
 * button to the region it operates.
 */
export class BoxSidebarToggleButtonElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["controls", "disabled", "expanded", "label"];
  }

  private buttonEl!: HTMLButtonElement;

  get expanded(): boolean {
    // Default to expanded: a sidebar renders open until the user collapses it.
    return !this.hasAttribute("expanded") || this.getAttribute("expanded") !== "false";
  }

  set expanded(value: boolean) {
    this.setAttribute("expanded", value ? "true" : "false");
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.toggleAttribute("disabled", value);
  }

  get label(): string {
    return this.getAttribute("label") ?? "Toggle sidebar";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get controls(): string {
    return this.getAttribute("controls") ?? "";
  }

  set controls(value: string) {
    this.setAttribute("controls", value);
  }

  /** Flip the expanded state and announce it, unless disabled. */
  toggle(): void {
    if (this.disabled) {
      return;
    }
    this.expanded = !this.expanded;
    this.dispatchEvent(
      new CustomEvent("toggle", {
        bubbles: true,
        composed: true,
        detail: { expanded: this.expanded },
      }),
    );
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${sidebarToggleButtonStyles}</style>
      <button type="button" part="button">
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M2.5 4h11M2.5 8h11M2.5 12h7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    `;
    this.buttonEl = this.shadowRoot.querySelector('[part="button"]')!;
  }

  protected setupListeners(): void {
    // A native <button> turns Enter/Space into a click, so one listener covers
    // pointer and keyboard activation.
    this.buttonEl.addEventListener("click", () => this.toggle());
  }

  protected update(): void {
    if (!this.buttonEl) {
      return;
    }

    const expanded = this.expanded;
    this.buttonEl.dataset.expanded = expanded ? "true" : "false";
    this.buttonEl.setAttribute("aria-expanded", expanded ? "true" : "false");
    this.buttonEl.setAttribute("aria-label", this.label);

    if (this.controls) {
      this.buttonEl.setAttribute("aria-controls", this.controls);
    } else {
      this.buttonEl.removeAttribute("aria-controls");
    }

    this.buttonEl.disabled = this.disabled;
  }
}

export const defineBoxSidebarToggleButtonElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSidebarToggleButtonElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSidebarToggleButtonElement;
  }

  customElements.define(tagName, BoxSidebarToggleButtonElement);
  return BoxSidebarToggleButtonElement;
};
