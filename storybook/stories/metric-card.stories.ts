import type { StoryModule } from "../metadata.js";

const metricCard: StoryModule = {
  title: "Patterns/Insights/Metric Card",
  meta: {
    id: "metric-card",
    tag: "box-metric-card",
    shortDescription: "A KPI card with optional trend.",
    docsDescription: "Surface a headline metric; pass optional JSON `trend` for delta tone/label.",
    sourceSnippet: `<box-metric-card heading="Active shared links" value="1,284" eyebrow="Last 30 days" status="Healthy" trend='{"label":"+16.5%","tone":"success"}'></box-metric-card>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Metric title." },
      { kind: "attribute", name: "value", type: "string", description: "Primary metric value." },
      { kind: "attribute", name: "eyebrow", type: "string", description: "Context line above the heading." },
      { kind: "attribute", name: "status", type: "string", description: "Status label." },
      { kind: "attribute", name: "trend", type: "json", description: "{ label, tone } trend chip." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting copy." },
    ],
  },
  variants: [
    {
      name: "Default",
      html: `<box-metric-card heading="Active shared links" value="1,284" eyebrow="Last 30 days" message="Up from 1,102 in the prior period." status="Healthy" trend='{"label":"+16.5%","tone":"success"}'></box-metric-card>`,
    },
  ],
};

export default metricCard;
