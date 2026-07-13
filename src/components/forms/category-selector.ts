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

/**
 * A single-select category picker rendered as a horizontal radiogroup of pills —
 * a filter bar for switching one active category (distinct from the multi-select
 * `box-pill-cloud`). Data arrives via `options`; the active value is exposed as
 * `value` and announced with `value-changed`. Follows the radiogroup keyboard
 * pattern: arrow keys move selection with roving `tabindex`.
 */
export class BoxCategorySelectorElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "options", "value"];
  }

  private valueInternal = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

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

    this.valueInternal = value;
    this.setAttribute("value", value);
    this.render();
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    // Remember whether focus was inside the group before this re-render (a click
    // or arrow keypress), so we can move it to the newly checked pill afterwards
    // without stealing focus on the initial render.
    const hadFocus = this.shadowRoot.activeElement !== null;
    const options = this.options;
    // The tabbable pill is the selected one, else the first selectable — so the
    // group is a single tab stop that arrow keys then navigate.
    const tabbableValue = this.valueInternal || this.selectableOptions()[0]?.value || "";

    const pills = options
      .map(option => {
        const isChecked = option.value === this.valueInternal;
        const pillPart = isChecked ? "pill pill-checked" : "pill";
        return `
          <button
            type="button"
            part="${pillPart}"
            role="radio"
            data-value="${escapeHtml(option.value)}"
            aria-checked="${String(isChecked)}"
            tabindex="${option.value === tabbableValue && !option.disabled ? "0" : "-1"}"
            ${option.disabled ? "disabled" : ""}
          >${escapeHtml(option.label)}</button>
        `;
      })
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
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
      </style>
      ${
        options.length
          ? `<div part="group" role="radiogroup" aria-label="${escapeHtml(this.label)}">${pills}</div>`
          : `<div part="empty">No categories</div>`
      }
    `;

    for (const pill of Array.from(this.shadowRoot.querySelectorAll('[part~="pill"]'))) {
      const button = pill as HTMLButtonElement;
      button.addEventListener("click", () => this.select(button.dataset.value ?? ""));
      button.addEventListener("keydown", event => {
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

    // Radiogroup keyboard navigation moves focus with selection; keep focus on
    // the checked pill after a click- or arrow-driven change.
    if (hadFocus && this.valueInternal) {
      const active = Array.from(this.shadowRoot.querySelectorAll('[part~="pill"]')).find(
        node => (node as HTMLButtonElement).dataset.value === this.valueInternal,
      ) as HTMLButtonElement | undefined;
      active?.focus();
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
