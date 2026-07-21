import {
  FormAssociatedElement,
  boeFormFieldErrorStyles,
  formErrorMessageMarkup,
} from "../../core/index.js";
import type { FormValue } from "../../core/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boeOverlay, boeRadius } from "../../foundations/geometry/index.js";
import {
  parsePlacement,
  trackAnchor,
  type OverlayPlacement,
} from "../../foundations/overlay/index.js";

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
  /** Secondary line rendered under the label (lightweight custom render). */
  description?: string;
  /** Options sharing a group render under a divider header. */
  group?: string;
  disabled?: boolean;
};

const comboboxStyles = `
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

  [part="control"] {
    position: relative;
    display: block;
  }

  [part="input"] {
    appearance: none;
    inline-size: 100%;
    box-sizing: border-box;
    font: inherit;
    color: var(--boe-token-text-text, #222222);
    padding: 0.45rem 0.7rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    border-radius: ${boeRadius.control};
    background: var(--boe-token-surface-surface, #ffffff);
    transition:
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      background ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="input"]::placeholder {
    color: var(--boe-token-text-text-placeholder, #909090);
  }

  ${boeNeutralInteractiveStyles('[part="input"]')}

  [part="input"]:focus-visible {
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  /* Listbox popup — positioned as a viewport-fixed overlay via foundations/overlay. */
  [part="listbox"] {
    position: fixed;
    inset-block-start: 0;
    inset-inline-start: 0;
    z-index: 40;
    margin: 0;
    padding: ${boeOverlay.padding};
    list-style: none;
    min-inline-size: 200px;
    max-block-size: 16rem;
    overflow-y: auto;
    border: ${boeOverlay.border};
    border-radius: ${boeOverlay.radius};
    background: var(--boe-token-surface-surface, #ffffff);
    box-shadow: ${boeOverlay.shadow};
  }

  [part="listbox"][hidden] {
    display: none;
  }

  [part="option"] {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-block-size: ${boeOverlay.itemMinHeight};
    justify-content: center;
    padding: 6px 10px;
    border-radius: ${boeOverlay.itemRadius};
    color: var(--boe-token-text-text, #222222);
    cursor: pointer;
  }

  [part="option"][aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  [part="option"].boe-active:not([aria-disabled="true"]) {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part="option"][aria-selected="true"] {
    color: var(--boe-token-surface-surface-brand, #0061d5);
    font-weight: 700;
  }

  [part="option-description"] {
    font-size: 0.78rem;
    font-weight: 400;
    line-height: 1.35;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="group-label"] {
    padding: 6px 10px 2px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="empty"] {
    padding: 8px 10px;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-size: 0.86rem;
  }

  ${boeFormFieldErrorStyles}
`;

export class BoxComboboxElement extends FormAssociatedElement {
  static get observedAttributes(): string[] {
    return [
      ...FormAssociatedElement.formObservedAttributes,
      "disabled",
      "label",
      "options",
      "placeholder",
      "placement",
      "value",
    ];
  }

  private valueInternal = "";
  private open = false;
  private activeId: string | null = null;
  private filterText: string | null = null;
  private positionCleanup: (() => void) | null = null;
  private listboxId = `box-combobox-list-${Math.random().toString(36).slice(2, 10)}`;

  private inputEl!: HTMLInputElement;
  private labelEl!: HTMLElement;
  private controlEl!: HTMLElement;
  private listboxEl!: HTMLUListElement;
  private errorEl!: HTMLElement;

  private readonly onDocumentPointerDown = (event: PointerEvent): void => {
    if (event.composedPath().includes(this)) {
      return;
    }
    this.closeListbox();
  };

  private findOptionByLabel(label: string): BoxComboboxOption | undefined {
    return this.options.find(option => option.label === label);
  }

  private findOptionByValue(value: string): BoxComboboxOption | undefined {
    return this.options.find(option => option.value === value);
  }

  private getDisplayValue(): string {
    return this.findOptionByValue(this.valueInternal)?.label ?? this.valueInternal;
  }

  /** Resolve typed text to an option value when it matches a label (free-text otherwise). */
  private resolveInputValue(rawValue: string): string {
    return this.findOptionByLabel(rawValue)?.value ?? rawValue;
  }

  private commitInputValue(rawValue: string): void {
    const resolved = this.resolveInputValue(rawValue);
    if (resolved !== this.valueInternal) {
      this.commitValue(resolved);
    }
    if (this.shadowRoot?.activeElement !== this.inputEl) {
      this.inputEl.value = this.getDisplayValue();
    }
  }

