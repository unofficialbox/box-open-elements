const DEFAULT_TAG_NAME = "box-access-stats";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatCount = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "0";
  }
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }
  return String(value);
};

type AccessStat = {
  label: string;
  value: number;
  icon?: string;
};

/**
 * A compact, data-injected display of how a shared item has been accessed —
 * view / download / comment counts and the like. A composition: the numbers
 * arrive via the `stats` property (no transport). Presentational; each figure
 * sits in a tile inside a labelled `role="group"` so assistive tech reads the
 * value and its label together. Large counts abbreviate to `k`.
 */
export class BoxAccessStatsElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["label", "stats"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get label(): string {
    return this.getAttribute("label") ?? "Access stats";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get stats(): AccessStat[] {
    const raw = this.getAttribute("stats");
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as AccessStat[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  set stats(value: AccessStat[]) {
    this.setAttribute("stats", JSON.stringify(value));
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

    const stats = this.stats;
    const tiles = stats
      .map(stat => {
        const iconMarkup = stat.icon ? `<span part="tile-icon" aria-hidden="true">${escapeHtml(stat.icon)}</span>` : "";
        return `
          <div part="tile">
            ${iconMarkup}
            <span part="tile-value">${escapeHtml(formatCount(stat.value))}</span>
            <span part="tile-label">${escapeHtml(stat.label)}</span>
          </div>
        `;
      })
      .join("");

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="stats"] {
          margin: 0;
          padding: 0.9rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 82%, transparent);
          border-radius: 0.95rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 94%, white 6%);
        }

        [part="title"] {
          margin: 0 0 0.7rem;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="grid"] {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr));
          gap: 0.6rem;
        }

        [part="tile"] {
          display: grid;
          justify-items: center;
          gap: 0.15rem;
          padding: 0.7rem 0.5rem;
          border-radius: 0.7rem;
          background: var(--boe-token-surface-surface, #ffffff);
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 48%, transparent);
          text-align: center;
        }

        [part="tile-icon"] {
          font-size: 1rem;
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="tile-value"] {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 700;
          line-height: 1.1;
          color: var(--boe-token-text-text, #101820);
        }

        [part="tile-label"] {
          font-size: 0.76rem;
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="empty"] {
          padding: 1rem;
          text-align: center;
          color: var(--boe-token-text-text-secondary, #52606d);
          font-size: 0.9rem;
        }
      </style>
      ${
        stats.length
          ? `<section part="stats" role="group" aria-label="${escapeHtml(this.label)}">
              <p part="title">${escapeHtml(this.label)}</p>
              <div part="grid">${tiles}</div>
            </section>`
          : `<div part="empty">No access data</div>`
      }
    `;
  }
}

export const defineBoxAccessStatsElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxAccessStatsElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxAccessStatsElement;
  }

  customElements.define(tagName, BoxAccessStatsElement);
  return BoxAccessStatsElement;
};
