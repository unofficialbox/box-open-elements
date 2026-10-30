export type { ChartAnimationPreset, ChartAnimationEasing } from "./chart-motion.js";
import { chartJson, chartArrayAttributeValid, chartDataJson } from "./analytic-shared.js";
import { DonutChart, type DonutChartSegment } from "./donut-chart.js";

/** Same fixed-denominator data and interaction contract as DonutChart. */
export class PieChart extends DonutChart {
  static readonly tagName = "box-pie-chart";
  get segments(): DonutChartSegment[] {
    const data=chartJson<unknown>(this,"segments",[]);
    return Array.isArray(data)&&data.every(s=>s&&typeof s.id==="string"&&typeof s.label==="string"&&typeof s.value==="number")?data:[];
  }
  set segments(value: DonutChartSegment[]) { this.setAttribute("segments",chartDataJson(value)); }
  protected get cutoutRadius(): number { return 0; }
  protected get invalidDataMessage(): string | null {
    const data=chartJson<unknown>(this,"segments",[]);
    const valid=chartArrayAttributeValid(this,"segments")&&Array.isArray(data)&&new Set(data.map(s=>s?.id)).size===data.length&&data.every(s=>s&&typeof s.id==="string"&&s.id&&typeof s.label==="string"&&s.label.trim()&&Number.isFinite(s.value)&&s.value>=0);
    if(!valid)return "Pie categories require unique IDs, labels and finite nonnegative values; negative amounts cannot be represented as shares.";
    const sum=(data as DonutChartSegment[]).reduce((total,s)=>total+s.value,0);
    if(!Number.isFinite(sum))return "The classified total exceeds the finite numeric range.";
    const raw=this.getAttribute("total");
    if(raw!==null&&(!Number.isFinite(Number(raw))||Number(raw)<sum||Number(raw)<0))return "The supplied total must be finite, nonnegative and include every classified value.";
    return null;
  }
  protected renderChart(): void {
    super.renderChart();
    if (!this.shadowRoot) return;
    // A pie has no hole: keep the denominator below the visual, never on top of sectors.
    const center = this.shadowRoot.querySelector<HTMLElement>('[part="center"]');
    if (center) { center.style.inset = "100% 0 auto"; center.style.paddingBlockStart = ".5rem"; }
    const wrap = this.shadowRoot.querySelector<HTMLElement>('[part="donut-wrap"]');
    if (wrap) wrap.style.marginBlockEnd = "4rem";
    const track = this.shadowRoot.querySelector<SVGCircleElement>('[part="track"]');
    if (track) { track.setAttribute("r", "44"); track.style.fill = "var(--boe-token-stroke-stroke,#e8e8e8)"; track.style.strokeWidth = "0"; if(!this.segments.some(s=>s.value>0)&&!(this.total!>0)){track.style.fill="none";track.style.strokeWidth="1";track.style.strokeDasharray="2 2";} }
    const empty = this.shadowRoot.querySelector('[part="empty"]');
    if (empty?.textContent === "No donut-chart data available.") empty.textContent = "No pie-chart data available.";
  }
}
PieChart.register();