  /** Options visible for the current filter text (null = show all). */
  private visibleOptions(): BoxComboboxOption[] {
    const filter = this.filterText;
    if (filter == null || filter === "") {
      return this.options;
    }
    const needle = filter.toLowerCase();
    return this.options.filter(option => option.label.toLowerCase().includes(needle));
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.toggleAttribute("disabled", Boolean(value));
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

  get placement(): string {
    return this.getAttribute("placement") ?? "bottom-start";
  }

  set placement(value: string) {
    this.setAttribute("placement", value);
  }

  private resolvedPlacement(): OverlayPlacement {
    return parsePlacement(this.getAttribute("placement")) ?? { side: "bottom", align: "start" };
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

  protected getFormValue(): FormValue {
    return this.valueInternal;
  }

  protected restoreFormValue(value: FormValue): void {
    const next = typeof value === "string" ? value : "";
    this.valueInternal = next;
    this.setAttribute("value", next);
    if (this.isRendered) {
      this.update();
    }
  }

  disconnectedCallback(): void {
    document.removeEventListener("pointerdown", this.onDocumentPointerDown);
    this.stopTracking();
    super.disconnectedCallback();
  }

  private stopTracking(): void {
    this.positionCleanup?.();
    this.positionCleanup = null;
  }

  private commitValue(value: string): void {
    this.valueInternal = value;
    this.setAttribute("value", value);
    this.syncFormAssociation();
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value },
      }),
    );
  }

  private optionId(index: number): string {
    return `${this.listboxId}-opt-${index}`;
  }

  private openListbox(): void {
    if (this.disabled || this.open) {
      return;
    }
    this.open = true;
    document.addEventListener("pointerdown", this.onDocumentPointerDown);
    this.update();
    this.positionCleanup = trackAnchor(this.controlEl, this.listboxEl, {
      placement: this.resolvedPlacement(),
      offset: 4,
    });
  }

  private closeListbox(restoreDisplay = true): void {
    if (!this.open) {
      return;
    }
    this.open = false;
    this.activeId = null;
    this.filterText = null;
    document.removeEventListener("pointerdown", this.onDocumentPointerDown);
    this.stopTracking();
    if (restoreDisplay && this.shadowRoot?.activeElement !== this.inputEl) {
      this.inputEl.value = this.getDisplayValue();
    }
    this.update();
  }

  private optionEls(): HTMLElement[] {
    return Array.from(this.listboxEl.querySelectorAll<HTMLElement>('[part="option"]:not([aria-disabled="true"])'));
  }

  private setActive(id: string | null): void {
    this.activeId = id;
    this.listboxEl.querySelectorAll('[part="option"]').forEach(node => {
      node.classList.toggle("boe-active", node.id === id);
    });
    if (id) {
      this.inputEl.setAttribute("aria-activedescendant", id);
      const activeEl = this.listboxEl.querySelector<HTMLElement>(`#${id}`);
      // scrollIntoView is absent in jsdom; guard so tests and SSR don't throw.
      activeEl?.scrollIntoView?.({ block: "nearest" });
    } else {
      this.inputEl.removeAttribute("aria-activedescendant");
    }
  }

  private moveActive(delta: number): void {
    const options = this.optionEls();
    if (options.length === 0) {
      return;
    }
    const currentIndex = options.findIndex(node => node.id === this.activeId);
    let nextIndex = currentIndex + delta;
    if (nextIndex < 0) {
      nextIndex = options.length - 1;
    } else if (nextIndex >= options.length) {
      nextIndex = 0;
    }
    this.setActive(options[nextIndex].id);
  }

  private selectActive(): void {
    if (!this.activeId) {
      return;
    }
    const optionEl = this.listboxEl.querySelector<HTMLElement>(`#${this.activeId}`);
    const value = optionEl?.dataset.value;
    if (value == null) {
      return;
    }
    this.commitValue(value);
    this.inputEl.value = this.getDisplayValue();
    // Keep focus on the input (Enter already has it; click was prevented from
    // blurring) — do NOT call focus() here, which would retrigger open.
    this.closeListbox(false);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${comboboxStyles}</style>
      <div part="field">
        <span part="label" id="${this.listboxId}-label"></span>
        <div part="control">
          <input
            type="text"
            part="input"
            role="combobox"
            autocomplete="off"
            aria-autocomplete="list"
            aria-expanded="false"
            aria-controls="${this.listboxId}"
          />
        </div>
        <ul part="listbox" id="${this.listboxId}" role="listbox" aria-labelledby="${this.listboxId}-label" hidden></ul>
        ${formErrorMessageMarkup()}
      </div>
    `;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
    this.controlEl = this.shadowRoot.querySelector('[part="control"]')!;
    this.listboxEl = this.shadowRoot.querySelector('[part="listbox"]')!;
    this.errorEl = this.shadowRoot.querySelector('[part="error-message"]')!;
  }

  protected setupListeners(): void {
    this.inputEl.addEventListener("input", event => {
      const raw = (event.currentTarget as HTMLInputElement).value;
      this.filterText = raw;
      // Preserve free-text behaviour: typed text commits (resolving label→value).
      this.commitInputValue(raw);
      this.openListbox();
      this.update();
      // Keep the first match active for quick Enter selection.
      const first = this.optionEls()[0];
      this.setActive(first?.id ?? null);
    });

    this.inputEl.addEventListener("keydown", event => {
      const key = (event as KeyboardEvent).key;
      if (key === "ArrowDown") {
        event.preventDefault();
        if (!this.open) {
          this.openListbox();
          const first = this.optionEls()[0];
          this.setActive(first?.id ?? null);
        } else {
          this.moveActive(1);
        }
      } else if (key === "ArrowUp") {
        event.preventDefault();
        if (this.open) {
          this.moveActive(-1);
        }
      } else if (key === "Home" && this.open) {
        event.preventDefault();
        const first = this.optionEls()[0];
        this.setActive(first?.id ?? null);
      } else if (key === "End" && this.open) {
        event.preventDefault();
        const options = this.optionEls();
        this.setActive(options[options.length - 1]?.id ?? null);
      } else if (key === "Enter") {
        if (this.open && this.activeId) {
          event.preventDefault();
          this.selectActive();
        }
      } else if (key === "Escape") {
        if (this.open) {
          event.preventDefault();
          this.closeListbox();
        }
      }
    });

    this.inputEl.addEventListener("focus", () => {
      if (!this.disabled) {
        this.openListbox();
      }
    });

    this.listboxEl.addEventListener("pointerdown", event => {
      // Prevent the input blur so selection completes before focus moves.
      event.preventDefault();
    });

    this.listboxEl.addEventListener("click", event => {
      const optionEl = (event.target as HTMLElement).closest('[part="option"]') as HTMLElement | null;
      if (!optionEl || optionEl.getAttribute("aria-disabled") === "true") {
        return;
      }
      this.setActive(optionEl.id);
      this.selectActive();
    });

    this.inputEl.addEventListener("blur", () => {
      // Resolve typed text (label→value) then close (pointerdown-on-option is
      // prevented above so option clicks complete first).
      this.commitInputValue(this.inputEl.value);
      this.closeListbox();
    });
  }

  private renderOptions(): void {
    const options = this.visibleOptions();
    if (options.length === 0) {
      this.listboxEl.innerHTML = `<li part="empty" role="presentation">No matches</li>`;
      return;
    }

    let markup = "";
    let lastGroup: string | undefined;
    options.forEach((option, index) => {
      if (option.group && option.group !== lastGroup) {
        markup += `<li part="group-label" role="presentation">${escapeHtml(option.group)}</li>`;
      }
      lastGroup = option.group;
      const selected = option.value === this.valueInternal;
      const description = option.description
        ? `<span part="option-description">${escapeHtml(option.description)}</span>`
        : "";
      markup += `
        <li
          id="${this.optionId(index)}"
          part="option"
          role="option"
          data-value="${escapeHtml(option.value)}"
          aria-selected="${selected ? "true" : "false"}"
          ${option.disabled ? 'aria-disabled="true"' : ""}
        >
          <span part="option-label">${escapeHtml(option.label)}</span>
          ${description}
        </li>
      `;
    });
    this.listboxEl.innerHTML = markup;
  }

  protected update(): void {
    if (!this.inputEl || !this.labelEl || !this.listboxEl || !this.errorEl) {
      return;
    }

    this.labelEl.textContent = this.label;
    this.inputEl.placeholder = this.placeholder;
    this.inputEl.setAttribute("aria-label", this.label);

    if (this.shadowRoot?.activeElement !== this.inputEl && this.filterText == null) {
      this.inputEl.value = this.getDisplayValue();
    }

    if (this.disabled) {
      this.inputEl.setAttribute("disabled", "");
    } else {
      this.inputEl.removeAttribute("disabled");
    }

    this.listboxEl.hidden = !this.open;
    this.inputEl.setAttribute("aria-expanded", this.open ? "true" : "false");

    if (this.open) {
      this.renderOptions();
      // Reassert active highlight after a re-render.
      this.setActive(this.activeId);
    } else {
      this.inputEl.removeAttribute("aria-activedescendant");
    }

    this.applyInvalidState(this.inputEl, this.errorEl);
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
