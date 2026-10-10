import type { StoryModule } from "../metadata.js";

const traceWaterfall: StoryModule = {
  title: "Patterns/Runs/Trace Waterfall",
  meta: {
    id: "trace-waterfall", tag: "box-trace-waterfall",
    shortDescription: "Nested execution spans and comparison bars on one time axis.",
    docsDescription: "Load host-owned completed or live spans with startMs, durationMs and status. The tree grid preserves overlapping timings, keyboard navigation and collapse state; search retains matching ancestors. Hidden system spans can be revealed. Select a span to inspect Input, Response and Attributes or supply a details slot. Markers state their absolute trace time and label, including host-computed percentile markers. A comparison trace matches stable span ids and shares the same zero-based axis. The pure traceWaterfallLayout helper gives HTML reports the same row order and domain. Hosts own median/slowest/failed sample and session selection through the session slot.",
    sourceSnippet: '<box-trace-waterfall heading="Completed run"></box-trace-waterfall>',
    referenceRows: [
      { kind: "property", name: "spans", type: "TraceSpan[]", description: "Nested span records with id, parentId, label, kind, startMs, durationMs, status, optional system, markers and detail." },
      { kind: "property", name: "comparisonSpans", type: "TraceSpan[]", description: "Earlier trace matched by stable span id, on the same axis." },
      { kind: "property", name: "nowMs", type: "number", description: "Host elapsed time from trace start; extends running bars when updated." },
      { kind: "property", name: "selectedSpanId", type: "string", description: "Selected span; clear to close details." },
      { kind: "attribute", name: "show-system", type: "boolean", description: "Include system events, hidden by default." },
      { kind: "event", name: "span-selected", type: "{ spanId, span }", description: "Selection changed; host can populate the details slot." },
      { kind: "event", name: "span-toggled", type: "{ spanId, expanded }", description: "A span's children were expanded or collapsed." },
      { kind: "slot", name: "details", type: "slot", description: "Host-provided selected-span details, replacing built-in Input/Response/Attributes." },
      { kind: "slot", name: "session", type: "slot", description: "Host session or median/slowest/failed sample controls." },
    ],
  },
  variants: [{ name: "Completed run", html: '<box-trace-waterfall heading="Completed run"></box-trace-waterfall>', note: "Parallel spans overlap on a common axis; markers identify host-computed 95% times." }],
};
export default traceWaterfall;
