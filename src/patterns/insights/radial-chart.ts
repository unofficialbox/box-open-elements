import { restoreChartFocus } from "./chart-focus.js";
import { ChartElement, chartAnimationAttributes } from "./chart-element.js";
import { analyticStyles, quantitativeColors, chartDataJson, categoryColor, chartJson, chartArrayAttributeValid, escapeChartText as escape, formatAnalyticValue } from "./analytic-shared.js";
import { numericScale } from "./cartesian-model.js";
import { syncKeyedChildren, actionButton } from "../internal/keyed-children.js";

export interface RadarAxis { id: string; label: string; }
export interface RadarSeries { id: string; label: string; values: { axis: string; value: number | null }[]; tone?: string; }
export interface PolarSegment { id: string; label: string; value: number; tone?: string; }
const styles = analyticStyles + `
[part=radial-layout]{display:grid;grid-template-columns:minmax(0,1fr) minmax(12rem,1fr);align-items:start;gap:1.5rem}
[part=visual]{min-inline-size:0;max-inline-size:25rem;inline-size:100%;margin-inline:auto}
svg{display:block;inline-size:100%;block-size:auto;overflow:visible}
[part=grid-line]{fill:none;stroke:var(--boe-token-stroke-stroke,#e8e8e8);stroke-width:1;vector-effect:non-scaling-stroke}
[part=radar-line]{fill:var(--series-color);fill-opacity:.08;stroke:var(--series-color);stroke-width:2;vector-effect:non-scaling-stroke}
[part=sector]{fill:var(--series-color);stroke:var(--boe-token-surface-surface,#fff);stroke-width:2;vector-effect:non-scaling-stroke}
[part=selection]{fill:none;stroke:var(--boe-token-text-text,#102347);stroke-width:2;vector-effect:non-scaling-stroke}
[part=axis-label]{font-size:10px;fill:var(--boe-token-text-text-secondary,#566781)}
[part=legend]{display:grid;gap:.25rem}[part=legend-item]{appearance:none;display:flex;justify-content:space-between;align-items:center;gap:.5rem;border:1px solid transparent;border-radius:.25rem;min-block-size:2.75rem;padding:.5rem;color:inherit;background:transparent;cursor:pointer;text-align:start}
[part=legend-item][aria-pressed=true]{border-color:var(--boe-token-text-text,#102347)}
[part=legend-label]{flex:1}[part=note]{font-size:.75rem;line-height:1.5}
@media(max-width:600px){[part=radial-layout]{grid-template-columns:minmax(0,1fr)}}
`;
const polar = (angle: number, radius: number) => ({ x: 160 + radius * Math.sin(angle), y: 160 - radius * Math.cos(angle) });
/** Full circle and zero are separate geometries; no misleading near-full-circle arc. */
export function sectorPath(start: number, end: number, radius: number): string {
  if (radius <= 0) return "";
  if (end - start >= Math.PI * 2 - 1e-9) return `M 160 ${160 - radius} A ${radius} ${radius} 0 1 1 160 ${160 + radius} A ${radius} ${radius} 0 1 1 160 ${160 - radius} Z`;
  const a = polar(start, radius), b = polar(end, radius);
  return `M 160 160 L ${a.x} ${a.y} A ${radius} ${radius} 0 ${end - start > Math.PI ? 1 : 0} 1 ${b.x} ${b.y} Z`;
}

