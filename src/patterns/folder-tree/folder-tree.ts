import { BaseElement } from "../../core/index.js";
import { boxIconography } from "../../foundations/icons/index.js";
import { ancestorIds, indexTree, visibleRows, type TreeIndex, type TreeRow } from "./model.js";
import type { FolderTreeNode, FolderTreeExpandedDetail, FolderTreeSelectedDetail, FolderTreeNodeDetail } from "./types.js";

export interface FolderTreeEventDetails {
  "expanded-changed": FolderTreeExpandedDetail;
  "selected-changed": FolderTreeSelectedDetail;
  "active-changed": FolderTreeNodeDetail;
  "load-children": FolderTreeNodeDetail;
  "item-activated": FolderTreeNodeDetail;
}

export const folderTreeStyles = `
:host { display:block; min-width:0; max-width:100%; font:inherit; color:var(--boe-token-text-text,#222); }
:host([hidden]) { display:none !important; }
[hidden] { display:none !important; }
* { box-sizing:border-box; }
[part=tree] { min-width:0; }
[part~=item] { display:flex; align-items:center; gap:.45rem; min-width:0; padding:.55rem .5rem; border-inline-start:1px solid var(--boe-token-stroke-stroke,#ddd); border-radius:4px; overflow-wrap:anywhere; }
[part~=item]:hover { background:var(--boe-token-surface-surface-hover,#f4f4f4); }
[part~=item][aria-selected=true] { background:var(--boe-token-surface-item-surface-selected,#f2f7fd); box-shadow:inset 3px 0 var(--boe-token-surface-surface-brand,#0061d5); }
[part~=item]:focus-visible, button:focus-visible { outline:2px solid var(--boe-token-surface-surface-brand,#0061d5); outline-offset:-2px; }
[part=disclosure] { flex:0 0 1rem; cursor:pointer; }
[part=icon] { flex:0 0 1.25rem; width:1.25rem; height:1.25rem; }
[part=icon] svg { width:100%; height:100%; }
[part=content] { flex:1; min-width:0; }
[part=name] { font-weight:600; }
[part=metadata], [part=state], [part=description], [part=empty] { font-size:.85em; color:var(--boe-token-text-text-secondary,#666); }
[part=status] { font-size:.8em; font-weight:600; }
[part=actions] { min-width:0; }
[part=live] { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
[part=toolbar] { display:flex; flex-wrap:wrap; align-items:center; gap:.6rem; padding:.5rem 0; }
button { font:inherit; color:inherit; background:var(--boe-token-surface-surface,#fff); border:1px solid var(--boe-token-stroke-stroke,#ccc); border-radius:4px; padding:.35rem .6rem; cursor:pointer; }
button:disabled { cursor:default; opacity:.5; }
[part=counts] { font-size:.85em; }
[part=pair] { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:.65rem; }
[part=side] { min-width:0; overflow-wrap:anywhere; }
[part=side] + [part=side] { border-inline-start:1px solid var(--boe-token-stroke-stroke,#ddd); padding-inline-start:.65rem; }
[part=side-label] { font-size:.75em; color:var(--boe-token-text-text-secondary,#666); }
[part=path] { font-size:.8em; overflow-wrap:anywhere; }
[data-status=added] [part=status] { color:var(--boe-token-text-status-text-success,#16763b); }
[data-status=removed] [part=status] { color:var(--boe-token-text-status-text-error,#b92340); }
[data-status=changed] [part=status], [data-status=moved] [part=status] { color:var(--boe-token-surface-surface-brand,#0061d5); }
`;

