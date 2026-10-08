import { BaseElement } from "../../core/index.js";
import { FeedbackAnnouncement } from "../../foundations/a11y/announcer.js";

const styles = `
  :host { display:inline-flex; max-inline-size:100%; font:inherit; color:var(--boe-token-text-text,#222); }
  :host([hidden]) { display:none!important; }
  [part="indicator"] { display:inline-flex; align-items:center; gap:.4rem; min-block-size:24px; min-inline-size:0; padding:.2rem .55rem; border-radius:999px; border:1px solid var(--boe-token-stroke-stroke,#dedede); background:var(--boe-token-surface-surface-secondary,#f4f4f4); color:inherit; font:inherit; text-align:start; }
  button[part="indicator"] { cursor:pointer; }
  button[part="indicator"]:focus-visible { outline:2px solid var(--boe-token-surface-surface-brand,#0061d5); outline-offset:2px; }
  :host([mode="live"]) [part="indicator"] { border-color:var(--boe-token-text-status-text-error,#b92340); background:color-mix(in srgb,var(--boe-token-surface-status-surface-error,#ed3757) 9%,var(--boe-token-surface-surface,#fff)); }
  [part="dot"] { flex:none; inline-size:.45rem; block-size:.45rem; border-radius:50%; background:var(--boe-token-text-text-secondary,#6f6f6f); }
  :host([mode="live"]) [part="dot"] { background:var(--boe-token-text-status-text-error,#b92340); }
  [part="state"] { font-weight:700; white-space:nowrap; }
  [part="detail"] { min-inline-size:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  [part="detail"]:empty { display:none; }
  :host([live-stripe][mode="live"]) { border-block-start:3px solid var(--boe-token-text-status-text-error,#b92340); }
  @media (max-width:390px) { [part="detail"] { display:none; } }
`;

/** Host-controlled dry/live indicator. The host owns the mode-change destination. */
export class ModeIndicator extends BaseElement {
  static readonly tagName = "box-mode-indicator";
  static get observedAttributes(): string[] { return ["mode", "detail", "name-prefix", "interactive", "live-stripe"]; }
  private indicatorEl!: HTMLElement;
  private stateEl!: HTMLElement;
  private detailEl!: HTMLElement;
  private readonly announcement = new FeedbackAnnouncement();
  private previousMode: string | null = null;
  get mode(): "dry" | "live" { return this.getAttribute("mode") === "live" ? "live" : "dry"; }
  set mode(value: "dry" | "live") { this.setAttribute("mode", value); }
  get detail(): string { return this.getAttribute("detail") ?? ""; }
  set detail(value: string) { this.setAttribute("detail", value); }
  get namePrefix(): string { return this.getAttribute("name-prefix") ?? "Next run"; }
  set namePrefix(value: string) { this.setAttribute("name-prefix", value); }
  get interactive(): boolean { return this.hasAttribute("interactive"); }
  set interactive(value: boolean) { this.toggleAttribute("interactive", value); }
  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>${styles}</style><span part="indicator"><span part="dot" aria-hidden="true"></span><span part="state"></span><span part="detail"></span></span>`;
    this.indicatorEl = this.shadowRoot!.querySelector('[part="indicator"]')!;
    this.stateEl = this.shadowRoot!.querySelector('[part="state"]')!;
    this.detailEl = this.shadowRoot!.querySelector('[part="detail"]')!;
  }
  protected update(): void {
    const mode = this.mode;
    if (this.interactive !== (this.indicatorEl.tagName === "BUTTON")) {
      const replacement = document.createElement(this.interactive ? "button" : "span");
      replacement.setAttribute("part", "indicator");
      if (!this.interactive) replacement.setAttribute("role", "group");
      if (replacement instanceof HTMLButtonElement) replacement.type = "button";
      replacement.append(...Array.from(this.indicatorEl.childNodes));
      this.indicatorEl.replaceWith(replacement);
      this.indicatorEl = replacement;
      this.indicatorEl.addEventListener("click", () => { if (this.interactive) this.dispatchEvent(new CustomEvent("activate", { bubbles:true, composed:true })); });
    }
    const state = mode === "live" ? "Live" : "Dry run";
    if (!this.interactive) this.indicatorEl.setAttribute("role", "group");
    this.stateEl.textContent = state;
    this.detailEl.textContent = this.detail ? `· ${this.detail}` : "";
    this.indicatorEl.setAttribute("aria-label", `${this.namePrefix}: ${state}${this.detail ? `, ${this.detail}` : ""}`);
    if (this.previousMode !== null && this.previousMode !== mode) this.announcement.update(this, this.indicatorEl.getAttribute("aria-label") ?? "", "polite");
    this.previousMode = mode;
  }
}

ModeIndicator.register();
