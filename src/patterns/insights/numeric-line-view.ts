import { analyticStyles, chartArrayAttributeValid, analyticScale, formatAnalyticValue, categoryColor, escapeChartText as escape } from "./analytic-shared.js";

export interface NumericLinePoint { x: number; y: number | null; }
export interface LineChartSeries { id: string; label: string; tone?: string; summary?: string; points: NumericLinePoint[]; }
export interface LineChartMarker { id: string; axis: "x"|"y"; value: number; label: string; }
export interface NumericLineHost extends HTMLElement {
  heading:string; message:string; state:string; statusMessage:string;
  series:LineChartSeries[]; markers:LineChartMarker[]; xScale:"linear"|"log"; yScale:"linear"|"log";
  xLabel:string; yLabel:string; xFormat:(value:number)=>string; yFormat:(value:number)=>string;
  seriesTokens:Record<string,string>;
}
const styles=analyticStyles+`
[part=visual]{display:block;overflow:visible;padding:0;margin:0;min-inline-size:0}
[part=plot]{position:relative;block-size:16rem;margin:1rem 1rem 2.5rem 3.5rem;min-inline-size:0}
svg{inline-size:100%;block-size:100%;overflow:visible}[part=series-path]{fill:none;stroke:var(--series-color);stroke-width:2;vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round}
[part=series-path][data-active=true]{stroke-width:3}[part=series-path][data-muted=true]{stroke-width:1.5}
[part=reference]{stroke:var(--boe-token-text-text-secondary,#566781);stroke-width:1;stroke-dasharray:4 4;vector-effect:non-scaling-stroke}
[part=grid-line]{stroke:var(--boe-token-stroke-stroke,#e8e8e8);stroke-width:1;vector-effect:non-scaling-stroke}
[part=x-ticks]{position:absolute;inset:100% 0 auto;block-size:2rem}[part=y-ticks]{position:absolute;inset:0 100% 0 auto;inline-size:3rem}
[part=tick]{max-inline-size:4rem;overflow:hidden;text-overflow:ellipsis;position:absolute;font-size:.6875rem;white-space:nowrap;color:var(--boe-token-text-text-secondary,#566781);font-variant-numeric:tabular-nums}
[part=x-ticks] [part=tick]{inset-inline-start:var(--position);transform:translateX(-50%);inset-block-start:.5rem}
[part=y-ticks] [part=tick]{inset-block-end:var(--position);inset-inline-end:.5rem;transform:translateY(50%)}
[part=legend-item]{appearance:none;background:transparent;border:1px solid transparent;border-radius:.25rem;min-block-size:2.75rem;padding:.25rem .4rem;color:inherit;cursor:pointer}
[part=legend-item][data-active=true]{border-color:var(--boe-token-text-text,#102347)}
[part=annotations]{font-size:.8125rem;line-height:1.5;color:var(--boe-token-text-text-secondary,#566781);display:flex;flex-wrap:wrap;gap:.4rem 1rem}
[part=axis-names] span{min-inline-size:0;overflow-wrap:anywhere}
[part=axis-names]{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.5rem;font-size:.8125rem;color:var(--boe-token-text-text-secondary,#566781)}
[part=table-wrap] table{min-inline-size:28rem}summary{cursor:pointer;font-size:.8125rem;min-block-size:2.75rem;display:list-item;padding-block:.65rem;box-sizing:border-box}li{font-size:.8125rem;line-height:1.6}
`;
export class NumericLineView {
  private tableVisible=false;
  private inspectedId:string|null=null;
  private root:ShadowRoot;
  constructor(container:HTMLElement,private host:NumericLineHost){
    // A separate style boundary prevents numeric-mode rules leaking into the
    // compatible categorical renderer after the host switches modes.
    const root=this.root=container.attachShadow({mode:"open"});
    container.setAttribute("exportparts","panel:series-panel,plot:numeric-plot,series-path,legend,legend-item,table-wrap,status");
    root.innerHTML=`<style>${styles}</style><article part="panel"><h2 part="heading"></h2><p part="scope"></p><p part="status" role="status" aria-live="polite"></p><div part="legend"></div><div part="visual"><div part="axis-names"></div><div part="plot"><div part="y-ticks" aria-hidden="true"></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img"><g part="grid"></g><g part="references"></g><g part="series"></g></svg><div part="x-ticks" aria-hidden="true"></div></div><div part="annotations"></div></div><p part="inspection" role="status" aria-live="polite">Focus a series to inspect its shape.</p><details part="summaries"><summary>Series summaries</summary><ul></ul></details><button part="table-toggle" type="button" aria-controls="numeric-line-data">Show data table</button><div part="table-wrap" id="numeric-line-data" role="region" tabindex="0" hidden></div></article>`;
    const activate=(id:string|null)=>{
      root.querySelectorAll<HTMLElement>('[data-series-id]').forEach(node=>{node.dataset.active=String(node.dataset.seriesId===id);node.dataset.muted=String(id!==null&&node.dataset.seriesId!==id);});
      if(id!==null)this.inspectedId=id;this.refreshInspection();
    };
    root.addEventListener("focusin",event=>activate((event.target as HTMLElement).closest<HTMLElement>('[data-series-id]')?.dataset.seriesId??null));
    root.addEventListener("pointerover",event=>activate((event.target as Element).closest<HTMLElement>('[data-series-id]')?.dataset.seriesId??null));
    container.addEventListener("pointerleave",()=>activate(null));
    root.querySelector('button[part="table-toggle"]')!.addEventListener("click",()=>{this.tableVisible=!this.tableVisible;this.syncTable();});
  }
  private summary(series:LineChartSeries):string{
    if(series.summary)return `${series.label}: ${series.summary}`;
    const points=series.points.filter(p=>p.y!==null);
    if(!points.length)return `${series.label}: no observations.`;
    const first=points[0],last=points.at(-1)!;
    const flat=points.every(p=>p.y===first.y);
    const shape=flat?`flat at ${this.host.yFormat(first.y!)}`:`from ${this.host.yFormat(first.y!)} to ${this.host.yFormat(last.y!)}`;
    return `${series.label}: ${shape}, x ${this.host.xFormat(first.x)} to ${this.host.xFormat(last.x)}; ${points.length} observations${points.length<series.points.length?", missing intervals are gaps":""}.`;
  }
  private refreshInspection():void{
    const series=this.inspectedId===null?undefined:this.host.series.find(series=>series?.id===this.inspectedId);
    if(!series)this.inspectedId=null;
    const text=series?this.summary(series):"Focus a series to inspect its shape.";
    const node=this.root.querySelector('[part="inspection"]')!;if(node.textContent!==text)node.textContent=text;
  }
  private syncTable():void{
    this.root.querySelector<HTMLElement>('[part="table-wrap"]')!.hidden=!this.tableVisible;
    const button=this.root.querySelector<HTMLButtonElement>('[part="table-toggle"]')!;button.textContent=this.tableVisible?"Hide data table":"Show data table";button.setAttribute("aria-expanded",String(this.tableVisible));
  }
  update():void{
    const {root,host}=this,series=host.series,markers=host.markers;
    const focusId=(root.getRootNode() as ShadowRoot).activeElement?.getAttribute("data-series-id");
    const valid=chartArrayAttributeValid(host,"series")&&chartArrayAttributeValid(host,"markers")&&series.every(s=>s&&typeof s.id==="string"&&typeof s.label==="string"&&Array.isArray(s.points)&&s.points.every(p=>p&&Number.isFinite(p.x)&&(p.y===null||Number.isFinite(p.y)))&&s.points.every((p,i)=>i===0||p.x>s.points[i-1].x))&&new Set(series.map(s=>s.id)).size===series.length&&markers.every(m=>m&&typeof m.id==="string"&&typeof m.label==="string"&&["x","y"].includes(m.axis)&&Number.isFinite(m.value));
    const points=valid?series.flatMap(s=>s.points):[];
    const safeMarkers=valid?markers:[];
    const hasData=points.some(p=>p.y!==null);
    const xs=points.map(p=>p.x).concat(safeMarkers.filter(m=>m.axis==="x").map(m=>m.value));
    const ys=points.flatMap(p=>p.y===null?[]:[p.y]).concat(safeMarkers.filter(m=>m.axis==="y").map(m=>m.value));
    const logInvalid=(host.xScale==="log"&&xs.some(x=>x<=0))||(host.yScale==="log"&&ys.some(y=>y<=0));
    const unavailable=["loading","error"].includes(host.state);
    root.querySelector('[part="heading"]')!.textContent=host.heading;
    const scope=root.querySelector<HTMLElement>('[part="scope"]')!;scope.textContent=host.message;scope.hidden=!host.message;
    root.querySelector('[part="status"]')!.textContent=host.statusMessage||(host.state==="loading"?"Loading series…":host.state==="error"?"Series could not be loaded.":!valid?"Cannot plot invalid series; x values must be finite and strictly increasing.":logInvalid?"Log scales require positive values. Inspect the data table for the supplied observations.":!hasData?"No observations.":host.state==="partial"?"Partial observations.":host.state==="stale"?"Cached observations.":"");
    for(const part of ["legend","visual","inspection","summaries","table-toggle","table-wrap"])root.querySelector<HTMLElement>(`[part="${part}"]`)!.hidden=unavailable||!valid||!points.length;
    root.querySelector('[part="visual"]')!.setAttribute("aria-busy",String(host.state==="loading"));
    if(unavailable||!valid||!points.length){this.inspectedId=null;this.refreshInspection();if(focusId){const heading=root.querySelector<HTMLElement>('[part="heading"]')!;heading.tabIndex=-1;heading.focus();}return;}
    root.querySelector('[part="legend"]')!.innerHTML=series.map((s,i)=>`<button type="button" part="legend-item" data-series-id="${escape(s.id)}" style="--series-color:${categoryColor(s.id,i,host.seriesTokens,s.tone)}" aria-label="${escape(this.summary(s))}"><span part="swatch"></span><span part="legend-label">${escape(s.label)}</span></button>`).join("");
    root.querySelector('[part="summaries"] ul')!.innerHTML=series.map(s=>`<li>${escape(this.summary(s))}</li>`).join("");
    root.querySelector('[part="axis-names"]')!.innerHTML=`<span>${escape(host.yLabel||"Value")}${host.yScale==="log"?" · Log scale":""}</span><span>${escape(host.xLabel||"X")}${host.xScale==="log"?" · Log scale":""}</span>`;
    const table=root.querySelector<HTMLElement>('[part="table-wrap"]')!;table.setAttribute("aria-label",`${host.heading} data table`);
    const valueMaps=series.map(s=>new Map(s.points.map(p=>[p.x,p.y])));
    const uniqueX=[...new Set(points.map(p=>p.x))].sort((a,b)=>a-b);
    table.innerHTML=`<table><caption>${escape(host.heading)} — ${escape(host.xLabel||"X")} by series; missing values are not zero.</caption><thead><tr><th scope="col">${escape(host.xLabel||"X")}</th>${series.map(s=>`<th scope="col">${escape(s.label)}</th>`).join("")}</tr></thead><tbody>${uniqueX.map(x=>`<tr><th scope="row">${escape(host.xFormat(x))}</th>${series.map((s,i)=>{const value=valueMaps[i].get(x);return `<td>${value==null?"Not observed":escape(host.yFormat(value))}</td>`;}).join("")}</tr>`).join("")}</tbody></table>`;
    this.syncTable();
    this.refreshInspection();
    root.querySelector<HTMLElement>('[part="visual"]')!.hidden=logInvalid;
    if(logInvalid||!hasData){
      root.querySelector<HTMLElement>('[part="visual"]')!.hidden=true;
      root.querySelector<HTMLElement>('[part="table-toggle"]')!.hidden=true;
      table.hidden=false;return;
    }
    const axisFormat=(value:number,format:(n:number)=>string)=>format===formatAnalyticValue?new Intl.NumberFormat("en",{notation:"compact",maximumSignificantDigits:3}).format(value):format(value);
    const xScale=analyticScale(xs,host.xScale==="log",{includeZero:false}),yScale=analyticScale(ys,host.yScale==="log");
    root.querySelector('svg')!.setAttribute("aria-label",`${host.heading}: ${series.map(s=>s.label).join(", ")}. ${host.xLabel||"X"} ${host.xScale}; ${host.yLabel||"Value"} ${host.yScale}. Exact values and summaries follow.`);
    let xLabels=xScale.ticks.map(x=>axisFormat(x,host.xFormat));
    if(host.xFormat===formatAnalyticValue&&new Set(xLabels).size!==xLabels.length)xLabels=xScale.ticks.map(host.xFormat);
    root.querySelector('[part="x-ticks"]')!.innerHTML=xScale.ticks.map((x,i)=>`<span part="tick" style="--position:${xScale.position(x)*100}%" title="${escape(host.xFormat(x))}">${escape(xLabels[i])}</span>`).join("");
    root.querySelector('[part="y-ticks"]')!.innerHTML=yScale.ticks.map(y=>`<span part="tick" style="--position:${yScale.position(y)*100}%">${escape(axisFormat(y,host.yFormat))}</span>`).join("");
    root.querySelector('[part="grid"]')!.innerHTML=yScale.ticks.map(y=>`<line part="grid-line" x1="0" x2="100" y1="${100-yScale.position(y)*100}" y2="${100-yScale.position(y)*100}"/>`).join("");
    root.querySelector('[part="series"]')!.innerHTML=series.map((s,i)=>{
      let gap=true;
      const path=s.points.map(p=>{if(p.y===null){gap=true;return "";}const prefix=gap?"M":"L";gap=false;return `${prefix} ${xScale.position(p.x)*100} ${100-yScale.position(p.y)*100}`;}).join(" ");
      const plot=root.querySelector('[part="plot"]')!.getBoundingClientRect();
      const ry=plot.height?(.7*plot.width/plot.height):1.4;
      const dots=s.points.length<=200?s.points.filter(p=>p.y!==null).map(p=>`<ellipse cx="${xScale.position(p.x)*100}" cy="${100-yScale.position(p.y!)*100}" rx=".7" ry="${ry}" style="fill:${categoryColor(s.id,i,host.seriesTokens,s.tone)}"><title>${escape(`${s.label}: ${host.xFormat(p.x)}, ${host.yFormat(p.y!)}`)}</title></ellipse>`).join(""):"";
      return `<g data-series-id="${escape(s.id)}">${dots}</g><path part="series-path" data-series-id="${escape(s.id)}" style="--series-color:${categoryColor(s.id,i,host.seriesTokens,s.tone)}" stroke-dasharray="${["none","6 3","2 3","8 3 2 3"][i%4]}" d="${path}"><title>${escape(this.summary(s))}</title></path>`;
    }).join("");
    root.querySelector('[part="references"]')!.innerHTML=markers.map(m=>m.axis==="x"?`<line part="reference" x1="${xScale.position(m.value)*100}" x2="${xScale.position(m.value)*100}" y1="0" y2="100"><title>${escape(m.label)}</title></line>`:`<line part="reference" x1="0" x2="100" y1="${100-yScale.position(m.value)*100}" y2="${100-yScale.position(m.value)*100}"><title>${escape(m.label)}</title></line>`).join("");
    root.querySelector('[part="annotations"]')!.innerHTML=markers.map(m=>`<span>${escape(m.label)} · ${escape(m.axis==="x"?host.xLabel||"X":host.yLabel||"Value")} ${escape((m.axis==="x"?host.xFormat:host.yFormat)(m.value))}</span>`).join("");
    if(focusId){const next=Array.from(root.querySelectorAll<HTMLButtonElement>('[part="legend-item"]')).find(n=>n.dataset.seriesId===focusId);const target=next??root.querySelector<HTMLElement>('[part="heading"]')!;if(!next)target.tabIndex=-1;target.focus();}
  }
}
