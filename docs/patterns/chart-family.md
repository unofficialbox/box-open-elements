# Cartesian and radial chart families

These provider-neutral elements extend the existing insight family. They render native SVG with semantic HTML controls and exact-data tables. Hosts supply observations, units, definitions, timestamps and retry behavior. No element fetches data or changes a URL, saved filter or source array.

## Choose the form by the question

| Question | Element | Important contract |
| --- | --- | --- |
| Compare series within categories | `box-grouped-bar-chart` | Zero baseline; one observation per series/category coordinate |
| Compare grouped signed stacks | `box-grouped-bar-chart stacked` | Positive and negative accumulation are independent; `stack` IDs form groups |
| Compare positive composition totals | Existing `box-stacked-bar-chart` | Parts and shares of a nonnegative total; use grouped bars for signed values |
| Inspect association between numeric quantities | `box-scatter-chart` | Numeric x/y spacing; observations need not be ordered or have unique x |
| Add a third quantitative variable | `box-bubble-chart` | `size` maps to circle **area**, not radius; zero size has zero area |
| Show magnitude across ordered coordinates | `box-area-chart` | Linear zero baseline; do not imply sums of distinct-user snapshots |
| Show aligned additive series | `box-area-chart stacked` | Matching x grids; a missing value makes a gap in every stack at that coordinate |
| Compare bars and a trend in one plot | `box-mixed-chart` | Per-series `kind`; optional named y axes with distinct units |
| Show parts of a fixed whole | `box-pie-chart` or existing `box-donut-chart` | Same denominator, exact value/share table and selection semantics |
| Compare a small common-unit rubric | `box-radar-chart` | 3–16 host-ordered axes, a common radial maximum, no silent normalization |
| Compare category magnitudes radially | `box-polar-area-chart` | Equal angles, square-root radial scaling, sector area proportional to value |

Pie is a zero-cutout variant of the donut contract. Its total is below the visual. Negative pie snapshots are rejected rather than turned into positive shares. Polar area is a magnitude chart, not a share-of-total chart.

Pie and donut dividers are constant-width strokes clipped to the circular geometry. Sector angles retain their full data share; no angular gap is subtracted, and a complete single-category circle has no artificial seam.

## Cartesian data

Import the relevant entrypoint and its types; importing an element registers it when a browser registry exists. Imports are safe during SSR.

```ts
import { GroupedBarChart, type CartesianSeries } from "@unofficialbox/box-open-elements/grouped-bar-chart";

const series: CartesianSeries[] = [
  { id: "uploads", label: "Uploads", points: [
    { id: "uploads-oct19", x: 1, y: 64, label: "Oct 19" },
    { id: "uploads-oct26", x: 2, y: 71, label: "Oct 26" },
  ] },
  { id: "downloads", label: "Downloads", points: [
    { id: "downloads-oct19", x: 1, y: 58, label: "Oct 19" },
    { id: "downloads-oct26", x: 2, y: 63, label: "Oct 26" },
  ] },
];
const chart = new GroupedBarChart();
chart.heading = "Weekly content activity";
chart.description = "Illustrative Monday–Sunday counts";
chart.xLabel = "Week of";
chart.yLabel = "Files";
chart.series = series;
document.body.append(chart);
```

`CartesianPoint` has a stable `id`, finite numeric `x`, finite `y` or `null`, optional `label`, and optional nonnegative `size`. Observation IDs are unique across a snapshot. Series have stable IDs, labels, optional token `tone`, optional `axis` ID, optional `stack` ID and (for mixed charts) `kind: "bar" | "line" | "area"`. Missing observations are null; measured zero is 0. Line and area coordinates must be strictly increasing within each series. Scatter points may share x or appear in any order.

`seriesTokens` maps IDs to CSS custom-property names. Arbitrary CSS is not interpolated from data. Native `part`s expose the panel, plot, marks, legend, inspection and table for theming.

## Axes and interpolation

`yAxes` accepts one or two `CartesianAxis` records: `{id, label, scale?, domain?}`. A series without an axis uses the first. Explicit domains must be finite and increasing; log domains and values must be positive. Bars and filled areas require linear domains containing zero. Units and left/right association are visible, and values remain associated with their series in the table. Out-of-domain observations are disclosed as clipped and remain available exactly in the table.

The existing `box-line-chart` also accepts `yAxes` in numeric-series mode. Its older categorical `points`, defaults and events remain supported.

`xScale` is `linear` (default), `log` or `time`. Time coordinates are epoch milliseconds, spaced by elapsed time. Calendar ticks use `timeZone`, an IANA zone defaulting to UTC; the zone is visible. Calendar day/month increments do not assume fixed 24-hour/30-day durations. Invalid zones fail visibly. Calendar axes support Gregorian years 1–9999. Hosts can supply independent `xFormat` and `yFormat` functions.

`interpolation` is `linear`, `monotone`, `step-before`, `step-after` or `step-middle`. Linear remains the default. Monotone interpolation adds no local extrema between samples. Steps describe when a state becomes effective; choose their direction based on the data's meaning. Every null splits the path in every mode. These options also apply to the existing line chart; no smoothing silently bridges missing observations.

## Inspection, controlled selection and focus

New Cartesian charts expose one keyboard focus stop for plot inspection. Left/Right inspect the active series; Up/Down change series, matching the actual x coordinate when present. Home/End jump to its endpoints. Enter/Space requests selection; Escape requests clearing. Native legend buttons inspect a series without hiding it. A series change is not a filter, and inspection never changes domain or category order.

`point-selected` emits `{selectedId, point, seriesId}`. A null ID requests clearing. Selection is controlled: assign `selectedId` in the host to commit it. The selected observation has an outline and explicit text; inspection has a distinct dashed marker. A refreshed snapshot preserves IDs; a selected ID absent from the snapshot is disclosed. Surviving legend/table controls keep focus, and removal of an owned focused control moves focus to the heading without stealing focus from another host control.

```ts
chart.addEventListener("point-selected", event => {
  const detail = (event as CustomEvent<{selectedId: string | null}>).detail;
  chart.selectedId = detail.selectedId;
});
```

Radar and polar charts expose native legend controls and `item-selected` with `{selectedId}`. The host controls the selected series/category. Exact values and full axis names remain available without hover. Pie inherits donut's existing segment-selection API; it does not use the new Cartesian event.

## Dense data and exact values

SVG rendering is bounded by viewport density. Line/area views use a min/max bucket view; buckets containing missingness become gaps rather than connecting across missing intervals. Reduction is disclosed. Source arrays and domain calculations retain full observations. Scatter/bubble views also disclose reduction; they do not claim to show every source point. If a scatter's density is analytically important, prefer a density-specific chart rather than interpreting the reduced scatter as a density estimate.

Exact tables are created on request, with 50 rows per page. The existing numeric line table uses the same bounded page size. A hidden table no longer builds every row in the DOM. This changes hidden implementation details, not the source data or the availability of exact values. Oversized bar plots fail visibly and retain their exact table, rather than rendering unreadable subpixel categories.

## Data availability

`state` accepts ready, loading, error, partial and stale. Loading/error suppress old geometry. Partial data retains missingness. For stale data, supply an exact timestamp and scope through `statusMessage`; the component cannot invent freshness. Retry belongs in the host or footer slot. No synthetic data fills a loading state and no comparison is invented from incomplete periods.

All seven docs framework tabs derive from the same canonical fixtures and variants. Changing frameworks does not simplify away series, labels, axes, states or behavior. Manual screen-reader verification is separate from automated accessibility and keyboard checks.
