import type { StoryModule } from "../metadata.js";

const barChart: StoryModule = {
  title: "Patterns/Insights/Bar Chart",
  meta: {
    id: "bar-chart",
    tag: "box-bar-chart",
    shortDescription: "A bar chart panel for discrete activity counts.",
    docsDescription: "Pass JSON `points`, `legend`, and `actions`; use string attributes for heading, summary, timeframe, and message.",
    sourceSnippet: `<box-bar-chart heading="Uploads per week" timeframe="Last 5 weeks" points='[{"id":"w1","label":"W1","value":42}]'></box-bar-chart>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Chart heading." },
      { kind: "attribute", name: "summary", type: "string", description: "Headline value." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting copy." },
      { kind: "attribute", name: "timeframe", type: "string", description: "Timeframe label." },
      { kind: "attribute", name: "points", type: "json", description: "Bar point data." },
      { kind: "attribute", name: "legend", type: "json", description: "Legend items." },
      { kind: "attribute", name: "actions", type: "json", description: "Chart action buttons." },
      { kind: "event", name: "point-selected", description: "Emitted when a bar is selected." },
      { kind: "event", name: "action", description: "Emitted when an action is selected." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-bar-chart heading="Uploads per week" summary="71 uploads" timeframe="Last 5 weeks" message="Steady growth across the quarter." points='[{"id":"w1","label":"W1","value":42},{"id":"w2","label":"W2","value":51},{"id":"w3","label":"W3","value":48},{"id":"w4","label":"W4","value":64},{"id":"w5","label":"W5","value":71}]' legend='[{"label":"Uploads","tone":"brand"}]' actions='[{"id":"open-report","label":"Open report","tone":"primary"}]'></box-bar-chart>`,
    },
  ],
};

export default barChart;
