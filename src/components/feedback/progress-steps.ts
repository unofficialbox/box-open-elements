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

export class BoxProgressStepsElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["items", "label", "value"];
  }

  private valueInternal = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

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

  private render(): void {
    if (!this.shadowRoot) {
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

    const stepsMarkup = items
      .map((item, index) => {
        const state =
          index < activeIndex ? "complete" : index === activeIndex ? "current" : "upcoming";

        return `
          <button
            type="button"
            part="step"
            role="tab"
            data-state="${state}"
            data-value="${escapeHtml(item.value)}"
            aria-current="${state === "current" ? "step" : "false"}"
            aria-selected="${String(index === activeIndex)}"
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

    this.shadowRoot.innerHTML = `
      <style>
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
          gap: 0.7rem;
          width: 100%;
          text-align: left;
          padding: 0.7rem 0.8rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 56%, transparent);
          border-radius: 0.95rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          cursor: pointer;
          transition: background 140ms ease, border-color 140ms ease;
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
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 94%, white 6%);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.78rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          transition: background 140ms ease, color 140ms ease, border-color 140ms ease;
        }

        [part="step"][data-state="complete"] [part="marker"] {
          border-color: transparent;
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 16%, white 84%);
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
      </style>
      <div part="steps" role="tablist" aria-label="${escapeHtml(this.label)}">
        ${stepsMarkup}
      </div>
    `;

    this.shadowRoot.querySelectorAll('[part="step"]').forEach((step, index) => {
      step.addEventListener("click", () => {
        const nextValue = (step as HTMLButtonElement).dataset.value ?? "";
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
      });

      step.addEventListener("keydown", event => {
        const keyboardEvent = event as KeyboardEvent;
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

        this.valueInternal = nextStep.value;
        this.setAttribute("value", nextStep.value);
        this.dispatchEvent(
          new CustomEvent("value-changed", {
            bubbles: true,
            composed: true,
            detail: { value: nextStep.value },
          }),
        );

        queueMicrotask(() => {
          const nextButton = this.shadowRoot?.querySelectorAll('[part="step"]')[nextIndex] as HTMLButtonElement | undefined;
          nextButton?.focus();
        });
      });
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
