import { formatChartValue } from "./chart-scale.js";
import { restoreChartFocus } from "./chart-focus.js";
import { calendarScale, formatCalendar, formatCalendarTick } from "./calendar-scale.js";
import { ChartElement, chartAnimationAttributes } from "./chart-element.js";
import { syncKeyedChildren, actionButton } from "../internal/keyed-children.js";
import { analyticStyles, quantitativeColors, chartDataJson, categoryColor, chartJson, chartArrayAttributeValid, escapeChartText as escape, formatAnalyticValue } from "./analytic-shared.js";
import { groupedBars, numericScale, linePath, renderingPoints, bubbleRadius, validateCartesian, type CartesianPoint, type CartesianSeries, type CartesianAxis, type ChartInterpolation, type ChartScale } from "./cartesian-model.js";
export type { CartesianPoint, CartesianSeries, CartesianAxis, ChartInterpolation } from "./cartesian-model.js";
type Family = "grouped-bar" | "scatter" | "bubble" | "area" | "mixed";
type Observation = { series: CartesianSeries; point: CartesianPoint };
const PAGE_SIZE = 50;
const styles = analyticStyles + `
[part=panel]{gap:.625rem}
[part=axis-names]{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.5rem;font-size:.8125rem;color:var(--boe-token-text-text-secondary,#566781)}
[part=chart]{display:grid;grid-template-columns:3.5rem minmax(0,1fr) 3.5rem;grid-template-rows:minmax(16rem,auto) auto;column-gap:.5rem;margin-block:.75rem;min-inline-size:0}
[part=plot]{grid-column:2;grid-row:1;position:relative;min-inline-size:0;block-size:16rem;min-block-size:12rem;outline-offset:4px}
svg{inline-size:100%;block-size:100%;overflow:visible;display:block}
[part=y-ticks]{grid-row:1;position:relative;font-size:.6875rem;color:var(--boe-token-text-text-secondary,#566781);font-variant-numeric:tabular-nums}
[part=y-ticks][data-side=left]{grid-column:1}[part=y-ticks][data-side=right]{grid-column:3}
[part=y-ticks] span{position:absolute;inset-block-end:var(--position);transform:translateY(50%);max-inline-size:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
[data-side=left] span{inset-inline-end:0}[data-side=right] span{inset-inline-start:0}
[part=x-ticks]{grid-column:2;grid-row:2;position:relative;min-block-size:2.5rem;margin-block-start:.75rem;font-size:.6875rem;color:var(--boe-token-text-text-secondary,#566781)}
[part=x-ticks] span{position:absolute;inset-inline-start:var(--position);transform:translateX(-50%);inline-size:var(--label-width,5rem);overflow-wrap:anywhere;text-align:center;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
[part=legend-item]{appearance:none;background:transparent;border:1px solid transparent;border-radius:.25rem;min-block-size:2.75rem;padding:.25rem .5rem;color:inherit;cursor:pointer}
[part=legend-item][aria-pressed=true]{border-style:dashed;border-color:var(--boe-token-text-text,#102347)}
[part=grid-line]{stroke:var(--boe-token-stroke-stroke,#e8e8e8);stroke-width:1;vector-effect:non-scaling-stroke}
[part=zero]{stroke:var(--boe-token-text-text-secondary,#566781);stroke-width:1;vector-effect:non-scaling-stroke}
[part=series-path]{fill:none;stroke:var(--series-color);stroke-width:2;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
[part=area]{fill:var(--series-color);fill-opacity:.13;stroke:none}
[part=mark]{fill:var(--series-color);stroke:var(--boe-token-surface-surface,#fff);stroke-width:1;vector-effect:non-scaling-stroke;cursor:pointer}
[part=selection]{fill:none;stroke:var(--boe-token-text-text,#102347);stroke-width:2;vector-effect:non-scaling-stroke;pointer-events:none}
[part=inspection]{min-block-size:2.75rem;padding-block:.5rem;border-block-start:1px solid var(--boe-token-stroke-stroke,#e8e8e8)}
[part=scope]:empty,[part=disclosure]:empty,[part=selection-label]:empty{display:none}
[part=selection-label]{font-size:.8125rem;line-height:1.5}
[part=help],[part=disclosure]{font-size:.75rem;line-height:1.5;color:var(--boe-token-text-text-secondary,#566781);overflow-wrap:anywhere}
[part=size-key]{display:flex;align-items:end;flex-wrap:wrap;gap:1.25rem;font-size:.75rem;color:var(--boe-token-text-text-secondary,#566781)}
[part=size-key] span{display:grid;justify-items:center;gap:.25rem}[part=size-key] i{display:block;border:1px solid currentColor;border-radius:50%;inline-size:var(--diameter);block-size:var(--diameter)}
[part=controls]{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center;font-size:.8125rem}
[part=controls] button{appearance:none;border:1px solid var(--boe-token-stroke-stroke,#e8e8e8);background:var(--boe-token-surface-surface,#fff);color:inherit;padding:.5rem .75rem;min-block-size:2.75rem;border-radius:.25rem;cursor:pointer}
[part=table-wrap]{max-block-size:28rem;overflow:auto}td button{font:inherit;color:var(--boe-token-surface-surface-brand,#0061d5);background:transparent;border:0;text-decoration:underline;min-block-size:2.75rem;cursor:pointer}
@media(max-width:480px){[part=chart]{grid-template-columns:2.75rem minmax(0,1fr) 2.75rem;column-gap:.25rem}[part=panel]{padding:1rem}}
`;

