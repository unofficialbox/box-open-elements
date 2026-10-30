import type {StoryModule} from "../metadata.js";
import {rangesHtml} from "../fixtures/analytic-charts.js";
const story:StoryModule={
 title:"Patterns/Insights/Range Chart",
 meta:{id:"range-chart",tag:"box-range-chart",shortDescription:"Show uncertainty as explicit low-to-high spans.",docsDescription:"Capped ranges share an axis. Supply a point only when defensible; zero-width intervals remain ticks. Compare named ranges within each row and inspect the exact bounds in a native table.",sourceSnippet:rangesHtml,referenceRows:[
  {kind:"property",name:"rows",type:"RangeChartRow[]",description:"ID and label with low/high and optional value, or named ranges for same-row comparisons."},
  {kind:"property",name:"format",type:"(value: number) => string",description:"Host formatter for bounds and scale ticks."},
  {kind:"property",name:"seriesTokens",type:"Record<string, string>",description:"Map range series IDs to CSS token names."},
  {kind:"attribute",name:"unit",type:"string",description:"Unit for all bounds, widths and supplied points."},
  {kind:"attribute",name:"state",type:"ready | loading | error | partial | stale",description:"Data availability; no cached geometry during loading/error."},
 ]},variants:[{name:"Default",html:rangesHtml},{name:"Single series · no inferred midpoint",html:`<box-range-chart heading="Savings bounds" unit="%" rows='[{"id":"a","label":"Prompt caching","low":12,"high":58},{"id":"b","label":"Known value","low":35,"high":35}]'></box-range-chart>`},{name:"Loading",html:rangesHtml.replace('<box-range-chart ','<box-range-chart state="loading" ')},{name:"No observations",html:'<box-range-chart heading="Savings bounds"></box-range-chart>'}]
};export default story;
