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