/** Read-only hierarchy. State writes are authoritative and never emit user intent. */
export class FolderTree extends BaseElement {
  static readonly tagName: string = "box-folder-tree";
  static get observedAttributes(): string[] { return ["label", "filter", "loading", "partial", "unavailable", "selection-disabled"]; }
  protected nodesInternal: FolderTreeNode[] = [];
  protected index: TreeIndex = indexTree([]);
  protected expandedInternal = new Set<string>();
  private selectedInternal = new Set<string>();
  private activeInternal: string | null = null;
  protected rows: TreeRow[] = [];
  protected treeEl!: HTMLElement;
  protected liveEl!: HTMLElement;
  private emptyEl!: HTMLElement;
  private rowElements = new Map<string, HTMLElement>();
  private requests = new Set<string>();
  private announcement = "";
  private filterCollapsed = new Set<string>();

  get nodes(): FolderTreeNode[] { return [...this.nodesInternal]; }
  set nodes(value: FolderTreeNode[]) {
    const snapshot = value.map(node => ({ ...node }));
    const index = indexTree(snapshot); // Validate before replacing usable state.
    for (const node of snapshot) {
      const previous = this.index.byId.get(node.id);
      if (!previous || previous.loadState !== node.loadState || previous.childCount !== node.childCount) this.requests.delete(node.id);
    }
    for (const id of this.requests) if (!index.byId.has(id)) this.requests.delete(id);
    this.nodesInternal = snapshot; this.index = index; this.update();
  }
  get expandedIds(): string[] { return [...this.expandedInternal]; }
  set expandedIds(ids: string[]) {
    this.expandedInternal = new Set(ids);
    if (this.filter.trim()) for (const id of this.includedIds() ?? []) {
      if (this.expandedInternal.has(id)) this.filterCollapsed.delete(id); else this.filterCollapsed.add(id);
    }
    this.update();
  }
  get selectedIds(): string[] { return [...this.selectedInternal]; }
  set selectedIds(ids: string[]) { this.selectedInternal = new Set(ids); this.update(); }
  get activeId(): string | null { return this.activeInternal; }
  set activeId(id: string | null) { this.activeInternal = id; this.update(); }
  get label(): string { return this.getAttribute("label") ?? "Folders and files"; }
  set label(value: string) { this.setAttribute("label", value); }
  get filter(): string { return this.getAttribute("filter") ?? ""; }
  set filter(value: string) { this.setAttribute("filter", value); }
  get loading(): boolean { return this.hasAttribute("loading"); }
  set loading(value: boolean) { this.toggleAttribute("loading", value); }
  get partial(): boolean { return this.hasAttribute("partial"); }
  set partial(value: boolean) { this.toggleAttribute("partial", value); }
  get unavailable(): boolean { return this.hasAttribute("unavailable"); }
  set unavailable(value: boolean) { this.toggleAttribute("unavailable", value); }
  get selectionDisabled(): boolean { return this.hasAttribute("selection-disabled"); }
  set selectionDisabled(value: boolean) { this.toggleAttribute("selection-disabled", value); }

