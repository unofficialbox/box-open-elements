const DEFAULT_TAG_NAME = "box-search-field";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxSearchFieldElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "placeholder", "value"];
  }

  private valueInternal = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
    this.render();
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
    return this.getAttribute("label") ?? "Search";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "Search";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
    }

    this.render();
  }

  clear(): void {
    if (this.disabled || !this.valueInternal) {
      return;
    }

    this.value = "";
    this.dispatchEvent(new CustomEvent("clear", { bubbles: true, composed: true, detail: { value: "" } }));
    this.dispatchEvent(new CustomEvent("value-changed", { bubbles: true, composed: true, detail: { value: "" } }));
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="field"] {
          display: grid;
          gap: 0.45rem;
        }

        [part="label"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="input-shell"] {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.3rem 0.3rem 0.85rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 78%, white 22%);
          border-radius: 0.7rem;
          background:
            linear-gradient(
              180deg,
              var(--boe-token-surface-surface, #ffffff) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #f7f9fc) 12%) 100%
            );
          transition:
            border-color 140ms ease,
            background 140ms ease,
            box-shadow 140ms ease;
        }

        [part="input-shell"]:hover {
          border-color: var(--boe-token-stroke-stroke-hover, #bcc9d6);
        }

        [part="input-shell"]:focus-within {
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="input"] {
          appearance: none;
          flex: 1 1 auto;
          min-inline-size: 0;
          border: none;
          background: transparent;
          font: inherit;
          color: var(--boe-token-text-text, #101820);
          padding: 0.3rem 0;
        }

        [part="input"]::placeholder {
          color: var(--boe-token-text-text-placeholder, #748091);
        }

        [part="input"]:focus {
          outline: none;
        }

        [part="input"]:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        [part="submit"],
        [part="clear"] {
          appearance: none;
          flex: 0 0 auto;
          font: inherit;
          font-weight: 600;
          padding: 0.42rem 0.85rem;
          border-radius: 0.5rem;
          cursor: pointer;
          transition:
            background 140ms ease,
            border-color 140ms ease,
            box-shadow 140ms ease;
        }

        [part="submit"] {
          border: 1px solid transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="submit"]:hover:not(:disabled) {
          background: var(--boe-token-surface-surface-brand-hover, #006ae9);
        }

        [part="submit"]:active:not(:disabled) {
          background: var(--boe-token-surface-surface-brand-pressed, #004eac);
        }

        [part="clear"] {
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 78%, white 22%);
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #f7f9fc) 12%);
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="clear"]:hover:not(:disabled) {
          border-color: var(--boe-token-stroke-stroke-hover, #bcc9d6);
          background: var(--boe-token-surface-surface-hover, #f5f8fc);
        }

        [part="submit"]:focus-visible,
        [part="clear"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="submit"]:disabled,
        [part="clear"]:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      </style>
      <label part="field">
        <span part="label">${escapeHtml(this.label)}</span>
        <div part="input-shell">
          <input
            type="search"
            part="input"
            value="${escapeHtml(this.valueInternal)}"
            placeholder="${escapeHtml(this.placeholder)}"
            ${this.disabled ? "disabled" : ""}
          />
          <button type="button" part="submit" ${this.disabled ? "disabled" : ""}>Search</button>
          <button type="button" part="clear" ${this.disabled || !this.valueInternal ? "disabled" : ""}>Clear</button>
        </div>
      </label>
    `;

    const input = this.shadowRoot.querySelector('[part="input"]') as HTMLInputElement | null;
    const clearButton = this.shadowRoot.querySelector('[part="clear"]') as HTMLButtonElement | null;
    input?.addEventListener("input", event => {
      if (this.disabled) {
        return;
      }
      const nextValue = (event.currentTarget as HTMLInputElement).value;
      this.valueInternal = nextValue;
      if (clearButton) {
        clearButton.disabled = this.disabled || nextValue.length === 0;
      }
      this.dispatchEvent(
        new CustomEvent("value-changed", {
          bubbles: true,
          composed: true,
          detail: { value: nextValue },
        }),
      );
    });
    input?.addEventListener("keydown", event => {
      if (this.disabled) {
        return;
      }
      if (event.key === "Enter") {
        this.dispatchEvent(
          new CustomEvent("search", {
            bubbles: true,
            composed: true,
            detail: { value: this.valueInternal },
          }),
        );
      }
    });
    this.shadowRoot.querySelector('[part="submit"]')?.addEventListener("click", () => {
      if (this.disabled) {
        return;
      }
      this.dispatchEvent(
        new CustomEvent("search", {
          bubbles: true,
          composed: true,
          detail: { value: this.valueInternal },
        }),
      );
    });
    this.shadowRoot.querySelector('[part="clear"]')?.addEventListener("click", () => {
      this.clear();
    });
  }
}

export const defineBoxSearchFieldElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSearchFieldElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSearchFieldElement;
  }

  customElements.define(tagName, BoxSearchFieldElement);
  return BoxSearchFieldElement;
};
