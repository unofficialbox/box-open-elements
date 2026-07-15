import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formDataFromNamedValues,
  formErrorMessageMarkup,
  stringValuesFromFormValue,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { applyRovingTabindex, handleRovingKeydown } from "../../foundations/a11y/index.js";

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

const dualListboxStyles = `
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
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, var(--boe-token-surface-surface, #ffffff) 12%) 0%,
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
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 94%, var(--boe-token-surface-surface-secondary, #fbfbfb) 6%) 0%,
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
    background: color-mix(in srgb, var(--boe-token-surface-item-surface-hover, #eef4fb) 52%, var(--boe-token-surface-surface, #ffffff) 48%);
  }

  [part="option"][aria-selected="true"] {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 14%, var(--boe-token-surface-surface, #ffffff) 86%) 0%,
        color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 72%, var(--boe-token-surface-surface, #ffffff) 28%) 100%
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
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 84%, var(--boe-token-surface-surface, #ffffff) 16%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 4%, var(--boe-token-surface-surface-secondary, #fbfbfb) 80%, var(--boe-token-surface-surface, #ffffff) 16%) 100%
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
        color-mix(in srgb, var(--boe-token-surface-item-surface-hover, #eef4fb) 74%, var(--boe-token-surface-surface, #ffffff) 26%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 6%, var(--boe-token-surface-item-surface-hover, #eef4fb) 68%, var(--boe-token-surface-surface, #ffffff) 26%) 100%
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

  ${boeFormFieldErrorStyles}
`;

