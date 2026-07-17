import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeControl, boeOverlay, boeRadius, boeSpace } from "../../foundations/geometry/index.js";
import {
  FocusRestore,
  applyRovingTabindex,
  focusRovingItem,
  nextRovingIndex,
} from "../../foundations/a11y/index.js";
import {
  boeFocusVisibleStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

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
    font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
  }

  [part="dropdown"] {
    position: relative;
    display: inline-block;
    min-inline-size: 0;
  }

  [part="trigger"] {
    appearance: none;
    box-sizing: border-box;
    min-height: ${boeControl.height};
    font: inherit;
    font-size: ${boeControl.fontSize};
    font-weight: 700;
    letter-spacing: ${boeControl.letterSpacing};
    color: var(--boe-token-text-text, #222222);
    text-align: left;
    padding: 0 ${boeSpace[12]} 0 ${boeSpace[3]};
    border: 1px solid ${boeControl.buttonBorder};
    border-radius: ${boeRadius.med};
    background:
      url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5 11 1.5' fill='none' stroke='%236f6f6f' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 10px center / 12px 8px,
      var(--boe-token-surface-surface, #ffffff);
    cursor: pointer;
    transition:
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      background ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="trigger"]:hover:not(:disabled) {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
  }

  [part="trigger"]:active:not(:disabled) {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
  }

  ${boeFocusVisibleStyles('[part="trigger"]')}

  [part="trigger"]:focus-visible {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="trigger"][aria-expanded="true"] {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="trigger"]:disabled {
    opacity: ${boeControl.disabledOpacity};
    cursor: not-allowed;
    box-shadow: none;
  }

  [part="menu"] {
    position: absolute;
    inset-block-start: calc(100% + ${boeSpace[1]});
    inset-inline-start: 0;
    z-index: 20;
    min-inline-size: max(100%, 200px);
    display: grid;
    gap: 0;
    padding: ${boeOverlay.padding};
    border: ${boeOverlay.border};
    border-radius: ${boeOverlay.radius};
    background: var(--boe-token-surface-surface, #ffffff);
    box-shadow: ${boeOverlay.shadow};
  }

  [part="item"] {
    appearance: none;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    min-height: ${boeOverlay.itemMinHeight};
    border: none;
    font: inherit;
    font-size: ${boeControl.fontSize};
    font-weight: 400;
    color: var(--boe-token-text-text, #222222);
    text-align: left;
    white-space: nowrap;
    padding: ${boeOverlay.itemPadding};
    border-radius: ${boeOverlay.itemRadius};
    background: transparent;
    cursor: pointer;
    transition:
      background ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  ${boeNeutralInteractiveStyles('[part="item"]')}

  [part="item"]:hover:not(:disabled),
  [part="item"]:focus-visible:not(:disabled) {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part="item"][data-selected="true"],
  [part="item"][aria-selected="true"] {
    background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
    color: var(--boe-token-surface-surface-brand, #0061d5);
    font-weight: 700;
  }

  ${boeFormFieldErrorStyles}

  :host([invalid]) [part="trigger"] {
    border-color: var(--boe-token-surface-status-surface-error, #ed3757);
  }

  :host([invalid]) [part="trigger"]:focus-visible {
    border-color: var(--boe-token-surface-status-surface-error, #ed3757);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 22%, transparent);
  }
`;

export class BoxDropdownElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "disabled",
      "items",
      "label",
      "value",
    ];
  }

  private open = false;
  private valueInternal = "";
  private rootEl!: HTMLElement;
  private triggerEl!: HTMLButtonElement;
  private errorEl!: HTMLElement;
  private menuEl: HTMLElement | null = null;
  private readonly focusRestore = new FocusRestore();
  private readonly onDocumentPointerDown = (event: PointerEvent): void => {
    const path = event.composedPath();
    if (path.includes(this)) {
      return;
    }
    this.closeMenu(true);
  };

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
    this.syncFormAssociation();
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

  protected getFormValue(): FormValue {
    return this.valueInternal;
  }

  protected restoreFormValue(value: FormValue): void {
    const next = typeof value === "string" ? value : "";
    this.valueInternal = next;
    this.setAttribute("value", next);
    this.syncFormAssociation();
    if (this.isRendered) {
      this.update();
    }
  }

  disconnectedCallback(): void {
    document.removeEventListener("pointerdown", this.onDocumentPointerDown);
    super.disconnectedCallback();
  }

  private openMenu(): void {
    if (this.disabled || this.open) {
      return;
    }
    this.focusRestore.capture(this.triggerEl);
    this.open = true;
    document.addEventListener("pointerdown", this.onDocumentPointerDown);
    this.update();
    queueMicrotask(() => {
      const items = this.menuItems();
      const selectedIndex = Math.max(
        0,
        items.findIndex(button => button.getAttribute("data-item-id") === this.valueInternal),
      );
      focusRovingItem(items, selectedIndex >= 0 ? selectedIndex : 0);
    });
  }

  private closeMenu(restoreFocus: boolean): void {
    if (!this.open) {
      return;
    }
    this.open = false;
    document.removeEventListener("pointerdown", this.onDocumentPointerDown);
    this.update();
    if (restoreFocus) {
      this.focusRestore.restore();
    } else {
      this.focusRestore.clear();
    }
  }

  private selectItem(itemId: string): void {
    const item = this.items.find(entry => entry.id === itemId);
    if (!item || this.disabled) {
      return;
    }

    this.valueInternal = item.id;
    this.setAttribute("value", item.id);
    this.syncFormAssociation();
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: item.id, item },
      }),
    );
    this.closeMenu(true);
  }

  private menuItems(): HTMLButtonElement[] {
    if (!this.menuEl) {
      return [];
    }
    return Array.from(this.menuEl.querySelectorAll<HTMLButtonElement>('[part="item"]'));
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${dropdownStyles}</style>
      <div part="dropdown">
        <button type="button" part="trigger" aria-haspopup="listbox"></button>
        ${formErrorMessageMarkup()}
      </div>
    `;
    this.rootEl = this.shadowRoot.querySelector('[part="dropdown"]')!;
    this.triggerEl = this.shadowRoot.querySelector('[part="trigger"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    this.triggerEl.addEventListener("click", () => {
      if (this.disabled) {
        return;
      }
      if (this.open) {
        this.closeMenu(true);
      } else {
        this.openMenu();
      }
    });

    this.triggerEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (this.disabled) {
        return;
      }

      if (keyboardEvent.key === "ArrowDown" || keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
        keyboardEvent.preventDefault();
        this.openMenu();
        return;
      }

      if (keyboardEvent.key === "Escape" && this.open) {
        keyboardEvent.preventDefault();
        this.closeMenu(true);
      }
    });

    this.rootEl.addEventListener("click", event => {
      const itemButton = (event.target as HTMLElement).closest('[part="item"]') as HTMLButtonElement | null;
      if (!itemButton || !this.rootEl.contains(itemButton)) {
        return;
      }
      this.selectItem(itemButton.getAttribute("data-item-id") ?? "");
    });

    this.rootEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      const itemButton = (keyboardEvent.target as HTMLElement).closest(
        '[part="item"]',
      ) as HTMLButtonElement | null;
      if (!itemButton || !this.rootEl.contains(itemButton)) {
        return;
      }

      if (keyboardEvent.key === "Escape") {
        keyboardEvent.preventDefault();
        this.closeMenu(true);
        return;
      }

      if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
        keyboardEvent.preventDefault();
        this.selectItem(itemButton.getAttribute("data-item-id") ?? "");
        return;
      }

      const items = this.menuItems();
      const currentIndex = items.indexOf(itemButton);
      const nextIndex = nextRovingIndex(keyboardEvent.key, currentIndex, items.length, {
        orientation: "vertical",
      });
      if (nextIndex == null) {
        return;
      }
      keyboardEvent.preventDefault();
      focusRovingItem(items, nextIndex);
    });
  }

  protected update(): void {
    if (!this.triggerEl || !this.rootEl || !this.errorEl) {
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
        this.menuEl.setAttribute("role", "listbox");
        this.menuEl.setAttribute("aria-label", this.label);
        this.rootEl.append(this.menuEl);
      }
      this.menuEl.innerHTML = this.items
        .map(
          item => `
            <button
              type="button"
              part="item"
              role="option"
              data-item-id="${escapeHtml(item.id)}"
              data-selected="${String(item.id === this.valueInternal)}"
              aria-selected="${String(item.id === this.valueInternal)}"
            >
              ${escapeHtml(item.label)}
            </button>
          `,
        )
        .join("");
      const items = this.menuItems();
      const selectedIndex = Math.max(
        0,
        items.findIndex(button => button.getAttribute("data-item-id") === this.valueInternal),
      );
      applyRovingTabindex(items, selectedIndex);
    } else if (this.menuEl) {
      this.menuEl.remove();
      this.menuEl = null;
    }

    this.applyInvalidState(this.triggerEl, this.errorEl);
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
