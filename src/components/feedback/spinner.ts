const DEFAULT_TAG_NAME = "box-spinner";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxSpinnerElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Loading";
  }

  set label(value: string) {
    this.setAttribute("label", value);
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

        [part="spinner"] {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        [part="indicator"] {
          display: inline-block;
          flex: none;
          width: 1.1rem;
          height: 1.1rem;
          border-radius: 999px;
          border: 2.5px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, white 82%);
          border-top-color: var(--boe-token-surface-surface-brand, #0061d5);
          animation: boe-spinner-rotate 0.8s linear infinite;
        }

        @keyframes boe-spinner-rotate {
          to {
            transform: rotate(360deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [part="indicator"] {
            animation-duration: 1.6s;
          }
        }

        [part="label"] {
          font-size: 0.86rem;
          font-weight: 600;
          color: var(--boe-token-text-text-secondary, #52606d);
        }
      </style>
      <div part="spinner" role="status" aria-live="polite">
        <span part="indicator" aria-hidden="true"></span>
        <span part="label">${escapeHtml(this.label)}</span>
      </div>
    `;
  }
}

export const defineBoxSpinnerElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxSpinnerElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxSpinnerElement;
  }

  customElements.define(tagName, BoxSpinnerElement);
  return BoxSpinnerElement;
};
