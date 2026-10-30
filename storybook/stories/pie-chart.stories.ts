import type { StoryModule } from "../metadata.js";
import { chartFamilyExamples, chartFamilyVariants } from "../fixtures/chart-family.js";
const html = chartFamilyExamples["pie-chart"];
const story: StoryModule = {
 title: "Patterns/Insights/Pie Chart",
 meta: { id: "pie-chart", tag: "box-pie-chart", shortDescription: "Pie Chart with exact values and host-owned data.", docsDescription: "Shared scales and stable inspection preserve context. All values are illustrative; missing observations are never zero. Keyboard-accessible controls and exact data accompany the visual.", sourceSnippet: html, referenceRows: [
 { kind: "attribute", name: "state", type: "ready | loading | error | partial | stale", description: "Loading and errors suppress cached geometry; supply status-message with the data scope or timestamp." },
 { kind: "property", name: "segments", type: "DonutChartSegment[]", description: "Typed host observations with stable IDs; full source values remain available." },
 ] },
 variants: chartFamilyVariants("pie-chart"),
};
export default story;
