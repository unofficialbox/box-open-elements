import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/interaction.js";

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
  summary?: string;
  label: string;
  value: string;
};

const accordionStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  /* The host's own display would otherwise beat the UA rule for [hidden],
     leaving the element on screen when a host hides it. */
  :host([hidden]) {
    display: none !important;
  }

  [part="accordion"] {
    display: grid;
    gap: 0;
    padding: 0;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 84%, var(--boe-token-surface-surface, #ffffff) 16%);
    border-radius: ${boeRadius.large};
    background: var(--boe-token-surface-surface, #ffffff);
    overflow: hidden;
  }

  [part="item"] {
    border: none;
    border-bottom: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 84%, var(--boe-token-surface-surface, #ffffff) 16%);
    border-radius: 0;
    background: transparent;
  }

  [part="item"]:last-child {
    border-bottom: none;
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
    gap: 0.5rem;
    padding: 0.5rem 0.65rem;
    border: none;
    border-radius: 0;
    background: transparent;
    color: var(--boe-token-text-text, #222222);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  [part="heading"] {
    font-weight: 600;
  }
  [part="summary"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font-weight: 400;
  }

  [part="indicator"] {
    inline-size: 1.35rem;
    block-size: 1.35rem;
    display: inline-grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 80%, var(--boe-token-surface-surface, #ffffff) 20%);
    border-radius: ${boeRadius.med};
    background: var(--boe-token-surface-surface, #ffffff);
    color: var(--boe-token-surface-surface-brand, #0061d5);
    font-weight: 700;
    box-shadow: none;
  }

  [part="panel"] {
    padding: 0 0.65rem 0.65rem;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    line-height: 1.45;
  }

  [part="panel"][hidden] {
    display: none;
  }

  /* Borderless variant: drop the outer card chrome, keep row dividers. */
  :host([borderless]) [part="accordion"] {
    border: none;
    border-radius: 0;
    background: transparent;
    overflow: visible;
  }

  ${boeNeutralInteractiveStyles('[part="trigger"]')}
`;

export class Accordion extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["items", "label", "value", "values", "multiple", "borderless", "plain-panels"];
  }

  /** Flat variant with no outer card border/background. */
  get borderless(): boolean {
    return this.hasAttribute("borderless");
  }

  set borderless(value: boolean) {
    this.toggleAttribute("borderless", Boolean(value));
  }

  /** Omit region landmarks when many accordions or panels share a label. */
  get plainPanels(): boolean { return this.hasAttribute("plain-panels"); }
  set plainPanels(value: boolean) { this.toggleAttribute("plain-panels", Boolean(value)); }

  private valueInternal = "";
  private valuesInternal: string[] = [];
  get multiple(): boolean { return this.hasAttribute("multiple"); }
  set multiple(value: boolean) { this.toggleAttribute("multiple", value); }
  get values(): string[] { return [...this.valuesInternal]; }
  set values(value: string[]) { this.setAttribute("values", JSON.stringify([...new Set(value)])); }
  private isOpen(value: string): boolean { return this.multiple ? this.valuesInternal.includes(value) : value === this.valueInternal; }
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
    if (name === "values") {
      try {
        const values: unknown = JSON.parse(newValue ?? "[]");
        this.valuesInternal = Array.isArray(values) ? [...new Set(values.filter((v): v is string => typeof v === "string"))] : [];
      } catch { this.valuesInternal = []; }
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private renderItemsMarkup(items: BoxAccordionItem[]): string {
    return items
      .map(item => {
        const isOpen = this.isOpen(item.value);
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
                <span part="label">${escapeHtml(item.label)}${item.summary ? ` <span part="summary">${escapeHtml(item.summary)}</span>` : ""}</span>
                <span part="indicator" aria-hidden="true">${isOpen ? "−" : "+"}</span>
              </button>
            </h3>
            <div
              part="panel"
              id="${panelId}"
              ${this.plainPanels ? "" : `role="region" aria-labelledby="${triggerId}"`}
              ${isOpen ? "" : "hidden"}
            ><slot name="panel-${escapeHtml(item.value)}">${escapeHtml(item.content ?? "")}</slot></div>
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
      if (this.multiple) {
        this.values = this.isOpen(nextValue) ? this.valuesInternal.filter(value => value !== nextValue) : [...this.valuesInternal, nextValue];
        this.dispatchEvent(new CustomEvent("values-changed", { detail: { values: this.values }, bubbles: true, composed: true }));
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

    if (!this.multiple && !this.hasAttribute("value") && items.length > 0 && this.valueInternal === "") {
      this.valueInternal = items[0]!.value;
      this.setAttribute("value", this.valueInternal);
    }


    if (this.plainPanels) {
      this.accordionEl.removeAttribute("role");
      this.accordionEl.removeAttribute("aria-label");
    } else {
      this.accordionEl.setAttribute("role", "region");
      this.accordionEl.setAttribute("aria-label", this.label);
    }

    if (itemsJson !== this.lastItemsJson) {
      this.accordionEl.innerHTML = this.renderItemsMarkup(items);
      this.lastItemsJson = itemsJson;
      return;
    }

    this.accordionEl.querySelectorAll('[part="item"]').forEach(node => {
      const section = node as HTMLElement;
      const value = section.dataset.value ?? "";
      const isOpen = this.isOpen(value);
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
        if (this.plainPanels) {
          panel.removeAttribute("role");
          panel.removeAttribute("aria-labelledby");
        } else {
          panel.setAttribute("role", "region");
          panel.setAttribute("aria-labelledby", trigger?.id ?? "");
        }
      }
    });
  }
}

Accordion.register();
