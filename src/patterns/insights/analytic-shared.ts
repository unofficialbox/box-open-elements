import { chartScale } from "./chart-scale.js";
import { chartStyles } from "./chart-styles.js";

export const escapeChartText = (text: string): string => String(text).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
export function chartJson<T>(host: HTMLElement, name: string, fallback: T): T {
  try { return JSON.parse(host.getAttribute(name) ?? "null") as T ?? fallback; } catch { return fallback; }
}
export function chartArrayAttributeValid(host:HTMLElement,name:string):boolean {
  const raw=host.getAttribute(name);if(raw===null)return true;
  try{return Array.isArray(JSON.parse(raw));}catch{return false;}
}
export const categoricalColors = [
  "var(--boe-chart-series-0,color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 85%,var(--boe-token-text-text,#102347)))",
  "var(--boe-chart-series-1,var(--boe-token-text-text-secondary,#566781))",
  "var(--boe-chart-series-2,var(--boe-token-text-text,#102347))",
  "var(--boe-chart-series-3,var(--boe-token-text-status-text-success,#187657))",
  "var(--boe-chart-series-4,var(--boe-token-text-status-text-warning,#805600))",
];
/** Values are CSS token names, never arbitrary CSS supplied through HTML. */
export function categoryColor(id: string, index: number, tokens: Record<string,string>, tone?: string): string {
  const named: Record<string,string> = {primary:"--boe-token-surface-surface-brand",accent:"--boe-chart-series-2",neutral:"--boe-token-text-text-secondary",success:"--boe-token-text-status-text-success",warning:"--boe-token-text-status-text-warning",error:"--boe-token-text-status-text-error"};
  const token = tokens[id] ?? (tone?.startsWith("--") ? tone : named[tone??""]);
  const fallback = categoricalColors[index % categoricalColors.length];
  return typeof token === "string" && /^--[a-zA-Z0-9_-]+$/.test(token) ? `var(${token},${fallback})` : fallback;
}
export function analyticScale(values: number[], logarithmic = false) {
  if (!logarithmic) return chartScale(values);
  if(!values.length)return {ticks:[1,10],position:(value:number)=>Math.log10(value)};
  let observedLow=Infinity,observedHigh=-Infinity;
  for(const value of values){observedLow=Math.min(observedLow,value);observedHigh=Math.max(observedHigh,value);}
  let min=10 ** Math.floor(Math.log10(observedLow));
  let max=10 ** Math.ceil(Math.log10(observedHigh));
  if(!Number.isFinite(min)||min<=0)min=observedLow;
  if(!Number.isFinite(max))max=observedHigh;
  if(min===max){if(max<=Number.MAX_VALUE/10)max*=10;else min/=10;}
  const low=Math.log10(min),high=Math.log10(max),stride=Math.max(1,Math.ceil((high-low)/6));
  const ticks=[min];
  for(let power=Math.ceil(low);power<high;power+=stride){const value=10**power;if(value>min&&Number.isFinite(value))ticks.push(value);}
  if(ticks.at(-1)!==max)ticks.push(max);
  return {ticks,position:(value:number)=>(Math.log10(value)-low)/(high-low)};
}
export const formatAnalyticValue = (value:number):string => new Intl.NumberFormat("en",{maximumSignificantDigits:21}).format(value);
export const formatAnalyticShare = (value:number,total:number):string => {
  const percent=total?value/total*100:0;
  return percent>0&&percent<.1?"<0.1%":new Intl.NumberFormat("en",{maximumFractionDigits:1}).format(percent)+"%";
};
export const analyticStyles = chartStyles + `
[part=panel]{container-type:inline-size}h2,p{margin:0}h2{font-size:1.125rem;font-weight:650}
[part=scope],[part=note],[part=inspection],[part=status]{font-size:.8125rem;line-height:1.5;color:var(--boe-token-text-text-secondary,#566781);overflow-wrap:anywhere}
[part=legend]{display:flex;flex-wrap:wrap;gap:.5rem 1rem}
[part=legend-label]{min-inline-size:0;overflow-wrap:anywhere}
[part=legend-item]{max-inline-size:100%;min-inline-size:0;display:inline-flex;align-items:center;gap:.4rem;font-size:.8125rem}
[part=swatch]{display:inline-block;inline-size:.75rem;block-size:.75rem;background:var(--series-color);border-radius:2px;flex:none}
[part=axis]{margin-inline-start:calc(25% + .75rem);display:flex;justify-content:space-between;gap:.25rem;font-size:.6875rem;color:var(--boe-token-text-text-secondary,#566781);font-variant-numeric:tabular-nums}
[part=rows]{display:grid;gap:1.25rem}[part=row-label]{font-size:.875rem;line-height:1.5;overflow-wrap:anywhere}
[part=plot-row]{display:grid;grid-template-columns:minmax(8rem,1fr) minmax(0,3fr);gap:1rem;align-items:center}
[part=track]{position:relative;block-size:2.75rem;background:var(--boe-token-surface-surface-secondary,#f4f6f8);border-radius:2px;min-inline-size:0}
[part=table-wrap]{min-inline-size:0;overflow-x:auto;max-inline-size:100%}table{border-collapse:collapse;inline-size:100%;font-size:.8125rem;line-height:1.5;text-align:start}
caption{text-align:start;font-weight:600;padding-block-end:.5rem}th,td{padding:.5rem .4rem;border-block-end:1px solid var(--boe-token-stroke-stroke,#e8e8e8);vertical-align:top;overflow-wrap:anywhere}th{text-align:start}td{font-variant-numeric:tabular-nums}
button{font:inherit}button[part=table-toggle]{justify-self:start;appearance:none;border:1px solid var(--boe-token-stroke-stroke,#e8e8e8);background:var(--boe-token-surface-surface,#fff);color:inherit;min-block-size:2.75rem;padding:.5rem .75rem;border-radius:.375rem;font-size:.8125rem;cursor:pointer}
[part=inspection]{min-block-size:3rem}[part=status]:empty{position:absolute;inline-size:1px;block-size:1px;overflow:hidden;clip-path:inset(50%)}
@media(max-width:480px){[part=axis]{margin-inline-start:0}[part=panel]{padding:1rem}[part=plot-row]{grid-template-columns:minmax(0,1fr);gap:.4rem}}
`;
