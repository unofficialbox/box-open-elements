# Distribution timeline

`box-distribution-timeline` shows how one measurement's distribution moves over time. Each host-supplied point is an interval's summary: the shaded range spans minimum to maximum, the band inside it is Q1–Q3, and the line through it is the median. Optional raw samples draw as dots, thinned to an even spread across the time axis so a long run stays legible. Where `box-box-plot` compares distributions side by side, this compares one distribution against itself as a run progresses.

```ts
import { DistributionTimeline, type DistributionTimelinePoint }
  from "@unofficialbox/box-open-elements/distribution-timeline";

const chart = document.querySelector<DistributionTimeline>("box-distribution-timeline")!;
chart.points = [
  { at: 0, min: 18, q1: 31, median: 42, q3: 58, max: 126, count: 1204,
    samples: [21, 38, 44, 61, 92] },
  { at: 5, min: 17, q1: 29, median: 39, q3: 54, max: 98, count: 1190 },
];
chart.format = value => `${Math.round(value)} ms`;
// Set points again as a new array when streaming further intervals.
chart.points = [...chart.points, { at: 10, min: 19, q1: 33, median: 45, q3: 61, max: 141 }];
```

```html
<box-distribution-timeline heading="Upload latency" unit="ms" time-unit="s"></box-distribution-timeline>
```

Properties: `points: DistributionTimelinePoint[]`, `format: (value: number) => string`, `scale: "linear" | "log"`, `maxSamples: number` (default 2000), `hideSamples`, `heading`, `description`, `unit`, and `timeUnit`. `points` can also be JSON in an attribute. The formatter is a JavaScript property, not an HTML attribute. A point needs `at`, `min`, `q1`, `median`, `q3` and `max`; `count` and `samples` are optional. Points arrive in any order and are sorted by `at`. Log scale requires all values to be positive. Points whose five-number summary is not monotonic, or whose values the scale cannot plot, are omitted rather than drawn inaccurately; validate upstream data before presenting it. The value axis includes plotted samples so no dot is clipped.

The component aggregates nothing: it plots the summaries the host computes. Supply more intervals to raise time resolution, not more samples — `maxSamples` caps total dots, and the thinning keeps a near-equal number in each slice of the time axis so a dense early phase cannot crowd out a sparse later one. `hide-samples` drops the dots entirely and leaves the summary geometry.

The plot is one keyboard-focusable image whose accessible name gives the interval count, the time span, the first and last medians, and the highest value of any interval with the time it occurred. “Show as a table” exposes every interval's numbers in native table semantics, one row per interval; its scroll region is keyboard-focusable on narrow screens. The Count column appears only when some point carries `count`; other rows then show an em dash. Band, range and median are distinguishable by position and thickness rather than color alone. The component has no data-fetching, raw-sample aggregation, or ambient motion. Theme its `--boe-distribution-grid`, `--boe-distribution-range`, `--boe-distribution-band`, `--boe-distribution-median`, and `--boe-distribution-dot` properties without replacing geometry.

Embedding: `heading-level` / `headingLevel` chooses a native heading from 1 through 6 (default 2); choose the level that follows the host outline. `embedded` removes the panel background, border, radius and padding. `hide-note` / `hideNote` hides the standard band/range explanation, retaining the host description and the plot's complete summary.

Default range and band use semantic surface and brand tokens; the median uses primary text, value ticks use secondary text and grid lines use stroke. Switching or overriding the host design tokens updates those defaults. Explicit `--boe-distribution-*` overrides retain precedence.
