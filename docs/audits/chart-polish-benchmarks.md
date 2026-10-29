# Insight chart polish benchmarks

Reference review: October 29, 2026. This is a sample of established JavaScript
charting projects, not an exhaustive popularity ranking. GitHub popularity
helped select references; rendered examples and interaction quality determined
what was useful. No renderer or framework dependency was added.

## Primary references

| Project | Reference inspected | Principle applied to BOE |
| --- | --- | --- |
| [Apache ECharts](https://github.com/apache/echarts) | [Doughnut example](https://echarts.apache.org/examples/en/editor.html?c=pie-doughnut) | Give the ring a clear silhouette; keep the legend subordinate; coordinate emphasis with the data being inspected. |
| [Chart.js](https://github.com/chartjs/Chart.js) | [Doughnut](https://www.chartjs.org/docs/latest/charts/doughnut.html), [linear axes](https://www.chartjs.org/docs/latest/axes/cartesian/linear.html), [interactions](https://www.chartjs.org/docs/latest/configuration/interactions.html) | Deliberate ring proportions, readable numeric intervals, and consistent mark inspection. |
| [Recharts](https://github.com/recharts/recharts) | [Rendered home example](https://recharts.github.io/) | Quiet scaffolding, clear series identification and proportionate line strokes. |
| [Nivo](https://github.com/plouc/nivo) | [Pie](https://nivo.rocks/pie/), [bar](https://nivo.rocks/bar/), [axes guide](https://nivo.rocks/guides/axes/) | Values close to marks, intentional label margins, and compact legends. |
| [Victory](https://github.com/FormidableLabs/victory) | [Clean theme editor and chart previews](https://nearform.com/open-source/victory/themes) | One consistent system for chart padding, type, strokes, direct labels and theme behavior across bar, line, pie and distribution charts. |
| [visx](https://github.com/airbnb/visx) | Repository architecture and documentation | Keep rendering and scales small and composable; retain native components and host-owned data. |

ECharts, Chart.js, Recharts, Nivo and Victory were also inspected as rendered
browser pages. visx was an architectural reference, not a rendered visual review.

## BOE design contract

- Keep public element APIs, native events and framework-neutral data contracts.
- Use a shared surface, restrained palette, quiet grid and tabular numbers.
- Use zero-inclusive, finite scales with readable 1/2/5 tick intervals; preserve
  a finite fallback at numeric extremes. Position grid lines from the same scale
  as the marks rather than assuming a fixed number of ticks.
- Put bar and line values beside their marks. Keep category labels aligned with
  their marks. Essential values remain visible without hover.
- Keep the donut's total readable, show category/value/share on aligned legend
  rows, and link ring/legend inspection for both pointer and keyboard use.
  Inspection changes emphasis, not the underlying values or proportions.
- Preserve a useful intrinsic size in flex/grid compositions; container queries
  must not collapse charts to a nearly empty flex basis.
- Keep reduced-motion behavior, native button semantics, focus identity, event
  payloads, mobile layout, dark mode and box-plot statistical meaning intact.
- Validate successive passes through source tests, actual browser inspection,
  automated accessibility, responsive/theme fixtures and strict pixel regression.

The references establish principles and acceptance criteria. BOE retains its own
Box tokens, typography, content and component architecture; reference code,
palettes and page layouts are not copied.