export abstract class RadialChart extends ChartElement {
  protected abstract readonly family: "radar" | "polar";
  static get observedAttributes(): string[] { return [...chartAnimationAttributes, "heading", "description", "axes", "series", "segments", "maximum", "unit", "state", "status-message", "selected-id", "series-tokens"]; }
  private tableVisible = false;
  private inspectedId: string | null = null;
  get heading(): string { return this.getAttribute("heading") ?? "Category comparison"; }
  set heading(v: string) { this.setAttribute("heading", v); }
  get description(): string { return this.getAttribute("description") ?? ""; }
  set description(v: string) { this.setAttribute("description", v); }
  get axes(): RadarAxis[] { return chartJson(this, "axes", []); }
  set axes(v: RadarAxis[]) { this.setAttribute("axes", chartDataJson(v)); }
  get series(): RadarSeries[] { return chartJson(this, "series", []); }
  set series(v: RadarSeries[]) { this.setAttribute("series", chartDataJson(v)); }
  get segments(): PolarSegment[] { return chartJson(this, "segments", []); }
  set segments(v: PolarSegment[]) { this.setAttribute("segments", chartDataJson(v)); }
  get maximum(): number | null { const v = this.getAttribute("maximum"); return v === null ? null : Number(v); }
  set maximum(v: number | null) { v === null ? this.removeAttribute("maximum") : this.setAttribute("maximum", String(v)); }
  get unit(): string { return this.getAttribute("unit") ?? ""; }
  set unit(v: string) { this.setAttribute("unit", v); }
  get state(): string { return this.getAttribute("state") ?? "ready"; }
  set state(v: string) { this.setAttribute("state", v); }
  get statusMessage(): string { return this.getAttribute("status-message") ?? ""; }
  set statusMessage(v: string) { this.setAttribute("status-message", v); }
  get selectedId(): string | null { return this.getAttribute("selected-id"); }
  set selectedId(v: string | null) { v === null ? this.removeAttribute("selected-id") : this.setAttribute("selected-id", v); }
  get seriesTokens(): Record<string, string> { return chartJson(this, "series-tokens", {}); }
  set seriesTokens(v: Record<string, string>) { this.setAttribute("series-tokens", chartDataJson(v)); }
  connectedCallback(): void { this.upgradeProperties(["heading", "description", "axes", "series", "segments", "maximum", "unit", "state", "statusMessage", "selectedId", "seriesTokens"]); super.connectedCallback(); }
  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>${styles}</style><article part="panel"><h2 part="heading"></h2><p part="scope"></p><p part="status" role="status" aria-live="polite"></p><div part="radial-layout"><div part="visual"><svg viewBox="0 0 320 320" role="img"><g part="grid"></g><g part="marks"></g></svg></div><div part="legend"></div></div><p part="inspection" role="status" aria-live="polite"></p><p part="note"></p><button part="table-toggle" type="button" aria-controls="radial-data" aria-expanded="false">Show data table</button><div part="table-wrap" id="radial-data" tabindex="0" role="region" hidden></div><slot name="footer"></slot></article>`;
  }
  protected setupListeners(): void {
    const root = this.shadowRoot!;
    root.querySelector('button[part="table-toggle"]')!.addEventListener("click", () => { this.tableVisible = !this.tableVisible; this.update(); });
    root.addEventListener("focusin", event => { const id = (event.target as HTMLElement).dataset.id; if (id) { this.inspectedId = id; this.inspect(); } });
    root.addEventListener("click", event => {
      const id = (event.target as HTMLElement).closest<HTMLElement>("[data-id]")?.dataset.id;
      if (!id) return;
      this.inspectedId = id; this.inspect();
      this.dispatchEvent(new CustomEvent("item-selected", { bubbles: true, composed: true, detail: { selectedId: id === this.selectedId ? null : id } }));
    });
  }
  private inspect(): void {
    const item = this.family === "radar" ? this.series.find(s => s.id === this.inspectedId) : this.segments.find(s => s.id === this.inspectedId);
    this.shadowRoot!.querySelector('[part="inspection"]')!.textContent = item ? this.family === "radar" ? `${item.label}: ${(item as RadarSeries).values.map(v => `${this.axes.find(a => a.id === v.axis)?.label}: ${v.value === null ? "Not observed" : formatAnalyticValue(v.value)}`).join("; ")}${item.id === this.selectedId ? " · Selected" : ""}.` : `${item.label}: ${formatAnalyticValue((item as PolarSegment).value)} ${this.unit}${item.id === this.selectedId ? " · Selected" : ""}.` : "Inspect a category using the legend. Selection does not change the scale.";
  }
  protected renderChart(): void {
    if (!this.isRendered) return;
    const focused = this.shadowRoot!.activeElement as HTMLElement | null;
    const root = this.shadowRoot!, axes = this.axes, series = this.series, segments = this.segments;
    const unique = (data: { id: string; label: string }[]) => Array.isArray(data) && new Set(data.map(x => x?.id)).size === data.length && data.every(x => x && typeof x.id === "string" && x.id && typeof x.label === "string" && !!x.label.trim());
    const valid = this.family === "radar" ? chartArrayAttributeValid(this, "axes") && chartArrayAttributeValid(this, "series") && unique(axes) && axes.length >= 3 && axes.length <= 16 && unique(series) && series.length <= 12 && series.every(s => Array.isArray(s.values) && s.values.length === axes.length && new Set(s.values.map(v => v?.axis)).size === axes.length && s.values.every(v => v && axes.some(a => a.id === v.axis) && (v.value === null || Number.isFinite(v.value) && v.value >= 0))) : chartArrayAttributeValid(this, "segments") && unique(segments) && segments.length <= 24 && segments.every(s => Number.isFinite(s.value) && s.value >= 0);
    const values = valid ? this.family === "radar" ? series.flatMap(s => s.values.flatMap(v => v.value === null ? [] : [v.value])) : segments.map(s => s.value) : [];
    const maximum = this.maximum ?? numericScale(values).ticks.at(-1)!;
    const error = !valid ? "Cannot plot invalid categories. Radar needs 3–16 comparable axes; polar area supports up to 24 nonnegative categories." : !Number.isFinite(maximum) || maximum <= 0 || values.some(v => v > maximum) ? "Maximum must be positive and include every observation." : "";
    const unavailable = this.state === "loading" || this.state === "error";
    root.querySelector('[part="heading"]')!.textContent = this.heading;
    root.querySelector('[part="scope"]')!.textContent = this.description;
    root.querySelector('[part="status"]')!.textContent = this.statusMessage || (this.state === "loading" ? "Loading observations…" : this.state === "error" ? "Observations could not be loaded." : error || !values.length ? error || "No measured observations." : this.state === "partial" ? "Partial observations; incomplete radar polygons are not filled." : this.state === "stale" ? "Cached observations. Check the host timestamp." : "");
    const show = !error && !unavailable && values.length > 0;
    for (const part of ["radial-layout", "inspection", "note", "table-toggle"]) root.querySelector<HTMLElement>(`[part="${part}"]`)!.hidden = !show;
    const table = root.querySelector<HTMLElement>('[part="table-wrap"]')!;
    table.hidden = !show || !this.tableVisible; table.setAttribute("aria-label", `${this.heading} exact observations`);
    root.querySelector('[part="grid"]')!.replaceChildren(); root.querySelector('[part="marks"]')!.replaceChildren();
    if (!show) { table.replaceChildren(); this.inspectedId = null; restoreChartFocus(this, focused); return; }
    root.querySelector("svg")!.setAttribute("aria-label", `${this.heading}. ${this.family === "radar" ? "Common radial scale" : "Equal-angle sectors; area encodes value"} 0 to ${formatAnalyticValue(maximum)} ${this.unit}. Exact values follow.`);
    root.querySelector('[part="grid"]')!.innerHTML = [1, 2, 3, 4].map(i => {const radius=this.family==="polar"?Math.sqrt(i/4)*100:i*25;return `<circle part="grid-line" cx="160" cy="160" r="${radius}"/>${this.family==="radar"||i===4?`<text part="axis-label" x="164" y="${157-radius}">${escape(formatAnalyticValue(maximum*i/4))}</text>`:""}`;}).join("");
    const items: (RadarSeries | PolarSegment)[] = this.family === "radar" ? series : segments;
    const color = (item: RadarSeries | PolarSegment, i: number) => categoryColor(item.id, i, this.seriesTokens, item.tone, quantitativeColors);
    syncKeyedChildren(root.querySelector('[part="legend"]')!, items, x => x.id, () => actionButton("legend-item"), (button, item) => {
      button.dataset.id = item.id; button.setAttribute("aria-pressed", String(this.selectedId === item.id));
      button.innerHTML = `<span part="swatch" style="--series-color:${color(item, items.indexOf(item))}"></span><span part="legend-label">${escape(item.label)}</span>${this.family === "polar" ? `<span>${escape(formatAnalyticValue((item as PolarSegment).value))} ${escape(this.unit)}</span>` : ""}`;
    });
    const marks: string[] = [];
    if (this.family === "polar") segments.forEach((item, i) => {
      const path = sectorPath(i / segments.length * Math.PI * 2, (i + 1) / segments.length * Math.PI * 2, Math.sqrt(item.value / maximum) * 100);
      marks.push(`<path part="sector" d="${path}" data-id="${escape(item.id)}" style="--series-color:${color(item, i)}"/>`);
      if (this.selectedId === item.id) marks.push(`<path part="selection" d="${path}"/>`);
    });
    else {
      axes.forEach((axis, i) => {
        const angle = i / axes.length * Math.PI * 2, end = polar(angle, 100), label = polar(angle, 130);
        marks.push(`<line part="grid-line" x1="160" y1="160" x2="${end.x}" y2="${end.y}"/><text part="axis-label" x="${label.x}" y="${label.y}" text-anchor="middle">${escape(axis.label.length > 18 ? axis.label.slice(0, 16) + "…" : axis.label)}<title>${escape(axis.label)}</title></text>`);
      });
      series.forEach((item, i) => {
        const points = axes.map((axis, j) => { const value = item.values.find(v => v.axis === axis.id)!.value; return value === null ? null : polar(j / axes.length * Math.PI * 2, value / maximum * 100); });
        const complete = points.every(p => p !== null);
        let path = "", gap = true;
        for (const p of [...points, points[0]]) {
          if (!p) { gap = true; continue; }
          path += `${gap ? "M" : "L"} ${p.x} ${p.y} `; gap = false;
        }
        if (complete) path += "Z";
        marks.push(`<path part="radar-line" data-animation-series-id="${escape(item.id)}" d="${path}" style="--series-color:${color(item, i)};${!complete ? "fill:none;" : ""}${item.id===this.selectedId?"stroke-width:3;":""}" stroke-dasharray="${["none", "6 3", "2 3"][i % 3]}"/>`);
      });
    }
    root.querySelector('[part="marks"]')!.innerHTML = marks.join("");
    root.querySelector('[part="note"]')!.textContent = this.family === "radar" ? `Common scale: 0–${formatAnalyticValue(maximum)} ${this.unit}. Axis order is host supplied; values must have comparable units. Full axis names and missing values are in the table.` : `Equal angles; sector area represents value, using a square-root radial scale. Outer circle: ${formatAnalyticValue(maximum)} ${this.unit}. This is a magnitude comparison, not a share-of-total chart.`;
    const toggle = root.querySelector<HTMLButtonElement>('[part="table-toggle"]')!; toggle.textContent = this.tableVisible ? "Hide data table" : "Show data table"; toggle.setAttribute("aria-expanded", String(this.tableVisible));
    if (this.tableVisible) table.innerHTML = `<table><caption>${escape(this.heading)} — exact observations (${escape(this.unit)})</caption><thead><tr><th scope="col">${this.family === "radar" ? "Series / axis" : "Category"}</th><th scope="col">Value</th></tr></thead><tbody>${this.family === "polar" ? segments.map(s => `<tr><th scope="row">${escape(s.label)}</th><td>${escape(formatAnalyticValue(s.value))}</td></tr>`).join("") : series.flatMap(s => axes.map(a => { const value = s.values.find(v => v.axis === a.id)!.value; return `<tr><th scope="row">${escape(s.label)} / ${escape(a.label)}</th><td>${value === null ? "Not observed" : escape(formatAnalyticValue(value))}</td></tr>`; })).join("")}</tbody></table>`;
    else table.replaceChildren();
    if(this.selectedId&&!items.some(item=>item.id===this.selectedId))root.querySelector('[part="note"]')!.textContent+=" Selected item is absent from this snapshot.";
    this.inspect(); restoreChartFocus(this, focused);
  }
}
