import type { StoryModule } from "../metadata.js";

const chartPanel: StoryModule = {
  title: "Patterns/Insights/Chart Panel",
  meta: {
    id: "chart-panel",
    tag: "box-chart-panel",
    shortDescription: "A generic chart panel with summary, legend, and actions.",
    docsDescription: "Pass JSON `points`, `legend`, and `actions`; use string attributes for title, summary, timeframe, and message.",
    sourceSnippet: `<box-chart-panel heading="Usage" message="Weekly rollups across the enterprise." points='[{"id":"mon","label":"Mon","value":12}]'></box-chart-panel>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Chart heading." },
      { kind: "attribute", name: "summary", type: "string", description: "Headline value." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting copy." },
      { kind: "attribute", name: "timeframe", type: "string", description: "Timeframe label." },
      { kind: "attribute", name: "points", type: "json", description: "Chart point data." },
      { kind: "attribute", name: "legend", type: "json", description: "Legend items." },
      { kind: "attribute", name: "actions", type: "json", description: "Panel action buttons." },
      { kind: "event", name: "point-selected", description: "Emitted when a chart point is selected." },
      { kind: "event", name: "action", description: "Emitted when an action is selected." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-chart-panel heading="Usage" summary="89%" timeframe="Last 7 days" message="Weekly rollups across the enterprise." points='[{"id":"mon","label":"Mon","value":12},{"id":"tue","label":"Tue","value":18},{"id":"wed","label":"Wed","value":24,"tone":"accent"}]' legend='[{"label":"Usage","tone":"brand","value":"89%"}]' actions='[{"id":"open-report","label":"Open report","tone":"primary"}]'></box-chart-panel>`,
    },
  ],
};

export default chartPanel;
