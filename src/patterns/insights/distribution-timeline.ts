import { chartStyles } from "./chart-styles.js";
import { chartDomain } from "./chart-presentation.js";
import { renderHeadingHtml, type HeadingLevel } from "../../foundations/a11y/heading.js";
import { BaseElement } from "../../core/index.js";
import { boxPlotDomain, boxPlotPosition, type BoxPlotDomain, type BoxPlotRow, type BoxPlotScale } from "./box-plot.js";

/**
 * One interval of a run: when it was, how its values were spread, and, when
 * the host has them, some of the values themselves.
 */
export interface DistributionTimelinePoint {
  /** Where the interval sits on the time axis, in timeUnit. */
  at: number;
  /** Selection id; the time is used when the host supplies none. */
  id?: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  /** How many values the interval held, for the table and the summary. */
  count?: number;
  /** Values the host sampled from the interval, drawn as points. */
  samples?: number[];
}

export type DistributionTimelineScale = BoxPlotScale;

const escapeHtml = (value: string): string => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const round = (value: number): number => Math.round(value * 1000) / 1000;

/** A point is drawn only if its spread is ordered and its time is a number. */
export function validDistributionTimelinePoint(point: DistributionTimelinePoint, scale: DistributionTimelineScale): boolean {
  if (!point || !finite(point.at)) return false;
  const values = [point.min, point.q1, point.median, point.q3, point.max];
  if (!values.every(finite) || values.some(value => scale === "log" && value <= 0)) return false;
  if (!(point.min <= point.q1 && point.q1 <= point.median && point.median <= point.q3 && point.q3 <= point.max)) return false;
  if (point.count !== undefined && (!Number.isInteger(point.count) || point.count < 0)) return false;
  if (point.samples !== undefined && (!Array.isArray(point.samples)
    || !point.samples.every(value => finite(value) && value >= point.min && value <= point.max && (scale !== "log" || value > 0)))) return false;
  return true;
}

/** The time axis: the span the points cover, and a few ticks across it. */
export function distributionTimeDomain(points: DistributionTimelinePoint[], tickCount = 5): BoxPlotDomain {
  if (!points.length) return { min: 0, max: 1, ticks: [0, 1] };
  const low = Math.min(...points.map(point => point.at));
  const high = Math.max(...points.map(point => point.at));
  if (high === low) return { min: low, max: low + 1, ticks: [low, low + 1] };
  const rough=(high-low)/Math.max(1,Math.min(100,tickCount)-1);
  const power=10**Math.floor(Math.log10(rough));
  const factor=rough/power;
  const step=(factor<Math.SQRT2?1:factor<Math.sqrt(10)?2:factor<Math.sqrt(50)?5:10)*power;
  const first=Math.ceil(low/step),last=Math.floor(high/step);
  const ticks=Number.isFinite(step)&&step>0&&last-first<=150
    ? Array.from({length:Math.max(0,last-first+1)},(_,i)=>Number(((first+i)*step).toPrecision(14)))
    : [low,high];
  return { min: low, max: high, ticks };
}

/**
 * thinPoints keeps at most perColumn samples in each of columns slices of the
 * time axis, so a run of any length draws a bounded, evenly spread set of
 * points. Thinning by column rather than by stride keeps the load's shape: a
 * stride over a periodic run can lock onto one phase of it.
 */
export function thinPoints(points: DistributionTimelinePoint[], time: BoxPlotDomain, columns: number, perColumn: number):
  { at: number; value: number }[] {
  const kept: { at: number; value: number }[] = [];
  const counts = new Map<number, number>();
  const span = time.max - time.min || 1;
  for (const point of points) {
    const column = Math.min(columns - 1, Math.max(0, Math.floor((point.at - time.min) / span * columns)));
    for (const value of point.samples ?? []) {
      const held = counts.get(column) ?? 0;
      if (held >= perColumn) break;
      counts.set(column, held + 1);
      kept.push({ at: point.at, value });
    }
  }
  return kept;
}

