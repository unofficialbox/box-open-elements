import { BaseElement } from "../../core/element.js";
import { SplitView } from "../../components/layout/split-view.js";
import { boeEntrance, boeEntranceKeyframes, boeReducedMotionPolicy } from "../../foundations/motion/index.js";
import { callFailed, callStatus, formatCallHttp } from "./types.js";
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
  private model: CallConsoleController | null = null;
  private unsubscribe?: () => void;
  private selected = "";
  get callController(): CallConsoleController | null {return this.model;}
  set callController(value: CallConsoleController | null) {this.unsubscribe?.(); this.model = value; if (this.isConnected) this.listen(); if (this.isRendered) this.update();}
  private listen(): void {this.unsubscribe?.(); this.unsubscribe = this.model?.subscribe(() => this.update());}
  connectedCallback(): void {super.connectedCallback(); this.listen();}
  disconnectedCallback(): void {this.unsubscribe?.();}
  protected renderTemplate(): void {
    SplitView.register();
    this.shadowRoot!.innerHTML = `<style>:host{display:block;min-width:0;color:var(--boe-token-text-text,#222);font:inherit}:host([hidden]){display:none !important}
    header{display:flex;gap:.75rem;flex-wrap:wrap;align-items:center} pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:.8rem;max-height:30rem;overflow:auto}
    button,select{font:inherit;color:inherit;background:var(--boe-token-surface-surface,#fff);border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:5px;padding:.4rem;cursor:pointer}
    [part="call"]{width:100%;display:grid;grid-template-columns:5rem 5rem minmax(0,1fr) 4rem;text-align:left;gap:.5rem;margin:.4rem 0;${boeEntrance()}}
    #list{container-type:inline-size} [part="call"] span{min-width:0;overflow-wrap:anywhere}
    @container(max-width:420px){[part="call"]{grid-template-columns:minmax(0,1fr) auto}[part="call"] span:nth-child(even){text-align:right}}
    [aria-current="true"]{background:var(--boe-token-surface-surface-secondary,#f5f5f5)} [part="skeleton"]{height:2rem;margin:.5rem;background:var(--boe-token-surface-surface-secondary,#eee)}
    ${boeEntranceKeyframes}${boeReducedMotionPolicy}</style>
    <header><span id="connection" role="status"></span><label>Service <select id="service"><option value="">All</option></select></label><label><input type="checkbox" id="errors"> Errors only</label><button id="clear">Clear</button><span id="copy-status" role="status"></span></header>
    <box-split-view resizable ratio="0.4"><div slot="primary" id="list"></div><div><button data-copy="request">Copy request</button><button data-copy="response">Copy response</button><button data-copy="both">Copy both</button><h3>Request <button data-copy="request" aria-label="Copy request code">⧉</button></h3><pre id="request"></pre><h3>Response <button data-copy="response" aria-label="Copy response code">⧉</button></h3><pre id="response"></pre></div></box-split-view>`;
  }
  protected setupListeners(): void {
    this.shadowRoot!.querySelector("#service")!.addEventListener("change", () => this.update());
    this.shadowRoot!.querySelector("#errors")!.addEventListener("change", () => this.update());
    this.shadowRoot!.querySelector("#clear")!.addEventListener("click", () => {void this.model?.clear().catch(() => {this.shadowRoot!.querySelector("#copy-status")!.textContent = "Unable to clear calls";});});
    this.shadowRoot!.querySelectorAll<HTMLElement>("[data-copy]").forEach(b => b.addEventListener("click", async () => {
      const entry = this.model?.entries.find(e => e.id === this.selected); if (!entry) return;
      const ok = await copyCallText(formatCallHttp(entry, b.dataset.copy as "request" | "response" | "both"));
      this.shadowRoot!.querySelector("#copy-status")!.textContent = ok ? "Copied" : "Copy unavailable; select the text to copy";
    }));
  }
  protected update(): void {
    const state = this.model?.connection ?? "connecting";
    this.shadowRoot!.querySelector("#connection")!.textContent = state === "unavailable" ? "Restart the agent: /calls is unavailable" : state;
    const service = this.shadowRoot!.querySelector<HTMLSelectElement>("#service")!;
    const services = [...new Set(this.model?.entries.map(e => e.service) ?? [])];
    for (const name of services) if (!Array.from(service.options).some(o => o.value === name)) {const option = document.createElement("option"); option.value = name; option.textContent = name; service.append(option);}
    const errors = this.shadowRoot!.querySelector<HTMLInputElement>("#errors")!.checked;
    const entries = this.model?.entries.filter(e => (!service.value || e.service === service.value) && (!errors || callFailed(e))) ?? [];
    if (!entries.some(e => e.id === this.selected)) this.selected = entries[0]?.id ?? "";
    const list = this.shadowRoot!.querySelector("#list")!;
    const focused = this.shadowRoot!.activeElement?.getAttribute("data-call-id");
    list.querySelectorAll('[part="skeleton"]').forEach(el => el.remove());
    const existing = new Map(Array.from(list.children).map(el => [el.getAttribute("data-call-id"), el]));
    for (const entry of entries) {
      let button = existing.get(entry.id) as HTMLButtonElement | undefined; existing.delete(entry.id);
      if (!button) {button = document.createElement("button"); button.setAttribute("part", "call"); button.dataset.callId = entry.id; button.addEventListener("click", () => {this.selected = entry.id; this.update();});}
      button.setAttribute("aria-current", String(entry.id === this.selected));
      button.replaceChildren(...[callStatus(entry),entry.service,entry.summary,`${Math.round(entry.durationMs)} ms`].map(text => {const span = document.createElement("span"); span.textContent = text; return span;})); list.append(button);
      if (entry.id === focused) button.focus({preventScroll:true});
    }
    existing.forEach(el => el.remove());
    if (!entries.length && state === "connecting") list.innerHTML = '<div part="skeleton"></div><div part="skeleton"></div><div part="skeleton"></div>';
    const entry = entries.find(e => e.id === this.selected);
    this.shadowRoot!.querySelector("#request")!.textContent = entry ? formatCallHttp(entry,"request") : "Select a call";
    this.shadowRoot!.querySelector("#response")!.textContent = entry ? formatCallHttp(entry,"response") : "";
  }
}
CallConsole.register();
