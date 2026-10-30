import type {StoryModule} from "../metadata.js";
import {stackedBarsHtml} from "../fixtures/analytic-charts.js";
const story:StoryModule={
 title:"Patterns/Insights/Stacked Bar Chart",
 meta:{id:"stacked-bar-chart",tag:"box-stacked-bar-chart",shortDescription:"Compare what each total is made of.",docsDescription:"Ordered segments share a scale, category legend and exact-value table. Tiny segments remain inspectable; shares are rounded and no absent amount is inferred.",sourceSnippet:stackedBarsHtml,referenceRows:[
  {kind:"property",name:"bars",type:"StackedBar[]",description:"Stable bar IDs, labels, optional totalLabel, and ordered segments with ID, label, value and optional tone."},
  {kind:"attribute",name:"orientation",type:"horizontal | vertical",description:"Vertical columns on wide hosts; narrow layouts keep labels above horizontal bars."},
  {kind:"property",name:"format",type:"(value: number) => string",description:"Host formatter for ticks, amounts and totals."},
  {kind:"property",name:"seriesTokens",type:"Record<string, string>",description:"Map stable segment IDs to CSS token names for color consistency across charts."},
  {kind:"attribute",name:"state",type:"ready | loading | error | partial | stale",description:"Data availability, separate from a measured zero."},
  {kind:"attribute",name:"status-message",type:"string",description:"Host-supplied state detail, including cache time or coverage."},
 ]},variants:[{name:"Default",html:stackedBarsHtml},{name:"Vertical",html:stackedBarsHtml.replace('<box-stacked-bar-chart ','<box-stacked-bar-chart orientation="vertical" ')},{name:"Loading",html:stackedBarsHtml.replace('<box-stacked-bar-chart ','<box-stacked-bar-chart state="loading" ')},{name:"No observations",html:'<box-stacked-bar-chart heading="Where tokens go"></box-stacked-bar-chart>'}]
};export default story;
