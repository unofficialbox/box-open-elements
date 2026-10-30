export type { ChartAnimationPreset, ChartAnimationEasing } from "./chart-motion.js";
import { CartesianChart } from "./cartesian-chart.js";
export type { CartesianPoint, CartesianSeries, CartesianAxis, ChartInterpolation } from "./cartesian-model.js";

export class AreaChart extends CartesianChart {
  static readonly tagName = "box-area-chart";
  protected readonly family = "area" as const;
}
AreaChart.register();
