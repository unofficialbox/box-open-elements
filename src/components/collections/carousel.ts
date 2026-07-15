import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-carousel";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type CarouselItem = {
  eyebrow?: string;
  title: string;
  description?: string;
  imageSrc?: string;
};

const carouselStyles = `
  :host {
    display: block;
    color: inherit;
    font: inherit;
  }

  [part="carousel"] {
    display: grid;
    gap: 1rem;
    padding: 1.15rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 84%, var(--boe-token-surface-surface, #ffffff) 16%);
    border-radius: 1.2rem;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 90%, var(--boe-token-surface-surface, #ffffff) 10%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 84%, var(--boe-token-surface-surface-secondary, #fbfbfb) 16%) 100%
      );
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.82),
      0 18px 36px rgba(15, 23, 42, 0.05);
  }

  [part="label"] {
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  [part="viewport"] {
    display: grid;
    grid-template-columns: minmax(12rem, 16rem) minmax(0, 1fr);
    gap: 1.15rem;
    align-items: stretch;
  }

  [part="image"],
  [part="image-placeholder"] {
    inline-size: 100%;
    block-size: 100%;
    min-block-size: 12rem;
    border-radius: 1.05rem;
    object-fit: cover;
    background:
      linear-gradient(
        145deg,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 28%, var(--boe-token-surface-surface, #ffffff) 72%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, var(--boe-token-surface-surface-secondary, #fbfbfb) 84%) 44%,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 78%, var(--boe-token-surface-surface, #ffffff) 22%) 100%
      );
    border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.75),
      inset 0 0 0 1px rgba(255, 255, 255, 0.18),
      0 18px 34px rgba(15, 23, 42, 0.08);
  }

  [part="content"] {
    display: grid;
    gap: 0.8rem;
    align-content: center;
    padding: 1rem 1.05rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-stroke-stroke, #e8e8e8) 90%);
    border-radius: 1.05rem;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 90%, var(--boe-token-surface-surface-secondary, #fbfbfb) 10%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 4%, var(--boe-token-surface-surface-secondary, #fbfbfb) 14%, var(--boe-token-surface-surface, #ffffff) 82%) 100%
      );
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.8),
      0 10px 22px rgba(15, 23, 42, 0.04);
  }

  [part="eyebrow"] {
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="title"] {
    font-size: 1.52rem;
    font-weight: 700;
    line-height: 1.12;
    letter-spacing: -0.03em;
  }

  [part="description"] {
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    line-height: 1.58;
    max-width: 44ch;
  }

  [part="controls"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding-top: 0.2rem;
  }

  [part="nav"] {
    display: flex;
    gap: 0.65rem;
  }

  [part="previous"],
  [part="next"] {
    inline-size: 2.45rem;
    block-size: 2.45rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 76%, var(--boe-token-surface-surface, #ffffff) 24%);
    border-radius: 0.95rem;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, var(--boe-token-surface-surface-secondary, #fbfbfb) 8%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 14%, var(--boe-token-surface-surface, #ffffff) 86%) 100%
      );
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    font: inherit;
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.74),
      0 10px 20px rgba(15, 23, 42, 0.04);
    transition:
      border-color 140ms ease,
      background 140ms ease,
      color 140ms ease;
  }

  [part="previous"]:hover,
  [part="next"]:hover {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-item-surface-hover, #eef4fb) 74%, var(--boe-token-surface-surface, #ffffff) 26%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 6%, var(--boe-token-surface-item-surface-hover, #eef4fb) 68%, var(--boe-token-surface-surface, #ffffff) 26%) 100%
      );
    color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="pagination"] {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    padding: 0.35rem 0.45rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, var(--boe-token-surface-surface, #ffffff) 30%);
    border-radius: 999px;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, var(--boe-token-surface-surface-secondary, #fbfbfb) 8%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 3%, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%, var(--boe-token-surface-surface, #ffffff) 85%) 100%
      );
  }

  [part~="dot"] {
    inline-size: 0.74rem;
    block-size: 0.72rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 72%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 90%, var(--boe-token-surface-surface-secondary, #fbfbfb) 10%);
    cursor: pointer;
    transition: inline-size 140ms ease, background 140ms ease, border-color 140ms ease;
  }

  [part~="dot-selected"] {
    inline-size: 1.4rem;
    background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, var(--boe-token-surface-surface, #ffffff) 84%);
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 24%, transparent);
  }

  [part="previous"]:focus-visible,
  [part="next"]:focus-visible,
  [part~="dot"]:focus-visible {
    outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5);
    outline-offset: 2px;
  }

  [part="empty"],
  [part="stage"][hidden],
  [part="controls"][hidden],
  [part="eyebrow"][hidden],
  [part="description"][hidden],
  [part="empty"][hidden] {
    display: none;
  }

  [part="empty"]:not([hidden]) {
    display: block;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    line-height: 1.58;
  }

  @media (max-width: 720px) {
    [part="viewport"] {
      grid-template-columns: 1fr;
    }
  }
`;

