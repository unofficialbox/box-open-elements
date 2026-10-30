export type { ChartAnimationPreset, ChartAnimationEasing } from "./chart-motion.js";
import { CartesianChart } from "./cartesian-chart.js";
export type { CartesianPoint, CartesianSeries, CartesianAxis, ChartInterpolation } from "./cartesian-model.js";

export class GroupedBarChart extends CartesianChart {
  static readonly tagName = "box-grouped-bar-chart";
  protected readonly family = "grouped-bar" as const;
}
GroupedBarChart.register();
