import { renderHeadingHtml, type HeadingLevel } from "../../foundations/a11y/heading.js";
import { chartDomain } from "./chart-presentation.js";
import { BaseElement } from "../../core/index.js";

export interface BoxPlotRow {
  id: string;
  label: string;
  min: number;
  p5?: number;
  q1: number;
  median: number;
  q3: number;
  p95?: number;
  p99?: number;
  max: number;
  mean?: number;
  count?: number;
  samples?: number[];
  reference?: number;
}

export type BoxPlotWhiskers = "min-max" | "p5-p95" | "p5-p99";
export type BoxPlotScale = "linear" | "log";
export type BoxPlotOrientation = "horizontal" | "vertical";

const escapeHtml = (value: string): string => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const round = (value: number): number => Math.round(value * 1000) / 1000;

export function boxPlotWhiskerValues(row: BoxPlotRow, whiskers: BoxPlotWhiskers): [number, number] {
  if (whiskers === "p5-p95" && row.p5 !== undefined && row.p95 !== undefined) return [row.p5, row.p95];
  if (whiskers === "p5-p99" && row.p5 !== undefined && row.p99 !== undefined) return [row.p5, row.p99];
  return [row.min, row.max];
}

const whiskerLabel = (row: BoxPlotRow, whiskers: BoxPlotWhiskers): string => {
  if (whiskers === "p5-p95" && row.p5 !== undefined && row.p95 !== undefined) return "5% to 95%";
  if (whiskers === "p5-p99" && row.p5 !== undefined && row.p99 !== undefined) return "5% to 99%";
  return "minimum to maximum";
};

export function validBoxPlotRow(row: BoxPlotRow, scale: BoxPlotScale): boolean {
  if (!row || typeof row.id !== "string" || !row.id.trim() || typeof row.label !== "string" || !row.label.trim()) return false;
  const values = [row.min, row.q1, row.median, row.q3, row.max];
  if (!values.every(finite) || values.some(value => scale === "log" && value <= 0)) return false;
  if (!(row.min <= row.q1 && row.q1 <= row.median && row.median <= row.q3 && row.q3 <= row.max)) return false;
  for (const value of [row.p5, row.p95, row.p99, row.mean, row.reference]) {
    if (value !== undefined && (!finite(value) || (scale === "log" && value <= 0))) return false;
  }
  if (row.p5 !== undefined && !(row.min <= row.p5 && row.p5 <= row.q1)) return false;
  if (row.p95 !== undefined && !(row.q3 <= row.p95 && row.p95 <= row.max)) return false;
  if (row.p99 !== undefined && (row.p95 ?? row.q3) > row.p99) return false;
  if (row.p99 !== undefined && row.p99 > row.max) return false;
  if (row.mean !== undefined && (row.mean < row.min || row.mean > row.max)) return false;
  if (row.count !== undefined && (!Number.isInteger(row.count) || row.count < 0)) return false;
  if (row.samples !== undefined && (!Array.isArray(row.samples) || !row.samples.every(value => finite(value) && value >= row.min && value <= row.max && (scale !== "log" || value > 0)))) return false;
  return true;
}

export interface BoxPlotDomain { min: number; max: number; ticks: number[] }

export function boxPlotDomain(rows: BoxPlotRow[], scale: BoxPlotScale): BoxPlotDomain {
  const values = rows.flatMap(row => [row.min, row.max, row.reference, ...((row.samples?.length ?? 0) <= 30 ? row.samples ?? [] : [])].filter(finite));
  if (!values.length) return { min: scale === "log" ? 1 : 0, max: scale === "log" ? 10 : 1, ticks: scale === "log" ? [1, 10] : [0, 1] };
  const low = Math.min(...values);
  const high = Math.max(...values);
  if (scale === "log") {
    const min = 10 ** Math.floor(Math.log10(low));
    const max = 10 ** Math.ceil(Math.log10(high === low ? high * 10 : high));
    const ticks = Array.from({ length: Math.min(16, Math.round(Math.log10(max / min)) + 1) }, (_, index) => min * 10 ** index);
    if (ticks.at(-1) !== max) ticks.push(max);
    return { min, max, ticks };
  }
  const span = high - low || Math.abs(high) || 1;
  const roughStep = span / 4;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const step = [1, 2, 5, 10].map(value => value * magnitude).find(value => value >= roughStep) ?? 10 * magnitude;
  const min = Math.floor(low / step) * step;
  const max = Math.ceil((high === low ? high + step : high) / step) * step;
  const ticks = Array.from({ length: Math.min(12, Math.round((max - min) / step) + 1) }, (_, index) => min + index * step);
  if (ticks.at(-1) !== max) ticks.push(max);
  return { min, max, ticks };
}

