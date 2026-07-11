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
