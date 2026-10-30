# Chart.js lessons for the insight family

Review conducted October 29, 2026. This document records the reference review for the chart-family implementation. It distinguishes measured behavior, source inspection, design decisions and work still to implement. It is not a claim that the new BOE chart families have shipped.

## Reference and coverage

The public samples identify Chart.js **4.6.1**. Source inspection uses the matching [v4.6.1 tag](https://github.com/chartjs/Chart.js/tree/v4.6.1), commit `76d8cf895a7485dc838c90ef37e2bc9d9e388fcb`.

There are 75 runnable sample Markdown files plus the information and utility pages. The source inventory covers all 75: advanced (7), animations (5), area (5), bar (6), legend (5), line (7), other chart families (12), plugins (3), scale options (4), scales (8), scriptable options (6), subtitle (1), title (1), and tooltip (5). Inventory is not a claim that every sample has been manually exercised.

The [machine-readable inventory](./chartjs-sample-inventory.json) identifies every page and its public URL. Sixteen selected pages were opened in Chrome: grouped stacks, bubble, radar, polar area, combined bar/line, stacked area, interpolation, multi-axis line, data decimation, time scale, doughnut, pie, scatter, external HTML tooltip, HTML legend and stepped line. The sections below say which interactions were actually exercised. This is targeted browser coverage, not an exhaustive cross-browser audit of Chart.js.

Native Chrome and its actual DevTools UI are used for browser investigation. The browser-extension debugger reported unattached; native Console, screenshots and device emulation work. No permissions or security settings were changed. Screenshots captured through DevTools contain the public page, without the user's browser tab bar.

## Verified browser observations

### Grouped positive and negative stacks

[Sample](https://www.chartjs.org/docs/latest/samples/bar/stacked-groups.html).

- Multiple stack IDs share each category. Positive and negative accumulation use the same zero baseline.
- Clicking the first legend item hides that dataset, strikes its legend text, and recalculates the y domain. In the observed data the domain changed from approximately -150–200 to -100–100. Visibility and inspection therefore need different semantics in our API; selecting or focusing a series must not silently change the scale.
- A mark tooltip identifies category, dataset and value together. Its content is drawn inside the canvas and does not appear as accessible tooltip text in the inspected accessibility tree.
- DevTools measured an approximately 631 × 316 CSS-pixel canvas with a 1262 × 631 backing store at devicePixelRatio 2. Subsequent desktop runtime measurements returned a fractional height of 315.8 CSS pixels; backing-store rounding should not be mistaken for a second data scale.
- This sample canvas has no role, accessible name, keyboard tab stop or fallback content. This is a property of the inspected sample, not a claim that Chart.js cannot be integrated accessibly.

### Bubble at a verified mobile viewport

[Sample](https://www.chartjs.org/docs/latest/samples/other-charts/bubble.html).

- DevTools verified `innerWidth=390`, `innerHeight=844`, no document overflow, and a 342 × 171 CSS-pixel canvas backed by 684 × 342 pixels.
- Its title, legend and axes share that fixed-ratio canvas. A growing legend can therefore compete with the evidence for height. Our layout must keep a minimum useful plot height independently of legend wrapping.
- The demo action is an anchor without an href, with tabindex 0. We will use actual buttons for actions. Native keyboard and touch behavior must be tested, not inferred from a button-like appearance.
- Rapid pointer clicks in mobile emulation changed the visual viewport scale to about 1.22 and did not establish the intended six-series state. That attempt is not counted as successful dataset-interaction coverage.
- After resetting emulation to a verified visual scale of 1, four calls to the public demo's Add Dataset action through DevTools produced six datasets. The canvas remained 342 × 171; its legend occupied 54 pixels and its actual plot was only **54.2 pixels high**. This was a controlled programmatic action, not a successful native touch test.

### Cartesian layout, interpolation and radial families

| Inspected sample | Viewport | Runtime observation | BOE implication |
| --- | --- | --- | --- |
| Combined bar/line | 390 × 844 | 342 × 171 canvas, 56.3px plot height; monthly labels rotate | Share one coordinate system, but protect plot height before placing labels/legend |
| Stacked area | 390 × 844 | 342 × 171 canvas, **12.2px plot height**; four-series legend and axis names consume the canvas | Minimum plot height must exclude all surrounding text |
| Interpolation | 390 × 844 | 342 × 171 canvas, **9.8px plot height**, 76px legend | Long series labels must wrap outside the plot budget |
| Same interpolation sample | 958 × 738 | 631 × 315.8 canvas, 198.6px plot height, 32px legend; missing point remains a gap | A desktop success does not establish mobile acceptance; preserve gaps in every interpolation mode |
| Radar | 390 × 844 | 342px square canvas, 275.6px chart area, common 0–100 radial scale | Square geometry helps, but axis labels still need wrapping and comparable units |
| Polar area | 390 × 844 | 342px square canvas, 253.6px chart area, two-row legend | Keep equal-angle sectors and disclose what radius or area encodes |
| Scatter | 958 × 738 | Independent numeric x/y scales, two seven-point datasets; no connecting line | Reuse Cartesian layout without inheriting line ordering requirements |
| Multi-axis line | 958 × 738 | Left domain -80–100; right -80–80 for the observed random data; only one grid set | Distinct units and visible series-to-axis association are essential; crossings alone do not prove equality |
| Time scale | 958 × 738 | Calendar day ticks Oct 30–Nov 13 and irregularly spaced point data | Generate calendar ticks, preserve elapsed-time spacing and disclose the time zone |

At the tiny mobile interpolation height, the y domain expanded to -1,000–1,000 with one visible tick. At desktop size it was -50–200 with 50-unit ticks. This is a verified sample-layout failure under this viewport, not an assertion that every Chart.js integration behaves that way.

The stepped-line demo's middle-step action was exercised through its public action in DevTools; runtime reported `stepped: "middle"` and the rendered path changed to midpoint transitions. Before/after/middle have different meanings for when a measured state becomes effective. They are not interchangeable decorative styles. Linear remains our default, monotone smoothing is an explicit option, and missing values split the path.

### Donut denominator and semantic HTML

In the doughnut example, runtime confirmed a 50% cutout. Hiding the first slice through the chart's data-visibility API changed the total from 136.31687242 to 101.26714677; the largest slice changed from about 199° to 267.8°. This illustrates deliberate renormalization to the visible subset. BOE's inspection/selection must keep the original denominator; if a host filters categories, the resulting denominator and omitted categories must be disclosed.

The pie example confirmed a zero inner radius and the same arc family. Its desktop canvas was 631 × 631.6 CSS pixels, much larger than a Cartesian sample. BOE can share the sector mathematics and data contract while capping the radial visual's useful size and keeping its exact-value table alongside it on wide layouts.

A real pointer interaction with the external HTML tooltip example exposed an April table containing both dataset values (88 and -26) in Chrome's accessibility tree. The canvas tooltip inspected earlier did not expose that text. HTML is a useful semantic layer, but this does not establish keyboard or screen-reader acceptance: keyboard activation, dismissal, focus association, touch and persistent exact-data access remain separate requirements.

The HTML legend sample renders clickable `li` items and recreates them after updates. Its source does not give those items native button semantics or keyboard handlers. Reusing the built-in legend model is valuable; copying those control semantics or discarding focused controls on every update is not appropriate for BOE.

### DevTools performance and network evidence

Chrome Performance recorded a reload of the public 100,000-point decimation example with CPU/network throttling off and cache enabled. In the selected 0–2.46s range, the panel showed 686ms scripting, 65ms rendering and 17ms painting; LCP was 0.95s. Those are **whole documentation-page observations**, including VuePress, analytics and installed extension work. They are not a chart-only load benchmark and should not be used as a performance promise.

For a narrower comparison, the Console ran nine synchronous `chart.update('none')` calls per mode, after one unmeasured warm-up, against the same already-loaded 100,000-point source. Page viewport was 958 × 738, canvas 631 × 315.8 CSS pixels, DPR 2, animations disabled, no throttling. Results in milliseconds:

| Mode | Rendered points | Minimum | Median | Maximum |
| --- | ---: | ---: | ---: | ---: |
| None | 100,000 | 9.1 | 10.4 | 11.9 |
| Min/max | 2,509 | 2.0 | 2.6 | 4.0 |
| LTTB, 50 | 50 | 1.1 | 1.6 | 6.5 |
| LTTB, 500 | 500 | 1.1 | 1.2 | 1.5 |

These are one-machine warm-update measurements in a fixed sequence, with DevTools and browser extensions present. They exclude presentation/GPU completion, initial parsing/loading, repeated-run statistical confidence and long-session memory retention. The 50-point result is not evidence that fewer points always makes a faster update. The source's rare-peak generator also uses `Math.random`; comparison kept the same instance to avoid regenerating different input.

The Network panel showed many cached numbered JavaScript chunks. A runtime DOM check found 267 prefetch links; resource timing contained 248 first-party entries, 246 initiated as links. The observed 303 total requests and roughly 4.49MB of resources include docs, prefetch, analytics and extensions. **They are not the size or request count of the Chart.js package.** Package imports must be evaluated separately: Chart.js supports importing only required controllers/elements/scales/plugins, while `chart.js/auto` registers the complete family.

## Source-backed architecture lessons

### Separate data, scales, marks, interaction and layout

Chart.js separates [dataset controllers](https://github.com/chartjs/Chart.js/tree/v4.6.1/src/controllers), [scales](https://github.com/chartjs/Chart.js/tree/v4.6.1/src/scales), [interaction modes](https://github.com/chartjs/Chart.js/blob/v4.6.1/src/core/core.interaction.js), and [plugins](https://github.com/chartjs/Chart.js/tree/v4.6.1/src/plugins). The lesson for BOE is shared typed geometry and layout, not a fresh set of unrelated rendering rules in every component.

The new families should share:

- finite-domain calculations, explicit axes, numeric/calendar ticks and measurement;
- stable series IDs, token colors, line patterns and point styles;
- hover/focus/selection state with clear ownership and refresh behavior;
- exact-data tables, state messaging and legends built from the same normalized records;
- resize lifecycle, minimum plot dimensions, clipping rules and integrity disclosures.

DOM/SVG rendering remains the initial fit for BOE's labels, accessible inspection and ordinary business-chart instance counts. Dense-data budgets will be measured rather than assumed. A new runtime dependency or Canvas renderer is not yet selected merely because the reference library uses it.

### Interaction is a contract

Chart.js has distinct nearest, index, dataset, point, x and y modes, with a separate intersection requirement. Its [index implementation](https://github.com/chartjs/Chart.js/blob/v4.6.1/src/core/core.interaction.js) collects the same array index across datasets. BOE numeric series can have different x positions, so synchronized inspection must match actual x values or explicitly disclose nearest-time matching. Equal array indices must not be presented as equal measurements.

BOE should preserve keyboard focus, use native HTML legend controls, distinguish focus from selected data, retain host-controlled IDs through reorder/refresh, and give touch users an inspection path that does not require hover. Canvas-only interactions in a reference sample are not sufficient evidence of keyboard support.

Chart.js's [point element](https://github.com/chartjs/Chart.js/blob/v4.6.1/src/elements/element.point.ts) separates visible radius from hit radius and computes geometric hit tests. BOE should likewise avoid making a small dot the only usable pointer target. Nearest-point inspection must have a bounded, explicit rule; overlapping scatter points need an exact table or a disambiguation list rather than an arbitrary inaccessible winner.

### Preserve source data and missingness

The [decimation sample](https://github.com/chartjs/Chart.js/blob/v4.6.1/docs/samples/advanced/data-decimation.md) uses 100,000 points, disables animation and parsing, and demonstrates min/max and LTTB reduction. Source inspection establishes that workload; it does not establish a measured render time.

The [decimation API](https://github.com/chartjs/Chart.js/blob/v4.6.1/docs/configuration/decimation.md) has explicit constraints and retains original data while exposing a reduced view through a mutable dataset object. BOE's host-driven contract should instead derive a separate rendering view, leave host arrays untouched, calculate domains from the appropriate full data, preserve gaps and peaks, and expose every exact source value through a bounded/paginated table when necessary. Sampling or simplification must be disclosed.

`spanGaps` is an analytical choice. A performance optimization must not silently connect missing intervals. Smoothed interpolation must remain opt-in and should preserve monotonicity where that is its contract.

### Encoding needs units and declared meaning

The [bubble controller](https://github.com/chartjs/Chart.js/blob/v4.6.1/src/controllers/controller.bubble.js) treats the supplied r as a rendered radius. BOE should make clear whether a third value controls radius or area, show its unit and size key, and avoid giving a value-to-area impression with a value-to-radius mapping.

[Polar area](https://github.com/chartjs/Chart.js/blob/v4.6.1/src/controllers/controller.polarArea.js) uses the radial scale's distance mapping. BOE must declare and test the chosen radius/area encoding rather than relying on the name of the chart. Radar axes also need meaningful comparable scales; arbitrary mixed-unit metrics must not be silently normalized into a visual score.

For dual axes, units, axis association and independent domains must be visible. For pie variants, denominator, zero values, unknown categories, rounding, visibility and selection remain explicit.

The doughnut controller sums absolute magnitudes, including negative values. This is a generic drawing-library behavior, not a suitable financial/business part-to-whole default: BOE should reject a negative pie snapshot with an explanation and exact data rather than silently turn debt into a positive share.

The [time scale](https://github.com/chartjs/Chart.js/blob/v4.6.1/src/scales/scale.time.js) delegates calendar arithmetic to a date adapter, aligns ticks to calendar units and bounds tick generation to prevent runaway work. The [time-series scale](https://www.chartjs.org/docs/latest/axes/cartesian/timeseries.html) deliberately spaces observations equally instead. Our elapsed-time axis must not silently substitute equal observation spacing. Month lengths, leap days, DST boundaries and ambiguous local labels require explicit tests and a visible zone.

### Responsive behavior is more than width

Chart.js [observes the container and pixel density](https://github.com/chartjs/Chart.js/blob/v4.6.1/src/platform/platform.dom.js), batches resize work, handles scrollbar feedback, and skips zero-sized hidden containers. BOE should cover hidden-to-visible, reparenting, repeated mounting, text zoom, density changes, and cleanup. Legends and labels should wrap outside a protected minimum plot area; mobile should not merely shrink a desktop canvas.

### Accessibility belongs in the product layer

Chart.js [documents host responsibility for canvas accessibility](https://github.com/chartjs/Chart.js/blob/v4.6.1/docs/general/accessibility.md). Its [HTML legend sample](https://github.com/chartjs/Chart.js/blob/v4.6.1/docs/samples/legend/html.md) demonstrates extraction of legend content, but its clickable list items are not a native keyboard-control implementation.

BOE must ship accessible names, factual summaries, native controls, exact-data fallback, redundant encodings, focus continuity and reduced-motion behavior by default. Automated accessibility results will remain separate from actual manual screen-reader coverage.

### Visual polish is consistent behavior at small details

The strongest reusable lessons are consistent stroke weights, mark/legend identity, orderly clipping, one shared plot rectangle, explicit interpolation and predictable interactive feedback. The [bar element](https://github.com/chartjs/Chart.js/blob/v4.6.1/src/elements/element.bar.js) limits corner radii to the actual rectangle, handles skipped borders and controls inflation to avoid seams. The [arc element](https://github.com/chartjs/Chart.js/blob/v4.6.1/src/elements/element.arc.ts) handles full circles, borders, small arcs and rounded-corner constraints. These edge cases distinguish a family of production components from a collection of attractive happy-path SVGs.

BOE should use thin, secondary grid rules; stronger but restrained data strokes; tabular numeric labels; common axis spacing; and the same swatch/line/marker identity in plot, legend, inspection and table. Preserve Box blue and the existing neutral palette. Color does not by itself mean selected, positive, successful or comparable. Use deterministic, meaningful fixtures instead of the reference demos' random values so the answer and interaction can be judged and reproduced.

### Configuration power has a maintenance cost

Chart.js supports per-chart/per-dataset defaults, indexed values, scriptable functions, global registration and lifecycle plugins. That is appropriate for a general drawing engine. BOE should learn from its separation of concerns without exposing an equally large untyped configuration bag through web-component attributes.

Use small typed contracts for data, axes, references and presentation. Shared internals should make marks composable without forcing every consumer to understand a plugin lifecycle. Per-component entrypoints should remain selective, SSR-safe imports; do not import the entire chart family from an individual chart. If source code is adapted rather than independently implemented, retain the required MIT attribution.

The [destroy lifecycle](https://github.com/chartjs/Chart.js/blob/v4.6.1/src/core/core.controller.js) stops animation, destroys dataset metadata, clears caches, removes listeners, releases the context and unregisters the instance. Our observer/event/animation cleanup needs the same deliberate ownership, including repeated mount/unmount and hidden-to-visible behavior.

## What changes in BOE as a result

This is an implementation decision record, not completed work:

| Priority | Concrete change | Acceptance evidence |
| --- | --- | --- |
| First | Share Cartesian scales, plot layout, axis association and native legend/inspection/table primitives | Bar, line, scatter and mixed plots align under the same data/domain; no copied layout constants drifting across components |
| First | Protect a 12rem minimum plot block size independently of title, axes, legend and status | 390px, long labels, six series, text zoom; no plot reduced to a strip |
| First | Separate focus/inspection, host selection and host filtering | Repeated pointer/keyboard/touch inspection keeps domain/order/denominator stable; explicit reset and refresh behavior |
| First | Keep full input immutable, normalize once and build an optional reduced rendering view | Frozen-data tests, peaks/gaps/domain tests, bounded table DOM and dense-data timing |
| Next | Add grouped/signed stacks, scatter/bubble, area and mixed marks through shared typed geometry | Zero baseline, separate positive/negative accumulation, irregular x alignment, exact table parity |
| Next | Share donut/pie sector geometry and radial measurement for radar/polar | Fixed denominator, negative/unknown/zero handling, long labels, declared size/radius/area encoding |
| Next | Add line modes and calendar/dual-axis support through explicit scale contracts | No smoothing across nulls; no new extrema in monotone mode; axis units and calendar/zone boundaries tested |
| Throughout | Keep all seven framework examples equally complete | Real data, equivalent behavior and state/event handling compile in each framework |

The current numeric-line implementation already protects plot height and matches table values by actual x, both worth preserving. It currently builds the entire table even while hidden and constructs a path from every input point; source inspection flags these as dense-data risks to measure, not measured regressions. New families should not multiply that cost by cloning the implementation.

Initial implementation remains native SVG/HTML with shared pure geometry and a semantic HTML layer. Chart.js is a useful alternative if actual BOE dense-workload measurements justify Canvas, but the timings above do not compare it with BOE. Introducing it now would still require SSR/import, token styling, accessible inspection, immutable-data adaptation, release-size and seven-framework compatibility work. Neither renderer is a substitute for the product contracts above.

Dense-case targets are to be evaluated on documented hardware rather than silently treated as already passed: keep individual hover/keyboard work below a frame budget where practical, bound visible marks by pixel density, preserve all source values through paginated exact access, and measure 1k/10k/100k sources across 1 and 10 mounted charts. Rendering 100k SVG nodes or 100k hidden table rows is not an acceptable fallback.

## Approved implementation scope

The user's execution request covers:

1. Grouped bars and grouped stacks, including positive/negative values.
2. Scatter and bubble families.
3. Area and stacked area.
4. Combined bar/line charts.
5. A pie variant sharing the donut family.
6. Radar and polar area.
7. Stepped and smooth/monotone line options, multiple y axes, and calendar-aware time axes.

Styling-only samples, custom plugin APIs, animation demonstrations, gradients and arbitrary user-supplied JavaScript are not automatically additional chart types. They inform the design but do not become an unbounded configuration bag.

## Technical design and acceptance gates

- Target: reusable, provider-neutral web components; approximately 1–10 simultaneously mounted charts in a business page. Measure dense fixtures separately.
- Retain the approved white/navy/cool-gray/Box-blue visual language, compact shell and optional summaries. Avoid mandatory giant KPIs or decorative fills.
- Define typed input schemas and pure derived geometry before rendering. Preserve existing public APIs and defaults; document intentional new modes.
- Host owns data loading, definitions, persisted filters and source notes. Ephemeral hover/focus stays local; selections, if introduced, use explicit controlled IDs and events. No implicit URL or storage writes.
- Expose core/flat exports and native framework types; provide equivalent canonical examples for all seven frameworks, including rich data and state variants.
- Verify mathematical encodings, negative/zero/missing data, invalid snapshots, calendar boundaries, log-domain errors, units and references.
- Exercise actual keyboard/touch flows, repeated inspection/reset, outside-focus handoff, refresh/remove/reorder, hidden/reveal and mounting lifecycle.
- Review actual desktop/mobile pixels in light/dark, at 390px and enlarged text, with long labels and dense data. Passing tests do not by themselves establish design quality.
- Run the repository aggregate checks, docs/Workshop and framework compilation, packed consumers, conformance and strict visual regression. No package release is included in this implementation phase.

## Limits and next implementation gate

The review completed the source inventory, targeted native Chrome/device/Console investigation, an actual Performance reload recording and Network inspection. It did not manually exercise every sample, establish a clean-profile multi-device performance benchmark, or perform screen-reader testing. Device emulation is not a physical-phone test. Failed pointer attempts, private Vue accessor mistakes and accidental search-field focus during investigation are test-harness limitations, not Chart.js defects; subsequent measurements used the actual chart instance and verified viewport.

The implementation now lives locally on `feat/chart-family-coverage`; see [the chart-family contract](./chart-family.md). This research report is not a claim that implementation verification or publication has completed. Convert the decisions into shared code and focused regression tests, then validate actual BOE pixels and interactions before expanding the family. No additional image-generation redesign cycle or package release is implied.
