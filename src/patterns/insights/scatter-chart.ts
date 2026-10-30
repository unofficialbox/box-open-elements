export type { ChartAnimationPreset, ChartAnimationEasing } from "./chart-motion.js";
import { CartesianChart } from "./cartesian-chart.js";
export type { CartesianPoint, CartesianSeries, CartesianAxis, ChartInterpolation } from "./cartesian-model.js";

export class ScatterChart extends CartesianChart {
  static readonly tagName = "box-scatter-chart";
  protected readonly family = "scatter" as const;
}
ScatterChart.register();
