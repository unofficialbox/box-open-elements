import { BaseElement } from "../../core/index.js";
import { boeNeutralInteractiveStyles } from "../../foundations/tokens/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-pagination";

const paginationStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
  }

  [part="pagination"] {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
  }

  [part="previous"],
  [part="next"] {
    appearance: none;
    font: inherit;
    font-size: 0.875em;
    font-weight: 600;
    line-height: 1.2;
    padding: 0.35em 0.8em;
    border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
    border-radius: 0.6rem;
    background:
      linear-gradient(
        180deg,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 94%, var(--boe-token-surface-surface-secondary, #fbfbfb) 6%) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 12%, var(--boe-token-surface-surface, #ffffff) 88%) 100%
      );
    color: var(--boe-token-text-text, #222222);
    cursor: pointer;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.82),
      0 1px 2px rgba(15, 23, 42, 0.04);
    transition:
      background-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      color ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
      box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  ${boeNeutralInteractiveStyles('[part="previous"]')}
  ${boeNeutralInteractiveStyles('[part="next"]')}

  [part="previous"]:hover:not(:disabled),
  [part="next"]:hover:not(:disabled) {
    color: var(--boe-token-surface-surface-brand, #0061d5);
  }

  [part="summary"] {
    font-size: 0.875em;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    white-space: nowrap;
  }
`;

export class BoxPaginationElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["page", "page-size", "total-items"];
  }

  private previousEl!: HTMLButtonElement;
  private nextEl!: HTMLButtonElement;
  private summaryEl!: HTMLElement;

  get page(): number {
    return Number(this.getAttribute("page") ?? "1");
  }

  set page(value: number) {
    this.setAttribute("page", String(value));
  }

  get pageSize(): number {
    return Number(this.getAttribute("page-size") ?? "10");
  }

  set pageSize(value: number) {
    this.setAttribute("page-size", String(value));
  }

  get totalItems(): number {
    return Number(this.getAttribute("total-items") ?? "0");
  }

  set totalItems(value: number) {
    this.setAttribute("total-items", String(value));
  }

  private getPaginationState(): {
    canGoNext: boolean;
    canGoPrevious: boolean;
    currentPage: number;
    endItem: number;
    startItem: number;
    totalPages: number;
  } {
    const totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));
    const currentPage = Math.min(Math.max(1, this.page), totalPages);
    return {
      canGoNext: currentPage < totalPages,
      canGoPrevious: currentPage > 1,
      currentPage,
      endItem: Math.min(currentPage * this.pageSize, this.totalItems),
      startItem: this.totalItems === 0 ? 0 : (currentPage - 1) * this.pageSize + 1,
      totalPages,
    };
  }

  private emitPageChanged(page: number): void {
    this.page = page;
    this.dispatchEvent(
      new CustomEvent("page-changed", {
        bubbles: true,
        composed: true,
        detail: { page },
      }),
    );
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${paginationStyles}</style>
      <nav part="pagination" aria-label="Pagination">
        <button type="button" part="previous" aria-label="Previous page">Previous</button>
        <span part="summary" aria-live="polite"></span>
        <button type="button" part="next" aria-label="Next page">Next</button>
      </nav>
    `;
    this.previousEl = this.shadowRoot.querySelector('[part="previous"]')!;
    this.nextEl = this.shadowRoot.querySelector('[part="next"]')!;
    this.summaryEl = this.shadowRoot.querySelector('[part="summary"]')!;
  }

  protected setupListeners(): void {
    this.previousEl.addEventListener("click", () => {
      const { canGoPrevious, currentPage } = this.getPaginationState();
      if (canGoPrevious) {
        this.emitPageChanged(currentPage - 1);
      }
    });
    this.nextEl.addEventListener("click", () => {
      const { canGoNext, currentPage } = this.getPaginationState();
      if (canGoNext) {
        this.emitPageChanged(currentPage + 1);
      }
    });
  }

  protected update(): void {
    if (!this.previousEl || !this.nextEl || !this.summaryEl) {
      return;
    }

    const { canGoNext, canGoPrevious, endItem, startItem } = this.getPaginationState();

    this.previousEl.disabled = !canGoPrevious;
    this.nextEl.disabled = !canGoNext;
    this.summaryEl.textContent = `Showing ${startItem}-${endItem} of ${this.totalItems}`;
  }
}

export const defineBoxPaginationElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxPaginationElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxPaginationElement;
  }

  customElements.define(tagName, BoxPaginationElement);
  return BoxPaginationElement;
};
