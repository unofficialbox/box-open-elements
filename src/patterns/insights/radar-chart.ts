export type { ChartAnimationPreset, ChartAnimationEasing } from "./chart-motion.js";
import { RadialChart } from "./radial-chart.js";
export type { RadarAxis, RadarSeries, PolarSegment } from "./radial-chart.js";
export class RadarChart extends RadialChart {
  static readonly tagName = "box-radar-chart";
  protected readonly family = "radar" as const;
}
RadarChart.register();