export class BoxDualListboxElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "disabled",
      "label",
      "options",
      "value",
    ];
  }

  private availableSelection = new Set<string>();
  private chosenSelection = new Set<string>();
  private valueInternal: string[] = [];
  private legendEl!: HTMLLegendElement;
  private availableListEl!: HTMLElement;
  private selectedListEl!: HTMLElement;
  private moveRightEl!: HTMLButtonElement;
  private moveLeftEl!: HTMLButtonElement;
  private errorEl!: HTMLElement;
  private listsSignature = "";
  private selectionOnlyUpdate = false;

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
    this.syncFormAssociation();
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

  protected getFormValue(): FormValue {
    return formDataFromNamedValues(this.name, this.valueInternal);
  }

  protected restoreFormValue(value: FormValue): void {
    const next = stringValuesFromFormValue(value, this.name);
    this.valueInternal = next;
    this.setAttribute("value", JSON.stringify(next));
    this.syncFormAssociation();
    if (this.isRendered) {
      this.update();
    }
  }

  private emitValueChanged(nextValue: string[]): void {
    this.valueInternal = [...nextValue];
    this.setAttribute("value", JSON.stringify(nextValue));
    this.syncFormAssociation();
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
    if (this.isRendered) {
      this.selectionOnlyUpdate = true;
      this.update();
      this.selectionOnlyUpdate = false;
    }
  }

  private patchSelectionState(): void {
    const patchList = (listEl: HTMLElement, selection: Set<string>) => {
      listEl.querySelectorAll('[part="option"]').forEach(node => {
        const button = node as HTMLButtonElement;
        const selected = selection.has(button.dataset.value ?? "");
        button.setAttribute("aria-selected", String(selected));
      });
    };

    patchList(this.availableListEl, this.availableSelection);
    patchList(this.selectedListEl, this.chosenSelection);
  }

  private listsKey(availableItems: DualListboxOption[], selectedItems: DualListboxOption[]): string {
    return JSON.stringify({
      available: availableItems.map(option => [option.value, option.label, Boolean(option.disabled)]),
      selected: selectedItems.map(option => [option.value, option.label, Boolean(option.disabled)]),
      disabled: this.disabled,
    });
  }

  private renderListItems(list: "available" | "selected", items: DualListboxOption[]): string {
    const selection = list === "available" ? this.availableSelection : this.chosenSelection;
    if (!items.length) {
      return `<div part="empty">No items</div>`;
    }

    return items
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
      .join("");
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${dualListboxStyles}</style>
      <fieldset part="field">
        <legend part="label"></legend>
        <div part="layout">
          <div part="available-panel">
            <strong part="list-label">Available</strong>
            <div part="list" role="listbox" aria-label="Available" aria-multiselectable="true" data-list="available"></div>
          </div>
          <div part="actions">
            <button type="button" part="move-right" aria-label="Move selected items to chosen list">&gt;</button>
            <button type="button" part="move-left" aria-label="Move selected items to available list">&lt;</button>
          </div>
          <div part="selected-panel">
            <strong part="list-label">Chosen</strong>
            <div part="list" role="listbox" aria-label="Chosen" aria-multiselectable="true" data-list="selected"></div>
          </div>
        </div>
        ${formErrorMessageMarkup()}
      </fieldset>
    `;
    this.legendEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.availableListEl = this.shadowRoot.querySelector('[data-list="available"]')!;
    this.selectedListEl = this.shadowRoot.querySelector('[data-list="selected"]')!;
    this.moveRightEl = this.shadowRoot.querySelector('[part="move-right"]')!;
    this.moveLeftEl = this.shadowRoot.querySelector('[part="move-left"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    const handleListClick = (event: Event) => {
      const button = (event.target as HTMLElement).closest('[part="option"]') as HTMLButtonElement | null;
      if (!button) {
        return;
      }
      const list = (button.dataset.list as "available" | "selected") ?? "available";
      const value = button.dataset.value ?? "";
      if (!value || this.disabled || button.disabled) {
        return;
      }
      this.toggleSelection(list, value);
    };

    const handleListKeydown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      const listEl = keyboardEvent.currentTarget as HTMLElement;
      const options = Array.from(
        listEl.querySelectorAll<HTMLButtonElement>('[part="option"]:not([disabled])'),
      );
      if (handleRovingKeydown(keyboardEvent, options, { orientation: "vertical" })) {
        return;
      }
      if (keyboardEvent.key !== " " && keyboardEvent.key !== "Enter") {
        return;
      }
      const button = (keyboardEvent.target as HTMLElement).closest(
        '[part="option"]',
      ) as HTMLButtonElement | null;
      if (!button || button.disabled || this.disabled) {
        return;
      }
      keyboardEvent.preventDefault();
      const list = (button.dataset.list as "available" | "selected") ?? "available";
      this.toggleSelection(list, button.dataset.value ?? "");
    };

    this.availableListEl.addEventListener("click", handleListClick);
    this.selectedListEl.addEventListener("click", handleListClick);
    this.availableListEl.addEventListener("keydown", handleListKeydown);
    this.selectedListEl.addEventListener("keydown", handleListKeydown);
    this.moveRightEl.addEventListener("click", () => this.moveSelected("to-selected"));
    this.moveLeftEl.addEventListener("click", () => this.moveSelected("to-available"));
  }

  private syncListRoving(listEl: HTMLElement): void {
    const options = Array.from(
      listEl.querySelectorAll<HTMLButtonElement>('[part="option"]:not([disabled])'),
    );
    const selectedIndex = Math.max(
      0,
      options.findIndex(button => button.getAttribute("aria-selected") === "true"),
    );
    applyRovingTabindex(options, selectedIndex);
  }

  protected update(): void {
    if (!this.legendEl || !this.availableListEl || !this.selectedListEl || !this.errorEl) {
      return;
    }

    this.legendEl.textContent = this.label;

    if (this.selectionOnlyUpdate) {
      this.patchSelectionState();
      return;
    }

    const selectedSet = new Set(this.valueInternal);
    const availableItems = this.options.filter(option => !selectedSet.has(option.value));
    const selectedItems = this.options.filter(option => selectedSet.has(option.value));
    const nextSignature = this.listsKey(availableItems, selectedItems);

    if (nextSignature !== this.listsSignature || this.availableListEl.childElementCount === 0) {
      this.listsSignature = nextSignature;
      this.availableListEl.innerHTML = this.renderListItems("available", availableItems);
      this.selectedListEl.innerHTML = this.renderListItems("selected", selectedItems);
    } else {
      this.patchSelectionState();
    }

    this.syncListRoving(this.availableListEl);
    this.syncListRoving(this.selectedListEl);

    if (this.disabled) {
      this.moveRightEl.setAttribute("disabled", "");
      this.moveLeftEl.setAttribute("disabled", "");
    } else {
      this.moveRightEl.removeAttribute("disabled");
      this.moveLeftEl.removeAttribute("disabled");
    }

    const focusableControls = [
      ...Array.from(this.availableListEl.querySelectorAll<HTMLButtonElement>('[part="option"]')),
      ...Array.from(this.selectedListEl.querySelectorAll<HTMLButtonElement>('[part="option"]')),
      this.moveRightEl,
      this.moveLeftEl,
    ];
    this.applyInvalidStateToControls(focusableControls, this.errorEl);
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