export class BoxCarouselElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["items", "label", "value"];
  }

  private valueInternal = 0;
  private lastItemsJson = "";

  private carouselEl!: HTMLElement;
  private labelEl!: HTMLElement;
  private stageEl!: HTMLElement;
  private mediaEl!: HTMLElement;
  private eyebrowEl!: HTMLElement;
  private titleEl!: HTMLElement;
  private descriptionEl!: HTMLElement;
  private controlsEl!: HTMLElement;
  private paginationEl!: HTMLElement;
  private emptyEl!: HTMLElement;
  private previousEl!: HTMLButtonElement;
  private nextEl!: HTMLButtonElement;

  get label(): string {
    return this.getAttribute("label") ?? "Carousel";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get items(): CarouselItem[] {
    const raw = this.getAttribute("items");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as CarouselItem[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set items(value: CarouselItem[]) {
    this.setAttribute("items", JSON.stringify(value));
  }

  get value(): number {
    return this.valueInternal;
  }

  set value(value: number) {
    this.valueInternal = this.normalizeIndex(value);
    this.setAttribute("value", String(this.valueInternal));
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "value") {
      this.valueInternal = this.normalizeIndex(Number(this.getAttribute("value") ?? "0"));
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private normalizeIndex(value: number): number {
    const maxIndex = Math.max(0, this.items.length - 1);
    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.min(maxIndex, Math.max(0, Math.round(value)));
  }

  private emitValueChanged(index: number): void {
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: index },
      }),
    );
  }

  private setIndex(index: number): void {
    const nextIndex = this.normalizeIndex(index);
    this.valueInternal = nextIndex;
    this.setAttribute("value", String(nextIndex));
    this.emitValueChanged(nextIndex);
    if (this.isRendered) {
      this.update();
    }
  }

  private changeBy(delta: number): void {
    if (this.items.length === 0) {
      return;
    }

    const nextIndex = (this.valueInternal + delta + this.items.length) % this.items.length;
    this.setIndex(nextIndex);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${carouselStyles}</style>
      <section part="carousel">
        <div part="label"></div>
        <div part="stage">
          <div part="viewport">
            <div part="media"></div>
            <div part="content">
              <div part="eyebrow" hidden></div>
              <div part="title"></div>
              <div part="description" hidden></div>
            </div>
          </div>
        </div>
        <div part="controls">
          <div part="nav">
            <button type="button" part="previous" aria-label="Previous slide">‹</button>
            <button type="button" part="next" aria-label="Next slide">›</button>
          </div>
          <div part="pagination" role="tablist"></div>
        </div>
        <div part="empty" hidden>No items</div>
      </section>
    `;

    this.carouselEl = this.shadowRoot.querySelector('[part="carousel"]')!;
    this.labelEl = this.shadowRoot.querySelector('[part="label"]')!;
    this.stageEl = this.shadowRoot.querySelector('[part="stage"]')!;
    this.mediaEl = this.shadowRoot.querySelector('[part="media"]')!;
    this.eyebrowEl = this.shadowRoot.querySelector('[part="eyebrow"]')!;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.descriptionEl = this.shadowRoot.querySelector('[part="description"]')!;
    this.controlsEl = this.shadowRoot.querySelector('[part="controls"]')!;
    this.paginationEl = this.shadowRoot.querySelector('[part="pagination"]')!;
    this.emptyEl = this.shadowRoot.querySelector('[part="empty"]')!;
    this.previousEl = this.shadowRoot.querySelector('[part="previous"]')!;
    this.nextEl = this.shadowRoot.querySelector('[part="next"]')!;
  }

  protected setupListeners(): void {
    this.previousEl.addEventListener("click", () => this.changeBy(-1));
    this.nextEl.addEventListener("click", () => this.changeBy(1));
    this.paginationEl.addEventListener("click", event => {
      const target = (event.target as HTMLElement | null)?.closest('[part~="dot"]') as HTMLButtonElement | null;
      if (!target || !this.paginationEl.contains(target)) {
        return;
      }
      const index = Number(target.dataset.index ?? "0");
      this.setIndex(index);
    });
  }

  protected update(): void {
    if (!this.carouselEl || !this.labelEl || !this.stageEl || !this.mediaEl) {
      return;
    }

    const items = this.items;
    const itemsJson = this.getAttribute("items") ?? "";
    const activeItem = items[this.valueInternal] ?? null;
    const label = this.label;

    this.carouselEl.setAttribute("aria-label", label);
    this.labelEl.textContent = label;
    this.paginationEl.setAttribute("aria-label", `${label} slides`);

    if (!activeItem) {
      this.stageEl.hidden = true;
      this.controlsEl.hidden = true;
      this.emptyEl.hidden = false;
      this.lastItemsJson = itemsJson;
      return;
    }

    this.stageEl.hidden = false;
    this.controlsEl.hidden = false;
    this.emptyEl.hidden = true;

    if (activeItem.imageSrc) {
      this.mediaEl.innerHTML = `<img part="image" src="${escapeHtml(activeItem.imageSrc)}" alt="" />`;
    } else {
      this.mediaEl.innerHTML = `<div part="image-placeholder" aria-hidden="true"></div>`;
    }

    this.eyebrowEl.textContent = activeItem.eyebrow ?? "";
    this.eyebrowEl.hidden = !activeItem.eyebrow;
    this.titleEl.textContent = activeItem.title;
    this.descriptionEl.textContent = activeItem.description ?? "";
    this.descriptionEl.hidden = !activeItem.description;

    if (itemsJson !== this.lastItemsJson) {
      this.paginationEl.innerHTML = items
        .map((item, index) => {
          const dotPart = index === this.valueInternal ? "dot dot-selected" : "dot";
          return `
            <button
              type="button"
              part="${dotPart}"
              role="tab"
              aria-label="Go to slide ${index + 1}: ${escapeHtml(item.title)}"
              aria-current="${String(index === this.valueInternal)}"
              data-index="${index}"
            ></button>
          `;
        })
        .join("");
      this.lastItemsJson = itemsJson;
    } else {
      this.paginationEl.querySelectorAll('[part~="dot"]').forEach(node => {
        const button = node as HTMLButtonElement;
        const index = Number(button.dataset.index ?? "0");
        const selected = index === this.valueInternal;
        button.setAttribute("part", selected ? "dot dot-selected" : "dot");
        button.setAttribute("aria-current", String(selected));
      });
    }
  }
}

export const defineBoxCarouselElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxCarouselElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxCarouselElement;
  }

  customElements.define(tagName, BoxCarouselElement);
  return BoxCarouselElement;
};
