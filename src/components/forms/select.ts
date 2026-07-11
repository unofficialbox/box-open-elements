const DEFAULT_TAG_NAME = "box-select";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxSelectElement extends HTMLElement {
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
    return this.getAttribute("label") ?? "Select";
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

    const optionsMarkup = this.options
      .map(
        option =>
          `<option value="${escapeHtml(option.value)}" ${option.value === this.valueInternal ? "selected" : ""}>${escapeHtml(option.label)}</option>`,
      )
      .join("");

    this.shadowRoot.innerHTML = `
      <label part="field">
        <span part="label">${escapeHtml(this.label)}</span>
        <select part="select" ${this.disabled ? "disabled" : ""}>
          ${optionsMarkup}
        </select>
      </label>
    `;

    const select = this.shadowRoot.querySelector('[part="select"]') as HTMLSelectElement | null;
    if (select) {
      select.value = this.valueInternal;
      select.addEventListener("change", event => {
        const nextValue = (event.currentTarget as HTMLSelectElement).value;
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
    }
  }
}

export const defineBoxSelectElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSelectElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSelectElement;
  }

  customElements.define(tagName, BoxSelectElement);
  return BoxSelectElement;
};
