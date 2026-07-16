import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-donut-chart";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type DonutChartAction = {
  id: string;
  label: string;
  tone?: string;
};

type DonutChartSegment = {
  id: string;
  label: string;
  tone?: string;
  value: number;
};

type DonutSegmentArc = {
  displayEnd: number;
  displayStart: number;
  index: number;
  segment: DonutChartSegment;
  start: number;
  end: number;
};

const SEGMENT_PALETTE = ["#0061d5", "#5a7cf7", "#26c281", "#f59e0b", "#8b5cf6", "#ec4899"];


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        [part="panel"] {
          display: grid;
          gap: 0.55rem;
          padding: 0.7rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 0.7rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 96%, var(--boe-token-surface-surface, #ffffff) 4%);
        }

        [part="header"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.55rem;
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
          margin: 0;
          font: inherit;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="summary"] {
          font-size: 1.35rem;
          font-weight: 700;
          line-height: 1;
          letter-spacing: -0.04em;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="message"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.42;
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
          padding: 0.4rem 0.7rem;
          cursor: pointer;
        }

        [part="action"][data-tone="primary"] {
          border-color: transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="visual"] {
          display: grid;
          grid-template-columns: minmax(0, 14rem) minmax(0, 1fr);
          gap: 0.55rem;
          align-items: center;
          padding: 0.65rem;
          border-radius: 0.7rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 88%, #eef4fb 12%);
        }

        [part="donut-wrap"] {
          position: relative;
          inline-size: min(100%, 14rem);
          aspect-ratio: 1;
          margin-inline: auto;
        }

        [part="chart"] {
          inline-size: 100%;
          block-size: 100%;
        }

        [part="track"] {
          fill: none;
          stroke: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 30%, transparent);
          stroke-width: 13;
        }

        [part="segment"] {
          filter: drop-shadow(0 8px 14px rgba(15, 23, 42, 0.06));
        }

        [part="center"] {
          position: absolute;
          inset: 50%;
          transform: translate(-50%, -50%);
          display: grid;
          gap: 0.28rem;
          justify-items: center;
          text-align: center;
          inline-size: 52%;
          min-block-size: 52%;
          align-content: center;
          padding: 0.65rem;
          border-radius: 999px;
          background: radial-gradient(circle at 50% 35%, rgba(255, 255, 255, 0.98) 0%, rgba(244, 248, 252, 0.98) 100%);
          box-shadow:
            0 10px 24px rgba(0, 67, 146, 0.05),
            inset 0 0 0 1px rgba(0, 97, 213, 0.08);
        }

        [part="legend"] {
          display: grid;
          gap: 0.55rem;
        }

        [part="legend-item"] {
          appearance: none;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.55rem;
          align-items: center;
          padding: 0.4rem 0.55rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
          border-radius: 0.65rem;
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 90%, #eef4fb 10%);
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
          transition:
            transform 120ms ease,
            border-color 120ms ease,
            box-shadow 120ms ease;
        }

        [part="legend-item"]:hover {
          transform: translateY(-1px);
          border-color: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 74%, transparent);
          box-shadow: 0 10px 18px rgba(15, 23, 42, 0.05);
        }

        [part="legend-item"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }

        [part="legend-swatch"] {
          inline-size: 0.9rem;
          block-size: 0.9rem;
          border-radius: 999px;
          background: var(--segment-color, var(--boe-token-surface-surface-brand, #0061d5));
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--segment-color, var(--boe-token-surface-surface-brand, #0061d5)) 16%, transparent);
        }

        [part="legend-copy"] {
          display: grid;
          gap: 0.18rem;
        }

        [part="legend-label"] {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="legend-item"][data-pressed="true"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface, #ffffff) 92%);
          box-shadow: 0 10px 18px rgba(15, 23, 42, 0.06);
        }

        [part="legend-value"] {
          font-size: 0.76rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="empty"] {
          padding: 0.7rem;
          border-radius: 0.7rem;
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        @media (max-width: 720px) {
          [part="visual"] {
            grid-template-columns: 1fr;
          }
        }
      `;

export class BoxDonutChartElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["actions", "heading", "message", "segments", "summary", "timeframe"];
  }

  private selectedSegmentId: string | null = null;
  get actions(): DonutChartAction[] {
    return this.parseJsonAttribute<DonutChartAction[]>("actions", []);
  }

  set actions(value: DonutChartAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
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

  get segments(): DonutChartSegment[] {
    return this.parseJsonAttribute<DonutChartSegment[]>("segments", []);
  }

  set segments(value: DonutChartSegment[]) {
    this.setAttribute("segments", JSON.stringify(value));
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
    return this.getAttribute("heading") ?? "Donut Chart";
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

  private emitSegmentSelected(segment: DonutChartSegment): void {
    this.dispatchEvent(
      new CustomEvent("segment-selected", {
        bubbles: true,
        composed: true,
        detail: segment,
      }),
    );
  }

  private toneColor(tone?: string): string {
    switch (tone) {
      case "accent":
        return "#5a7cf7";
      case "success":
        return "#26c281";
      case "warning":
        return "#f59e0b";
      default:
        return "#0061d5";
    }
  }

  private segmentColor(segment: DonutChartSegment, index: number): string {
    if (segment.tone) {
      return this.toneColor(segment.tone);
    }

    return SEGMENT_PALETTE[index % SEGMENT_PALETTE.length] ?? "#0061d5";
  }

  private describeSegmentSummary(arcs: DonutSegmentArc[]): string {
    return arcs.map(({ segment }) => `${segment.label}: ${segment.value}`).join(", ");
  }

  private polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  }

  private describeSegmentPath(startAngle: number, endAngle: number, outerRadius = 44, innerRadius = 31): string {
    const sweep = endAngle - startAngle;
    if (sweep >= 359.9) {
      const midpoint = startAngle + sweep / 2;
      return `${this.describeSegmentPath(startAngle, midpoint, outerRadius, innerRadius)} ${this.describeSegmentPath(midpoint, endAngle, outerRadius, innerRadius)}`;
    }

    const center = 50;
    const outerStart = this.polarToCartesian(center, center, outerRadius, startAngle);
    const outerEnd = this.polarToCartesian(center, center, outerRadius, endAngle);
    const innerStart = this.polarToCartesian(center, center, innerRadius, endAngle);
    const innerEnd = this.polarToCartesian(center, center, innerRadius, startAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? "1" : "0";

    return [
      "M",
      outerStart.x.toFixed(2),
      outerStart.y.toFixed(2),
      "A",
      outerRadius,
      outerRadius,
      0,
      largeArcFlag,
      1,
      outerEnd.x.toFixed(2),
      outerEnd.y.toFixed(2),
      "L",
      innerStart.x.toFixed(2),
      innerStart.y.toFixed(2),
      "A",
      innerRadius,
      innerRadius,
      0,
      largeArcFlag,
      0,
      innerEnd.x.toFixed(2),
      innerEnd.y.toFixed(2),
      "Z",
    ].join(" ");
  }

  private getArcs(): DonutSegmentArc[] {
    const positiveSegments = this.segments.filter(segment => segment.value > 0);
    const total = positiveSegments.reduce((sum, segment) => sum + segment.value, 0) || 1;
    const gap = positiveSegments.length > 1 ? 2.4 : 0;
    let current = 0;
    return positiveSegments.map((segment, index) => {
      const start = current;
      const sweep = (segment.value / total) * 360;
      current += sweep;
      const safeGap = sweep > gap ? gap : 0;
      return {
        segment,
        index,
        start,
        end: current,
        displayStart: start + safeGap / 2,
        displayEnd: current - safeGap / 2,
      };
    });
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

    const arcs = this.getArcs();
    const segmentSummary = this.describeSegmentSummary(arcs);
    const chartAriaLabel = segmentSummary
      ? `${this.heading}. ${segmentSummary}`
      : this.heading;
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
    const chartMarkup = arcs.length
      ? `
          <div part="visual">
            <div part="donut-wrap">
              <svg part="chart" viewBox="0 0 100 100" role="img" aria-label="${escapeHtml(chartAriaLabel)}">
                <circle part="track" cx="50" cy="50" r="37.5"></circle>
                ${arcs
                  .map(
                    ({ segment, displayStart, displayEnd, index }) => `
                      <path
                        part="segment"
                        data-segment-id="${escapeHtml(segment.id)}"
                        data-tone="${escapeHtml(segment.tone ?? "neutral")}"
                        d="${this.describeSegmentPath(displayStart, displayEnd)}"
                        fill="${this.segmentColor(segment, index)}"
                      ></path>
                    `,
                  )
                  .join("")}
              </svg>
              <div part="center">
                ${summaryMarkup}
                ${timeframeMarkup}
              </div>
            </div>
            <div part="legend" role="list" aria-label="${escapeHtml(this.heading)} segments">
              ${arcs
                .map(
                  ({ segment, index }) => {
                    const isPressed = this.selectedSegmentId === segment.id;
                    return `
                    <button
                      type="button"
                      part="legend-item"
                      data-segment-id="${escapeHtml(segment.id)}"
                      data-tone="${escapeHtml(segment.tone ?? "neutral")}"
                      data-pressed="${String(isPressed)}"
                      aria-pressed="${String(isPressed)}"
                      aria-label="${escapeHtml(`${segment.label}: ${segment.value}`)}"
                    >
                      <span part="legend-swatch" style="--segment-color:${this.segmentColor(segment, index)};"></span>
                      <span part="legend-copy">
                        <span part="legend-label">${escapeHtml(segment.label)}</span>
                        <span part="legend-value">${escapeHtml(String(segment.value))}</span>
                      </span>
                    </button>
                  `;
                  },
                )
                .join("")}
            </div>
          </div>
        `
      : `<div part="empty">No donut-chart data available.</div>`;

    const host = this.shadowRoot.querySelector('[part="content-host"]');
    if (!host) {
      return;
    }

    host.innerHTML = `
      <article part="panel">
        <header part="header">
          <div part="meta">
            <h2 part="title">${escapeHtml(this.heading)}</h2>
            ${messageMarkup}
          </div>
          <div part="header-side">
            ${actionsMarkup}
          </div>
        </header>
        ${chartMarkup}
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

    this.shadowRoot.querySelectorAll('[part="legend-item"]').forEach(button => {
      button.addEventListener("click", () => {
        const segmentId = button.getAttribute("data-segment-id");
        const segment = this.segments.find(item => item.id === segmentId);
        if (!segment) {
          return;
        }

        if (this.selectedSegmentId === segment.id) {
          this.selectedSegmentId = null;
        } else {
          this.selectedSegmentId = segment.id;
          this.emitSegmentSelected(segment);
        }
        this.update();
      });
    });
  
  }
}

export const defineBoxDonutChartElement = (tagName = DEFAULT_TAG_NAME): void => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, BoxDonutChartElement);
  }
};