export function boxPlotPosition(value: number, domain: BoxPlotDomain, scale: BoxPlotScale): number {
  const transform = scale === "log" ? Math.log10 : (number: number) => number;
  return Math.max(0, Math.min(100, (transform(value) - transform(domain.min)) / (transform(domain.max) - transform(domain.min)) * 100));
}

const styles = `
[part="whisker-label"]{display:block;font-size:.75rem;color:var(--boe-token-text-text-secondary,#566781);white-space:normal}
  :host { display:block; container-type:inline-size; contain-intrinsic-inline-size:36rem; color:var(--boe-chart-ink,color-mix(in srgb,var(--boe-token-text-text,#102347) 88%,var(--boe-token-surface-surface-brand,#0061d5))); font:inherit; min-width:0 }
  :host([orientation=vertical]) { contain:layout }
  :host([hidden]) { display:none !important }
  [part=panel] { padding:1.5rem; background:var(--boe-token-surface-surface, #fff); border:1px solid var(--boe-token-stroke-stroke, #dedfe4); border-radius:0.375rem; min-width:0 }
  *, *::before, *::after { box-sizing:border-box }
  [part=header] { display:flex; justify-content:space-between; align-items:start; gap:0.75rem; flex-wrap:wrap; margin-bottom:1.5rem }
  :host([embedded]) [part=panel] { padding:0; background:none; border:0; border-radius:0 }
  :is(h1,h2,h3,h4,h5,h6) { margin:0; font:inherit; font-weight:600; font-size:1.125rem }
  [part=description], [part=note] { color:var(--boe-token-text-text-secondary, #626b7d); font-size:0.82rem; line-height:1.4 }
  [part=note] { margin:0.75rem 0 0; max-inline-size:65ch; font-size:.75rem }
  button[part=table-toggle] { font:inherit; color:inherit; background:none; border:0; border-radius:0.25rem; cursor:pointer; padding:0.2rem 0.35rem; text-decoration:underline; text-underline-offset:0.2em }
  button:focus-visible { outline:2px solid var(--boe-token-surface-surface-brand, #0061d5); outline-offset:3px }
  [part=plot] { display:grid; gap:1.25rem; min-width:0 }
  [part=axis], [part=row] { display:grid; grid-template-columns:minmax(7rem, 11rem) minmax(0,1fr); gap:0.7rem; align-items:center; min-width:0 }
  [part=axis] { margin-bottom:0.2rem }
  [part=ticks] { position:relative; height:1.8rem; color:var(--boe-token-text-text-secondary, #626b7d); font-size:0.72rem }
  [part=tick] { position:absolute; top:0; transform:translateX(-50%); white-space:nowrap }
  [part=tick]:first-child { transform:none } [part=tick]:last-child { transform:translateX(-100%) }
  [part=label] { min-width:0; overflow-wrap:anywhere; font-size:0.82rem; font-weight:600 }
  [part=row][data-selected=true] [part=box] { border-color:var(--boe-token-text-text,#102347); background:color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 24%,var(--boe-token-surface-surface,#fff)); outline:1px solid var(--boe-token-text-text,#102347) }
  [part=row-summary], [part=reference-label], [part=selected-label] { display:block; font-size:.75rem; line-height:1.6; font-weight:400; color:var(--boe-token-text-text-secondary,#566781) }
  [part=selected-label] { font-weight:600; color:var(--boe-token-surface-surface-brand,#0061d5) }
  [part=selection] { border-top:1px solid var(--boe-token-stroke-stroke,#dce3ed); margin-top:1.25rem; padding-top:1rem; display:grid; gap:.5rem; font-size:.8125rem; line-height:1.6 }
  [part=clear-selection] { justify-self:start; font:inherit; background:none; border:0; text-decoration:underline; color:var(--boe-token-surface-surface-brand,#0061d5); cursor:pointer; padding:.5rem 0 }
  details { font-weight:400; line-height:1.6; } summary { cursor:pointer; font-size:.75rem; }
  [part=row] { border-radius:0.3rem; padding:0.1rem 0 }
  [part=row]:hover, [part=row]:focus-within { background:var(--boe-token-surface-surface-secondary, #f5f7fb) }
  [part=mark] { position:relative; appearance:none; display:block; width:100%; height:2.8rem; padding:0; border:0; background:none; cursor:help; color:inherit }
  [part=mark]:focus-visible { outline:2px solid var(--boe-token-surface-surface-brand, #0061d5); outline-offset:2px }
  [part=gridline] { position:absolute; top:0; bottom:0; border-left:1px solid var(--boe-boxplot-grid, var(--boe-token-stroke-stroke, #dedfe4)); pointer-events:none }
  [part=whisker] { position:absolute; top:50%; height:0; border-top:1px solid var(--boe-boxplot-whisker, var(--boe-token-text-text-secondary, #626b7d)); pointer-events:none }
  [part=cap], [part=median], [part=reference] { position:absolute; top:25%; height:50%; width:2px; transform:translateX(-50%); background:var(--boe-boxplot-whisker, var(--boe-token-text-text-secondary, #626b7d)); pointer-events:none }
  [part=box] { position:absolute; top:25%; height:50%; box-sizing:border-box; border:1px solid var(--boe-boxplot-edge, #647891); border-radius:0.2rem; background:var(--boe-boxplot-fill, color-mix(in srgb, #91a8c5 28%, var(--boe-token-surface-surface, #fff))); pointer-events:none }
  [part=median] { top:20%; height:60%; width:3px; background:var(--boe-boxplot-median, var(--boe-token-text-text, #1f1e1b)) }
  [part=reference] { top:8%; height:84%; border-left:2px dashed var(--boe-boxplot-reference, #647891); background:none }
  [part=dot] { position:absolute; width:0.32rem; height:0.32rem; border-radius:50%; transform:translate(-50%,-50%); background:var(--boe-boxplot-dot, #354668); pointer-events:none }
  [part=detail] { display:none; position:absolute; z-index:3; left:50%; bottom:100%; transform:translateX(-50%); box-sizing:border-box; width:max-content; max-width:min(14rem, 85vw); max-width:min(14rem, calc(100cqi - 2rem)); padding:0.55rem 0.7rem; border-radius:0.35rem; background:var(--boe-token-surface-surface, #fff); border:1px solid var(--boe-token-stroke-stroke, #dedfe4); box-shadow:0 4px 16px #0002; text-align:left; font-size:0.75rem; line-height:1.5; white-space:normal; overflow-wrap:anywhere; pointer-events:none }
  [part=mark]:is(:hover,:focus-visible) [part=detail] { display:block }
  :host([selectable]) [part=detail] { display:none!important }
  ::slotted([slot=footer]) { display:block; margin-top:.75rem; font-size:.75rem; line-height:1.5; color:var(--boe-token-text-text-secondary,#566781) }
  [part=footer] { margin-top:1rem; padding-top:1rem; border-top:1px solid var(--boe-token-stroke-stroke,#dce3ed) }
  [part=table-wrap] { overflow:auto; max-width:100% } table { border-collapse:collapse; width:100%; font-size:0.8rem } th,td { padding:0.4rem 0.5rem; text-align:left; vertical-align:top; border-bottom:1px solid var(--boe-token-stroke-stroke, #dedfe4) } th { white-space:nowrap } caption { text-align:left; font-weight:700; padding:0.3rem 0 }
  @container (max-width:480px) {
    table { table-layout:fixed; }
    th:first-child { width:34%; white-space:normal; }
    th:nth-child(2) { width:22%; }
    th:nth-child(3) { width:26%; }
    th:last-child { width:18%; }
    th,td { padding:.5rem .25rem; font-size:.75rem; overflow-wrap:anywhere; }
    thead th:not(:first-child),td:nth-child(2),td:last-child { white-space:nowrap; overflow-wrap:normal; }
    summary { overflow-wrap:anywhere; }
    [data-orientation=horizontal] [part=row] { grid-template-columns:1fr; gap:.3rem; }
    [data-orientation=horizontal] [part=axis] { grid-template-columns:1fr; }
    [data-orientation=horizontal] [part=axis] > span { display:none; }
    [part=panel] { padding:1rem; }
  }
  @container (max-width:18rem) { table { min-inline-size:24rem; } }
  [part=table-summary] > :is(th,td) { border-bottom:0; }
  [part=table-detail] > td { padding-top:0; }
  [part=table-detail] details > div { padding-top:.5rem; }
  [part=table-wrap]:focus-visible { outline:2px solid var(--boe-token-surface-surface-brand, #0061d5); outline-offset:-2px }
  [part=empty][data-loading=true] { min-block-size:14rem; background:var(--boe-token-surface-surface-secondary,#f4f6f8) }
  [part=empty] { padding:1.2rem; color:var(--boe-token-text-text-secondary, #626b7d) }
  [part=vertical-plot] { position:relative; padding-left:3.5rem; max-width:42rem; margin-inline:auto }
  [part=plot-scroll] { overflow:auto; max-width:100%; min-width:0 }
  [part=plot-scroll]:focus-visible { outline:2px solid var(--boe-token-surface-surface-brand, #0061d5); outline-offset:-2px }
  [data-orientation=vertical] [part=plot] { position:relative; box-sizing:border-box; grid-template-columns:repeat(var(--row-count), minmax(4.5rem,1fr)); gap:0.4rem; width:100%; min-width:calc(var(--row-count) * 4.5rem + (var(--row-count) - 1) * 0.4rem) }
  [part=gridlines] { position:absolute; top:0; left:0; right:0; height:12rem; pointer-events:none }
  [data-orientation=vertical] [part=axis] { display:block; position:absolute; top:0; left:0; width:3rem; height:12rem; margin:0 }
  [data-orientation=vertical] [part=ticks] { height:100% }
  [data-orientation=vertical] [part=tick], [data-orientation=vertical] [part=tick]:first-child, [data-orientation=vertical] [part=tick]:last-child { left:0 !important; top:auto; bottom:var(--pos); transform:translateY(50%) }
  [data-orientation=vertical] [part=row] { display:grid; grid-template-columns:minmax(0,1fr); grid-template-rows:12rem auto; padding:0; gap:0.3rem; align-items:stretch; min-width:0 }
  [data-orientation=vertical] [part=label] { grid-row:2; text-align:center }
  [data-orientation=vertical] [part=mark] { grid-row:1; height:12rem; width:min(100%, 5.5rem); margin:0 auto }
  [data-orientation=vertical] [part=gridline] { top:auto; left:0; right:0; bottom:var(--pos); border-left:0; border-bottom:1px solid var(--boe-boxplot-grid, var(--boe-token-stroke-stroke, #dedfe4)) }
  [data-orientation=vertical] [part=whisker] { left:50% !important; width:0 !important; border-top:0; border-left:2px solid var(--boe-boxplot-whisker, var(--boe-token-text-text-secondary, #626b7d)); bottom:var(--start); height:var(--size); top:auto }
  [data-orientation=vertical] [part=box] { left:33% !important; width:34% !important; bottom:var(--start); height:var(--size); top:auto }
  [data-orientation=vertical] [part=cap], [data-orientation=vertical] [part=median], [data-orientation=vertical] [part=reference] { left:27% !important; width:46%; height:2px; top:auto; bottom:var(--pos); transform:translateY(50%) }
  [data-orientation=vertical] [part=median] { left:23% !important; width:54%; height:3px }
  [data-orientation=vertical] [part=reference] { left:16% !important; width:68%; height:0; border-left:0; border-top:2px dashed var(--boe-boxplot-reference, #647891) }
  [data-orientation=vertical] [part=dot] { left:var(--jitter) !important; bottom:var(--pos); top:auto; transform:translate(-50%,50%) }
  [data-orientation=vertical] [part=detail] { position:fixed; left:var(--_boxplot-detail-x, 0px); top:var(--_boxplot-detail-y, 0px); bottom:auto; transform:none }
  @container (max-width:600px) { [part=panel] { padding:1rem } [part=axis], [part=row] { display:block } [part=axis] { padding-top:0.2rem } [part=label] { display:block; margin-bottom:0.1rem } [part=mark] { height:2.6rem } [data-orientation=vertical] [part=axis] { padding:0 } }
  @media (prefers-reduced-motion:reduce) { *, *::before, *::after { transition:none !important; animation:none !important } }
`;

