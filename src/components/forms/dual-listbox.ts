const DEFAULT_TAG_NAME = "box-dual-listbox";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type DualListboxOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

export class BoxDualListboxElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "options", "value"];
  }

  private availableSelection = new Set<string>();
  private chosenSelection = new Set<string>();
  private valueInternal: string[] = [];

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
    return this.getAttribute("label") ?? "Dual Listbox";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get options(): DualListboxOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as DualListboxOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: DualListboxOption[]) {
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

  private emitValueChanged(nextValue: string[]): void {
    this.valueInternal = [...nextValue];
    this.setAttribute("value", JSON.stringify(nextValue));
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: [...nextValue] },
      }),
    );
  }

  private moveSelected(direction: "to-selected" | "to-available"): void {
    if (this.disabled) {
      return;
    }

    if (direction === "to-selected") {
      const moving = this.options
        .filter(option => this.availableSelection.has(option.value) && !option.disabled)
        .map(option => option.value);
      if (moving.length === 0) {
        return;
      }
      const nextValue = this.options
        .map(option => option.value)
        .filter(value => this.valueInternal.includes(value) || moving.includes(value));
      this.availableSelection.clear();
      this.emitValueChanged(nextValue);
      return;
    }

    const moving = this.options
      .filter(option => this.chosenSelection.has(option.value) && !option.disabled)
      .map(option => option.value);
    if (moving.length === 0) {
      return;
    }
    const nextValue = this.valueInternal.filter(value => !moving.includes(value));
    this.chosenSelection.clear();
    this.emitValueChanged(nextValue);
  }

  private toggleSelection(list: "available" | "selected", value: string): void {
    const set = list === "available" ? this.availableSelection : this.chosenSelection;
    if (set.has(value)) {
      set.delete(value);
    } else {
      set.add(value);
    }
    this.render();
  }

  private renderList(
    list: "available" | "selected",
    items: DualListboxOption[],
    listLabel: string,
  ): string {
    const selection = list === "available" ? this.availableSelection : this.chosenSelection;
    const itemsMarkup = items.length
      ? items
          .map(
            option => `
              <button
                type="button"
                part="option"
                role="option"
                data-list="${list}"
                data-value="${escapeHtml(option.value)}"
                aria-selected="${String(selection.has(option.value))}"
                ${option.disabled || this.disabled ? "disabled" : ""}
              >
                ${escapeHtml(option.label)}
              </button>
            `,
          )
          .join("")
      : `<div part="empty">No items</div>`;

    return `
      <div part="${list}-panel">
        <strong part="list-label">${escapeHtml(listLabel)}</strong>
        <div part="list" role="listbox" aria-label="${escapeHtml(listLabel)}" aria-multiselectable="true">
          ${itemsMarkup}
        </div>
      </div>
    `;
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const selectedSet = new Set(this.valueInternal);
    const availableItems = this.options.filter(option => !selectedSet.has(option.value));
    const selectedItems = this.options.filter(option => selectedSet.has(option.value));

    this.shadowRoot.innerHTML = `
      <style>
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
        }

        [part="label"] {
          margin: 0 0 0.9rem;
          padding: 0;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        [part="layout"] {
          display: flex;
          align-items: stretch;
          gap: 1rem;
          min-inline-size: 0;
        }

        [part="available-panel"],
        [part="selected-panel"] {
          flex: 1 1 0;
          min-inline-size: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 1.05rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, white 12%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 4%, var(--boe-token-surface-surface, #ffffff) 82%, var(--boe-token-surface-surface-secondary, #fbfbfb) 14%) 100%
            );
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.8),
            0 12px 24px rgba(15, 23, 42, 0.04);
        }

        [part="list-label"] {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          opacity: 0.75;
        }

        [part="list"] {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          min-block-size: 14rem;
          max-block-size: 18rem;
          overflow: auto;
        }

        [part="option"] {
          width: 100%;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 64%, transparent);
          border-radius: 0.95rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 94%, white 6%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 10%, var(--boe-token-surface-surface, #ffffff) 90%) 100%
            );
          color: inherit;
          font: inherit;
          text-align: left;
          padding: 0.8rem 0.95rem;
          cursor: pointer;
          transition:
            border-color 140ms ease,
            background 140ms ease,
            transform 140ms ease;
        }

        [part="option"]:hover:not(:disabled) {
          border-color: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 100%, transparent);
          background: color-mix(in srgb, var(--boe-token-surface-item-surface-hover, #eef4fb) 52%, white 48%);
        }

        [part="option"][aria-selected="true"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 14%, white 86%) 0%,
              color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 72%, white 28%) 100%
            );
          box-shadow: inset 0 0 0 1px rgba(0, 97, 213, 0.06);
        }

        [part="option"]:focus-visible,
        [part="move-right"]:focus-visible,
        [part="move-left"]:focus-visible {
          outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5);
          outline-offset: 2px;
        }

        [part="option"]:disabled,
        [part="move-right"]:disabled,
        [part="move-left"]:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        [part="actions"] {
          flex: 0 0 auto;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.75rem;
          padding-block: 2.25rem 0;
          padding-inline: 0.15rem;
        }

        [part="move-right"],
        [part="move-left"] {
          inline-size: 2.9rem;
          block-size: 2.9rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 88%, transparent);
          border-radius: 0.95rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 84%, white 16%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 4%, var(--boe-token-surface-surface-secondary, #fbfbfb) 80%, white 16%) 100%
            );
          color: inherit;
          font: inherit;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition:
            border-color 140ms ease,
            background 140ms ease,
            transform 140ms ease;
        }

        [part="move-right"]:hover:not(:disabled),
        [part="move-left"]:hover:not(:disabled) {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-item-surface-hover, #eef4fb) 74%, white 26%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 6%, var(--boe-token-surface-item-surface-hover, #eef4fb) 68%, white 26%) 100%
            );
        }

        [part="empty"] {
          display: grid;
          place-items: center;
          min-block-size: 100%;
          border: 1px dashed rgba(214, 224, 234, 0.72);
          border-radius: 0.9rem;
          padding: 1rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 65%, transparent);
          text-align: center;
        }

        @media (max-width: 720px) {
          [part="layout"] {
            flex-direction: column;
          }

          [part="actions"] {
            flex-direction: row;
            justify-content: center;
            padding-block: 0;
          }
        }
      </style>
      <fieldset part="field">
        <legend part="label">${escapeHtml(this.label)}</legend>
        <div part="layout">
          ${this.renderList("available", availableItems, "Available")}
          <div part="actions">
            <button type="button" part="move-right" aria-label="Move selected items to chosen list" ${this.disabled ? "disabled" : ""}>&gt;</button>
            <button type="button" part="move-left" aria-label="Move selected items to available list" ${this.disabled ? "disabled" : ""}>&lt;</button>
          </div>
          ${this.renderList("selected", selectedItems, "Chosen")}
        </div>
      </fieldset>
    `;

    this.shadowRoot.querySelectorAll('[part="option"]').forEach(node => {
      node.addEventListener("click", event => {
        const button = event.currentTarget as HTMLButtonElement;
        const list = (button.dataset.list as "available" | "selected") ?? "available";
        const value = button.dataset.value ?? "";
        if (!value || this.disabled || button.disabled) {
          return;
        }
        this.toggleSelection(list, value);
      });
    });

    this.shadowRoot.querySelector('[part="move-right"]')?.addEventListener("click", () => {
      this.moveSelected("to-selected");
    });
    this.shadowRoot.querySelector('[part="move-left"]')?.addEventListener("click", () => {
      this.moveSelected("to-available");
    });
  }
}

export const defineBoxDualListboxElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxDualListboxElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxDualListboxElement;
  }

  customElements.define(tagName, BoxDualListboxElement);
  return BoxDualListboxElement;
};
