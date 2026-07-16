import type { StoryModule } from "../metadata.js";

const lineChart: StoryModule = {
  title: "Patterns/Insights/Line Chart",
  meta: {
    id: "line-chart",
    tag: "box-line-chart",
    shortDescription: "A trend chart for activity over time.",
    docsDescription: "Pass JSON `points`, `legend`, and `actions`; use string attributes for heading, summary, timeframe, and message.",
    sourceSnippet: `<box-line-chart heading="Active users" timeframe="Last 5 weeks" points='[{"id":"w1","label":"W1","value":310}]'></box-line-chart>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Chart heading." },
      { kind: "attribute", name: "summary", type: "string", description: "Headline value." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting copy." },
      { kind: "attribute", name: "timeframe", type: "string", description: "Timeframe label." },
      { kind: "attribute", name: "points", type: "json", description: "Line point data." },
      { kind: "attribute", name: "legend", type: "json", description: "Legend items." },
      { kind: "attribute", name: "actions", type: "json", description: "Chart action buttons." },
      { kind: "event", name: "point-selected", description: "Emitted when a point is selected." },
      { kind: "event", name: "action", description: "Emitted when an action is selected." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-line-chart heading="Active users" summary="431 users" timeframe="Last 5 weeks" message="Weekly active users by reporting period." points='[{"id":"w1","label":"W1","value":310},{"id":"w2","label":"W2","value":355},{"id":"w3","label":"W3","value":348},{"id":"w4","label":"W4","value":402},{"id":"w5","label":"W5","value":431}]' legend='[{"label":"Active users","tone":"brand","value":"431"}]' actions='[{"id":"open-report","label":"Open report","tone":"primary"}]'></box-line-chart>`,
    },
  ],
};

export default lineChart;
