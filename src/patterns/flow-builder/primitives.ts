import { BaseElement } from "../../core/index.js";
import { boeFocusVisibleStyles } from "../../foundations/tokens/index.js";
import { cardLabel, insertLabel, nodeTitle, type FlowInsertDetail, type FlowKind, type FlowNode } from "./model.js";

const styles = `
  :host { display:block; min-width:0; color:var(--boe-token-text-text,#222); font:inherit; }
  :host([hidden]) { display:none!important; }
  button { font:inherit; color:inherit; cursor:pointer; }
  ${boeFocusVisibleStyles("button")}
`;
function emit(host: HTMLElement, name: string, detail: unknown) { host.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true })); }

export class FlowCard extends BaseElement {
  static readonly tagName = "box-flow-card";
  node: FlowNode = { id: "", kind: "" };
  catalog: readonly FlowKind[] = [];
  selected = false;
  invalid = false;
  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>${styles}
      button { width:100%; text-align:start; display:grid; gap:6px; padding:16px; border:1px solid var(--boe-token-stroke-stroke,#ddd); border-radius:var(--boe-profile-radius-med,8px); background:var(--boe-token-surface-surface,#fff); overflow-wrap:anywhere; }
      button[aria-pressed=true] { border-color:var(--boe-token-surface-surface-brand,#0061d5); background:color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 8%,var(--boe-token-surface-surface,#fff)); }
      button[data-invalid=true] { border-color:var(--boe-token-text-status-text-error,#b92340); }
      button.has-icon{grid-template-columns:20px minmax(0,1fr);column-gap:12px} button.has-icon [part=icon]{grid-column:1;grid-row:1/span 4} button.has-icon [part=title],button.has-icon [part=kind],button.has-icon [part=description],button.has-icon [part=status],button.has-icon [part=error]{grid-column:2}
      [part=icon]{color:var(--boe-token-surface-surface-brand,#0061d5);width:20px;height:20px} [part=icon] svg{display:block;width:20px;height:20px} [part=title] { font-weight:650; } [part=kind],[part=description] { color:var(--boe-token-text-text-secondary,#666); } [part=error] { color:var(--boe-token-text-status-text-error,#b92340); }
      [hidden] { display:none!important; }
      </style><button type="button" part="card"><span part="icon" aria-hidden="true"></span><span part="title"></span><span part="kind"></span><span part="description"></span><span part="status"></span><span part="error">Needs attention</span></button>`;
  }
  protected setupListeners(): void { this.shadowRoot!.querySelector("button")!.addEventListener("click", () => emit(this, "node-select", { node: this.node })); }
  refresh(): void { if (this.isRendered) this.update(); }
  focus(options?: FocusOptions): void { this.shadowRoot?.querySelector("button")?.focus(options); }
  protected update(): void {
    const kind = this.catalog.find(kind => kind.kind === this.node.kind);
    const title = nodeTitle(this.node, this.catalog);
    const button = this.shadowRoot!.querySelector("button")!;
    button.setAttribute("aria-pressed", String(this.selected));
    button.classList.toggle("has-icon", Boolean(kind?.icon));
    button.setAttribute("aria-label", cardLabel(this.node, this.catalog, this.invalid));
    button.dataset.invalid = String(this.invalid);
    const iconEl = this.shadowRoot!.querySelector<HTMLElement>("[part=icon]")!;
    iconEl.replaceChildren(kind?.icon?.() ?? ""); iconEl.hidden = !kind?.icon;
    for (const [part, text] of Object.entries({ title, kind: kind?.label !== title ? kind?.label ?? "" : "", description: this.node.description || kind?.description || "", status: this.node.status || "" })) {
      const element = this.shadowRoot!.querySelector<HTMLElement>(`[part=${part}]`)!;
      element.textContent = text; element.hidden = !text;
    }
    this.shadowRoot!.querySelector<HTMLElement>("[part=error]")!.hidden = !this.invalid;
  }
}

export class InsertPoint extends BaseElement {
  static readonly tagName = "box-insert-point";
  detail: FlowInsertDetail = { list: [], index: 0, label: "Add the first step" };
  protected renderTemplate(): void { this.shadowRoot!.innerHTML = `<style>${styles} :host{display:flex;flex-direction:column;align-items:center;text-align:center;min-width:0} :host::before,:host::after{content:"";height:10px;border-inline-start:2px solid var(--boe-token-stroke-stroke,#ddd)} button{display:grid;place-items:center;min-width:32px;min-height:32px;border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:50%;background:var(--boe-token-surface-surface,#fff);font-weight:700;line-height:1;padding:0 9px} button:hover{border-color:var(--boe-token-surface-surface-brand,#0061d5);color:var(--boe-token-surface-surface-brand,#0061d5)} :host([data-empty]) button{border-radius:16px;font-weight:600;padding:6px 12px}</style><button type="button" part="button" aria-haspopup="menu"></button>`; }
  protected setupListeners(): void { this.shadowRoot!.querySelector("button")!.addEventListener("click", () => emit(this, "insert-request", this.detail)); }
  focus(options?: FocusOptions): void { this.shadowRoot?.querySelector("button")?.focus(options); }
  protected update(): void { const button = this.shadowRoot!.querySelector("button")!; const empty = !this.detail.list.length; this.toggleAttribute("data-empty", empty); button.textContent = empty ? this.detail.label : "+"; button.setAttribute("aria-label", this.detail.label); }
}

export class KindPicker extends BaseElement {
  static readonly tagName = "box-kind-picker";
  catalog: readonly FlowKind[] = [];
  variant: "inline" | "menu" = "inline";
  protected renderTemplate(): void { this.shadowRoot!.innerHTML = `<style>${styles} [part=choices]{display:grid;gap:8px} button{text-align:start;padding:10px;border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:8px;background:var(--boe-token-surface-surface,#fff)} small{display:block;color:var(--boe-token-text-text-secondary,#666)} h3{font:inherit;font-weight:650;margin:12px 0 4px}</style><div part="choices"></div>`; }
  protected setupListeners(): void {
    this.shadowRoot!.addEventListener("keydown", event => {
      const e = event as KeyboardEvent;
      if (this.variant !== "menu") return;
      if (e.key === "Escape") { e.preventDefault(); emit(this, "picker-cancel", {}); return; }
      const buttons = Array.from(this.shadowRoot!.querySelectorAll("button"));
      if (!buttons.length) return;
      const current = buttons.indexOf(this.shadowRoot!.activeElement as HTMLButtonElement);
      const next = e.key === "Home" ? 0 : e.key === "End" ? buttons.length - 1 : ["ArrowDown", "ArrowRight"].includes(e.key) ? (current + 1) % buttons.length : ["ArrowUp", "ArrowLeft"].includes(e.key) ? (current - 1 + buttons.length) % buttons.length : -1;
      if (next < 0) return;
      e.preventDefault(); buttons.forEach((button, index) => button.tabIndex = index === next ? 0 : -1); buttons[next].focus();
    });
  }
  refresh(): void { if (this.isRendered) this.update(); }
  focus(options?: FocusOptions): void { this.shadowRoot?.querySelector("button")?.focus(options); }
  protected update(): void {
    const choices = this.shadowRoot!.querySelector<HTMLElement>("[part=choices]")!;
    choices.setAttribute("role", this.variant === "menu" ? "menu" : "group");
    choices.setAttribute("aria-label", "Choose a step type");
    choices.replaceChildren();
    let group = "";
    this.catalog.forEach((kind, index) => {
      if (kind.group && group !== kind.group) { const heading = document.createElement("h3"); heading.textContent = kind.group; heading.setAttribute("role", "presentation"); choices.append(heading); group = kind.group; }
      const button = document.createElement("button"); button.type = "button"; button.textContent = kind.label;
      if (this.variant === "menu") { button.setAttribute("role", "menuitem"); button.tabIndex = index === 0 ? 0 : -1; }
      const description = document.createElement("small"); description.textContent = kind.description; button.append(description);
      button.addEventListener("click", () => emit(this, "kind-pick", { kind })); choices.append(button);
    });
    if (!this.catalog.length) choices.textContent = "No step types available.";
  }
}

export class FlowSpine extends BaseElement {
  static readonly tagName = "box-flow-spine";
  nodes: FlowNode[] = [];
  catalog: readonly FlowKind[] = [];
  selected: FlowNode | null = null;
  invalid: FlowNode | null = null;
  startLabel = "Flow starts";
  endLabel = "Flow ends";
  private cards = new Map<FlowNode, FlowCard>();
  protected renderTemplate(): void { this.shadowRoot!.innerHTML = `<style>${styles} [part=spine]{display:grid;gap:0;min-width:0} [part=branches]{display:flex;gap:16px;overflow-x:auto;max-width:100%;padding:8px} [part=branch]{flex:1 0 240px;min-width:0} [part=body]{margin:0 0 0 16px;border-inline-start:2px solid var(--boe-token-stroke-stroke,#ddd);padding:8px 12px} [part=endpoint]{text-align:center;font-weight:600;padding:12px} h3{font:inherit;font-weight:600}</style><div part="spine"></div>`; }
  refresh(): void { if (this.isRendered) this.update(); }
  focusNode(node: FlowNode): void { this.cards.get(node)?.focus(); }
  select(node: FlowNode | null, invalid = this.invalid): void { this.selected = node; this.invalid = invalid; for (const [item, card] of this.cards) { card.selected = item === node; card.invalid = item === invalid; card.refresh(); } }
  protected update(): void {
    const root = this.shadowRoot!.querySelector("[part=spine]")!;
    const seen = new Set<FlowNode>();
    const listView = (list: FlowNode[], where: string, ancestors: Set<FlowNode>): DocumentFragment => {
      const fragment = document.createDocumentFragment();
      for (let index = 0; index <= list.length; index++) {
        const point = document.createElement(InsertPoint.tagName) as InsertPoint;
        point.detail = { list, index, label: insertLabel(list, index, where, this.catalog) }; fragment.append(point);
        if (index === list.length) break;
        const node = list[index];
        if (ancestors.has(node) || seen.has(node)) continue;
        seen.add(node);
        const card = this.cards.get(node) ?? document.createElement(FlowCard.tagName) as FlowCard;
        this.cards.set(node, card); card.node = node; card.catalog = this.catalog; card.selected = node === this.selected; card.invalid = node === this.invalid; card.refresh(); fragment.append(card);
        const nextAncestors = new Set([...ancestors, node]);
        if (node.body) { const body = document.createElement("section"); body.setAttribute("part", "body"); body.setAttribute("aria-label", `${nodeTitle(node, this.catalog)} steps`); body.append(listView(node.body, `inside ${nodeTitle(node, this.catalog)}`, nextAncestors)); fragment.append(body); }
        if (node.branches) {
          const branches = document.createElement("div"); branches.setAttribute("part", "branches");
          node.branches.forEach(branch => { const column = document.createElement("section"); column.setAttribute("part", "branch"); column.setAttribute("aria-label", branch.label); const heading = document.createElement("h3"); heading.textContent = branch.label; column.append(heading, listView(branch.body, `in ${branch.label}`, nextAncestors)); branches.append(column); }); fragment.append(branches);
        }
      }
      return fragment;
    };
    const start = document.createElement("div"); start.setAttribute("part", "endpoint"); start.textContent = this.startLabel;
    const end = document.createElement("div"); end.setAttribute("part", "endpoint"); end.textContent = this.endLabel;
    root.replaceChildren(start, listView(this.nodes, "in the flow", new Set()), end);
    for (const node of this.cards.keys()) if (!seen.has(node)) this.cards.delete(node);
  }
}
FlowCard.register(); InsertPoint.register(); KindPicker.register(); FlowSpine.register();
