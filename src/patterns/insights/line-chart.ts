import { syncKeyedChildren } from "../internal/keyed-children.js";
import { chartHeader, syncChartHeader, syncChartLegend, bindChartEvents, syncChartPoints } from "./chart-content.js";
import { BaseElement } from "../../core/index.js";
import { boePanel } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-line-chart";

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


const elementStyles = `
        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        /* The host's own display would otherwise beat the UA rule for [hidden],
           leaving the element on screen when a host hides it. */
        :host([hidden]) {
          display: none !important;
        }

        [part="panel"] {
          display: grid;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 96%, var(--boe-token-surface-surface, #ffffff) 4%);
        }

        [part="header"] {
          display: flex;
          flex-wrap: wrap;
          gap: ${boePanel.gap};
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
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="message"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          line-height: 1.4;
          max-inline-size: 42rem;
        }

        [part="timeframe"] {
          font-size: 0.72rem;
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
          grid-template-rows: auto auto;
          gap: ${boePanel.gap};
          padding: 0.2rem 0.2rem 0.45rem;
          border-radius: ${boePanel.radius};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
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
          stroke: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 52%, transparent);
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
          fill: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 88%, var(--boe-token-surface-surface, #ffffff) 12%);
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
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 52%, transparent);
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 90%, var(--boe-token-surface-surface, #ffffff) 10%);
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
          color: var(--boe-token-text-text-secondary, #6f6f6f);
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
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 48%, transparent);
        }

        [part="legend-swatch"] {
          inline-size: 0.7rem;
          block-size: 0.7rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 88%, var(--boe-token-surface-surface, #ffffff) 12%);
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
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="empty"] {
          padding: ${boePanel.padding};
          border-radius: ${boePanel.radius};
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }
      `;

export class LineChart extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["actions", "legend", "message", "points", "summary", "timeframe", "heading"];
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

  get heading(): string {
    return this.getAttribute("heading") ?? "Line Chart";
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
    // Opposite finite extremes can overflow subtraction. Normalize only that
    // range; ordinary charts retain their established scaling and rounding.
    const scale = Number.isFinite(spread) ? 1 : Math.max(Math.abs(max), Math.abs(min));
    const scaledMin = min / scale;
    const scaledSpread = Number.isFinite(spread) ? spread : max / scale - scaledMin;
    const horizontalInset = 0;
    const chartWidth = 100 - horizontalInset * 2;

    return points.map((point, index) => {
      const x = points.length === 1 ? 50 : horizontalInset + (index / (points.length - 1)) * chartWidth;
      const ratio = scale === 1 ? (point.value - min) / scaledSpread : (point.value / scale - scaledMin) / scaledSpread;
      const y = 47 - ratio * 40;
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

  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>${elementStyles}[hidden]{display:none!important}</style><div part="content-host"><article part="panel">${chartHeader}
      <div part="visual" hidden><svg part="chart" viewBox="0 0 100 56" role="img"><defs><linearGradient id="line-chart-area-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 26%, transparent)"></stop><stop offset="100%" stop-color="color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 3%, transparent)"></stop></linearGradient></defs>
      <line part="grid-line" x1="0" y1="5" x2="100" y2="5"></line><line part="grid-line" x1="0" y1="20.5" x2="100" y2="20.5"></line><line part="grid-line" x1="0" y1="36" x2="100" y2="36"></line><line part="grid-line" x1="0" y1="51.5" x2="100" y2="51.5"></line><path part="area"></path><path part="path"></path><g part="dots"></g></svg><div part="points" role="list"></div></div>
      <div part="empty">No line-chart data available.</div><div part="legend" hidden></div></article></div>`;
  }
  protected setupListeners(): void {
    bindChartEvents(this.shadowRoot!,id=>this.emitAction(id),id=>{const point=this.points.find(point=>point.id===id);if(point)this.emitPointSelected(point);});
  }
  protected update(): void {
    if(!this.isRendered)return;
    const root=this.shadowRoot!, points=this.points,coordinates=this.getCoordinates(points);
    syncChartHeader(root,this);syncChartLegend(root,this.legend);
    root.querySelector<HTMLElement>('[part="visual"]')!.hidden=!points.length;
    root.querySelector<HTMLElement>('[part="empty"]')!.hidden=!!points.length;
    root.querySelector('[part="chart"]')!.setAttribute("aria-label",`${this.heading} trend line`);
    root.querySelector('[part="path"]')!.setAttribute("d",this.buildSmoothPath(coordinates));root.querySelector('[part="area"]')!.setAttribute("d",this.buildAreaPath(coordinates));
    const svgNS="http://www.w3.org/2000/svg";
    syncKeyedChildren(root.querySelector('[part="dots"]')!,coordinates,item=>item.point.id,()=>{
      const group=document.createElementNS(svgNS,"g");for(const [part,r] of [["dot-halo","2.2"],["dot","1.2"]]){const circle=document.createElementNS(svgNS,"circle");circle.setAttribute("part",part);circle.setAttribute("r",r);group.append(circle);}return group;
    },(group,{point,x,y})=>{for(const circle of Array.from(group.children)){circle.setAttribute("cx",String(x));circle.setAttribute("cy",String(y));}group.querySelector('[part="dot"]')!.setAttribute("data-tone",point.tone??"neutral");});
    const list=root.querySelector<HTMLElement>('[part="points"]')!;list.setAttribute("aria-label",`${this.heading} points`);syncChartPoints(list,points,"line");
  }
}
LineChart.register();
