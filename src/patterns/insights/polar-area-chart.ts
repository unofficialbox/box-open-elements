export type { ChartAnimationPreset, ChartAnimationEasing } from "./chart-motion.js";
import { RadialChart } from "./radial-chart.js";
export type { RadarAxis, RadarSeries, PolarSegment } from "./radial-chart.js";
export class PolarAreaChart extends RadialChart {
  static readonly tagName = "box-polar-area-chart";
  protected readonly family = "polar" as const;
}
PolarAreaChart.register();
