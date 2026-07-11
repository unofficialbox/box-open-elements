const DEFAULT_TAG_NAME = "box-skeleton";

export class BoxSkeletonElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["height", "width"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get width(): string {
    return this.getAttribute("width") ?? "100%";
  }

  set width(value: string) {
    this.setAttribute("width", value);
  }

  get height(): string {
    return this.getAttribute("height") ?? "16px";
  }

  set height(value: string) {
    this.setAttribute("height", value);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <span
        part="skeleton"
        style="display:inline-block;width:${this.width};height:${this.height};"
        aria-hidden="true"
      ></span>
    `;
  }
}

export const defineBoxSkeletonElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSkeletonElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSkeletonElement;
  }

  customElements.define(tagName, BoxSkeletonElement);
  return BoxSkeletonElement;
};
