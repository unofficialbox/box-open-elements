import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-segmented-control";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export interface SegmentedControlOption {
  label: string;
  value: string;
  disabled?: boolean;
}

const segmentedControlStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="control"] {
    display: inline-flex;
    align-items: stretch;
    gap: 0.25rem;
    padding: 0.25rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 84%, var(--boe-token-surface-surface, #ffffff) 16%);
    border-radius: 0.75rem;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, var(--boe-token-surface-surface, #ffffff) 12%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 2%, var(--boe-token-surface-surface-secondary, #fbfbfb) 98%) 100%
      );
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
  }

  [part="control"][data-layout="attached"] {
    gap: 0;
  }

  [part="segment"] {
    appearance: none;
    font: inherit;
    font-weight: 600;
    line-height: 1.2;
    padding: 0.45em 1em;
    border: 1px solid transparent;
    border-radius: 0.55rem;
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
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.82),
      0 2px 6px rgba(15, 23, 42, 0.08);
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

export class BoxSegmentedControlElement extends BaseElement {
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

  private moveSelection(direction: number): void {
    const enabledOptions = this.options.filter(option => !option.disabled);
    if (enabledOptions.length === 0) {
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
    if (enabledOptions.length === 0) {
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
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: nextValue },
      }),
    );
    this.update();
    focusSegment(nextValue);
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

    // Rebuild segments (count may change)
    this.controlEl.innerHTML = options
      .map((option, index) => {
        const position =
          options.length === 1
            ? "only"
            : index === 0
              ? "first"
              : index === options.length - 1
                ? "last"
                : "middle";

        return `
          <button
            type="button"
            part="segment"
            data-value="${escapeHtml(option.value)}"
            data-layout="${this.layout}"
            data-position="${position}"
            data-selected="${String(option.value === selectedValue)}"
            role="radio"
            aria-checked="${String(option.value === selectedValue)}"
            tabindex="${option.value === selectedValue ? "0" : "-1"}"
            ${this.disabled || option.disabled ? "disabled" : ""}
          >
            ${escapeHtml(option.label)}
          </button>
        `;
      })
      .join("");

    this.controlEl.querySelectorAll('[part="segment"]').forEach(button => {
      button.addEventListener("click", () => {
        const target = button as HTMLButtonElement;
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

      button.addEventListener("keydown", event => {
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
    });
  }
}

export const defineBoxSegmentedControlElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSegmentedControlElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSegmentedControlElement;
  }

  customElements.define(tagName, BoxSegmentedControlElement);
  return BoxSegmentedControlElement;
};
