import { BaseElement } from "../../core/element.js";
import { SplitView } from "../../components/layout/split-view.js";
import { Button } from "../../components/actions/button.js";
import { CodeBlock } from "../../components/output/code-block.js";
import { boeControl, boeRadius } from "../../foundations/geometry/index.js";
import { boeStatusGlyph, boeStatusStyles } from "../../foundations/status/index.js";
import { boeEntrance, boeEntranceKeyframes, boeReducedMotionPolicy } from "../../foundations/motion/index.js";
import { callFailed, callStatus, formatCallHttp, type CallEntry } from "./types.js";
import type { CallConsoleController } from "./controller.js";
const DEFAULT_TAG_NAME = "box-call-console";
export async function copyCallText(text: string, doc: Document = document): Promise<boolean> {
  try { await doc.defaultView?.navigator.clipboard.writeText(text); if (doc.defaultView?.navigator.clipboard) return true; } catch {}
  const active = doc.activeElement as HTMLElement | null;
  const textarea = doc.createElement("textarea"); textarea.value = text; textarea.style.cssText = "position:fixed;opacity:0"; doc.body.append(textarea); textarea.select();
  try { return doc.execCommand?.("copy") ?? false; } finally {textarea.remove(); active?.focus({preventScroll:true});}
}
export class CallConsole extends BaseElement {
  static readonly tagName = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] { return ["heading", "hide-heading"]; }
  private model: CallConsoleController | null = null;
  private labels: Record<string, string> = {};
  private failureRule: (entry: CallEntry) => boolean = callFailed;
  private unsubscribe?: () => void;
  private selected = "";
  private clearing = false;
  private rowSignatures = new WeakMap<HTMLButtonElement, string>();
  get callController(): CallConsoleController | null {return this.model;}
  set callController(value: CallConsoleController | null) {this.unsubscribe?.(); this.model = value; if (this.isConnected) this.listen(); if (this.isRendered) this.update();}
  get heading(): string { return this.getAttribute("heading") ?? "API calls"; }
  set heading(value: string) { this.setAttribute("heading", value); }
  get serviceLabels(): Record<string, string> { return this.labels; }
  set serviceLabels(value: Record<string, string>) { this.labels = value; if (this.isRendered) this.update(); }
  get isFailed(): (entry: CallEntry) => boolean { return this.failureRule; }
  set isFailed(value: (entry: CallEntry) => boolean) { this.failureRule = value; if (this.isRendered) this.update(); }
  private listen(): void {this.unsubscribe?.(); this.unsubscribe = this.model?.subscribe(() => this.update());}
  connectedCallback(): void {super.connectedCallback(); this.listen();}
  disconnectedCallback(): void {this.unsubscribe?.();}
  protected renderTemplate(): void {
    SplitView.register(); Button.register(); CodeBlock.register();
    this.shadowRoot!.innerHTML = `<style>:host{display:block;min-width:0;color:var(--boe-token-text-text,#222);font:inherit}:host([hidden]){display:none !important}
    :host{container-type:inline-size;font-size:14px;line-height:1.5}
    *{box-sizing:border-box} [hidden]{display:none!important}
    [part="console"]{border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:${boeRadius.large};background:var(--boe-token-surface-surface,#fff);overflow:hidden}
    header,.filters,.pane-heading{display:flex;gap:.75rem;flex-wrap:wrap;align-items:center;padding:1rem}
    header{justify-content:space-between} h2,h3,p{margin:0} h2{font-size:16px} h3{font-size:14px} small,.muted{color:var(--boe-token-text-text-secondary,#666);font-size:12px}
    #connection{display:inline-flex;align-items:center;gap:.4rem;font-size:12px}
    .filters{border-block:1px solid var(--boe-token-stroke-stroke,#ddd);background:var(--boe-token-surface-surface-secondary,#f7f7f7);padding:.75rem 1rem}
    label{display:flex;align-items:center;gap:.5rem;font-size:13px} .search{flex:1;min-width:10rem} .search input{width:100%}
    input[type="search"],select{min-height:${boeControl.height};border:1px solid var(--boe-token-stroke-stroke,#ccc);border-radius:${boeRadius.control};background:var(--boe-token-surface-surface,#fff);color:inherit;font:inherit;padding:.35rem .65rem;min-width:0}
    input[type="checkbox"]{accent-color:var(--boe-token-surface-surface-brand,#0061d5)}
    button:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--boe-token-surface-surface-brand,#0061d5);outline-offset:-2px}
    .pane-heading{justify-content:space-between;padding:.75rem 1rem;border-bottom:1px solid var(--boe-token-stroke-stroke,#ddd)}
    #list{overflow:auto;max-height:34rem;min-height:20rem;padding:.35rem}
    [part="call"]{font:inherit;color:inherit;border:1px solid transparent;background:transparent;border-radius:${boeRadius.med};width:100%;display:grid;grid-template-columns:minmax(0,1fr) auto;text-align:left;gap:.3rem .75rem;padding:.75rem;cursor:pointer;${boeEntrance()}}
    [part="call"]:hover{background:var(--boe-token-surface-surface-secondary,#f5f5f5)}
    [part="call"][aria-current="true"]{background:var(--boe-token-surface-item-surface-selected,#eaf3ff);border-color:var(--boe-token-surface-surface-brand,#0061d5)}
    [part="call"] span{min-width:0;overflow-wrap:anywhere} [part="call"] .state{display:flex;gap:.4rem;align-items:center;font-size:12px} [part="call"] .summary{font-weight:600} [part="call"] .duration{text-align:right;font-variant-numeric:tabular-nums;font-size:12px}
    #inspector{padding:1rem;min-width:0;max-height:38rem;overflow:auto} #summary{font-size:15px;overflow-wrap:anywhere} #metadata{margin:.25rem 0 1rem;overflow-wrap:anywhere} .code-heading{margin:1rem 0 .5rem}
    #outcome{padding:.6rem .75rem;margin:.75rem 0;border-radius:${boeRadius.med};background:var(--boe-token-surface-surface-secondary,#f5f5f5);overflow-wrap:anywhere}
    #copy-status{font-size:12px;color:var(--boe-token-text-text-secondary,#666)}
    #list-empty,#detail-empty{padding:2.5rem 1rem;text-align:center;color:var(--boe-token-text-text-secondary,#666)}
    [part="skeleton"]{height:3rem;margin:.5rem;background:var(--boe-token-surface-surface-secondary,#eee);border-radius:${boeRadius.med}}
    box-code-block::part(pre){max-height:18rem;overflow:auto}
    @container(max-width:640px){box-split-view::part(split-view){grid-template-columns:minmax(0,1fr)!important}box-split-view::part(separator){display:none}#list{min-height:0;max-height:17rem}#inspector{border-top:1px solid var(--boe-token-stroke-stroke,#ddd)}.search{flex-basis:100%}}
    ${boeEntranceKeyframes}${boeStatusStyles}${boeReducedMotionPolicy}</style>
    <section part="console" aria-label="API call console">
    <header><div part="heading"><h2></h2><small>Inspect requests, responses, and tool outcomes</small></div><span id="connection" role="status"></span><box-button id="retry" label="Reconnect" tone="neutral" hidden></box-button></header>
    <div class="filters"><label class="search">Search <input id="search" type="search" placeholder="Method, URL, or summary"></label><label>Service <select id="service" aria-label="Service"><option value="">All services</option></select></label><label><input type="checkbox" id="errors"> Errors only</label><box-button id="clear" label="Clear calls" tone="neutral"></box-button></div>
    <box-split-view resizable ratio="0.42" label="Calls and request inspector"><section slot="primary" aria-label="Calls"><div class="pane-heading"><h3>Requests</h3><span id="count" class="muted" role="status"></span></div><div id="list"></div><p id="list-empty" role="status" hidden></p></section><section aria-label="Request inspector"><div class="pane-heading"><h3>Inspector</h3><box-button data-copy="both" label="Copy both" tone="neutral"></box-button><span id="copy-status" role="status"></span></div><p id="detail-empty">Select a request to inspect its details.</p><div id="inspector" hidden><h3 id="summary"></h3><p id="metadata" class="muted"></p><p id="outcome" role="status" hidden></p><h3 class="code-heading">Request</h3><box-code-block id="request" copy-label="Copy request" wrap></box-code-block><h3 class="code-heading">Response</h3><box-code-block id="response" copy-label="Copy response" wrap></box-code-block></div></section></box-split-view></section>`;
  }
  protected setupListeners(): void {
    this.shadowRoot!.querySelector("#list")!.addEventListener("keydown", event => {
      const e=event as KeyboardEvent;
      const rows=Array.from(this.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="call"]'));
      const current=rows.indexOf(e.target as HTMLButtonElement);
      if(current<0 || !["ArrowDown","ArrowUp","Home","End"].includes(e.key))return;
      e.preventDefault();const next=e.key==="Home" ? 0 : e.key==="End" ? rows.length-1 : (current+(e.key==="ArrowDown" ? 1 : -1)+rows.length)%rows.length;
      rows[next]!.focus();rows[next]!.click();
    });
    const filter = (): void => { this.update(); this.dispatchEvent(new CustomEvent("filters-changed",{bubbles:true,composed:true,detail:this.filters})); };
    this.shadowRoot!.querySelector("#service")!.addEventListener("change", filter);
    this.shadowRoot!.querySelector("#errors")!.addEventListener("change", filter);
    this.shadowRoot!.querySelector("#search")!.addEventListener("input", filter);
    this.shadowRoot!.querySelector("#retry")!.addEventListener("click", () => {void this.model?.connect();});
    this.shadowRoot!.querySelector("#clear")!.addEventListener("click", async () => {
      if (!this.model || this.clearing) return;
      this.clearing=true;this.update();
      try {await this.model.clear();this.dispatchEvent(new CustomEvent("calls-cleared",{bubbles:true,composed:true}));}
      catch {this.shadowRoot!.querySelector("#copy-status")!.textContent="Unable to clear calls. Try again.";}
      finally {this.clearing=false;this.update();}
    });
    this.shadowRoot!.querySelectorAll<HTMLElement>("[data-copy]").forEach(b => b.addEventListener("click", async () => {
      const entry = this.model?.entries.find(e => e.id === this.selected); if (!entry) return;
      const ok = await copyCallText(formatCallHttp(entry, b.dataset.copy as "request" | "response" | "both"));
      this.shadowRoot!.querySelector("#copy-status")!.textContent = ok ? "Copied" : "Copy unavailable; select the text to copy";
    }));
  }
  private get filters(): {service:string;errorsOnly:boolean;query:string} {
    return {service:(this.shadowRoot!.querySelector("#service") as HTMLSelectElement).value,errorsOnly:(this.shadowRoot!.querySelector("#errors") as HTMLInputElement).checked,query:(this.shadowRoot!.querySelector("#search") as HTMLInputElement).value};
  }
  protected update(): void {
    if (!this.isRendered) return;
    this.shadowRoot!.querySelector<HTMLElement>('[part="heading"]')!.hidden=this.hasAttribute("hide-heading");
    this.shadowRoot!.querySelector("h2")!.textContent=this.heading;
    const state = this.model?.connection ?? "connecting";
    const connection=this.shadowRoot!.querySelector("#connection")!;
    connection.textContent = this.model ? ({live:"Live",connecting:"Connecting…",reconnecting:"Reconnecting…",unavailable:"Endpoint unavailable"}[state]) : "Not connected";
    (this.shadowRoot!.querySelector("#retry") as HTMLElement).hidden=!this.model || state === "live" || state === "connecting";
    const clear=this.shadowRoot!.querySelector<Button>("#clear")!;clear.disabled=this.clearing || !this.model?.entries.length;clear.label=this.clearing ? "Clearing…" : "Clear calls";
    const service = this.shadowRoot!.querySelector<HTMLSelectElement>("#service")!;
    const services = [...new Set(this.model?.entries.map(e => e.service) ?? [])];
    for (const name of services) if (!Array.from(service.options).some(o => o.value === name)) {const option = document.createElement("option"); option.value = name; service.append(option);}
    for (const option of Array.from(service.options)) if (option.value) option.textContent=this.labels[option.value] ?? option.value;
    const errors = this.shadowRoot!.querySelector<HTMLInputElement>("#errors")!.checked;
    const entries = this.model?.entries.filter(e => (!service.value || e.service === service.value) && (!errors || this.failureRule(e))) ?? [];
    const query=this.filters.query.trim().toLowerCase();
    const filtered=entries.filter(e=>`${e.method} ${e.url} ${e.summary} ${e.service} ${this.labels[e.service] ?? ""}`.toLowerCase().includes(query));
    entries.splice(0,entries.length,...filtered);
    if (!entries.some(e => e.id === this.selected)) this.selected = entries[0]?.id ?? "";
    const list = this.shadowRoot!.querySelector("#list")!;
    const focused = this.shadowRoot!.activeElement?.getAttribute("data-call-id");
    list.querySelectorAll('[part="skeleton"]').forEach(el => el.remove());
    const existing = new Map(Array.from(list.children).map(el => [el.getAttribute("data-call-id"), el]));
    for (const [index,entry] of entries.entries()) {
      let button = existing.get(entry.id) as HTMLButtonElement | undefined; existing.delete(entry.id);
      if (!button) {button = document.createElement("button"); button.type="button";button.setAttribute("part", "call"); button.dataset.callId = entry.id; button.addEventListener("click", () => {this.selected = entry.id; this.update();this.dispatchEvent(new CustomEvent("call-selected",{bubbles:true,composed:true,detail:{id:entry.id}}));});}
      button.setAttribute("aria-current", String(entry.id === this.selected));
      const labels=[callStatus(entry,this.failureRule),this.labels[entry.service] ?? entry.service,entry.summary,entry.pending ? "In progress" : `${Math.round(entry.durationMs)} ms`];
      const signature=JSON.stringify(labels);
      if(this.rowSignatures.get(button)!==signature){
        button.replaceChildren(...labels.map((text,index) => {const span = document.createElement("span"); span.textContent = text;span.className=["state","muted","summary","duration"][index]!;if(index===0){const icon=document.createElement("span");icon.innerHTML=boeStatusGlyph(this.failureRule(entry) ? "failed" : entry.pending ? "active" : entry.expected ? "skipped" : "done");span.prepend(icon);}return span;}));
        this.rowSignatures.set(button,signature);
      }
      if(list.children[index]!==button)list.insertBefore(button,list.children[index] ?? null);
      if (entry.id === focused) button.focus({preventScroll:true});
    }
    existing.forEach(el => el.remove());
    if (!entries.length && state === "connecting" && this.model) list.innerHTML = '<div part="skeleton"></div><div part="skeleton"></div><div part="skeleton"></div>';
    this.shadowRoot!.querySelector("#count")!.textContent=`${entries.length} of ${this.model?.entries.length ?? 0}`;
    const empty=this.shadowRoot!.querySelector<HTMLElement>("#list-empty")!;
    empty.hidden=entries.length>0 || !!this.model && state==="connecting";
    empty.textContent=!this.model ? "Connect a call controller to inspect requests." : state==="unavailable" ? "Call history is unavailable. Reconnect when the service is ready." : state==="reconnecting" ? "Connection interrupted. Reconnect to load calls." : this.model.entries.length ? "No requests match these filters." : "No calls yet. New requests will appear here.";
    const entry = entries.find(e => e.id === this.selected);
    this.shadowRoot!.querySelector<Button>('[data-copy="both"]')!.disabled=!entry;
    this.shadowRoot!.querySelector<HTMLElement>("#inspector")!.hidden=!entry;
    this.shadowRoot!.querySelector<HTMLElement>("#detail-empty")!.hidden=!!entry;
    this.shadowRoot!.querySelector("#summary")!.textContent=entry?.summary ?? "";
    this.shadowRoot!.querySelector("#metadata")!.textContent=entry ? `${this.labels[entry.service] ?? entry.service} · ${entry.method} · ${entry.pending ? "In progress" : `${entry.durationMs} ms`} · ${new Date(entry.startedAt).toLocaleTimeString()}` : "";
    const outcome=this.shadowRoot!.querySelector<HTMLElement>("#outcome")!;
    outcome.hidden=!entry || !(entry.error || entry.rpcError || entry.expected || entry.pending);
    outcome.textContent=entry?.rpcError ? `Tool failed despite HTTP ${entry.status}: ${entry.rpcError}` : entry?.error ?? entry?.expected ?? (entry?.pending ? "Waiting for the response…" : "");
    this.shadowRoot!.querySelector<CodeBlock>("#request")!.code = entry ? formatCallHttp(entry,"request") : "";
    this.shadowRoot!.querySelector<CodeBlock>("#response")!.code = entry ? entry.pending ? "Response pending" : formatCallHttp(entry,"response") : "";
  }
}
CallConsole.register();
