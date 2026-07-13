const DEFAULT_TAG_NAME = "box-slider";

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

export class BoxSliderElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "max", "min", "step", "value"];
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
    return this.getAttribute("label") ?? "Slider";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get max(): number {
    return parseNumber(this.getAttribute("max"), 100);
  }

  set max(value: number) {
    this.setAttribute("max", String(value));
  }

  get min(): number {
    return parseNumber(this.getAttribute("min"), 0);
  }

  set min(value: number) {
    this.setAttribute("min", String(value));
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
    const normalizedValue = Number.isFinite(nextValue) ? nextValue : this.min;
    this.valueInternal = normalizedValue;
    this.setAttribute("value", String(normalizedValue));
    this.render();
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(name: string): void {
    if (name === "value") {
      this.valueInternal = parseNumber(this.getAttribute("value"), this.min);
    }

    this.render();
  }

  private syncValue(nextValue: number): void {
    this.valueInternal = nextValue;
    const valueElement = this.shadowRoot?.querySelector('[part="value"]');
    if (valueElement) {
      valueElement.textContent = String(nextValue);
    }
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

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="field"] {
          display: grid;
          gap: 0.6rem;
        }

        [part="header"] {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.8rem;
        }

        [part="label"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="value"] {
          display: inline-flex;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, white 88%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-size: 0.85rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        [part="range"] {
          inline-size: 100%;
          margin: 0;
          accent-color: var(--boe-token-surface-surface-brand, #0061d5);
          cursor: pointer;
        }

        [part="range"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }

        [part="range"]:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      </style>
      <label part="field">
        <span part="header">
          <span part="label">${escapeHtml(this.label)}</span>
          <span part="value">${escapeHtml(String(this.valueInternal))}</span>
        </span>
        <input
          type="range"
          part="range"
          min="${escapeHtml(String(this.min))}"
          max="${escapeHtml(String(this.max))}"
          step="${escapeHtml(String(this.step))}"
          value="${escapeHtml(String(this.valueInternal))}"
          ${this.disabled ? "disabled" : ""}
        />
      </label>
    `;

    const input = this.shadowRoot.querySelector('[part="range"]') as HTMLInputElement | null;
    input?.addEventListener("input", event => {
      const nextValue = Number((event.currentTarget as HTMLInputElement).value);
      if (!Number.isFinite(nextValue)) {
        return;
      }

      this.syncValue(nextValue);
    });
  }
}

export const defineBoxSliderElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSliderElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSliderElement;
  }

  customElements.define(tagName, BoxSliderElement);
  return BoxSliderElement;
};
