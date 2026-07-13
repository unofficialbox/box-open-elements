const DEFAULT_TAG_NAME = "box-switch";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxSwitchElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["checked", "description", "disabled", "label"];
  }

  private checkedInternal = false;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get checked(): boolean {
    return this.checkedInternal;
  }

  set checked(value: boolean) {
    const nextValue = Boolean(value);
    this.checkedInternal = nextValue;
    if (nextValue) {
      this.setAttribute("checked", "");
    } else {
      this.removeAttribute("checked");
    }
    this.render();
  }

  get description(): string {
    return this.getAttribute("description") ?? "";
  }

  set description(value: string) {
    this.setAttribute("description", value);
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

  get label(): string {
    return this.getAttribute("label") ?? "Switch";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "checked") {
      this.checkedInternal = this.hasAttribute("checked");
    }

    this.render();
  }

  private toggleChecked(): void {
    if (this.disabled) {
      return;
    }

    const nextValue = !this.checkedInternal;
    this.checkedInternal = nextValue;
    if (nextValue) {
      this.setAttribute("checked", "");
    } else {
      this.removeAttribute("checked");
    }

    this.dispatchEvent(
      new CustomEvent("checked-changed", {
        bubbles: true,
        composed: true,
        detail: { checked: nextValue },
      }),
    );

    this.render();
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const descriptionMarkup = this.description
      ? `<span part="description">${escapeHtml(this.description)}</span>`
      : "";

    const trackPart = this.checkedInternal ? "track track-checked" : "track";
    const thumbPart = this.checkedInternal ? "thumb thumb-checked" : "thumb";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          color: inherit;
          font: inherit;
        }

        [part="switch"] {
          appearance: none;
          border: none;
          background: transparent;
          font: inherit;
          color: inherit;
          text-align: left;
          display: inline-flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 0;
          margin: 0;
          cursor: pointer;
        }

        [part="switch"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
          border-radius: 0.5rem;
        }

        [part="switch"]:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        [part~="track"] {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          inline-size: 2.5rem;
          block-size: 1.4rem;
          padding: 0.15rem;
          box-sizing: border-box;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, white 18%);
          box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.08);
          transition: background 140ms ease, box-shadow 140ms ease;
        }

        [part="switch"]:hover:not(:disabled) [part~="track"][data-checked="false"] {
          background: var(--boe-token-stroke-stroke-hover, #bcbcbc);
        }

        [part~="track"][data-checked="true"] {
          background: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="switch"]:hover:not(:disabled) [part~="track"][data-checked="true"] {
          background: var(--boe-token-surface-surface-brand-hover, #0057c0);
        }

        [part="switch"]:active:not(:disabled) [part~="track"][data-checked="true"] {
          background: var(--boe-token-surface-surface-brand-pressed, #004eaa);
        }

        [part~="thumb"] {
          inline-size: 1.1rem;
          block-size: 1.1rem;
          border-radius: 999px;
          background: var(--boe-token-surface-surface, #ffffff);
          box-shadow:
            0 1px 2px rgba(15, 23, 42, 0.18),
            0 0 0 1px color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 45%, transparent);
          transform: translateX(0);
          transition: transform 140ms ease;
        }

        [part~="thumb"][data-checked="true"] {
          transform: translateX(1.1rem);
        }

        [part="content"] {
          display: grid;
          gap: 0.2rem;
          padding-block-start: 0.05rem;
        }

        [part="label"] {
          font-weight: 600;
          color: var(--boe-token-text-text, #222222);
        }

        [part="description"] {
          font-size: 0.9rem;
          line-height: 1.45;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }
      </style>
      <button
        type="button"
        part="switch"
        role="switch"
        aria-label="${escapeHtml(this.label)}"
        aria-checked="${String(this.checkedInternal)}"
        aria-disabled="${String(this.disabled)}"
        ${this.disabled ? "disabled" : ""}
      >
        <span part="${trackPart}" data-checked="${String(this.checkedInternal)}">
          <span part="${thumbPart}" data-checked="${String(this.checkedInternal)}"></span>
        </span>
        <span part="content">
          <span part="label">${escapeHtml(this.label)}</span>
          ${descriptionMarkup}
        </span>
      </button>
    `;

    this.shadowRoot.querySelector('[part="switch"]')?.addEventListener("click", () => {
      this.toggleChecked();
    });
  }
}

export const defineBoxSwitchElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSwitchElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSwitchElement;
  }

  customElements.define(tagName, BoxSwitchElement);
  return BoxSwitchElement;
};
