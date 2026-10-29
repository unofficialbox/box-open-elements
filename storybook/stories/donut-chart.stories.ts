import { storageChartHtml, dataStateVariants } from "../fixtures/insights.js";
import type { StoryModule } from "../metadata.js";

const donutChart: StoryModule = {
  title: "Patterns/Insights/Donut Chart",
  meta: {
    id: "donut-chart",
    tag: "box-donut-chart",
    shortDescription: "A segmented donut chart for proportional summaries.",
    docsDescription: "Pass JSON `segments` and `actions`; use string attributes for heading, summary, timeframe, and message.",
    sourceSnippet: storageChartHtml,
    referenceRows: [
      {kind:"attribute",name:"category-label",type:"string",description:"Header for the category column, such as File type."},
      { kind: "attribute", name: "readonly", type: "boolean", description: "Static ring and semantic table without selection buttons; recommended for composition." },
      { kind: "attribute", name: "unit", type: "string", description: "Unit displayed with total and table value header." },
      { kind: "attribute", name: "total", type: "number", description: "Optional fixed denominator, including unclassified storage. Never less than classified sum." },
      { kind: "attribute", name: "total-label", type: "string", description: "Meaning of the center total." },
      { kind: "attribute", name: "note", type: "string", description: "Source, coverage and rounding caveats." },
      { kind: "attribute", name: "state", type: "string", description: "ready, loading, error, partial or stale." },
      { kind: "attribute", name: "status-message", type: "string", description: "Host status and cache timestamp." },
      { kind: "attribute", name: "heading", type: "string", description: "Chart heading." },
      { kind: "attribute", name: "summary", type: "string", description: "Center summary value." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting copy." },
      { kind: "attribute", name: "timeframe", type: "string", description: "Timeframe label." },
      { kind: "attribute", name: "segments", type: "json", description: "Donut segment data." },
      { kind: "attribute", name: "actions", type: "json", description: "Chart action buttons." },
      { kind: "event", name: "segment-selected", description: "Emitted when a segment is selected." },
      { kind: "event", name: "action", description: "Emitted when an action is selected." },
    ],
  },
  variants: dataStateVariants(storageChartHtml,"box-donut-chart"),
};

export default donutChart;
