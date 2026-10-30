# Distribution timeline

`box-distribution-timeline` follows one measurement’s distribution across host-supplied intervals. It does not fetch or aggregate samples. Supply ordered five-number summaries (`min`, `q1`, `median`, `q3`, `max`), the time `at`, and optional `count` and sampled values.

The default view uses a separate quartile box and capped min–max whisker at each interval, with a straight median trajectory. It preserves the actual numeric spacing of timestamps. There are no continuous filled envelopes between intervals. A compact key names the three encodings, and the latest interval’s time, median and optional count remain readable without hover.

## Example

```html
<box-distribution-timeline heading="Upload latency" unit="ms" time-unit="s"
  points='[{"at":0,"min":18,"q1":31,"median":42,"q3":58,"max":126,"count":1204}]'>
</box-distribution-timeline>
```

Import the `distribution-timeline` entry or `patterns/insights`. Root, optimized and native framework typings share the same data model. The docs and Workshop use one canonical thirteen-interval fixture; every framework tab reproduces the actual preview rather than a different one-point example.

## Samples and table

Sampled values are an inspection layer, **off by default**. The “Sampled values” toggle uses a stable name and `aria-pressed` to expose its state. Toggle it or set `showSamples` / `show-samples` to enable the layer. `hideSamples` / `hide-samples` forces both the layer and its control off. The control emits `samples-toggled` with `{ visible: boolean }`.

`maxSamples` / `max-samples` defaults to 600. All supplied samples are shown when they fit the cap; larger sets are thinned across the time axis. The note and control name disclose the actual shown and supplied counts. Dots retain a circular, fixed-pixel shape at desktop/mobile widths. They are not a continuous density estimate.

“Show as a table” retains **every valid interval’s** time, minimum, Q1, median, Q3, maximum and optional count. The named scroll region is keyboard accessible at narrow widths. Empty data stays explicit even if it arrives while the table is open.

## Scale, state and accessibility

`scale="linear|log"` reuses the box-plot value scale. Log requires positive statistics/samples. Invalid intervals are omitted and counted in the visible method note. A single valid interval is centered at its actual timestamp; it does not claim an extra interval of elapsed time. The time axis uses readable numeric ticks, including subsecond times.

`heading`, `headingLevel` / `heading-level`, `description`, `embedded` and `hideNote` / `hide-note` retain their roles. `format` is a value formatter callback; `unit` and `timeUnit` / `time-unit` label the two axes. Focus remains on equivalent controls after updates, and moves to the heading if a focused view disappears.

The plot remains one keyboard-focusable image. Its accessible name states the interval count, actual start/end times, first/last medians and the highest interval value with its time. Shape, thickness, labels and the exact table supplement color. Automated accessibility checks are recorded separately from manual screen-reader acceptance; no manual pass is claimed.

Theme via `--boe-distribution-grid`, `--boe-distribution-range`, `--boe-distribution-band`, `--boe-distribution-edge`, `--boe-distribution-median` and `--boe-distribution-dot`, with the shared Box tokens as defaults.

## Presentation migration

The previous continuous min–max/Q1–Q3 filled areas have been replaced by discrete interval marks. `range` now identifies a whisker line, and `band` identifies each interval’s quartile rectangle; custom `::part()` themes should account for that geometry. Sample dots now require the inspection control or `show-samples`; existing `hide-samples` continues to suppress them. The statistics, value scale, full table and host data model remain intact.

Long runs retain every interval in a locally scrollable plot with minimum mark spacing. The value axis stays visible, and the full-run latest summary and exact table remain available. Keyboard users can focus the plot region and scroll horizontally.
