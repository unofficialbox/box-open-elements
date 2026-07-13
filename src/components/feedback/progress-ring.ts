const DEFAULT_TAG_NAME = "box-progress-ring";

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export class BoxProgressRingElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "max", "size", "value"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Progress";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get max(): number {
    return Number(this.getAttribute("max") ?? "100");
  }

  set max(value: number) {
    this.setAttribute("max", String(value));
  }

  get size(): number {
    return Number(this.getAttribute("size") ?? "88");
  }

  set size(value: number) {
    this.setAttribute("size", String(value));
  }

  get value(): number {
    return Number(this.getAttribute("value") ?? "0");
  }

  set value(value: number) {
    this.setAttribute("value", String(value));
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

    const max = Math.max(1, this.max);
    const value = clamp(this.value, 0, max);
    const percentage = Math.round((value / max) * 100);
    const size = Math.max(48, this.size);
    const strokeWidth = Math.max(6, Math.round(size * 0.09));
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (percentage / 100) * circumference;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          color: inherit;
          font: inherit;
        }

        [part="ring"] {
          display: inline-grid;
          place-items: center;
        }

        [part="svg"] {
          grid-area: 1 / 1;
          width: ${size}px;
          height: ${size}px;
          transform: rotate(-90deg);
        }

        circle[part="track"] {
          stroke: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 55%, var(--boe-token-stroke-stroke, #e8e8e8) 45%);
        }

        circle[part="indicator"] {
          stroke: var(--boe-token-surface-surface-brand, #0061d5);
          stroke-linecap: round;
          transition: stroke-dashoffset 140ms ease;
        }

        [part="meta"] {
          grid-area: 1 / 1;
          display: grid;
          justify-items: center;
          gap: 0.1rem;
          text-align: center;
        }

        [part="value"] {
          font-size: ${Math.max(0.8, size / 88)}rem;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
          color: var(--boe-token-text-text, #222222);
        }

        [part="label"] {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }
      </style>
      <div part="ring" role="group" aria-label="${escapeHtml(this.label)} progress">
        <svg
          part="svg"
          viewBox="0 0 ${size} ${size}"
          role="progressbar"
          aria-label="${escapeHtml(this.label)}"
          aria-valuemin="0"
          aria-valuemax="${max}"
          aria-valuenow="${value}"
          aria-valuetext="${percentage}%"
        >
          <circle
            part="track"
            cx="${size / 2}"
            cy="${size / 2}"
            r="${radius}"
            stroke-width="${strokeWidth}"
            fill="none"
          ></circle>
          <circle
            part="indicator"
            cx="${size / 2}"
            cy="${size / 2}"
            r="${radius}"
            stroke-width="${strokeWidth}"
            fill="none"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${dashOffset}"
          ></circle>
        </svg>
        <div part="meta">
          <span part="value">${percentage}%</span>
          <span part="label">${escapeHtml(this.label)}</span>
        </div>
      </div>
    `;
  }
}

export const defineBoxProgressRingElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxProgressRingElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxProgressRingElement;
  }

  customElements.define(tagName, BoxProgressRingElement);
  return BoxProgressRingElement;
};