const styles = chartStyles + `
  :host { --boe-distribution-accent:color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 85%,var(--boe-token-text-text,#102347)); display:block; container-type:inline-size; min-inline-size:0; font:inherit; }
  :host([hidden]) { display:none!important; }
  [part=panel] { display:grid; gap:1rem; padding:1.5rem; border-radius:.375rem; }
  :host([embedded]) [part=panel] { padding:0; background:none; border:0; border-radius:0; }
  [part=header] { margin:0; }
  :is(h1,h2,h3,h4,h5,h6) { margin:0; font:inherit; font-weight:650; font-size:1.125rem; }
  [part=description], [part=note], [part=latest] { color:var(--boe-chart-muted,var(--boe-token-text-text-secondary,#566781)); font-size:.8125rem; line-height:1.5; overflow-wrap:anywhere; }
  [part=description] { margin-block-start:.4rem; }
  [part=note] { margin:0; }
  [part=legend] { display:flex; flex-wrap:wrap; gap:.5rem 1.25rem; font-size:.8125rem; }
  [part=legend-item] { display:inline-flex; align-items:center; gap:.4rem; }
  [part=median-key] { inline-size:1.25rem; border-block-start:2px solid var(--boe-distribution-median,var(--boe-distribution-accent)); }
  [part=quartile-key] { inline-size:.65rem; block-size:.9rem; border:1px solid var(--boe-distribution-edge,var(--boe-distribution-accent)); background:color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 12%,var(--boe-token-surface-surface,#fff)); }
  [part=range-key] { inline-size:.5rem; block-size:1rem; border-block:1px solid var(--boe-token-text-text-secondary,#566781); position:relative; }
  [part=range-key]:after { content:""; position:absolute; inset-block:0; inset-inline-start:50%; border-inline-start:1px solid var(--boe-token-text-text-secondary,#566781); }
  [part=plot] { display:grid; grid-template-columns:3.25rem minmax(0,1fr); gap:.5rem; min-inline-size:0; padding-block:1rem 0; }
  [part=values] { position:relative; block-size:14rem; color:var(--boe-token-text-text-secondary,#566781); font-size:.6875rem; }
  [part=value-tick] { position:absolute; inset-inline-end:0; transform:translateY(50%); inset-block-end:var(--pos); white-space:nowrap; }
  [part=chart-wrap] { position:relative; min-inline-size:0; overflow-x:auto; padding-block-start:3px; margin-block-start:-3px; }
  [part=chart-content] { min-inline-size:max(100%,var(--run-width)); }
  [part=drawing] { position:relative; block-size:14rem; }
  svg[part=chart] { display:block; inline-size:100%; block-size:100%; overflow:visible; }
  [part=grid-line] { stroke:var(--boe-distribution-grid,var(--boe-token-stroke-stroke,#e8e8e8)); stroke-width:1; vector-effect:non-scaling-stroke; }
  [part=range], [part=range-cap] { stroke:var(--boe-distribution-range,var(--boe-token-text-text-secondary,#566781)); stroke-width:1; vector-effect:non-scaling-stroke; }
  [part=band] { fill:var(--boe-distribution-band,color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 12%,var(--boe-token-surface-surface,#fff))); stroke:var(--boe-distribution-edge,var(--boe-distribution-accent)); stroke-width:1; vector-effect:non-scaling-stroke; }
  [part=median] { fill:none; stroke:var(--boe-distribution-median,var(--boe-distribution-accent)); stroke-width:2.25; vector-effect:non-scaling-stroke; stroke-linejoin:round; stroke-linecap:round; }
  [part=interval-median] { stroke:var(--boe-distribution-median,var(--boe-distribution-accent)); stroke-width:2.25; vector-effect:non-scaling-stroke; }
  [part=samples] { position:absolute; inset:0; pointer-events:none; }
  [part=dot] { position:absolute; left:var(--x); inset-block-start:var(--y); inline-size:3px; block-size:3px; border-radius:50%; background:var(--boe-distribution-dot,var(--boe-token-text-text-secondary,#566781)); transform:translate(-50%,-50%); }
  [part=times] { position:relative; block-size:1.75rem; color:var(--boe-token-text-text-secondary,#566781); font-size:.6875rem; margin-block-start:.5rem; }
  [part=time-tick] { position:absolute; left:var(--pos); transform:translateX(-50%); white-space:nowrap; }
  [part=time-tick]:first-child:not(:only-child) { transform:none; }
  [part=time-tick]:last-child:not(:only-child) { transform:translateX(-100%); }
  [part=footer] { display:flex; flex-wrap:wrap; gap:.5rem; }
  button { appearance:none; min-block-size:2.75rem; padding:.45rem .7rem; font:inherit; font-size:.8125rem; color:inherit; background:var(--boe-token-surface-surface,#fff); border:1px solid var(--boe-token-stroke-stroke,#e8e8e8); border-radius:.375rem; cursor:pointer; }
  button:hover { background:var(--boe-token-surface-surface-secondary,#f4f6f8); }
  button:focus-visible, svg:focus-visible, [part=chart-wrap]:focus-visible, [part=table-wrap]:focus-visible { outline:2px solid var(--boe-token-surface-surface-brand,#0061d5); outline-offset:3px; }
  [part=table-wrap] { overflow:auto; max-inline-size:100%; min-inline-size:0; }
  table { border-collapse:collapse; inline-size:100%; font-size:.8125rem; line-height:1.5; }
  th,td { padding:.5rem; text-align:start; border-block-end:1px solid var(--boe-token-stroke-stroke,#e8e8e8); white-space:nowrap; }
  caption { text-align:start; font-weight:600; padding-block-end:.5rem; }
  [part=empty] { padding:1rem; color:var(--boe-token-text-text-secondary,#566781); }
  @container(max-width:600px) { [part=panel] { padding:1rem; } [part=drawing],[part=values] { block-size:12rem; } }
  [part=intervals] { position:absolute; inset:0; }
  [part=interval-control] { position:absolute; inset-block:0; inset-inline-start:var(--x); inline-size:var(--w); min-inline-size:8px; min-block-size:0; margin:0; padding:0; border:0; border-radius:2px; background:none; color:inherit; transform:translateX(-50%); cursor:pointer; }
  [part=interval-control]:hover { background:color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 6%,transparent); }
  [part=interval-control][data-selected=true] { background:color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 10%,transparent); }
  [part=interval][data-selected=true] [part=band] { stroke:var(--boe-chart-ink,var(--boe-token-text-text,#102347)); stroke-width:2; }
  [part=interval][data-selected=true] [part=interval-median] { stroke-width:3.25; }
  [part=selection] { display:grid; gap:.35rem; justify-items:start; font-size:.8125rem; line-height:1.6; border-block-start:1px solid var(--boe-token-stroke-stroke,#dce3ed); padding-block-start:1rem; }
  [part=selected-label] { font-size:.75rem; font-weight:600; color:var(--boe-token-surface-surface-brand,#0061d5); }
  [part=table-summary] > :is(th,td) { border-block-end:0; }
  [part=table-detail] > td { padding-block-start:0; }
  [part=table-detail] details > div { padding-block-start:.5rem; }
  summary { cursor:pointer; font-size:.75rem; }
  @container(max-width:480px) { table { table-layout:fixed; } th:first-child { inline-size:22%; white-space:normal; } th:nth-child(2) { inline-size:22%; } th:nth-child(3) { inline-size:34%; } th:last-child { inline-size:22%; } th,td { padding:.5rem .3rem .5rem 0; font-size:.75rem; overflow-wrap:anywhere; } }
  @media(prefers-reduced-motion:reduce) { *,*::before,*::after { transition:none!important; animation:none!important; } }
`;

