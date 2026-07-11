const DEFAULT_TAG_NAME = "box-date-field";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxDateFieldElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "max", "min", "value"];
  }

  private valueInternal = "";

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
    return this.getAttribute("label") ?? "Date";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get max(): string {
    return this.getAttribute("max") ?? "";
  }

  set max(value: string) {
    this.setAttribute("max", value);
  }

  get min(): string {
    return this.getAttribute("min") ?? "";
  }

  set min(value: string) {
    this.setAttribute("min", value);
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
    this.render();
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

  private syncValue(nextValue: string): void {
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

    const minAttribute = this.min ? `min="${escapeHtml(this.min)}"` : "";
    const maxAttribute = this.max ? `max="${escapeHtml(this.max)}"` : "";

    this.shadowRoot.innerHTML = `
      <label part="field">
        <span part="label">${escapeHtml(this.label)}</span>
        <input
          type="date"
          part="input"
          value="${escapeHtml(this.valueInternal)}"
          ${minAttribute}
          ${maxAttribute}
          ${this.disabled ? "disabled" : ""}
        />
      </label>
    `;

    const input = this.shadowRoot.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.addEventListener("input", event => {
      this.syncValue((event.currentTarget as HTMLInputElement).value);
    });
  }
}

export const defineBoxDateFieldElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxDateFieldElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxDateFieldElement;
  }

  customElements.define(tagName, BoxDateFieldElement);
  return BoxDateFieldElement;
};
