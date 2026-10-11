import type { StoryModule } from "../metadata.js";

const metricCard: StoryModule = {
  title: "Patterns/Insights/Metric Card",
  meta: {
    id: "metric-card",
    tag: "box-metric-card",
    shortDescription: "A KPI card with optional trend.",
    docsDescription: "Surface a headline metric; pass optional JSON `trend` for delta tone/label. Cards stretch within grid and flex rows. Use `size=compact` for summary figures and `tone` to color the value independently of a status chip.",
    sourceSnippet: `<box-metric-card heading="Active shared links" value="1,284" eyebrow="Last 30 days" status="Healthy" trend='{"label":"+16.5%","tone":"success"}'></box-metric-card>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Metric title." },
      { kind: "attribute", name: "size", type: "default | compact", description: "Compact uses a small secondary heading above the value." },
      { kind: "attribute", name: "tone", type: "neutral | error | warning | success", description: "Semantic value color independent of status and trend." },
      { kind: "attribute", name: "value", type: "string", description: "Primary metric value." },
      { kind: "attribute", name: "eyebrow", type: "string", description: "Context line above the heading." },
      { kind: "attribute", name: "status", type: "string", description: "Status label." },
      { kind: "attribute", name: "trend", type: "json", description: "{ label, tone } trend chip." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting copy." },
    ],
  },
  variants: [
    {
      name: "Compact summary row",
      html: `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px"><box-metric-card size="compact" heading="Times through the steps a second, on average" value="84"></box-metric-card><box-metric-card size="compact" heading="Box calls" value="142" tone="success"></box-metric-card><box-metric-card size="compact" heading="Failed calls" value="3" tone="error"></box-metric-card></div>`,
    },
    {
      name: "Default",
      html: `<box-metric-card heading="Active shared links" value="1,284" eyebrow="Last 30 days" message="Up from 1,102 in the prior period." status="Healthy" trend='{"label":"+16.5%","tone":"success"}'></box-metric-card>`,
    },
  ],
};

export default metricCard;
