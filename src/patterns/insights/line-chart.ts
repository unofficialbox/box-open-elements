import { syncKeyedChildren } from "../internal/keyed-children.js";
import { chartHeader, syncChartHeader, syncChartLegend, bindChartEvents, syncChartPoints } from "./chart-content.js";
import { BaseElement } from "../../core/index.js";
import { chartStyles } from "./chart-styles.js";
import { chartScale, formatChartValue } from "./chart-scale.js";

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


const elementStyles = chartStyles + `
  :host { container-type:inline-size; }
  [part="visual"] { display:grid; grid-template-columns:3rem minmax(0,1fr); grid-template-rows:12rem auto; gap:.75rem 0; }
  [part="axis"] { position:relative; margin-block:.857142rem; }
  [part="axis-label"] { position:absolute; inset-inline-end:.6rem; transform:translateY(50%); font-size:.6875rem; line-height:1; font-variant-numeric:tabular-nums; color:var(--boe-token-text-text-secondary,#6f6f6f); white-space:nowrap; }
  [part="chart"] { display:block; inline-size:100%; block-size:12rem; overflow:visible; }
  [part="grid-line"] { stroke:var(--boe-token-stroke-stroke,#e8e8e8); stroke-width:1; vector-effect:non-scaling-stroke; shape-rendering:crispEdges; }
  [part="area"] { display:none; }
  [part="path"] { fill:none; stroke:var(--boe-token-surface-surface-brand,#0061d5); stroke-width:2; vector-effect:non-scaling-stroke; stroke-linejoin:round; stroke-linecap:round; }
  [part="dot-halo"] { display:none; }
  [part="dot"] { fill:var(--boe-token-surface-surface,#fff); stroke:var(--boe-token-surface-surface-brand,#0061d5); stroke-width:2; vector-effect:non-scaling-stroke; }
  [part="dot"][data-tone="accent"] { stroke:#7c5cce; }
  [part="dot"][data-tone="success"] { stroke:#21856d; }
  [part="points"] { grid-column:2; position:relative; block-size:2rem; }
  [part="point"] { appearance:none; position:absolute; inset-inline-start:var(--point-x); inset-block-end:0; transform:translateX(-50%); block-size:2rem; display:grid; align-items:end; padding:.3rem; background:transparent; border:0; border-radius:3px; font:inherit; color:inherit; cursor:pointer; }
  [part="point"]:hover { background:color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 6%,transparent); }
  [part="point-label"] { font-size:.75rem; white-space:nowrap; }
  [part="point-value"] { position:absolute; inset-inline-start:50%; transform:translateX(-50%); bottom:calc(2.75rem + var(--point-height) * 12rem + .45rem); pointer-events:none; font-size:.75rem; font-weight:600; font-variant-numeric:tabular-nums; }
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

  private resizeObserver?: ResizeObserver;

  connectedCallback(): void {
    super.connectedCallback();
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.syncDotSizes());
      this.resizeObserver.observe(this);
    }
  }

  disconnectedCallback(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    super.disconnectedCallback();
  }

  // The plot stretches horizontally while its height stays fixed. Compensate
  // the marker radii so data points stay circular at every container width.
  private syncDotSizes(): void {
    const chart = this.shadowRoot?.querySelector('[part="chart"]');
    if (!chart) return;
    const { width, height } = chart.getBoundingClientRect();
    if (!width || !height) return;
    this.shadowRoot!.querySelectorAll('[part="dot"]').forEach(dot => {
      dot.setAttribute("rx", String(3 * 100 / width));
      dot.setAttribute("ry", String(3 * 56 / height));
    });
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

    const scale = chartScale(points.map(point => point.value));
    const horizontalInset = 3;
    const chartWidth = 94;

    return points.map((point, index) => {
      const x = points.length === 1 ? 50 : horizontalInset + (index / (points.length - 1)) * chartWidth;
      const ratio = scale.position(point.value);
      const y = 52 - ratio * 48;
      return {
        point,
        x: Number(x.toFixed(2)),
        y: Number(Math.max(4, Math.min(52, y)).toFixed(2)),
      };
    });
  }

  private buildLinePath(coordinates: ChartCoordinate[]): string {
    if (coordinates.length === 0) {
      return "";
    }

    if (coordinates.length === 1) {
      const { x, y } = coordinates[0];
      return `M ${x} ${y}`;
    }

    const path = coordinates.map(({ x, y }, index) => `${index ? "L" : "M"} ${x} ${y}`).join(" ");
    return path;
  }

  private buildAreaPath(coordinates: ChartCoordinate[]): string {
    if (coordinates.length === 0) {
      return "";
    }

    const linePath = this.buildLinePath(coordinates);
    const first = coordinates[0];
    const last = coordinates[coordinates.length - 1];
    return `${linePath} L ${last.x} 52 L ${first.x} 52 Z`;
  }

  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>${elementStyles}[hidden]{display:none!important}</style><div part="content-host"><article part="panel">${chartHeader}
      <div part="visual" hidden><div part="axis" aria-hidden="true"></div><svg part="chart" viewBox="0 0 100 56" preserveAspectRatio="none" role="img">
      <g part="grid"></g><path part="area"></path><path part="path"></path><g part="dots"></g></svg><div part="points" role="list"></div></div>
      <div part="empty">No line-chart data available.</div><div part="legend" hidden></div></article></div>`;
  }
  protected setupListeners(): void {
    bindChartEvents(this.shadowRoot!,id=>this.emitAction(id),id=>{const point=this.points.find(point=>point.id===id);if(point)this.emitPointSelected(point);});
  }
  protected update(): void {
    if(!this.isRendered)return;
    const root=this.shadowRoot!;
    syncChartHeader(root,this);syncChartLegend(root,this.legend);
    // Read after any synchronous host focusin refresh, including geometry.
    const points=this.points.filter(point=>Number.isFinite(point.value)),coordinates=this.getCoordinates(points);
    root.querySelector<HTMLElement>('[part="visual"]')!.hidden=!points.length;
    root.querySelector<HTMLElement>('[part="empty"]')!.hidden=!!points.length;
    root.querySelector('[part="chart"]')!.setAttribute("aria-label",`${this.heading} trend line`);
    root.querySelector('[part="path"]')!.setAttribute("d",this.buildLinePath(coordinates));root.querySelector('[part="area"]')!.setAttribute("d",this.buildAreaPath(coordinates));
    const scale = chartScale(points.map(point => point.value));
    root.querySelector('[part="axis"]')!.innerHTML = scale.ticks.map(value => `<span part="axis-label" style="bottom:${scale.position(value) * 100}%">${formatChartValue(value)}</span>`).join("");
    root.querySelector('[part="grid"]')!.innerHTML = scale.ticks.map(value => `<line part="grid-line" x1="3" x2="97" y1="${52-scale.position(value)*48}" y2="${52-scale.position(value)*48}"></line>`).join("");
    const svgNS="http://www.w3.org/2000/svg";
    syncKeyedChildren(root.querySelector('[part="dots"]')!,coordinates,item=>item.point.id,()=>{
      const group=document.createElementNS(svgNS,"g");for(const [part,r] of [["dot-halo","2.2"],["dot","1.2"]]){const circle=document.createElementNS(svgNS,part === "dot" ? "ellipse" : "circle");circle.setAttribute("part",part);circle.setAttribute("r",r);group.append(circle);}return group;
    },(group,{point,x,y})=>{for(const circle of Array.from(group.children)){circle.setAttribute("cx",String(x));circle.setAttribute("cy",String(y));}group.querySelector('[part="dot"]')!.setAttribute("data-tone",point.tone??"neutral");});
    const list=root.querySelector<HTMLElement>('[part="points"]')!;list.setAttribute("aria-label",`${this.heading} points`);syncChartPoints(list,points,"line");
    list.querySelectorAll<HTMLElement>('[part="point"]').forEach((button, index) => {
      const { x, y } = coordinates[index];
      button.style.setProperty("--point-x", `${x}%`);
      button.style.setProperty("--point-height", String(1 - y / 56));
    });
    this.syncDotSizes();
  }
}
LineChart.register();
