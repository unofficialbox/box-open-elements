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
