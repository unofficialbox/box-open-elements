import { BaseElement } from "../../core/index.js";
import { chartStyles } from "./chart-styles.js";

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


const elementStyles = chartStyles + `
  :host { container-type:inline-size; }
  [part="visual"] { display:grid; grid-template-columns:minmax(10rem,15rem) minmax(12rem,1fr); gap:2rem; align-items:center; }
  [part="donut-wrap"] { position:relative; inline-size:100%; max-inline-size:15rem; aspect-ratio:1; margin-inline:auto; }
  [part="chart"] { display:block; inline-size:100%; block-size:100%; }
  [part="track"] { fill:none; stroke:var(--boe-token-stroke-stroke,#e8e8e8); stroke-width:16; }
  [part="center"] { position:absolute; inset:26%; display:grid; align-content:center; justify-items:center; gap:.25rem; text-align:center; pointer-events:none; }
  [part="center"] [part="summary"] { font-size:clamp(1.25rem,5cqi,2rem); }
  [part="center-label"] { font-size:.75rem; color:var(--boe-token-text-text-secondary,#6f6f6f); }
  [part="legend"] { display:grid; gap:0; }
  [part="legend-item"] { appearance:none; display:grid; grid-template-columns:auto minmax(0,1fr) auto 3rem; inline-size:100%; gap:.625rem; padding:.875rem .5rem; font:inherit; color:inherit; background:transparent; border:1px solid transparent; border-radius:.375rem; text-align:start; cursor:pointer; }
  [part="legend-item"]:hover, [part="legend-item"][data-pressed="true"] { background:color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 6%,transparent); }
  [part="legend-item"][data-pressed="true"] { border-color:var(--boe-token-surface-surface-brand,#0061d5); }
  [part="legend-item"] [part="legend-swatch"] { background:var(--segment-color); inline-size:.625rem; block-size:.625rem; }
  [part="legend-copy"] { display:contents; }
  [part="legend-label"] { font-size:.875rem; font-weight:500; overflow-wrap:anywhere; }
  [part="legend-value"], [part="legend-share"] { text-align:end; font-size:.8125rem; font-variant-numeric:tabular-nums; }
  [part="legend-value"] { color:var(--boe-token-text-text,#1f1e1b); font-weight:600; }
  [part="legend-share"] { color:var(--boe-token-text-text-secondary,#6f6f6f); }
  [part="segment"] { transition:opacity 120ms ease; }
  [part="segment"][data-muted="true"] { opacity:.25; }
  [part="segment"][data-selected="true"] { stroke:var(--boe-token-text-text,#1f1e1b); stroke-width:.7; }
  [part="legend-item"][data-active="true"] { background:color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 6%,transparent); }
  @media (prefers-reduced-motion:reduce) { [part="segment"] { transition:none; } }
  @container (max-width:520px) { [part="visual"] { grid-template-columns:1fr; gap:1rem; } [part="donut-wrap"] { max-inline-size:12rem; } }
`;

export class DonutChart extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
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

  private describeSegmentPath(startAngle: number, endAngle: number, outerRadius = 44, innerRadius = 28): string {
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
    const positiveSegments = this.segments.filter(segment => Number.isFinite(segment.value) && segment.value > 0);
    const magnitude = positiveSegments.reduce((max, segment) => Math.max(max, segment.value), 1);
    const total = positiveSegments.reduce((sum, segment) => sum + segment.value / magnitude, 0) || 1;
    const gap = positiveSegments.length > 1 ? 2.4 : 0;
    let current = 0;
    return positiveSegments.map((segment, index) => {
      const start = current;
      const sweep = (segment.value / magnitude / total) * 360;
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
    const total = arcs.reduce((sum, { segment }) => sum + segment.value, 0);
    const centerValue = this.summary || (Number.isFinite(total) ? String(Number(total.toPrecision(15))) : "—");
    const summaryMarkup = `<div part="summary">${escapeHtml(centerValue)}</div>`;
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
                <circle part="track" cx="50" cy="50" r="36"></circle>
                ${arcs
                  .map(
                    ({ segment, displayStart, displayEnd, index }) => `
                      <path
                        part="segment"
                        data-selected="${String(this.selectedSegmentId === segment.id)}"
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
                <span part="center-label">Total</span>
              </div>
            </div>
            <div part="legend" role="list" aria-label="${escapeHtml(this.heading)} segments">
              ${arcs
                .map(
                  ({ segment, index }) => {
                    const isPressed = this.selectedSegmentId === segment.id;
                    return `
                    <div role="listitem"><button
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
                      <span part="legend-share">${Number(((arcs[index].end - arcs[index].start) / 3.6).toFixed(1))}%</span>
                    </button></div>
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
            ${timeframeMarkup}
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

    const highlight = (id: string | null): void => {
      const focused = this.shadowRoot?.activeElement as HTMLElement | null;
      const activeId = id ?? (focused?.matches(":focus-visible") ? focused.dataset.segmentId : null) ?? null;
      this.shadowRoot?.querySelectorAll<HTMLElement | SVGElement>('[data-segment-id]').forEach(item => {
        item.dataset.active = String(item.dataset.segmentId === activeId);
        if (item.getAttribute("part") === "segment") item.dataset.muted = String(activeId !== null && item.dataset.segmentId !== activeId);
      });
    };
    this.shadowRoot.querySelectorAll<SVGElement>('[part="segment"]').forEach(segment => {
      segment.addEventListener("pointerenter", () => highlight(segment.dataset.segmentId ?? null));
      segment.addEventListener("pointerleave", () => highlight(null));
    });
    this.shadowRoot.querySelectorAll<HTMLElement>('[part="legend-item"]').forEach(button => {
      button.addEventListener("pointerenter", () => highlight(button.dataset.segmentId ?? null));
      button.addEventListener("pointerleave", () => highlight(null));
      button.addEventListener("focus", () => {
        if (button.matches(":focus-visible")) highlight(button.dataset.segmentId ?? null);
      });
      button.addEventListener("blur", () => highlight(null));
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
        // Selection changes only owned state; retain the active legend button.
        this.shadowRoot?.querySelectorAll<HTMLButtonElement>('[part="legend-item"]').forEach(item => {
          const pressed = item.dataset.segmentId === this.selectedSegmentId;
          item.dataset.pressed = String(pressed);
          item.setAttribute("aria-pressed", String(pressed));
        });
        this.shadowRoot?.querySelectorAll<SVGElement>('[part="segment"]').forEach(item => {
          item.dataset.selected = String(item.dataset.segmentId === this.selectedSegmentId);
        });
      });
    });
  
  }
}

DonutChart.register();