/** Shared semantic shell and lifecycle; family subclasses choose marks, not independent axes. */
export abstract class CartesianChart extends ChartElement {
  protected abstract readonly family: Family;
  static get observedAttributes(): string[] {
    return [...chartAnimationAttributes, "heading", "description", "series", "y-axes", "x-label", "y-label", "unit", "x-scale", "interpolation", "stacked", "state", "status-message", "selected-id", "series-tokens", "size-label", "time-zone"];
  }
  private selectionGeometry = new Map<string, string>();
  private observer: ResizeObserver | null = null;
  private plotWidth = 640;
  private plotHeight = 256;
  private page = 0;
  private tableVisible = false;
  private inspectedId: string | null = null;
  private activeSeries: string | null = null;
  private snapshot: CartesianSeries[] = [];
  private rows: Observation[] = [];
  private navigation = new Map<string, CartesianPoint[]>();
  private navigationIndex = new Map<string, number>();
  private rowById = new Map<string, Observation>();
  private projectors = new Map<string, (point: CartesianPoint) => {x: number; y: number | null}>();
  private positions = new Map<string, { x: number; y: number }>();
  private xFormatter: ((value: number) => string) | null = null;
  private yFormatter: ((value: number) => string) | null = null;
  get heading(): string { return this.getAttribute("heading") ?? "Observations"; }
  set heading(v: string) { this.setAttribute("heading", v); }
  get description(): string { return this.getAttribute("description") ?? ""; }
  set description(v: string) { this.setAttribute("description", v); }
  get series(): CartesianSeries[] { return chartJson(this, "series", []); }
  set series(v: CartesianSeries[]) { this.setAttribute("series", chartDataJson(v)); }
  get yAxes(): CartesianAxis[] { return chartJson(this, "y-axes", [{ id: "primary", label: this.yLabel || this.unit || "Value" }]); }
  set yAxes(v: CartesianAxis[]) { this.setAttribute("y-axes", chartDataJson(v)); }
  get xLabel(): string { return this.getAttribute("x-label") ?? "X"; }
  set xLabel(v: string) { this.setAttribute("x-label", v); }
  get yLabel(): string { return this.getAttribute("y-label") ?? ""; }
  set yLabel(v: string) { this.setAttribute("y-label", v); }
  get unit(): string { return this.getAttribute("unit") ?? ""; }
  set unit(v: string) { this.setAttribute("unit", v); }
  get xScale(): "linear" | "log" | "time" { return (this.getAttribute("x-scale") ?? "linear") as "linear" | "log" | "time"; }
  set xScale(v: "linear" | "log" | "time") { this.setAttribute("x-scale", v); }
  get timeZone(): string { return this.getAttribute("time-zone") ?? "UTC"; }
  set timeZone(v: string) { this.setAttribute("time-zone", v); }
  get interpolation(): ChartInterpolation { return (this.getAttribute("interpolation") ?? "linear") as ChartInterpolation; }
  set interpolation(v: ChartInterpolation) { this.setAttribute("interpolation", v); }
  get stacked(): boolean { return this.hasAttribute("stacked"); }
  set stacked(v: boolean) { this.toggleAttribute("stacked", v); }
  get state(): string { return this.getAttribute("state") ?? "ready"; }
  set state(v: string) { this.setAttribute("state", v); }
  get statusMessage(): string { return this.getAttribute("status-message") ?? ""; }
  set statusMessage(v: string) { this.setAttribute("status-message", v); }
  get sizeLabel(): string { return this.getAttribute("size-label") ?? "Quantity"; }
  set sizeLabel(v: string) { this.setAttribute("size-label", v); }
  get selectedId(): string | null { return this.getAttribute("selected-id"); }
  set selectedId(v: string | null) { v === null ? this.removeAttribute("selected-id") : this.setAttribute("selected-id", v); }
  get seriesTokens(): Record<string, string> { return chartJson(this, "series-tokens", {}); }
  set seriesTokens(v: Record<string, string>) { this.setAttribute("series-tokens", chartDataJson(v)); }
  get xFormat(): (value: number) => string { return this.xFormatter ?? (this.xScale === "time" ? value => formatCalendar(value, this.timeZone, true) : formatAnalyticValue); }
  set xFormat(v: (value: number) => string) { this.xFormatter = v; this.update(); }
  get yFormat(): (value: number) => string { return this.yFormatter ?? formatAnalyticValue; }
  set yFormat(v: (value: number) => string) { this.yFormatter = v; this.update(); }