/** One measurement over time: discrete interval spreads and a median trajectory. */
export class DistributionTimeline extends BaseElement {
  static readonly tagName = "box-distribution-timeline";
  static get observedAttributes(): string[] {
    return ["heading", "heading-level", "embedded", "hide-note", "description", "points", "scale", "unit", "time-unit", "hide-samples", "show-samples", "max-samples",
      "selectable", "selected-id", "domain", "state", "status-message", "x-label"];
  }
  private _points: DistributionTimelinePoint[] | null = null;
  private _formatter: ((value: number) => string) | null = null;
  private tableVisible = false;
  get heading(): string { return this.getAttribute("heading")?.trim() || "Distribution over time"; }
  set heading(value: string) { this.setAttribute("heading", value); }
  get headingLevel(): HeadingLevel {
    const value = Number(this.getAttribute("heading-level") ?? 2);
    return Number.isInteger(value) && value >= 1 && value <= 6 ? value as HeadingLevel : 2;
  }
  set headingLevel(value: HeadingLevel) { this.setAttribute("heading-level", String(value)); }
  /**
   * Interval inspection is opt-in, as the box plot's row selection is: without
   * it the plot stays one image with one accessible summary, which is what an
   * embedded or printed chart wants.
   */
  get selectable(): boolean { return this.hasAttribute("selectable"); }
  set selectable(value: boolean) { this.toggleAttribute("selectable", value); }
  get selectedId(): string | null { return this.getAttribute("selected-id"); }
  set selectedId(value: string | null) { value === null ? this.removeAttribute("selected-id") : this.setAttribute("selected-id", value); }
  /** Containing value bounds. Used only when every drawn value fits inside them. */
  get domain(): number[] { return chartDomain(this); }
  set domain(value: number[]) { this.setAttribute("domain", JSON.stringify(value)); }
  get state(): string { return this.getAttribute("state") ?? "ready"; }
  set state(value: string) { this.setAttribute("state", value); }
  get statusMessage(): string { return this.getAttribute("status-message") ?? ""; }
  set statusMessage(value: string) { this.setAttribute("status-message", value); }
  /** Title for the time axis, as x-label titles the other charts' categories. */
  get xLabel(): string { return this.getAttribute("x-label") ?? ""; }
  set xLabel(value: string) { this.setAttribute("x-label", value); }
  get embedded(): boolean { return this.hasAttribute("embedded"); }
  set embedded(value: boolean) { this.toggleAttribute("embedded", value); }
  get hideNote(): boolean { return this.hasAttribute("hide-note"); }
  set hideNote(value: boolean) { this.toggleAttribute("hide-note", value); }
  get description(): string { return this.getAttribute("description") ?? ""; }
  set description(value: string) { this.setAttribute("description", value); }
  get points(): DistributionTimelinePoint[] {
    if (this._points) return this._points;
    try { const value: unknown = JSON.parse(this.getAttribute("points") ?? "[]"); return Array.isArray(value) ? value as DistributionTimelinePoint[] : []; }
    catch { return []; }
  }
  set points(value: DistributionTimelinePoint[]) { this._points = value; this.update(); }
  get scale(): DistributionTimelineScale { return this.getAttribute("scale") === "log" ? "log" : "linear"; }
  set scale(value: DistributionTimelineScale) { this.setAttribute("scale", value); }
  get unit(): string { return this.getAttribute("unit") ?? ""; }
  set unit(value: string) { this.setAttribute("unit", value); }
  get timeUnit(): string { return this.getAttribute("time-unit") ?? "s"; }
  set timeUnit(value: string) { this.setAttribute("time-unit", value); }
  /** Samples are an explicit inspection layer, off by default. */
  get showSamples(): boolean { return this.hasAttribute("show-samples"); }
  set showSamples(value:boolean) { this.toggleAttribute("show-samples",value); }
  /** Force samples off, including the inspection control. */
  get hideSamples(): boolean { return this.hasAttribute("hide-samples"); }
  set hideSamples(value: boolean) { this.toggleAttribute("hide-samples", value); }
  /** At most this many points are drawn, evenly across the time axis. */
  get maxSamples(): number {
    const value = Number(this.getAttribute("max-samples") ?? 600);
    return Number.isFinite(value) && value > 0 ? Math.max(1,Math.floor(value)) : 600;
  }
  set maxSamples(value: number) { this.setAttribute("max-samples", String(value)); }
  get format(): (value: number) => string {
    return this._formatter ?? ((value) => `${new Intl.NumberFormat(undefined, { maximumSignificantDigits: 4 }).format(value)}${this.unit ? ` ${this.unit}` : ""}`);
  }
  set format(value: (value: number) => string) { this._formatter = value; this.update(); }
  connectedCallback(): void {
    this.upgradeProperties(["heading", "headingLevel", "description", "points", "format", "scale", "unit", "timeUnit",
      "showSamples", "hideSamples", "maxSamples", "selectable", "selectedId", "domain", "state", "statusMessage", "xLabel"]);
    super.connectedCallback();
  }
  protected renderTemplate(): void {
    if (this.shadowRoot) this.shadowRoot.innerHTML = `<style>${styles}</style><div part="content-host"></div>`;
  }
  protected update(): void {
    const host=this.shadowRoot?.querySelector('[part="content-host"]');if(!host)return;
    const focused=this.shadowRoot?.activeElement as HTMLElement|null;
    const focusedPart=focused?.getAttribute("part"),focusedPoint=focused?.dataset?.pointId;
    const scrollLeft=host.querySelector('[part="chart-wrap"]')?.scrollLeft??0;
    const source=this.points;
    const points=source.filter(point=>validDistributionTimelinePoint(point,this.scale)).slice().sort((a,b)=>a.at-b.at);
    const asRows:BoxPlotRow[]=points.map((point,index)=>({id:String(index),label:String(point.at),min:point.min,q1:point.q1,median:point.median,q3:point.q3,max:point.max}));
    const value=boxPlotDomain(asRows,this.scale),time=distributionTimeDomain(points,Math.max(5,Math.floor(points.length/8)));
    const bounds=this.domain;
    if(bounds.length&&this.scale==="linear"&&points.every(point=>bounds[0]<=point.min&&bounds[1]>=point.max
      &&(point.samples??[]).every(sample=>sample>=bounds[0]&&sample<=bounds[1]))){
      value.min=bounds[0];value.max=bounds[1];value.ticks=Array.from({length:4},(_,index)=>bounds[0]+(bounds[1]-bounds[0])*index/3);
    }
    const span=value.max-value.min;
    const digits=span<1?Math.min(12,Math.max(2,1-Math.floor(Math.log10(span)))):2;
    const defaultFormatter=new Intl.NumberFormat(undefined,{maximumFractionDigits:digits});
    const formatValue=this._formatter??((input:number)=>`${defaultFormatter.format(input)}${this.unit?` ${this.unit}`:""}`);
    const formatTime=(input:number)=>`${new Intl.NumberFormat(undefined,{maximumSignificantDigits:6}).format(input)}${this.timeUnit?` ${this.timeUnit}`:""}`;
    const fmt=(input:number)=>escapeHtml(String(formatValue(input))),timeFmt=(input:number)=>escapeHtml(formatTime(input));
    const inset=points.length>20?100/points.length:4;
    const x=(at:number)=>points.length===1?50:round(inset+(at-time.min)/(time.max-time.min||1)*(100-2*inset));
    const y=(input:number)=>round(56-boxPlotPosition(input,value,this.scale)/100*56);
    const width=Math.min(2.8,76/Math.max(1,points.length));
    const median=points.map((point,index)=>`${index?"L":"M"}${x(point.at)},${y(point.median)}`).join(" ");
    const intervalId=(point:DistributionTimelinePoint)=>point.id??String(point.at);
    const summaryOf=(point:DistributionTimelinePoint)=>`${formatTime(point.at)}: median ${formatValue(point.median)}, middle 50% ${formatValue(point.q1)} to ${formatValue(point.q3)}, min ${formatValue(point.min)}, max ${formatValue(point.max)}${point.count===undefined?"":`, ${new Intl.NumberFormat().format(point.count)} values`}`;
    const selected=this.selectable?points.find(point=>intervalId(point)===this.selectedId):undefined;
    const marks=points.map(point=>{
      const at=x(point.at),half=width/2;
      return `<g part="interval" data-selected="${point===selected}"><title>${escapeHtml(summaryOf(point))}</title><line part="range" x1="${at}" x2="${at}" y1="${y(point.min)}" y2="${y(point.max)}"></line><line part="range-cap" x1="${at-half/2}" x2="${at+half/2}" y1="${y(point.min)}" y2="${y(point.min)}"></line><line part="range-cap" x1="${at-half/2}" x2="${at+half/2}" y1="${y(point.max)}" y2="${y(point.max)}"></line><rect part="band" x="${at-half}" y="${y(point.q3)}" width="${width}" height="${round(y(point.q1)-y(point.q3))}"></rect><line part="interval-median" x1="${at-half}" x2="${at+half}" y1="${y(point.median)}" y2="${y(point.median)}"></line></g>`;
    }).join("");
    const columns=Math.max(1,Math.min(240,Math.ceil(this.maxSamples/5))),perColumn=Math.max(1,Math.floor(this.maxSamples/columns));
    const suppliedSamples=points.reduce((sum,point)=>sum+(point.samples?.length??0),0);
    const dots=this.showSamples&&!this.hideSamples
      ? suppliedSamples<=this.maxSamples?points.flatMap(point=>(point.samples??[]).map(value=>({at:point.at,value}))):thinPoints(points,time,columns,perColumn)
      : [];
    const focal=selected??points.at(-1);
    const controlWidth=round(Math.max(width,(100-2*inset)/Math.max(1,points.length)));
    const controls=this.selectable&&points.length?`<div part="intervals" role="group" aria-label="${escapeHtml(this.heading)} intervals">${points.map(point=>
      `<button part="interval-control" type="button" data-point-id="${escapeHtml(intervalId(point))}" data-selected="${point===selected}" tabindex="${point===focal?0:-1}" aria-pressed="${point===selected}" title="${escapeHtml(summaryOf(point))}" aria-label="${escapeHtml(summaryOf(point))}" style="--x:${x(point.at)}%;--w:${controlWidth}%"></button>`).join("")}</div>`:"";
    const heading=escapeHtml(this.heading),worst=points.reduce<DistributionTimelinePoint|null>((found,point)=>found&&found.max>=point.max?found:point,null);
    const summary=points.length?`${this.heading}: ${points.length} intervals from ${formatTime(points[0].at)} to ${formatTime(points.at(-1)!.at)}. The median runs from ${formatValue(points[0].median)} to ${formatValue(points.at(-1)!.median)}${worst?`, and the highest value of any interval is ${formatValue(worst.max)} at ${formatTime(worst.at)}`:""}.`:"";
    const valueTicks=value.ticks.map(tick=>`<span part="value-tick" style="--pos:${round(boxPlotPosition(tick,value,this.scale))}%">${fmt(tick)}</span>`).join("");
    const timeTicks=(points.length===1?[points[0].at]:time.ticks).map(tick=>`<span part="time-tick" style="--pos:${x(tick)}%">${timeFmt(tick)}</span>`).join("");
    const grid=value.ticks.map(tick=>`<line part="grid-line" x1="0" x2="100" y1="${y(tick)}" y2="${y(tick)}"></line>`).join("");
    const chart=`<div part="plot"><div part="values" aria-hidden="true">${valueTicks}</div><div part="chart-wrap" role="region" tabindex="0" aria-label="${heading} timeline; scroll horizontally for long runs"><div part="chart-content" style="--run-width:${points.length*16}px"><div part="drawing"><svg part="chart" viewBox="0 0 100 56" preserveAspectRatio="none" role="img" aria-label="${escapeHtml(summary)}" tabindex="0"><g aria-hidden="true">${grid}${marks}<path part="median" d="${median}"></path></g></svg><div part="samples" aria-hidden="true">${dots.map(dot=>`<span part="dot" style="--x:${x(dot.at)}%;--y:${y(dot.value)/56*100}%"></span>`).join("")}</div>${controls}</div><div part="times" aria-hidden="true">${timeTicks}</div></div></div></div>${this.xLabel?`<div part="axis-title">${escapeHtml(this.xLabel)}</div>`:""}`;
    const counts=points.some(point=>point.count!==undefined);
    const headers=["Time","Median","Min–max",...(counts?["Count"]:[])];
    const tableRows=points.map(point=>`<tr part="table-summary"><th scope="row">${timeFmt(point.at)}${point===selected?'<span part="selected-label">Selected</span>':""}</th><td>${fmt(point.median)}</td><td>${fmt(point.min)}–${fmt(point.max)}</td>${counts?`<td>${point.count===undefined?"—":new Intl.NumberFormat().format(point.count)}</td>`:""}</tr><tr part="table-detail"><td colspan="${headers.length}"><details><summary>${timeFmt(point.at)} quartiles &amp; extremes</summary><div>Q1 ${fmt(point.q1)} · Q3 ${fmt(point.q3)}<br>Minimum ${fmt(point.min)} · Maximum ${fmt(point.max)}${point.samples?.length?`<br>${new Intl.NumberFormat().format(point.samples.length)} sampled values`:""}</div></details></td></tr>`).join("");
    const latest=points.at(-1);
    const omitted=source.length-points.length;
    const note=`Each box is one interval’s middle 50%; whiskers show its minimum and maximum. ${points.length>20?"Scroll horizontally to inspect the full run. ":""}${this.scale==="log"?"Logarithmic scale.":""}${omitted?` ${omitted} invalid interval${omitted===1?"":"s"} omitted.`:""}${dots.length?` Showing ${new Intl.NumberFormat().format(dots.length)} of ${new Intl.NumberFormat().format(suppliedSamples)} supplied samples.`:""}`;
    const unavailable=this.state==="loading"||this.state==="error";
    const selection=selected&&!unavailable?`<div part="selection"><div><strong>${timeFmt(selected.at)}</strong> <span part="selected-label">Selected</span></div><div>Q1 ${fmt(selected.q1)} · Median ${fmt(selected.median)} · Q3 ${fmt(selected.q3)}</div><div>Min–max ${fmt(selected.min)}–${fmt(selected.max)}${selected.count===undefined?"":` · n = ${new Intl.NumberFormat().format(selected.count)}`}${selected.samples?.length?` · ${new Intl.NumberFormat().format(selected.samples.length)} sampled`:""}</div><button part="clear-selection" type="button">Clear selection</button></div>`:"";
    const content=unavailable
      ?`<div part="empty" data-loading="${this.state==="loading"}" role="status">${escapeHtml(this.statusMessage||(this.state==="loading"?"Loading intervals…":"Intervals could not be loaded."))}</div>`
      :!points.length?`<div part="empty" id="distribution-chart">No valid intervals to display.</div>`
      :this.tableVisible?`<div part="table-wrap" id="distribution-table" role="region" aria-label="${heading} data table" tabindex="0"><table><caption>${heading} — interval summaries</caption><thead><tr>${headers.map(label=>`<th scope="col">${label}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table></div>`
      :`<div id="distribution-chart">${chart}</div>`;
    const status=unavailable||!(this.state==="partial"||this.state==="stale")?"":`<div part="status" role="status">${escapeHtml(this.statusMessage||(this.state==="partial"?"Partial interval coverage.":"Cached intervals. Check the timestamp before acting."))}</div>`;
    host.innerHTML=`<section part="panel" aria-label="${heading}" aria-busy="${this.state==="loading"}"><header part="header"><div>${renderHeadingHtml(this.heading,{level:this.headingLevel,part:"heading"})}${this.description?`<div part="description">${escapeHtml(this.description)}</div>`:""}</div></header>${points.length&&!this.tableVisible&&!unavailable?`<div part="legend" aria-label="Distribution key"><span part="legend-item"><span part="median-key" aria-hidden="true"></span>Median</span><span part="legend-item"><span part="quartile-key" aria-hidden="true"></span>Middle 50%</span><span part="legend-item"><span part="range-key" aria-hidden="true"></span>Min–max</span></div>`:""}${content}${latest&&!this.tableVisible&&!unavailable?`<div part="latest">Latest interval ${timeFmt(latest.at)} · Median ${fmt(latest.median)}${latest.count===undefined?"":` · n = ${new Intl.NumberFormat().format(latest.count)}`}</div>`:""}${this.hideNote||!points.length||unavailable?"":`<p part="note">${escapeHtml(note)}</p>`}${selection}<footer part="footer"><button part="table-toggle" type="button" ${!points.length||unavailable?"hidden":""} aria-expanded="${this.tableVisible}" aria-controls="${this.tableVisible?"distribution-table":"distribution-chart"}">${this.tableVisible?"Show chart":"Show as a table"}</button>${suppliedSamples&&!this.hideSamples&&!this.tableVisible&&!unavailable?`<button part="samples-toggle" type="button" aria-pressed="${this.showSamples}">Sampled values</button>`:""}<slot name="footer"></slot></footer>${status}</section>`;
    host.querySelector('[part="table-toggle"]')?.addEventListener("click",()=>{this.tableVisible=!this.tableVisible;this.update();this.shadowRoot?.querySelector<HTMLButtonElement>('[part="table-toggle"]')?.focus();});
    host.querySelector('[part="samples-toggle"]')?.addEventListener("click",()=>{this.showSamples=!this.showSamples;this.dispatchEvent(new CustomEvent("samples-toggled",{bubbles:true,composed:true,detail:{visible:this.showSamples&&!this.hideSamples}}));this.shadowRoot?.querySelector<HTMLButtonElement>('[part="samples-toggle"]')?.focus();});
    const scroll=host.querySelector('[part="chart-wrap"]');if(scroll)scroll.scrollLeft=scrollLeft;
    const controlFor=(id:string|null|undefined)=>id===undefined||id===null?undefined
      :Array.from(this.shadowRoot?.querySelectorAll<HTMLButtonElement>('[part="interval-control"]')??[]).find(node=>node.dataset.pointId===id);
    host.querySelector('[part="clear-selection"]')?.addEventListener("click",()=>{
      const previous=this.selectedId;this.selectedId=null;
      this.dispatchEvent(new CustomEvent("selection-cleared",{bubbles:true,composed:true,detail:{selectedId:null}}));
      (controlFor(previous)??this.shadowRoot?.querySelector<HTMLButtonElement>('[part="table-toggle"]'))?.focus();
    });
    // One tab stop for the whole run, with the arrows moving between intervals:
    // a run of five hundred seconds must not become five hundred tab stops.
    const intervalControls=Array.from(host.querySelectorAll<HTMLButtonElement>('[part="interval-control"]'));
    intervalControls.forEach((control,index)=>{
      control.addEventListener("click",()=>{
        const id=control.dataset.pointId!;this.selectedId=id;
        this.dispatchEvent(new CustomEvent("interval-selected",{bubbles:true,composed:true,detail:{id,at:points[index].at}}));
        controlFor(id)?.focus();
      });
      control.addEventListener("keydown",event=>{
        const step=event.key==="ArrowRight"?1:event.key==="ArrowLeft"?-1:0;
        const target=step?index+step:event.key==="Home"?0:event.key==="End"?intervalControls.length-1:-1;
        if(target<0||target>=intervalControls.length)return;
        event.preventDefault();
        for(const node of intervalControls)node.tabIndex=-1;
        intervalControls[target].tabIndex=0;intervalControls[target].focus();
      });
    });
    if(focusedPart){const replacement=focusedPart==="interval-control"?controlFor(focusedPoint)
      :Array.from(host.querySelectorAll<HTMLElement>('[part]')).find(node=>node.getAttribute("part")===focusedPart&&!node.hidden);
      if(replacement)replacement.focus();else{const heading=host.querySelector<HTMLElement>('[part="heading"]')!;heading.tabIndex=-1;heading.focus();}}
  }
}

DistributionTimeline.register();
