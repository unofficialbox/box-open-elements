import { BaseElement } from "../../core/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";

const DEFAULT_TAG_NAME = "box-accordion";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type BoxAccordionItem = {
  content?: string;
  label: string;
  value: string;
};

const accordionStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="accordion"] {
    display: grid;
    gap: 0.75rem;
  }

  [part="item"] {
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 84%, var(--boe-token-surface-surface, #ffffff) 16%);
    border-radius: 1rem;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, var(--boe-token-surface-surface, #ffffff) 12%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 86%, var(--boe-token-surface-surface-secondary, #fbfbfb) 14%) 100%
      );
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.82),
      0 12px 24px rgba(15, 23, 42, 0.04);
  }

  [part="heading"] {
    margin: 0;
    font: inherit;
  }

  [part="trigger"] {
    inline-size: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.95rem 1rem;
    border: none;
    border-radius: 1rem;
    background: transparent;
    color: var(--boe-token-text-text, #222222);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  [part="heading"] {
    font-weight: 600;
  }

  [part="indicator"] {
    inline-size: 1.75rem;
    block-size: 1.75rem;
    display: inline-grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 80%, var(--boe-token-surface-surface, #ffffff) 20%);
    border-radius: 0.7rem;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 94%, var(--boe-token-surface-surface-secondary, #fbfbfb) 6%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 14%, var(--boe-token-surface-surface, #ffffff) 86%) 100%
      );
    color: var(--boe-token-surface-surface-brand, #0061d5);
    font-weight: 700;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
  }

  [part="panel"] {
    padding: 0 1rem 1rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    line-height: 1.55;
  }

  [part="panel"][hidden] {
    display: none;
  }

  ${boeNeutralInteractiveStyles('[part="trigger"]')}
`;

export class BoxAccordionElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["items", "label", "value"];
  }

  private valueInternal = "";
  private lastItemsJson = "";
  private accordionEl!: HTMLElement;

  get label(): string {
    return this.getAttribute("label") ?? "Accordion";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get items(): BoxAccordionItem[] {
    const raw = this.getAttribute("items");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as BoxAccordionItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set items(value: BoxAccordionItem[]) {
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

  private renderItemsMarkup(items: BoxAccordionItem[], selectedValue: string): string {
    return items
      .map(item => {
        const isOpen = item.value === selectedValue;
        const panelId = `panel-${escapeHtml(item.value)}`;
        const triggerId = `trigger-${escapeHtml(item.value)}`;

        return `
          <section part="item" data-open="${String(isOpen)}" data-value="${escapeHtml(item.value)}">
            <h3 part="heading">
              <button
                type="button"
                part="trigger"
                id="${triggerId}"
                data-value="${escapeHtml(item.value)}"
                aria-expanded="${String(isOpen)}"
                aria-controls="${panelId}"
              >
                ${escapeHtml(item.label)}
                <span part="indicator" aria-hidden="true">${isOpen ? "−" : "+"}</span>
              </button>
            </h3>
            <div
              part="panel"
              id="${panelId}"
              role="region"
              aria-labelledby="${triggerId}"
              ${isOpen ? "" : "hidden"}
            >${escapeHtml(item.content ?? "")}</div>
          </section>
        `;
      })
      .join("");
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${accordionStyles}</style>
      <div part="accordion"></div>
    `;
    this.accordionEl = this.shadowRoot.querySelector('[part="accordion"]')!;
  }

  protected setupListeners(): void {
    this.accordionEl.addEventListener("click", event => {
      const trigger = (event.target as HTMLElement | null)?.closest(
        '[part="trigger"]',
      ) as HTMLButtonElement | null;
      if (!trigger || !this.accordionEl.contains(trigger)) {
        return;
      }

      const nextValue = trigger.dataset.value ?? "";
      if (!nextValue) {
        return;
      }

      if (nextValue === this.valueInternal) {
        this.valueInternal = "";
        this.setAttribute("value", "");
        this.dispatchEvent(
          new CustomEvent("value-changed", {
            bubbles: true,
            composed: true,
            detail: { value: "" },
          }),
        );
        this.update();
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
  }

  protected update(): void {
    if (!this.accordionEl) {
      return;
    }

    const items = this.items;
    const itemsJson = this.getAttribute("items") ?? "";

    if (!this.hasAttribute("value") && items.length > 0 && this.valueInternal === "") {
      this.valueInternal = items[0]!.value;
      this.setAttribute("value", this.valueInternal);
    }

    const selectedValue = this.valueInternal;

    this.accordionEl.setAttribute("role", "region");
    this.accordionEl.setAttribute("aria-label", this.label);

    if (itemsJson !== this.lastItemsJson) {
      this.accordionEl.innerHTML = this.renderItemsMarkup(items, selectedValue);
      this.lastItemsJson = itemsJson;
      return;
    }

    this.accordionEl.querySelectorAll('[part="item"]').forEach(node => {
      const section = node as HTMLElement;
      const value = section.dataset.value ?? "";
      const isOpen = value === selectedValue;
      section.dataset.open = String(isOpen);

      const trigger = section.querySelector('[part="trigger"]') as HTMLButtonElement | null;
      const indicator = section.querySelector('[part="indicator"]') as HTMLElement | null;
      const panel = section.querySelector('[part="panel"]') as HTMLElement | null;

      if (trigger) {
        trigger.setAttribute("aria-expanded", String(isOpen));
      }
      if (indicator) {
        indicator.textContent = isOpen ? "−" : "+";
      }
      if (panel) {
        panel.hidden = !isOpen;
      }
    });
  }
}

export const defineBoxAccordionElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxAccordionElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxAccordionElement;
  }

  customElements.define(tagName, BoxAccordionElement);
  return BoxAccordionElement;
};
