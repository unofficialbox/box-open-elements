const DEFAULT_TAG_NAME = "box-pagination";

export class BoxPaginationElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["page", "page-size", "total-items"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

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

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
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

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    const totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize));
    const currentPage = Math.min(Math.max(1, this.page), totalPages);
    const canGoPrevious = currentPage > 1;
    const canGoNext = currentPage < totalPages;
    const startItem = this.totalItems === 0 ? 0 : (currentPage - 1) * this.pageSize + 1;
    const endItem = Math.min(currentPage * this.pageSize, this.totalItems);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          color: inherit;
          font: inherit;
        }

        [part="pagination"] {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
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

        [part="previous"]:hover:not(:disabled),
        [part="next"]:hover:not(:disabled) {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="previous"]:active:not(:disabled),
        [part="next"]:active:not(:disabled) {
          background: color-mix(in srgb, var(--boe-token-surface-item-surface-selected, #f2f7fd) 64%, var(--boe-token-surface-surface, #ffffff) 36%);
        }

        [part="previous"]:focus-visible,
        [part="next"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="previous"]:disabled,
        [part="next"]:disabled {
          cursor: not-allowed;
          opacity: 0.55;
          box-shadow: none;
        }

        [part="summary"] {
          font-size: 0.875em;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          white-space: nowrap;
        }
      </style>
      <nav part="pagination" aria-label="Pagination">
        <button type="button" part="previous" aria-label="Previous page" ${canGoPrevious ? "" : "disabled"}>Previous</button>
        <span part="summary" aria-live="polite">Showing ${startItem}-${endItem} of ${this.totalItems}</span>
        <button type="button" part="next" aria-label="Next page" ${canGoNext ? "" : "disabled"}>Next</button>
      </nav>
    `;

    this.shadowRoot.querySelector('[part="previous"]')?.addEventListener("click", () => {
      if (canGoPrevious) {
        this.emitPageChanged(currentPage - 1);
      }
    });
    this.shadowRoot.querySelector('[part="next"]')?.addEventListener("click", () => {
      if (canGoNext) {
        this.emitPageChanged(currentPage + 1);
      }
    });
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
