import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-category-selector";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type CategoryOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

const categorySelectorStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="group"] {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  [part~="pill"] {
    appearance: none;
    padding: 0.4rem 0.85rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: 999px;
    background: var(--boe-token-surface-surface, #ffffff);
    color: var(--boe-token-text-text, #222222);
    font: inherit;
    font-size: 0.84rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 140ms ease, background 140ms ease, color 140ms ease;
  }

  [part~="pill"]:hover:not(:disabled) {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part~="pill-checked"] {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    background: var(--boe-token-surface-surface-brand, #0061d5);
    color: var(--boe-token-text-text-on-brand, #ffffff);
  }

  [part~="pill"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 26%, transparent);
  }

  [part~="pill"]:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  [part="empty"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-size: 0.86rem;
  }
`;

/**
 * A single-select category picker rendered as a horizontal radiogroup of pills —
 * a filter bar for switching one active category (distinct from the multi-select
 * `box-pill-cloud`). Data arrives via `options`; the active value is exposed as
 * `value` and announced with `value-changed`. Follows the radiogroup keyboard
 * pattern: arrow keys move selection with roving `tabindex`.
 */
export class BoxCategorySelectorElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label", "options", "value"];
  }

  private valueInternal = "";
  private lastOptionsJson = "";
  private hadFocus = false;
  private rootEl!: HTMLElement;

  get label(): string {
    return this.getAttribute("label") ?? "Categories";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get options(): CategoryOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as CategoryOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: CategoryOption[]) {
    this.setAttribute("options", JSON.stringify(value));
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private selectableOptions(): CategoryOption[] {
    return this.options.filter(option => !option.disabled);
  }

  private select(value: string): void {
    if (!value || value === this.valueInternal) {
      return;
    }
    if (this.options.find(option => option.value === value)?.disabled) {
      return;
    }

    this.hadFocus = this.shadowRoot?.activeElement !== null;
    this.valueInternal = value;
    this.setAttribute("value", value);
    if (this.isRendered) {
      this.update();
    }
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
  }

  private moveSelection(current: string, delta: number): void {
    const selectable = this.selectableOptions();
    if (!selectable.length) {
      return;
    }

    const currentIndex = selectable.findIndex(option => option.value === current);
    const baseIndex = currentIndex === -1 ? 0 : currentIndex;
    const nextIndex = Math.max(0, Math.min(selectable.length - 1, baseIndex + delta));
    const nextValue = selectable[nextIndex]?.value;
    if (nextValue) {
      this.select(nextValue);
    }
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${categorySelectorStyles}</style>
      <div part="root"></div>
    `;
    this.rootEl = this.shadowRoot.querySelector('[part="root"]')!;
  }

  protected setupListeners(): void {
    this.rootEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest(
        '[part~="pill"]',
      ) as HTMLButtonElement | null;
      if (!button || !this.rootEl.contains(button)) {
        return;
      }
      this.select(button.dataset.value ?? "");
    });

    this.rootEl.addEventListener("keydown", event => {
      const button = (event.target as HTMLElement).closest(
        '[part~="pill"]',
      ) as HTMLButtonElement | null;
      if (!button || !this.rootEl.contains(button)) {
        return;
      }
      const keyboardEvent = event as KeyboardEvent;
      const value = button.dataset.value ?? "";
      switch (keyboardEvent.key) {
        case "ArrowRight":
        case "ArrowDown":
          keyboardEvent.preventDefault();
          this.moveSelection(value, 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          keyboardEvent.preventDefault();
          this.moveSelection(value, -1);
          break;
        case " ":
        case "Enter":
          keyboardEvent.preventDefault();
          this.select(value);
          break;
        default:
          break;
      }
    });
  }

  protected update(): void {
    if (!this.rootEl) {
      return;
    }

    const options = this.options;
    if (!options.length) {
      this.rootEl.innerHTML = `<div part="empty">No categories</div>`;
      this.lastOptionsJson = "";
      return;
    }

    const optionsJson = JSON.stringify(options);
    if (optionsJson !== this.lastOptionsJson || !this.rootEl.querySelector('[part="group"]')) {
      this.rootEl.innerHTML = `
        <div part="group" role="radiogroup" aria-label="${escapeHtml(this.label)}">
          ${options
            .map(
              option => `
                <button
                  type="button"
                  part="pill"
                  role="radio"
                  data-value="${escapeHtml(option.value)}"
                  ${option.disabled ? "disabled" : ""}
                >${escapeHtml(option.label)}</button>
              `,
            )
            .join("")}
        </div>
      `;
      this.lastOptionsJson = optionsJson;
    }

    const group = this.rootEl.querySelector('[part="group"]');
    group?.setAttribute("aria-label", this.label);

    const tabbableValue = this.valueInternal || this.selectableOptions()[0]?.value || "";

    this.rootEl.querySelectorAll('[part~="pill"]').forEach(node => {
      const button = node as HTMLButtonElement;
      const optionValue = button.dataset.value ?? "";
      const option = options.find(entry => entry.value === optionValue);
      const isChecked = optionValue === this.valueInternal;
      button.setAttribute("part", isChecked ? "pill pill-checked" : "pill");
      button.setAttribute("aria-checked", String(isChecked));
      button.tabIndex = optionValue === tabbableValue && !option?.disabled ? 0 : -1;
    });

    if (this.hadFocus && this.valueInternal) {
      const active = Array.from(this.rootEl.querySelectorAll('[part~="pill"]')).find(
        node => (node as HTMLButtonElement).dataset.value === this.valueInternal,
      ) as HTMLButtonElement | undefined;
      active?.focus();
      this.hadFocus = false;
    }
  }
}

export const defineBoxCategorySelectorElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxCategorySelectorElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxCategorySelectorElement;
  }

  customElements.define(tagName, BoxCategorySelectorElement);
  return BoxCategorySelectorElement;
};
