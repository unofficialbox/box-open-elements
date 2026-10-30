import type { ChartAnimationPreset } from "../../src/patterns/insights/chart-motion.js";

export const animatedChartIds = ["metric-card", "chart-panel", "bar-chart", "line-chart", "donut-chart", "box-plot", "distribution-timeline", "stacked-bar-chart", "range-chart", "grouped-bar-chart", "scatter-chart", "bubble-chart", "area-chart", "mixed-chart", "pie-chart", "radar-chart", "polar-area-chart"];

/** Same data, markup and controller in docs, Workshop and all framework tabs. */
export function withChartMotionVariants<T extends {name:string;html:string}>(id:string, variants:T[], codeHtml?:string): Array<T & {codeHtml?:string}> {
  if(!animatedChartIds.includes(id)||!variants.length)return variants;
  const base=variants[0];
  const add=(html:string,attributes:string)=>html.replace(`<box-${id}`,`<box-${id} ${attributes}`);
  const presets:Array<{name:string;preset:ChartAnimationPreset;extra?:string}>=[
    {name:"Animated entrance",preset:"auto"},
    {name:"Delayed marks",preset:"delay",extra:'animation-delay="150" animation-stagger="70"'},
    {name:"Drop entrance",preset:"drop",extra:'animation-easing="ease-in-out-elastic"'},
    {name:"Active mark loop",preset:"loop",extra:"animation-loop"},
  ];
  if(["line-chart","area-chart","mixed-chart","distribution-timeline"].includes(id))presets.push({name:"Progressive drawing",preset:"progressive"},{name:"Eased progressive drawing",preset:"progressive-easing",extra:'animation-easing="ease-in-quad"'});
  const result = [...variants,...presets.map(item=>{
    const attributes=`animated animation-preset="${item.preset}" animation-duration="1200" ${item.extra??""}`.trim();
    return {...base,name:item.name,html:add(base.html,attributes),codeHtml:add(codeHtml??base.html,attributes),note:"Animation is opt-in. Pause/replay controls are provided. Reduced motion shows the final chart immediately; exact data remains available."};
  })];
  if(id==="line-chart"){
    // Integer arithmetic keeps the authored fixture identical in V8 and JSC.
    const series=JSON.stringify([0,1].map(series=>{
      let seed=12345+series, value=100+series*35;
      const points=Array.from({length:1000},(_,i)=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;value+=seed%11-5;return {x:i,y:value};});
      return {id:`signal-${series}`,label:`Illustrative signal ${series+1}`,points};
    }));
    const html=`<box-line-chart animated animation-preset="progressive" animation-duration="5000" heading="Illustrative signals" message="Synthetic deterministic observations · 1,000 samples per series" x-label="Sample" y-label="Signal" series='${series}'></box-line-chart>`;
    result.push({...base,name:"Progressive dense series",html,codeHtml:html,note:"Source observations and exact paginated values remain available; the rendering view is bounded independently of source size."});
  }
  return result;
}
