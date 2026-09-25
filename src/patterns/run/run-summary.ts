import { BaseElement } from "../../core/element.js";
import { boeDisclosureStyles, boeEntranceKeyframes, boeReducedMotionPolicy } from "../../foundations/motion/index.js";
import { StatusIcon } from "../../components/feedback/status-icon.js";
import { toStatusKind } from "../../foundations/status/index.js";
import { RunTrace } from "./run-trace.js";
import { progress, type RunTurn } from "./progress.js";
const DEFAULT_TAG_NAME = "box-run-summary";
export class RunSummary extends BaseElement {
  static readonly tagName = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] { return ["open", "failed", "elapsed-threshold"]; }
  private value: RunTurn = { steps: [], todos: [], startedAt: 0, endedAt: 0 };
  private timer: ReturnType<typeof setInterval> | undefined;
  private planSignature = "";
  private traceSignature = "";
  get turn(): RunTurn { return this.value; }
  set turn(turn: RunTurn) { this.value = turn; if (this.isRendered) this.update(); }
  get open(): boolean { return this.hasAttribute("open"); }
  set open(value: boolean) { this.toggleAttribute("open", value); }
  connectedCallback(): void { super.connectedCallback(); this.syncTimer(); }
  disconnectedCallback(): void { clearInterval(this.timer); this.timer = undefined; }
  private syncTimer(): void {
    if (this.value.endedAt === undefined && this.isConnected && !this.timer) this.timer = setInterval(() => this.updateLabel(), 1000);
    if (this.value.endedAt !== undefined) { clearInterval(this.timer); this.timer = undefined; }
  }
  protected renderTemplate(): void {
    StatusIcon.register(); RunTrace.register();
    this.shadowRoot!.innerHTML = `<style>:host{display:block;font:inherit;color:var(--boe-token-text-text-secondary,#666)}:host([hidden]){display:none !important}
    button,[part="static-line"]{font:inherit;color:inherit;background:none;border:0;padding:.5rem 0;display:flex;gap:.5rem;align-items:center}button{cursor:pointer}
    [part="clock"]{font-variant-numeric:tabular-nums} ul{padding:0;list-style:none} li{display:flex;gap:.5rem;margin:.5rem 0}
    @keyframes boe-shimmer{50%{opacity:.6}} [data-running] [part="label"]{animation:boe-shimmer 1.4s ease-in-out infinite}
    [hidden]{display:none!important}[part="chevron"]{display:inline-block;transition:transform var(--boe-profile-motion-panel,320ms) ease} :host([open]) [part="chevron"]{transform:rotate(90deg)}
    ${boeDisclosureStyles()}${boeEntranceKeyframes}${boeReducedMotionPolicy}</style>
    <button part="trigger" aria-expanded="false" aria-controls="details"><box-status-icon></box-status-icon><span part="label"></span><span part="clock" aria-hidden="true"></span><span part="chevron" aria-hidden="true">›</span></button>
    <div part="static-line" hidden><box-status-icon></box-status-icon><span part="static-label"></span><span part="static-clock" aria-hidden="true"></span></div>
    <div id="details" part="disclosure" class="boe-disclosure" inert><div><ul part="plan"></ul><box-run-trace variant="plain" exportparts="panel:trace-panel,step:trace-step,step-source:trace-step-source,step-title:trace-step-title,duration:trace-duration"></box-run-trace></div></div>`;
  }
  protected setupListeners(): void { this.shadowRoot!.querySelector("button")!.addEventListener("click", () => { this.open = !this.open; }); }
  private updateLabel(): void {
    const p = progress(this.value, this.hasAttribute("failed"), Date.now(), Number(this.getAttribute("elapsed-threshold") ?? 2000));
    const label = this.shadowRoot!.querySelector('[part="label"]')!;
    if (label.textContent !== p.label) label.textContent = p.label;
    this.shadowRoot!.querySelector('[part="clock"]')!.textContent = p.elapsed ?? "";
    this.shadowRoot!.querySelector('[part="static-label"]')!.textContent = p.label;
    this.shadowRoot!.querySelector('[part="static-clock"]')!.textContent = p.elapsed ?? "";
    this.shadowRoot!.querySelectorAll("box-status-icon").forEach(icon => { (icon as StatusIcon).kind = p.kind; icon.hidden = p.kind === "done"; });
    this.shadowRoot!.querySelector("button")!.toggleAttribute("data-running", p.kind === "active");
    this.shadowRoot!.querySelector("button")!.setAttribute("aria-label", p.label);
    const staticLabel = this.shadowRoot!.querySelector('[part="static-label"]')!;
    for (const target of [label, staticLabel]) {
      if (p.kind === "active") target.setAttribute("role", "status");
      else target.removeAttribute("role");
    }
  }
  protected update(): void {
    if (!this.isRendered) return;
    this.updateLabel(); this.syncTimer();
    const hasDetails = this.value.steps.length > 0 || this.value.todos.length > 0;
    this.shadowRoot!.querySelector("button")!.hidden = !hasDetails;
    this.shadowRoot!.querySelector<HTMLElement>('[part="static-line"]')!.hidden = hasDetails;
    this.shadowRoot!.querySelector("button")!.setAttribute("aria-expanded", String(this.open));
    const disclosure = this.shadowRoot!.querySelector<HTMLElement>("#details")!;
    disclosure.toggleAttribute("data-open", this.open); disclosure.inert = !this.open;
    disclosure.setAttribute("aria-hidden", String(!this.open));
    const signature = JSON.stringify(this.value.todos);
    if (signature !== this.planSignature) {
      this.planSignature = signature;
      const list = this.shadowRoot!.querySelector("ul")!; list.replaceChildren();
      for (const todo of this.value.todos) {
        const li = document.createElement("li"); const icon = new StatusIcon(); icon.kind = toStatusKind(todo.status);
        li.append(icon, document.createTextNode(todo.content)); list.append(li);
      }
    }
    const traceSignature = JSON.stringify(this.value.steps);
    if (traceSignature !== this.traceSignature) {
      this.traceSignature = traceSignature;
      (this.shadowRoot!.querySelector("box-run-trace") as RunTrace).steps = this.value.steps;
    }
  }
}
RunSummary.register();
