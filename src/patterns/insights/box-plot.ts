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
  :host { display:block; container-type:inline-size; color:var(--boe-token-text-text, #1f1e1b); font:inherit; min-width:0 }
  :host([hidden]) { display:none !important }
  [part=panel] { padding:1rem; background:var(--boe-token-surface-surface, #fff); border:1px solid var(--boe-token-stroke-stroke, #dedfe4); border-radius:0.75rem; min-width:0 }
  [part=header] { display:flex; justify-content:space-between; align-items:start; gap:0.75rem; flex-wrap:wrap; margin-bottom:0.8rem }
  h2 { margin:0; font:inherit; font-weight:700; font-size:1.05rem }
  [part=description], [part=note] { color:var(--boe-token-text-text-secondary, #626b7d); font-size:0.82rem; line-height:1.4 }
  [part=note] { margin:0.3rem 0 0 }
  button[part=table-toggle] { font:inherit; color:inherit; background:none; border:0; border-radius:0.25rem; cursor:pointer; padding:0.2rem 0.35rem; text-decoration:underline; text-underline-offset:0.2em }
  button:focus-visible { outline:2px solid var(--boe-token-surface-surface-brand, #0061d5); outline-offset:3px }
  [part=plot] { display:grid; gap:0.25rem; min-width:0 }
  [part=axis], [part=row] { display:grid; grid-template-columns:minmax(7rem, 11rem) minmax(0,1fr); gap:0.7rem; align-items:center; min-width:0 }
  [part=axis] { margin-bottom:0.2rem }
  [part=ticks] { position:relative; height:1.8rem; color:var(--boe-token-text-text-secondary, #626b7d); font-size:0.72rem }
  [part=tick] { position:absolute; top:0; transform:translateX(-50%); white-space:nowrap }
  [part=tick]:first-child { transform:none } [part=tick]:last-child { transform:translateX(-100%) }
  [part=label] { min-width:0; overflow-wrap:anywhere; font-size:0.82rem; font-weight:600 }
  [part=row] { border-radius:0.3rem; padding:0.1rem 0 }
  [part=row]:hover, [part=row]:focus-within { background:var(--boe-token-surface-surface-secondary, #f5f7fb) }
  [part=mark] { position:relative; appearance:none; display:block; width:100%; height:2.4rem; padding:0; border:0; background:none; cursor:help; color:inherit }
  [part=mark]:focus-visible { outline:2px solid var(--boe-token-surface-surface-brand, #0061d5); outline-offset:2px }
  [part=gridline] { position:absolute; top:0; bottom:0; border-left:1px solid var(--boe-boxplot-grid, var(--boe-token-stroke-stroke, #dedfe4)); pointer-events:none }
  [part=whisker] { position:absolute; top:50%; height:0; border-top:2px solid var(--boe-boxplot-whisker, #68748b); pointer-events:none }
  [part=cap], [part=median], [part=reference] { position:absolute; top:25%; height:50%; width:2px; transform:translateX(-50%); background:var(--boe-boxplot-whisker, #68748b); pointer-events:none }
  [part=box] { position:absolute; top:25%; height:50%; box-sizing:border-box; border:2px solid var(--boe-boxplot-edge, #0054bd); border-radius:0.2rem; background:var(--boe-boxplot-fill, #cde2ff); pointer-events:none }
  [part=median] { top:20%; height:60%; width:3px; background:var(--boe-boxplot-median, #092e68) }
  [part=reference] { top:8%; height:84%; border-left:2px dashed var(--boe-boxplot-reference, #b54a1b); background:none }
  [part=dot] { position:absolute; width:0.32rem; height:0.32rem; border-radius:50%; transform:translate(-50%,-50%); background:var(--boe-boxplot-dot, #354668); pointer-events:none }
  [part=detail] { display:none; position:absolute; z-index:3; left:50%; bottom:100%; transform:translateX(-50%); box-sizing:border-box; width:max-content; max-width:min(14rem, 85vw); max-width:min(14rem, calc(100cqi - 2rem)); padding:0.55rem 0.7rem; border-radius:0.35rem; background:var(--boe-token-surface-surface, #fff); border:1px solid var(--boe-token-stroke-stroke, #dedfe4); box-shadow:0 4px 16px #0002; text-align:left; font-size:0.75rem; line-height:1.5; white-space:normal; overflow-wrap:anywhere; pointer-events:none }
  [part=mark]:is(:hover,:focus-visible) [part=detail] { display:block }
  [part=table-wrap] { overflow:auto; max-width:100% } table { border-collapse:collapse; width:100%; font-size:0.8rem } th,td { padding:0.4rem 0.5rem; text-align:left; border-bottom:1px solid var(--boe-token-stroke-stroke, #dedfe4) } th { white-space:nowrap } caption { text-align:left; font-weight:700; padding:0.3rem 0 }
  [part=table-wrap]:focus-visible { outline:2px solid var(--boe-token-surface-surface-brand, #0061d5); outline-offset:-2px }
  [part=empty] { padding:1.2rem; color:var(--boe-token-text-text-secondary, #626b7d) }
  [data-orientation=vertical] [part=plot] { position:relative; box-sizing:border-box; grid-template-columns:repeat(var(--row-count), minmax(0,1fr)); gap:0.4rem; padding-left:3.5rem; max-width:42rem; margin-inline:auto }
  [data-orientation=vertical] [part=axis] { display:block; position:absolute; top:0; left:0; width:3rem; height:12rem; margin:0 }
  [data-orientation=vertical] [part=ticks] { height:100% }
  [data-orientation=vertical] [part=tick], [data-orientation=vertical] [part=tick]:first-child, [data-orientation=vertical] [part=tick]:last-child { left:0 !important; top:auto; bottom:var(--pos); transform:translateY(50%) }
  [data-orientation=vertical] [part=row] { display:flex; flex-direction:column-reverse; gap:0.3rem; align-items:stretch; min-width:0 }
  [data-orientation=vertical] [part=label] { text-align:center }
  [data-orientation=vertical] [part=mark] { height:12rem; width:min(100%, 5.5rem); margin:auto }
  [data-orientation=vertical] [part=gridline] { top:auto; left:0; right:0; bottom:var(--pos); border-left:0; border-bottom:1px solid var(--boe-boxplot-grid, var(--boe-token-stroke-stroke, #dedfe4)) }
  [data-orientation=vertical] [part=whisker] { left:50% !important; width:0 !important; border-top:0; border-left:2px solid var(--boe-boxplot-whisker, #68748b); bottom:var(--start); height:var(--size); top:auto }
  [data-orientation=vertical] [part=box] { left:33% !important; width:34% !important; bottom:var(--start); height:var(--size); top:auto }
  [data-orientation=vertical] [part=cap], [data-orientation=vertical] [part=median], [data-orientation=vertical] [part=reference] { left:27% !important; width:46%; height:2px; top:auto; bottom:var(--pos); transform:translateY(50%) }
  [data-orientation=vertical] [part=median] { left:23% !important; width:54%; height:3px }
  [data-orientation=vertical] [part=reference] { left:16% !important; width:68%; height:0; border-left:0; border-top:2px dashed var(--boe-boxplot-reference, #b54a1b) }
  [data-orientation=vertical] [part=dot] { left:var(--jitter) !important; bottom:var(--pos); top:auto; transform:translate(-50%,50%) }
  [data-orientation=vertical] [part=detail] { left:50%; bottom:100% }
  [data-orientation=vertical] [part=row]:nth-child(2) [part=detail] { left:0; transform:none }
  [data-orientation=vertical] [part=row]:last-child [part=detail] { left:auto; right:0; transform:none }
  [data-orientation=vertical] [part=row]:nth-child(2):last-child [part=detail] { left:50%; right:auto; transform:translateX(-50%) }
  @container (max-width:600px) { [part=panel] { padding:0.75rem } [part=axis], [part=row] { display:block } [part=axis] { padding-top:0.2rem } [part=label] { display:block; margin-bottom:0.1rem } [part=mark] { height:2.6rem } [data-orientation=vertical] [part=plot] { grid-template-columns:repeat(auto-fit, minmax(4.5rem,1fr)) } [data-orientation=vertical] [part=axis] { padding:0 } }
  @media (prefers-reduced-motion:reduce) { *, *::before, *::after { transition:none !important; animation:none !important } }
`;

/** Distribution chart for host-computed summary statistics. Invalid rows are omitted. */
export class BoxPlot extends BaseElement {
  static readonly tagName = "box-box-plot";
  static get observedAttributes(): string[] { return ["heading", "description", "rows", "orientation", "scale", "whiskers", "unit"]; }
  private _rows: BoxPlotRow[] | null = null;
  private _formatter: ((value: number) => string) | null = null;
  private tableVisible = false;
  get heading(): string { return this.getAttribute("heading")?.trim() || "Distribution"; }
  set heading(value: string) { this.setAttribute("heading", value); }
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
    const focusedId = this.shadowRoot?.activeElement?.getAttribute("data-row-id");
    const rows = this.rows.filter(row => validBoxPlotRow(row, this.scale));
    const domain = boxPlotDomain(rows, this.scale);
    const span = domain.max - domain.min;
    const digits = span < 1 ? Math.min(12, Math.max(2, 1 - Math.floor(Math.log10(span)))) : 2;
    const defaultFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: digits });
    const formatValue = this._formatter ?? ((value: number) => `${defaultFormatter.format(value)}${this.unit ? ` ${this.unit}` : ""}`);
    const fmt = (value: number) => escapeHtml(String(formatValue(value)));
    const position = (value: number) => round(boxPlotPosition(value, domain, this.scale));
    const range = (start: number, end: number): string => `--start:${position(start)}%;--size:${round(position(end) - position(start))}%`;
    const heading = escapeHtml(this.heading);
    const ticks = domain.ticks.map(value => `<span part="tick" style="left:${position(value)}%;--pos:${position(value)}%">${fmt(value)}</span>`).join("");
    const grid = domain.ticks.map(value => `<span part="gridline" style="left:${position(value)}%;--pos:${position(value)}%"></span>`).join("");
    const marks = rows.map(row => {
      const [low, high] = boxPlotWhiskerValues(row, this.whiskers);
      const summary = `${row.label}: median ${formatValue(row.median)}, middle half ${formatValue(row.q1)} to ${formatValue(row.q3)}, ${whiskerLabel(row, this.whiskers)} ${formatValue(low)} to ${formatValue(high)}, minimum ${formatValue(row.min)}, maximum ${formatValue(row.max)}${row.count === undefined ? "" : `, ${new Intl.NumberFormat().format(row.count)} calls`}${row.mean === undefined ? "" : `, mean ${formatValue(row.mean)}`}${row.reference === undefined ? "" : `, reference ${formatValue(row.reference)}`}`;
      const dots = (row.samples?.length ?? 0) <= 30 ? (row.samples ?? []).map((value, index) => `<span part="dot" style="left:${position(value)}%;top:${38 + (index % 5) * 6}%;--pos:${position(value)}%;--jitter:${35 + (index % 5) * 7}%"></span>`).join("") : "";
      const caps = [low, high].map(value => `<span part="cap" style="left:${position(value)}%;--pos:${position(value)}%"></span>`).join("");
      return `<div part="row"><span part="label">${escapeHtml(row.label)}</span><div tabindex="0" role="img" part="mark" data-row-id="${escapeHtml(row.id)}" aria-label="${escapeHtml(summary)}">${grid}<span part="whisker" style="left:${position(low)}%;width:${round(position(high) - position(low))}%;${range(low, high)}"></span>${caps}<span part="box" style="left:${position(row.q1)}%;width:${round(position(row.q3) - position(row.q1))}%;${range(row.q1, row.q3)}"></span><span part="median" style="left:${position(row.median)}%;--pos:${position(row.median)}%"></span>${row.reference === undefined ? "" : `<span part="reference" style="left:${position(row.reference)}%;--pos:${position(row.reference)}%"></span>`}${dots}<span part="detail" aria-hidden="true">${escapeHtml(summary)}</span></div></div>`;
    }).join("");
    const tableRows = rows.map(row => `<tr><th scope="row">${escapeHtml(row.label)}</th>${[row.min, row.p5, row.q1, row.median, row.q3, row.p95, row.p99, row.max, row.mean, row.reference].map(value => `<td>${value === undefined ? "—" : fmt(value)}</td>`).join("")}<td>${row.count === undefined ? "—" : new Intl.NumberFormat().format(row.count)}</td></tr>`).join("");
    host.innerHTML = `<section part="panel" data-orientation="${this.orientation}" aria-label="${heading}" style="--row-count:${Math.max(1, rows.length)}"><header part="header"><div><h2>${heading}</h2>${this.description ? `<div part="description">${escapeHtml(this.description)}</div>` : ""}<p part="note">Box: middle 50%; line: median; whiskers: ${this.whiskers === "min-max" ? "minimum–maximum" : this.whiskers === "p5-p95" ? "5th–95th percentile" : "5th–99th percentile"}${this.whiskers === "min-max" ? "" : " (missing percentiles use minimum–maximum)"}. ${this.scale === "log" ? "Logarithmic scale." : "Linear scale."}</p></div><button part="table-toggle" type="button" aria-expanded="${this.tableVisible}" aria-controls="${this.tableVisible ? "boxplot-table" : "boxplot-chart"}">${this.tableVisible ? "Show chart" : "Show as a table"}</button></header>${this.tableVisible ? `<div part="table-wrap" id="boxplot-table" role="region" aria-label="${heading} data table" tabindex="0"><table><caption>${heading}</caption><thead><tr>${["Row", "Min", "5%", "25%", "Median", "75%", "95%", "99%", "Max", "Mean", "Reference", "Count"].map(label => `<th scope="col">${label}</th>`).join("")}</tr></thead><tbody>${tableRows}</tbody></table></div>` : rows.length ? `<div part="plot" id="boxplot-chart" role="group" aria-label="${heading}"><div part="axis" aria-hidden="true"><span></span><div part="ticks">${ticks}</div></div>${marks}</div>` : `<div part="empty" id="boxplot-chart">No valid distribution rows to display.</div>`}</section>`;
    host.querySelector('[part="table-toggle"]')?.addEventListener("click", () => { this.tableVisible = !this.tableVisible; this.update(); this.shadowRoot?.querySelector<HTMLButtonElement>('[part="table-toggle"]')?.focus(); });
    if (focusedId) this.shadowRoot?.querySelectorAll<HTMLElement>('[part="mark"]').forEach(mark => { if (mark.dataset.rowId === focusedId) mark.focus(); });
  }
}

BoxPlot.register();
