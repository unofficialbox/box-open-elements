import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-progress-steps";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxProgressStep = {
  description?: string;
  label: string;
  value: string;
};

const progressStepsStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="steps"] {
    display: grid;
    gap: 0.55rem;
  }

  [part="step"] {
    appearance: none;
    display: flex;
    align-items: start;
    gap: 0.55rem;
    width: 100%;
    text-align: left;
    padding: 0.55rem 0.65rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 56%, transparent);
    border-radius: ${boeRadius.med};
    background: var(--boe-token-surface-surface, #ffffff);
    color: inherit;
    font: inherit;
    cursor: pointer;
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="step"]:hover {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part="step"]:focus-visible {
    outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
    outline-offset: 2px;
  }

  [part="step"][data-state="current"] {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
    background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
  }

  [part="marker"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, var(--boe-token-surface-surface, #ffffff) 6%);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-size: 0.78rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, color ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="step"][data-state="complete"] [part="marker"] {
    border-color: transparent;
    background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 16%, var(--boe-token-surface-surface, #ffffff) 84%);
    color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 62%, var(--boe-token-text-text, #222222));
  }

  [part="step"][data-state="current"] [part="marker"] {
    border-color: transparent;
    background: var(--boe-token-surface-surface-brand, #0061d5);
    color: var(--boe-token-text-text-on-brand, #ffffff);
  }

  [part="content"] {
    display: grid;
    gap: 0.2rem;
    padding-top: 0.1rem;
  }

  [part="step-label"] {
    font-weight: 700;
    color: var(--boe-token-text-text, #222222);
  }

  [part="step"][data-state="upcoming"] [part="step-label"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
  }

  [part="step-description"] {
    font-size: 0.86rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    line-height: 1.45;
  }
`;

export class BoxProgressStepsElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["items", "label", "value"];
  }

  private valueInternal = "";
  private stepsEl!: HTMLElement;
  private itemsSignature = "";

  get label(): string {
    return this.getAttribute("label") ?? "Progress Steps";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get items(): BoxProgressStep[] {
    const raw = this.getAttribute("items");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxProgressStep[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set items(value: BoxProgressStep[]) {
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
      <style>${progressStepsStyles}</style>
      <div part="steps" role="group"></div>
    `;
    this.stepsEl = this.shadowRoot.querySelector('[part="steps"]')!;
  }

  protected setupListeners(): void {
    this.stepsEl.addEventListener("click", event => {
      const step = (event.target as HTMLElement).closest('[part="step"]') as HTMLButtonElement | null;
      if (!step || !this.stepsEl.contains(step)) {
        return;
      }

      const nextValue = step.dataset.value ?? "";
      if (!nextValue || nextValue === this.valueInternal) {
        return;
      }

      this.selectValue(nextValue);
    });

    this.stepsEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      const step = (keyboardEvent.target as HTMLElement).closest('[part="step"]') as HTMLButtonElement | null;
      if (!step || !this.stepsEl.contains(step)) {
        return;
      }

      const items = this.items;
      const index = Array.from(this.stepsEl.querySelectorAll('[part="step"]')).indexOf(step);
      if (index < 0) {
        return;
      }

      const lastIndex = items.length - 1;
      let nextIndex = index;

      if (keyboardEvent.key === "ArrowRight" || keyboardEvent.key === "ArrowDown") {
        nextIndex = index >= lastIndex ? 0 : index + 1;
      } else if (keyboardEvent.key === "ArrowLeft" || keyboardEvent.key === "ArrowUp") {
        nextIndex = index <= 0 ? lastIndex : index - 1;
      } else if (keyboardEvent.key === "Home") {
        nextIndex = 0;
      } else if (keyboardEvent.key === "End") {
        nextIndex = lastIndex;
      } else {
        return;
      }

      keyboardEvent.preventDefault();
      const nextStep = items[nextIndex];
      if (!nextStep) {
        return;
      }

      this.selectValue(nextStep.value);
      queueMicrotask(() => {
        const nextButton = this.stepsEl.querySelectorAll('[part="step"]')[nextIndex] as
          | HTMLButtonElement
          | undefined;
        nextButton?.focus();
      });
    });
  }

  private selectValue(nextValue: string): void {
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
  }

  protected update(): void {
    if (!this.stepsEl) {
      return;
    }

    const items = this.items;
    const activeIndex = Math.max(
      0,
      items.findIndex(item => item.value === this.valueInternal),
    );

    const selectedValue = items[activeIndex]?.value ?? "";
    if (selectedValue && selectedValue !== this.valueInternal) {
      this.valueInternal = selectedValue;
      this.setAttribute("value", selectedValue);
    }

    this.stepsEl.setAttribute("aria-label", this.label);

    const signature = JSON.stringify(items);
    if (signature !== this.itemsSignature) {
      this.itemsSignature = signature;
      this.stepsEl.innerHTML = items
        .map((item, index) => {
          const state =
            index < activeIndex ? "complete" : index === activeIndex ? "current" : "upcoming";

          return `
            <button
              type="button"
              part="step"
              data-state="${state}"
              data-value="${escapeHtml(item.value)}"
              aria-current="${state === "current" ? "step" : "false"}"
              tabindex="${index === activeIndex ? "0" : "-1"}"
            >
              <span part="marker">${index + 1}</span>
              <span part="content">
                <strong part="step-label">${escapeHtml(item.label)}</strong>
                ${item.description ? `<span part="step-description">${escapeHtml(item.description)}</span>` : ""}
              </span>
            </button>
          `;
        })
        .join("");
      return;
    }

    this.stepsEl.querySelectorAll('[part="step"]').forEach((step, index) => {
      const state =
        index < activeIndex ? "complete" : index === activeIndex ? "current" : "upcoming";
      const button = step as HTMLButtonElement;
      button.dataset.state = state;
      button.setAttribute("aria-current", state === "current" ? "step" : "false");
      button.setAttribute("aria-selected", String(index === activeIndex));
      button.tabIndex = index === activeIndex ? 0 : -1;
    });
  }
}

export const defineBoxProgressStepsElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxProgressStepsElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxProgressStepsElement;
  }

  customElements.define(tagName, BoxProgressStepsElement);
  return BoxProgressStepsElement;
};
