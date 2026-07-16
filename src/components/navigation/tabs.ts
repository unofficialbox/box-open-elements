import { BaseElement } from "../../core/index.js";
import {
  boeFocusVisibleStyles,
  boeNeutralInteractiveStyles,
} from "../../foundations/tokens/index.js";

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

const tabsStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="tabs"] {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  [part="tabs"][data-layout="attached"] {
    gap: 0;
    padding: 0.15rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 84%, var(--boe-token-surface-surface, #ffffff) 16%);
    border-radius: 0.7rem;
    background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
  }

  [part="tab"] {
    appearance: none;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 84%, var(--boe-token-surface-surface, #ffffff) 16%);
    border-radius: 0.6rem;
    background: var(--boe-token-surface-surface, #ffffff);
    color: var(--boe-token-text-text, #222222);
    font: inherit;
    min-height: 1.9rem;
    padding: 0.2rem 0.65rem;
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
    border-top-left-radius: 0.55rem;
    border-bottom-left-radius: 0.55rem;
  }

  [part="tab"][data-layout="attached"][data-position="last"] {
    border-top-right-radius: 0.55rem;
    border-bottom-right-radius: 0.55rem;
  }

  [part="tab"][data-layout="attached"][data-position="middle"],
  [part="tab"][data-layout="attached"][data-position="last"] {
    margin-left: -1px;
  }

  [part="tab"][data-layout="attached"][data-position="only"] {
    border-radius: 0.55rem;
  }

  [part="tab"][data-selected="true"] {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, var(--boe-token-stroke-stroke, #e8e8e8) 84%);
    background: color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 72%, var(--boe-token-surface-surface, #ffffff) 28%);
    color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 78%, var(--boe-token-text-text, #222222) 22%);
    box-shadow: none;
  }

  ${boeNeutralInteractiveStyles('[part="tab"]:not([data-selected="true"])')}
  ${boeFocusVisibleStyles('[part="tab"]')}
`;

export class BoxTabsElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label", "layout", "options", "value"];
  }

  private valueInternal = "";
  private lastOptionsJson = "";
  private tabsEl!: HTMLElement;

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

  private selectValue(nextValue: string, focusIndex?: number): void {
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

    if (typeof focusIndex === "number") {
      queueMicrotask(() => {
        const nextTab = this.tabsEl.querySelectorAll('[part="tab"]')[focusIndex] as
          | HTMLButtonElement
          | undefined;
        nextTab?.focus();
      });
    }
  }

  private renderTabsMarkup(options: BoxTabOption[], selectedValue: string): string {
    return options
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
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${tabsStyles}</style>
      <div part="tabs" role="tablist"></div>
    `;
    this.tabsEl = this.shadowRoot.querySelector('[part="tabs"]')!;
  }

  protected setupListeners(): void {
    this.tabsEl.addEventListener("click", event => {
      const tab = (event.target as HTMLElement | null)?.closest('[part="tab"]') as HTMLButtonElement | null;
      if (!tab || !this.tabsEl.contains(tab)) {
        return;
      }
      this.selectValue(tab.dataset.value ?? "");
    });

    this.tabsEl.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      const tab = (keyboardEvent.target as HTMLElement | null)?.closest(
        '[part="tab"]',
      ) as HTMLButtonElement | null;
      if (!tab || !this.tabsEl.contains(tab)) {
        return;
      }

      const options = this.options;
      const tabs = Array.from(this.tabsEl.querySelectorAll('[part="tab"]'));
      const index = tabs.indexOf(tab);
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

      this.selectValue(nextOption.value, nextIndex);
    });
  }

  protected update(): void {
    if (!this.tabsEl) {
      return;
    }

    const options = this.options;
    const optionsJson = this.getAttribute("options") ?? "";
    const selectedValue = this.valueInternal || options[0]?.value || "";

    if (selectedValue !== this.valueInternal) {
      this.valueInternal = selectedValue;
      this.setAttribute("value", selectedValue);
    }

    this.tabsEl.dataset.layout = this.layout;
    this.tabsEl.setAttribute("aria-label", this.label);

    if (optionsJson !== this.lastOptionsJson) {
      this.tabsEl.innerHTML = this.renderTabsMarkup(options, selectedValue);
      this.lastOptionsJson = optionsJson;
      return;
    }

    this.tabsEl.querySelectorAll('[part="tab"]').forEach((node, index) => {
      const tab = node as HTMLButtonElement;
      const option = options[index];
      if (!option) {
        return;
      }

      const position =
        options.length === 1
          ? "only"
          : index === 0
            ? "first"
            : index === options.length - 1
              ? "last"
              : "middle";
      const selected = option.value === selectedValue;

      tab.dataset.layout = this.layout;
      tab.dataset.position = position;
      tab.dataset.selected = String(selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
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
