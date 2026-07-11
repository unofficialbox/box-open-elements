const DEFAULT_TAG_NAME = "box-radio-group";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxRadioGroupElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "options", "value"];
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
    return this.getAttribute("label") ?? "Options";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get options(): Array<{ label: string; value: string }> {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Array<{ label: string; value: string }>;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: Array<{ label: string; value: string }>) {
    this.setAttribute("options", JSON.stringify(value));
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const groupName = `radio-${this.localName}-${Math.random().toString(36).slice(2)}`;
    const optionsMarkup = this.options
      .map(
        option => `
          <label part="option${option.value === this.valueInternal ? " option-selected" : ""}" data-selected="${String(option.value === this.valueInternal)}">
            <input type="radio" part="input" name="${groupName}" value="${escapeHtml(option.value)}" ${option.value === this.valueInternal ? "checked" : ""} ${this.disabled ? "disabled" : ""} />
            <span part="option-label">${escapeHtml(option.label)}</span>
          </label>
        `,
      )
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="group"] {
          margin: 0;
          padding: 0;
          border: none;
          min-inline-size: 0;
        }

        [part="label"] {
          margin: 0 0 0.8rem;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        [part="options"] {
          display: grid;
          gap: 0.65rem;
        }

        [part="option"] {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.82rem 0.9rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 78%, white 22%);
          border-radius: 0.95rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 88%, white 12%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #f7f9fc) 12%) 100%
            );
          transition:
            border-color 140ms ease,
            background 140ms ease,
            box-shadow 140ms ease;
        }

        [part="option"]:hover {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, var(--boe-token-stroke-stroke, #d6e0ea) 84%);
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-item-surface-hover, #eef4fb) 44%, white 56%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 86%, var(--boe-token-surface-item-surface-hover, #eef4fb) 14%) 100%
            );
        }

        [part="option"][data-selected="true"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 20%, var(--boe-token-stroke-stroke, #d6e0ea) 80%);
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 9%, white 91%) 0%,
              color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #e8f1ff) 58%, white 42%) 100%
            );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.82),
            0 10px 20px rgba(15, 23, 42, 0.04);
        }

        [part="option"]:focus-within {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 26%, transparent);
          outline-offset: 2px;
        }

        [part="input"] {
          inline-size: 1rem;
          block-size: 1rem;
          accent-color: var(--boe-token-surface-surface-brand, #0061d5);
          margin: 0;
          flex: 0 0 auto;
        }

        [part="option-label"] {
          font-weight: 500;
          color: var(--boe-token-text-text, #101820);
        }
      </style>
      <fieldset part="group">
        <legend part="label">${escapeHtml(this.label)}</legend>
        <div part="options">${optionsMarkup}</div>
      </fieldset>
    `;

    this.shadowRoot.querySelectorAll('[part="input"]').forEach(node => {
      node.addEventListener("change", event => {
        if (this.disabled) {
          return;
        }
        const nextValue = (event.currentTarget as HTMLInputElement).value;
        this.valueInternal = nextValue;
        this.setAttribute("value", nextValue);
        this.dispatchEvent(
          new CustomEvent("value-changed", {
            bubbles: true,
            composed: true,
            detail: { value: nextValue },
          }),
        );
      });
    });
  }
}

export const defineBoxRadioGroupElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxRadioGroupElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxRadioGroupElement;
  }

  customElements.define(tagName, BoxRadioGroupElement);
  return BoxRadioGroupElement;
};