  connectedCallback(): void {
    this.upgradeProperties(["heading", "description", "series", "yAxes", "xLabel", "yLabel", "unit", "xScale", "timeZone", "interpolation", "stacked", "state", "statusMessage", "selectedId", "seriesTokens", "sizeLabel", "xFormat", "yFormat"]);
    super.connectedCallback();
    if (typeof ResizeObserver !== "undefined" && !this.observer) {
      this.observer = new ResizeObserver(entries => {
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0 && (Math.abs(width - this.plotWidth) > 1 || Math.abs(height - this.plotHeight) > 1)) {
          this.plotWidth = width; this.plotHeight = height; this.update();
        }
      });
      this.observer.observe(this.shadowRoot!.querySelector('[part="plot"]')!);
    }
  }
  disconnectedCallback(): void { this.observer?.disconnect(); this.observer = null; super.disconnectedCallback(); }
  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>${styles}</style><article part="panel"><h2 part="heading"></h2><p part="scope"></p><p part="status" role="status" aria-live="polite"></p><div part="legend" aria-label="Inspect a series"></div><div part="visual"><div part="axis-names"></div><div part="chart"><div part="y-ticks" data-side="left" aria-hidden="true"></div><div part="plot" tabindex="0" role="group" aria-label="Chart inspection" aria-describedby="chart-help"><svg aria-hidden="true"><defs><clipPath id="plot-clip"><rect/></clipPath></defs><g part="grid"></g><g part="marks" clip-path="url(#plot-clip)"></g><g part="focus-marker" aria-hidden="true" clip-path="url(#plot-clip)"></g><g part="selection-marker" aria-hidden="true" clip-path="url(#plot-clip)"></g></svg></div><div part="y-ticks" data-side="right" aria-hidden="true"></div><div part="x-ticks" aria-hidden="true"></div></div><div part="size-key" role="group" aria-label="Bubble area key" hidden></div></div><details part="help"><summary>Keyboard controls</summary><p id="chart-help">Focus the plot. Left/Right inspect observations; Up/Down change series; Home/End jump; Enter selects; Escape clears. Exact values are available in the table.</p></details><p part="inspection" role="status" aria-live="polite"></p><p part="disclosure"></p><p part="selection-label"></p><div part="controls"><button type="button" data-action="clear">Clear selection</button><button type="button" data-action="table" aria-controls="chart-data" aria-expanded="false">Show data table</button></div><div part="table-wrap" id="chart-data" hidden tabindex="0" role="region"><table><caption></caption><thead></thead><tbody></tbody></table><div part="controls"><button type="button" data-action="previous">Previous</button><span part="page"></span><button type="button" data-action="next">Next</button></div></div><slot name="footer"></slot></article>`;
  }
  protected setupListeners(): void {
    const root = this.shadowRoot!;
    root.addEventListener("click", event => {
      const target = (event.target as Element).closest<HTMLElement>("[data-action],[data-point],[data-series]");
      if (!target) return;
      if (target.dataset.action === "table") { this.tableVisible = !this.tableVisible; this.renderTable(); }
      else if (target.dataset.action === "clear") this.select(null);
      else if (target.dataset.action === "previous" || target.dataset.action === "next") { this.page += target.dataset.action === "next" ? 1 : -1; this.renderTable(); }
      else if (target.dataset.point) { this.inspect(target.dataset.point); this.select(target.dataset.point); }
      else if (target.dataset.series) { this.activeSeries = target.dataset.series; this.inspect(this.navigation.get(this.activeSeries??"")?.[0]?.id ?? null); this.renderLegend(); }
    });
    root.querySelector('[part="plot"]')!.addEventListener("pointermove", event => {
      const id = (event.target as Element).closest<HTMLElement>("[data-point]")?.dataset.point;
      if (id) this.inspect(id);
    });
    root.querySelector('[part="plot"]')!.addEventListener("keydown", event => {
      const e = event as KeyboardEvent;
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "Enter", " ", "Escape"].includes(e.key) || !this.rows.length) return;
      e.preventDefault();
      const s = this.snapshot.find(s => s.id === this.activeSeries) ?? this.snapshot[0];
      const points=this.navigation.get(s.id)??[];
      const index = this.navigationIndex.get(this.inspectedId??"")??0;
      if (e.key === "Escape") { this.select(null); return; }
      if (e.key === "Enter" || e.key === " ") { if(points.length)this.select(this.inspectedId ?? points[0].id); return; }
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        const next = this.snapshot[(this.snapshot.indexOf(s) + (e.key === "ArrowDown" ? 1 : this.snapshot.length - 1)) % this.snapshot.length];
        this.activeSeries = next.id;
        const x = points[index]?.x;
        const nextPoints=this.navigation.get(next.id)??[];
        const point = nextPoints.find(p => p.x === x) ?? nextPoints[0];
        this.inspect(point?.id ?? null); this.renderLegend(); return;
      }
      this.activeSeries = s.id;
      if(!points.length)return;
      const nextIndex = e.key === "Home" ? 0 : e.key === "End" ? points.length - 1 : Math.min(points.length - 1, Math.max(0, index + (e.key === "ArrowRight" ? 1 : -1)));
      this.inspect(points[nextIndex]?.id ?? null);
    });
    root.querySelector('[part="plot"]')!.addEventListener("focus", () => { if (!this.inspectedId) this.inspect(this.rows[0]?.point.id ?? null); });
  }
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "selected-id" && this.isRendered) {
      this.syncSelection(); this.inspect(this.inspectedId); return;
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }
  private syncSelection(): void {
    const root = this.shadowRoot!, row = this.rowById.get(this.selectedId ?? "");
    const projected = row ? this.projectors.get(row.series.id)?.(row.point) : undefined;
    const position = projected && projected.y !== null ? projected : this.positions.get(this.selectedId ?? "");
    root.querySelector('[part="selection-marker"]')!.innerHTML = this.selectionGeometry.get(this.selectedId ?? "") ?? (position ? `<circle part="selection" cx="${position.x}" cy="${position.y}" r="10"/>` : "");
    root.querySelector('[part="selection-label"]')!.textContent = this.selectedId ? row ? `Selected: ${row.series.label} · ${row.point.label ?? this.xFormat(row.point.x)}.` : "Selected observation is absent from this snapshot." : "";
    root.querySelector<HTMLButtonElement>('[data-action="clear"]')!.hidden = this.selectedId === null;
  }
  private select(id: string | null): void {
    const row = this.rowById.get(id ?? "");
    this.dispatchEvent(new CustomEvent("point-selected", { bubbles: true, composed: true, detail: { selectedId: id, point: row?.point ?? null, seriesId: row?.series.id ?? null } }));
  }
  private inspect(id: string | null): void {
    this.inspectedId = id;
    const row = this.rowById.get(id ?? "");
    if (row) {
      this.activeSeries = row.series.id;
      this.shadowRoot!.querySelectorAll<HTMLElement>('[data-series]').forEach(button => button.setAttribute("aria-pressed", String(button.dataset.series === row.series.id)));
    }
    const text = row ? `${row.series.label} · ${row.point.label ?? this.xFormat(row.point.x)}: ${row.point.y === null ? "Not observed" : this.yFormat(row.point.y)}${this.unit ? ` ${this.unit}` : ""}${this.family === "bubble" ? ` · ${this.sizeLabel} ${this.yFormat(row.point.size ?? 0)}` : ""}${id === this.selectedId ? " · Selected" : ""}.` : "Inspect a series or focus the plot to explore exact observations.";
    const node = this.shadowRoot!.querySelector('[part="inspection"]')!;
    if (node.textContent !== text) node.textContent = text;
    const exact = row ? this.projectors.get(row.series.id)?.(row.point) : undefined;
    const p = this.positions.get(id ?? "") ?? (exact && exact.y !== null ? { x: exact.x, y: exact.y } : undefined);
    this.shadowRoot!.querySelector('[part="focus-marker"]')!.innerHTML = p ? `<circle cx="${p.x}" cy="${p.y}" r="7" fill="none" stroke="var(--boe-token-text-text,#102347)" stroke-width="2" stroke-dasharray="2 2" pointer-events="none"/>` : "";
  }
  private renderLegend(): void {
    syncKeyedChildren(this.shadowRoot!.querySelector('[part="legend"]')!, this.snapshot, s => s.id, () => actionButton("legend-item"), (node, s) => {
      node.dataset.series = s.id; node.setAttribute("aria-pressed", String(this.inspectedId !== null && this.activeSeries === s.id));
      node.innerHTML = `<span part="swatch" style="--series-color:${categoryColor(s.id, this.snapshot.indexOf(s), this.seriesTokens, s.tone, quantitativeColors)}"></span><span part="legend-label">${escape(s.label)}</span>`;
    });
  }
  private renderTable(): void {
    const root = this.shadowRoot!;
    const wrap = root.querySelector<HTMLElement>('[part="table-wrap"]')!;
    wrap.hidden = !this.tableVisible || !this.rows.length;
    const toggle = root.querySelector<HTMLButtonElement>('[data-action="table"]')!;
    toggle.setAttribute("aria-expanded", String(!wrap.hidden)); toggle.textContent = wrap.hidden ? "Show data table" : "Hide data table";
    const tbody = root.querySelector("tbody")!;
    if (wrap.hidden) { tbody.replaceChildren(); return; }
    this.page = Math.max(0, Math.min(this.page, Math.ceil(this.rows.length / PAGE_SIZE) - 1));
    root.querySelector("caption")!.textContent = `${this.heading} — exact observations; missing values are not zero.`;
    root.querySelector("thead")!.innerHTML = `<tr><th scope="col">Series</th><th scope="col">${escape(this.xLabel)}</th><th scope="col">Value / axis</th>${this.family === "bubble" ? `<th scope="col">${escape(this.sizeLabel)}</th>` : ""}<th scope="col">Inspect</th></tr>`;
    const axis = this.yAxes;
    syncKeyedChildren(tbody, this.rows.slice(this.page * PAGE_SIZE, (this.page + 1) * PAGE_SIZE), r => r.point.id, () => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<th scope="row"></th><td></td><td></td>${this.family === "bubble" ? "<td></td>" : ""}<td><button type="button">Inspect</button></td>`;
      return tr;
    }, (tr, r) => {
      const cells = tr.children;
      cells[0].textContent = r.series.label;
      cells[1].textContent = this.family==="grouped-bar" ? r.point.label ?? this.xFormat(r.point.x) : `${r.point.label ? r.point.label+" · " : ""}${this.xFormat(r.point.x)}`;
      cells[2].textContent = `${r.point.y === null ? "Not observed" : this.yFormat(r.point.y)} · ${(axis.find(a => a.id === r.series.axis) ?? axis[0]).label}`;
      if (this.family === "bubble") cells[3].textContent = this.yFormat(r.point.size ?? 0);
      const button = tr.querySelector("button")!;
      button.dataset.point = r.point.id;
      button.setAttribute("aria-label", `Inspect ${r.series.label}, ${r.point.label ?? this.xFormat(r.point.x)}, ${r.point.y===null?"not observed":this.yFormat(r.point.y)}, ID ${r.point.id}`);
    });
    root.querySelector('[part="page"]')!.textContent = `${this.page * PAGE_SIZE + 1}–${Math.min((this.page + 1) * PAGE_SIZE, this.rows.length)} of ${this.rows.length}`;
    root.querySelector<HTMLButtonElement>('[data-action="previous"]')!.disabled = this.page === 0;
    root.querySelector<HTMLButtonElement>('[data-action="next"]')!.disabled = (this.page + 1) * PAGE_SIZE >= this.rows.length;
  }
  protected renderChart(): void {
    if (!this.isRendered) return;
    const root = this.shadowRoot!;
    const focused = root.activeElement as HTMLElement | null;
    const series = this.series, axes = this.yAxes;
    const ordered = this.family === "area" || this.family === "mixed";
    let error = !chartArrayAttributeValid(this, "series") || this.hasAttribute("y-axes") && !chartArrayAttributeValid(this, "y-axes") ? "Series and axes must be JSON arrays." : validateCartesian(series, axes, ordered);
    if (!["linear", "log", "time"].includes(this.xScale)) error = "Choose a linear, log or time x scale.";
    if (!["linear", "monotone", "step-before", "step-after", "step-middle"].includes(this.interpolation)) error = "Choose a supported interpolation mode.";
    if (!error && this.family === "grouped-bar" && series.some(s => new Set(s.points.map(p => p.x)).size !== s.points.length)) error = "A bar series may contain only one observation at each category coordinate.";
    if (!error && this.family === "bubble" && series.some(s => s.points.some(p => p.y !== null && p.size === undefined))) error = "Bubble observations require an explicit nonnegative size.";
    if(this.xScale==="time")try{new Intl.DateTimeFormat("en",{timeZone:this.timeZone}).format(0);}catch{error="Choose a valid IANA time zone for calendar axes.";}
    const unavailable = this.state === "loading" || this.state === "error";
    this.snapshot = !error && !unavailable ? series : [];
    this.rows = this.snapshot.flatMap(s => s.points.map(point => ({ series: s, point })));
    this.rowById = new Map(this.rows.map(r => [r.point.id, r]));
    this.navigation.clear();this.navigationIndex.clear();
    for(const s of this.snapshot){const points=ordered?s.points:[...s.points].sort((a,b)=>a.x-b.x||(a.y??0)-(b.y??0)||a.id.localeCompare(b.id));this.navigation.set(s.id,points);points.forEach((p,i)=>this.navigationIndex.set(p.id,i));}
    root.querySelector('[part="heading"]')!.textContent = this.heading;
    const scope = root.querySelector<HTMLElement>('[part="scope"]')!;
    scope.textContent = this.description; scope.hidden = !this.description;
    root.querySelector('[part="table-wrap"]')!.setAttribute("aria-label", `${this.heading} exact observations`);
    let status = this.statusMessage || (this.state === "loading" ? "Loading observations…" : this.state === "error" ? "Observations could not be loaded." : error || !this.rows.length ? error || "No observations." : this.state === "partial" ? "Partial observations; missing values are not zero." : this.state === "stale" ? "Cached observations. Check the host timestamp before acting." : "");
    if(error&&!unavailable)status=error;
    root.querySelector('[part="status"]')!.textContent = status;
    root.querySelector('[part="visual"]')!.setAttribute("aria-busy", String(this.state === "loading"));
    for (const part of ["legend", "visual", "help", "inspection", "controls", "disclosure"]) root.querySelector<HTMLElement>(`[part="${part}"]`)!.hidden = unavailable || !!error || !this.rows.length;
    root.querySelector('[part="marks"]')!.replaceChildren();
    this.positions.clear(); this.projectors.clear(); this.selectionGeometry.clear(); root.querySelector('[part="selection-marker"]')!.replaceChildren(); root.querySelector('[part="selection-label"]')!.textContent = ""; root.querySelector('[part="focus-marker"]')!.replaceChildren();
    if (error || unavailable || !this.rows.length) {
      this.inspectedId = null; this.renderLegend(); this.renderTable(); this.inspect(null); restoreChartFocus(this, focused); return;
    }
    if (!this.snapshot.some(s => s.id === this.activeSeries)) this.activeSeries = this.snapshot[0]?.id ?? null;
    if (!this.rowById.has(this.inspectedId ?? "")) this.inspectedId = null;
    this.renderLegend(); this.renderTable(); this.inspect(this.inspectedId ?? this.selectedId);
    if (!this.rows.some(r => r.point.y !== null)) {
      root.querySelector('[part="status"]')!.textContent = this.statusMessage || "No measured observations. Missing values remain available in the table.";
      root.querySelector<HTMLElement>('[part="visual"]')!.hidden = true;
      restoreChartFocus(this, focused); return;
    }
    root.querySelector<HTMLButtonElement>('[data-action="clear"]')!.hidden = this.selectedId === null;
    try {
      this.draw(series.map(s => ({ ...s, axis: s.axis ?? axes[0].id })), axes);
    } catch (e) {
      status = e instanceof Error ? e.message : "Cannot plot these observations.";
      root.querySelector('[part="status"]')!.textContent = status;
      root.querySelector<HTMLElement>('[part="visual"]')!.hidden = true;
      root.querySelector('[part="marks"]')!.replaceChildren();
      // Valid source values remain available even if their chosen scale is invalid.
    }
    restoreChartFocus(this, focused);
  }
  private draw(series: CartesianSeries[], axes: CartesianAxis[]): void {
    const root = this.shadowRoot!, width = this.plotWidth, height = this.plotHeight;
    root.querySelector('[part="plot"]')!.setAttribute("aria-label", `${this.heading} interactive plot. Arrow keys inspect exact observations.`);
    const all = this.rows.map(r => r.point);
    const barSeries = series.filter(s => this.family === "grouped-bar" || this.family === "mixed" && s.kind === "bar");
    const areaSeries = series.filter(s => this.family === "area" || this.family === "mixed" && s.kind === "area");
    const bars = groupedBars(barSeries, this.stacked);
    const areas = this.stacked ? groupedBars(areaSeries, true) : [];
    if (this.stacked && areaSeries.length > 1) {
      const grid = areaSeries[0].points.map(p => p.x).join(",");
      if (areaSeries.some(s => s.points.map(p => p.x).join(",") !== grid)) throw new Error("Stacked areas require aligned x coordinates; supply null for missing observations.");
    }
    const baselineSeries=[...barSeries,...areaSeries];
    if (baselineSeries.some(s=>{const a=axes.find(a=>a.id===s.axis)!;return a.scale==="log"||a.domain&&(a.domain[0]>0||a.domain[1]<0);})) throw new Error("Bars and filled areas require a linear domain containing zero.");
    if (barSeries.length && (this.xScale === "log" || axes.some(a => a.scale === "log"))) throw new Error("Bars require a linear zero baseline; logarithmic bar axes are not supported.");
    const xs = all.map(p => p.x);
    const categories = [...new Set(xs)].sort((a, b) => a - b);
    let domain: [number, number] | undefined;
    if (this.family === "mixed" && barSeries.length) {
      let gap = categories.length > 1 ? Infinity : 1;
      for (let i = 1; i < categories.length; i++) gap = Math.min(gap, categories[i] - categories[i - 1]);
      domain = [categories[0] - gap / 2, categories[categories.length - 1] + gap / 2];
    }
    const xScale = this.xScale === "time" ? calendarScale(domain ? [...xs, ...domain] : xs, this.timeZone, Math.max(2, Math.floor(width / 110))) : numericScale(xs, this.xScale === "log", domain, false);
    const categorical = this.family === "grouped-bar";
    const xPosition = (x: number) => categorical ? (categories.indexOf(x) + .5) / categories.length : xScale.position(x);
    const yScales = axes.map(a => {
      const matching = series.filter(s => (s.axis ?? axes[0].id) === a.id);
      const values = matching.flatMap(s => s.points.flatMap(p => p.y === null ? [] : [p.y]));
      for (const g of [...bars, ...areas]) if (matching.includes(g.series)) values.push(g.low, g.high);
      return numericScale(values, a.scale === "log", a.domain);
    });
    const outside=series.reduce((count,s)=>{const a=axes.find(a=>a.id===s.axis)!;return count+s.points.filter(p=>p.y!==null&&a.domain&&(p.y<a.domain[0]||p.y>a.domain[1])).length;},0);
    const yFor = (s: CartesianSeries): ChartScale => yScales[Math.max(0, axes.findIndex(a => a.id === s.axis))];
    const svg = root.querySelector("svg")!;
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("preserveAspectRatio", "none");
    const clip = root.querySelector("clipPath rect")!; clip.setAttribute("width", String(width)); clip.setAttribute("height", String(height));
    root.querySelector('[part="axis-names"]')!.innerHTML = axes.map((a, i) => `<span>${escape(a.label)} · ${i ? "right" : "left"}${a.scale === "log" ? " · logarithmic" : ""}</span>`).join("") + `<span>${escape(this.xLabel)}${this.xScale === "time" ? ` · ${escape(this.timeZone)}` : this.xScale === "log" ? " · logarithmic" : ""}</span>`;
    const formatTick = (v: number) => this.yFormatter ? this.yFormat(v) : new Intl.NumberFormat("en", { notation: "compact", maximumSignificantDigits: 3 }).format(v);
    const tickLabels = yScales.map(scale => {
      let labels = scale.ticks.map(formatTick);
      if (new Set(labels).size !== labels.length) labels = scale.ticks.map(this.yFormat);
      return scale.ticks.map((t, i) => `<span style="--position:${scale.position(t) * 100}%" title="${escape(this.yFormat(t))}">${escape(labels[i])}</span>`).join("");
    });
    root.querySelector('[part="y-ticks"][data-side="left"]')!.innerHTML = tickLabels[0];
    root.querySelector('[part="y-ticks"][data-side="right"]')!.innerHTML = tickLabels[1] ?? "";
    const names = new Map<number,string>();
    let namedCoordinates=categorical||this.family==="area"||this.family==="mixed";
    if(namedCoordinates)for(const point of all){
      if(!point.label?.trim()||names.has(point.x)&&names.get(point.x)!==point.label){namedCoordinates=false;break;}
      names.set(point.x,point.label);
    }
    const labelSize=namedCoordinates?[...names.values()].reduce((size,label)=>Math.max(size,Math.min(100,label.length*6)),44):90;
    const tickBudget=Math.max(2,Math.floor(width/labelSize));
    const candidates=namedCoordinates?categories:xScale.ticks;
    const tickValues=candidates.length<=tickBudget?candidates:[...new Set(Array.from({length:tickBudget},(_,i)=>candidates[Math.round(i*(candidates.length-1)/(tickBudget-1))]))];
    const xText=(v:number)=>namedCoordinates?names.get(v)!:this.xScale==="time"&&!this.xFormatter?formatCalendarTick(v,this.timeZone,categories[categories.length-1]-categories[0]):this.xFormatter?this.xFormat(v):formatChartValue(v);
    let xLabels=tickValues.map(xText);
    if(new Set(xLabels).size!==xLabels.length&&!namedCoordinates)xLabels=tickValues.map(this.xFormat);
    root.querySelector('[part="x-ticks"]')!.innerHTML = tickValues.map((t,i) => `<span style="--position:${xPosition(t) * 100}%;--label-width:${Math.max(30,width/Math.max(1,tickValues.length)-6)}px" title="${escape(this.xFormat(t))}">${escape(xLabels[i])}</span>`).join("");
    root.querySelector('[part="grid"]')!.innerHTML = yScales[0].ticks.map(t => `<line part="${t === 0 ? "zero" : "grid-line"}" x1="0" x2="${width}" y1="${height * (1 - yScales[0].position(t))}" y2="${height * (1 - yScales[0].position(t))}"/>`).join("");
    const color = (s: CartesianSeries) => categoryColor(s.id, series.indexOf(s), this.seriesTokens, s.tone, quantitativeColors);
    const pointAttribute = (p: CartesianPoint) => `data-point="${escape(p.id)}"`;
    const marks: string[] = [];
    let reduced = 0;
    const maxSize = all.reduce((max, p) => Math.max(max, p.size ?? 0), 0);
    const sizeKey=root.querySelector<HTMLElement>('[part="size-key"]')!;
    sizeKey.hidden=this.family!=="bubble"||maxSize===0;
    sizeKey.innerHTML=this.family==="bubble"&&maxSize>0?[.25,.5,1].map(fraction=>`<span><i aria-hidden="true" style="--diameter:${bubbleRadius(maxSize*fraction,maxSize)*2}px"></i>${escape(this.yFormat(maxSize*fraction))} ${escape(this.sizeLabel)}</span>`).join(""):"";
    let spacing = width;
    for (let i = 1; i < categories.length; i++) spacing = Math.min(spacing, (xPosition(categories[i]) - xPosition(categories[i - 1])) * width);
    const categoryWidth = Math.min(100, Math.max(1, spacing * .72));
    if (bars.length > 2000) throw new Error("Too many bars for a readable plot. Filter categories; all exact observations remain in the paginated table.");
    for (const b of bars) {
      const scale = yFor(b.series), w = categoryWidth / b.groups;
      const x = xPosition(b.point.x) * width - categoryWidth / 2 + b.group * w;
      const y = (1 - scale.position(b.high)) * height;
      const h = Math.max(0, (scale.position(b.high) - scale.position(b.low)) * height);
      const rect = `x="${x}" y="${y}" width="${Math.max(.5, w - 2)}" height="${h}"`;
      this.positions.set(b.point.id, { x: x + w / 2, y: (1 - scale.position(b.point.y! < 0 ? b.low : b.high)) * height });
      marks.push(`<rect fill="transparent" pointer-events="all" ${pointAttribute(b.point)} x="${x}" y="${y - Math.max(0, 24 - h) / 2}" width="${Math.max(14, w - 2)}" height="${Math.max(24, h)}"/>`);
      marks.push(`<rect part="mark" data-animation-group="${escape(b.series.id)}" ${pointAttribute(b.point)} ${rect} data-animation-origin="50% ${h ? ((1-scale.position(0))*height-y)/h*100 : 100}%" style="--series-color:${color(b.series)}"/>`);
      if (!this.stacked && bars.length <= 24 && y >= 15 && b.point.y! > 0) marks.push(`<text part="direct-value" data-animation-group="${escape(b.series.id)}" data-animation-point-id="${escape(b.point.id)}" x="${x + (w - 2) / 2}" y="${y - 6}" text-anchor="middle" style="font-size:11px;fill:var(--boe-token-text-text,#102347)">${escape(this.yFormat(b.point.y!))}</text>`);
      if (b.point.y === 0) marks.push(`<line part="zero" ${pointAttribute(b.point)} x1="${x}" x2="${x + w - 2}" y1="${y}" y2="${y}"/>`);
      this.selectionGeometry.set(b.point.id, `<rect part="selection" ${rect}/>`);
    }
    const areaLookup = new Map(areas.map(a => [a.point.id, a]));
    const missingX = new Set(areaSeries.flatMap(s => s.points.filter(p => p.y === null).map(p => p.x)));
    for (const s of series) {
      if (barSeries.includes(s)) continue;
      const scale = yFor(s), isArea = areaSeries.includes(s);
      const budget = Math.max(100, Math.min(2000, Math.floor(width * 2)));
      const points = renderingPoints(s.points, budget);
      reduced += s.points.length - points.length;
      const coordinate = (p: CartesianPoint) => {
        const bounds = areaLookup.get(p.id);
        return { x: xPosition(p.x) * width, y: p.y === null || isArea && this.stacked && missingX.has(p.x) ? null : height * (1 - scale.position(bounds ? p.y! < 0 ? bounds.low : bounds.high : p.y!)) };
      };
      this.projectors.set(s.id, coordinate);
      const coords = points.map(coordinate);
      // Exact keyboard/selected positions also survive decimation of the visible path.
      for (const p of s.points) {
        if (p.id === this.selectedId || p.id === this.inspectedId) {
          const c = coordinate(p); if (c.y !== null) this.positions.set(p.id, { x: c.x, y: c.y });
        }
      }
      const path = linePath(coords, this.interpolation);
      if (isArea) {
        let start = 0;
        for (let i = 0; i <= coords.length; i++) if (i === coords.length || coords[i].y === null) {
          const upper = coords.slice(start, i);
          const lower = points.slice(start, i).map(p => { const a = areaLookup.get(p.id); return { x: xPosition(p.x) * width, y: height * (1 - scale.position(a ? p.y! < 0 ? a.high : a.low : 0)) }; }).reverse();
          if (upper.length) marks.push(`<path part="area" data-animation-group="${escape(s.id)}" d="${linePath(upper, this.interpolation)} ${lower.map(p => `L ${p.x} ${p.y}`).join(" ")} Z" style="--series-color:${color(s)}"/>`);
          start = i + 1;
        }
      }
      if (this.family !== "scatter" && this.family !== "bubble") marks.push(`<path part="series-path" data-animation-group="${escape(s.id)}" d="${path}" style="--series-color:${color(s)}" stroke-dasharray="${["none", "6 3", "2 3", "8 3 2 3"][series.indexOf(s) % 4]}"/>`);
      if (points.length <= 2000) points.forEach((p, i) => {
        const c = coords[i]; if (c.y === null) return;
        this.positions.set(p.id, { x: c.x, y: c.y });
        const radius = this.family === "bubble" ? bubbleRadius(p.size!, maxSize) : this.family === "scatter" ? 4 : points.length <= 100 ? 3 : 0;
        marks.push(`<circle fill="transparent" pointer-events="all" ${pointAttribute(p)} cx="${c.x}" cy="${c.y}" r="${Math.max(12, radius)}"/>`);
        if (radius > 0) marks.push(`<circle part="mark" data-animation-group="${escape(s.id)}" ${pointAttribute(p)} cx="${c.x}" cy="${c.y}" r="${radius}" style="--series-color:${color(s)}"/>`);

      });
    }
    root.querySelector('[part="marks"]')!.innerHTML = marks.join("");
    this.inspect(this.inspectedId ?? this.selectedId); this.syncSelection();
    root.querySelector('[part="disclosure"]')!.textContent = `${outside?`${outside} observations lie outside the supplied y domains and are clipped; exact values remain in the table. `:""}${reduced ? `Rendering a reduced view (${all.length - reduced} of ${all.length} observations); buckets containing missing values remain gaps. Exact source values are in the paginated table. ` : ""}${this.family === "bubble" ? `Bubble area represents ${this.sizeLabel}; largest bubble = ${this.yFormat(maxSize)}. ` : ""}${this.stacked && areaSeries.length ? "Stacked area gaps apply to all series at an incomplete coordinate. " : ""}`;
  }
}
