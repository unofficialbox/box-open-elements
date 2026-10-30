export type { ChartAnimationPreset, ChartAnimationEasing } from "./chart-motion.js";
import { CartesianChart } from "./cartesian-chart.js";
export type { CartesianPoint, CartesianSeries, CartesianAxis, ChartInterpolation } from "./cartesian-model.js";

export class MixedChart extends CartesianChart {
  static readonly tagName = "box-mixed-chart";
  protected readonly family = "mixed" as const;
}
MixedChart.register();
