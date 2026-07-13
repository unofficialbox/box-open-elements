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
      <style>
        :host {
          display: inline-block;
          color: inherit;
          font: inherit;
        }

        [part="skeleton"] {
          border-radius: 0.5rem;
          background:
            linear-gradient(
              90deg,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 55%, var(--boe-token-stroke-stroke, #e8e8e8) 45%) 0%,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 88%, white 12%) 50%,
              color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 55%, var(--boe-token-stroke-stroke, #e8e8e8) 45%) 100%
            );
          background-size: 200% 100%;
          animation: boe-skeleton-shimmer 1.4s ease infinite;
        }

        @keyframes boe-skeleton-shimmer {
          0% {
            background-position: 100% 0;
          }

          100% {
            background-position: -100% 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [part="skeleton"] {
            animation: none;
          }
        }
      </style>
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
