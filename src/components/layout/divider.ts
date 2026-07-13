const DEFAULT_TAG_NAME = "box-divider";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxDividerElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "orientation"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get orientation(): string {
    return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal";
  }

  set orientation(value: string) {
    this.setAttribute("orientation", value);
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

    const orientation = this.orientation;
    const label = this.label;
    // A vertical divider never carries a label; only horizontal section dividers do.
    const hasLabel = orientation === "horizontal" && label.length > 0;

    const inner = hasLabel
      ? `
        <span part="line line-start"></span>
        <span part="label">${escapeHtml(label)}</span>
        <span part="line line-end"></span>
      `
      : `<span part="line"></span>`;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          /* A horizontal divider spans its container even when placed as a flex item. */
          inline-size: 100%;
          color: inherit;
          font: inherit;
        }

        :host([orientation="vertical"]) {
          display: inline-block;
          inline-size: auto;
          block-size: 100%;
          vertical-align: middle;
        }

        [part="divider"] {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          inline-size: 100%;
        }

        :host([orientation="vertical"]) [part="divider"] {
          flex-direction: column;
          inline-size: auto;
          block-size: 100%;
          min-block-size: 1rem;
        }

        [part~="line"] {
          flex: 1 1 0%;
          block-size: 1px;
          border: 0;
          background: var(--boe-token-stroke-stroke, #e8e8e8);
        }

        :host([orientation="vertical"]) [part~="line"] {
          inline-size: 1px;
          block-size: auto;
          align-self: stretch;
        }

        [part="label"] {
          flex: 0 0 auto;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          white-space: nowrap;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }
      </style>
      <div
        part="divider"
        role="separator"
        aria-orientation="${orientation}"
        ${hasLabel ? `aria-label="${escapeHtml(label)}"` : ""}
      >${inner}</div>
    `;
  }
}

export const defineBoxDividerElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxDividerElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxDividerElement;
  }

  customElements.define(tagName, BoxDividerElement);
  return BoxDividerElement;
};
