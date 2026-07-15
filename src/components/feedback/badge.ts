const DEFAULT_TAG_NAME = "box-badge";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxBadgeElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "tone"];
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  get label(): string {
    return this.getAttribute("label") ?? "";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get tone(): string {
    return this.getAttribute("tone") ?? "neutral";
  }

  set tone(value: string) {
    this.setAttribute("tone", value);
  }

  private render(): void {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }

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

        [part="badge"] {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.22rem 0.55rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, var(--boe-token-surface-surface, #ffffff) 90%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          white-space: nowrap;
          transition: background 140ms ease, color 140ms ease;
        }

        [part="badge"][data-tone="neutral"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 62%, var(--boe-token-stroke-stroke, #e8e8e8) 38%);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="badge"][data-tone="success"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 14%, var(--boe-token-surface-surface, #ffffff) 86%);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 62%, var(--boe-token-text-text, #222222));
        }

        [part="badge"][data-tone="error"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 70%, var(--boe-token-text-text, #222222));
        }

        [part="badge"][data-tone="warning"],
        [part="badge"][data-tone="inprogress"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 16%, var(--boe-token-surface-surface, #ffffff) 84%);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-inprogress, #f5b31b) 50%, var(--boe-token-text-text, #222222));
        }
      </style>
      <span part="badge" data-tone="${escapeHtml(this.tone)}" role="status" aria-label="${escapeHtml(this.label)}">${escapeHtml(this.label)}</span>
    `;
  }
}

export const defineBoxBadgeElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxBadgeElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxBadgeElement;
  }

  customElements.define(tagName, BoxBadgeElement);
  return BoxBadgeElement;
};