/** Distribution chart for host-computed summary statistics. Invalid rows are omitted. */
export class BoxPlot extends BaseElement {
  static readonly tagName = "box-box-plot";
  static get observedAttributes(): string[] { return ["selected-id", "selectable", "domain", "state", "status-message", "heading", "heading-level", "embedded", "hide-note", "description", "rows", "orientation", "scale", "whiskers", "unit"]; }
  get selectedId(): string | null { return this.getAttribute("selected-id"); }
  set selectedId(value: string | null) { value === null ? this.removeAttribute("selected-id") : this.setAttribute("selected-id",value); }
  get selectable(): boolean { return this.hasAttribute("selectable"); }
  set selectable(value: boolean) { this.toggleAttribute("selectable",value); }
  get domain(): number[] { return chartDomain(this); }
  set domain(value: number[]) { this.setAttribute("domain",JSON.stringify(value)); }
  get state(): string { return this.getAttribute("state") ?? "ready"; }
  set state(value: string) { this.setAttribute("state",value); }
  get statusMessage(): string { return this.getAttribute("status-message") ?? ""; }
  set statusMessage(value: string) { this.setAttribute("status-message",value); }
  private _rows: BoxPlotRow[] | null = null;
  private _formatter: ((value: number) => string) | null = null;
  private tableVisible = false;
  private resizeObserver: ResizeObserver | null = null;
  private detailFrame: number | null = null;
  connectedCallback(): void {
    super.connectedCallback();
    if (typeof ResizeObserver !== "undefined" && !this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.positionActiveDetails());
      this.resizeObserver.observe(this);
    }
  }
  disconnectedCallback(): void {
    this.resizeObserver?.disconnect(); this.resizeObserver = null;
    if (this.detailFrame !== null) cancelAnimationFrame(this.detailFrame);
    this.detailFrame = null;
    super.disconnectedCallback();
  }
  private positionDetail(mark: HTMLElement): void {
    const detail = mark.querySelector<HTMLElement>('[part="detail"]');
    if (!mark.isConnected || !detail?.getClientRects().length) return;
    const anchor = mark.getBoundingClientRect(), bounds = this.getBoundingClientRect(), tooltip = detail.getBoundingClientRect();
    const left = Math.max(Math.max(8, bounds.left), Math.min(anchor.left + anchor.width / 2 - tooltip.width / 2, Math.min(innerWidth - 8, bounds.right) - tooltip.width));
    detail.style.setProperty("--_boxplot-detail-x", `${left - bounds.left}px`);
    detail.style.setProperty("--_boxplot-detail-y", `${Math.max(8, anchor.top - tooltip.height - 8) - bounds.top}px`);
  }
  private positionActiveDetails(): void {
    if (this.orientation === "vertical") this.shadowRoot?.querySelectorAll<HTMLElement>('[part="mark"]:is(:hover,:focus-visible)').forEach(mark => this.positionDetail(mark));
  }
  private scheduleDetail(mark: HTMLElement): void {
    if (this.detailFrame !== null) cancelAnimationFrame(this.detailFrame);
    this.detailFrame = requestAnimationFrame(() => { this.detailFrame = null; this.positionDetail(mark); });
  }
  get heading(): string { return this.getAttribute("heading")?.trim() || "Distribution"; }
  set heading(value: string) { this.setAttribute("heading", value); }
  get headingLevel(): HeadingLevel {
    const value = Number(this.getAttribute("heading-level") ?? 2);
    return Number.isInteger(value) && value >= 1 && value <= 6 ? value as HeadingLevel : 2;
  }
  set headingLevel(value: HeadingLevel) { this.setAttribute("heading-level", String(value)); }
  get embedded(): boolean { return this.hasAttribute("embedded"); }
  set embedded(value: boolean) { this.toggleAttribute("embedded", value); }
  get hideNote(): boolean { return this.hasAttribute("hide-note"); }
  set hideNote(value: boolean) { this.toggleAttribute("hide-note", value); }
  get description(): string { return this.getAttribute("description") ?? ""; }
  set description(value: string) { this.setAttribute("description", value); }
  get rows(): BoxPlotRow[] {
    if (this._rows) return this._rows;
    try { const value: unknown = JSON.parse(this.getAttribute("rows") ?? "[]"); return Array.isArray(value) ? value as BoxPlotRow[] : []; }
    catch { return []; }
  }
  set rows(value: BoxPlotRow[]) { this._rows = value; this.update(); }
  get orientation(): BoxPlotOrientation { return this.getAttribute("orientation") === "vertical" ? "vertical" : "horizontal"; }
  set orientation(value: BoxPlotOrientation) { this.setAttribute("orientation", value); }
  get scale(): BoxPlotScale { return this.getAttribute("scale") === "log" ? "log" : "linear"; }
  set scale(value: BoxPlotScale) { this.setAttribute("scale", value); }
  get whiskers(): BoxPlotWhiskers {
    const value = this.getAttribute("whiskers");
    return value === "p5-p95" || value === "p5-p99" ? value : "min-max";
  }
  set whiskers(value: BoxPlotWhiskers) { this.setAttribute("whiskers", value); }
  get unit(): string { return this.getAttribute("unit") ?? ""; }
  set unit(value: string) { this.setAttribute("unit", value); }
  get format(): (value: number) => string { return this._formatter ?? ((value) => `${new Intl.NumberFormat(undefined, { maximumSignificantDigits: 4 }).format(value)}${this.unit ? ` ${this.unit}` : ""}`); }
  set format(value: (value: number) => string) { this._formatter = value; this.update(); }
  protected renderTemplate(): void { if (this.shadowRoot) this.shadowRoot.innerHTML = `<style>${styles}</style><div part="content-host"></div>`; }
  protected update(): void {
    const host = this.shadowRoot?.querySelector('[part="content-host"]');
    if (!host) return;
    if (this.detailFrame !== null) cancelAnimationFrame(this.detailFrame);
    this.detailFrame = null;
    const focusedId = this.shadowRoot?.activeElement?.getAttribute("data-row-id");
    const previousScroll = host.querySelector<HTMLElement>('[part="plot-scroll"]');
    const scrollLeft = previousScroll?.scrollLeft ?? 0;
    const scrollFocused = previousScroll !== null && previousScroll === this.shadowRoot?.activeElement;
    const rows = this.rows.filter(row => validBoxPlotRow(row, this.scale));
    const domain = boxPlotDomain(rows, this.scale);
    const bounds = this.domain;
    if (bounds.length && this.scale === "linear" && rows.every(row => bounds[0] <= Math.min(row.min, row.reference ?? row.min) && bounds[1] >= Math.max(row.max, row.reference ?? row.max))) {
      domain.min = bounds[0]; domain.max = bounds[1]; domain.ticks = Array.from({length:4},(_,i)=>domain.min+(domain.max-domain.min)*i/3);
    }
    const span = domain.max - domain.min;
    const digits = span < 1 ? Math.min(12, Math.max(2, 1 - Math.floor(Math.log10(span)))) : 2;
    const defaultFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: digits });
    const formatValue = this._formatter ?? ((value: number) => `${defaultFormatter.format(value)}${this.unit ? ` ${this.unit}` : ""}`);
    const fmt = (value: number) => escapeHtml(String(formatValue(value)));
    const position = (value: number) => round(boxPlotPosition(value, domain, this.scale));
    const range = (start: number, end: number): string => `--start:${position(start)}%;--size:${round(position(end) - position(start))}%`;
    const heading = escapeHtml(this.heading);
    const ticks = domain.ticks.map(value => `<span part="tick" style="left:${position(value)}%;--pos:${position(value)}%">${fmt(value)}</span>`).join("");
    const grid = domain.ticks.map(value => `<span part="gridline" style="${this.orientation === "vertical" ? "" : `left:${position(value)}%;`}--pos:${position(value)}%"></span>`).join("");
    const marks = rows.map(row => {
      const [low, high] = boxPlotWhiskerValues(row, this.whiskers);
      const summary = `${row.label}: median ${formatValue(row.median)}, middle half ${formatValue(row.q1)} to ${formatValue(row.q3)}, ${whiskerLabel(row, this.whiskers)} ${formatValue(low)} to ${formatValue(high)}, minimum ${formatValue(row.min)}, maximum ${formatValue(row.max)}${row.count === undefined ? "" : `, ${new Intl.NumberFormat().format(row.count)} calls`}${row.mean === undefined ? "" : `, mean ${formatValue(row.mean)}`}${row.reference === undefined ? "" : `, reference ${formatValue(row.reference)}`}`;
      const dots = (row.samples?.length ?? 0) <= 30 ? (row.samples ?? []).map((value, index) => `<span part="dot" style="left:${position(value)}%;top:${38 + (index % 5) * 6}%;--pos:${position(value)}%;--jitter:${35 + (index % 5) * 7}%"></span>`).join("") : "";
      const caps = [low, high].map(value => `<span part="cap" style="left:${position(value)}%;--pos:${position(value)}%"></span>`).join("");
      return `<div part="row" data-selected="${this.selectedId === row.id}"><span part="label">${escapeHtml(row.label)}<span part="row-summary">Median ${fmt(row.median)}${row.count === undefined ? "" : ` · n = ${new Intl.NumberFormat().format(row.count)}`}</span>${row.reference === undefined ? "" : `<span part="reference-label">Reference ${fmt(row.reference)}</span>`}${this.selectedId === row.id ? '<span part="selected-label">Selected</span>' : ""}</span><div tabindex="0" role="${this.selectable ? "button" : "img"}" ${this.selectable ? `aria-pressed="${this.selectedId === row.id}"` : ""} part="mark" data-row-id="${escapeHtml(row.id)}" aria-label="${escapeHtml(summary)}">${this.orientation === "vertical" ? "" : grid}<span part="whisker" style="left:${position(low)}%;width:${round(position(high) - position(low))}%;${range(low, high)}"></span>${caps}<span part="box" style="left:${position(row.q1)}%;width:${round(position(row.q3) - position(row.q1))}%;${range(row.q1, row.q3)}"></span><span part="median" style="left:${position(row.median)}%;--pos:${position(row.median)}%"></span>${row.reference === undefined ? "" : `<span part="reference" style="left:${position(row.reference)}%;--pos:${position(row.reference)}%"></span>`}${dots}<span part="detail" aria-hidden="true">${escapeHtml(summary)}</span></div></div>`;
    }).join("");
    const headers = ["Row", "Median", "Range", "Count"];
    const tableRows = rows.map(row => {
      const [low,high] = boxPlotWhiskerValues(row,this.whiskers);
      return `<tr part="table-summary"><th scope="row">${escapeHtml(row.label)}${this.selectedId === row.id ? '<span part="selected-label">Selected</span>' : ""}</th><td>${fmt(row.median)}</td><td>${fmt(low)} – ${fmt(high)}<small part="whisker-label">${escapeHtml(whiskerLabel(row, this.whiskers))}</small></td><td>${row.count === undefined ? "—" : new Intl.NumberFormat().format(row.count)}</td></tr><tr part="table-detail"><td colspan="4"><details><summary>${escapeHtml(row.label)} quartiles &amp; extremes</summary><div>Q1 ${fmt(row.q1)} · Q3 ${fmt(row.q3)}<br>Minimum ${fmt(row.min)} · Maximum ${fmt(row.max)}${(["p5","p95","p99"] as const).filter(key=>row[key] !== undefined).map(key=>`<br>${key.toUpperCase()} ${fmt(row[key]!)}`).join("")}${row.mean === undefined ? "" : `<br>Mean ${fmt(row.mean)}`}${row.reference === undefined ? "" : `<br>Reference ${fmt(row.reference)}`}</div></details></td></tr>`;
    }).join("");
    const selected = rows.find(row => row.id === this.selectedId);
    const selection = selected && !["loading","error"].includes(this.state) ? `<footer part="selection">${this.tableVisible ? "" : `<strong>${escapeHtml(selected.label)} details</strong><div>Q1 ${fmt(selected.q1)} · Median ${fmt(selected.median)} · Q3 ${fmt(selected.q3)}</div><div>${escapeHtml(whiskerLabel(selected,this.whiskers))} ${fmt(boxPlotWhiskerValues(selected,this.whiskers)[0])}–${fmt(boxPlotWhiskerValues(selected,this.whiskers)[1])} · Min–max ${fmt(selected.min)}–${fmt(selected.max)}</div>`}<button type="button" part="clear-selection">Clear selection</button></footer>` : "";
    const axis = `<div part="axis" aria-hidden="true"><span></span><div part="ticks">${ticks}</div></div>`;
    const plot = this.orientation === "vertical"
      ? `<div part="vertical-plot">${axis}<div part="plot-scroll" tabindex="0" role="region" aria-label="${heading} vertical plot"><div part="plot" id="boxplot-chart" role="group" aria-label="${heading}"><div part="gridlines" aria-hidden="true">${grid}</div>${marks}</div></div></div>`
      : `<div part="plot" id="boxplot-chart" role="group" aria-label="${heading}">${axis}${marks}</div>`;
    const note = this.hideNote ? "" : `<p part="note">Box: middle 50%; line: median; whiskers: ${this.whiskers === "min-max" ? "minimum–maximum" : this.whiskers === "p5-p95" ? "P5–P95" : "P5–P99"}${this.whiskers !== "min-max" && rows.some(row=>row.p5 === undefined || (this.whiskers === "p5-p95" ? row.p95 === undefined : row.p99 === undefined)) ? " (missing percentiles use minimum–maximum)" : ""}. ${this.scale === "log" ? "Logarithmic scale." : ""}</p>`;
    const unavailable = this.state === "loading" || this.state === "error";
    const content = unavailable ? `<div part="empty" data-loading="${this.state === "loading"}" role="status">${escapeHtml(this.statusMessage || (this.state === "loading" ? "Loading observations…" : "Observations could not be loaded."))}</div>`
      : !rows.length ? `<div part="empty" id="boxplot-chart">No valid distribution rows to display.</div>`
      : this.tableVisible ? `<div part="table-wrap" id="boxplot-table" role="region" aria-label="${heading} data table" tabindex="0"><table><caption>${heading}</caption><thead><tr>${headers.map(label=>`<th scope="col">${label}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table></div>`
      : rows.length ? plot : `<div part="empty" id="boxplot-chart">No valid distribution rows to display.</div>`;
    host.innerHTML = `<section part="panel" data-orientation="${this.orientation}" aria-label="${heading}" aria-busy="${this.state === "loading"}" style="--row-count:${Math.max(1,rows.length)}">
      <header part="header"><div>${renderHeadingHtml(this.heading,{level:this.headingLevel,part:"heading"})}${this.description ? `<div part="description">${escapeHtml(this.description)}</div>` : ""}</div></header>
      ${content}${unavailable ? "" : note}${selection}
      <footer part="footer"><button part="table-toggle" type="button" ${unavailable || !rows.length ? "hidden" : ""} aria-expanded="${this.tableVisible}" aria-controls="${this.tableVisible ? "boxplot-table" : "boxplot-chart"}">${this.tableVisible ? "Show chart" : "Show as a table"}</button><slot name="footer"></slot></footer>
      ${this.state === "partial" || this.state === "stale" ? `<div part="note" role="status">${escapeHtml(this.statusMessage || (this.state === "partial" ? "Partial sample coverage." : "Cached observations."))}</div>` : ""}
    </section>`;

    host.querySelector('[part="table-toggle"]')?.addEventListener("click", () => { this.tableVisible = !this.tableVisible; this.update(); this.shadowRoot?.querySelector<HTMLButtonElement>('[part="table-toggle"]')?.focus(); });
    host.querySelector('[part="clear-selection"]')?.addEventListener("click", () => { this.selectedId=null; this.dispatchEvent(new CustomEvent("selection-cleared",{bubbles:true,composed:true,detail:{selectedId:null}})); (this.shadowRoot?.querySelector<HTMLElement>('[part="mark"]') ?? this.shadowRoot?.querySelector<HTMLButtonElement>('[part="table-toggle"]'))?.focus(); });
    if (this.selectable) host.querySelectorAll<HTMLElement>('[part="mark"]').forEach(mark => {
      const select = () => { const id=mark.dataset.rowId!; this.selectedId=id; this.dispatchEvent(new CustomEvent("row-selected",{bubbles:true,composed:true,detail:{id}})); };
      mark.addEventListener("click",select);
      mark.addEventListener("keydown",event=>{if(event.key === "Enter" || event.key === " "){event.preventDefault();select();}});
    });
    if (this.orientation === "vertical") {
      host.querySelectorAll<HTMLElement>('[part="mark"]').forEach(mark => {
        mark.addEventListener("mouseenter", () => this.positionDetail(mark));
        mark.addEventListener("focus", () => this.scheduleDetail(mark));
      });
      host.querySelector('[part="plot-scroll"]')?.addEventListener("scroll", () => {
        this.positionActiveDetails();
      });
    }
    const scroll = host.querySelector<HTMLElement>('[part="plot-scroll"]');
    if (scroll) scroll.scrollLeft = scrollLeft;
    if (scrollFocused) scroll?.focus({preventScroll:true});
    if (focusedId) {
      const mark = Array.from(host.querySelectorAll<HTMLElement>('[part="mark"]')).find(candidate => candidate.dataset.rowId === focusedId);
      if (mark) mark.focus({preventScroll:true});
      else scroll?.focus({preventScroll:true});
    }
  }
}

BoxPlot.register();
