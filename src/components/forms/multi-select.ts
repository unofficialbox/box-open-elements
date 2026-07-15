import { BaseElement } from "../../core/index.js";

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

const multiSelectStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="field"] {
    margin: 0;
    padding: 0;
    border: none;
    min-inline-size: 0;
    display: grid;
    gap: 0.6rem;
  }

  [part="label"] {
    margin: 0 0 0.2rem;
    padding: 0;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="summary"] {
    justify-self: start;
    display: inline-flex;
    padding: 0.35rem 0.6rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
    color: var(--boe-token-surface-surface-brand, #0061d5);
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  [part="options"] {
    display: grid;
    gap: 0.15rem;
    padding: 0.35rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    border-radius: 0.75rem;
    background: var(--boe-token-surface-surface, #ffffff);
    box-shadow: 0 12px 30px color-mix(in srgb, #0b1e33 14%, transparent);
  }

  [part="option"] {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem 0.7rem;
    border-radius: 0.5rem;
    cursor: pointer;
    color: var(--boe-token-text-text, #222222);
    transition:
      background 140ms ease,
      color 140ms ease;
  }

  [part="option"]:hover {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part="option"]:has([part="input"]:checked) {
    background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
    color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="option"]:focus-within {
    outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 26%, transparent);
    outline-offset: -2px;
  }

  [part="input"] {
    inline-size: 1rem;
    block-size: 1rem;
    accent-color: var(--boe-token-surface-surface-brand, #0061d5);
    margin: 0;
    flex: 0 0 auto;
    cursor: inherit;
  }

  [part="option-label"] {
    font-weight: 500;
  }
`;

export class BoxMultiSelectElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label", "options", "value"];
  }

  private valueInternal: string[] = [];
  private lastOptionsJson = "";
  private legendEl!: HTMLLegendElement;
  private summaryEl!: HTMLElement;
  private optionsContainerEl!: HTMLDivElement;

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
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
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
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${multiSelectStyles}</style>
      <fieldset part="field">
        <legend part="label"></legend>
        <span part="summary"></span>
        <div part="options"></div>
      </fieldset>
    `;
    this.legendEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.summaryEl = this.shadowRoot.querySelector('[part="summary"]')!;
    this.optionsContainerEl = this.shadowRoot.querySelector('[part="options"]')!;
  }

  protected setupListeners(): void {
    this.optionsContainerEl.addEventListener("change", event => {
      const target = event.target as HTMLInputElement;
      if (target.getAttribute("part") !== "input") {
        return;
      }

      const selected = Array.from(
        this.optionsContainerEl.querySelectorAll('[part="input"]:checked'),
      ).map(node => (node as HTMLInputElement).value);

      this.valueInternal = selected;
      this.setAttribute("value", JSON.stringify(selected));
      this.summaryEl.textContent =
        selected.length === 0 ? "No selections" : `${selected.length} selected`;
      this.dispatchEvent(
        new CustomEvent("value-changed", {
          bubbles: true,
          composed: true,
          detail: { value: [...selected] },
        }),
      );
    });
  }

  protected update(): void {
    if (!this.legendEl || !this.summaryEl || !this.optionsContainerEl) {
      return;
    }

    this.legendEl.textContent = this.label;
    this.summaryEl.textContent =
      this.valueInternal.length === 0 ? "No selections" : `${this.valueInternal.length} selected`;

    const optionsJson = JSON.stringify(this.options);
    if (optionsJson !== this.lastOptionsJson) {
      this.optionsContainerEl.innerHTML = this.options
        .map(
          option => `
            <label part="option">
              <input type="checkbox" part="input" value="${escapeHtml(option.value)}" />
              <span part="option-label">${escapeHtml(option.label)}</span>
            </label>
          `,
        )
        .join("");
      this.lastOptionsJson = optionsJson;
    }

    this.optionsContainerEl.querySelectorAll('[part="input"]').forEach(node => {
      const input = node as HTMLInputElement;
      input.checked = this.valueInternal.includes(input.value);
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
