const DEFAULT_TAG_NAME = "box-number-input";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const parseNumber = (value: string | null, fallback: number): number => {
  if (value == null || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export class BoxNumberInputElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "max", "min", "placeholder", "step", "value"];
  }

  private valueInternal = 0;

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
    return this.getAttribute("label") ?? "Number";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get max(): number | null {
    return this.hasAttribute("max") ? parseNumber(this.getAttribute("max"), 0) : null;
  }

  set max(value: number | null) {
    if (value == null) {
      this.removeAttribute("max");
    } else {
      this.setAttribute("max", String(value));
    }
  }

  get min(): number | null {
    return this.hasAttribute("min") ? parseNumber(this.getAttribute("min"), 0) : null;
  }

  set min(value: number | null) {
    if (value == null) {
      this.removeAttribute("min");
    } else {
      this.setAttribute("min", String(value));
    }
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
  }

  get step(): number {
    return parseNumber(this.getAttribute("step"), 1);
  }

  set step(value: number) {
    this.setAttribute("step", String(value));
  }

  get value(): number {
    return this.valueInternal;
  }

  set value(nextValue: number) {
    const normalizedValue = Number.isFinite(nextValue) ? nextValue : 0;
    this.valueInternal = normalizedValue;
    this.setAttribute("value", String(normalizedValue));
    this.render();
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "value") {
      this.valueInternal = parseNumber(this.getAttribute("value"), 0);
    }

    this.render();
  }

  private syncValue(nextValue: number): void {
    this.valueInternal = nextValue;
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

    const minAttribute = this.min == null ? "" : `min="${escapeHtml(String(this.min))}"`;
    const maxAttribute = this.max == null ? "" : `max="${escapeHtml(String(this.max))}"`;

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
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="input"] {
          font: inherit;
          color: var(--boe-token-text-text, #222222);
          padding: 0.6rem 0.85rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
          border-radius: 0.7rem;
          background:
            linear-gradient(
              180deg,
              var(--boe-token-surface-surface, #ffffff) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%) 100%
            );
          transition:
            border-color 140ms ease,
            background 140ms ease,
            box-shadow 140ms ease;
        }

        [part="input"]::placeholder {
          color: var(--boe-token-text-text-placeholder, #909090);
        }

        [part="input"]:hover:not(:disabled) {
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
        }

        [part="input"]:focus-visible {
          outline: none;
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="input"]:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      </style>
      <label part="field">
        <span part="label">${escapeHtml(this.label)}</span>
        <input
          type="number"
          part="input"
          value="${escapeHtml(String(this.valueInternal))}"
          step="${escapeHtml(String(this.step))}"
          placeholder="${escapeHtml(this.placeholder)}"
          ${minAttribute}
          ${maxAttribute}
          ${this.disabled ? "disabled" : ""}
        />
      </label>
    `;

    const input = this.shadowRoot.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.addEventListener("input", event => {
      const nextValue = Number((event.currentTarget as HTMLInputElement).value);
      if (!Number.isFinite(nextValue)) {
        return;
      }

      this.syncValue(nextValue);
    });
  }
}

export const defineBoxNumberInputElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxNumberInputElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxNumberInputElement;
  }

  customElements.define(tagName, BoxNumberInputElement);
  return BoxNumberInputElement;
};
