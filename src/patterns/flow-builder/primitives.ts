import { BaseElement } from "../../core/index.js";
import { boeFocusVisibleStyles } from "../../foundations/tokens/index.js";
import { cardLabel, defaultFlowModel, insertLabel, nodeDescription, nodeTitle, type FlowBranchRequestDetail, type FlowInsertDetail, type FlowKind, type FlowModel, type FlowNodeBase } from "./model.js";

const styles = `
  :host { display:block; min-width:0; color:var(--boe-token-text-text,#222); font:inherit; }
  :host([hidden]) { display:none!important; }
  button { font:inherit; color:inherit; cursor:pointer; }
  ${boeFocusVisibleStyles("button")}
`;
function emit(host: HTMLElement, name: string, detail: unknown) { host.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true })); }

/** Parts a card exposes; the spine and builder forward them unchanged. */
export const FLOW_CARD_PARTS = ["card", "icon", "title", "kind", "description", "status", "error"] as const;
/** Parts the spine exposes (its own plus forwarded card and insert-point parts). */
export const FLOW_SPINE_PARTS = ["spine", "endpoint", "body", "branches", "branch", "branch-header", "branch-label", "branch-remove", "branch-add", "insert", ...FLOW_CARD_PARTS] as const;
/** Parts a kind picker exposes. */
export const KIND_PICKER_PARTS = ["choices", "group-heading", "choice", "choice-icon", "choice-label", "choice-description"] as const;

