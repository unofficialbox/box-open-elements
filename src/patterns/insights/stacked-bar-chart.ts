export type { ChartAnimationPreset, ChartAnimationEasing } from "./chart-motion.js";
import { ChartElement, chartAnimationAttributes } from "./chart-element.js";
import { analyticStyles, categoryColor, chartArrayAttributeValid, chartJson, escapeChartText as escape, formatAnalyticValue, formatAnalyticShare } from "./analytic-shared.js";
import { chartScale } from "./chart-scale.js";

export interface StackedBarSegment { id: string; label: string; value: number; tone?: string; }
export interface StackedBar { id: string; label: string; totalLabel?: string; segments: StackedBarSegment[]; }
const DEFAULT_TAG_NAME = "box-stacked-bar-chart";
const styles = analyticStyles + `
[part=stack]{position:relative;block-size:2.75rem;min-inline-size:0}
[part=segment]{position:absolute;inset-inline-start:var(--start);inline-size:var(--size);inset-block:0;background:var(--series-color);border:1px solid var(--boe-token-surface-surface,#fff);border-radius:1px;padding:0;cursor:pointer;color:var(--boe-token-text-text-on-brand,#fff)}
[part=segment][data-positive=false]{border:0}[part=segment][data-positive=true]{min-inline-size:2px}[part=segment][data-muted=true]{opacity:.35}
[part=segment]:focus-visible{outline:2px solid var(--boe-token-text-text,#102347);outline-offset:2px;z-index:1}
[part=total]{display:block;font-size:.8125rem;font-variant-numeric:tabular-nums;margin-block-start:.35rem}
@media(min-width:481px){
 [data-orientation=vertical]{display:grid;grid-template-columns:3rem minmax(0,1fr);gap:.5rem}
 [data-orientation=vertical] [part=rows]{grid-column:2;display:flex;align-items:stretch;gap:1.5rem}
 [data-orientation=vertical] [part=plot-row]{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:14rem auto;flex:1;gap:.5rem;align-items:start;min-inline-size:0}
 [data-orientation=vertical] [part=row-label]{grid-row:2}
 [data-orientation=vertical] [part=track]{grid-row:1;block-size:14rem;background:transparent;display:grid;align-items:end}
 [data-orientation=vertical] [part=stack]{block-size:14rem;inline-size:100%;max-inline-size:5rem;margin-inline:auto}
 [data-orientation=vertical] [part=segment]{inset-inline:0;inline-size:auto;min-inline-size:0;inset-block:auto var(--start);block-size:var(--size)}
 [data-orientation=vertical] [part=segment][data-positive=true]{min-block-size:2px}
 [data-orientation=vertical] [part=axis]{grid-column:1;grid-row:1;position:relative;block-size:14rem;display:block;margin:0}
 [data-orientation=vertical] [part=axis] span{position:absolute;inset-block-end:var(--position);inset-inline-end:0;transform:translateY(50%)}
}
`;
export class StackedBarChart extends ChartElement {
  static readonly tagName = DEFAULT_TAG_NAME;
  static get observedAttributes():string[]{return [...chartAnimationAttributes, "heading","description","bars","orientation","unit","state","status-message","series-tokens"];}
  private tableVisible=false;
  private inspected:{bar:string;segment:string}|null=null;
  private formatter:((value:number)=>string)|null=null;
  get heading():string{return this.getAttribute("heading")??"Composition by category";}
  set heading(value:string){this.setAttribute("heading",value);}
  get description():string{return this.getAttribute("description")??"";}
  set description(value:string){this.setAttribute("description",value);}
  get bars():StackedBar[]{const data=chartJson<unknown>(this,"bars",[]);return Array.isArray(data)?data as StackedBar[]:[];}
  set bars(value:StackedBar[]){this.setAttribute("bars",JSON.stringify(value));}
  get orientation():"horizontal"|"vertical"{return this.getAttribute("orientation")==="vertical"?"vertical":"horizontal";}
  set orientation(value:"horizontal"|"vertical"){this.setAttribute("orientation",value);}
  get unit():string{return this.getAttribute("unit")??"";}
  set unit(value:string){this.setAttribute("unit",value);}
  get state():string{return this.getAttribute("state")??"ready";}
  set state(value:string){this.setAttribute("state",value);}
  get statusMessage():string{return this.getAttribute("status-message")??"";}
  set statusMessage(value:string){this.setAttribute("status-message",value);}
  get seriesTokens():Record<string,string>{const data=chartJson<unknown>(this,"series-tokens",{});return data&&typeof data==="object"&&!Array.isArray(data)?data as Record<string,string>:{};}
  set seriesTokens(value:Record<string,string>){this.setAttribute("series-tokens",JSON.stringify(value));}
  get format():(value:number)=>string{return this.formatter??formatAnalyticValue;}
  set format(value:(value:number)=>string){this.formatter=value;this.update();}
  connectedCallback():void{
    this.upgradeProperties(["heading", "description", "bars", "unit", "state", "statusMessage", "seriesTokens", "format", "orientation"]);
    super.connectedCallback();
  }
  protected renderTemplate():void{
    this.shadowRoot!.innerHTML=`<style>${styles}</style><article part="panel"><h2 part="heading"></h2><p part="scope" hidden></p><div part="status" role="status" aria-live="polite"></div><div part="legend"></div><div part="chart"></div><p part="inspection" role="status" aria-live="polite">Focus a segment to inspect its amount and share.</p><button part="table-toggle" type="button" aria-controls="stacked-data">Show data table</button><div part="table-wrap" id="stacked-data" hidden></div><p part="note">Tiny positive segments use a minimum 2px mark. Exact amounts and rounded shares are available in the table. Shares below 0.1% are labelled explicitly.</p><slot name="footer"></slot></article>`;
  }
  protected setupListeners():void{
    this.shadowRoot!.querySelector<HTMLButtonElement>('[part="table-toggle"]')!.addEventListener("click",()=>{this.tableVisible=!this.tableVisible;this.syncTable();});
    const inspect=(event:Event)=>{
      const target=(event.target as Element).closest<HTMLElement>('[data-bar][data-segment]');if(!target)return;
      this.inspected={bar:target.dataset.bar!,segment:target.dataset.segment!};this.refreshInspection();
    };
    this.shadowRoot!.addEventListener("focusin",inspect);this.shadowRoot!.addEventListener("pointerover",inspect);this.shadowRoot!.addEventListener("click",inspect);
  }
  private refreshInspection():void{
    const bar=this.inspected?this.bars.find(bar=>bar?.id===this.inspected?.bar):undefined;
    const segment=bar?.segments.find(segment=>segment.id===this.inspected?.segment);
    let text="Focus a segment to inspect its amount and share.";
    if(bar&&segment){const total=bar.segments.reduce((sum,s)=>sum+s.value,0);text=`${bar.label}: ${segment.label} ${this.format(segment.value)}${this.unit?` ${this.unit}`:""} of ${this.format(total)}, ${formatAnalyticShare(segment.value,total)}`;}else this.inspected=null;
    const inspection=this.shadowRoot!.querySelector('[part="inspection"]')!;if(inspection.textContent!==text)inspection.textContent=text;
  }
  private syncTable():void{
    this.shadowRoot!.querySelector<HTMLElement>('[part="table-wrap"]')!.hidden=!this.tableVisible;
    const toggle=this.shadowRoot!.querySelector<HTMLButtonElement>('[part="table-toggle"]')!;toggle.textContent=this.tableVisible?"Hide data table":"Show data table";toggle.setAttribute("aria-expanded",String(this.tableVisible));
  }
  protected renderChart():void{
    if(!this.isRendered)return;
    const root=this.shadowRoot!,bars=this.bars;
    const focused=root.activeElement as HTMLElement|null;
    const focusKey=focused?.getAttribute("part")==="segment"?{bar:focused.dataset.bar,segment:focused.dataset.segment}:null;
    root.querySelector('[part="heading"]')!.textContent=this.heading;
    const scope=root.querySelector<HTMLElement>('[part="scope"]')!;scope.textContent=this.description;scope.hidden=!this.description;
    const unavailable=["loading","error"].includes(this.state);
    const valid=chartArrayAttributeValid(this,"bars")&&bars.every(bar=>bar&&typeof bar.id==="string"&&typeof bar.label==="string"&&Array.isArray(bar.segments)&&bar.segments.length>0&&new Set(bar.segments.map(s=>s?.id)).size===bar.segments.length&&bar.segments.every(s=>s&&typeof s.id==="string"&&typeof s.label==="string"&&Number.isFinite(s.value)&&s.value>=0)&&Number.isFinite(bar.segments.reduce((sum,s)=>sum+s.value,0)))&&new Set(bars.map(b=>b.id)).size===bars.length;
    const status=this.statusMessage||(this.state==="loading"?"Loading composition…":this.state==="error"?"Composition could not be loaded.":!valid?"Cannot plot invalid or negative composition amounts.":!bars.length?"No observations.":this.state==="partial"?"Partial observations.":this.state==="stale"?"Cached observations.":"");
    root.querySelector('[part="status"]')!.textContent=status;
    for(const part of ["legend","chart","inspection","table-toggle","table-wrap","note"])root.querySelector<HTMLElement>(`[part="${part}"]`)!.hidden=unavailable||!valid||!bars.length;
    const chart=root.querySelector<HTMLElement>('[part="chart"]')!;chart.setAttribute("aria-busy",String(this.state==="loading"));
    if(unavailable||!valid||!bars.length){this.inspected=null;this.refreshInspection();chart.replaceChildren();root.querySelector('[part="table-wrap"]')!.replaceChildren();if(focusKey){const heading=root.querySelector<HTMLElement>('[part="heading"]')!;heading.tabIndex=-1;heading.focus();}return;}
    const keys=[...new Map(bars.flatMap(b=>b.segments).map(s=>[s.id,s])).values()];
    const colors=new Map(keys.map((s,i)=>[s.id,categoryColor(s.id,i,this.seriesTokens,s.tone)]));
    root.querySelector('[part="legend"]')!.innerHTML=keys.map(s=>`<span part="legend-item"><span part="swatch" style="--series-color:${colors.get(s.id)}"></span><span part="legend-label">${escape(s.label)}</span></span>`).join("");
    const totals=bars.map(b=>b.segments.reduce((sum,s)=>sum+s.value,0)),scale=chartScale(totals);
    const maximum=scale.ticks.at(-1)??1;
    chart.dataset.orientation=this.orientation;
    chart.innerHTML=`<div part="rows">${bars.map((bar,i)=>{
      let sum=0;const total=totals[i];
      const segments=bar.segments.map(s=>{const start=sum/maximum*100;sum+=s.value;const text=`${bar.label}: ${s.label} ${this.format(s.value)}${this.unit?` ${this.unit}`:""} of ${this.format(total)}, ${formatAnalyticShare(s.value,total)}`;return `<button type="button" part="segment" data-bar="${escape(bar.id)}" data-segment="${escape(s.id)}" data-positive="${s.value>0}" style="--start:${start}%;--size:${s.value/maximum*100}%;--series-color:${colors.get(s.id)}" aria-label="${escape(text)}" title="${escape(text)}"></button>`;}).join("");
      return `<div part="plot-row"><div part="row-label">${escape(bar.label)}<strong part="total">${escape(bar.totalLabel??this.format(total))}${this.unit?` ${escape(this.unit)}`:""}</strong></div><div part="track"><div part="stack" role="group" aria-label="${escape(bar.label)}">${segments}</div></div></div>`;
    }).join("")}</div><div part="axis" aria-label="${escape(this.unit||"Amount")} scale">${scale.ticks.map(t=>`<span style="--position:${scale.position(t)*100}%">${escape(this.format(t))}</span>`).join("")}</div>`;
    root.querySelector('[part="table-wrap"]')!.innerHTML=`<table><caption>${escape(this.heading)} — exact composition${this.unit?` (${escape(this.unit)})`:""}</caption><thead><tr><th scope="col">Category</th><th scope="col">Segment</th><th scope="col">Amount</th><th scope="col">Share</th></tr></thead><tbody>${bars.flatMap((bar,i)=>bar.segments.map(s=>`<tr><th scope="row">${escape(bar.label)}</th><td>${escape(s.label)}</td><td>${escape(this.format(s.value))}</td><td>${escape(formatAnalyticShare(s.value,totals[i]))}</td></tr>`)).join("")}</tbody></table>`;
    this.syncTable();
    this.refreshInspection();
    if(focusKey){
      const next=Array.from(root.querySelectorAll<HTMLButtonElement>('[part="segment"]')).find(button=>button.dataset.bar===focusKey.bar&&button.dataset.segment===focusKey.segment);
      const target=next??root.querySelector<HTMLElement>('[part="heading"]')!;if(!next)target.tabIndex=-1;target.focus();
    }
  }
}
StackedBarChart.register();
