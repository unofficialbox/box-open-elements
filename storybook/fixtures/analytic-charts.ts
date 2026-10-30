export const compositionBars = [
  {id:"coding",label:"Coding agent · document in context",segments:[{id:"tools",label:"Tool definitions",value:20237},{id:"document",label:"Document payload",value:18624},{id:"retries",label:"Retries",value:117}]},
  {id:"extraction",label:"Direct extraction",segments:[{id:"tools",label:"Tool definitions",value:539},{id:"document",label:"Document payload",value:2400},{id:"retries",label:"Retries",value:0}]},
  {id:"cached",label:"Agent with cached context",segments:[{id:"tools",label:"Tool definitions",value:539},{id:"document",label:"Document payload",value:8800},{id:"retries",label:"Retries",value:42}]},
];
export const rangeRows = [
  {id:"cache",label:"Prompt caching",ranges:[{id:"before",label:"Before",low:12,high:58},{id:"after",label:"After",low:8,high:32,value:18}]},
  {id:"tools",label:"Tool selection",ranges:[{id:"before",label:"Before",low:20,high:48},{id:"after",label:"After",low:14,high:26}]},
  {id:"known",label:"Known reduction",ranges:[{id:"before",label:"Before",low:10,high:10},{id:"after",label:"After",low:12,high:12}]},
];
export const numericSeries = [
  {id:"direct",label:"Direct extraction",summary:"Flat at 539 tokens from 2,250 to 194,000 characters.",points:[{x:2250,y:539},{x:12000,y:539},{x:48000,y:539},{x:96000,y:539},{x:194000,y:539}]},
  {id:"agent",label:"Agent",points:[{x:2250,y:310},{x:12000,y:720},{x:48000,y:2200},{x:96000,y:4100},{x:194000,y:8800}]},
  {id:"cache",label:"Cached agent",points:[{x:2250,y:580},{x:12000,y:620},{x:48000,y:780},{x:96000,y:1100},{x:194000,y:1700}]},
];
export const numericMarkers = [{id:"sample",axis:"x",value:48000,label:"Measured sample"},{id:"threshold",axis:"y",value:2000,label:"Illustrative comparison"}];
export const findingsData = {
  findings:["The cached agent reduced repeated context for this illustrative sample.","Tool definitions account for 52% of the uncached coding-agent total.","The direct extraction estimate remains flat across the sampled document sizes."],
  corrections:[{field:"Cached token count",was:"539 total tokens",now:"539 tool-definition tokens plus document payload",why:"The first estimate omitted the document payload."},{field:"Comparison scope",was:"All requests",now:"The three illustrative lanes shown here",why:"This example does not establish performance for other workloads."}],
  limits:["Illustrative data; not a measured production benchmark."],
};
const json=(value:unknown)=>JSON.stringify(value).replaceAll("&","&amp;").replaceAll("'","&#39;");
export const stackedBarsHtml=`<box-stacked-bar-chart heading="Where tokens go" description="Illustrative composition per request · totals share one scale" unit="tokens" bars='${json(compositionBars)}'></box-stacked-bar-chart>`;
export const rangesHtml=`<box-range-chart heading="Estimated savings" description="Illustrative bounds, not measured savings. Dots mark supplied estimates; no midpoint is inferred." unit="%" rows='${json(rangeRows)}'></box-range-chart>`;
export const numericLineHtml=`<box-line-chart heading="Tokens across document sizes" message="Illustrative model · reference markers identify a sample and comparison, not an SLO" x-label="Characters" y-label="Tokens" series='${json(numericSeries)}' markers='${json(numericMarkers)}'></box-line-chart>`;
export const findingsHtml=`<box-findings-disclosure heading="What this comparison establishes" findings='${json(findingsData.findings)}' corrections='${json(findingsData.corrections)}' limits='${json(findingsData.limits)}'></box-findings-disclosure>`;
