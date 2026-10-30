import type { StoryModule } from "../metadata.js";
import { chartFamilyExamples, chartFamilyVariants, cartesianReferenceRows } from "../fixtures/chart-family.js";
const html = chartFamilyExamples["grouped-bar-chart"];
const story: StoryModule = {
 title: "Patterns/Insights/Grouped Bar Chart",
 meta: { id: "grouped-bar-chart", tag: "box-grouped-bar-chart", shortDescription: "Grouped Bar Chart with exact values and host-owned data.", docsDescription: "Shared scales and stable inspection preserve context. All values are illustrative; missing observations are never zero. Keyboard-accessible controls and exact data accompany the visual.", sourceSnippet: html, referenceRows: [...cartesianReferenceRows] },
 variants: chartFamilyVariants("grouped-bar-chart"),
};
export default story;
