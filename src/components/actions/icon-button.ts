import {
  DESIGN_SYSTEM_CHANGE_EVENT,
  resolveDesignIcon,
} from "../../foundations/tokens/registry.js";

const DEFAULT_TAG_NAME = "box-icon-button";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxIconButtonElement extends HTMLElement {
  private readonly handleDesignSystemChange = (): void => {
    this.render();
  };

  static get observedAttributes(): string[] {
    return ["disabled", "icon", "label", "tone"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    if (value) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }

  get icon(): string {
    return this.getAttribute("icon") ?? "•";
  }

  set icon(value: string) {
    this.setAttribute("icon", value);
  }

  get label(): string {
    return this.getAttribute("label") ?? "Icon button";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "secondary";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  connectedCallback(): void {
    globalThis.addEventListener?.(DESIGN_SYSTEM_CHANGE_EVENT, this.handleDesignSystemChange as EventListener);
    this.render();
  }

  disconnectedCallback(): void {
    globalThis.removeEventListener?.(DESIGN_SYSTEM_CHANGE_EVENT, this.handleDesignSystemChange as EventListener);
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const resolvedIcon = resolveDesignIcon(this.icon);
    const iconMarkup = resolvedIcon ?? escapeHtml(this.icon);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          color: inherit;
          font: inherit;
        }

        [part="button"] {
          appearance: none;
          width: 2.25rem;
          height: 2.25rem;
          display: inline-grid;
          place-items: center;
          padding: 0;
          font: inherit;
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          border-radius: 0.75rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 94%, var(--boe-token-surface-surface-secondary, #fbfbfb) 6%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%, var(--boe-token-surface-surface, #ffffff) 88%) 100%
            );
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          cursor: pointer;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.82),
            0 1px 2px rgba(15, 23, 42, 0.04);
          transition:
            background-color 140ms ease,
            border-color 140ms ease,
            color 140ms ease,
            box-shadow 140ms ease;
        }

        [part="button"]:hover:not(:disabled) {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 28%, var(--boe-token-stroke-stroke, #e8e8e8) 72%);
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface, #ffffff) 92%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="button"]:active:not(:disabled) {
          background: color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 70%, var(--boe-token-surface-surface, #ffffff) 30%);
        }

        [part="button"][data-tone="primary"] {
          border-color: transparent;
          background:
            linear-gradient(
              180deg,
              var(--boe-token-surface-surface-brand, #0061d5) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 88%, #003c86 12%) 100%
            );
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="button"][data-tone="primary"]:hover:not(:disabled) {
          background: var(--boe-token-surface-surface-brand-hover, #0057c0);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="button"][data-tone="primary"]:active:not(:disabled) {
          background: var(--boe-token-surface-surface-brand-pressed, #004eaa);
        }

        [part="button"][data-tone="danger"] {
          border-color: transparent;
          background: var(--boe-token-surface-status-surface-error, #ed3757);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="button"][data-tone="danger"]:hover:not(:disabled) {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 90%, var(--boe-token-surface-surface, #ffffff) 10%);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="button"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="button"]:disabled {
          cursor: not-allowed;
          opacity: 0.55;
          box-shadow: none;
        }

        [part="icon"] {
          display: inline-grid;
          place-items: center;
          font-size: 1rem;
          line-height: 1;
        }

        [part="icon"] svg {
          width: 1.1em;
          height: 1.1em;
          display: block;
          fill: currentColor;
        }
      </style>
      <button
        type="button"
        part="button"
        aria-label="${escapeHtml(this.label)}"
        title="${escapeHtml(this.label)}"
        data-tone="${escapeHtml(this.tone)}"
        ${this.disabled ? "disabled" : ""}
      >
        <span part="icon" aria-hidden="true" data-icon-source="${resolvedIcon ? "design-system" : "text"}">${iconMarkup}</span>
      </button>
    `;
  }
}

export const defineBoxIconButtonElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxIconButtonElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxIconButtonElement;
  }

  customElements.define(tagName, BoxIconButtonElement);
  return BoxIconButtonElement;
};
