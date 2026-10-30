/** Optional host-authored inspection copy. Charts never infer business meaning. */
export interface ChartInspection { label: string; value: string; comparison?: string }
export interface ChartPoint {
  id: string;
  label: string;
  value: number | null;
  tone?: string;
  partial?: boolean;
  inspection?: ChartInspection;
}
export const presentationAttributes = ["selected-id", "unit", "x-label", "domain", "state", "status-message", "note"];
export const presentationMarkup = `<div part="status" role="status" hidden></div><div part="inspection" aria-live="polite" aria-atomic="true" hidden><div part="inspection-label"></div><div part="inspection-value"></div><div part="comparison" hidden></div></div><slot name="inspection"></slot><div part="unit" hidden></div>`;
export const presentationFooter = `<div part="axis-title" hidden></div><div part="data-table" hidden></div><footer part="footer"><div part="footer-controls"><div part="actions" hidden></div><button part="clear-selection" type="button" hidden>Clear selection</button><button part="table-toggle" type="button" aria-expanded="false">Show data table</button></div><div part="note" hidden></div><slot name="footer"></slot></footer>`;
export const chartDomain = (host: HTMLElement): number[] => {
  try { const bounds: unknown = JSON.parse(host.getAttribute("domain") ?? "null"); return Array.isArray(bounds) && bounds.length === 2 && bounds.every(Number.isFinite) && bounds[0] < bounds[1] ? bounds : []; } catch { return []; }
};

/** Owns only presentation state; data, comparisons, scope and actions stay with the host. */
export class ChartPresentation {
  private table = false;
  constructor(private host: HTMLElement, private refresh: () => void, private cleared: () => void) {}
  setup(): void {
    const root = this.host.shadowRoot!;
    root.querySelector('[part="clear-selection"]')!.addEventListener("click", () => {
      this.host.removeAttribute("selected-id");
      this.cleared();
      this.refresh();
      root.querySelector<HTMLButtonElement>('[part="point"][data-focal="true"]')?.focus();
    });
    root.querySelector('[part="table-toggle"]')!.addEventListener("click", () => { this.table = !this.table; this.refresh(); });
  }
  select(id: string): void { this.host.setAttribute("selected-id", id); }
  sync(points: ChartPoint[]): void {
    const root = this.host.shadowRoot!;
    const state = this.host.getAttribute("state") ?? "ready";
    const unavailable = state === "loading" || state === "error";
    const selected = points.find(point => point.id === this.host.getAttribute("selected-id"));
    const current = selected ?? points.at(-1);
    const inspection = root.querySelector<HTMLElement>('[part="inspection"]')!;
    inspection.hidden = unavailable || !current?.inspection;
    root.querySelector('[part="inspection-label"]')!.textContent = current?.inspection?.label ?? "";
    root.querySelector('[part="inspection-value"]')!.textContent = current?.inspection?.value ?? "";
    const comparison = root.querySelector<HTMLElement>('[part="comparison"]')!;
    const previous = points[points.indexOf(current!) - 1];
    comparison.textContent = current?.inspection?.comparison ?? "";
    comparison.hidden = !comparison.textContent || current?.partial === true || current?.value == null || previous?.partial === true || previous?.value == null || state === "partial";
    const status = root.querySelector<HTMLElement>('[part="status"]')!;
    status.textContent = this.host.getAttribute("status-message") || ({loading:"Loading observations…", error:"Observations could not be loaded.",partial:"Partial data. Comparisons may be unavailable.",stale:"Cached data. Check the timestamp before acting."} as Record<string,string>)[state] || "";
    if (points.some(point=>point.partial)) status.textContent += " * Incomplete observation.";
    status.hidden = !status.textContent;
    root.querySelector('[part="panel"]')!.setAttribute("aria-busy", String(state === "loading"));
    const visual = root.querySelector<HTMLElement>('[part="visual"]')!;
    const slottedChart = this.host.querySelector('[slot="chart"]') !== null;
    visual.hidden = unavailable || this.table || (!points.length && !slottedChart);
    const empty = root.querySelector<HTMLElement>('[part="empty"]')!;
    empty.hidden = state !== "loading" && (points.length > 0 || slottedChart || state === "error");
    empty.textContent = state === "loading" ? "" : "No observations for this scope.";
    empty.dataset.loading = String(state === "loading");
    root.querySelectorAll<HTMLElement>('[part="point"]').forEach(button => {
      const point = points.find(item => item.id === button.dataset.pointId)!;
      button.dataset.focal = String(point === current);
      button.dataset.selected = String(point === selected);
      button.setAttribute("aria-pressed", String(point === selected));
      let label = button.querySelector<HTMLElement>('[part="selection-label"]');
      if (!label) { label = document.createElement("span"); label.setAttribute("part", "selection-label"); button.append(label); }
      label.textContent = point === selected ? "Selected" : "";
      label.hidden = point !== selected;
    });
    root.querySelector<HTMLElement>('[part="clear-selection"]')!.hidden = !selected;
    const unit = root.querySelector<HTMLElement>('[part="unit"]')!;
    unit.textContent = this.host.getAttribute("unit") ?? ""; unit.hidden = !unit.textContent || visual.hidden;
    const axis = root.querySelector<HTMLElement>('[part="axis-title"]')!;
    axis.textContent = this.host.getAttribute("x-label") ?? ""; axis.hidden = !axis.textContent || visual.hidden;
    const note = root.querySelector<HTMLElement>('[part="note"]')!;
    note.textContent = this.host.getAttribute("note") ?? ""; note.hidden = !note.textContent;
    const table = root.querySelector<HTMLElement>('[part="data-table"]')!;
    table.hidden = !this.table || unavailable;
    table.replaceChildren();
    if (!table.hidden) {
      const data = document.createElement("table");
      const caption = data.createCaption(); caption.textContent = this.host.getAttribute("heading") ?? "Observations";
      const header = data.createTHead().insertRow();
      for (const text of [this.host.getAttribute("x-label") || "Period", this.host.getAttribute("unit") || "Value", "Coverage"]) { const th = document.createElement("th"); th.scope="col"; th.textContent=text; header.append(th); }
      const body = data.createTBody();
      for (const point of points) { const row = body.insertRow(); const label = document.createElement("th"); label.scope="row"; label.textContent=point.label; row.append(label); row.insertCell().textContent = point.value == null ? "Not observed" : String(point.value); row.insertCell().textContent = point.value == null ? "Missing" : point.partial ? "Incomplete" : "Complete"; }
      table.append(data);
    }
    const toggle = root.querySelector<HTMLButtonElement>('[part="table-toggle"]')!;
    toggle.textContent = this.table ? "Show chart" : "Show data table"; toggle.setAttribute("aria-expanded",String(this.table)); toggle.hidden = unavailable || !points.length;
  }
}
