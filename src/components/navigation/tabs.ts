const DEFAULT_TAG_NAME = "box-tabs";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxTabOption = {
  label: string;
  value: string;
};

export class BoxTabsElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "layout", "options", "value"];
  }

  private valueInternal = "";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Tabs";
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

  get options(): BoxTabOption[] {
    const raw = this.getAttribute("options");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxTabOption[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set options(value: BoxTabOption[]) {
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

    const options = this.options;
    const selectedValue = this.valueInternal || options[0]?.value || "";

    if (selectedValue !== this.valueInternal) {
      this.valueInternal = selectedValue;
      this.setAttribute("value", selectedValue);
    }

    const tabsMarkup = options
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
            part="tab"
            role="tab"
            data-layout="${this.layout}"
            data-position="${position}"
            data-selected="${String(option.value === selectedValue)}"
            data-value="${escapeHtml(option.value)}"
            aria-selected="${String(option.value === selectedValue)}"
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
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="tabs"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.625rem;
        }

        [part="tabs"][data-layout="attached"] {
          gap: 0;
          padding: 0.125rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 84%, white 16%);
          border-radius: 999px;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 88%, white 12%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 2%, var(--boe-token-surface-surface-secondary, #f7f9fc) 86%, white 12%) 100%
            );
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
        }

        [part="tab"] {
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 84%, white 16%);
          border-radius: 999px;
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 94%, white 6%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 10%, var(--boe-token-surface-surface, #ffffff) 90%) 100%
            );
          color: var(--boe-token-text-text, #101820);
          font: inherit;
          min-height: 2.125rem;
          padding: 0.1875rem 0.75rem;
          cursor: pointer;
          transition:
            background-color 140ms ease,
            color 140ms ease,
            border-color 140ms ease,
            box-shadow 140ms ease;
        }

        [part="tab"][data-layout="attached"] {
          border-radius: 0;
        }

        [part="tab"][data-layout="attached"][data-position="first"] {
          border-top-left-radius: 999px;
          border-bottom-left-radius: 999px;
        }

        [part="tab"][data-layout="attached"][data-position="last"] {
          border-top-right-radius: 999px;
          border-bottom-right-radius: 999px;
        }

        [part="tab"][data-layout="attached"][data-position="middle"],
        [part="tab"][data-layout="attached"][data-position="last"] {
          margin-left: -1px;
        }

        [part="tab"][data-layout="attached"][data-position="only"] {
          border-radius: 999px;
        }

        [part="tab"][data-selected="true"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 14%, var(--boe-token-stroke-stroke, #d6e0ea) 86%);
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, white 92%) 0%,
              color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #e8f1ff) 42%, white 58%) 100%
            );
          color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 78%, var(--boe-token-text-text, #101820) 22%);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.82),
            0 6px 12px rgba(15, 23, 42, 0.035);
        }

        [part="tab"]:not([data-selected="true"]):hover {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-stroke-stroke, #d6e0ea) 90%);
          background:
            linear-gradient(
              180deg,
              color-mix(in srgb, var(--boe-token-surface-item-surface-hover, #eef4fb) 28%, white 72%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 90%, var(--boe-token-surface-item-surface-hover, #eef4fb) 10%) 100%
            );
        }

        [part="tab"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }
      </style>
      <div part="tabs" data-layout="${this.layout}" role="tablist" aria-label="${escapeHtml(this.label)}">
        ${tabsMarkup}
      </div>
    `;

    this.shadowRoot.querySelectorAll('[part="tab"]').forEach((tab, index) => {
      tab.addEventListener("click", () => {
        const nextValue = (tab as HTMLButtonElement).dataset.value ?? "";
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

      tab.addEventListener("keydown", event => {
        const keyboardEvent = event as KeyboardEvent;
        const lastIndex = options.length - 1;
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
        const nextOption = options[nextIndex];
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
          const nextTab = this.shadowRoot?.querySelectorAll('[part="tab"]')[nextIndex] as HTMLButtonElement | undefined;
          nextTab?.focus();
        });
      });
    });
  }
}

export const defineBoxTabsElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxTabsElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxTabsElement;
  }

  customElements.define(tagName, BoxTabsElement);
  return BoxTabsElement;
};
