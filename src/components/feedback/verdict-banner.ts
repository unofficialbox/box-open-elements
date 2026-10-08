import { BaseElement } from "../../core/index.js";
import { FeedbackAnnouncement } from "../../foundations/a11y/announcer.js";
import { boeRadius } from "../../foundations/geometry/index.js";
import { toneIcon } from "./tone.js";

const styles = `
  :host { display:block; font:inherit; color:var(--boe-token-text-text,#222); container-type:inline-size; }
  :host([hidden]) { display:none!important; }
  [part="banner"] { display:grid; grid-template-columns:20px minmax(0,1fr) auto; align-items:start; gap:.7rem; padding:1rem; border-radius:${boeRadius.med}; border:1px solid var(--boe-token-stroke-stroke,#dedede); background:var(--boe-token-surface-surface-secondary,#f4f4f4); }
  :host([tone="passed"]) [part="banner"] { border-color:var(--boe-token-text-status-text-success,#187657); background:color-mix(in srgb,var(--boe-token-surface-status-surface-success,#26c281) 9%,var(--boe-token-surface-surface,#fff)); }
  :host([tone="missed"]) [part="banner"] { border-color:var(--boe-token-text-status-text-error,#b92340); background:color-mix(in srgb,var(--boe-token-surface-status-surface-error,#ed3757) 9%,var(--boe-token-surface-surface,#fff)); }
  [part="icon"] { inline-size:20px; block-size:20px; color:var(--boe-token-text-text-secondary,#6f6f6f); }
  :host([tone="passed"]) [part="icon"] { color:var(--boe-token-text-status-text-success,#187657); }
  :host([tone="missed"]) [part="icon"] { color:var(--boe-token-text-status-text-error,#b92340); }
  [part="icon"] svg { inline-size:100%; block-size:100%; }
  [part="body"] { min-inline-size:0; }
  [part="heading"] { margin:0; font:inherit; font-weight:700; overflow-wrap:anywhere; }
  [part="reasons"] { margin:.45rem 0 0; padding-inline-start:1.2rem; overflow-wrap:anywhere; }
  [part="reasons"]:empty { display:none; }
  @container (max-width:320px) { [part="banner"] { grid-template-columns:20px minmax(0,1fr); } [part="action"] { grid-column:2; } }
`;

let nextHeadingId = 0;
/** Finished-run verdict with a single action and one-time polite announcement. */
export class VerdictBanner extends BaseElement {
  static readonly tagName = "box-verdict-banner";
  static get observedAttributes(): string[] { return ["tone", "heading", "heading-level"]; }
  private readonly headingId = `boe-verdict-${++nextHeadingId}`;
  private readonly announcement = new FeedbackAnnouncement();
  private headingEl!: HTMLElement;
  private reasonsEl!: HTMLElement;
  private iconEl!: HTMLElement;
  private reasonsValue: string[] = [];
  private announced = false;
  get tone(): "passed" | "missed" | "none" { const value = this.getAttribute("tone"); return value === "passed" || value === "missed" ? value : "none"; }
  set tone(value: "passed" | "missed" | "none") { this.setAttribute("tone", value); }
  get heading(): string { return this.getAttribute("heading") ?? ""; }
  set heading(value: string) { this.setAttribute("heading", value); }
  get headingLevel(): number { const value = Number(this.getAttribute("heading-level") ?? 2); return Number.isInteger(value) && value >= 1 && value <= 6 ? value : 2; }
  set headingLevel(value: number) { this.setAttribute("heading-level", String(value)); }
  get reasons(): string[] { return [...this.reasonsValue]; }
  set reasons(value: string[]) { this.reasonsValue = [...value]; if (this.isRendered) this.update(); }
  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>${styles}</style><section part="banner" role="group" aria-labelledby="${this.headingId}"><span part="icon" aria-hidden="true"></span><div part="body"><div part="heading" id="${this.headingId}" role="heading"></div><ul part="reasons"></ul></div><span part="action"><slot name="action"></slot></span></section>`;
    this.headingEl = this.shadowRoot!.querySelector('[part="heading"]')!;
    this.reasonsEl = this.shadowRoot!.querySelector('[part="reasons"]')!;
    this.iconEl = this.shadowRoot!.querySelector('[part="icon"]')!;
  }
  protected update(): void {
    this.headingEl.textContent = this.heading;
    this.headingEl.setAttribute("aria-level", String(this.headingLevel));
    this.iconEl.innerHTML = toneIcon(this.tone === "passed" ? "success" : this.tone === "missed" ? "error" : "info");
    this.reasonsEl.replaceChildren(...this.reasonsValue.map(reason => { const item = document.createElement("li"); item.textContent = reason; return item; }));
    if (!this.announced && this.heading && this.tone !== "none") {
      this.announced = true;
      this.announcement.update(this, this.heading, "polite");
    }
  }
}

VerdictBanner.register();
