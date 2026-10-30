import type { StoryModule } from "../metadata.js";
import { chartFamilyExamples, chartFamilyVariants, cartesianReferenceRows } from "../fixtures/chart-family.js";
const html = chartFamilyExamples["scatter-chart"];
const story: StoryModule = {
 title: "Patterns/Insights/Scatter Chart",
 meta: { id: "scatter-chart", tag: "box-scatter-chart", shortDescription: "Scatter Chart with exact values and host-owned data.", docsDescription: "Shared scales and stable inspection preserve context. All values are illustrative; missing observations are never zero. Keyboard-accessible controls and exact data accompany the visual.", sourceSnippet: html, referenceRows: [...cartesianReferenceRows] },
 variants: chartFamilyVariants("scatter-chart"),
};
export default story;
