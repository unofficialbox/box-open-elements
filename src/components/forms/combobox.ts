const DEFAULT_TAG_NAME = "box-combobox";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxComboboxOption = {
  label: string;
  value: string;
};

export class BoxComboboxElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "options", "placeholder", "value"];
  }

  private valueInternal = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Combobox";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get options(): BoxComboboxOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxComboboxOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: BoxComboboxOption[]) {
    this.setAttribute("options", JSON.stringify(value));
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const optionsMarkup = this.options
      .map(
        option =>
          `<option value="${escapeHtml(option.label)}" data-option-value="${escapeHtml(option.value)}"></option>`,
      )
      .join("");

    this.shadowRoot.innerHTML = `
      <label part="field">
        <span part="label">${escapeHtml(this.label)}</span>
        <input
          type="text"
          part="input"
          list="combobox-options"
          value="${escapeHtml(this.valueInternal)}"
          placeholder="${escapeHtml(this.placeholder)}"
        />
        <datalist id="combobox-options">${optionsMarkup}</datalist>
      </label>
    `;

    const input = this.shadowRoot.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.addEventListener("input", event => {
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
  }
}

export const defineBoxComboboxElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxComboboxElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxComboboxElement;
  }

  customElements.define(tagName, BoxComboboxElement);
  return BoxComboboxElement;
};
