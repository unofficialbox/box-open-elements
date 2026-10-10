import { BaseElement } from "../../core/index.js";

export type TraceSpanStatus = "ok" | "failed" | "skipped" | "running";
export interface TraceMarker { atMs: number; label: string }
export interface TraceSpan {
  id: string;
  parentId?: string;
  label: string;
  kind: string;
  startMs: number;
  durationMs: number;
  status: TraceSpanStatus;
  system?: boolean;
  markers?: TraceMarker[];
  detail?: { input?: unknown; response?: unknown; attributes?: unknown };
}
export interface TraceRow {
  span: TraceSpan;
  comparisonOnly: boolean;
  parentId?: string;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  position: number;
  siblings: number;
}
export interface TraceLayout { rows: TraceRow[]; hiddenCount: number; endMs: number }

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const escape = (value: string): string => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const statuses: TraceSpanStatus[] = ["ok", "failed", "skipped", "running"];
const statusLabels: Record<TraceSpanStatus, string> = { ok: "Succeeded", failed: "Failed", skipped: "Skipped", running: "Running" };
const statusShapes: Record<TraceSpanStatus, string> = { ok: "✓", failed: "×", skipped: "−", running: "◷" };
const validMarkers = (span: TraceSpan): TraceMarker[] => Array.isArray(span.markers)
  ? span.markers.filter(marker => marker && finite(marker.atMs) && marker.atMs >= 0 && typeof marker.label === "string")
  : [];
const duration = (value: number): string => value >= 1000 ? `${(value / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} s` : `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} ms`;

/** Invalid/duplicate spans are omitted; invalid parent relationships become roots. */
export function validTraceSpans(spans: TraceSpan[]): TraceSpan[] {
  const ids = new Set<string>();
  return spans.filter(span => {
    if (!span || typeof span.id !== "string" || !span.id.trim() || ids.has(span.id) || typeof span.label !== "string" || !span.label.trim() || typeof span.kind !== "string" || !finite(span.startMs) || span.startMs < 0 || !finite(span.durationMs) || span.durationMs < 0 || !finite(span.startMs + span.durationMs) || !statuses.includes(span.status)) return false;
    ids.add(span.id);
    return true;
  });
}

export function traceSpanDuration(span: TraceSpan, nowMs: number): number {
  return span.status === "running" && finite(nowMs) ? Math.max(span.durationMs, nowMs - span.startMs, 0) : span.durationMs;
}

/** Stable report layout: input sibling order, one zero-based axis, no browser dependency. */
export function traceWaterfallLayout(spans: TraceSpan[], options: { showSystem?: boolean; search?: string; collapsed?: ReadonlySet<string>; nowMs?: number; comparisonSpans?: TraceSpan[] } = {}): TraceLayout {
  const current = validTraceSpans(spans);
  const currentIds = new Set(current.map(span => span.id));
  const earlier = validTraceSpans(options.comparisonSpans ?? []);
  const valid = [...current, ...earlier.filter(span => !currentIds.has(span.id))];
  const byId = new Map(valid.map(span => [span.id, span]));
  const parents = new Map<string, string>();
  for (const span of valid) {
    const seen = new Set([span.id]);
    let next = span.parentId;
    let cyclic = false;
    while (next && byId.has(next)) {
      if (seen.has(next)) { cyclic = true; break; }
      seen.add(next);
      next = byId.get(next)?.parentId;
    }
    if (!cyclic && span.parentId && byId.has(span.parentId)) parents.set(span.id, span.parentId);
  }
  const visible = valid.filter(span => options.showSystem || !span.system);
  const visibleIds = new Set(visible.map(span => span.id));
  const visibleParents = new Map<string, string>();
  for (const span of visible) {
    let parent = parents.get(span.id);
    while (parent && !visibleIds.has(parent)) parent = parents.get(parent);
    if (parent) visibleParents.set(span.id, parent);
  }
  const query = options.search?.trim().toLocaleLowerCase() ?? "";
  const keep = new Set<string>();
  for (const span of visible) {
    if (!query || `${span.label} ${span.kind} ${statusLabels[span.status]}`.toLocaleLowerCase().includes(query)) {
      keep.add(span.id);
      let parent = visibleParents.get(span.id);
      while (parent) { keep.add(parent); parent = visibleParents.get(parent); }
    }
  }
  const children = new Map<string | undefined, TraceSpan[]>();
  for (const span of visible) {
    if (!keep.has(span.id)) continue;
    const parent = visibleParents.get(span.id);
    children.set(parent, [...(children.get(parent) ?? []), span]);
  }
  const rows: TraceRow[] = [];
  const visit = (parentId: string | undefined, depth: number): void => {
    const siblings = children.get(parentId) ?? [];
    siblings.forEach((span, index) => {
      const hasChildren = Boolean(children.get(span.id)?.length);
      const expanded = hasChildren && (Boolean(query) || !options.collapsed?.has(span.id));
      rows.push({ span, comparisonOnly: !currentIds.has(span.id), parentId, depth, hasChildren, expanded, position: index + 1, siblings: siblings.length });
      if (expanded) visit(span.id, depth + 1);
    });
  };
  visit(undefined, 0);
  const all = [...current, ...earlier];
  let endMs = 1;
  for (const span of all) {
    endMs = Math.max(endMs, span.startMs + traceSpanDuration(span, options.nowMs ?? 0));
    for (const marker of validMarkers(span)) endMs = Math.max(endMs, marker.atMs);
  }
  return { rows, hiddenCount: valid.filter(span => span.system).length, endMs };
}

