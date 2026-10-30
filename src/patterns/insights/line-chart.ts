import { NumericLineView, type LineChartSeries, type LineChartMarker } from "./numeric-line-view.js";
import { chartJson, formatAnalyticValue } from "./analytic-shared.js";
export type { LineChartSeries, LineChartMarker, NumericLinePoint } from "./numeric-line-view.js";
import { ChartPresentation, chartDomain, presentationAttributes, presentationMarkup, presentationFooter, type ChartInspection } from "./chart-presentation.js";
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
  value: number | null;
  partial?: boolean;
  inspection?: ChartInspection;
};

type ChartCoordinate = {
  point: LineChartPoint;
  x: number;
  y: number;
  index: number;
};


const elementStyles = chartStyles + `
  :host { container-type:inline-size; }
  [part="visual"] { display:grid; overflow-x:auto; padding-block:1.25rem 1.5rem; min-inline-size:0; margin-block:.5rem 1.25rem; grid-template-columns:3rem minmax(var(--plot-min,0px),1fr); grid-template-rows:12rem auto; gap:.75rem 0; }
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
  [part="point"] { appearance:none; position:absolute; inset-inline-start:var(--point-x); inset-block-end:0; transform:translateX(-50%); block-size:2.75rem; inline-size:var(--point-size,3.5rem); display:grid; grid-template-columns:minmax(0,1fr); justify-items:center; align-items:end; padding:.3rem; background:transparent; border:0; border-radius:3px; font:inherit; color:inherit; cursor:pointer; }
  [part="point"]:hover { background:color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 6%,transparent); }
  [part="point-label"] { font-size:.75rem; white-space:normal; max-inline-size:100%; overflow-wrap:break-word; text-align:center; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
  [part="point"][data-selected="true"] { box-shadow:inset 0 0 0 1px var(--boe-chart-ink,var(--boe-token-text-text,#102347)); }
  [part="point"]:focus-visible { outline-offset:-4px; }
  @container (max-width:480px) { [part="point-label"] { inline-size:min-content; } }
  [part="point-value"] { position:absolute; inset-inline-start:50%; transform:translateX(-50%); bottom:calc(2.75rem + var(--point-height) * 12rem + .45rem); pointer-events:none; font-size:.75rem; font-weight:600; font-variant-numeric:tabular-nums; }
`;

