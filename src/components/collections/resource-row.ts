import { BaseElement } from "../../core/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";

const styles = `
  :host { display:block; container-type:inline-size; font:inherit; color:var(--boe-token-text-text,#222); }
  :host([hidden]) { display:none!important; }
  [part="row"] { display:flex; align-items:center; gap:.75rem; min-inline-size:0; padding:.65rem; border:1px solid var(--boe-token-stroke-stroke,#dedede); border-radius:${boeRadius.med}; background:var(--boe-token-surface-surface,#fff); }
  :host([selected]) [part="row"] { border-color:var(--boe-token-surface-surface-brand,#0061d5); background:color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 7%,var(--boe-token-surface-surface,#fff)); }
  :host([active]) [part="row"] { box-shadow:inset 0 0 0 1px var(--boe-token-surface-surface-brand,#0061d5); }
  [part="select"] { flex:1 1 auto; min-inline-size:0; display:flex; align-items:center; gap:.65rem; padding:.25rem; border:0; border-radius:4px; background:none; color:inherit; font:inherit; text-align:start; cursor:pointer; }
  [part="select"]:focus-visible { outline:2px solid var(--boe-token-surface-surface-brand,#0061d5); outline-offset:2px; }
  [part="select"]:disabled { cursor:not-allowed; opacity:.55; }
  [part="body"] { display:grid; gap:.15rem; min-inline-size:0; }
  [part="label"] { font-weight:600; overflow-wrap:anywhere; }
  [part="meta"] { color:var(--boe-token-text-text-secondary,#6f6f6f); font-size:.8em; white-space:pre-line; overflow-wrap:anywhere; }
  [part="meta"]:empty, [part="status"]:empty { display:none; }
  [part="trailing"] { flex:0 1 auto; display:flex; align-items:center; gap:.5rem; min-inline-size:0; }
  [part="status"] { color:var(--boe-token-text-text-secondary,#6f6f6f); font-size:.8em; }
  ::slotted([slot="actions"]) { flex:none; }
  @container (max-width: 320px) { [part="row"] { align-items:stretch; flex-wrap:wrap; } [part="trailing"] { inline-size:100%; justify-content:space-between; padding-inline-start:2.5rem; } }
  @media (prefers-reduced-motion:reduce) { *,*::before,*::after { transition:none!important; } }
`;

/** Selectable resource information with independent slotted actions. Not a listbox option. */
export class ResourceRow extends BaseElement {
  static readonly tagName = "box-resource-row";
  static get observedAttributes(): string[] { return ["label", "meta", "status", "value", "selected", "active", "disabled"]; }
  private selectEl!: HTMLButtonElement;
  private labelEl!: HTMLElement;
  private metaEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private statusSlot!: HTMLSlotElement;
  get label(): string { return this.getAttribute("label") ?? ""; }
  set label(value: string) { this.setAttribute("label", value); }
  get meta(): string { return this.getAttribute("meta") ?? ""; }
  set meta(value: string) { this.setAttribute("meta", value); }
  get status(): string { return this.getAttribute("status") ?? ""; }
  set status(value: string) { this.setAttribute("status", value); }
  get value(): string { return this.getAttribute("value") ?? this.label; }
  set value(value: string) { this.setAttribute("value", value); }
  get selected(): boolean { return this.hasAttribute("selected"); }
  set selected(value: boolean) { this.toggleAttribute("selected", value); }
  get active(): boolean { return this.hasAttribute("active"); }
  set active(value: boolean) { this.toggleAttribute("active", value); }
  get disabled(): boolean { return this.hasAttribute("disabled"); }
  set disabled(value: boolean) { this.toggleAttribute("disabled", value); }
  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>${styles}</style><div part="row"><button part="select" type="button"><slot name="icon"></slot><span part="body"><span part="label"></span><span part="meta"></span></span></button><span part="trailing"><span part="status"></span><slot name="status"></slot><slot name="actions"></slot></span></div>`;
    this.selectEl = this.shadowRoot!.querySelector('[part="select"]')!;
    this.labelEl = this.shadowRoot!.querySelector('[part="label"]')!;
    this.metaEl = this.shadowRoot!.querySelector('[part="meta"]')!;
    this.statusEl = this.shadowRoot!.querySelector('[part="status"]')!;
    this.statusSlot = this.shadowRoot!.querySelector('slot[name="status"]')!;
  }
  protected setupListeners(): void {
    this.selectEl.addEventListener("click", () => this.dispatchEvent(new CustomEvent("select", { bubbles:true, composed:true, detail:{ value:this.value } })));
    this.statusSlot.addEventListener("slotchange", () => this.update());
  }
  protected update(): void {
    this.labelEl.textContent = this.label;
    this.metaEl.textContent = this.meta;
    this.statusEl.textContent = this.status;
    this.statusEl.hidden = this.statusSlot.assignedElements().length > 0;
    this.selectEl.disabled = this.disabled;
    this.selectEl.setAttribute("aria-pressed", String(this.selected));
    this.selectEl.setAttribute("aria-label", this.label);
    const slottedStatus = this.statusSlot.assignedNodes({ flatten: true }).map(node =>
      node instanceof Element
        ? node.getAttribute("aria-label") ?? node.getAttribute("label") ?? node.textContent ?? ""
        : node.textContent ?? "",
    ).map(value => value.trim()).filter(Boolean).join(" ");
    const spokenStatus = this.status || slottedStatus;
    if (this.meta || spokenStatus) this.selectEl.setAttribute("aria-description", [this.meta.replaceAll("\n", ", "), spokenStatus].filter(Boolean).join("; "));
    else this.selectEl.removeAttribute("aria-description");
  }
}

ResourceRow.register();
