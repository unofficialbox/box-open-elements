import type { StoryModule } from "../metadata.js";
import { chartFamilyExamples, chartFamilyVariants } from "../fixtures/chart-family.js";
const html = chartFamilyExamples["mixed-chart"];
const story: StoryModule = {
 title: "Patterns/Insights/Mixed Chart",
 meta: { id: "mixed-chart", tag: "box-mixed-chart", shortDescription: "Mixed Chart with exact values and host-owned data.", docsDescription: "Shared scales and stable inspection preserve context. All values are illustrative; missing observations are never zero. Keyboard-accessible controls and exact data accompany the visual.", sourceSnippet: html, referenceRows: [
 {kind:"property",name:"yAxes",type:"CartesianAxis[]",description:"One or two named y axes with optional explicit domains and linear/log scales. Series identify their axis by ID."},
 {kind:"attribute",name:"x-scale",type:"linear | log | time",description:"Actual coordinate spacing. Time uses epoch milliseconds and calendar-aware ticks; bars require linear zero baselines."},
 {kind:"attribute",name:"time-zone",type:"string",description:"IANA time zone for calendar ticks and exact timestamps; UTC by default."},
 {kind:"attribute",name:"interpolation",type:"linear | monotone | step-before | step-after | step-middle",description:"Opt-in curve behavior; every missing observation remains a gap."},
 {kind:"attribute",name:"stacked",type:"boolean",description:"Signed stacking with separate positive/negative accumulation. Stack IDs form groups; axes never accumulate together."},
 {kind:"attribute",name:"selected-id",type:"string",description:"Host-controlled observation ID. Inspection does not change scale, order or denominator."},
 {kind:"event",name:"point-selected",description:"Emits selectedId, point and seriesId; null requests clearing. Assign selectedId in the host to commit the selection."},
 { kind: "attribute", name: "state", type: "ready | loading | error | partial | stale", description: "Loading and errors suppress cached geometry; supply status-message with the data scope or timestamp." },
 { kind: "property", name: "series", type: "CartesianSeries[]", description: "Typed host observations with stable IDs; full source values remain available." },
 ] },
 variants: chartFamilyVariants("mixed-chart"),
};
export default story;
