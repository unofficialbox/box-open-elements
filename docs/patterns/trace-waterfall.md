# Trace waterfall

`box-trace-waterfall` renders host-owned nested spans on one zero-based time
axis. It supports completed sampled traces and host-driven live updates.

```ts
import { TraceWaterfall, traceWaterfallLayout } from "@unofficialbox/box-open-elements/patterns/run";
const trace = document.querySelector("box-trace-waterfall") as TraceWaterfall;
trace.spans = [
  { id: "run", label: "Upload documents", kind: "Run", startMs: 0, durationMs: 1000, status: "ok" },
  { id: "upload", parentId: "run", label: "files.upload", kind: "Action", startMs: 120, durationMs: 587, status: "failed",
    markers: [{ atMs: 900, label: "95% of calls completed" }],
    detail: { input: { file: "report.pdf" }, response: "Timed out", attributes: { attempt: 1 } } },
];
trace.comparisonSpans = previousRunSpans; // same stable ids, same axis
trace.addEventListener("span-selected", event => showCallDetails(event.detail.spanId));
```

Each span has `id`, optional `parentId`, `label`, `kind`, `startMs`, `durationMs`,
and `status` (`ok`, `failed`, `skipped`, `running`). Optional `system` spans are
hidden initially; visible descendants retain their nearest visible ancestor.
Invalid timing or duplicate ids are omitted; orphan/cyclic parent references
become roots. Input sibling order is preserved. Zero-duration spans are ticks.

Marker `atMs` values are **absolute elapsed times from trace start**, in the same
coordinate system as `startMs`; a host converts a step-relative percentile to
`startMs + percentileDuration`. Labels and exact times appear in row summaries
and the table. A marker can extend the axis beyond the sampled span. Percentile
markers describe the host's aggregate sample, not an estimate computed here.

The host owns sample selection (median, slowest, failed), session selection,
run comparison and detail transport. Put those controls in `slot="session"`.
Put a selected call console in `slot="details"`; otherwise the built-in panel
shows Input, Response and Attributes with Text/Code and previous/next controls.

For live Debug, update `spans` and `nowMs` with elapsed time from the trace start.
Running durations are `max(durationMs, nowMs - startMs)`. No timer, interpolation
or animation runs inside the element; updates preserve row focus and collapsed
state and respect reduced motion.

The tree grid uses one tab stop and Arrow Up/Down, Home/End to navigate;
Arrow Right expands or enters children and Arrow Left collapses or moves to the
parent. Enter/Space selects; Escape closes details and restores row focus.
Search reveals matching paths without changing the time domain. The table
fallback includes exact start, duration, marker and comparison values.
Below 650px container width, the label and duration share a line, with status
and the timing track beneath. Track starts and widths stay aligned across rows;
the table wraps.

HTML reports can mirror the stable layout without a browser:

```ts
const { rows, endMs } = traceWaterfallLayout(spans, { comparisonSpans });
// row order/depth/parentId define the tree; left=startMs/endMs,
// width=durationMs/endMs define both traces' bars on the shared axis.
```

Public geometry parts include `row`, `label-cell`, `label`, `timing`, `track`,
`bar`, `comparison-bar`, `marker`, `axis`, `details`, and `table`.
Theme overrides: `--boe-trace-bar`, `--boe-trace-parent-bar`, `--boe-trace-track`,
`--boe-trace-failed`, `--boe-trace-selected`; each defaults to library tokens.
Status words and distinct symbols/dashed bar shapes supplement color.

Manual screen-reader QA is deferred by Kyle; keyboard, accessibility-tree and
axe checks do not constitute a spoken-output test.

Comparison spans align by stable IDs. Spans present only in the earlier trace remain visible as comparison-only rows with outlined bars and an explicit “Not in current trace” state. Earlier markers are dashed, named as comparison markers, and included in the table and accessible summaries. Selection of these rows emits the earlier span with `comparisonOnly: true`; current rows emit `false`.

Live updates retain table-span and Trace options focus as well as row/search focus. Reaching the first or last detail moves focus to the enabled opposite navigation button.

## Plain-language hosts and embedded cards

```html
<box-trace-waterfall heading="One run" heading-level="3" embedded
  row-label="Step" rows-label="steps" search-label="Find steps" hide-note>
</box-trace-waterfall>
```

`row-label` / `rowLabel` supplies the singular column/detail/navigation noun
(default `Span`). `rows-label` / `rowsLabel` supplies its plural (default the
lowercase singular plus `s`; supply irregular plurals explicitly).
`search-label` / `searchLabel` defaults to `Search <rowsLabel>`. These labels
also apply to the table caption, accessible grid name and empty-state wording.
Labels remain escaped text. Data records and event names continue to use span
ids.

`heading-level` / `headingLevel` accepts 1–6, default 2; invalid values use 2.
Built-in detail headings follow that level, capped at 6. `embedded` removes
the panel border, radius, background and padding for a surrounding host card.
Controls and the native fullscreen dialog remain available. `hide-note` /
`hideNote` hides only the shared-axis instruction note; system-event notices,
status words, exact times and detail summaries remain available.

## Initial collapsed parents

```ts
trace.collapsed = new Set(["upload-step", "check-step"]);
trace.spans = loadedTrace;
```

The public `collapsed: ReadonlySet<string>` property matches the layout helper's
option. Assign before or after connection; it copies the supplied ids, and its
getter returns a copy. Ids supplied before their data arrives survive empty
initial renders and later comparison data. Once an id has appeared, removing it
from both current and comparison data prunes its collapsed state. Unknown ids
remain pending until they appear or the host replaces the set; Expand all clears
both active and pending ids. Search temporarily reveals matching paths without
changing this set; clearing search restores the folds. Existing keyboard and
Expand/Collapse all controls update the same state.
