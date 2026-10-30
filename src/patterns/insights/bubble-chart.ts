export type { ChartAnimationPreset, ChartAnimationEasing } from "./chart-motion.js";
import { CartesianChart } from "./cartesian-chart.js";
export type { CartesianPoint, CartesianSeries, CartesianAxis, ChartInterpolation } from "./cartesian-model.js";

export class BubbleChart extends CartesianChart {
  static readonly tagName = "box-bubble-chart";
  protected readonly family = "bubble" as const;
}
BubbleChart.register();
