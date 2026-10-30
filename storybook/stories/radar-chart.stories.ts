import type { StoryModule } from "../metadata.js";
import { chartFamilyExamples, chartFamilyVariants } from "../fixtures/chart-family.js";
const html = chartFamilyExamples["radar-chart"];
const story: StoryModule = {
 title: "Patterns/Insights/Radar Chart",
 meta: { id: "radar-chart", tag: "box-radar-chart", shortDescription: "Radar Chart with exact values and host-owned data.", docsDescription: "Shared scales and stable inspection preserve context. All values are illustrative; missing observations are never zero. Keyboard-accessible controls and exact data accompany the visual.", sourceSnippet: html, referenceRows: [
 {kind:"attribute",name:"maximum",type:"number",description:"Optional common maximum, at least every value. Radar uses a common linear radial scale; polar sectors encode value by area."},
 {kind:"attribute",name:"selected-id",type:"string",description:"Host-controlled category or series ID; selecting never changes scale or denominator."},
 {kind:"event",name:"item-selected",description:"Emits selectedId; the host assigns it or clears with null."},
 { kind: "attribute", name: "state", type: "ready | loading | error | partial | stale", description: "Loading and errors suppress cached geometry; supply status-message with the data scope or timestamp." },
 { kind: "property", name: "series", type: "RadarSeries[]", description: "Typed host observations with stable IDs; full source values remain available." },
 ] },
 variants: chartFamilyVariants("radar-chart"),
};
export default story;
