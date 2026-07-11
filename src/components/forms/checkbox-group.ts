const DEFAULT_TAG_NAME = "box-checkbox-group";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type CheckboxGroupOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

export class BoxCheckboxGroupElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "options", "value"];
  }

  private valueInternal: string[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Options";
  }

  set label(value: string) {
    this.setAttribute("label", value);
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

  get options(): CheckboxGroupOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as CheckboxGroupOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: CheckboxGroupOption[]) {
    this.setAttribute("options", JSON.stringify(value));
  }

  get value(): string[] {
    return [...this.valueInternal];
  }

  set value(nextValue: string[]) {
    this.valueInternal = [...nextValue];
    this.setAttribute("value", JSON.stringify(nextValue));
    this.render();
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "value") {
      const raw = this.getAttribute("value");
      if (!raw) {
        this.valueInternal = [];
      } else {
        try {
          const parsed = JSON.parse(raw) as string[];
          this.valueInternal = Array.isArray(parsed) ? parsed : [];
        } catch {
          this.valueInternal = [];
        }
      }
    }

    this.render();
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const optionsMarkup = this.options
      .map(
        option => `
          <label part="option">
            <input
              type="checkbox"
              part="input"
              value="${escapeHtml(option.value)}"
              ${this.valueInternal.includes(option.value) ? "checked" : ""}
              ${this.disabled || option.disabled ? "disabled" : ""}
            />
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
          padding: 0;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #52606d);
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
          cursor: pointer;
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
              color-mix(in srgb, var(--boe-token-surface-surface-hover, #f5f8fc) 44%, white 56%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 86%, var(--boe-token-surface-surface-hover, #f5f8fc) 14%) 100%
            );
        }

        [part="option"]:has([part="input"]:checked) {
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

        [part="option"]:has([part="input"]:disabled) {
          opacity: 0.55;
          cursor: not-allowed;
        }

        [part="input"] {
          inline-size: 1rem;
          block-size: 1rem;
          accent-color: var(--boe-token-surface-surface-brand, #0061d5);
          margin: 0;
          flex: 0 0 auto;
          cursor: inherit;
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

    this.shadowRoot.querySelectorAll('[part="input"]').forEach(input => {
      input.addEventListener("change", () => {
        if (this.disabled) {
          return;
        }
        const selected = Array.from(
          this.shadowRoot?.querySelectorAll('[part="input"]:checked') ?? [],
        ).map(node => (node as HTMLInputElement).value);

        this.valueInternal = selected;
        this.setAttribute("value", JSON.stringify(selected));
        this.dispatchEvent(
          new CustomEvent("value-changed", {
            bubbles: true,
            composed: true,
            detail: { value: [...selected] },
          }),
        );
      });
    });
  }
}

export const defineBoxCheckboxGroupElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxCheckboxGroupElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxCheckboxGroupElement;
  }

  customElements.define(tagName, BoxCheckboxGroupElement);
  return BoxCheckboxGroupElement;
};
