import { BaseElement } from "../../core/index.js";
import {
  boeFocusRingShadow,
  boeFocusVisibleStyles,
} from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-radio-group";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const radioGroupStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="group"] {
    margin: 0;
    padding: 0;
    border: none;
    min-inline-size: 0;
  }

  [part="label"] {
    margin: 0 0 0.8rem;
    font-size: 0.9rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  [part="options"] {
    display: grid;
    gap: 0.65rem;
  }

  [part="option"] {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.82rem 0.9rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    border-radius: 0.95rem;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, var(--boe-token-surface-surface, #ffffff) 12%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%) 100%
      );
    cursor: pointer;
    transition:
      border-color 140ms ease,
      background 140ms ease,
      box-shadow 140ms ease;
  }

  [part="option"]:hover:not(:has([part="input"]:disabled)) {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
  }

  [part="option"]:active:not(:has([part="input"]:disabled)) {
    background: color-mix(in srgb, var(--boe-token-surface-surface-hover, #f4f4f4) 70%, var(--boe-token-surface-surface-secondary, #fbfbfb) 30%);
  }

  [part="option"][data-selected="true"] {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 20%, var(--boe-token-stroke-stroke, #e8e8e8) 80%);
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 9%, var(--boe-token-surface-surface, #ffffff) 91%) 0%,
        color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 58%, var(--boe-token-surface-surface, #ffffff) 42%) 100%
      );
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.82),
      0 10px 20px rgba(15, 23, 42, 0.04);
  }

  [part="option"]:focus-within {
    outline: none;
    box-shadow: ${boeFocusRingShadow};
  }

  [part="option"]:has([part="input"]:disabled) {
    opacity: 0.55;
    cursor: not-allowed;
    box-shadow: none;
  }

  [part="input"] {
    inline-size: 1rem;
    block-size: 1rem;
    accent-color: var(--boe-token-surface-surface-brand, #0061d5);
    margin: 0;
    flex: 0 0 auto;
  }

  ${boeFocusVisibleStyles('[part="input"]')}

  [part="option-label"] {
    font-weight: 500;
    color: var(--boe-token-text-text, #222222);
  }
`;

export class BoxRadioGroupElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "options", "value"];
  }

  private valueInternal = "";
  private groupName = "radio-group-" + Math.random().toString(36).slice(2);
  private lastOptionsJson = "";

  private legendEl!: HTMLLegendElement;
  private optionsContainerEl!: HTMLDivElement;

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
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
    return this.getAttribute("label") ?? "Options";
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

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${radioGroupStyles}</style>
      <fieldset part="group">
        <legend part="label"></legend>
        <div part="options"></div>
      </fieldset>
    `;

    this.legendEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.optionsContainerEl = this.shadowRoot.querySelector('[part="options"]')!;
  }

  protected update(): void {
    if (!this.legendEl || !this.optionsContainerEl) {
      return;
    }

    this.legendEl.textContent = this.label;

    const currentOptionsJson = JSON.stringify(this.options);
    if (currentOptionsJson !== this.lastOptionsJson) {
      const groupName = this.groupName;
      this.optionsContainerEl.innerHTML = this.options
        .map(
          option => `
            <label part="option" data-value="${escapeHtml(option.value)}">
              <input type="radio" part="input" name="${groupName}" value="${escapeHtml(option.value)}" />
              <span part="option-label">${escapeHtml(option.label)}</span>
            </label>
          `,
        )
        .join("");
      this.lastOptionsJson = currentOptionsJson;

      this.optionsContainerEl.querySelectorAll('[part="input"]').forEach(node => {
        node.addEventListener("change", event => {
          if (this.disabled) {
            return;
          }
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
      });
    }

    this.optionsContainerEl.querySelectorAll('[part="option"]').forEach(labelNode => {
      const label = labelNode as HTMLLabelElement;
      const val = label.dataset.value;
      const isSelected = val === this.valueInternal;

      label.dataset.selected = String(isSelected);
      label.setAttribute("part", `option${isSelected ? " option-selected" : ""}`);

      const input = label.querySelector('[part="input"]') as HTMLInputElement | null;
      if (input) {
        input.checked = isSelected;
        if (this.disabled) {
          input.setAttribute("disabled", "");
        } else {
          input.removeAttribute("disabled");
        }
      }
    });
  }
}

export const defineBoxRadioGroupElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxRadioGroupElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxRadioGroupElement;
  }

  customElements.define(tagName, BoxRadioGroupElement);
  return BoxRadioGroupElement;
};
