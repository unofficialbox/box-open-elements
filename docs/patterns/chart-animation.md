# Optional chart animation

Every insight element supports the same motion contract: metric card, chart panel, bar, stacked bar, grouped bar, range, line, scatter, bubble, area, mixed, donut, pie, radar, polar area, box plot and distribution timeline. The renderer is native SVG/HTML; Chart.js is a reference, not a new runtime dependency.

```html
<box-grouped-bar-chart
  animated
  animation-preset="delay"
  animation-duration="1000"
  animation-delay="100"
  animation-stagger="60"
  animation-easing="ease-out-cubic"
  heading="Weekly content activity"
  series='[{"id":"uploads","label":"Uploads","points":[{"id":"week-1","x":1,"y":42,"label":"Oct 5"},{"id":"week-2","x":2,"y":51,"label":"Oct 12"}]}]'
></box-grouped-bar-chart>
```

## Common properties

| Property / HTML attribute | Default | Meaning |
| --- | --- | --- |
| `animated` | `false` | Enable motion. Omit the HTML boolean attribute to disable it; `animated="false"` is still present/true. In JavaScript assign `chart.animated = false`. |
| `animationPreset` / `animation-preset` | `auto` | Choose the presentation effect below. |
| `animationDuration` / `animation-duration` | `600` | Milliseconds per complete cycle, including its stagger window. Zero shows final geometry immediately. |
| `animationDelay` / `animation-delay` | `0` | Milliseconds before the cycle starts. |
| `animationStagger` / `animation-stagger` | `40` | Requested milliseconds between marks for delay/drop. The gap is bounded so the stagger fits within half the cycle. |
| `animationEasing` / `animation-easing` | `ease-out-cubic` | Timing curve. Progressive uses linear timing; drop defaults to elastic timing unless this property is explicitly supplied. |
| `animationLoop` / `animation-loop` | `false` | Repeat the chosen motion. The active-mark loop preset pulses only while a mark is inspected. |
| `animationPaused` / `animation-paused` | `false` | Pause/resume without changing observations or selection. |

Timing values must be finite and nonnegative, and are capped at 60,000ms. Invalid values use the documented default. Native `Pause animation`/`Resume animation` and `Replay animation` buttons accompany enabled motion. Hosts can also call `replayAnimation()` and `finishAnimation()`; the latter removes motion and reveals the exact final chart, useful before printing/export.

Use `animated` rather than a boolean `animate` property: `HTMLElement.animate()` is the browser's existing Web Animations API and remains available.

## Presets and sample review

| BOE preset | Behavior | Reference reviewed |
| --- | --- | --- |
| `auto` | Grow bars and points, draw lines/areas, sweep pie/donut, grow radar/polar from the common center, expand ranges and box plots outward from each box center, and fade metric text. Values are never counted up through invented observations. | [Pie](https://www.chartjs.org/docs/latest/samples/other-charts/pie.html), [polar area](https://www.chartjs.org/docs/latest/samples/other-charts/polar-area.html), [radar](https://www.chartjs.org/docs/latest/samples/other-charts/radar.html) |
| `delay` | Stagger the chart's native entrance by rendered mark/series. | [Delay](https://www.chartjs.org/docs/latest/samples/animations/delay.html) |
| `drop` | SVG marks descend from the top; line y coordinates settle with elastic timing. Point glyphs translate without stretching and share their connected series' clock. Semantic HTML controls fade instead of moving their hit targets. | [Drop](https://www.chartjs.org/docs/latest/samples/animations/drop.html) |
| `loop` | Pulse the active point/mark on pointer or keyboard inspection. `animation-loop` repeats it until inspection leaves. Point radii pulse; non-point quantitative marks use opacity so their amounts are not rescaled. | [Loop](https://www.chartjs.org/docs/latest/samples/animations/loop.html) |
| `progressive` | Reveal from left to right using linear time, preserving missing intervals and dashed series encodings. | [Progressive line](https://www.chartjs.org/docs/latest/samples/animations/progressive-line.html) |
| `progressive-easing` | The same reveal with the configured timing curve; `ease-in-quad` accelerates, `ease-out-quad` decelerates. | [Progressive line with easing](https://www.chartjs.org/docs/latest/samples/animations/progressive-line-easing.html) |
| `fade` | Fade presentation marks while keeping final geometry fixed. | Shared fallback |

Easings: `linear`, `ease-out-quad`, `ease-out-cubic`, `ease-out-quart`, `ease-out-quint`, `ease-in-quad`, `ease-in-cubic`, `ease-in-quart`, `ease-in-quint`, `ease-in-out-sine`, `ease-out-bounce`, `ease-in-out-elastic`. Easing is sampled into browser keyframes; no data is mutated per animation frame.

Range entrances expand horizontally from the midpoint of their bounds. Box-plot entrances expand from the screen-space center of Q1–Q3, horizontally or vertically, reaching the supplied whisker bounds. Gridlines, reference marks, labels and the box-plot interaction surface remain stable.

Staggering follows the renderer's paint groups: individual discrete marks, connected line series, or the whole pie/donut sweep. Connected line paths and their point glyphs share timing. Bubble attention pulses use opacity rather than changing the area that encodes quantity; keyboard focus rings can pulse independently.

The [multi-series pie sample](https://www.chartjs.org/docs/latest/samples/other-charts/multi-series-pie.html) uses concentric dataset rings and a custom dataset-aware legend. Its entrance follows the radial family. Reviewing its motion does not add a multi-ring data contract to BOE's single-whole pie/donut API.

These are native BOE presentation equivalents, not a port of Chart.js's per-property animation engine. Settled dataset updates replay the selected entrance for the new snapshot; they do not interpolate numerical observations between old and new datasets. Rapid snapshots arriving within one cycle, and new snapshots received while paused, settle directly to the latest final geometry so a live chart cannot repeatedly reset to empty. Progressive reveal is a time-controlled clipping view of the exact path, rather than thousands of separately scheduled point updates.

## Lifecycle and accessibility

- Motion is opt-in and the static default is unchanged. Docs and Workshop add named animated variants; every framework tab shows the same boolean and associated properties. The docs site initially selects Animated entrance; consumers and Workshop retain static defaults.
- Axes, units, denominator, source records, exact-data tables and semantic labels remain final and available during motion. Animated partial paths are presentation, not partial dataset coverage.
- Direct-value labels fade in as their moving marks settle, so they do not float at final coordinates during an entrance. Accessible names, summaries and exact tables retain the supplied values throughout.
- Entering keyboard inspection or clicking a mark finishes one-shot entrance motion before interaction. Inspection, selection and heading changes never restart the dataset animation from zero. Layout rerenders transfer the current timeline to replacement marks; completed motion remains at final geometry.
- `prefers-reduced-motion: reduce` overrides opt-in and immediately displays final geometry, including when the preference changes during a loop. Unsupported Web Animations environments also use the static result.
- Hidden documents pause work; returning resumes only if the host has not paused it. Disconnect cancels owned timelines and removes listeners; reconnect creates one fresh presentation cycle.
- Long/repeating animation always has a native pause control. No live-region announcement occurs per animation frame. Manual screen-reader testing remains separate from automated accessibility checks.

Validation evidence and remaining manual coverage are recorded in [Optional animation verification](chart-animation-verification.md).
