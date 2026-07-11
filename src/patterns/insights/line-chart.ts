const DEFAULT_TAG_NAME = "box-line-chart";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type LineChartAction = {
  id: string;
  label: string;
  tone?: string;
};

type LineChartLegendItem = {
  label: string;
  tone?: string;
  value?: string;
};

type LineChartPoint = {
  id: string;
  label: string;
  tone?: string;
  value: number;
};

type ChartCoordinate = {
  point: LineChartPoint;
  x: number;
  y: number;
};

export class BoxLineChartElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return ["actions", "legend", "message", "points", "summary", "timeframe", "title"];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  get actions(): LineChartAction[] {
    return this.parseJsonAttribute<LineChartAction[]>("actions", []);
  }

  set actions(value: LineChartAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get legend(): LineChartLegendItem[] {
    return this.parseJsonAttribute<LineChartLegendItem[]>("legend", []);
  }

  set legend(value: LineChartLegendItem[]) {
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

  get points(): LineChartPoint[] {
    return this.parseJsonAttribute<LineChartPoint[]>("points", []);
  }

  set points(value: LineChartPoint[]) {
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

  get title(): string {
    return this.getAttribute("title") ?? "Line Chart";
  }

  set title(value: string) {
    this.setAttribute("title", value);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
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

  private emitPointSelected(point: LineChartPoint): void {
    this.dispatchEvent(
      new CustomEvent("point-selected", {
        bubbles: true,
        composed: true,
        detail: point,
      }),
    );
  }

  private getCoordinates(points: LineChartPoint[]): ChartCoordinate[] {
    if (points.length === 0) {
      return [];
    }

    const max = points.reduce((value, point) => Math.max(value, point.value), 0) || 1;
    const min = points.reduce((value, point) => Math.min(value, point.value), points[0]?.value ?? 0);
    const spread = Math.max(max - min, 1);
    const horizontalInset = 0;
    const chartWidth = 100 - horizontalInset * 2;

    return points.map((point, index) => {
      const x = points.length === 1 ? 50 : horizontalInset + (index / (points.length - 1)) * chartWidth;
      const y = 47 - ((point.value - min) / spread) * 40;
      return {
        point,
        x: Number(x.toFixed(2)),
        y: Number(Math.max(4, Math.min(47, y)).toFixed(2)),
      };
    });
  }

  private buildSmoothPath(coordinates: ChartCoordinate[]): string {
    if (coordinates.length === 0) {
      return "";
    }

    if (coordinates.length === 1) {
      const { x, y } = coordinates[0];
      return `M ${x} ${y}`;
    }

    let path = `M ${coordinates[0].x} ${coordinates[0].y}`;
    for (let index = 0; index < coordinates.length - 1; index += 1) {
      const current = coordinates[index];
      const next = coordinates[index + 1];
      const controlX = Number(((current.x + next.x) / 2).toFixed(2));
      path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }
    return path;
  }

  private buildAreaPath(coordinates: ChartCoordinate[]): string {
    if (coordinates.length === 0) {
      return "";
    }

    const linePath = this.buildSmoothPath(coordinates);
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    return `${linePath} L ${last.x} 52 L ${first.x} 52 Z`;
  }

  private render(): void {
    if (!this.shadowRoot) {
      return;
    }

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
    const coordinates = this.getCoordinates(this.points);
    const linePath = this.buildSmoothPath(coordinates);
    const areaPath = this.buildAreaPath(coordinates);
    const chartMarkup = this.points.length
      ? `
          <div part="visual">
            <svg part="chart" viewBox="0 0 100 56" role="img" aria-label="${escapeHtml(this.title)} trend line">
              <defs>
                <linearGradient id="line-chart-area-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 26%, transparent)"></stop>
                  <stop offset="100%" stop-color="color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 3%, transparent)"></stop>
                </linearGradient>
              </defs>
              <line part="grid-line" x1="0" y1="5" x2="100" y2="5"></line>
              <line part="grid-line" x1="0" y1="20.5" x2="100" y2="20.5"></line>
              <line part="grid-line" x1="0" y1="36" x2="100" y2="36"></line>
              <line part="grid-line" x1="0" y1="51.5" x2="100" y2="51.5"></line>
              <path part="area" d="${areaPath}"></path>
              <path part="path" d="${linePath}"></path>
              ${coordinates
                .map(({ point, x, y }) => {
                  return `
                    <circle part="dot-halo" cx="${x}" cy="${y}" r="2.2"></circle>
                    <circle part="dot" data-tone="${escapeHtml(point.tone ?? "neutral")}" cx="${x}" cy="${y}" r="1.2"></circle>
                  `;
                })
                .join("")}
            </svg>
            <div part="points" role="list" aria-label="${escapeHtml(this.title)} points">
              ${coordinates
                .map(
                  ({ point }) => `
                    <button
                      type="button"
                      part="point"
                      role="listitem"
                      data-point-id="${escapeHtml(point.id)}"
                      data-tone="${escapeHtml(point.tone ?? "neutral")}"
                      aria-label="${escapeHtml(`${point.label}: ${point.value}`)}"
                    >
                      <span part="point-label">${escapeHtml(point.label)}</span>
                      <span part="point-value">${escapeHtml(String(point.value))}</span>
                    </button>
                  `,
                )
                .join("")}
            </div>
          </div>
        `
      : `<div part="empty">No line-chart data available.</div>`;
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

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="panel"] {
          display: grid;
          gap: 0.875rem;
          padding: 0.95rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 82%, transparent);
          border-radius: 1rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 96%, white 4%);
        }

        [part="header"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: space-between;
          align-items: start;
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
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="message"] {
          color: var(--boe-token-text-text-secondary, #52606d);
          line-height: 1.4;
          max-inline-size: 42rem;
        }

        [part="timeframe"] {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        [part="action"] {
          appearance: none;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 64%, transparent);
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
          color: white;
        }

        [part="visual"] {
          display: grid;
          grid-template-rows: auto auto;
          gap: 0.65rem;
          padding: 0.2rem 0.2rem 0.45rem;
          border-radius: 0.85rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 48%, transparent);
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 86%, #eef4fb 14%);
        }

        [part="chart"] {
          display: block;
          inline-size: 100%;
          block-size: auto;
          aspect-ratio: 16 / 6;
          min-block-size: 13rem;
        }

        [part="grid-line"] {
          stroke: color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 52%, transparent);
          stroke-width: 0.7;
          stroke-dasharray: 0.85 2;
        }

        [part="area"] {
          fill: url(#line-chart-area-gradient);
        }

        [part="path"] {
          fill: none;
          stroke: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 82%, transparent);
          stroke-width: 0.65;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(
            0 6px 10px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent)
          );
        }

        [part="dot-halo"] {
          fill: rgba(255, 255, 255, 0.92);
        }

        [part="dot"] {
          fill: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 88%, white 12%);
          stroke: rgba(255, 255, 255, 0.98);
          stroke-width: 0.75;
        }

        [part="dot"][data-tone="accent"] {
          fill: rgba(90, 124, 247, 0.94);
        }

        [part="dot"][data-tone="success"] {
          fill: rgba(38, 194, 129, 0.94);
        }

        [part="points"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.6rem;
        }

        [part="point"] {
          appearance: none;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.45rem 0.7rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 52%, transparent);
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #f7f9fc) 90%, white 10%);
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }

        [part="point"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }

        [part="point-label"] {
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="point-value"] {
          font-size: 0.72rem;
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="legend"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        [part="legend-item"] {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.34rem 0.56rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 86%, #eef4fb 14%);
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 48%, transparent);
        }

        [part="legend-swatch"] {
          inline-size: 0.7rem;
          block-size: 0.7rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 88%, white 12%);
        }

        [part="legend-item"][data-tone="accent"] [part="legend-swatch"] {
          background: rgba(90, 124, 247, 0.94);
        }

        [part="legend-item"][data-tone="success"] [part="legend-swatch"] {
          background: rgba(38, 194, 129, 0.94);
        }

        [part="legend-label"] {
          font-size: 0.76rem;
          font-weight: 700;
        }

        [part="legend-value"] {
          font-size: 0.72rem;
          color: var(--boe-token-text-text-secondary, #52606d);
        }

        [part="empty"] {
          padding: 1rem;
          border-radius: 0.9rem;
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #d6e0ea) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #52606d);
        }
      </style>
      <article part="panel">
        <header part="header">
          <div part="meta">
            <div part="title">${escapeHtml(this.title)}</div>
            ${summaryMarkup}
            ${messageMarkup}
          </div>
          <div part="header-side">
            ${timeframeMarkup}
            ${actionsMarkup}
          </div>
        </header>
        ${chartMarkup}
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

export const defineBoxLineChartElement = (tagName = DEFAULT_TAG_NAME): void => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, BoxLineChartElement);
  }
};
