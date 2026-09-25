import { BaseElement } from "../../core/element.js";
import { AgentChat } from "../agent-chat/agent-chat.js";
import { isSafeHref } from "../internal/safe-href.js";
import { boeMotionEasing, boeReducedMotionPolicy } from "../../foundations/motion/index.js";
import { trapTabKey } from "../../foundations/a11y/focus.js";
import type { AgentWorkspaceController } from "./controller.js";
const DEFAULT_TAG_NAME = "box-agent-workspace";
export class AgentWorkspace extends BaseElement {
  static readonly tagName = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] { return ["viewer-key", "hide-toggles"]; }
  private model: AgentWorkspaceController | null = null;
  private unsubscribe?: () => void;
  private observer?: ResizeObserver;
  private mobile = false;
  private chatsOpen = true;
  private detailsOpen = false;
  private initialized = false;
  private renderedActive: string | null = null;
  private chatIds = "";
  private lastPanes: { chats: boolean; details: boolean } | null = null;
  private sessions = new Map<string, AgentChat>();
  /** Host-controlled pane state; mobile drawers remain mutually exclusive. */
  get panes(): { chats: boolean; details: boolean } { return { chats: this.chatsOpen, details: this.detailsOpen }; }
  set panes(value: { chats?: boolean; details?: boolean }) {
    if (value.chats !== undefined) this.chatsOpen = value.chats;
    if (value.details !== undefined) this.detailsOpen = value.details;
    if (this.mobile && this.chatsOpen && this.detailsOpen) this.chatsOpen = false;
    this.syncPanes();
  }
  get workspaceController(): AgentWorkspaceController | null { return this.model; }
  set workspaceController(value: AgentWorkspaceController | null) {
    this.unsubscribe?.(); this.model = value;
    if (this.isConnected) this.listen();
    if (this.isRendered) this.update();
  }
  connectedCallback(): void {
    super.connectedCallback(); this.listen(); this.resize();
    if (typeof ResizeObserver !== "undefined") { this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(this); }
  }
  disconnectedCallback(): void { this.unsubscribe?.(); this.observer?.disconnect(); }
  private listen(): void { this.unsubscribe?.(); this.unsubscribe = this.model?.subscribe(() => this.update()); }
  private resize(): void {
    const width = this.getBoundingClientRect().width || 1200;
    const mobile = width < 900;
    if (!this.initialized || mobile !== this.mobile) {
      this.chatsOpen = !mobile; this.detailsOpen = width >= 1200;
      if (!mobile) {
        try { const saved = JSON.parse(localStorage.getItem(this.storageKey()) ?? "null"); if (saved && typeof saved.chats === "boolean" && typeof saved.details === "boolean") {this.chatsOpen = saved.chats; this.detailsOpen = saved.details;} } catch {}
      }
      this.mobile = mobile; this.initialized = true;
    }
    this.syncPanes();
  }
  private storageKey(): string { return `boe-workspace:${this.getAttribute("viewer-key") ?? "default"}`; }
  toggle(pane: "chats" | "details"): void { this.open(pane, !(pane === "chats" ? this.chatsOpen : this.detailsOpen)); }
  open(pane: "chats" | "details", open: boolean): void {
    if (pane === "chats") {this.chatsOpen = open; if (this.mobile && open) this.detailsOpen = false;}
    else {this.detailsOpen = open; if (this.mobile && open) this.chatsOpen = false;}
    if (!this.mobile) try { localStorage.setItem(this.storageKey(), JSON.stringify({chats: this.chatsOpen, details: this.detailsOpen})); } catch {}
    this.syncPanes();
    if (this.mobile && open) this.shadowRoot!.querySelector<HTMLElement>(`#${pane} button`)?.focus({preventScroll:true});
  }
  private closeDrawers(): void { this.chatsOpen = false; this.detailsOpen = false; this.syncPanes(); this.sessions.get(this.model?.activeId ?? "")?.focusComposer(); }
  private syncPanes(): void {
    if (!this.isRendered) return;
    const toggleGroup = this.shadowRoot!.querySelector<HTMLElement>('[part="toggles"]');
    if (toggleGroup) toggleGroup.hidden = this.hasAttribute("hide-toggles");
    this.toggleAttribute("data-mobile", this.mobile);
    for (const [pane, open] of [["chats", this.chatsOpen], ["details", this.detailsOpen]] as const) {
      const el = this.shadowRoot!.getElementById(pane)!; el.inert = !open; el.toggleAttribute("data-open", open);
      if (this.mobile && open) {el.setAttribute("role","dialog");el.setAttribute("aria-modal","true");el.setAttribute("aria-label",pane === "chats" ? "Conversations" : "Conversation details");}
      else {el.removeAttribute("role");el.removeAttribute("aria-modal");}
      this.shadowRoot!.querySelector(`[data-toggle="${pane}"]`)!.setAttribute("aria-expanded", String(open));
    }
    const overlaid = this.mobile && (this.chatsOpen || this.detailsOpen);
    this.shadowRoot!.querySelector<HTMLElement>("#conversation")!.inert = overlaid;
    this.shadowRoot!.querySelector<HTMLElement>("#scrim")!.hidden = !overlaid;
    for (const chat of this.sessions.values()) chat.toggleAttribute("hide-citations", this.detailsOpen);
    for (const pane of ["chats", "details"] as const) {
      const open = this.panes[pane];
      if (this.lastPanes?.[pane] !== open) this.dispatchEvent(new CustomEvent("pane-change", {bubbles:true,composed:true,detail:{pane,open,mobile:this.mobile}}));
    }
    this.lastPanes = this.panes;
  }
  protected renderTemplate(): void {
    AgentChat.register();
    this.shadowRoot!.innerHTML = `<style>
    :host{display:block;height:100%;min-height:30rem;color:var(--boe-token-text-text,#222);font:inherit}:host([hidden]){display:none !important}
    *{box-sizing:border-box} section{position:relative;overflow:clip;height:100%;display:flex;min-width:0}
    aside{width:0;overflow:clip;transition:width var(--boe-profile-motion-panel,320ms) ${boeMotionEasing.enter};background:var(--boe-token-surface-surface,#fff)} aside[data-open]{width:280px;flex-shrink:0}
    aside>div{width:280px;height:100%;padding:1rem;overflow:auto} main{min-width:0;flex:1;overflow:clip;display:flex;flex-direction:column;background:var(--boe-token-surface-surface,#fff)} nav{display:flex;justify-content:space-between;padding:.5rem}
    #conversation{flex:1;min-height:0} #sessions,box-agent-chat{height:100%}
    box-agent-chat::part(panel){height:100%;box-sizing:border-box;display:flex;flex-direction:column;border:0;border-radius:0}
    box-agent-chat::part(thread){flex:1;min-height:0;max-block-size:none;align-content:start}
    button,a{font:inherit;color:inherit} button{cursor:pointer;border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:999px;background:var(--boe-token-surface-surface,#fff);min-height:32px;padding:.3rem .8rem;font-size:13px;font-weight:600}
    button:focus-visible,a:focus-visible{outline:2px solid var(--boe-token-surface-surface-brand,#0061d5);outline-offset:2px}
    [part="chat"]{display:block;text-align:left;width:100%;border:0;background:none;padding:.65rem;border-radius:6px}
    [aria-current="page"]{background:var(--boe-token-surface-surface-secondary,#f3f3f3)} small{display:block;color:var(--boe-token-text-text-secondary,#666)}
    #scrim{position:absolute;inset:0;background:var(--boe-workspace-scrim,rgba(0,0,0,.33));border:0;border-radius:0;z-index:2} [hidden]{display:none!important}
    [data-close]{display:none} :host([data-mobile]) [data-close]{display:block;margin-bottom:.5rem}
    :host([data-mobile]) aside{position:absolute;inset-block:0;z-index:3} :host([data-mobile]) #details{right:0}
    #approvals button,#sources a{display:block;margin:.5rem 0;text-align:left} #context{white-space:pre-wrap;overflow-wrap:anywhere}
    ${boeReducedMotionPolicy}</style><section part="workspace">
    <aside id="chats" part="chats"><div><button data-close>Close conversations</button><slot name="chats"><button id="new">New chat</button><div id="list"></div></slot></div></aside>
    <main><nav><slot name="header"><div part="toggles" ${this.hasAttribute("hide-toggles") ? "hidden" : ""}><button data-toggle="chats" aria-controls="chats">Conversations</button><button data-toggle="details" aria-controls="details">Details</button></div></slot></nav><div id="conversation" part="conversation"><slot name="conversation"><div id="sessions"></div></slot></div></main>
    <button id="scrim" aria-label="Close panel" hidden></button>
    <aside id="details" part="details"><div><button data-close>Close details</button><slot name="details"><h2>Conversation details</h2><div id="context"></div><h3>Approvals</h3><div id="approvals"></div><h3>Sources</h3><div id="sources"></div></slot></div></aside></section>`;
  }
  protected setupListeners(): void {
    this.shadowRoot!.querySelector("#new")!.addEventListener("click", () => {this.model?.newChat(); if (this.mobile) this.closeDrawers();});
    this.shadowRoot!.querySelector("#scrim")!.addEventListener("click", () => this.closeDrawers());
    this.shadowRoot!.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>this.closeDrawers()));
    this.shadowRoot!.querySelectorAll<HTMLElement>("[data-toggle]").forEach(b => b.addEventListener("click", () => this.toggle(b.dataset.toggle as "chats" | "details")));
    this.shadowRoot!.querySelector('slot[name="conversation"]')!.addEventListener("slotchange", () => this.update());
    this.shadowRoot!.querySelector('slot[name="chats"]')!.addEventListener("slotchange", () => this.update());
    this.shadowRoot!.addEventListener("keydown", event => {
      const e = event as KeyboardEvent;
      if (e.key === "Escape" && this.mobile) { e.preventDefault(); this.closeDrawers(); }
      if (e.key === "Tab" && this.mobile && (this.chatsOpen || this.detailsOpen)) trapTabKey(e,this.shadowRoot!.getElementById(this.chatsOpen ? "chats" : "details")!);
    });
  }
  protected update(): void {
    if (!this.isRendered) return;
    const list = this.shadowRoot!.querySelector("#list")!;
    const hostChats = this.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="chats"]')!.assignedElements().length > 0;
    const ids = (this.model?.chats ?? []).map(chat => chat.id).join("\u0000");
    if (ids !== this.chatIds) { this.chatIds = ids; this.dispatchEvent(new CustomEvent("chats-change", {bubbles:true,composed:true,detail:{ids:(this.model?.chats ?? []).map(chat => chat.id),activeId:this.model?.activeId ?? null}})); }
    const activeRow = this.shadowRoot!.activeElement?.getAttribute("data-chat-id");
    list.replaceChildren();
    for (const summary of hostChats ? [] : this.model?.summaries ?? []) {
      const b = document.createElement("button"); b.setAttribute("part", "chat"); b.dataset.chatId = summary.id; b.textContent = summary.title;
      if (summary.id === this.model?.activeId) b.setAttribute("aria-current", "page");
      const small = document.createElement("small"); small.textContent = summary.status; b.append(small);
      b.addEventListener("click", () => {this.model?.select(summary.id); this.dispatchEvent(new CustomEvent("conversation-selected", {bubbles:true,composed:true,detail:{id:summary.id}})); if (this.mobile) this.closeDrawers();}); list.append(b);
      if (summary.id === activeRow) b.focus({preventScroll:true});
    }
    const hostConversation = this.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="conversation"]')!.assignedElements().length > 0;
    for (const [id, element] of this.sessions) if (hostConversation || !this.model?.chats.some(c => c.id === id && c.controller === element.chatController)) {element.remove(); this.sessions.delete(id);}
    for (const chat of hostConversation ? [] : this.model?.chats ?? []) {
      let element = this.sessions.get(chat.id);
      if (!element) {element = new AgentChat(); element.chatController = chat.controller; this.sessions.set(chat.id, element); this.shadowRoot!.querySelector("#sessions")!.append(element);}
      element.hidden = chat.id !== this.model?.activeId; element.inert = element.hidden;
    }
    const details = this.model?.details;
    this.shadowRoot!.querySelector("#context")!.textContent = details?.context ? Object.entries(details.context).map(([key,value]) => `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`).join("\n") : "";
    const approvals = this.shadowRoot!.querySelector("#approvals")!; approvals.replaceChildren();
    for (const {messageId, proposal} of details?.approvals ?? []) {
      const b = document.createElement("button"); b.textContent = `${proposal.title} — ${proposal.outcome === "failed" ? "Approved · didn't complete" : proposal.decision ?? "Needs your approval"}`;
      b.addEventListener("click", () => {if (this.mobile) this.closeDrawers(); this.sessions.get(this.model?.activeId ?? "")?.focusProposal(messageId, proposal.id);}); approvals.append(b);
    }
    const sources = this.shadowRoot!.querySelector("#sources")!; sources.replaceChildren();
    for (const source of details?.sources ?? []) {
      const el = document.createElement(source.href && isSafeHref(source.href) ? "a" : "span"); el.textContent = source.label;
      if (el instanceof HTMLAnchorElement) {el.href = source.href!; el.target = "_blank"; el.rel = "noopener noreferrer";} sources.append(el);
    }
    this.syncPanes();
    if (this.renderedActive !== this.model?.activeId) {this.renderedActive = this.model?.activeId ?? null; this.sessions.get(this.renderedActive ?? "")?.focusComposer();}
  }
}
AgentWorkspace.register();