const styles = `
  :host { display:block; min-width:0; container-type:inline-size; color:var(--boe-token-text-text,#1f1e1b); font:inherit }
  :host([hidden]) { display:none!important }
  [part=panel] { border:1px solid var(--boe-token-stroke-stroke,#dedfe4); border-radius:.75rem; padding:1rem; background:var(--boe-token-surface-surface,#fff); min-width:0 }
  [part=header], [part=controls], [part=detail-controls] { display:flex; gap:.5rem; flex-wrap:wrap; align-items:center }
  [part=header] { justify-content:space-between; margin-bottom:.75rem } h2,h3 { font:inherit; font-weight:700; margin:0; min-width:0; max-width:100%; overflow-wrap:anywhere }
  [part=controls] { margin-bottom:.75rem } input { font:inherit; width:12rem; max-width:100%; box-sizing:border-box; color:inherit; background:inherit; border:1px solid var(--boe-token-stroke-stroke,#dedfe4); border-radius:.3rem; padding:.4rem }
  button { font:inherit; color:inherit; background:inherit; border:1px solid var(--boe-token-stroke-stroke,#dedfe4); border-radius:.3rem; padding:.35rem .5rem; cursor:pointer; min-height:24px }
  button:disabled { opacity:.6; cursor:default } :is(button,input,[role=row]):focus-visible { outline:2px solid var(--boe-token-surface-surface-brand,#0061d5); outline-offset:2px }
  [part=body] { display:grid; grid-template-columns:minmax(0,1fr); gap:1rem; min-width:0 } [part=body][data-details] { grid-template-columns:minmax(0,2fr) minmax(12rem,1fr) }
  [part=treegrid] { min-width:0 } [part=columns], [part=row] { display:grid; grid-template-columns:minmax(10rem,1fr) minmax(0,2fr); gap:.75rem; align-items:center; min-width:0 }
  [part=columns] { font-size:.75rem; font-weight:600; padding:.5rem; color:var(--boe-token-text-text-secondary,#626b7d) }
  [part=row] { padding:.45rem .5rem; border-radius:.25rem; cursor:pointer; border:1px solid transparent }
  [part=row]:hover { background:var(--boe-token-surface-surface-secondary,#f5f7fb) } [part=row][aria-selected=true] { background:var(--boe-trace-selected,var(--boe-token-surface-surface-secondary,#f5f7fb)); border-color:var(--boe-token-surface-surface-brand,#0061d5) }
  [part=label-cell] { display:flex; gap:.3rem; align-items:center; min-width:0; padding-left:var(--indent) } [part=label] { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; min-width:0 }
  [part=kind], [part=status], [part=duration] { font-size:.75rem } [part=kind] { min-width:0; max-width:35%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--boe-token-text-text-secondary,#626b7d) } [part=expand] { width:24px; height:24px; min-width:24px; border:0; padding:0 } [part=expand-space] { width:24px; min-width:24px }
  [part=timing] { min-width:0 } [part=timing-label] { display:flex; gap:.4rem; flex-wrap:wrap; margin-bottom:.2rem }
  [part=track] { position:relative; height:1.1rem; background:var(--boe-trace-track,var(--boe-token-surface-surface-secondary,#f5f7fb)); border-radius:.15rem }
  [part=bar] { position:absolute; top:.2rem; height:.7rem; min-width:2px; background:var(--boe-trace-bar,var(--boe-token-surface-surface-brand,#0061d5)); border-radius:.1rem }
  [data-parent] [part=bar] { background:var(--boe-trace-parent-bar,var(--boe-token-text-text,#1f1e1b)); height:.9rem; top:.1rem }
  [data-status=failed] [part=bar] { background:var(--boe-trace-failed,var(--boe-token-surface-surface-brand,#0061d5)); border:2px dashed var(--boe-token-text-text,#1f1e1b); box-sizing:border-box }
  [data-status=skipped] [part=bar] { background:transparent; border:1px dashed var(--boe-token-text-text-secondary,#626b7d); box-sizing:border-box }
  [part=comparison-bar] { position:absolute; top:.65rem; height:.35rem; min-width:2px; border:1px solid var(--boe-trace-bar,var(--boe-token-surface-surface-brand,#0061d5)); background:var(--boe-trace-track,var(--boe-token-surface-surface-secondary,#f5f7fb)); box-sizing:border-box }
  [part=marker], [part=comparison-marker] { position:absolute; top:0; height:100%; width:0; border-left:2px solid var(--boe-token-text-text,#1f1e1b) }
  [part=comparison-marker] { border-left-style:dashed }
  [part=axis] { display:flex; justify-content:space-between; gap:.5rem; font-size:.75rem }
  [part=details] { border-left:1px solid var(--boe-token-stroke-stroke,#dedfe4); padding-left:1rem; min-width:0; overflow-wrap:anywhere } [part=detail-section] { margin-top:.8rem } pre { font:inherit; font-family:monospace; font-size:.8rem; white-space:pre-wrap; overflow-wrap:anywhere; margin:.35rem 0 } [part=detail-text] { white-space:pre-wrap; font-size:.8rem }
  [part=note], [part=empty] { font-size:.8rem; margin:.6rem 0; color:var(--boe-token-text-text-secondary,#626b7d) }
  table { border-collapse:collapse; width:100%; table-layout:fixed; font-size:.8rem } caption { text-align:left; font-weight:600; padding:.5rem 0 } th,td { text-align:left; vertical-align:top; padding:.4rem; border-bottom:1px solid var(--boe-token-stroke-stroke,#dedfe4); overflow-wrap:anywhere } th:first-child { width:35% }
  [part=fullscreen] { position:fixed; inset:0; width:100%; height:100%; max-width:none; max-height:none; margin:0; border:0; color:inherit; z-index:1000; overflow:auto; background:var(--boe-token-surface-surface,#fff); padding:1rem; box-sizing:border-box }
  @container (max-width:650px) { [part=panel] { padding:.75rem } [part=body][data-details] { grid-template-columns:minmax(0,1fr) } [part=columns], [part=row] { grid-template-columns:minmax(0,1fr) } [part=columns] [part=axis] { display:none } [part=timing] { padding-left:1.5rem } [part=details] { border-left:0; border-top:1px solid var(--boe-token-stroke-stroke,#dedfe4); padding:1rem 0 0 } [part=label-cell] { padding-left:min(var(--indent),4rem) } }
  @media(prefers-reduced-motion:reduce) { *,*::before,*::after { animation:none!important; transition:none!important } }
`;

