import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-segmented-control";

export interface SegmentedControlOption {
  label: string;
  value: string;
  disabled?: boolean;
}

const segmentedControlStyles = `
  :host {
    display: inline-block;
    max-width: 100%;
    color: inherit;
    font: inherit;
  }

  /* The host's own display would otherwise beat the UA rule for [hidden],
     leaving the element on screen when a host hides it. */
  :host([hidden]) {
    display: none !important;
  }

  [part="control"] {
    display: inline-flex;
    flex-wrap: wrap;
    box-sizing: border-box;
    max-width: 100%;
    align-items: stretch;
    gap: 0.25rem;
    padding: 0.25rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 84%, var(--boe-token-surface-surface, #ffffff) 16%);
    border-radius: ${boeRadius.control};
    background: var(--boe-token-surface-surface-secondary, #fbfbfb);
    box-shadow: none;
  }

  [part="control"][data-layout="attached"] {
    gap: 0;
  }

  [part="segment"] {
    min-width: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
    appearance: none;
    font: inherit;
    font-weight: 600;
    line-height: 1.2;
    padding: 0.45em 1em;
    border: 1px solid transparent;
    border-radius: ${boeRadius.control};
    background: transparent;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    cursor: pointer;
    transition:
      background-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="segment"]:hover:not(:disabled):not([data-selected="true"]) {
    background: color-mix(in srgb, var(--boe-token-surface-surface-hover, #f4f4f4) 60%, var(--boe-token-surface-surface, #ffffff) 40%);
    color: var(--boe-token-text-text, #222222);
  }

  [part="segment"][data-selected="true"] {
    background: var(--boe-token-surface-surface, #ffffff);
    border-color: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, var(--boe-token-surface-surface, #ffffff) 30%);
    color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 84%, var(--boe-token-text-text, #222222) 16%);
    box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
  }

  [part="segment"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
    z-index: 1;
  }

  [part="segment"]:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

export class SegmentedControl extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["disabled", "label", "layout", "options", "value"];
  }

  private valueInternal = "";
  private controlEl!: HTMLElement;

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
    return this.getAttribute("label") ?? "Segmented Control";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get layout(): "attached" | "separated" {
    return this.getAttribute("layout") === "attached" ? "attached" : "separated";
  }

  set layout(value: "attached" | "separated") {
    this.setAttribute("layout", value);
  }

  get options(): SegmentedControlOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as SegmentedControlOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: SegmentedControlOption[]) {
    const serialized = JSON.stringify(value);
    if (serialized !== this.getAttribute("options")) this.setAttribute("options", serialized);
  }

  get value(): string {
    return this.valueInternal;
  }

  set value(nextValue: string) {
    if (nextValue === this.valueInternal) return;
    this.setAttribute("value", nextValue);
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = this.getAttribute("value") ?? "";
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private moveSelection(direction: number): void {
    const enabledOptions = this.options.filter(option => !option.disabled);
    if (this.disabled || enabledOptions.length === 0) {
      return;
    }

    const currentIndex = enabledOptions.findIndex(option => option.value === this.valueInternal);
    const nextIndex =
      currentIndex < 0
        ? 0
        : (currentIndex + direction + enabledOptions.length) % enabledOptions.length;
    this.moveSelectionTo(nextIndex, enabledOptions);
  }

  private moveSelectionTo(
    index: number,
    enabledOptions = this.options.filter(option => !option.disabled),
  ): void {
    if (this.disabled || enabledOptions.length === 0) {
      return;
    }

    const nextIndex = Math.max(0, Math.min(enabledOptions.length - 1, index));
    const nextValue = enabledOptions[nextIndex]?.value ?? "";
    const focusSegment = (value: string): void => {
      const nextButton = Array.from(
        this.controlEl?.querySelectorAll<HTMLButtonElement>('[part="segment"]') ?? [],
      ).find(button => button.dataset.value === value);
      nextButton?.focus();
    };

    if (!nextValue || nextValue === this.valueInternal) {
      focusSegment(nextValue);
      return;
    }

    this.valueInternal = nextValue;
    this.setAttribute("value", nextValue);
    // Complete our focus intent before host listeners can explicitly hand it off.
    focusSegment(nextValue);
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: nextValue },
      }),
    );
    this.update();
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${segmentedControlStyles}</style>
      <div part="control" role="radiogroup"></div>
    `;
    this.controlEl = this.shadowRoot.querySelector('[part="control"]')!;
  }

  protected update(): void {
    if (!this.controlEl) {
      return;
    }

    const options = this.options;
    const firstEnabledValue = options.find(option => !option.disabled)?.value ?? "";
    const selectedValue = this.valueInternal || firstEnabledValue;
    if (selectedValue !== this.valueInternal) {
      this.valueInternal = selectedValue;
      this.setAttribute("value", selectedValue);
    }

    this.controlEl.dataset.layout = this.layout;
    this.controlEl.setAttribute("aria-label", this.label);
    this.controlEl.setAttribute("aria-disabled", String(this.disabled));

    const existing = new Map<string, HTMLButtonElement[]>();
    this.controlEl.querySelectorAll<HTMLButtonElement>('[part="segment"]').forEach(button => {
      const value = button.dataset.value ?? "";
      const matches = existing.get(value) ?? [];
      matches.push(button);
      existing.set(value, matches);
    });
    const focused = this.shadowRoot?.activeElement as HTMLButtonElement | null;
    const entry = options.some(option => !option.disabled && option.value === selectedValue)
      ? selectedValue : firstEnabledValue;
    options.forEach((option, index) => {
      const button = existing.get(option.value)?.shift() ?? document.createElement("button");
      button.type = "button";
      button.setAttribute("part", "segment");
      button.setAttribute("role", "radio");
      button.dataset.value = option.value;
      button.dataset.layout = this.layout;
      button.dataset.position = options.length === 1 ? "only" : index === 0 ? "first" : index === options.length - 1 ? "last" : "middle";
      button.dataset.selected = String(option.value === selectedValue);
      button.setAttribute("aria-checked", String(option.value === selectedValue));
      button.tabIndex = !this.disabled && option.value === entry ? 0 : -1;
      button.disabled = this.disabled || Boolean(option.disabled);
      if (button.textContent !== option.label) button.textContent = option.label;
      if (this.controlEl.children[index] !== button) this.controlEl.insertBefore(button, this.controlEl.children[index] ?? null);
    });
    for (const matches of existing.values()) for (const button of matches) button.remove();
    // Moving a keyed button can drop native focus even though identity survives.
    if (focused && (document.activeElement === this || document.activeElement === document.body || document.activeElement === null)) {
      const target = focused.isConnected && !focused.disabled ? focused
        : Array.from(this.controlEl.querySelectorAll<HTMLButtonElement>('[part="segment"]')).find(button => button.tabIndex === 0);
      if (target && this.shadowRoot?.activeElement !== target) target.focus();
    }
  }

  protected setupListeners(): void {
    this.controlEl.addEventListener("click", event => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[part="segment"]');
      if (!target || !this.controlEl.contains(target)) return;
      if (target.disabled) {
        return;
      }

      const nextValue = target.dataset.value ?? "";
      if (!nextValue || nextValue === this.valueInternal) {
        return;
      }

      this.valueInternal = nextValue;
      this.setAttribute("value", nextValue);
      this.dispatchEvent(
        new CustomEvent("value-changed", {
          bubbles: true,
          composed: true,
          detail: { value: nextValue },
        }),
      );
      this.update();
    });

    this.controlEl.addEventListener("keydown", event => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[part="segment"]');
      if (!target || target.disabled || !this.controlEl.contains(target)) return;
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "ArrowRight" || keyboardEvent.key === "ArrowDown") {
        keyboardEvent.preventDefault();
        this.moveSelection(1);
        return;
      }

      if (keyboardEvent.key === "ArrowLeft" || keyboardEvent.key === "ArrowUp") {
        keyboardEvent.preventDefault();
        this.moveSelection(-1);
        return;
      }

      if (keyboardEvent.key === "Home") {
        keyboardEvent.preventDefault();
        this.moveSelectionTo(0);
        return;
      }

      if (keyboardEvent.key === "End") {
        keyboardEvent.preventDefault();
        this.moveSelectionTo(this.options.length - 1);
      }
    });
  }
}

SegmentedControl.register();
