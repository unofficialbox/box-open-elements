import type { StoryModule } from "../metadata.js";
import { chartFamilyExamples, chartFamilyVariants, cartesianReferenceRows } from "../fixtures/chart-family.js";
const html = chartFamilyExamples["bubble-chart"];
const story: StoryModule = {
 title: "Patterns/Insights/Bubble Chart",
 meta: { id: "bubble-chart", tag: "box-bubble-chart", shortDescription: "Bubble Chart with exact values and host-owned data.", docsDescription: "Shared scales and stable inspection preserve context. All values are illustrative; missing observations are never zero. Keyboard-accessible controls and exact data accompany the visual.", sourceSnippet: html, referenceRows: [...cartesianReferenceRows] },
 variants: chartFamilyVariants("bubble-chart"),
};
export default story;