  protected emit(name: string, detail: unknown): void { this.dispatchEvent(new CustomEvent(name, { detail, bubbles:true, composed:true })); }
  protected includedIds(): Set<string> | undefined {
    const query = this.filter.trim().toLocaleLowerCase();
    return query ? ancestorIds(this.index, this.nodesInternal.filter(n => n.name.toLocaleLowerCase().includes(query)).map(n => n.id)) : undefined;
  }
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "filter" && oldValue !== newValue) this.filterCollapsed.clear();
    super.attributeChangedCallback(name, oldValue, newValue);
  }
  protected expandedForView(included?: Set<string>): Set<string> {
    if (!included) return this.expandedInternal;
    const ancestors = [...included].filter(id => (this.index.children.get(id) ?? []).some(child => included.has(child.id)));
    return new Set([...this.expandedInternal, ...ancestors].filter(id => !this.filterCollapsed.has(id)));
  }
  protected nodeLabel(node: FolderTreeNode): string {
    return [node.name, node.type.replace("_", " "), node.status, node.description, this.metadataText(node), this.stateText(node)].filter(Boolean).join(", ");
  }
  protected metadataText(node: FolderTreeNode): string {
    return node.metadata ?? (node.childCount == null ? "" : `${node.childCount} ${node.childCount === 1 ? "child" : "children"}`);
  }
  protected stateText(node: FolderTreeNode): string {
    switch (node.loadState) {
      case "loading": return "Loading children";
      case "error": return "Could not load children. Collapse and expand to retry.";
      case "unavailable": return "Children unavailable";
      case "partial": return "Partially loaded — more children may exist";
      case "unloaded": return "Children not loaded";
      default: return "";
    }
  }
  protected renderContent(container: HTMLElement, node: FolderTreeNode): void {
    container.replaceChildren();
    const name = document.createElement("span"); name.setAttribute("part", "name"); name.textContent = node.name;
    container.append(name);
    for (const [part, text] of [["status", node.status], ["description", node.description], ["metadata", this.metadataText(node)], ["state", this.stateText(node)]] as const) {
      if (!text) continue;
      const el = document.createElement("div"); el.setAttribute("part", part); el.textContent = text; container.append(el);
    }
    for (const part of ["status", "metadata"]) {
      const slot = document.createElement("slot"); slot.name = `${part}-${node.id}`; container.append(slot);
    }
  }
  private requestChildren(node: FolderTreeNode): void {
    const state = node.loadState;
    const needsChildren = state === "unloaded" || state === "partial" || state === "error" || (!state && !(this.index.children.get(node.id)?.length));
    if (!needsChildren || this.requests.has(node.id)) return;
    this.requests.add(node.id);
    this.emit("load-children", { id:node.id, node } satisfies FolderTreeNodeDetail);
  }
  protected changeExpansion(node: FolderTreeNode, expanded: boolean, ids: Iterable<string>): void {
    this.expandedInternal = new Set(ids);
    for (const id of this.expandedInternal) this.filterCollapsed.delete(id);
    this.emit("expanded-changed", { id:node.id, node, expanded, expandedIds:this.expandedIds } satisfies FolderTreeExpandedDetail);
    this.update();
  }
  private toggle(row: TreeRow): void {
    const expanded = !row.expanded;
    if (expanded) this.filterCollapsed.delete(row.node.id); else this.filterCollapsed.add(row.node.id);
    if (expanded) this.expandedInternal.add(row.node.id); else { this.expandedInternal.delete(row.node.id); this.requests.delete(row.node.id); }
    this.changeExpansion(row.node, expanded, this.expandedInternal);
    if (expanded && this.expandedInternal.has(row.node.id)) this.requestChildren(this.index.byId.get(row.node.id) ?? row.node);
  }
  protected focusNode(id: string): void {
    if (!this.rows.some(row => row.node.id === id)) return;
    const changed = this.activeInternal !== id;
    this.activeInternal = id;
    for (const [key, el] of this.rowElements) el.tabIndex = key === id ? 0 : -1;
    this.rowElements.get(id)?.focus();
    if (changed) this.emit("active-changed", { id, node:this.index.byId.get(id)! } satisfies FolderTreeNodeDetail);
  }
  private select(node: FolderTreeNode): void {
    if (this.selectionDisabled) return;
    this.selectedInternal = new Set([node.id]);
    this.emit("selected-changed", { id:node.id, node, selectedIds:this.selectedIds } satisfies FolderTreeSelectedDetail);
    this.update();
  }
  focus(options?: FocusOptions): void {
    const target = this.rowElements.get(this.activeInternal ?? "") ?? this.treeEl;
    target?.focus(options);
  }

  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>${folderTreeStyles}</style><div part="toolbar" hidden></div><div part="tree" role="tree"></div><p part="empty"></p><div part="live" role="status" aria-live="polite" aria-atomic="true"></div>`;
    this.treeEl = this.shadowRoot!.querySelector('[part="tree"]')!;
    this.emptyEl = this.shadowRoot!.querySelector('[part="empty"]')!;
    this.liveEl = this.shadowRoot!.querySelector('[part="live"]')!;
  }
  protected setupListeners(): void {
    this.treeEl.addEventListener("focusin", event => {
      const row = (event.target as HTMLElement).closest<HTMLElement>("[data-node-id]");
      if (!row) return;
      const id = row.dataset.nodeId!;
      const changed = this.activeInternal !== id;
      this.activeInternal = id;
      for (const [key, el] of this.rowElements) el.tabIndex = key === id ? 0 : -1;
      if (changed) this.emit("active-changed", { id, node:this.index.byId.get(id)! } satisfies FolderTreeNodeDetail);
    });
    this.treeEl.addEventListener("click", event => {
      const target = event.target as HTMLElement;
      const el = target.closest<HTMLElement>("[data-node-id]");
      const row = this.rows.find(row => row.node.id === el?.dataset.nodeId);
      if (!row || event.composedPath().some(el => el instanceof HTMLSlotElement)) return;
      this.focusNode(row.node.id);
      if (target.closest('[part="disclosure"]') && row.branch) this.toggle(row); else this.select(row.node);
    });
    this.treeEl.addEventListener("dblclick", event => {
      const el = (event.target as HTMLElement).closest<HTMLElement>("[data-node-id]");
      const node = this.index.byId.get(el?.dataset.nodeId ?? "");
      if (node && !event.composedPath().some(el => el instanceof HTMLSlotElement)) this.emit("item-activated", { id:node.id, node } satisfies FolderTreeNodeDetail);
    });
    this.treeEl.addEventListener("keydown", event => {
      const keyboard = event as KeyboardEvent;
      if (keyboard.target !== this.shadowRoot?.activeElement || !(keyboard.target as HTMLElement).hasAttribute("data-node-id") || keyboard.altKey || keyboard.ctrlKey || keyboard.metaKey) return;
      const i = this.rows.findIndex(row => row.node.id === this.activeInternal);
      const row = this.rows[i]; if (!row) return;
      let next: string | undefined;
      switch (keyboard.key) {
        case "ArrowDown": next = this.rows[Math.min(i + 1, this.rows.length - 1)]?.node.id; break;
        case "ArrowUp": next = this.rows[Math.max(0, i - 1)]?.node.id; break;
        case "Home": next = this.rows[0]?.node.id; break;
        case "End": next = this.rows.at(-1)?.node.id; break;
        case "ArrowRight": if (row.branch && !row.expanded) this.toggle(row); else if (row.expanded && this.rows[i+1]?.level === row.level+1) next=this.rows[i+1]?.node.id; break;
        case "ArrowLeft": if (row.branch && row.expanded) this.toggle(row); else next=row.node.parentId; break;
        case "Enter": this.emit("item-activated", { id:row.node.id, node:row.node } satisfies FolderTreeNodeDetail); break;
        case " ": this.select(row.node); break;
        default: return;
      }
      keyboard.preventDefault();
      if (next) this.focusNode(next);
    });
  }
  protected update(): void {
    if (!this.isRendered) return;
    const focused = this.shadowRoot?.activeElement as HTMLElement | null;
    const focusedId = focused?.closest<HTMLElement>("[data-node-id]")?.dataset.nodeId;
    const oldRows = this.rows;
    const included = this.includedIds();
    this.rows = visibleRows(this.index, this.expandedForView(included), included);
    const visible = new Set(this.rows.map(row => row.node.id));
    if (!this.activeInternal || !visible.has(this.activeInternal)) {
      let previous = this.index.byId.get(this.activeInternal ?? "") ?? oldRows.find(row => row.node.id === this.activeInternal)?.node;
      while (previous && !visible.has(previous.id)) previous = this.index.byId.get(previous.parentId ?? "");
      this.activeInternal = previous?.id ?? this.rows[0]?.node.id ?? null;
    }
    this.treeEl.setAttribute("aria-label", this.label);
    this.treeEl.setAttribute("aria-busy", String(this.loading));
    for (const [id, el] of this.rowElements) if (!visible.has(id)) { el.remove(); this.rowElements.delete(id); }
    this.rows.forEach((row, i) => {
      let el = this.rowElements.get(row.node.id);
      if (!el) {
        el = document.createElement("div"); el.setAttribute("part", "item"); el.setAttribute("role", "treeitem"); el.dataset.nodeId = row.node.id;
        const disclosure = document.createElement("span"); disclosure.setAttribute("part", "disclosure"); disclosure.setAttribute("aria-hidden", "true");
        const icon = document.createElement("span"); icon.setAttribute("part", "icon"); icon.setAttribute("aria-hidden", "true");
        const content = document.createElement("div"); content.setAttribute("part", "content");
        const actions = document.createElement("span"); actions.setAttribute("part", "actions"); const slot = document.createElement("slot"); slot.name = `actions-${row.node.id}`; actions.append(slot);
        el.append(disclosure, icon, content, actions); this.rowElements.set(row.node.id, el);
      }
      el.setAttribute("aria-label", this.nodeLabel(row.node));
      el.setAttribute("aria-level", String(row.level)); el.setAttribute("aria-posinset", String(row.position)); el.setAttribute("aria-setsize", String(row.size));
      if (row.branch) el.setAttribute("aria-expanded", String(row.expanded)); else el.removeAttribute("aria-expanded");
      if (!this.selectionDisabled) el.setAttribute("aria-selected", String(this.selectedInternal.has(row.node.id))); else el.removeAttribute("aria-selected");
      el.setAttribute("aria-busy", String(row.node.loadState === "loading"));
      el.dataset.status = row.node.status ?? "";
      el.tabIndex = row.node.id === this.activeInternal ? 0 : -1;
      el.style.paddingInlineStart = `${Math.min(row.level - 1, 8) * .65 + .5}rem`;
      el.querySelector('[part="disclosure"]')!.textContent = row.branch ? row.expanded ? "▾" : "▸" : "";
      const icons = boxIconography as Record<string, string>;
      const icon = el.querySelector<HTMLElement>('[part="icon"]')!;
      const iconKey = row.node.type === "folder" ? "folder" : row.node.type === "web_link" ? "link" : "file-blank";
      if (icon.dataset.iconKey !== iconKey) {
        icon.innerHTML = icons[iconKey] ?? "";
        icon.dataset.iconKey = iconKey;
      }
      // Preserve slotted action focus during host snapshot updates.
      if (!focused || !el.contains(focused)) this.renderContent(el.querySelector('[part="content"]')!, row.node);
      else if (focused === el) this.renderContent(el.querySelector('[part="content"]')!, row.node);
      const at = this.treeEl.children[i]; if (at !== el) this.treeEl.insertBefore(el, at ?? null);
    });
    this.treeEl.tabIndex = this.rows.length ? -1 : 0;
    const summary = [this.loading ? "Loading folders and files" : "", this.unavailable ? "Structure unavailable" : "", this.partial ? "Partial structure — more items may exist" : "", !this.rows.length && !this.loading && !this.unavailable ? this.filter ? "No matching items" : "No items" : ""].filter(Boolean).join(". ");
    this.emptyEl.textContent = summary; this.emptyEl.hidden = !summary;
    const notable = new Set(this.rows
      .filter(row => row.node.loadState && row.node.loadState !== "unloaded" && row.node.loadState !== "loaded")
      .map(row => this.stateText(row.node)));
    const announcement = `${this.rows.length} visible items. ${summary} ${[...notable].join(". ")}`;
    if (announcement !== this.announcement) { this.liveEl.textContent = announcement; this.announcement = announcement; }
    if (focusedId && focusedId !== this.activeInternal) {
      if (this.rows.length) this.focus(); else this.treeEl.focus();
    }
    else if (focused === this.treeEl && this.rows.length) this.focus();
  }
}
FolderTree.register();
