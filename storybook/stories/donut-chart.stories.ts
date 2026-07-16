import type { StoryModule } from "../metadata.js";

const donutChart: StoryModule = {
  title: "Patterns/Insights/Donut Chart",
  meta: {
    id: "donut-chart",
    tag: "box-donut-chart",
    shortDescription: "A segmented donut chart for proportional summaries.",
    docsDescription: "Pass JSON `segments` and `actions`; use string attributes for heading, summary, timeframe, and message.",
    sourceSnippet: `<box-donut-chart heading="Storage by type" segments='[{"id":"docs","label":"Documents","value":46}]'></box-donut-chart>`,
    referenceRows: [
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
  variants: [
    {
      name: "Default",
      html: `<box-donut-chart heading="Storage by type" summary="100%" timeframe="Current" message="Storage distribution by content category." segments='[{"id":"docs","label":"Documents","value":46},{"id":"media","label":"Media","value":32},{"id":"other","label":"Other","value":22}]' actions='[{"id":"open-breakdown","label":"Open breakdown","tone":"primary"}]'></box-donut-chart>`,
    },
  ],
};

export default donutChart;
