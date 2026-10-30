import {numericLineHtml} from "../fixtures/analytic-charts.js";
import { periodChartHtml, periodVariants } from "../fixtures/insights.js";
import type { StoryModule } from "../metadata.js";

const lineChart: StoryModule = {
  title: "Patterns/Insights/Line Chart",
  meta: {
    id: "line-chart",
    tag: "box-line-chart",
    shortDescription: "A trend chart for activity over time.",
    docsDescription: "Pass JSON `points`, `legend`, and `actions`; use string attributes for heading, summary, timeframe, and message.",
    sourceSnippet: periodChartHtml("line-chart"),
    referenceRows: [
      {kind:"property",name:"series",type:"LineChartSeries[]",description:"Opt into numeric multi-series mode. Ordered x/y points, stable IDs and optional host summaries; remove the attribute to return to categorical points."},
      {kind:"property",name:"markers",type:"LineChartMarker[]",description:"Labelled x/y references supplied by the host, including crossover markers."},
      {kind:"attribute",name:"x-scale",type:"linear | log",description:"Numeric x spacing; logarithmic axes require positive values."},
      {kind:"attribute",name:"y-scale",type:"linear | log",description:"Shared y scale; logarithmic axes require positive values."},
      {kind:"property",name:"xFormat / yFormat",type:"(value: number) => string",description:"Independent host axis/value formatters."},
      {kind:"property",name:"seriesTokens",type:"Record<string, string>",description:"Stable series IDs mapped to CSS token names."},
      { kind: "attribute", name: "selected-id", type: "string", description: "Selected point ID. Clear selection returns inspection to the latest interval." },
      { kind: "attribute", name: "unit", type: "string", description: "Visible value-axis unit." },
      { kind: "attribute", name: "x-label", type: "string", description: "Category/interval axis label." },
      { kind: "property", name: "domain", type: "number[]", description: "Optional minimum/maximum bounds. Data is never silently clipped." },
      { kind: "attribute", name: "state", type: "string", description: "ready, loading, error, partial, or stale. Pass [] for no observations; null values preserve missing intervals." },
      { kind: "attribute", name: "status-message", type: "string", description: "Host-provided status, including an exact cache timestamp when stale." },
      { kind: "attribute", name: "note", type: "string", description: "Source, method, definition or coverage note." },
      { kind: "event", name: "selection-cleared", description: "Selection cleared; latest interval inspection restored." },
      { kind: "attribute", name: "heading", type: "string", description: "Chart heading." },
      { kind: "attribute", name: "summary", type: "string", description: "Optional host summary; no total is inferred for weekly users." },
      { kind: "attribute", name: "message", type: "string", description: "Supporting copy." },
      { kind: "attribute", name: "timeframe", type: "string", description: "Timeframe label." },
      { kind: "attribute", name: "points", type: "json", description: "Ordered observations; null values make line gaps. Optional partial and host-authored inspection copy." },
      { kind: "attribute", name: "legend", type: "json", description: "Legend items." },
      { kind: "attribute", name: "actions", type: "json", description: "Chart action buttons." },
      { kind: "event", name: "point-selected", description: "Emitted when a point is selected." },
      { kind: "event", name: "action", description: "Emitted when an action is selected." },
    ],
  },
  variants: [...periodVariants("line-chart"),{name:"Numeric series",html:numericLineHtml},{name:"Logarithmic series",html:numericLineHtml.replace('<box-line-chart ','<box-line-chart x-scale="log" y-scale="log" ')}],
};

export default lineChart;
