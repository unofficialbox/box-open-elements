import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-dropdown";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxDropdownItem = {
  id: string;
  label: string;
};

const dropdownStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="dropdown"] {
    position: relative;
    display: inline-block;
    min-inline-size: 0;
  }

  [part="trigger"] {
    appearance: none;
    font: inherit;
    color: var(--boe-token-text-text, #222222);
    text-align: left;
    padding: 0.6rem 2.35rem 0.6rem 0.85rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    border-radius: 0.7rem;
    background:
      url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' fill='none' stroke='%2352606d' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 0.85rem center / 12px 8px,
      linear-gradient(
        180deg,
        var(--boe-token-surface-surface, #ffffff) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%) 100%
      );
    cursor: pointer;
    transition:
      border-color 140ms ease,
      background 140ms ease,
      box-shadow 140ms ease;
  }

  [part="trigger"]:hover:not(:disabled) {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
  }

  [part="trigger"]:focus-visible {
    outline: none;
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
  }

  [part="trigger"][aria-expanded="true"] {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="trigger"]:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  [part="menu"] {
    position: absolute;
    inset-block-start: calc(100% + 0.35rem);
    inset-inline-start: 0;
    z-index: 20;
    min-inline-size: 100%;
    display: grid;
    gap: 0.15rem;
    padding: 0.35rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    border-radius: 0.75rem;
    background: var(--boe-token-surface-surface, #ffffff);
    box-shadow: 0 12px 30px color-mix(in srgb, #0b1e33 14%, transparent);
  }

  [part="item"] {
    appearance: none;
    border: none;
    font: inherit;
    font-weight: 500;
    color: var(--boe-token-text-text, #222222);
    text-align: left;
    white-space: nowrap;
    padding: 0.55rem 0.7rem;
    border-radius: 0.5rem;
    background: transparent;
    cursor: pointer;
    transition:
      background 140ms ease,
      color 140ms ease;
  }

  [part="item"]:hover {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part="item"]:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 26%, transparent);
    outline-offset: -2px;
  }

  [part="item"][data-selected="true"] {
    background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
    color: var(--boe-token-surface-surface-brand, #0061d5);
  }
`;

export class BoxDropdownElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["disabled", "items", "label", "value"];
  }

  private open = false;
  private valueInternal = "";
  private rootEl!: HTMLElement;
  private triggerEl!: HTMLButtonElement;
  private menuEl: HTMLElement | null = null;

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
    return this.getAttribute("label") ?? "Dropdown";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get items(): BoxDropdownItem[] {
    const raw = this.getAttribute("items");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxDropdownItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set items(value: BoxDropdownItem[]) {
    this.setAttribute("items", JSON.stringify(value));
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

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${dropdownStyles}</style>
      <div part="dropdown">
        <button type="button" part="trigger" aria-haspopup="menu"></button>
      </div>
    `;
    this.rootEl = this.shadowRoot.querySelector('[part="dropdown"]')!;
    this.triggerEl = this.shadowRoot.querySelector('[part="trigger"]')!;
  }

  protected setupListeners(): void {
    this.triggerEl.addEventListener("click", () => {
      if (this.disabled) {
        return;
      }

      this.open = !this.open;
      this.update();
    });

    this.triggerEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (this.disabled) {
        return;
      }

      if (keyboardEvent.key === "ArrowDown" || keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
        keyboardEvent.preventDefault();
        this.open = true;
        this.update();
      }
    });

    this.rootEl.addEventListener("click", event => {
      const itemButton = (event.target as HTMLElement).closest('[part="item"]') as HTMLButtonElement | null;
      if (!itemButton || !this.rootEl.contains(itemButton)) {
        return;
      }

      const itemId = itemButton.getAttribute("data-item-id") ?? "";
      const item = this.items.find(entry => entry.id === itemId);
      if (!item || this.disabled) {
        return;
      }

      this.valueInternal = item.id;
      this.setAttribute("value", item.id);
      this.dispatchEvent(
        new CustomEvent("value-changed", {
          bubbles: true,
          composed: true,
          detail: { value: item.id, item },
        }),
      );
      this.open = false;
      this.update();
    });
  }

  protected update(): void {
    if (!this.triggerEl || !this.rootEl) {
      return;
    }

    const selectedItem = this.items.find(item => item.id === this.valueInternal) ?? null;
    const triggerLabel = selectedItem?.label ?? this.label;

    this.triggerEl.textContent = triggerLabel;
    this.triggerEl.setAttribute("aria-expanded", String(this.open));
    if (this.disabled) {
      this.triggerEl.setAttribute("disabled", "");
    } else {
      this.triggerEl.removeAttribute("disabled");
    }

    if (this.open) {
      if (!this.menuEl) {
        this.menuEl = document.createElement("div");
        this.menuEl.setAttribute("part", "menu");
        this.rootEl.append(this.menuEl);
      }
      this.menuEl.innerHTML = this.items
        .map(
          item => `
            <button
              type="button"
              part="item"
              data-item-id="${escapeHtml(item.id)}"
              data-selected="${String(item.id === this.valueInternal)}"
            >
              ${escapeHtml(item.label)}
            </button>
          `,
        )
        .join("");
    } else if (this.menuEl) {
      this.menuEl.remove();
      this.menuEl = null;
    }
  }
}

export const defineBoxDropdownElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxDropdownElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxDropdownElement;
  }

  customElements.define(tagName, BoxDropdownElement);
  return BoxDropdownElement;
};
