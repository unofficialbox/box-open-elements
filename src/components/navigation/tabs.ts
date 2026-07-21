import { BaseElement } from "../../core/index.js";
import { boeControl, boeRadius, boeSpace } from "../../foundations/geometry/index.js";
import {
  boeFocusVisibleStyles,
} from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

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
    flex-wrap: nowrap;
    gap: 0;
    border-bottom: 1px solid var(--boe-token-surface-surface-secondary, #e8e8e8);
  }

  [part="tab"] {
    position: relative;
    appearance: none;
    flex: 1 1 0;
    min-width: 0;
    margin: 0;
    padding: 0 ${boeSpace[2]};
    border: 0;
    border-bottom: 1px solid transparent;
    border-radius: 0;
    background: transparent;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font: inherit;
    font-size: ${boeControl.fontSize};
    font-weight: 400;
    line-height: ${boeControl.heightLarge};
    letter-spacing: ${boeControl.letterSpacing};
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    box-shadow: none;
    transition:
      color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part="tab"]::after {
    content: "";
    position: absolute;
    inset-inline: 0;
    bottom: -1px;
    height: 2px;
    background: var(--boe-token-surface-surface-brand, #0061d5);
    opacity: 0;
    transition: opacity 0.3s cubic-bezier(0.215, 0.61, 0.355, 1);
  }

  [part="tab"]:hover,
  [part="tab"]:focus-visible {
    color: var(--boe-token-text-text, #222222);
    background: transparent;
  }

  [part="tab"][data-selected="true"] {
    color: var(--boe-token-text-text, #222222);
    background: transparent;
    box-shadow: none;
  }

  [part="tab"][data-selected="true"]::after {
    opacity: 1;
  }

  [part="tabs"][data-layout="separated"] [part="tab"] {
    flex: 0 1 auto;
    padding: 0 ${boeSpace[3]};
  }

  ${boeFocusVisibleStyles('[part="tab"]')}

  [part="tab"]:focus-visible {
    outline-offset: -2px;
    box-shadow: none;
  }

  /* Panels carry no default padding — an empty panel is zero-height, and
     consumers style their own slotted content. */
  [part="panel"] {
    outline: none;
  }

  [part="panel"][hidden] {
    display: none;
  }

  [part="panel"]:focus-visible {
    outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5);
    outline-offset: 2px;
    border-radius: ${boeRadius.med};
  }
`;

export class BoxTabsElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label", "layout", "options", "value"];
  }

  private valueInternal = "";
  private lastOptionsJson = "";
  private tabsEl!: HTMLElement;
  private panelsEl!: HTMLElement;
  private readonly uid = `boe-tabs-${Math.random().toString(36).slice(2, 8)}`;

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

        const selected = option.value === selectedValue;
        const value = escapeHtml(option.value);
        return `
          <button
            type="button"
            part="tab"
            role="tab"
            id="${this.uid}-tab-${value}"
            aria-controls="${this.uid}-panel-${value}"
            data-layout="${this.layout}"
            data-position="${position}"
            data-selected="${String(selected)}"
            data-value="${value}"
            aria-selected="${String(selected)}"
            tabindex="${selected ? "0" : "-1"}"
          >
            ${escapeHtml(option.label)}
          </button>
        `;
      })
      .join("");
  }

  /** One tabpanel per option, fed by a slot named for the option value. */
  private renderPanelsMarkup(options: BoxTabOption[], selectedValue: string): string {
    return options
      .map(option => {
        const value = escapeHtml(option.value);
        const selected = option.value === selectedValue;
        return `
          <div
            part="panel"
            role="tabpanel"
            id="${this.uid}-panel-${value}"
            aria-labelledby="${this.uid}-tab-${value}"
            tabindex="0"
            ${selected ? "" : "hidden"}
          ><slot name="${value}"></slot></div>
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
      <div part="panels"></div>
    `;
    this.tabsEl = this.shadowRoot.querySelector('[part="tabs"]')!;
    this.panelsEl = this.shadowRoot.querySelector('[part="panels"]')!;
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
      this.panelsEl.innerHTML = this.renderPanelsMarkup(options, selectedValue);
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

    // Show only the selected tab's panel.
    this.panelsEl.querySelectorAll<HTMLElement>('[part="panel"]').forEach((panel, index) => {
      panel.hidden = options[index]?.value !== selectedValue;
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
