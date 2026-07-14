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
          appearance: none;
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
