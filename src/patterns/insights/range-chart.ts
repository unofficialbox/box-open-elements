export type { ChartAnimationPreset, ChartAnimationEasing } from "./chart-motion.js";
import { ChartElement, chartAnimationAttributes } from "./chart-element.js";
import { analyticStyles, categoryColor, chartArrayAttributeValid, chartJson, escapeChartText as escape, formatAnalyticValue } from "./analytic-shared.js";
import { chartScale } from "./chart-scale.js";

export interface ChartRange { id: string; label: string; low: number; high: number; value?: number; tone?: string; }
export type RangeChartRow = { id: string; label: string } & (
  | { low: number; high: number; value?: number; tone?: string; ranges?: never }
  | { ranges: ChartRange[]; low?: never; high?: never; value?: never; tone?: never }
);
const DEFAULT_TAG_NAME = "box-range-chart";
const styles=analyticStyles+`
[part=range-group]{display:grid;gap:.5rem}[part=range-track]{position:relative;block-size:2.75rem;border-block-end:1px solid var(--boe-token-stroke-stroke,#e8e8e8)}
[part=range]{appearance:none;position:absolute;inset-inline-start:var(--start);inline-size:var(--size);inset-block-start:.75rem;block-size:1.25rem;background:color-mix(in srgb,var(--series-color) 20%,var(--boe-token-surface-surface,#fff));border:0;border-inline:2px solid var(--series-color);padding:0;color:inherit;cursor:pointer}
[part=range]:before{content:"";position:absolute;inset-inline:0;inset-block-start:50%;border-block-start:2px solid var(--series-color)}
[part=point]{position:absolute;inset-inline-start:var(--point);inset-block-start:50%;transform:translate(-50%,-50%);inline-size:.625rem;block-size:.625rem;border:2px solid var(--boe-token-surface-surface,#fff);border-radius:50%;background:var(--series-color)}
[part=range][data-zero=true]{inline-size:2px;min-inline-size:2px;border-inline-start:2px solid var(--series-color);background:none}
[part=range]:focus-visible{outline:2px solid var(--boe-token-text-text,#102347);outline-offset:3px}
[part=range-values]{display:block;overflow-wrap:anywhere;font-size:.8125rem;font-variant-numeric:tabular-nums;color:var(--boe-token-text-text-secondary,#566781);margin-block-start:.25rem}
`;
export class RangeChart extends ChartElement {
  static readonly tagName=DEFAULT_TAG_NAME;
  static get observedAttributes():string[]{return [...chartAnimationAttributes, "heading","description","rows","unit","state","status-message","series-tokens"];}
  private tableVisible=false;
  private inspected:{row:string;series:string}|null=null;
  private formatter:((value:number)=>string)|null=null;
  get heading():string{return this.getAttribute("heading")??"Estimated ranges";}
  set heading(value:string){this.setAttribute("heading",value);}
  get description():string{return this.getAttribute("description")??"";}
  set description(value:string){this.setAttribute("description",value);}
  get rows():RangeChartRow[]{const data=chartJson<unknown>(this,"rows",[]);return Array.isArray(data)?data as RangeChartRow[]:[];}
  set rows(value:RangeChartRow[]){this.setAttribute("rows",JSON.stringify(value));}
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
  private ranges(row:RangeChartRow):ChartRange[]{
    return row.ranges??[{id:"range",label:"Range",low:row.low!,high:row.high!,value:row.value,tone:row.tone}];
  }
  connectedCallback():void{
    this.upgradeProperties(["heading", "description", "rows", "unit", "state", "statusMessage", "seriesTokens", "format"]);
    super.connectedCallback();
  }
  protected renderTemplate():void{
    this.shadowRoot!.innerHTML=`<style>${styles}</style><article part="panel"><h2 part="heading"></h2><p part="scope" hidden></p><div part="status" role="status" aria-live="polite"></div><div part="legend"></div><div part="chart"></div><p part="inspection" role="status" aria-live="polite">Focus a range to inspect its bounds. A point appears only when supplied by the host.</p><button part="table-toggle" type="button" aria-controls="range-data">Show data table</button><div part="table-wrap" id="range-data" hidden></div><slot name="footer"></slot></article>`;
  }
  protected setupListeners():void{
    this.shadowRoot!.querySelector<HTMLButtonElement>('[part="table-toggle"]')!.addEventListener("click",()=>{
      this.tableVisible=!this.tableVisible;this.syncTable();
    });
    const inspect=(event:Event)=>{
      const target=(event.target as Element).closest<HTMLElement>('[part="range"]');if(!target)return;
      this.inspected={row:target.dataset.row!,series:target.dataset.series!};this.refreshInspection();
    };
    this.shadowRoot!.addEventListener("focusin",inspect);this.shadowRoot!.addEventListener("pointerover",inspect);this.shadowRoot!.addEventListener("click",inspect);
  }
  private refreshInspection():void{
    const target=this.inspected?Array.from(this.shadowRoot!.querySelectorAll<HTMLElement>('[part="range"]')).find(node=>node.dataset.row===this.inspected!.row&&node.dataset.series===this.inspected!.series):null;
    const text=target?.getAttribute("aria-label")??"Focus a range to inspect its bounds. A point appears only when supplied by the host.";
    if(!target)this.inspected=null;
    const node=this.shadowRoot!.querySelector('[part="inspection"]')!;if(node.textContent!==text)node.textContent=text;
  }
  private syncTable():void{
    this.shadowRoot!.querySelector<HTMLElement>('[part="table-wrap"]')!.hidden=!this.tableVisible;
    const button=this.shadowRoot!.querySelector<HTMLButtonElement>('[part="table-toggle"]')!;
    button.textContent=this.tableVisible?"Hide data table":"Show data table";button.setAttribute("aria-expanded",String(this.tableVisible));
  }
  protected renderChart():void{
    if(!this.isRendered)return;
    const root=this.shadowRoot!,rows=this.rows;
    const focused=root.activeElement as HTMLElement|null;
    const focusKey=focused?.getAttribute("part")==="range"?{row:focused.dataset.row,series:focused.dataset.series}:null;
    root.querySelector('[part="heading"]')!.textContent=this.heading;
    const scope=root.querySelector<HTMLElement>('[part="scope"]')!;scope.textContent=this.description;scope.hidden=!this.description;
    const valid=chartArrayAttributeValid(this,"rows")&&rows.every(row=>row&&typeof row.id==="string"&&typeof row.label==="string"&&(!row.ranges||Array.isArray(row.ranges))&&this.ranges(row).length>0&&new Set(this.ranges(row).map(r=>r?.id)).size===this.ranges(row).length&&this.ranges(row).every(r=>r&&typeof r.id==="string"&&typeof r.label==="string"&&Number.isFinite(r.low)&&Number.isFinite(r.high)&&Number.isFinite(r.high-r.low)&&r.low<=r.high&&(r.value===undefined||Number.isFinite(r.value)&&r.value>=r.low&&r.value<=r.high)))&&new Set(rows.map(r=>r.id)).size===rows.length;
    const unavailable=["loading","error"].includes(this.state);
    root.querySelector('[part="status"]')!.textContent=this.statusMessage||(this.state==="loading"?"Loading ranges…":this.state==="error"?"Ranges could not be loaded.":!valid?"Cannot plot invalid bounds or a point outside its range.":!rows.length?"No observations.":this.state==="partial"?"Partial observations.":this.state==="stale"?"Cached observations.":"");
    for(const part of ["legend","chart","inspection","table-toggle","table-wrap"])root.querySelector<HTMLElement>(`[part="${part}"]`)!.hidden=unavailable||!valid||!rows.length;
    const chart=root.querySelector<HTMLElement>('[part="chart"]')!;chart.setAttribute("aria-busy",String(this.state==="loading"));
    if(unavailable||!valid||!rows.length){this.inspected=null;this.refreshInspection();chart.replaceChildren();root.querySelector('[part="table-wrap"]')!.replaceChildren();if(focusKey){const heading=root.querySelector<HTMLElement>('[part="heading"]')!;heading.tabIndex=-1;heading.focus();}return;}
    const series=[...new Map(rows.flatMap(row=>this.ranges(row)).map(r=>[r.id,r])).values()];
    const colors=new Map(series.map((s,i)=>[s.id,categoryColor(s.id,i,this.seriesTokens,s.tone)]));
    root.querySelector<HTMLElement>('[part="legend"]')!.hidden=series.length<2;
    root.querySelector('[part="legend"]')!.innerHTML=series.map(s=>`<span part="legend-item"><span part="swatch" style="--series-color:${colors.get(s.id)}"></span><span part="legend-label">${escape(s.label)}</span></span>`).join("");
    const scale=chartScale(rows.flatMap(row=>this.ranges(row).flatMap(r=>[r.low,r.high])));
    const format=(value:number)=>`${this.format(value)}${this.unit?`${this.unit==="%"?"":" "}${this.unit}`:""}`;
    chart.innerHTML=`<div part="rows">${rows.map(row=>`<div part="plot-row"><div part="row-label">${escape(row.label)}</div><div part="range-group">${this.ranges(row).map(r=>{
      const label=`${row.label}${series.length>1?`, ${r.label}`:""}: between ${format(r.low)} and ${format(r.high)}; width ${format(r.high-r.low)}${r.value===undefined?"":`; supplied point ${format(r.value)}`}`;
      return `<div><div part="range-track"><button type="button" part="range" data-row="${escape(row.id)}" data-series="${escape(r.id)}" data-zero="${r.low===r.high}" aria-label="${escape(label)}" title="${escape(label)}" style="--start:${scale.position(r.low)*100}%;--size:${(scale.position(r.high)-scale.position(r.low))*100}%;--series-color:${colors.get(r.id)}">${r.value===undefined?"":`<span part="point" style="--point:${r.high===r.low?0:(r.value-r.low)/(r.high-r.low)*100}%"></span>`}</button></div><div part="range-values">${series.length>1?`${escape(r.label)} · `:""}${escape(format(r.low))}–${escape(format(r.high))}${r.value===undefined?"":` · Point ${escape(format(r.value))}`}</div></div>`;
    }).join("")}</div></div>`).join("")}</div><div part="axis" aria-label="${escape(this.unit||"Value")} scale">${scale.ticks.map(t=>`<span>${escape(this.format(t))}</span>`).join("")}</div>`;
    root.querySelector('[part="table-wrap"]')!.innerHTML=`<table><caption>${escape(this.heading)} — bounds${this.unit?` (${escape(this.unit)})`:""}</caption><thead><tr><th scope="col">Range</th><th scope="col">Series</th><th scope="col">Low</th><th scope="col">High</th></tr></thead><tbody>${rows.flatMap(row=>this.ranges(row).map(r=>`<tr><th scope="row">${escape(row.label)}<span part="range-values">Width ${escape(this.format(r.high-r.low))}${r.value===undefined?"":` · Supplied point ${escape(this.format(r.value))}`}</span></th><td>${escape(r.label)}</td><td>${escape(this.format(r.low))}</td><td>${escape(this.format(r.high))}</td></tr>`)).join("")}</tbody></table>`;
    this.syncTable();
    this.refreshInspection();
    if(focusKey){
      const next=Array.from(root.querySelectorAll<HTMLButtonElement>('[part="range"]')).find(button=>button.dataset.row===focusKey.row&&button.dataset.series===focusKey.series);
      const target=next??root.querySelector<HTMLElement>('[part="heading"]')!;if(!next)target.tabIndex=-1;target.focus();
    }
  }
}
RangeChart.register();