export class FlowCard extends BaseElement {
  static readonly tagName = "box-flow-card";
  node: FlowNodeBase = { kind: "" };
  catalog: readonly FlowKind[] = [];
  model: FlowModel<FlowNodeBase> = defaultFlowModel;
  selected = false;
  invalid = false;
  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>${styles}
      button { width:100%; text-align:start; display:grid; gap:6px; padding:16px; border:1px solid var(--boe-token-stroke-stroke,#ddd); border-radius:var(--boe-profile-radius-med,8px); background:var(--boe-token-surface-surface,#fff); overflow-wrap:anywhere; }
      button[aria-pressed=true] { border-color:var(--boe-token-surface-surface-brand,#0061d5); background:color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 8%,var(--boe-token-surface-surface,#fff)); }
      button[data-invalid=true] { border-color:var(--boe-token-text-status-text-error,#b92340); }
      button.has-icon{grid-template-columns:20px minmax(0,1fr);column-gap:12px} button.has-icon [part=icon]{grid-column:1;grid-row:1/span 4} button.has-icon [part=title],button.has-icon [part=kind],button.has-icon [part=description],button.has-icon [part=status],button.has-icon [part=error]{grid-column:2}
      [part=icon]{color:var(--boe-token-surface-surface-brand,#0061d5);width:20px;height:20px} [part=icon][data-tone=neutral]{color:var(--boe-token-text-text-secondary,#666)} [part=icon] svg{display:block;width:20px;height:20px} [part=title] { font-weight:650; } [part=kind],[part=description] { color:var(--boe-token-text-text-secondary,#666); } [part=error] { color:var(--boe-token-text-status-text-error,#b92340); }
      [hidden] { display:none!important; }
      </style><button type="button" part="card"><span part="icon" aria-hidden="true"></span><span part="title"></span><span part="kind"></span><span part="description"></span><span part="status"></span><span part="error">Needs attention</span></button>`;
  }
  protected setupListeners(): void { this.shadowRoot!.querySelector("button")!.addEventListener("click", () => emit(this, "node-select", { node: this.node })); }
  refresh(): void { if (this.isRendered) this.update(); }
  focus(options?: FocusOptions): void { this.shadowRoot?.querySelector("button")?.focus(options); }
  protected update(): void {
    const kind = this.catalog.find(kind => kind.kind === this.node.kind);
    const title = nodeTitle(this.node, this.catalog, this.model);
    const button = this.shadowRoot!.querySelector("button")!;
    button.setAttribute("aria-pressed", String(this.selected));
    button.classList.toggle("has-icon", Boolean(kind?.icon));
    button.setAttribute("aria-label", cardLabel(this.node, this.catalog, this.invalid, this.model));
    button.dataset.invalid = String(this.invalid);
    const iconEl = this.shadowRoot!.querySelector<HTMLElement>("[part=icon]")!;
    iconEl.replaceChildren(kind?.icon?.() ?? ""); iconEl.hidden = !kind?.icon;
    iconEl.dataset.tone = kind?.tone ?? "accent";
    for (const [part, text] of Object.entries({ title, kind: kind?.label !== title ? kind?.label ?? "" : "", description: nodeDescription(this.node, this.catalog, this.model), status: this.model.status?.(this.node) || "" })) {
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
  protected renderTemplate(): void { this.shadowRoot!.innerHTML = `<style>${styles} [part=choices]{display:grid;gap:8px} button{text-align:start;padding:10px;border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:8px;background:var(--boe-token-surface-surface,#fff)} button.has-icon{display:grid;grid-template-columns:20px minmax(0,1fr);column-gap:10px;align-items:start} [part=choice-icon]{grid-row:1/span 2;width:20px;height:20px;color:var(--boe-token-surface-surface-brand,#0061d5)} [part=choice-icon][data-tone=neutral]{color:var(--boe-token-text-text-secondary,#666)} [part=choice-icon] svg{display:block;width:20px;height:20px} [part=choice-label]{display:block} small{display:block;color:var(--boe-token-text-text-secondary,#666)} h3{font:inherit;font-weight:650;margin:12px 0 4px}</style><div part="choices"></div>`; }
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
      if (kind.group && group !== kind.group) { const heading = document.createElement("h3"); heading.textContent = kind.group; heading.setAttribute("role", "presentation"); heading.setAttribute("part", "group-heading"); choices.append(heading); group = kind.group; }
      const button = document.createElement("button"); button.type = "button"; button.setAttribute("part", "choice");
      if (kind.icon) {
        const icon = document.createElement("span"); icon.setAttribute("part", "choice-icon"); icon.setAttribute("aria-hidden", "true");
        icon.dataset.tone = kind.tone ?? "accent"; icon.append(kind.icon());
        button.classList.add("has-icon"); button.append(icon);
      }
      const label = document.createElement("span"); label.setAttribute("part", "choice-label"); label.textContent = kind.label; button.append(label);
      if (this.variant === "menu") { button.setAttribute("role", "menuitem"); button.tabIndex = index === 0 ? 0 : -1; }
      const description = document.createElement("small"); description.setAttribute("part", "choice-description"); description.textContent = kind.description; button.append(description);
      button.addEventListener("click", () => emit(this, "kind-pick", { kind })); choices.append(button);
    });
    if (!this.catalog.length) choices.textContent = "No step types available.";
  }
}

export class FlowSpine extends BaseElement {
  static readonly tagName = "box-flow-spine";
  nodes: FlowNodeBase[] = [];
  catalog: readonly FlowKind[] = [];
  model: FlowModel<FlowNodeBase> = defaultFlowModel;
  selected: FlowNodeBase | null = null;
  invalid: FlowNodeBase | null = null;
  startLabel = "Flow starts";
  endLabel = "Flow ends";
  private cards = new Map<FlowNodeBase, FlowCard>();
  protected renderTemplate(): void { this.shadowRoot!.innerHTML = `<style>${styles} [part=spine]{display:grid;gap:0;min-width:0} [part=branches]{display:flex;gap:16px;overflow-x:auto;max-width:100%;padding:8px} [part=branch]{flex:1 0 240px;min-width:0} [part=body]{margin:0 0 0 16px;border-inline-start:2px solid var(--boe-token-stroke-stroke,#ddd);padding:8px 12px} [part=endpoint]{text-align:center;font-weight:600;padding:12px} [part=branch-header]{display:flex;align-items:center;justify-content:space-between;gap:8px} h3{font:inherit;font-weight:600;margin:0} [part=branch-remove],[part=branch-add]{border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:16px;background:var(--boe-token-surface-surface,#fff);padding:4px 10px} [part=branch-add]{justify-self:center;margin:4px 0}</style><div part="spine"></div>`; }
  refresh(): void { if (this.isRendered) this.update(); }
  /** Re-render one card after its fields change, without rebuilding the spine. */
  refreshNode(node: FlowNodeBase): void { this.cards.get(node)?.refresh(); }
  focusNode(node: FlowNodeBase): void { this.cards.get(node)?.focus(); }
  select(node: FlowNodeBase | null, invalid = this.invalid): void { this.selected = node; this.invalid = invalid; for (const [item, card] of this.cards) { card.selected = item === node; card.invalid = item === invalid; card.refresh(); } }
  protected update(): void {
    const root = this.shadowRoot!.querySelector("[part=spine]")!;
    const seen = new Set<FlowNodeBase>();
    const title = (node: FlowNodeBase) => nodeTitle(node, this.catalog, this.model);
    const listView = (list: FlowNodeBase[], where: string, ancestors: Set<FlowNodeBase>): DocumentFragment => {
      const fragment = document.createDocumentFragment();
      for (let index = 0; index <= list.length; index++) {
        const point = document.createElement(InsertPoint.tagName) as InsertPoint;
        point.setAttribute("exportparts", "button: insert");
        point.detail = { list, index, label: insertLabel(list, index, where, this.catalog, this.model) }; fragment.append(point);
        if (index === list.length) break;
        const node = list[index];
        if (ancestors.has(node) || seen.has(node)) continue;
        seen.add(node);
        const card = this.cards.get(node) ?? document.createElement(FlowCard.tagName) as FlowCard;
        card.setAttribute("exportparts", FLOW_CARD_PARTS.join(", "));
        this.cards.set(node, card); card.node = node; card.catalog = this.catalog; card.model = this.model; card.selected = node === this.selected; card.invalid = node === this.invalid; card.refresh(); fragment.append(card);
        const nextAncestors = new Set([...ancestors, node]);
        const children = this.model.children(node);
        for (const child of children.filter(child => child.label === undefined)) {
          const body = document.createElement("section"); body.setAttribute("part", "body"); body.setAttribute("aria-label", `${title(node)} steps`);
          body.append(listView(child.list, `inside ${title(node)}`, nextAncestors)); fragment.append(body);
        }
        const branchLists = children.filter(child => child.label !== undefined);
        const addLabel = this.model.addBranchLabel?.(node);
        if (branchLists.length || addLabel) {
          const branches = document.createElement("div"); branches.setAttribute("part", "branches");
          branchLists.forEach((branch, branchIndex) => {
            const label = branch.label!;
            const column = document.createElement("section"); column.setAttribute("part", "branch"); column.setAttribute("aria-label", label);
            const header = document.createElement("div"); header.setAttribute("part", "branch-header");
            const heading = document.createElement("h3"); heading.setAttribute("part", "branch-label"); heading.textContent = label; header.append(heading);
            if (branch.removable) {
              const remove = document.createElement("button"); remove.type = "button"; remove.setAttribute("part", "branch-remove");
              remove.textContent = "Remove"; remove.setAttribute("aria-label", `Remove ${label} from ${title(node)}`);
              remove.addEventListener("click", () => emit(this, "branch-remove-request", { node, index: branchIndex, list: branch.list } satisfies FlowBranchRequestDetail));
              header.append(remove);
            }
            column.append(header, listView(branch.list, `in ${label}`, nextAncestors)); branches.append(column);
          });
          fragment.append(branches);
          if (addLabel) {
            const add = document.createElement("button"); add.type = "button"; add.setAttribute("part", "branch-add"); add.textContent = addLabel;
            add.setAttribute("aria-label", `${addLabel} to ${title(node)}`);
            add.addEventListener("click", () => emit(this, "branch-add-request", { node } satisfies FlowBranchRequestDetail));
            fragment.append(add);
          }
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
