const DEFAULT_TAG_NAME = "box-segmented-control";

type SegmentedControlOption = {
  disabled?: boolean;
  label: string;
  value: string;
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxSegmentedControlElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["disabled", "label", "layout", "options", "value"];
  }

  private valueInternal = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

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

  private moveSelection(direction: number): void {
    const enabledOptions = this.options.filter(option => !option.disabled);
    if (enabledOptions.length === 0) {
      return;
    }

    const currentIndex = enabledOptions.findIndex(option => option.value === this.valueInternal);
    const nextIndex = currentIndex < 0
      ? 0
      : (currentIndex + direction + enabledOptions.length) % enabledOptions.length;
    const nextValue = enabledOptions[nextIndex]?.value ?? "";
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
    this.render();

    const nextButton = this.shadowRoot?.querySelector(`[part="segment"][data-value="${escapeHtml(nextValue)}"]`) as HTMLButtonElement | null;
    nextButton?.focus();
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const firstEnabledValue = this.options.find(option => !option.disabled)?.value ?? "";
    const selectedValue = this.valueInternal || firstEnabledValue;
    if (selectedValue !== this.valueInternal) {
      this.valueInternal = selectedValue;
      this.setAttribute("value", selectedValue);
    }

    const optionsMarkup = this.options
      .map((option, index) => {
        const position =
          this.options.length === 1
            ? "only"
            : index === 0
              ? "first"
              : index === this.options.length - 1
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

    this.shadowRoot.innerHTML = `
      <div part="control" data-layout="${this.layout}" role="radiogroup" aria-label="${escapeHtml(this.label)}" aria-disabled="${String(this.disabled)}">
        ${optionsMarkup}
      </div>
    `;

    this.shadowRoot.querySelectorAll('[part="segment"]').forEach(button => {
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
        this.render();
      });

      button.addEventListener("keydown", event => {
        const keyboardEvent = event as KeyboardEvent;
        if (keyboardEvent.key === "ArrowRight" || keyboardEvent.key === "ArrowDown") {
          keyboardEvent.preventDefault();
          this.moveSelection(1);
        }

        if (keyboardEvent.key === "ArrowLeft" || keyboardEvent.key === "ArrowUp") {
          keyboardEvent.preventDefault();
          this.moveSelection(-1);
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
