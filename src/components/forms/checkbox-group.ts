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
