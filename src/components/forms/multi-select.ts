const DEFAULT_TAG_NAME = "box-multi-select";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type MultiSelectOption = {
  label: string;
  value: string;
};

export class BoxMultiSelectElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "options", "value"];
  }

  private valueInternal: string[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Multi Select";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get options(): MultiSelectOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as MultiSelectOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: MultiSelectOption[]) {
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
            />
            <span part="option-label">${escapeHtml(option.label)}</span>
          </label>
        `,
      )
      .join("");

    const summary = this.valueInternal.length === 0 ? "No selections" : `${this.valueInternal.length} selected`;

    this.shadowRoot.innerHTML = `
      <fieldset part="field">
        <legend part="label">${escapeHtml(this.label)}</legend>
        <span part="summary">${escapeHtml(summary)}</span>
        <div part="options">${optionsMarkup}</div>
      </fieldset>
    `;

    this.shadowRoot.querySelectorAll('[part="input"]').forEach(input => {
      input.addEventListener("change", () => {
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

export const defineBoxMultiSelectElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxMultiSelectElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxMultiSelectElement;
  }

  customElements.define(tagName, BoxMultiSelectElement);
  return BoxMultiSelectElement;
};
