const DEFAULT_TAG_NAME = "box-sidebar-toggle-button";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/**
 * A disclosure control that expands and collapses a companion `box-nav-sidebar`.
 * It owns only its own `expanded` state and announces changes with a `toggle`
 * event (`detail.expanded`); a host wires that to the sidebar's `collapsed`
 * property. `controls` reflects to `aria-controls` so assistive tech can tie the
 * button to the region it operates.
 */
export class BoxSidebarToggleButtonElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["controls", "disabled", "expanded", "label"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

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

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    // Re-rendering replaces the <button>, so a keyboard user who just toggled
    // would lose focus to document.body. Remember focus and restore it after.
    const hadFocus = this.shadowRoot.activeElement !== null;
    const expanded = this.expanded;

    this.shadowRoot.innerHTML = `
      <style>
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

        [part="button"]:hover:not(:disabled) {
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          color: var(--boe-token-text-text, #222222);
        }

        [part="button"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
        }

        [part="button"]:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* Rotate the chevron to point the way the next activation will move. */
        [part="button"][data-expanded="false"] svg {
          transform: scaleX(-1);
        }
      </style>
      <button
        type="button"
        part="button"
        data-expanded="${expanded ? "true" : "false"}"
        aria-expanded="${expanded ? "true" : "false"}"
        aria-label="${escapeHtml(this.label)}"
        ${this.controls ? `aria-controls="${escapeHtml(this.controls)}"` : ""}
        ${this.disabled ? "disabled" : ""}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          <path d="M2.5 4h11M2.5 8h11M2.5 12h7" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
    `;

    const button = this.shadowRoot.querySelector('[part="button"]') as HTMLButtonElement | null;
    // A native <button> turns Enter/Space into a click, so one listener covers
    // pointer and keyboard activation.
    button?.addEventListener("click", () => this.toggle());

    if (hadFocus && !this.disabled) {
      button?.focus();
    }
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
