# Box plot

`box-box-plot` compares distributions of host-computed measurements on one shared scale. The box spans Q1–Q3; the central line is the median. Whiskers default to min–max and can use p5–p95 or p5–p99 instead. A dashed mark denotes a per-row reference. Optional sample dots render only when a row has at most 30 samples; larger sets remain summaries.

```ts
import { BoxPlot, type BoxPlotRow } from "@unofficialbox/box-open-elements/box-plot";

const chart = document.querySelector<BoxPlot>("box-box-plot")!;
chart.rows = [
  { id: "upload", label: "files.upload", min: 16, p5: 21, q1: 34,
    median: 42, q3: 55, p95: 84, max: 126, count: 1204, reference: 50 },
];
chart.format = value => `${Math.round(value)} ms`;
// Set rows again as a new array when streaming updated summaries.
chart.rows = [...chart.rows, { id: "signin", label: "Signing in",
  min: 32, q1: 52, median: 66, q3: 80, max: 148 }];
```

```html
<box-box-plot heading="Step times" unit="ms" whiskers="p5-p95"></box-box-plot>
```

Properties: `rows: BoxPlotRow[]`, `format: (value: number) => string`, `orientation: "horizontal" | "vertical"`, `scale: "linear" | "log"`, `whiskers: "min-max" | "p5-p95" | "p5-p99"`, `heading`, `description`, and `unit`. `rows` can also be JSON in an attribute. The formatter is a JavaScript property, not an HTML attribute. Log scale requires all values to be positive. Invalid/non-monotonic rows are omitted rather than drawn inaccurately; validate upstream data before presenting it. If either requested percentile endpoint is missing, that row uses and labels min–max whiskers. The axis includes references and plotted samples to avoid clipping.

Every chart row is keyboard-focusable and announces the median, middle half, actual whisker range, extrema, count, and optional mean/reference. “Show as a table” exposes the same numbers in native table semantics; its scroll region is keyboard-focusable on narrow screens. Numeric values and references are distinguishable without color. The vertical chart caps its overall width and uses slim candles so a few rows do not stretch across a wide host. The component has no data-fetching, raw-sample aggregation, or ambient motion. Theme its `--boe-boxplot-grid`, `--boe-boxplot-whisker`, `--boe-boxplot-edge`, `--boe-boxplot-fill`, `--boe-boxplot-median`, `--boe-boxplot-dot`, and `--boe-boxplot-reference` properties without replacing geometry.