/** Host-driven live or completed trace; requests selection, never owns host sessions. */
export class TraceWaterfall extends BaseElement {
  static readonly tagName = "box-trace-waterfall";
  static get observedAttributes(): string[] { return ["heading", "spans", "show-system", "selected-span-id", "now-ms"]; }
  private _spans: TraceSpan[] | null = null;
  private _comparisonSpans: TraceSpan[] = [];
  private collapsed = new Set<string>();
  private search = "";
  private table = false;
  private code = false;
  private fullScreen = false;
  private focusedId: string | null = null;
  get heading(): string { return this.getAttribute("heading")?.trim() || "Trace"; }
  set heading(value: string) { this.setAttribute("heading", value); }
  get spans(): TraceSpan[] { if (this._spans) return this._spans; try { const parsed: unknown = JSON.parse(this.getAttribute("spans") ?? "[]"); return Array.isArray(parsed) ? parsed as TraceSpan[] : []; } catch { return []; } }
  set spans(value: TraceSpan[]) { this._spans = value; this.update(); }
  get comparisonSpans(): TraceSpan[] { return this._comparisonSpans; }
  set comparisonSpans(value: TraceSpan[]) { this._comparisonSpans = value; this.update(); }
  get showSystem(): boolean { return this.hasAttribute("show-system"); }
  set showSystem(value: boolean) { this.toggleAttribute("show-system", value); }
  get selectedSpanId(): string { return this.getAttribute("selected-span-id") ?? ""; }
  set selectedSpanId(value: string) { if (value) this.setAttribute("selected-span-id", value); else this.removeAttribute("selected-span-id"); }
  get nowMs(): number { const value = Number(this.getAttribute("now-ms") ?? 0); return finite(value) && value >= 0 ? value : 0; }
  set nowMs(value: number) { this.setAttribute("now-ms", String(value)); }
  get layout(): TraceLayout { return traceWaterfallLayout(this.spans, { showSystem: this.showSystem, search: this.search, collapsed: this.collapsed, nowMs: this.nowMs, comparisonSpans: this.comparisonSpans }); }
  protected renderTemplate(): void { this.shadowRoot!.innerHTML = `<style>${styles}</style><div part="content-host"></div>`; }
  private select(id: string): void {
    this.selectedSpanId = id;
    const row = this.layout.rows.find(row => row.span.id === id);
    const span = row?.span;
    this.dispatchEvent(new CustomEvent("span-selected", { detail: { spanId: id, span, comparisonOnly: row?.comparisonOnly ?? false }, bubbles: true, composed: true }));
  }
  private focusRow(id: string): void {
    this.focusedId = id;
    const rows = this.shadowRoot!.querySelectorAll<HTMLElement>('[part="row"]');
    rows.forEach(row => { row.tabIndex = row.dataset.spanId === id ? 0 : -1; if (row.tabIndex === 0) row.focus(); });
    if (!rows.length) this.shadowRoot!.querySelectorAll<HTMLElement>("[data-select-id]").forEach(button => { if (button.dataset.selectId === id) button.focus(); });
  }
  private toggle(row: TraceRow): void {
    if (!row.hasChildren || this.search.trim()) return;
    if (this.collapsed.has(row.span.id)) this.collapsed.delete(row.span.id); else this.collapsed.add(row.span.id);
    this.update(); this.focusRow(row.span.id);
    this.dispatchEvent(new CustomEvent("span-toggled", { detail: { spanId: row.span.id, expanded: !this.collapsed.has(row.span.id) }, bubbles: true, composed: true }));
  }
  protected setupListeners(): void {
    this.shadowRoot!.addEventListener("keydown", event => {
      if (!(event instanceof KeyboardEvent)) return;
      const target = event.target as HTMLElement;
      if (event.key === "Escape") {
        if (this.selectedSpanId) { const id = this.selectedSpanId; this.selectedSpanId = ""; this.focusRow(id); }
        else if (this.fullScreen) { this.fullScreen = false; this.update(); this.shadowRoot!.querySelector<HTMLButtonElement>('[part="fullscreen-toggle"]')?.focus(); }
        else return;
        event.preventDefault(); return;
      }
      const element = target.closest<HTMLElement>('[part="row"]');
      if (!element || target !== element) return;
      const rows = this.layout.rows;
      const index = rows.findIndex(row => row.span.id === element.dataset.spanId);
      const row = rows[index]; if (!row) return;
      let next: string | undefined;
      switch (event.key) {
        case "ArrowDown": next = rows[index + 1]?.span.id; break;
        case "ArrowUp": next = rows[index - 1]?.span.id; break;
        case "Home": next = rows[0]?.span.id; break;
        case "End": next = rows.at(-1)?.span.id; break;
        case "ArrowRight": if (row.hasChildren && !row.expanded) this.toggle(row); else if (row.hasChildren) next = rows[index + 1]?.span.id; break;
        case "ArrowLeft": if (row.hasChildren && row.expanded && !this.search.trim()) this.toggle(row); else next = row.parentId; break;
        case "Enter": case " ": this.select(row.span.id); break;
        default: return;
      }
      event.preventDefault(); if (next) this.focusRow(next);
    });
  }
  protected update(): void {
    const host = this.shadowRoot?.querySelector('[part="content-host"]'); if (!host) return;
    const active = this.shadowRoot?.activeElement as HTMLElement | null;
    const activePart = active?.getAttribute("part");
    const wasRow = activePart === "row";
    const activeSelectId = active?.getAttribute("data-select-id");
    const activeRowId = active?.closest<HTMLElement>('[part="row"]')?.dataset.spanId;
    const menuOpen = this.shadowRoot?.querySelector<HTMLDetailsElement>('[part="menu"]')?.open ?? false;
    const searchSelection = active instanceof HTMLInputElement ? [active.selectionStart, active.selectionEnd] : null;
    const { rows, hiddenCount, endMs } = this.layout;
    if (!rows.some(row => row.span.id === this.focusedId)) this.focusedId = rows[0]?.span.id ?? null;
    const allIds = new Set([...validTraceSpans(this.spans), ...validTraceSpans(this.comparisonSpans)].map(span => span.id));
    this.collapsed.forEach(id => { if (!allIds.has(id)) this.collapsed.delete(id); });
    const comparison = new Map(validTraceSpans(this.comparisonSpans).map(span => [span.id, span]));
    const position = (ms: number): number => Math.max(0, Math.min(100, ms / endMs * 100));
    const geometry = (span: TraceSpan): string => `left:${position(span.startMs)}%;width:${position(span.startMs + traceSpanDuration(span, this.nowMs)) - position(span.startMs)}%`;
    const markerList = validMarkers;
    const summary = (span: TraceSpan, comparisonOnly = false): string => {
      const previous = comparison.get(span.id);
      const current = comparisonOnly ? "Not in current trace" : `${span.label}, ${statusLabels[span.status]}, starts at ${duration(span.startMs)}, takes ${duration(traceSpanDuration(span, this.nowMs))}${markerList(span).map(marker => `, ${marker.label} at ${duration(marker.atMs)}`).join("")}`;
      return current + (!comparison.size ? "" : previous ? `; comparison ${statusLabels[previous.status]}, starts at ${duration(previous.startMs)}, takes ${duration(traceSpanDuration(previous, this.nowMs))}${markerList(previous).map(marker => `, comparison marker ${marker.label} at ${duration(marker.atMs)}`).join("")}` : "; not in comparison trace");
    };
    const rowHtml = rows.map(row => {
      const span = row.span; const previous = comparison.get(span.id);
      return `<div part="row" role="row" data-span-id="${escape(span.id)}" data-status="${span.status}"${row.hasChildren ? " data-parent" : ""} tabindex="${span.id === this.focusedId ? 0 : -1}" aria-level="${row.depth + 1}" aria-posinset="${row.position}" aria-setsize="${row.siblings}"${row.hasChildren ? ` aria-expanded="${row.expanded}"` : ""} aria-selected="${span.id === this.selectedSpanId}" aria-label="${escape(summary(span, row.comparisonOnly))}"><div role="gridcell" part="label-cell" style="--indent:${row.depth * 1.15}rem">${row.hasChildren ? `<button part="expand" type="button" tabindex="-1" aria-label="${row.expanded ? "Collapse" : "Expand"} ${escape(span.label)}"${this.search.trim() ? " disabled" : ""}>${row.expanded ? "▾" : "▸"}</button>` : '<span part="expand-space"></span>'}<span part="label" title="${escape(span.label)}">${escape(span.label)}</span><span part="kind">${escape(span.kind)}</span></div><div role="gridcell" part="timing"><div part="timing-label"><span part="status">${row.comparisonOnly ? "Comparison only · " : ""}${statusShapes[span.status]} ${statusLabels[span.status]}</span><span part="duration">${duration(traceSpanDuration(span, this.nowMs))}</span></div><div part="track" aria-hidden="true">${row.comparisonOnly ? "" : `<span part="bar" style="${geometry(span)}"></span>`}${previous ? `<span part="comparison-bar" style="${geometry(previous)}"></span>` : ""}${(row.comparisonOnly ? [] : markerList(span)).map(marker => `<span part="marker" title="${escape(marker.label)}: ${duration(marker.atMs)}" style="left:${position(marker.atMs)}%"></span>`).join("")}${previous ? markerList(previous).map(marker => `<span part="comparison-marker" title="Comparison ${escape(marker.label)}: ${duration(marker.atMs)}" style="left:${position(marker.atMs)}%"></span>`).join("") : ""}</div></div></div>`;
    }).join("");
    const tableRows = rows.map(row => `<tr><th scope="row"><button type="button" data-select-id="${escape(row.span.id)}">${escape(row.span.label)}</button><div>${escape(row.span.kind)}</div></th><td>${row.comparisonOnly ? "Comparison only · " : ""}${statusLabels[row.span.status]}</td><td>${row.comparisonOnly ? "Not in current trace" : `${duration(row.span.startMs)}<br>${duration(traceSpanDuration(row.span, this.nowMs))}${markerList(row.span).map(marker => `<br>${escape(marker.label)}: ${duration(marker.atMs)}`).join("")}`}${comparison.has(row.span.id) ? `<br>Comparison: ${duration(comparison.get(row.span.id)!.startMs)} / ${duration(traceSpanDuration(comparison.get(row.span.id)!, this.nowMs))}${markerList(comparison.get(row.span.id)!).map(marker => `<br>Comparison marker ${escape(marker.label)}: ${duration(marker.atMs)}`).join("")}` : comparison.size ? "<br>Not in comparison trace" : ""}</td></tr>`).join("");
    const selected = rows.find(row => row.span.id === this.selectedSpanId)?.span;
    const selectedIndex = rows.findIndex(row => row.span.id === this.selectedSpanId);
    const detailValue = (value: unknown): string => { if (typeof value === "string") return value; try { return JSON.stringify(value, null, this.code ? 2 : 0) ?? ""; } catch { return "Details are unavailable."; } };
    const details = selected ? `<aside part="details" aria-label="Span details"><h3>${escape(selected.label)}</h3><p part="note">${escape(summary(selected, Boolean(rows[selectedIndex]?.comparisonOnly)))}</p><div part="detail-controls"><button part="previous-span" type="button"${selectedIndex <= 0 ? " disabled" : ""}>Previous span</button><button part="next-span" type="button"${selectedIndex === rows.length - 1 ? " disabled" : ""}>Next span</button><button part="detail-mode" type="button" aria-pressed="${this.code}">${this.code ? "Show text" : "Show code"}</button><button part="close-details" type="button">Close details</button></div><slot name="details">${(["input", "response", "attributes"] as const).map(key => `<section part="detail-section"><h3>${key[0]!.toUpperCase() + key.slice(1)}</h3>${this.code ? `<pre>${escape(detailValue(selected.detail?.[key]))}</pre>` : `<div part="detail-text">${escape(detailValue(selected.detail?.[key])) || "No details supplied."}</div>`}</section>`).join("")}</slot></aside>` : "";
    host.innerHTML = `<${this.fullScreen ? 'dialog part="fullscreen" aria-label="Expanded trace"' : "div"}><section part="panel" aria-label="${escape(this.heading)}"><header part="header"><h2>${escape(this.heading)}</h2><slot name="session"></slot><button part="fullscreen-toggle" type="button" aria-pressed="${this.fullScreen}">${this.fullScreen ? "Exit full screen" : "Expand to full screen"}</button></header><div part="controls"><label>Search spans <input part="search" type="search" value="${escape(this.search)}"></label><button part="table-toggle" type="button" aria-pressed="${this.table}">${this.table ? "Show waterfall" : "Show as a table"}</button><details part="menu"><summary part="menu-summary">Trace options</summary><button part="expand-all" type="button">Expand all</button><button part="collapse-all" type="button">Collapse all</button></details></div>${hiddenCount ? `<p part="note">${this.showSystem ? "System events are shown." : "Some system events are hidden."} <button part="system-toggle" type="button">${this.showSystem ? "Hide system events" : `Show ${hiddenCount} hidden`}</button></p>` : ""}<p part="note">One shared axis: 0–${duration(endMs)}. ${this.comparisonSpans.length ? "Outlined bars show the comparison trace. " : ""}Arrow keys navigate spans and open or close parents; Enter selects details.</p><div part="body"${selected ? " data-details" : ""}>${this.table ? `<table part="table"><caption>${escape(this.heading)} spans</caption><thead><tr><th scope="col">Span / kind</th><th scope="col">Status</th><th scope="col">Start / duration / markers</th></tr></thead><tbody>${tableRows}</tbody></table>` : `<div part="treegrid" role="treegrid" aria-label="${escape(this.heading)} spans" aria-colcount="2"><div role="rowgroup"><div role="row" part="columns"><div role="columnheader">Span</div><div role="columnheader" part="axis"><span>0 ms</span><span>${duration(endMs)}</span></div></div></div><div role="rowgroup">${rowHtml}</div></div>`}${details}</div>${rows.length ? "" : '<p part="empty">No matching spans.</p>'}</section></${this.fullScreen ? "dialog" : "div"}>`;
    const dialog = host.querySelector<HTMLDialogElement>('dialog');
    if (dialog) {
      if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
      dialog.addEventListener("cancel", event => { event.preventDefault(); this.fullScreen = false; this.update(); this.shadowRoot!.querySelector<HTMLButtonElement>('[part="fullscreen-toggle"]')?.focus(); });
    }
    const menu = host.querySelector<HTMLDetailsElement>('[part="menu"]');
    if (menu) menu.open = menuOpen;
    host.querySelectorAll<HTMLElement>('[part="row"]').forEach(element => {
      const row = rows.find(item => item.span.id === element.dataset.spanId)!;
      element.addEventListener("click", event => { if ((event.target as HTMLElement).closest('[part="expand"]')) return; this.focusedId = row.span.id; this.select(row.span.id); this.focusRow(row.span.id); });
      element.addEventListener("focus", () => { this.focusedId = row.span.id; });
      element.querySelector('[part="expand"]')?.addEventListener("click", () => this.toggle(row));
    });
    const button = (part: string, action: () => void): void => { host.querySelector(`[part="${part}"]`)?.addEventListener("click", action); };
    const refreshControl = (part: string, action: () => void): void => { action(); this.update(); this.shadowRoot!.querySelector<HTMLButtonElement>(`[part="${part}"]`)?.focus(); };
    button("table-toggle", () => refreshControl("table-toggle", () => { this.table = !this.table; }));
    button("fullscreen-toggle", () => refreshControl("fullscreen-toggle", () => { this.fullScreen = !this.fullScreen; }));
    button("system-toggle", () => { this.showSystem = !this.showSystem; this.shadowRoot!.querySelector<HTMLButtonElement>('[part="system-toggle"]')?.focus(); });
    button("expand-all", () => refreshControl("expand-all", () => this.collapsed.clear()));
    button("collapse-all", () => refreshControl("collapse-all", () => rows.filter(row => row.hasChildren).forEach(row => this.collapsed.add(row.span.id))));
    button("detail-mode", () => refreshControl("detail-mode", () => { this.code = !this.code; }));
    button("close-details", () => { const id = this.selectedSpanId; this.selectedSpanId = ""; this.focusRow(id); });
    for (const [part, offset] of [["previous-span", -1], ["next-span", 1]] as const) button(part, () => { const next = rows[selectedIndex + offset]; if (next) { this.select(next.span.id); const target = this.shadowRoot!.querySelector<HTMLButtonElement>(`[part="${part}"]`);
      (target?.disabled ? this.shadowRoot!.querySelector<HTMLButtonElement>(`[part="${offset < 0 ? "next-span" : "previous-span"}"]`) : target)?.focus(); } });
    host.querySelectorAll<HTMLElement>("[data-select-id]").forEach(element => element.addEventListener("click", () => { this.select(element.dataset.selectId!); this.shadowRoot!.querySelector<HTMLButtonElement>('[part="close-details"]')?.focus(); }));
    host.querySelector<HTMLInputElement>('[part="search"]')?.addEventListener("input", event => { this.search = (event.target as HTMLInputElement).value; this.update(); });
    if (wasRow && this.focusedId) this.focusRow(this.focusedId);
    else if (activeSelectId) {
      const buttons = Array.from(this.shadowRoot!.querySelectorAll<HTMLButtonElement>("[data-select-id]"));
      (buttons.find(button => button.dataset.selectId === activeSelectId) ?? buttons[0] ?? this.shadowRoot!.querySelector<HTMLInputElement>('[part="search"]'))?.focus();
    }
    else if (activePart === "expand" && activeRowId) {
      const row = Array.from(this.shadowRoot!.querySelectorAll<HTMLElement>('[part="row"]')).find(row => row.dataset.spanId === activeRowId);
      const target = row?.querySelector<HTMLButtonElement>('[part="expand"]');
      (target && !target.disabled ? target : row)?.focus();
    }
    else if (activePart) { let restored = this.shadowRoot!.querySelector<HTMLElement>(`[part="${activePart}"]`); if (restored instanceof HTMLButtonElement && restored.disabled) restored = this.shadowRoot!.querySelector<HTMLElement>('[part="detail-mode"]'); restored?.focus(); if (restored instanceof HTMLInputElement && searchSelection) restored.setSelectionRange(searchSelection[0], searchSelection[1]); }
  }
}

TraceWaterfall.register();
