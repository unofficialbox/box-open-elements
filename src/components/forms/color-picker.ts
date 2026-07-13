const DEFAULT_TAG_NAME = "box-color-picker";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxColorSwatch = {
  label?: string;
  value: string;
};

const normalizeHex = (value: string | null): string => {
  if (!value) {
    return "#3b82f6";
  }

  const normalized = value.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(normalized) ? normalized : "#3b82f6";
};

export class BoxColorPickerElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "swatches", "value"];
  }

  private valueInternal = "#3b82f6";

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

  get label(): string {
    return this.getAttribute("label") ?? "Color Picker";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get swatches(): BoxColorSwatch[] {
    const raw = this.getAttribute("swatches");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxColorSwatch[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set swatches(value: BoxColorSwatch[]) {
    this.setAttribute("swatches", JSON.stringify(value));
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    const normalized = normalizeHex(nextValue);
    this.valueInternal = normalized;
    this.setAttribute("value", normalized);
    this.render();
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "value") {
      this.valueInternal = normalizeHex(this.getAttribute("value"));
    }

    this.render();
  }

  private emitValueChanged(nextValue: string): void {
    if (this.disabled || nextValue === this.valueInternal) {
      return;
    }

    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: nextValue },
      }),
    );
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const swatchesMarkup = this.swatches.length
      ? `
        <div part="swatches" role="list" aria-label="${escapeHtml(this.label)} swatches">
          ${this.swatches
            .map(
              swatch => `
                <button
                  type="button"
                  part="swatch"
                  role="listitem"
                  data-value="${escapeHtml(normalizeHex(swatch.value))}"
                  aria-label="${escapeHtml(swatch.label ?? normalizeHex(swatch.value))}"
                  aria-pressed="${String(normalizeHex(swatch.value) === this.valueInternal)}"
                  style="--swatch-color:${escapeHtml(normalizeHex(swatch.value))};"
                  ${this.disabled ? "disabled" : ""}
                ></button>
              `,
            )
            .join("")}
        </div>
      `
      : "";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          color: inherit;
          font: inherit;
        }

        [part="field"] {
          display: grid;
          gap: 0.5rem;
        }

        [part="label"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="control"] {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          padding: 0.45rem 0.7rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, white 22%);
          border-radius: 0.7rem;
          background:
            linear-gradient(
              180deg,
              var(--boe-token-surface-surface, #ffffff) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 42%, var(--boe-token-surface-surface, #ffffff) 58%) 100%
            );
          transition: border-color 140ms ease, box-shadow 140ms ease;
        }

        [part="control"]:focus-within {
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="input"] {
          width: 2.1rem;
          height: 2.1rem;
          padding: 0;
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          border-radius: 0.55rem;
          background: transparent;
          cursor: pointer;
        }

        [part="input"]:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        [part="value"] {
          font-size: 0.9rem;
          font-variant-numeric: tabular-nums;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="swatches"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }

        [part="swatch"] {
          appearance: none;
          width: 1.7rem;
          height: 1.7rem;
          padding: 0;
          border: 2px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          border-radius: 999px;
          background: var(--swatch-color, #ffffff);
          cursor: pointer;
          transition: border-color 140ms ease, transform 140ms ease, box-shadow 140ms ease;
        }

        [part="swatch"]:hover:not(:disabled) {
          transform: scale(1.08);
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
        }

        [part="swatch"][aria-pressed="true"] {
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
        }

        [part="swatch"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="swatch"]:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }
      </style>
      <label part="field">
        <span part="label">${escapeHtml(this.label)}</span>
        <div part="control">
          <input
            type="color"
            part="input"
            value="${escapeHtml(this.valueInternal)}"
            aria-label="${escapeHtml(this.label)}"
            ${this.disabled ? "disabled" : ""}
          />
          <span part="value">${escapeHtml(this.valueInternal)}</span>
        </div>
        ${swatchesMarkup}
      </label>
    `;

    const input = this.shadowRoot.querySelector('[part="input"]') as HTMLInputElement | null;
    if (input) {
      input.value = this.valueInternal;
      input.addEventListener("input", event => {
        const nextValue = normalizeHex((event.currentTarget as HTMLInputElement).value);
        this.emitValueChanged(nextValue);
      });
    }

    this.shadowRoot.querySelectorAll('[part="swatch"]').forEach(node => {
      node.addEventListener("click", event => {
        const nextValue = normalizeHex((event.currentTarget as HTMLButtonElement).dataset.value ?? "");
        this.emitValueChanged(nextValue);
      });
    });
  }
}

export const defineBoxColorPickerElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxColorPickerElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxColorPickerElement;
  }

  customElements.define(tagName, BoxColorPickerElement);
  return BoxColorPickerElement;
};
