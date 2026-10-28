import { FolderTree, type FolderTreeEventDetails } from "./folder-tree.js";
import { ancestorIds, visibleRows } from "./model.js";
import type { FolderTreeNode, FolderTreeDiffNode } from "./types.js";

export interface FolderTreeDiffEventDetails extends Omit<FolderTreeEventDetails, "selected-changed" | "item-activated"> {
  "selected-changed": { id:string; node:FolderTreeDiffNode; selectedIds:string[] };
  "item-activated": { id:string; node:FolderTreeDiffNode };
  "difference-navigated": { id:string; node:FolderTreeDiffNode };
  "changes-only-changed": { changesOnly:boolean };
}
const statuses = ["equal", "changed", "added", "removed", "moved"] as const;
/** One hierarchy and one focus target per aligned before/after row. No matching or fetching. */
export class FolderTreeDiff extends FolderTree {
  static readonly tagName: string = "box-folder-tree-diff";
  static get observedAttributes(): string[] { return [...FolderTree.observedAttributes, "mode", "left-label", "right-label", "changes-only"]; }
  private previousButton!: HTMLButtonElement;
  private nextButton!: HTMLButtonElement;
  private filterButton!: HTMLButtonElement;
  private countsEl!: HTMLElement;
  private explicitExpansion = false;
  private knownIds = new Set<string>();
  get nodes(): FolderTreeDiffNode[] { return super.nodes as FolderTreeDiffNode[]; }
  set nodes(nodes: FolderTreeDiffNode[]) {
    const previous = this.index.byId;
    super.nodes = nodes;
    if (!this.explicitExpansion) {
      const changes = nodes.filter(node => (node.status !== "equal" || node.hasChangedDescendants) && (!this.knownIds.has(node.id) || (previous.get(node.id)?.status === "equal" && node.status !== "equal") || (!((previous.get(node.id) as FolderTreeDiffNode | undefined)?.hasChangedDescendants) && node.hasChangedDescendants)));
      const ancestors = ancestorIds(this.index, changes.map(node => node.parentId ?? ""));
      for (const node of changes) if (node.hasChangedDescendants) ancestors.add(node.id);
      for (const id of ancestors) this.expandedInternal.add(id);
    }
    this.knownIds = new Set(nodes.map(node => node.id));
    this.update();
  }
  get expandedIds(): string[] { return super.expandedIds; }
  set expandedIds(ids: string[]) { this.explicitExpansion = true; super.expandedIds = ids; }
  get mode(): "unified" | "side-by-side" { return this.getAttribute("mode") === "side-by-side" ? "side-by-side" : "unified"; }
  set mode(value: "unified" | "side-by-side") { this.setAttribute("mode", value); }
  get leftLabel(): string { return this.getAttribute("left-label") ?? "Before"; }
  set leftLabel(value: string) { this.setAttribute("left-label", value); }
  get rightLabel(): string { return this.getAttribute("right-label") ?? "After"; }
  set rightLabel(value: string) { this.setAttribute("right-label", value); }
  get changesOnly(): boolean { return this.hasAttribute("changes-only"); }
  set changesOnly(value: boolean) { this.toggleAttribute("changes-only", value); }
  get counts(): Record<FolderTreeDiffNode["status"], number> {
    const counts = { equal:0, changed:0, added:0, removed:0, moved:0 };
    for (const node of this.nodesInternal as FolderTreeDiffNode[]) counts[node.status]++;
    return counts;
  }
  protected includedIds(): Set<string> | undefined {
    const search = super.includedIds();
    if (!this.changesOnly) return search;
    const changed = ancestorIds(this.index, (this.nodesInternal as FolderTreeDiffNode[]).filter(node => node.status !== "equal" || node.hasChangedDescendants).map(node => node.id));
    return search ? new Set([...changed].filter(id => search.has(id))) : changed;
  }
  protected expandedForView(included?: Set<string>): Set<string> {
    return this.filter.trim() ? super.expandedForView(included) : this.expandedInternal;
  }
  protected nodeLabel(node: FolderTreeNode): string {
    const diff = node as FolderTreeDiffNode;
    const availability = diff.status === "added" ? `${this.rightLabel} only` : diff.status === "removed" ? `${this.leftLabel} only` : `${this.leftLabel} and ${this.rightLabel}`;
    return `${super.nodeLabel(node)}, ${availability}, ${diff.path}${diff.status === "moved" ? `, from ${diff.before?.path ?? "unknown"} to ${diff.after?.path ?? diff.path}` : ""}`;
  }
  protected renderContent(container: HTMLElement, node: FolderTreeNode): void {
    const diff = node as FolderTreeDiffNode;
    super.renderContent(container, node);
    const status = container.querySelector('[part="status"]');
    if (status) status.textContent = diff.status[0]!.toUpperCase() + diff.status.slice(1);
    if (this.mode === "side-by-side") {
      container.querySelector('[part="name"]')?.remove();
      const pair = document.createElement("div"); pair.setAttribute("part", "pair");
      for (const side of ["before", "after"] as const) {
        const missing = side === "before" ? diff.status === "added" : diff.status === "removed";
        const cell = document.createElement("div"); cell.setAttribute("part", "side"); cell.dataset.side = side;
        const label = document.createElement("div"); label.setAttribute("part", "side-label"); label.textContent = side === "before" ? this.leftLabel : this.rightLabel;
        const name = document.createElement("div"); name.setAttribute("part", "name"); name.textContent = missing ? "Not present" : diff[side]?.name ?? diff.name;
        const path = document.createElement("div"); path.setAttribute("part", "path"); path.textContent = missing ? "" : diff[side]?.path ?? diff.path;
        cell.append(label, name, path); pair.append(cell);
      }
      container.prepend(pair);
    } else {
      const path = document.createElement("div"); path.setAttribute("part", "path");
      path.textContent = diff.status === "moved" ? `${diff.before?.path ?? "Unknown source"} → ${diff.after?.path ?? diff.path}` : diff.path;
      container.append(path);
    }
  }
  /** Navigate all loaded matching differences, expanding their ancestors first. */
  nextDifference(direction: 1 | -1 = 1): void {
    const query = this.filter.trim().toLocaleLowerCase();
    const differences = visibleRows(this.index, new Set(this.index.byId.keys())).map(row => row.node as FolderTreeDiffNode).filter(node => node.status !== "equal" && (!query || node.name.toLocaleLowerCase().includes(query)));
    if (!differences.length) return;
    const current = differences.findIndex(node => node.id === this.activeId);
    const index = current < 0 ? direction === 1 ? 0 : differences.length - 1 : (current + direction + differences.length) % differences.length;
    const node = differences[index]!;
    const expanded = new Set(this.expandedInternal);
    const ancestors = ancestorIds(this.index, [node.parentId ?? ""]);
    for (const id of ancestors) expanded.add(id);
    if ([...ancestors].some(id => !this.expandedInternal.has(id))) {
      this.changeExpansion(this.index.byId.get(node.parentId ?? "") ?? node, true, expanded);
    } else this.update();
    if (!this.rows.some(row => row.node.id === node.id)) return; // Host may veto expansion.
    this.focusNode(node.id);
    this.emit("difference-navigated", { id:node.id, node });
  }
  protected renderTemplate(): void {
    super.renderTemplate();
    const toolbar = this.shadowRoot!.querySelector<HTMLElement>('[part="toolbar"]')!; toolbar.hidden = false;
    this.previousButton = document.createElement("button"); this.previousButton.type = "button"; this.previousButton.textContent = "Previous difference";
    this.nextButton = document.createElement("button"); this.nextButton.type = "button"; this.nextButton.textContent = "Next difference";
    this.filterButton = document.createElement("button"); this.filterButton.type = "button";
    this.countsEl = document.createElement("span"); this.countsEl.setAttribute("part", "counts");
    toolbar.append(this.previousButton, this.nextButton, this.filterButton, this.countsEl);
  }
  protected setupListeners(): void {
    super.setupListeners();
    this.previousButton.addEventListener("click", () => this.nextDifference(-1));
    this.nextButton.addEventListener("click", () => this.nextDifference());
    this.filterButton.addEventListener("click", () => {
      this.changesOnly = !this.changesOnly;
      this.emit("changes-only-changed", { changesOnly:this.changesOnly });
    });
  }
  protected update(): void {
    super.update(); if (!this.isRendered || !this.countsEl) return;
    const counts = this.counts;
    this.countsEl.textContent = `${this.partial ? "Loaded items: " : ""}${statuses.map(status => `${counts[status]} ${status}`).join(" · ")}`;
    const query = this.filter.trim().toLocaleLowerCase();
    const hasDifferences = (this.nodesInternal as FolderTreeDiffNode[]).some(node => node.status !== "equal" && (!query || node.name.toLocaleLowerCase().includes(query)));
    this.previousButton.disabled = !hasDifferences; this.nextButton.disabled = !hasDifferences;
    this.filterButton.textContent = this.changesOnly ? "Show unchanged" : "Changes only";
    this.filterButton.setAttribute("aria-pressed", String(this.changesOnly));
  }
}
FolderTreeDiff.register();
