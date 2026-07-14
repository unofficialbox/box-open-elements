const DEFAULT_TAG_NAME = "box-button-group";

type ButtonGroupOption = {
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

export class BoxButtonGroupElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "layout", "options", "value"];
  }

  private valueInternal = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Button Group";
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

  get options(): ButtonGroupOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as ButtonGroupOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: ButtonGroupOption[]) {
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const selectedValue = this.valueInternal || this.options[0]?.value || "";
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
            part="button"
            role="radio"
            data-value="${escapeHtml(option.value)}"
            data-layout="${this.layout}"
            data-position="${position}"
            data-selected="${String(option.value === selectedValue)}"
            aria-checked="${String(option.value === selectedValue)}"
            tabindex="${option.value === selectedValue ? "0" : "-1"}"
          >
            ${escapeHtml(option.label)}
          </button>
        `;
      })
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          color: inherit;
          font: inherit;
        }

        [part="group"] {
          display: inline-flex;
          align-items: stretch;
          gap: 0.5rem;
        }

        [part="group"][data-layout="attached"] {
          gap: 0;
        }

        [part="button"] {
          appearance: none;
          font: inherit;
          font-weight: 600;
          line-height: 1.2;
          padding: 0.55em 1.1em;
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          border-radius: 0.75rem;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 94%, var(--boe-token-surface-surface, #ffffff) 6%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%, var(--boe-token-surface-surface, #ffffff) 88%) 100%
            );
          color: var(--boe-token-text-text, #222222);
          cursor: pointer;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.82),
            0 1px 2px rgba(15, 23, 42, 0.04);
          transition:
            background-color 140ms ease,
            border-color 140ms ease,
            color 140ms ease,
            box-shadow 140ms ease;
        }

        [part="button"][data-layout="attached"] {
          border-radius: 0;
        }

        [part="button"][data-layout="attached"][data-position="first"] {
          border-top-left-radius: 0.75rem;
          border-bottom-left-radius: 0.75rem;
        }

        [part="button"][data-layout="attached"][data-position="last"] {
          border-top-right-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
        }

        [part="button"][data-layout="attached"][data-position="only"] {
          border-radius: 0.75rem;
        }

        [part="button"][data-layout="attached"][data-position="middle"],
        [part="button"][data-layout="attached"][data-position="last"] {
          margin-left: -1px;
        }

        [part="button"]:not([data-selected="true"]):hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
        }

        [part="button"][data-selected="true"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 22%, var(--boe-token-stroke-stroke, #e8e8e8) 78%);
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface, #ffffff) 92%) 0%,
              color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 60%, var(--boe-token-surface-surface, #ffffff) 40%) 100%
            );
          color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 80%, var(--boe-token-text-text, #222222) 20%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.82),
            0 6px 12px rgba(15, 23, 42, 0.035);
          z-index: 1;
        }

        [part="button"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
          z-index: 2;
        }

        [part="button"]:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }
      </style>
      <div part="group" role="radiogroup" data-layout="${this.layout}" aria-label="${escapeHtml(this.label)}">
        ${optionsMarkup}
      </div>
    `;

    this.shadowRoot.querySelectorAll('[part="button"]').forEach((button, index) => {
      button.addEventListener("click", () => {
        const nextValue = (button as HTMLButtonElement).dataset.value ?? "";
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

      button.addEventListener("keydown", event => {
        const keyboardEvent = event as KeyboardEvent;
        const lastIndex = this.options.length - 1;
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
        const nextOption = this.options[nextIndex];
        if (!nextOption) {
          return;
        }

        this.valueInternal = nextOption.value;
        this.setAttribute("value", nextOption.value);
        this.dispatchEvent(
          new CustomEvent("value-changed", {
            bubbles: true,
            composed: true,
            detail: { value: nextOption.value },
          }),
        );

        queueMicrotask(() => {
          const nextButton = this.shadowRoot?.querySelectorAll('[part="button"]')[nextIndex] as HTMLButtonElement | undefined;
          nextButton?.focus();
        });
      });
    });
  }
}

export const defineBoxButtonGroupElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxButtonGroupElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxButtonGroupElement;
  }

  customElements.define(tagName, BoxButtonGroupElement);
  return BoxButtonGroupElement;
};
