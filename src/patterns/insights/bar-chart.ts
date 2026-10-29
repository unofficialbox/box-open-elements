import { chartHeader, syncChartHeader, syncChartLegend, bindChartEvents } from "./chart-content.js";
import { BaseElement } from "../../core/index.js";
import { chartStyles, barStyles } from "./chart-styles.js";
import { syncBarScale } from "./chart-content.js";

const DEFAULT_TAG_NAME = "box-bar-chart";

type BarChartAction = {
  id: string;
  label: string;
  tone?: string;
};

type BarChartLegendItem = {
  label: string;
  tone?: string;
  value?: string;
};

type BarChartPoint = {
  id: string;
  label: string;
  tone?: string;
  value: number;
};


const elementStyles = chartStyles + barStyles;

export class BarChart extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["actions", "heading", "legend", "message", "points", "summary", "timeframe"];
  }
  get actions(): BarChartAction[] {
    return this.parseJsonAttribute<BarChartAction[]>("actions", []);
  }

  set actions(value: BarChartAction[]) {
    this.setAttribute("actions", JSON.stringify(value));
  }

  get legend(): BarChartLegendItem[] {
    return this.parseJsonAttribute<BarChartLegendItem[]>("legend", []);
  }

  set legend(value: BarChartLegendItem[]) {
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

  get points(): BarChartPoint[] {
    return this.parseJsonAttribute<BarChartPoint[]>("points", []);
  }

  set points(value: BarChartPoint[]) {
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
    return this.getAttribute("heading") ?? "Bar Chart";
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

  private emitPointSelected(point: BarChartPoint): void {
    this.dispatchEvent(
      new CustomEvent("point-selected", {
        bubbles: true,
        composed: true,
        detail: point,
      }),
    );
  }

  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>${elementStyles}[hidden]{display:none!important}</style><div part="content-host"><article part="panel">${chartHeader}
      <div part="visual" hidden><div part="chart" role="list"><div part="grid" aria-hidden="true"></div></div></div>
      <div part="empty">No bar-chart data available.</div><div part="legend" hidden></div></article></div>`;
  }
  protected setupListeners(): void {
    bindChartEvents(this.shadowRoot!, id=>this.emitAction(id), id=>{const point=this.points.find(point=>point.id===id);if(point)this.emitPointSelected(point);});
  }
  protected update(): void {
    if(!this.isRendered)return;
    const root=this.shadowRoot!;
    syncChartHeader(root,this);syncChartLegend(root,this.legend);
    // Header focus restoration can synchronously replace host data.
    const points=this.points.filter(point=>Number.isFinite(point.value));
    root.querySelector<HTMLElement>('[part="visual"]')!.hidden=!points.length;
    root.querySelector<HTMLElement>('[part="empty"]')!.hidden=!!points.length;
    const chart=root.querySelector<HTMLElement>('[part="chart"]')!;chart.setAttribute("aria-label",`${this.heading} bar data`);
    syncBarScale(chart, points);
  }
}
BarChart.register();
