import { BaseElement } from "../../core/index.js";
import { boePanel } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-access-stats";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatFullCount = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return String(value);
};

const formatScaled = (abs: number, divisor: number): string => {
  const scaled = abs / divisor;
  const decimals = abs % divisor === 0 ? 0 : 1;
  const rounded = Math.round(scaled * 10 ** decimals) / 10 ** decimals;
  return rounded % 1 === 0 ? String(Math.round(rounded)) : rounded.toFixed(decimals);
};

const formatCount = (value: number): string => {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);

  if (abs >= 1_000_000_000) {
    return `${sign}${formatScaled(abs, 1_000_000_000)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${formatScaled(abs, 1_000_000)}M`;
  }
  if (abs >= 1000) {
    const kDisplay = formatScaled(abs, 1000);
    if (parseFloat(kDisplay) >= 1000) {
      return `${sign}${formatScaled(abs, 1_000_000)}M`;
    }
    return `${sign}${kDisplay}k`;
  }

  return String(value);
};

type AccessStat = {
  label: string;
  value: number;
  icon?: string;
};

const isAccessStat = (candidate: unknown): candidate is AccessStat => {
  if (typeof candidate !== "object" || candidate === null) {
    return false;
  }
  const { label, value, icon } = candidate as Record<string, unknown>;
  return (
    typeof label === "string" &&
    typeof value === "number" &&
    Number.isFinite(value) &&
    (icon === undefined || typeof icon === "string")
  );
};

/**
 * A compact, data-injected display of how a shared item has been accessed —
 * view / download / comment counts and the like. A composition: the numbers
 * arrive via the `stats` property (no transport). Presentational; each figure
 * sits in a tile inside a labelled `role="group"` so assistive tech reads the
 * value and its label together. Large counts abbreviate to `k`.
 */

const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
          font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
        }

        [part="stats"] {
          margin: 0;
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: ${boePanel.background};
        }

        [part="title"] {
          margin: 0 0 0.5rem;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
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
          padding: 0.5rem 0.45rem;
          border-radius: 0.65rem;
          background: var(--boe-token-surface-surface, #ffffff);
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
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
          color: var(--boe-token-text-text, #222222);
        }

        [part="tile-label"] {
          font-size: 0.76rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="empty"] {
          padding: ${boePanel.padding};
          text-align: center;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.9rem;
        }
      `;

export class BoxAccessStatsElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label", "stats"];
  }
  get label(): string {
    return this.getAttribute("label")?.trim() || "Access stats";
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
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isAccessStat) : [];
    } catch {
      return [];
    }
  }

  set stats(value: AccessStat[]) {
    this.setAttribute("stats", JSON.stringify(value));
  }

  connectedCallback(): void {
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {

    super.attributeChangedCallback(name, oldValue, newValue);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <div part="content-host"></div>
    `;
  }

  protected update(): void {
    if (!this.shadowRoot) {
      return;
    }

    const stats = this.stats;
    const tiles = stats
      .map(stat => {
        const iconMarkup = stat.icon ? `<span part="tile-icon" aria-hidden="true">${escapeHtml(stat.icon)}</span>` : "";
        const accessibleLabel = `${formatFullCount(stat.value)} ${stat.label}`;
        return `
          <div part="tile" role="group" aria-label="${escapeHtml(accessibleLabel)}">
            ${iconMarkup}
            <span part="tile-value" aria-hidden="true">${escapeHtml(formatCount(stat.value))}</span>
            <span part="tile-label" aria-hidden="true">${escapeHtml(stat.label)}</span>
          </div>
        `;
      })
      .join("");

    const host = this.shadowRoot.querySelector('[part="content-host"]');
    if (!host) {
      return;
    }

    host.innerHTML = `
      ${
        `<section part="stats" aria-labelledby="access-stats-title">
              <p part="title" id="access-stats-title">${escapeHtml(this.label)}</p>
              ${stats.length ? `<div part="grid">${tiles}</div>` : `<div part="empty">No access data</div>`}
            </section>`
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