export class LineChart extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["series", "markers", "x-scale", "y-scale", "y-label", "series-tokens", ...presentationAttributes, "actions", "legend", "message", "points", "summary", "timeframe", "heading"];
  }
  private presentation = new ChartPresentation(this, () => this.update(), () => this.emitSelectionCleared());
  get selectedId(): string | null { return this.getAttribute("selected-id"); }
  set selectedId(value: string | null) { value === null ? this.removeAttribute("selected-id") : this.setAttribute("selected-id", value); }
  get unit(): string { return this.getAttribute("unit") ?? ""; }
  set unit(value: string) { this.setAttribute("unit", value); }
  get xLabel(): string { return this.getAttribute("x-label") ?? ""; }
  set xLabel(value: string) { this.setAttribute("x-label", value); }
  get state(): string { return this.getAttribute("state") ?? ""; }
  set state(value: string) { this.setAttribute("state", value); }
  get statusMessage(): string { return this.getAttribute("status-message") ?? ""; }
  set statusMessage(value: string) { this.setAttribute("status-message", value); }
  get note(): string { return this.getAttribute("note") ?? ""; }
  set note(value: string) { this.setAttribute("note", value); }
  get domain(): number[] { return chartDomain(this); }
  set domain(value: number[]) { this.setAttribute("domain", JSON.stringify(value)); }
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
    this.upgradeProperties(["heading","series","markers","xScale","yScale","xLabel","yLabel","xFormat","yFormat","seriesTokens"]);
    super.connectedCallback();
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => this.update());
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

  private emitSelectionCleared(): void { this.dispatchEvent(new CustomEvent("selection-cleared", {bubbles:true,composed:true,detail:{selectedId:null}})); }

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

  private numericView?: NumericLineView;
  private numericXFormatter: ((value:number)=>string)|null=null;
  private numericYFormatter: ((value:number)=>string)|null=null;
  get series():LineChartSeries[]{const data=chartJson<unknown>(this,"series",[]);return Array.isArray(data)?data as LineChartSeries[]:[];}
  set series(value:LineChartSeries[]){this.setAttribute("series",JSON.stringify(value));}
  get markers():LineChartMarker[]{const data=chartJson<unknown>(this,"markers",[]);return Array.isArray(data)?data as LineChartMarker[]:[];}
  set markers(value:LineChartMarker[]){this.setAttribute("markers",JSON.stringify(value));}
  get xScale():"linear"|"log"{return this.getAttribute("x-scale")==="log"?"log":"linear";}
  set xScale(value:"linear"|"log"){this.setAttribute("x-scale",value);}
  get yScale():"linear"|"log"{return this.getAttribute("y-scale")==="log"?"log":"linear";}
  set yScale(value:"linear"|"log"){this.setAttribute("y-scale",value);}
  get yLabel():string{return this.getAttribute("y-label")??this.unit;}
  set yLabel(value:string){this.setAttribute("y-label",value);}
  get xFormat():(value:number)=>string{return this.numericXFormatter??formatAnalyticValue;}
  set xFormat(value:(value:number)=>string){this.numericXFormatter=value;this.update();}
  get yFormat():(value:number)=>string{return this.numericYFormatter??formatAnalyticValue;}
  set yFormat(value:(value:number)=>string){this.numericYFormatter=value;this.update();}
  get seriesTokens():Record<string,string>{const data=chartJson<unknown>(this,"series-tokens",{});return data&&typeof data==="object"&&!Array.isArray(data)?data as Record<string,string>:{};}
  set seriesTokens(value:Record<string,string>){this.setAttribute("series-tokens",JSON.stringify(value));}

  private pointWidthRem(): number { return this.getBoundingClientRect().width <= 480 ? 2.75 : 3.5; }

  private xPosition(index: number, count: number): number {
    const width = this.shadowRoot?.querySelector('[part="chart"]')?.getBoundingClientRect().width ?? 0;
    const labelInset = (parseFloat(getComputedStyle(this.ownerDocument.documentElement).fontSize) || 16) * this.pointWidthRem() / 2;
    const horizontalInset = width ? Math.min(20, Math.max(3,labelInset / width * 100)) : 3;
    const chartWidth = 100 - horizontalInset * 2;

    return count === 1 ? 50 : horizontalInset + index / (count - 1) * chartWidth;
  }

  private getCoordinates(points: LineChartPoint[]): ChartCoordinate[] {
    if (points.length === 0) {
      return [];
    }

    const scale = chartScale([...points.flatMap(point => point.value == null ? [] : [point.value]), ...chartDomain(this)]);

    return points.flatMap((point, index) => {
      if (point.value == null) return [];
      const x = this.xPosition(index, points.length);
      const ratio = scale.position(point.value);
      const y = 52 - ratio * 48;
      return [{
        point, index,
        x: Number(x.toFixed(2)),
        y: Number(Math.max(4, Math.min(52, y)).toFixed(2)),
      }];
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

    const path = coordinates.map(({ x, y, index }, i) => `${i && index === coordinates[i - 1].index + 1 ? "L" : "M"} ${x} ${y}`).join(" ");
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
    this.shadowRoot!.innerHTML = `<style>${elementStyles}[hidden]{display:none!important}</style><div part="content-host"><article part="panel">${chartHeader}${presentationMarkup}
      <div part="visual" hidden><div part="axis" aria-hidden="true"></div><svg part="chart" viewBox="0 0 100 56" preserveAspectRatio="none" role="img">
      <g part="grid"></g><path part="area"></path><path part="path"></path><g part="dots"></g></svg><div part="points" role="list"></div></div>
      <div part="empty">No line-chart data available.</div><div part="legend" hidden></div>${presentationFooter}</article></div><div part="series-host" hidden></div>`;
  }
  protected setupListeners(): void {
    this.presentation.setup();
    bindChartEvents(this.shadowRoot!,id=>this.emitAction(id),id=>{const point=this.points.find(point=>point.id===id);if(point){this.presentation.select(id);this.emitPointSelected(point);}});
  }
  protected update(): void {
    if(!this.isRendered)return;
    const root=this.shadowRoot!;
    const numeric=this.hasAttribute("series");
    root.querySelector<HTMLElement>('[part="content-host"]')!.hidden=numeric;
    const seriesHost=root.querySelector<HTMLElement>('[part="series-host"]')!;seriesHost.hidden=!numeric;
    if(numeric){this.numericView??=new NumericLineView(seriesHost,this);this.numericView.update();return;}
    root.querySelector<HTMLElement>('[part="visual"]')!.dataset.dense=String(this.points.length > 8);
    root.querySelector<HTMLElement>('[part="visual"]')!.style.setProperty("--point-size", `${this.pointWidthRem()}rem`);
    root.querySelector<HTMLElement>('[part="visual"]')!.style.setProperty("--plot-min", `${this.points.length * this.pointWidthRem()}rem`);
    syncChartHeader(root,this);syncChartLegend(root,this.legend);
    // Read after any synchronous host focusin refresh, including geometry.
    const points=this.points.filter(point=>point.value === null || Number.isFinite(point.value)),coordinates=this.getCoordinates(points);
    root.querySelector<HTMLElement>('[part="visual"]')!.hidden=!points.length;
    root.querySelector<HTMLElement>('[part="empty"]')!.hidden=!!points.length;
    root.querySelector('[part="chart"]')!.setAttribute("aria-label",`${this.heading} trend line`);
    root.querySelector('[part="path"]')!.setAttribute("d",this.buildLinePath(coordinates));root.querySelector('[part="area"]')!.setAttribute("d",this.buildAreaPath(coordinates));
    const scale = chartScale([...points.flatMap(point => point.value == null ? [] : [point.value]), ...chartDomain(this)]);
    root.querySelector('[part="axis"]')!.innerHTML = scale.ticks.map(value => `<span part="axis-label" style="bottom:${scale.position(value) * 100}%">${formatChartValue(value)}</span>`).join("");
    root.querySelector('[part="grid"]')!.innerHTML = scale.ticks.map(value => `<line part="grid-line" x1="3" x2="97" y1="${52-scale.position(value)*48}" y2="${52-scale.position(value)*48}"></line>`).join("");
    const svgNS="http://www.w3.org/2000/svg";
    syncKeyedChildren(root.querySelector('[part="dots"]')!,coordinates,item=>item.point.id,()=>{
      const group=document.createElementNS(svgNS,"g");for(const [part,r] of [["dot-halo","2.2"],["dot","1.2"]]){const circle=document.createElementNS(svgNS,part === "dot" ? "ellipse" : "circle");circle.setAttribute("part",part);circle.setAttribute("r",r);group.append(circle);}return group;
    },(group,{point,x,y})=>{for(const circle of Array.from(group.children)){circle.setAttribute("cx",String(x));circle.setAttribute("cy",String(y));}group.querySelector('[part="dot"]')!.setAttribute("data-tone",point.tone??"neutral");});
    const list=root.querySelector<HTMLElement>('[part="points"]')!;list.setAttribute("aria-label",`${this.heading} points`);syncChartPoints(list,points,"line");
    list.querySelectorAll<HTMLElement>('[part="point"]').forEach((button, index) => {
      const coordinate = coordinates.find(item => item.point.id === button.dataset.pointId);
      const x = coordinate?.x ?? Number(this.xPosition(index, points.length).toFixed(2)), y = coordinate?.y ?? 52;
      button.style.setProperty("--point-x", `${x}%`);
      button.style.setProperty("--point-height", String(1 - y / 56));
    });
    this.presentation.sync(points);
    this.syncDotSizes();
  }
}
LineChart.register();
