import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-chart-panel";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type ChartPanelAction = {
  id: string;
  label: string;
  tone?: string;
};

type ChartPanelLegendItem = {
  label: string;
  tone?: string;
  value?: string;
};

type ChartPanelPoint = {
  id: string;
  label: string;
  tone?: string;
  value: number;
};


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="panel"] {
          display: grid;
          gap: 0.875rem;
          padding: 0.95rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 1rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 96%, var(--boe-token-surface-surface, #ffffff) 4%);
        }

        [part="header"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: start;
          justify-content: space-between;
        }

        [part="meta"] {
          display: grid;
          gap: 0.3rem;
        }

        [part="header-side"] {
          display: grid;
          gap: 0.45rem;
          justify-items: end;
        }

        [part="title"] {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="summary"] {
          font-size: 1.65rem;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.04em;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="message"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.5;
        }

        [part="timeframe"] {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        [part="action"] {
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 64%, transparent);
          border-radius: 999px;
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          font: inherit;
          padding: 0.58rem 0.9rem;
          cursor: pointer;
        }

        [part="action"][data-tone="primary"] {
          border-color: transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="visual"] {
          padding: 0.8rem;
          border-radius: 1rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, #eef4fb 12%);
        }

        [part="chart"] {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(3.9rem, 1fr));
          gap: 0.7rem;
          align-items: end;
          min-height: 10.5rem;
        }

        [part="point"] {
          appearance: none;
          display: grid;
          gap: 0.45rem;
          align-content: end;
          padding: 0.55rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 52%, transparent);
          border-radius: 0.9rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 90%, #eef4fb 10%);
          cursor: pointer;
          font: inherit;
          color: inherit;
          text-align: left;
        }

        [part="point"][data-tone="accent"] {
          border-color: color-mix(in srgb, #5a7cf7 22%, var(--boe-token-stroke-stroke, #e8e8e8) 78%);
          background: color-mix(in srgb, #5a7cf7 8%, var(--boe-token-surface-surface, #ffffff) 92%);
        }

        [part="point"][data-tone="success"] {
          border-color: color-mix(in srgb, #26c281 22%, var(--boe-token-stroke-stroke, #e8e8e8) 78%);
          background: color-mix(in srgb, #26c281 8%, var(--boe-token-surface-surface, #ffffff) 92%);
        }

        [part="point"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }

        [part="bar"] {
          display: block;
          inline-size: 100%;
          min-block-size: 0.55rem;
          block-size: calc(6.5rem * var(--point-ratio));
          border-radius: 0.75rem;
          background: linear-gradient(180deg, color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 84%, var(--boe-token-surface-surface, #ffffff) 16%) 0%, var(--boe-token-surface-surface-brand, #0061d5) 100%);
        }

        [part="point"][data-tone="accent"] [part="bar"] {
          background: linear-gradient(180deg, #5a7cf7 0%, #3f62ea 100%);
        }

        [part="point"][data-tone="success"] [part="bar"] {
          background: linear-gradient(180deg, rgba(38, 194, 129, 0.86) 0%, rgba(19, 138, 88, 0.94) 100%);
        }

        [part="point-label"] {
          font-size: 0.86rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="point-value"] {
          font-size: 0.82rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="legend"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }

        [part="legend-item"] {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.42rem 0.65rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 86%, #eef4fb 14%);
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
        }

        [part="legend-item"][data-tone="accent"] {
          border-color: color-mix(in srgb, #5a7cf7 18%, var(--boe-token-stroke-stroke, #e8e8e8) 82%);
          background: color-mix(in srgb, #5a7cf7 7%, var(--boe-token-surface-surface, #ffffff) 93%);
        }

        [part="legend-item"][data-tone="success"] {
          border-color: color-mix(in srgb, #26c281 18%, var(--boe-token-stroke-stroke, #e8e8e8) 82%);
          background: color-mix(in srgb, #26c281 7%, var(--boe-token-surface-surface, #ffffff) 93%);
        }

        [part="legend-swatch"] {
          inline-size: 0.7rem;
          block-size: 0.7rem;
          border-radius: 999px;
          background: linear-gradient(180deg, color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 84%, var(--boe-token-surface-surface, #ffffff) 16%) 0%, var(--boe-token-surface-surface-brand, #0061d5) 100%);
        }

        [part="legend-item"][data-tone="accent"] [part="legend-swatch"] {
          background: linear-gradient(180deg, #5a7cf7 0%, #3f62ea 100%);
        }

        [part="legend-item"][data-tone="success"] [part="legend-swatch"] {
          background: linear-gradient(180deg, rgba(38, 194, 129, 0.86) 0%, rgba(19, 138, 88, 0.94) 100%);
        }

        [part="legend-label"] {
          font-weight: 700;
        }

        [part="legend-value"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="empty"] {
          padding: 1rem;
          border-radius: 0.9rem;
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }
      `;

export class BoxChartPanelElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["actions", "heading", "legend", "message", "points", "summary", "timeframe"];
  }
  get actions(): ChartPanelAction[] {
    return this.parseJsonAttribute<ChartPanelAction[]>("actions", []);
  }

  set actions(value: ChartPanelAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get legend(): ChartPanelLegendItem[] {
    return this.parseJsonAttribute<ChartPanelLegendItem[]>("legend", []);
  }

  set legend(value: ChartPanelLegendItem[]) {
    this.setAttribute("legend", JSON.stringify(value));
  }

  get message(): string {
    return this.getAttribute("message") ?? "";
  }

  set message(value: string) {
    if (!value) {
      this.removeAttribute("message");
      return;
    }

    this.setAttribute("message", value);
  }

  get points(): ChartPanelPoint[] {
    return this.parseJsonAttribute<ChartPanelPoint[]>("points", []);
  }

  set points(value: ChartPanelPoint[]) {
    this.setAttribute("points", JSON.stringify(value));
  }

  get summary(): string {
    return this.getAttribute("summary") ?? "";
  }

  set summary(value: string) {
    if (!value) {
      this.removeAttribute("summary");
      return;
    }

    this.setAttribute("summary", value);
  }

  get timeframe(): string {
    return this.getAttribute("timeframe") ?? "";
  }

  set timeframe(value: string) {
    if (!value) {
      this.removeAttribute("timeframe");
      return;
    }

    this.setAttribute("timeframe", value);
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "Chart";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  connectedCallback(): void {
    super.connectedCallback();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {

    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private parseJsonAttribute<T>(name: string, fallback: T): T {
    const raw = this.getAttribute(name);
    if (!raw) {
      return fallback;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private emitAction(actionId: string): void {
    this.dispatchEvent(
      new CustomEvent("action", {
        bubbles: true,
        composed: true,
        detail: { action: actionId },
      }),
    );
  }

  private emitPointSelected(point: ChartPanelPoint): void {
    this.dispatchEvent(
      new CustomEvent("point-selected", {
        bubbles: true,
        composed: true,
        detail: point,
      }),
    );
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

    const maxValue = this.points.reduce((max, point) => Math.max(max, point.value), 0) || 1;
    const messageMarkup = this.message ? `<div part="message">${escapeHtml(this.message)}</div>` : "";
    const summaryMarkup = this.summary ? `<div part="summary">${escapeHtml(this.summary)}</div>` : "";
    const timeframeMarkup = this.timeframe ? `<div part="timeframe">${escapeHtml(this.timeframe)}</div>` : "";
    const actionsMarkup = this.actions.length
      ? `
          <div part="actions">
            ${this.actions
              .map(
                action => `
                  <button type="button" part="action" data-action-id="${escapeHtml(action.id)}" data-tone="${escapeHtml(action.tone ?? "neutral")}">
                    ${escapeHtml(action.label)}
                  </button>
                `,
              )
              .join("")}
          </div>
        `
      : "";
    const chartMarkup = this.points.length
      ? `
          <div part="chart" role="list" aria-label="${escapeHtml(this.heading)} chart data">
            ${this.points
              .map(
                point => `
                  <button
                    type="button"
                    part="point"
                    role="listitem"
                    data-point-id="${escapeHtml(point.id)}"
                    aria-label="${escapeHtml(`${point.label}: ${point.value}`)}"
                    data-tone="${escapeHtml(point.tone ?? "neutral")}"
                  >
                    <span part="bar" style="--point-ratio:${Math.max(point.value, 0) / maxValue};"></span>
                    <span part="point-label">${escapeHtml(point.label)}</span>
                    <span part="point-value">${escapeHtml(String(point.value))}</span>
                  </button>
                `,
              )
              .join("")}
          </div>
        `
      : `<div part="empty">No chart data available.</div>`;
    const legendMarkup = this.legend.length
      ? `
          <div part="legend">
            ${this.legend
              .map(
                item => `
                  <div part="legend-item" data-tone="${escapeHtml(item.tone ?? "neutral")}">
                    <span part="legend-swatch"></span>
                    <span part="legend-label">${escapeHtml(item.label)}</span>
                    ${item.value ? `<span part="legend-value">${escapeHtml(item.value)}</span>` : ""}
                  </div>
                `,
              )
              .join("")}
          </div>
        `
      : "";

    const host = this.shadowRoot.querySelector('[part="content-host"]');
    if (!host) {
      return;
    }

    host.innerHTML = `
      <article part="panel">
        <header part="header">
          <div part="meta">
            <div part="title">${escapeHtml(this.heading)}</div>
            ${summaryMarkup}
            ${messageMarkup}
          </div>
          <div part="header-side">
            ${timeframeMarkup}
            ${actionsMarkup}
          </div>
        </header>
        <section part="visual">
          <slot name="chart">
            ${chartMarkup}
          </slot>
        </section>
        ${legendMarkup}
      </article>
    `;

    this.shadowRoot.querySelectorAll('[part="action"]').forEach(button => {
      button.addEventListener("click", () => {
        const actionId = button.getAttribute("data-action-id");
        if (actionId) {
          this.emitAction(actionId);
        }
      });
    });

    this.shadowRoot.querySelectorAll('[part="point"]').forEach(button => {
      button.addEventListener("click", () => {
        const pointId = button.getAttribute("data-point-id");
        const point = this.points.find(item => item.id === pointId);
        if (point) {
          this.emitPointSelected(point);
        }
      });
    });
  
  }
}

export const defineBoxChartPanelElement = (tagName = DEFAULT_TAG_NAME): void => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, BoxChartPanelElement);
  }
};
