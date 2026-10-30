# Composition, ranges and numeric series

These read-only charts use the insight family's title/scope/evidence hierarchy. They do not fetch data or infer conclusions. Defaults use Box tokens; the host owns definitions, units, references and source notes. Keep illustrative examples labelled as such.

## Stacked composition (#601)

Import `@unofficialbox/box-open-elements/stacked-bar-chart` or the insights pattern entry. `StackedBarChart.bars` accepts `{ id, label, totalLabel?, segments: { id, label, value, tone? }[] }[]`. Values must be finite and nonnegative; IDs must be unique within their scope. Invalid snapshots show an explicit message instead of stale geometry.

Segments keep host order. Totals are computed amounts; `totalLabel` overrides only their displayed text. Bars share one zero-based scale, so totals remain comparable. Horizontal is the default. `orientation="vertical"` renders columns on wide screens; at narrow widths labels sit above horizontal rows. The shared legend uses stable segment IDs. `format` is a property callback for ticks, amounts and totals. Default amounts retain numeric precision; percentages are rounded to one decimal and positive shares below 0.1% are named explicitly.

A tiny positive segment gets a minimum two-pixel mark, which is disclosed because the mark can exaggerate its area. It remains keyboard reachable, and its exact amount remains in the table. A zero amount gets no painted segment area. Focus or hover reveals segment, amount, bar total and share without removing other categories. The native table retains every supplied segment, including zero values.

## Range bounds (#602)

Import `@unofficialbox/box-open-elements/range-chart`. `RangeChart.rows` accepts `{ id, label, low, high, value?, tone? }[]`. For comparisons, replace low/high with `ranges: { id, label, low, high, value?, tone? }[]`; series IDs and labels define the shared legend.

Caps identify each actual bound. Equal bounds render one tick. A distinct point is drawn only when `value` is supplied and lies inside the span. No midpoint is inferred. Focus/hover reports low, high and interval width, plus an explicitly supplied point. The table names bounds rather than replacing them with an average. `unit` and the `format` callback apply consistently. Labels move above the ranges at 390px.

## Multi-series numeric lines (#603)

The existing `box-line-chart` remains compatible with categorical `points`. Setting `series` opts into numeric mode:

```ts
chart.series = [
  { id: "direct", label: "Direct extraction", points: [{ x: 2250, y: 539 }, { x: 194000, y: 539 }] },
  { id: "agent", label: "Agent", points: [{ x: 2250, y: 310 }, { x: 194000, y: 8800 }] },
];
chart.xLabel = "Characters";
chart.yLabel = "Tokens";
chart.markers = [{ id: "sample", axis: "x", value: 48000, label: "Measured sample" }];
```

Numeric positions preserve actual spacing; each series must have finite, strictly increasing x values. Null y observations remain gaps and are never interpolated. All series share axes. Linear x axes fit the numeric observations and references; linear y axes retain a zero baseline. `xScale` and `yScale` accept `linear` or `log`; log axes require positive observations/references. Invalid log data leaves the supplied values visible in the table with an explicit explanation rather than silently dropping zeros. Remove the `series` attribute to return to categorical mode.

`xFormat` and `yFormat` are independent property callbacks. The table uses the union of all supplied x positions and every series; absent/null values say “Not observed.” Each series has a host-authored `summary`, or a factual endpoint/flat description with observation counts. Do not interpret matching endpoints as a flat series; only equal observed values get that description. Legends wrap on narrow screens. Line dash patterns, labels, summaries and the table supplement color. Hover/focus highlights one series while retaining the others.

`markers` accept `{ id, axis: "x" | "y", value, label }`. Labels remain visible below the plot. A host can pass named crossover/reference positions; the component does not compute model intersections or imply that a reference is an SLO.

## Theme and state contracts

All three chart modes accept `state` (`ready`, `loading`, `error`, `partial`, `stale`) and `statusMessage`. Include an exact cache timestamp or coverage definition when relevant. Loading/error states do not show cached geometry as current observations. Empty snapshots and measured zero remain distinct.

Use `seriesTokens: Record<string, string>` to map stable segment/series IDs to CSS custom-property names, for example `{ tools: "--app-tools-color" }`. Named tones map to semantic tokens; custom tone values may also name a CSS custom property. `--boe-chart-series-0` through `--boe-chart-series-4` override the default categorical ramp. Token names are validated; arbitrary style text is never interpolated. Match the same ID/token across charts. The native property/JSX contracts are generated for all frameworks; the docs expose equivalent seven-framework snippets.

Table wrappers may scroll locally for many numeric series or enlarged text, with keyboard access. The page itself must not overflow. Avoid making essential conclusions depend on hover. Respect keyboard focus, reduced motion and host text zoom. Automated accessibility testing is recorded separately from actual screen-reader testing.


See [the extended chart-family contract](./chart-family.md) for grouped/signed stacks, scatter, bubble, area, mixed charts, pie, radar, polar area, calendar axes and line interpolation.
## Animation

Every insight component supports optional `animated` motion and shared timing, preset, loop and pause properties. See [chart animation](chart-animation.md) for the common contract and live-example variants.
