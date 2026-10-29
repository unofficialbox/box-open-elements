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
export function distributionTimeDomain(points: DistributionTimelinePoint[]): BoxPlotDomain {
  if (!points.length) return { min: 0, max: 1, ticks: [0, 1] };
  const low = Math.min(...points.map(point => point.at));
  const high = Math.max(...points.map(point => point.at));
  if (high === low) return { min: low, max: low + 1, ticks: [low, low + 1] };
  const count = 5;
  const ticks = Array.from({ length: count }, (_, index) => low + (high - low) * index / (count - 1));
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

const styles = `
  :host { display:block; container-type:inline-size; contain-intrinsic-inline-size:36rem; color:var(--boe-token-text-text, #1f1e1b); font:inherit; min-width:0 }
  :host([hidden]) { display:none !important }
  [part=panel] { padding:1.25rem; background:var(--boe-token-surface-surface, #fff); border:1px solid var(--boe-token-stroke-stroke, #dedfe4); border-radius:0.75rem; min-width:0 }
  :host([embedded]) [part=panel] { padding:0; background:none; border:0; border-radius:0 }
  [part=header] { display:flex; justify-content:space-between; align-items:start; gap:0.75rem; flex-wrap:wrap; margin-bottom:1.5rem }
  :is(h1,h2,h3,h4,h5,h6) { margin:0; font:inherit; font-weight:600; font-size:1rem }
  [part=description], [part=note] { color:var(--boe-token-text-text-secondary, #626b7d); font-size:0.82rem; line-height:1.4 }
  [part=note] { margin:0.75rem 0 0; max-inline-size:65ch; font-size:0.75rem }
  button[part=table-toggle] { font:inherit; color:inherit; background:none; border:0; border-radius:0.25rem; cursor:pointer; padding:0.2rem 0.35rem; text-decoration:underline; text-underline-offset:0.2em }
  button:focus-visible { outline:2px solid var(--boe-token-surface-surface-brand, #0061d5); outline-offset:3px }
  [part=plot] { display:grid; grid-template-columns:minmax(3rem, auto) minmax(0,1fr); gap:0.4rem; align-items:stretch; min-width:0 }
  [part=values] { position:relative; height:14rem; color:var(--boe-token-text-text-secondary, #626b7d); font-size:0.72rem }
  [part=value-tick] { position:absolute; right:0; transform:translateY(50%); bottom:var(--pos); white-space:nowrap }
  [part=chart-wrap] { position:relative; min-width:0 }
  svg[part=chart] { display:block; width:100%; height:14rem; overflow:visible }
  [part=grid-line] { stroke:var(--boe-distribution-grid, var(--boe-token-stroke-stroke, #dedfe4)); stroke-width:0.4 }
  [part=range] { fill:var(--boe-distribution-range, color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 10%, transparent)) }
  [part=band] { fill:var(--boe-distribution-band, color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 28%, transparent)) }
  [part=median] { fill:none; stroke:var(--boe-distribution-median, var(--boe-token-text-text, #1f1e1b)); stroke-width:1; stroke-linejoin:round }
  [part=dot] { fill:var(--boe-distribution-dot, #354668); opacity:0.65 }
  [part=times] { display:flex; justify-content:space-between; gap:0.4rem; color:var(--boe-token-text-text-secondary, #626b7d); font-size:0.72rem; margin-top:0.25rem }
  [part=time-tick] { white-space:nowrap }
  [part=table-wrap] { overflow:auto; max-width:100% } table { border-collapse:collapse; width:100%; font-size:0.8rem }
  th,td { padding:0.4rem 0.5rem; text-align:left; border-bottom:1px solid var(--boe-token-stroke-stroke, #dedfe4) } th { white-space:nowrap }
  caption { text-align:left; font-weight:700; padding:0.3rem 0 }
  [part=table-wrap]:focus-visible { outline:2px solid var(--boe-token-surface-surface-brand, #0061d5); outline-offset:-2px }
  svg[part=chart]:focus-visible { outline:2px solid var(--boe-token-surface-surface-brand, #0061d5); outline-offset:2px }
  [part=empty] { padding:1.2rem; color:var(--boe-token-text-text-secondary, #626b7d) }
  @container (max-width:600px) { [part=panel] { padding:1rem } svg[part=chart], [part=values] { height:11rem } }
  @media (prefers-reduced-motion:reduce) { *, *::before, *::after { transition:none !important; animation:none !important } }
`;

/**
 * How a distribution moved over a run: the middle half as a band, the median
 * as a line, the whole range behind them, and the host's sampled values as
 * points. One row a time, unlike box-plot's one row a group, so a run of
 * hundreds of intervals reads as a shape rather than hundreds of labels.
 * Invalid points are omitted.
 */
export class DistributionTimeline extends BaseElement {
  static readonly tagName = "box-distribution-timeline";
  static get observedAttributes(): string[] {
    return ["heading", "heading-level", "embedded", "hide-note", "description", "points", "scale", "unit", "time-unit", "hide-samples", "max-samples"];
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
  /** Points are drawn when the host sends samples; this leaves them out. */
  get hideSamples(): boolean { return this.hasAttribute("hide-samples"); }
  set hideSamples(value: boolean) { this.toggleAttribute("hide-samples", value); }
  /** At most this many points are drawn, evenly across the time axis. */
  get maxSamples(): number {
    const value = Number(this.getAttribute("max-samples") ?? 600);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 600;
  }
  set maxSamples(value: number) { this.setAttribute("max-samples", String(value)); }
  get format(): (value: number) => string {
    return this._formatter ?? ((value) => `${new Intl.NumberFormat(undefined, { maximumSignificantDigits: 4 }).format(value)}${this.unit ? ` ${this.unit}` : ""}`);
  }
  set format(value: (value: number) => string) { this._formatter = value; this.update(); }
  protected renderTemplate(): void {
    if (this.shadowRoot) this.shadowRoot.innerHTML = `<style>${styles}</style><div part="content-host"></div>`;
  }
  protected update(): void {
    const host = this.shadowRoot?.querySelector('[part="content-host"]');
    if (!host) return;
    const points = this.points.filter(point => validDistributionTimelinePoint(point, this.scale))
      .slice().sort((a, b) => a.at - b.at);
    const asRows: BoxPlotRow[] = points.map((point, index) => ({
      id: String(index), label: String(point.at), min: point.min, q1: point.q1, median: point.median, q3: point.q3, max: point.max,
    }));
    const value = boxPlotDomain(asRows, this.scale);
    const time = distributionTimeDomain(points);
    const span = value.max - value.min;
    const digits = span < 1 ? Math.min(12, Math.max(2, 1 - Math.floor(Math.log10(span)))) : 2;
    const defaultFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: digits });
    const formatValue = this._formatter ?? ((input: number) => `${defaultFormatter.format(input)}${this.unit ? ` ${this.unit}` : ""}`);
    const fmt = (input: number) => escapeHtml(String(formatValue(input)));
    const timeFmt = (input: number) => escapeHtml(`${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(input)}${this.timeUnit ? ` ${this.timeUnit}` : ""}`);
    const x = (at: number) => round((at - time.min) / (time.max - time.min || 1) * 100);
    const y = (input: number) => round(56 - boxPlotPosition(input, value, this.scale) / 100 * 56);
    const area = (low: (point: DistributionTimelinePoint) => number, high: (point: DistributionTimelinePoint) => number): string => {
      if (!points.length) return "";
      const up = points.map(point => `${x(point.at)},${y(high(point))}`).join(" L");
      const down = points.slice().reverse().map(point => `${x(point.at)},${y(low(point))}`).join(" L");
      return `M${up} L${down} Z`;
    };
    const median = points.map((point, index) => `${index ? "L" : "M"}${x(point.at)},${y(point.median)}`).join(" ");
    const columns = Math.max(1, Math.min(240, Math.ceil(this.maxSamples / 5)));
    const perColumn = Math.max(1, Math.floor(this.maxSamples / columns));
    const dots = this.hideSamples ? [] : thinPoints(points, time, columns, perColumn);
    const heading = escapeHtml(this.heading);
    const worst = points.reduce<DistributionTimelinePoint | null>((found, point) => found && found.max >= point.max ? found : point, null);
    const summary = points.length
      ? `${this.heading}: ${points.length} intervals from ${timeFmt(time.min).replace(/&nbsp;/g, " ")} to ${timeFmt(time.max).replace(/&nbsp;/g, " ")}. `
        + `The median runs from ${formatValue(points[0]!.median)} to ${formatValue(points.at(-1)!.median)}`
        + `${worst ? `, and the highest value of any interval is ${formatValue(worst.max)} at ${timeFmt(worst.at).replace(/&nbsp;/g, " ")}` : ""}.`
      : "";
    const valueTicks = value.ticks.map(tick => `<span part="value-tick" style="--pos:${round(boxPlotPosition(tick, value, this.scale))}%">${fmt(tick)}</span>`).join("");
    const timeTicks = time.ticks.map(tick => `<span part="time-tick">${timeFmt(tick)}</span>`).join("");
    const grid = value.ticks.map(tick => `<line part="grid-line" x1="0" x2="100" y1="${y(tick)}" y2="${y(tick)}"></line>`).join("");
    const chart = `<div part="plot"><div part="values" aria-hidden="true">${valueTicks}</div><div part="chart-wrap">`
      + `<svg part="chart" viewBox="0 0 100 56" preserveAspectRatio="none" role="img" aria-label="${escapeHtml(summary)}" tabindex="0">`
      + `<g aria-hidden="true">${grid}</g>`
      + `<path part="range" d="${area(point => point.min, point => point.max)}"></path>`
      + `<path part="band" d="${area(point => point.q1, point => point.q3)}"></path>`
      + `<path part="median" d="${median}"></path>`
      + `<g part="dots">${dots.map(dot => `<circle part="dot" cx="${x(dot.at)}" cy="${y(dot.value)}" r="0.6"></circle>`).join("")}</g>`
      + `</svg><div part="times" aria-hidden="true">${timeTicks}</div></div></div>`;
    const headers = ["Time", "Min", "25%", "Median", "75%", "Max", ...(points.some(point => point.count !== undefined) ? ["Count"] : [])];
    const tableRows = points.map(point => `<tr><th scope="row">${timeFmt(point.at)}</th>`
      + [point.min, point.q1, point.median, point.q3, point.max].map(input => `<td>${fmt(input)}</td>`).join("")
      + `${points.some(candidate => candidate.count !== undefined) ? `<td>${point.count === undefined ? "—" : new Intl.NumberFormat().format(point.count)}</td>` : ""}</tr>`).join("");
    host.innerHTML = `<section part="panel" aria-label="${heading}"><header part="header"><div>`
      + `${renderHeadingHtml(this.heading, { level: this.headingLevel, part: "heading" })}`
      + `${this.description ? `<div part="description">${escapeHtml(this.description)}</div>` : ""}`
      + `${this.hideNote ? "" : `<p part="note">Band: middle 50%; line: median; behind them, minimum to maximum.${this.hideSamples || !points.some(point => point.samples?.length) ? "" : ` Points are a sample of the values, at most ${new Intl.NumberFormat().format(this.maxSamples)} of them, spread evenly over the time axis.`} ${this.scale === "log" ? "Logarithmic scale." : "Linear scale."}</p>`}`
      + `</div><button part="table-toggle" type="button" aria-expanded="${this.tableVisible}" aria-controls="${this.tableVisible ? "distribution-table" : "distribution-chart"}">${this.tableVisible ? "Show chart" : "Show as a table"}</button></header>`
      + `${this.tableVisible
        ? `<div part="table-wrap" id="distribution-table" role="region" aria-label="${heading} data table" tabindex="0"><table><caption>${heading}</caption><thead><tr>${headers.map(label => `<th scope="col">${label}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table></div>`
        : points.length ? `<div id="distribution-chart">${chart}</div>` : `<div part="empty" id="distribution-chart">No valid intervals to display.</div>`}</section>`;
    host.querySelector('[part="table-toggle"]')?.addEventListener("click", () => {
      this.tableVisible = !this.tableVisible;
      this.update();
      this.shadowRoot?.querySelector<HTMLButtonElement>('[part="table-toggle"]')?.focus();
    });
  }
}

DistributionTimeline.register();
