import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formDataFromNamedValues,
  formErrorMessageMarkup,
  stringValuesFromFormValue,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-pill-selector-dropdown";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type PillOption = {
  value: string;
  label: string;
};

const pillSelectorStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="field"] {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: ${boeRadius.control};
    background: var(--boe-token-surface-surface, #ffffff);
  }

  [part="pill"] {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.2rem 0.3rem 0.2rem 0.6rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 70%, var(--boe-token-surface-surface, #ffffff) 30%);
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    font-size: 0.82rem;
    font-weight: 600;
  }

  [part="pill-remove"] {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 1.1rem;
    block-size: 1.1rem;
    padding: 0;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    cursor: pointer;
  }

  [part="pill-remove"] svg {
    inline-size: 0.65rem;
    block-size: 0.65rem;
  }

  [part="pill-remove"]:hover {
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, transparent);
    color: var(--boe-token-text-text, #222222);
  }

  [part="dropdown"] {
    position: relative;
    display: inline-block;
  }

  [part="custom-input"] {
    flex: 1 1 6rem;
    min-width: 6rem;
    appearance: none;
    border: none;
    outline: none;
    background: transparent;
    color: var(--boe-token-text-text, #222222);
    font: inherit;
    font-size: 0.85rem;
    padding: 0.3rem 0.2rem;
  }

  [part="custom-input"][hidden] {
    display: none;
  }

  [part="custom-input"][aria-invalid="true"] {
    color: var(--boe-token-surface-status-surface-error, #ed3757);
  }

  [part="trigger"][hidden] {
    display: none;
  }

  [part="trigger"] {
    appearance: none;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.6rem;
    border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: 999px;
    background: transparent;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }

  [part="trigger"]:hover {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
    color: var(--boe-token-text-text, #222222);
  }

  [part="trigger"]:focus-visible,
  [part="option"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, transparent);
  }

  [part="menu"] {
    position: absolute;
    z-index: 10;
    inset-block-start: calc(100% + 0.25rem);
    inset-inline-start: 0;
    min-inline-size: 11rem;
    margin: 0;
    padding: 0.3rem;
    list-style: none;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    border-radius: ${boeRadius.large};
    background: var(--boe-token-surface-surface, #ffffff);
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
  }

  [part="option"] {
    appearance: none;
    display: block;
    inline-size: 100%;
    text-align: start;
    padding: 0.4rem 0.55rem;
    border: 0;
    border-radius: ${boeRadius.med};
    background: transparent;
    color: var(--boe-token-text-text, #222222);
    font: inherit;
    font-size: 0.85rem;
    cursor: pointer;
  }

  [part="option"]:hover {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part="option-empty"] {
    padding: 0.4rem 0.55rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-size: 0.82rem;
  }

  ${boeFormFieldErrorStyles}
`;

/**
 * A multi-select pill field: the current selection shows as removable pills, and
 * an "Add" dropdown offers the remaining options. Data arrives via `options`;
 * the selection is exposed as `value` (a string[]) and every add/remove emits
 * `value-changed`. The popup is a `role="menu"` of `role="menuitem"` buttons —
 * opening focuses the first item; ArrowUp/Down/Home/End move focus, Escape (or
 * moving focus outside) closes and returns focus to the trigger.
 */
export class BoxPillSelectorDropdownElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "label",
      "options",
      "placeholder",
      "value",
      "allow-custom",
      "pattern",
    ];
  }

  private valueInternal: string[] = [];
  private open = false;
  private menuFocusValue: string | null = null;
  private pendingFocus: "menu" | "trigger" | null = null;

  private fieldEl!: HTMLElement;
  private pillsEl!: HTMLElement;
  private dropdownEl!: HTMLElement;
  private triggerEl!: HTMLButtonElement;
  private menuEl: HTMLUListElement | null = null;
  private errorEl!: HTMLElement;

  // Close the open menu when a pointer press lands outside this element. Bound
  // once so it can be added/removed cleanly; a focusout listener can't be used
  // because every interaction re-renders and transiently drops focus to body.
  private readonly onOutsidePointer = (event: Event): void => {
    if (!this.open) {
      return;
    }
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    if (!path.some(node => node === this)) {
      this.closeMenu(false);
    }
  };

  get label(): string {
    return this.getAttribute("label") ?? "Selection";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "Add";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
  }

  /** Allow creating pills from free-typed text (collaborator / email input). */
  get allowCustom(): boolean {
    return this.hasAttribute("allow-custom");
  }

  set allowCustom(value: boolean) {
    this.toggleAttribute("allow-custom", Boolean(value));
  }

  /** Optional regex a custom entry must match (e.g. an email pattern). */
  get pattern(): string {
    return this.getAttribute("pattern") ?? "";
  }

  set pattern(value: string) {
    if (value) {
      this.setAttribute("pattern", value);
    } else {
      this.removeAttribute("pattern");
    }
  }

  private customInputEl: HTMLInputElement | null = null;

  /** A custom entry is valid when non-empty and (if set) matches `pattern`. */
  private isValidCustom(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) {
      return false;
    }
    const pattern = this.pattern;
    if (!pattern) {
      return true;
    }
    try {
      return new RegExp(`^(?:${pattern})$`).test(trimmed);
    } catch {
      return true;
    }
  }

  /** Add a validated custom pill; flag the input and emit `invalid-entry` otherwise. */
  private tryAddCustom(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) {
      return false;
    }
    if (!this.isValidCustom(trimmed)) {
      this.customInputEl?.setAttribute("aria-invalid", "true");
      this.dispatchEvent(
        new CustomEvent("invalid-entry", { bubbles: true, composed: true, detail: { value: trimmed } }),
      );
      return false;
    }
    this.customInputEl?.setAttribute("aria-invalid", "false");
    this.addValue(trimmed);
    return true;
  }

  get options(): PillOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as PillOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: PillOption[]) {
    this.setAttribute("options", JSON.stringify(value));
  }

  get value(): string[] {
    return [...this.valueInternal];
  }

  set value(nextValue: string[]) {
    this.valueInternal = [...nextValue];
    this.setAttribute("value", JSON.stringify(nextValue));
    this.syncFormAssociation();
    if (this.isRendered) {
      this.update();
    }
  }

  disconnectedCallback(): void {
    document.removeEventListener("pointerdown", this.onOutsidePointer);
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

  private availableOptions(): PillOption[] {
    return this.options.filter(option => !this.valueInternal.includes(option.value));
  }

  private labelFor(value: string): string {
    return this.options.find(option => option.value === value)?.label ?? value;
  }

  private commit(next: string[]): void {
    this.valueInternal = next;
    const serialized = JSON.stringify(next);
    // Render exactly once: setAttribute already triggers attributeChangedCallback
    // (which updates), so only update manually when the attribute is unchanged.
    if (this.getAttribute("value") === serialized) {
      if (this.isRendered) {
        this.update();
      }
    } else {
      this.setAttribute("value", serialized);
    }
    this.syncFormAssociation();
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: [...next] },
      }),
    );
  }

  private addValue(value: string): void {
    if (!value || this.valueInternal.includes(value)) {
      return;
    }

    const next = [...this.valueInternal, value];
    const remaining = this.options.filter(option => !next.includes(option.value));
    this.menuFocusValue = remaining[0]?.value ?? null;
    this.pendingFocus = remaining.length ? "menu" : "trigger";
    this.commit(next);
  }

  private removeValue(value: string): void {
    if (!this.valueInternal.includes(value)) {
      return;
    }
    this.pendingFocus = "trigger";
    this.commit(this.valueInternal.filter(item => item !== value));
  }

  private openMenu(): void {
    if (this.open) {
      return;
    }
    this.open = true;
    this.menuFocusValue = this.availableOptions()[0]?.value ?? null;
    this.pendingFocus = this.menuFocusValue ? "menu" : null;
    document.addEventListener("pointerdown", this.onOutsidePointer);
    this.update();
  }

  private closeMenu(focusTrigger: boolean): void {
    if (!this.open) {
      return;
    }
    this.open = false;
    this.menuFocusValue = null;
    this.pendingFocus = focusTrigger ? "trigger" : null;
    document.removeEventListener("pointerdown", this.onOutsidePointer);
    this.update();
  }

  private moveMenuFocus(delta: number): void {
    const available = this.availableOptions();
    if (!available.length) {
      return;
    }

    const currentIndex = available.findIndex(option => option.value === this.menuFocusValue);
    const nextIndex = Math.max(0, Math.min(available.length - 1, currentIndex + delta));
    this.menuFocusValue = available[nextIndex]?.value ?? null;
    this.pendingFocus = "menu";
    this.update();
  }

  private moveMenuFocusTo(edge: "first" | "last"): void {
    const available = this.availableOptions();
    if (!available.length) {
      return;
    }
    this.menuFocusValue = (edge === "first" ? available[0] : available[available.length - 1])?.value ?? null;
    this.pendingFocus = "menu";
    this.update();
  }

  private applyPendingFocus(): void {
    if (!this.pendingFocus) {
      return;
    }

    const pending = this.pendingFocus;
    this.pendingFocus = null;

    if (pending === "trigger") {
      this.triggerEl.focus();
      return;
    }

    if (pending === "menu" && this.menuFocusValue && this.menuEl) {
      const target = Array.from(this.menuEl.querySelectorAll('[part="option"]')).find(
        node => (node as HTMLButtonElement).dataset.value === this.menuFocusValue,
      ) as HTMLButtonElement | undefined;
      target?.focus();
    }
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${pillSelectorStyles}</style>
      <div part="field" role="group">
        <span part="pills"></span>
        <input part="custom-input" type="text" hidden />
        <div part="dropdown">
          <button type="button" part="trigger" aria-haspopup="menu"></button>
        </div>
        ${formErrorMessageMarkup()}
      </div>
    `;
    this.fieldEl = this.shadowRoot.querySelector('[part="field"]')!;
    this.pillsEl = this.shadowRoot.querySelector('[part="pills"]')!;
    this.customInputEl = this.shadowRoot.querySelector('[part="custom-input"]')!;
    this.dropdownEl = this.shadowRoot.querySelector('[part="dropdown"]')!;
    this.triggerEl = this.shadowRoot.querySelector('[part="trigger"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    this.triggerEl.addEventListener("click", () => {
      if (this.open) {
        this.closeMenu(true);
      } else {
        this.openMenu();
      }
    });
    this.triggerEl.addEventListener("keydown", event => {
      const key = (event as KeyboardEvent).key;
      if ((key === "ArrowDown" || key === "Enter" || key === " ") && !this.open) {
        event.preventDefault();
        this.openMenu();
      } else if (key === "Escape" && this.open) {
        event.preventDefault();
        this.closeMenu(true);
      }
    });

    this.pillsEl.addEventListener("click", event => {
      const remove = (event.target as HTMLElement).closest(
        '[part="pill-remove"]',
      ) as HTMLButtonElement | null;
      if (!remove || !this.pillsEl.contains(remove)) {
        return;
      }
      this.removeValue(remove.dataset.value ?? "");
    });

    // Custom pill entry: Enter/comma commit the typed value; Backspace on an
    // empty input removes the last pill; paste splits on commas/newlines.
    this.customInputEl?.addEventListener("keydown", event => {
      const input = event.target as HTMLInputElement;
      const key = (event as KeyboardEvent).key;
      if (key === "Enter" || key === ",") {
        event.preventDefault();
        if (this.tryAddCustom(input.value)) {
          input.value = "";
        }
      } else if (key === "Backspace" && input.value === "" && this.valueInternal.length) {
        event.preventDefault();
        this.removeValue(this.valueInternal[this.valueInternal.length - 1]);
      } else {
        input.setAttribute("aria-invalid", "false");
      }
    });

    this.customInputEl?.addEventListener("paste", event => {
      const text = event.clipboardData?.getData("text") ?? "";
      if (!/[,\n;]/.test(text)) {
        return; // single token — let it type normally
      }
      event.preventDefault();
      for (const piece of text.split(/[,\n;]+/)) {
        this.tryAddCustom(piece);
      }
      (event.target as HTMLInputElement).value = "";
    });

    // Commit a half-typed entry when focus leaves the input.
    this.customInputEl?.addEventListener("blur", () => {
      if (this.customInputEl && this.tryAddCustom(this.customInputEl.value)) {
        this.customInputEl.value = "";
      }
    });

    this.dropdownEl.addEventListener("click", event => {
      const option = (event.target as HTMLElement).closest(
        '[part="option"]',
      ) as HTMLButtonElement | null;
      if (!option || !this.dropdownEl.contains(option)) {
        return;
      }
      this.addValue(option.dataset.value ?? "");
    });

    this.dropdownEl.addEventListener("keydown", event => {
      const option = (event.target as HTMLElement).closest(
        '[part="option"]',
      ) as HTMLButtonElement | null;
      if (!option || !this.dropdownEl.contains(option)) {
        return;
      }
      const keyboardEvent = event as KeyboardEvent;
      switch (keyboardEvent.key) {
        case "ArrowDown":
          keyboardEvent.preventDefault();
          this.moveMenuFocus(1);
          break;
        case "ArrowUp":
          keyboardEvent.preventDefault();
          this.moveMenuFocus(-1);
          break;
        case "Home":
          keyboardEvent.preventDefault();
          this.moveMenuFocusTo("first");
          break;
        case "End":
          keyboardEvent.preventDefault();
          this.moveMenuFocusTo("last");
          break;
        case "Escape":
          keyboardEvent.preventDefault();
          this.closeMenu(true);
          break;
        default:
          break;
      }
    });
  }

  protected update(): void {
    if (!this.fieldEl || !this.pillsEl || !this.triggerEl || !this.errorEl) {
      return;
    }

    this.fieldEl.setAttribute("aria-label", this.label);
    this.triggerEl.textContent = `+ ${this.placeholder}`;
    this.triggerEl.setAttribute("aria-expanded", String(this.open));

    // Free-text entry input (collaborator / email token input).
    if (this.customInputEl) {
      const custom = this.allowCustom;
      this.customInputEl.hidden = !custom;
      this.customInputEl.placeholder = this.placeholder;
      this.customInputEl.setAttribute("aria-label", `${this.label} — type to add`);
      // With a free-text input, the +Add trigger is only useful when there are
      // still fixed options to pick; hide it otherwise to keep the field clean.
      this.triggerEl.hidden = custom && this.availableOptions().length === 0;
    }

    this.pillsEl.innerHTML = this.valueInternal
      .map(
        value => `
          <span part="pill" data-value="${escapeHtml(value)}">
            <span part="pill-label">${escapeHtml(this.labelFor(value))}</span>
            <button type="button" part="pill-remove" data-value="${escapeHtml(value)}" aria-label="Remove ${escapeHtml(this.labelFor(value))}">
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
          </span>
        `,
      )
      .join("");

    const available = this.availableOptions();
    if (this.open) {
      if (!this.menuEl) {
        this.menuEl = document.createElement("ul");
        this.menuEl.setAttribute("part", "menu");
        this.menuEl.setAttribute("role", "menu");
        this.dropdownEl.append(this.menuEl);
      }
      this.menuEl.setAttribute("aria-label", `${this.label} options`);
      this.menuEl.innerHTML = available.length
        ? available
            .map(
              option => `
                <li part="option-row" role="none">
                  <button
                    type="button"
                    part="option"
                    role="menuitem"
                    data-value="${escapeHtml(option.value)}"
                    tabindex="${option.value === this.menuFocusValue ? "0" : "-1"}"
                  >${escapeHtml(option.label)}</button>
                </li>
              `,
            )
            .join("")
        : `<li part="option-empty" role="none">No more options</li>`;
    } else if (this.menuEl) {
      this.menuEl.remove();
      this.menuEl = null;
    }

    const focusableControls: HTMLElement[] = [
      this.triggerEl,
      ...Array.from(this.pillsEl.querySelectorAll<HTMLButtonElement>('[part="pill-remove"]')),
    ];
    if (this.menuEl) {
      focusableControls.push(
        ...Array.from(this.menuEl.querySelectorAll<HTMLButtonElement>('[part="option"]')),
      );
    }
    this.applyInvalidStateToControls(focusableControls, this.errorEl);

    this.applyPendingFocus();
  }
}

export const defineBoxPillSelectorDropdownElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxPillSelectorDropdownElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxPillSelectorDropdownElement;
  }

  customElements.define(tagName, BoxPillSelectorDropdownElement);
  return BoxPillSelectorDropdownElement;
};
