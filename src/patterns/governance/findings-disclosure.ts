import { BaseElement } from "../../core/index.js";
import { renderHeadingHtml, type HeadingLevel } from "../../foundations/a11y/heading.js";

export interface FindingCorrection { field: string; was: string; now: string; why: string; }
const DEFAULT_TAG_NAME = "box-findings-disclosure";
const escape = (text: string): string => text.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const read = (host: HTMLElement, name: string): unknown[] => { try { const value: unknown=JSON.parse(host.getAttribute(name)??"[]"); return Array.isArray(value)?value:[]; }catch{return [];} };
const styles = `
:host{display:block;min-inline-size:0;color:var(--boe-token-text-text,#102347);font:inherit}
:host([hidden]){display:none!important}[hidden]{display:none!important}*{box-sizing:border-box}
[part=panel]{padding:1.5rem;border:1px solid var(--boe-token-stroke-stroke,#e8e8e8);border-radius:.375rem;background:var(--boe-token-surface-surface,#fff);display:grid;gap:1rem;overflow-wrap:anywhere}
h2,h3,p,ul,dl,dd{margin:0}h2{font-size:1.125rem;font-weight:650}[part=detail-heading],dt{font-size:.875rem;font-weight:600}
ul{padding-inline-start:1.25rem;display:grid;gap:.5rem}p,li,dd{font-size:.875rem;line-height:1.6}
[part=correction-summary]{font-size:.8125rem;color:var(--boe-token-text-text-secondary,#566781);line-height:1.5}
[part=details]{display:grid;gap:1rem;border-block-start:1px solid var(--boe-token-stroke-stroke,#e8e8e8);padding-block-start:1rem}
[part=corrections]{display:grid;gap:.875rem}dd{padding-block-start:.25rem}
button{justify-self:start;text-align:start;appearance:none;font:inherit;font-size:.8125rem;font-weight:600;color:var(--boe-token-surface-surface-brand,#0061d5);background:transparent;border:1px solid var(--boe-token-stroke-stroke,#e8e8e8);border-radius:.375rem;min-block-size:2.75rem;padding:.5rem .75rem;cursor:pointer}
button:focus-visible{outline:2px solid var(--boe-token-surface-surface-brand,#0061d5);outline-offset:3px}
@media(max-width:480px){[part=panel]{padding:1rem}}
`;
/** Keep corrected conclusions discoverable even when supporting detail is collapsed. */
export class FindingsDisclosure extends BaseElement {
  static readonly tagName = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] { return ["heading","heading-level","findings","corrections","limits","lead-count","expanded"]; }
  get heading(): string { return this.getAttribute("heading")??"Findings"; }
  set heading(value:string){this.setAttribute("heading",value);}
  get headingLevel(): HeadingLevel { const n=Number(this.getAttribute("heading-level")??2);return Number.isInteger(n)&&n>=1&&n<=6?n as HeadingLevel:2; }
  set headingLevel(value:HeadingLevel){this.setAttribute("heading-level",String(value));}
  get findings(): string[] { return read(this,"findings").filter((s):s is string=>typeof s==="string"); }
  set findings(value:string[]){this.setAttribute("findings",JSON.stringify(value));}
  get corrections(): FindingCorrection[] { return read(this,"corrections").filter((c):c is FindingCorrection=>!!c&&typeof c==="object"&&["field","was","now","why"].every(k=>typeof (c as Record<string,unknown>)[k]==="string")); }
  set corrections(value:FindingCorrection[]){this.setAttribute("corrections",JSON.stringify(value));}
  get limits(): string[] { return read(this,"limits").filter((s):s is string=>typeof s==="string"); }
  set limits(value:string[]){this.setAttribute("limits",JSON.stringify(value));}
  get leadCount(): number { const n=Number(this.getAttribute("lead-count")??1);return Number.isInteger(n)&&n>=0?n:1; }
  set leadCount(value:number){this.setAttribute("lead-count",String(value));}
  get expanded():boolean{return this.hasAttribute("expanded");}
  set expanded(value:boolean){this.toggleAttribute("expanded",value);}
  connectedCallback():void{
    this.upgradeProperties(["heading","headingLevel","findings","corrections","limits","leadCount","expanded"]);
    super.connectedCallback();
  }
  protected renderTemplate():void{
    this.shadowRoot!.innerHTML=`<style>${styles}</style><section part="panel"><div part="heading"></div><ul part="lead"></ul><p part="correction-summary" hidden></p><button type="button" part="toggle" aria-controls="finding-details" hidden></button><div part="details" role="region" id="finding-details" hidden></div></section>`;
  }
  protected setupListeners():void{
    this.shadowRoot!.querySelector('[part="toggle"]')!.addEventListener("click",()=>{
      this.expanded=!this.expanded;
      this.dispatchEvent(new CustomEvent("expanded-changed",{bubbles:true,composed:true,detail:{expanded:this.expanded}}));
    });
  }
  protected update():void{
    if(!this.isRendered)return;
    const toggleFocused=this.shadowRoot!.activeElement?.getAttribute("part")==="toggle";
    const root=this.shadowRoot!,findings=this.findings,corrections=this.corrections,limits=this.limits;
    const headingHost=root.querySelector('[part="heading"]')!;
    const headingFocused=headingHost.contains(root.activeElement);
    if(headingHost.firstElementChild?.localName===`h${this.headingLevel}`)headingHost.firstElementChild.textContent=this.heading;
    else headingHost.innerHTML=renderHeadingHtml(this.heading,{level:this.headingLevel});
    if(headingFocused){const heading=headingHost.firstElementChild as HTMLElement;heading.tabIndex=-1;heading.focus();}
    root.querySelector('[part="panel"]')!.setAttribute("aria-label",this.heading);
    const list=(items:string[])=>items.map(text=>`<li>${escape(text)}</li>`).join("");
    const lead=root.querySelector<HTMLElement>('[part="lead"]')!;lead.innerHTML=list(findings.slice(0,this.leadCount));lead.hidden=!lead.childElementCount;
    const summary=root.querySelector<HTMLElement>('[part="correction-summary"]')!;
    summary.textContent=corrections.length?`Corrected: ${corrections.map(c=>c.field).join("; ")}`:"";summary.hidden=!corrections.length;
    const detailHeading=(text:string)=>renderHeadingHtml(text,{level:Math.min(6,this.headingLevel+1) as HeadingLevel,part:"detail-heading"});
    const remaining=findings.slice(this.leadCount);
    const counts=[remaining.length?`${remaining.length} more finding${remaining.length===1?"":"s"}`:"",corrections.length?`${corrections.length} correction${corrections.length===1?"":"s"}`:"",limits.length?`${limits.length} limit${limits.length===1?"":"s"}`:""].filter(Boolean).join(" · ");
    const toggle=root.querySelector<HTMLButtonElement>('[part="toggle"]')!;
    toggle.hidden=!counts;toggle.textContent=`${this.expanded?"Hide":"Show"} ${counts}`;toggle.setAttribute("aria-expanded",String(this.expanded));
    const details=root.querySelector<HTMLElement>('[part="details"]')!;details.hidden=!counts||!this.expanded;details.setAttribute("aria-label",`${this.heading} supporting details`);
    // Host strings are text, never markup. Corrections retain both the old and new conclusion.
    details.innerHTML=`${remaining.length?`<section>${detailHeading("More findings")}<ul>${list(remaining)}</ul></section>`:""}${corrections.length?`<section>${detailHeading("Corrections")}<dl part="corrections">${corrections.map(c=>`<div><dt>Corrected: ${escape(c.field)}</dt><dd>Was: ${escape(c.was)}<br>Now: ${escape(c.now)}<br>Reason: ${escape(c.why)}</dd></div>`).join("")}</dl></section>`:""}${limits.length?`<section>${detailHeading("Limits")}<ul>${list(limits)}</ul></section>`:""}`;
    if(toggleFocused&&toggle.hidden){const heading=root.querySelector<HTMLElement>('[part="heading"] h1,[part="heading"] h2,[part="heading"] h3,[part="heading"] h4,[part="heading"] h5,[part="heading"] h6')!;heading.tabIndex=-1;heading.focus();}
  }
}
FindingsDisclosure.register();
