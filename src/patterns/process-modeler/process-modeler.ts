import { BaseElement } from "../../core/index.js";
import { announce } from "../../foundations/a11y/index.js";
import { dismissModal, dismissPopover, promoteModal, promotePopover, trackAnchor } from "../../foundations/overlay/index.js";
import type { NodePath } from "../flow-builder/model.js";
import { KindPicker } from "../flow-builder/primitives.js";
import { arrangeProcess, routeProcessLine, lineMidpoint, nearProcessLine, roundedProcessPath } from "./geometry.js";
import { restoreProcessPositions, snapshotProcessPositions, snapshotProcessProjection, graphChecks, normalizeProcessSelectionPath } from "./bridge.js";
import { processModelerDesign } from "./design.js";
import type { ProcessConnection, ProcessVariable, ProcessLoadOptions, ProcessKind, ProcessLastRun, ProcessOutlineItem, ProcessField, ProcessVariableEdit, ProcessSide } from "./model.js";
import {
  completeLayout,
  ProcessHistory,
  validateProjection,
  type BoxPosition,
  type ProcessBox,
  type ProcessCheck,
  type ProcessEdit,
  type ProcessEditRequest,
  type ProcessLayout,
  type ProcessModel,
  type ProcessProjection,
} from "./model.js";

const svgElement = <K extends keyof SVGElementTagNameMap>(
  tag: K,
): SVGElementTagNameMap[K] =>
  document.createElementNS("http://www.w3.org/2000/svg", tag);
const checkGlyph = (success = false): SVGSVGElement => {
  const icon = svgElement('svg'); icon.setAttribute('part', 'check-icon'); icon.setAttribute('viewBox', '0 0 16 16'); icon.setAttribute('aria-hidden', 'true'); icon.dataset.tone = success ? 'success' : 'error';
  const circle = svgElement('circle'); circle.setAttribute('cx', '8'); circle.setAttribute('cy', '8'); circle.setAttribute('r', '7'); circle.setAttribute('fill', 'currentColor');
  const mark = svgElement('path'); mark.setAttribute('d', success ? 'm4.5 8 2.5 2.5 4.5-5' : 'm5 5 6 6m0-6-6 6'); mark.setAttribute('fill', 'none'); mark.setAttribute('stroke', 'var(--boe-token-surface-surface,#fff)'); mark.setAttribute('stroke-width', '1.5'); mark.setAttribute('stroke-linecap', 'round'); icon.append(circle, mark); return icon;
};
const emit = (element: HTMLElement, name: string, detail: unknown): boolean =>
  element.dispatchEvent(
    new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
      cancelable: true,
    }),
  );
const formatFailedShare = (share: number): string => `${Number((share * 100).toFixed(1))}%`;
const formatRunDuration = (ms: number): string =>
  ms >= 1000 ? `${(ms / 1000).toFixed(ms >= 10000 ? 0 : 1)} s` : `${Math.round(ms)} ms`;

/** Projects host documents without owning workflow schemas or persistence. */
export class ProcessModeler<
  D = ProcessProjection,
  N = unknown,
> extends BaseElement {
  static readonly tagName = "box-process-modeler";
  static get observedAttributes(): string[] {
    return ["locked", "snap-to-grid", "heading-level", "disable-connections", "embed-mode"];
  }
  private documentValue?: D;
  private modelValue: ProcessModel<D, N> = {
    project: (document) => document as unknown as ProcessProjection<N>,
  };
  private projection: ProcessProjection<N> = { boxes: [], lines: [] };
  private layoutValue: ProcessLayout = { boxes: {} };
  private catalogValue: readonly ProcessKind[] = [];
  private detailValue: "business" | "technical" = "business";
  private lastRunValue?: ProcessLastRun;
  private showLastRunValue = false;
  private selectedId: string | null = null;
  private selectedLineId: string | null = null;
  private connecting: string | null = null;
  private checks: readonly ProcessCheck[] = [];
  private renderer?: (node: N, container: HTMLElement) => void | (() => void);
  private cleanupInspector?: () => void;
  private inspected?: N;
  private inspectedId?: string;
  private inspectedControls = "";
  private historyValue = new ProcessHistory();
  private viewport = { x: 0, y: 0, zoom: 1 };
  private pointers = new Map<number, { x: number; y: number }>();
  private drag?: {
    previewed?: boolean;
    id?: string;
    x: number;
    y: number;
    position?: BoxPosition;
    panX: number;
    panY: number;
  };
  private pinch?: { distance: number; zoom: number; anchor: { x: number; y: number } };
  private gestureZoom = 1;
  private insertion?: ProcessEdit;
  private keyboardInsertion?: ProcessEdit;
  private keyboardReturn?: HTMLElement;
  private transientChooserAnchor?: HTMLElement;
  private stopKeyboardAnchor?: () => void;
  private activeDrawer?: HTMLDialogElement;
  private drawerReturn?: HTMLElement;
  private selectedIds = new Set<string>();
  private clipboardIds: string[] = [];
  private restoringBoxFocus = false;
  private selectionToolbarKey = "";
  private sectionSequence = 0;
  private versionValue: string | number = 0;
  private lastProjection = "";
  private lastReadableProjection = "";
  private readableValue: ProcessProjection<N> | null = null;
  private lastDocument?: D;
  private connectionsValue: readonly ProcessConnection[] = [];
  private variablesValue: readonly ProcessVariable[] = [];
  private variablesEditableValue = false;
  private outlineValue: readonly ProcessOutlineItem[] = [];
  private fieldsValue: Readonly<Record<string, readonly ProcessField[]>> = {};
  private processTitleValue = "Process";
  private processSummaryValue = "";
  private activePane = "Outline";
  private portDrag?: { pointerId: number; id: string; side: "north" | "east" | "south" | "west"; start: { x: number; y: number }; point: { x: number; y: number } };
  private endDrag?: { pointerId: number; lineId: string; end: 'from' | 'to'; start: { x: number; y: number }; point: { x: number; y: number } };
  private pendingReattach?: { lineId: string; end: 'from' | 'to' };
  private marquee?: { pointerId: number; start: { x: number; y: number }; point: { x: number; y: number } };
  private segmentDrag?: { pointerId: number; id: string; index: number; points: { x: number; y: number }[] };
  private frameResize?: { pointerId: number; id: string; start: { x: number; y: number }; width: number; height: number };
  private spacePressed = false;
  private dropLine?: string;
  private paletteDragKind: ProcessKind | null = null;
  private narrowValue = false;
  private suppressClick = false;
  private resizeObserver?: ResizeObserver;
  private routedLines = new Map<string, { x: number; y: number }[]>();
  private computedChecks: readonly ProcessCheck[] = [];
  get selectedBoxes(): readonly ProcessBox<N>[] { return this.projection.boxes.filter(box => this.selectedIds.has(box.id)); }
  get selectedLine() { return this.projection.lines.find(line => line.id === this.selectedLineId) ?? null; }
  get selectedPath(): NodePath | null { return this.selected?.path ? [...this.selected.path] : null; }
  set selectedPath(path: NodePath | null) {
    if (!this.isRendered && this.documentValue !== undefined) { this.projection = this.model.project(this.documentValue); validateProjection(this.projection); }
    const normalized = normalizeProcessSelectionPath(this.projection, path);
    this.setSelection(normalized === null ? null : this.projection.boxes.find(box => JSON.stringify(box.path) === JSON.stringify(normalized))?.id ?? null, false);
  }
  get connections(): readonly ProcessConnection[] { return this.connectionsValue; }
  set connections(value: readonly ProcessConnection[]) { this.connectionsValue = value; this.refresh(); }
  get variables(): readonly ProcessVariable[] { return this.variablesValue; }
  set variables(value: readonly ProcessVariable[]) {
    this.variablesValue = value; this.refresh();
    if (this.pendingVariableRename && !value.some(v => v.name === this.pendingVariableRename!.name) && value.some(v => v.name === this.pendingVariableRename!.value)) this.pendingVariableRename = undefined;
  }
  private pendingVariableRename?: { name: string; value: string };
  /** Opt in to name, scope, add and remove controls; edits remain host-owned. */
  get variablesEditable(): boolean { return this.variablesEditableValue; }
  set variablesEditable(value: boolean) { this.variablesEditableValue = value; this.toggleAttribute('data-variables-editable', value); this.refresh(); }
  get outline(): readonly ProcessOutlineItem[] { return this.outlineValue; }
  set outline(value: readonly ProcessOutlineItem[]) { this.outlineValue = value; this.refresh(); }
  get fields(): Readonly<Record<string, readonly ProcessField[]>> { return this.fieldsValue; }
  set fields(value: Readonly<Record<string, readonly ProcessField[]>>) { this.fieldsValue = value; this.inspected = undefined; this.refresh(); }
  get processTitle(): string { return this.processTitleValue; }
  set processTitle(value: string) { this.processTitleValue = value; this.refresh(); }
  get processSummary(): string { return this.processSummaryValue; }
  set processSummary(value: string) { this.processSummaryValue = value; this.refresh(); }
  get view(): Readonly<{ x: number; y: number; zoom: number }> { return { ...this.viewport }; }
  setView(view: { x: number; y: number; zoom: number }): void {
    if (![view.x, view.y, view.zoom].every(Number.isFinite) || view.zoom < 0.25 || view.zoom > 2) return;
    this.viewport = { ...view };
    if (this.isRendered) this.paintViewport();
  }
  get version(): string | number { return this.versionValue; }
  get narrow(): boolean { return this.narrowValue; }
  get positions() { return snapshotProcessPositions(this.projection, this.layoutValue); }
  /** Current drawing and last valid drawing; hosts own conversion and persistence. */
  get readback(): Readonly<{ current: ProcessProjection<N> | null; lastReadable: ProcessProjection<N> | null; checks: readonly ProcessCheck[]; version: string | number }> {
    return {
      current: this.documentValue === undefined || this.allChecks.length ? null : snapshotProcessProjection(this.projection),
      lastReadable: this.readableValue ? snapshotProcessProjection(this.readableValue) : null,
      checks: this.allChecks.map(check => ({ ...check, ...(check.path ? { path: [...check.path] } : {}) })),
      version: this.versionValue,
    };
  }
  load(document: D, options: ProcessLoadOptions = {}): void {
    const projection = this.model.project(document); validateProjection(projection);
    this.documentValue = document;
    this.projection = projection;
    this.versionValue = options.version ?? 0;
    this.lastProjection = "";
    this.lastReadableProjection = "";
    this.readableValue = null;
    this.layoutValue = restoreProcessPositions(projection, options.positions ?? []);
    this.history.clear(); this.selectedId = null; this.selectedLineId = null; this.selectedIds.clear();
    this.clipboardIds = [];
    this.refresh();
    if (options.selectedPath) this.selectedPath = options.selectedPath;
  }
  selectMany(ids: readonly string[]): void {
    if (!this.isRendered && this.documentValue !== undefined) { this.projection = this.model.project(this.documentValue); validateProjection(this.projection); }
    const next = new Set(ids.filter(id => this.projection.boxes.some(box => box.id === id)));
    if (next.size === this.selectedIds.size && [...next].every(id => this.selectedIds.has(id))) return;
    this.selectedIds = next;
    this.selectedId = this.selectedIds.values().next().value ?? null;
    this.selectedLineId = null;
    this.renderSelection(); if (this.isRendered) this.updateToolbar();
    emit(this, "selection-changed", { box: this.selected, boxes: this.selectedBoxes, path: this.selectedPath });
  }
  get headingLevel(): number { const level = Number(this.getAttribute("heading-level") ?? 2); return Number.isInteger(level) && level >= 1 && level <= 6 ? level : 2; }
  set headingLevel(value: number) { this.setAttribute("heading-level", String(value)); }
  get disableConnections(): boolean { return this.hasAttribute("disable-connections"); }
  set disableConnections(value: boolean) { this.toggleAttribute("disable-connections", value); }
  /** Hide duplicate process heading/view controls when the host supplies them. */
  get embedMode(): boolean { return this.hasAttribute('embed-mode'); }
  set embedMode(value: boolean) { this.toggleAttribute('embed-mode', value); }
  private arrangedLayout(layout: ProcessLayout): ProcessLayout {
    const arranged = this.model.arrange?.(this.projection) ?? arrangeProcess(this.projection);
    return completeLayout(this.projection, { ...layout, boxes: { ...arranged?.boxes, ...layout.boxes } });
  }

  get document(): D | undefined {
    return this.documentValue;
  }
  get history(): ProcessHistory {
    return this.historyValue;
  }
  set history(value: ProcessHistory) {
    this.historyValue = value;
    this.refresh();
  }
  set document(value: D | undefined) {
    this.documentValue = value;
    this.refresh();
  }
  get model(): ProcessModel<D, N> {
    return this.modelValue;
  }
  set model(value: ProcessModel<D, N>) {
    this.modelValue = value;
    this.refresh();
  }
  get layout(): ProcessLayout {
    return structuredClone(this.layoutValue);
  }
  set layout(value: ProcessLayout) {
    if (JSON.stringify(this.layoutValue) === JSON.stringify(value)) return;
    this.layoutValue = structuredClone(value);
    if (!this.history.replaying) this.history.clear();
    this.refresh();
  }
  get catalog(): readonly ProcessKind[] {
    return this.catalogValue;
  }
  set catalog(value: readonly ProcessKind[]) {
    this.catalogValue = value;
    this.refresh();
  }
  get detail(): "business" | "technical" { return this.detailValue; }
  set detail(value: "business" | "technical") {
    if (value === this.detailValue) return;
    this.detailValue = value; this.refresh();
    emit(this, "detail-changed", { detail: value });
  }
  get lastRun(): ProcessLastRun | undefined { return this.lastRunValue; }
  set lastRun(value: ProcessLastRun | undefined) { this.lastRunValue = value; if (!value) this.showLastRunValue = false; this.inspected = undefined; this.refresh(); }
  get showLastRun(): boolean { return this.showLastRunValue; }
  set showLastRun(value: boolean) { this.showLastRunValue = Boolean(value); this.inspected = undefined; this.refresh(); }
  get locked(): boolean {
    return this.hasAttribute("locked");
  }
  set locked(value: boolean) {
    this.toggleAttribute("locked", value);
  }
  get snapToGrid(): boolean {
    return this.hasAttribute("snap-to-grid");
  }
  set snapToGrid(value: boolean) {
    this.toggleAttribute("snap-to-grid", value);
  }
  get selected(): ProcessBox<N> | null {
    return (
      this.projection.boxes.find((box) => box.id === this.selectedId) ?? null
    );
  }
  get renderInspector() {
    return this.renderer;
  }
  set renderInspector(
    value:
      | ((node: N, container: HTMLElement) => void | (() => void))
      | undefined,
  ) {
    this.cleanupInspector?.();
    this.cleanupInspector = undefined;
    this.inspected = undefined;
    this.renderer = value;
    this.refresh();
  }
  disconnectedCallback(): void {
    this.resizeObserver?.disconnect();
    this.closeDrawer();
    const chooser = this.shadowRoot?.querySelector<HTMLDialogElement>("[part=insert-chooser]");
    if (chooser) dismissModal(chooser);
    this.closeKeyboardChooser();
    this.cleanupInspector?.();
    this.cleanupInspector = undefined;
    this.inspected = undefined;
    this.pointers.clear();
    this.drag = undefined;
    this.portDrag = undefined; this.endDrag = undefined; this.pendingReattach = undefined; this.marquee = undefined; this.segmentDrag = undefined;
  }
  connectedCallback(): void { super.connectedCallback(); this.resizeObserver?.observe(this); }
  refresh(): void {
    if (this.isRendered) this.update();
  }
  select(id: string | null): void {
    this.setSelection(id, true);
  }
  private setSelection(id: string | null, notify: boolean): void {
    if (!this.isRendered && this.documentValue !== undefined) {
      this.projection = this.model.project(this.documentValue);
      validateProjection(this.projection);
    }
    if (id !== null && !this.projection.boxes.some((box) => box.id === id))
      return;
    if (id === this.selectedId && this.selectedIds.size === (id ? 1 : 0) && !this.selectedLineId) return;
    this.selectedId = id;
    this.selectedIds = new Set(id ? [id] : []);
    this.selectedLineId = null;
    this.renderSelection();
    if (this.isRendered) this.updateToolbar();
    if (notify) emit(this, "selection-changed", { box: this.selected, boxes: this.selectedBoxes, path: this.selectedPath });
  }
  selectLine(id: string | null): void {
    if (id !== null && !this.projection.lines.some(line => line.id === id)) return;
    if (this.selectedLineId === id && !this.selectedIds.size) return;
    this.selectedLineId = id; this.selectedId = null; this.selectedIds.clear();
    this.refresh();
    emit(this, 'selection-changed', { box: null, boxes: [], line: this.selectedLine, path: null });
  }
  setValidation(checks: readonly ProcessCheck[]): void {
    this.checks = checks;
    this.refresh();
  }
  setValidationAtPath(message: string, path: NodePath): void {
    this.setValidation(message ? [{ message, path }] : []);
  }
  requestEdit(edit: ProcessEdit): void {
    if (this.locked || (this.disableConnections && (edit.type === "connect" || edit.type === "disconnect" || edit.type === 'reattach'))) return;
    const before = this.layout;
    const previousIds = new Set(this.projection.boxes.map((box) => box.id));
    let accepted = false;
    const request: ProcessEditRequest = {
      ...edit,
      accept: (command) => {
        if (accepted) return;
        accepted = true;
        if (command.layout) this.layoutValue = structuredClone(command.layout);
        this.refresh();
        const inserted = edit.type === 'insert' && !edit.boxId && !command.layout
          ? this.projection.boxes.find(box => !previousIds.has(box.id)) : undefined;
        const reflowed = inserted ? this.reflowStraightInsert(edit, inserted.id, before) : false;
        if (
          !reflowed &&
          !command.layout &&
          edit.position &&
          Number.isFinite(edit.position.x) &&
          Number.isFinite(edit.position.y)
        ) {
          const added = this.projection.boxes.find(box => box.id === edit.boxId) ?? this.projection.boxes.find(
            (box) => !previousIds.has(box.id),
          );
          if (added)
            this.layoutValue = this.translatedLayout(
              added.id,
              edit.position.x,
              edit.position.y,
            );
        }
        const after = this.layout;
        const restore = (layout: ProcessLayout) => {
          this.layoutValue = structuredClone(layout);
          this.refresh();
          this.emitPositions();
        };
        this.history.record({
          undo: () => {
            command.undo();
            restore(before);
          },
          redo: () => {
            command.redo();
            restore(after);
          },
        });
        this.refresh();
        if (JSON.stringify(before) !== JSON.stringify(after))
          this.emitPositions();
        announce("Process updated", "polite", this.ownerDocument);
      },
    };
    emit(this, "process-edit-request", request);
  }
  undo(): void {
    if (this.locked) return;
    this.history.undo();
    this.refresh();
  }
  redo(): void {
    if (this.locked) return;
    this.history.redo();
    this.refresh();
  }
  private commitLayout(next: ProcessLayout): void {
    const before = this.layout;
    const after = structuredClone(next);
    if (JSON.stringify(before) === JSON.stringify(after) || this.locked) return;
    const apply = (layout: ProcessLayout) => {
      this.layoutValue = structuredClone(layout);
      this.refresh();
      this.emitPositions();
    };
    apply(after);
    this.history.record({
      undo: () => apply(before),
      redo: () => apply(after),
    });
    this.updateToolbar();
  }
  move(id: string, x: number, y: number): void {
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !this.layoutValue.boxes[id] ||
      this.locked
    )
      return;
    const next = this.translatedLayout(id, x, y);
    if (emit(this, "move-request", { boxId: id, position: next.boxes[id] }))
      this.commitLayout(next);
  }
  private emitPositions(): void {
    emit(this, "layout-changed", { layout: this.layout });
    emit(this, "positions-changed", { positions: this.positions, version: this.versionValue });
  }
  private translatedLayout(id: string, x: number, y: number): ProcessLayout {
    const snap = (n: number) => (this.snapToGrid ? Math.round(n / 16) * 16 : n);
    const next = this.layout;
    next.boxes[id] = { ...next.boxes[id], x: snap(x), y: snap(y) };
    const dx = next.boxes[id].x - this.layoutValue.boxes[id].x;
    const dy = next.boxes[id].y - this.layoutValue.boxes[id].y;
    const descendants = new Set([id]);
    for (let changed = true; changed; ) {
      changed = false;
      for (const box of this.projection.boxes) {
        if (
          box.parentId &&
          descendants.has(box.parentId) &&
          !descendants.has(box.id)
        ) {
          descendants.add(box.id);
          changed = true;
          next.boxes[box.id] = {
            ...next.boxes[box.id],
            x: next.boxes[box.id].x + dx,
            y: next.boxes[box.id].y + dy,
          };
        }
      }
    }
    return next;
  }
  /** Make room only on a simple, root-level horizontal connection. */
  private reflowStraightInsert(edit: ProcessEdit, insertedId: string, before: ProcessLayout): boolean {
    const source = this.projection.boxes.find(box => box.id === edit.from);
    const target = this.projection.boxes.find(box => box.id === edit.to);
    const inserted = this.projection.boxes.find(box => box.id === insertedId);
    if (!source || !target || !inserted || source.parentId || target.parentId || inserted.parentId) return false;
    const start = before.boxes[source.id], end = before.boxes[target.id];
    const fresh = this.layoutValue.boxes[insertedId];
    if (!start || !end || !fresh) return false;
    const sourceWidth = start.width ?? 224, sourceHeight = start.height ?? 64;
    const targetHeight = end.height ?? 64, width = fresh.width ?? 224, height = fresh.height ?? 64;
    if (start.x + sourceWidth >= end.x || Math.abs(start.y + sourceHeight / 2 - end.y - targetHeight / 2) > 24) return false;
    const x = start.x + sourceWidth + 80;
    const delta = Math.max(0, x + width + 80 - end.x);
    const next = this.layout;
    const shifted = new Set(this.projection.boxes.filter(box => !box.parentId && before.boxes[box.id]?.x >= end.x).map(box => box.id));
    for (let changed = true; changed;) {
      changed = false;
      for (const box of this.projection.boxes) if (box.parentId && shifted.has(box.parentId) && !shifted.has(box.id)) {
        shifted.add(box.id); changed = true;
      }
    }
    for (const box of this.projection.boxes) {
      if (box.id === insertedId || !shifted.has(box.id)) continue;
      next.boxes[box.id] = { ...next.boxes[box.id], x: next.boxes[box.id].x + delta };
    }
    next.boxes[insertedId] = { ...fresh, x, y: start.y + (sourceHeight - height) / 2 };
    this.layoutValue = next;
    return true;
  }
  tidy(): void {
    if (this.locked) return;
    const before = this.layout.boxes;
    this.commitLayout(
      this.arrangedLayout({ ...this.layout, boxes: {} }),
    );
    if (!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      for (const element of Array.from(this.shadowRoot?.querySelectorAll<HTMLElement>('[data-box-id]') ?? [])) {
        const previous = before[element.dataset.boxId!]; const next = this.layoutValue.boxes[element.dataset.boxId!];
        if (!previous || !next || !element.animate) continue;
        const dx = previous.x - next.x; const dy = previous.y - next.y;
        if (dx || dy) element.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], { duration: 320, easing: 'ease-out' });
      }
    }
    this.fitTo(this.narrowValue ? 0.55 : 0.7);
  }
  resize(id: string, width: number, height: number): void {
    if (
      !this.layoutValue.boxes[id] ||
      !Number.isFinite(width) ||
      !Number.isFinite(height)
    )
      return;
    const next = this.layout;
    next.boxes[id] = {
      ...next.boxes[id],
      width: Math.max(120, width),
      height: Math.max(64, height),
    };
    this.commitLayout(next);
  }
  routeLine(id: string, points: readonly { x: number; y: number }[]): void {
    if (
      !this.projection.lines.some((line) => line.id === id) ||
      points.some(
        (point) => !Number.isFinite(point.x) || !Number.isFinite(point.y),
      )
    )
      return;
    this.commitLayout({
      ...this.layout,
      lines: {
        ...this.layoutValue.lines,
        [id]: points.map((point) => ({ ...point })),
      },
    });
  }
  resetLine(id: string): void {
    if (!this.layoutValue.lines?.[id]) return;
    const next = this.layout;
    delete next.lines?.[id];
    this.commitLayout(next);
  }
  setNote(
    note: NonNullable<ProcessLayout["notes"]>[number] | null,
    id = note?.id,
  ): void {
    if (!id || (note && (!Number.isFinite(note.x) || !Number.isFinite(note.y))))
      return;
    this.commitLayout({
      ...this.layout,
      notes: [
        ...(this.layoutValue.notes ?? []).filter((item) => item.id !== id),
        ...(note ? [{ ...note, id }] : []),
      ],
    });
  }
  setSection(
    section: NonNullable<ProcessLayout["sections"]>[number] | null,
    id = section?.id,
  ): void {
    if (
      !id ||
      (section &&
        [section.x, section.y, section.width, section.height].some(
          (value) => !Number.isFinite(value),
        ))
    )
      return;
    this.commitLayout({
      ...this.layout,
      sections: [
        ...(this.layoutValue.sections ?? []).filter((item) => item.id !== id),
        ...(section ? [{ ...section, id }] : []),
      ],
    });
  }
  zoomBy(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0) return;
    const viewport =
      this.shadowRoot!.querySelector<HTMLElement>("[part=canvas]")!;
    this.zoomAround(factor, viewport.clientWidth / 2, viewport.clientHeight / 2);
  }
  private zoomAround(factor: number, centerX: number, centerY: number): void {
    if (!Number.isFinite(factor) || factor <= 0) return;
    const previous = this.viewport.zoom;
    const next = Math.max(0.25, Math.min(2, previous * factor));
    this.viewport.x = centerX - ((centerX - this.viewport.x) / previous) * next;
    this.viewport.y = centerY - ((centerY - this.viewport.y) / previous) * next;
    this.viewport.zoom = next;
    this.paintViewport();
  }
  fit(): void { this.fitTo(0.25); }
  private fitTo(minimumZoom: number): void {
    const bounds = this.bounds();
    const canvas =
      this.shadowRoot!.querySelector<HTMLElement>("[part=canvas]")!;
    this.viewport.zoom = Math.max(
      minimumZoom,
      Math.min(
        1.5,
        ((canvas.clientWidth || 700) - 40) / bounds.width,
        ((canvas.clientHeight || 480) - 40) / bounds.height,
      ),
    );
    this.viewport.x = 20 - bounds.x * this.viewport.zoom;
    this.viewport.y = 20 - bounds.y * this.viewport.zoom;
    this.paintViewport();
  }
  private minimapBounds(canvas: HTMLElement) {
    const positions = this.projection.boxes.map(box => this.layoutValue.boxes[box.id]);
    const view = { x: -this.viewport.x / this.viewport.zoom, y: -this.viewport.y / this.viewport.zoom, width: canvas.clientWidth / this.viewport.zoom, height: canvas.clientHeight / this.viewport.zoom };
    const sections = this.layoutValue.sections ?? [];
    const notes = this.layoutValue.notes ?? [];
    const x = Math.min(view.x, ...positions.map(p => p.x), ...sections.map(s => s.x), ...notes.map(n => n.x));
    const y = Math.min(view.y, ...positions.map(p => p.y), ...sections.map(s => s.y), ...notes.map(n => n.y));
    const right = Math.max(view.x + view.width, ...positions.map(p => p.x + (p.width ?? 224)), ...sections.map(s => s.x + s.width), ...notes.map(n => n.x + 208));
    const bottom = Math.max(view.y + view.height, ...positions.map(p => p.y + (p.height ?? 64)), ...sections.map(s => s.y + s.height), ...notes.map(n => n.y + 80));
    const pad = 40, scale = Math.min(208 / (right - x + 2 * pad), 136 / (bottom - y + 2 * pad));
    const width = 208 / scale, height = 136 / scale;
    return { x: x - pad - (width - (right - x + 2 * pad)) / 2, y: y - pad - (height - (bottom - y + 2 * pad)) / 2, width, height };
  }
  private bounds() {
    const positions = this.projection.boxes.map(
      (box) => this.layoutValue.boxes[box.id],
    );
    const x = Math.min(0, ...positions.map((pos) => pos.x));
    const y = Math.min(0, ...positions.map((pos) => pos.y));
    return {
      x,
      y,
      width:
        Math.max(100, ...positions.map((pos) => pos.x + (pos.width ?? 224))) -
        x,
      height:
        Math.max(100, ...positions.map((pos) => pos.y + (pos.height ?? 64))) -
        y,
    };
  }
  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>${processModelerDesign}</style><div part="toolbar" role="toolbar" aria-label="Diagram controls"><button data-command="zoom-out">Zoom out</button><button data-command="reset">100%</button><button data-command="zoom-in">Zoom in</button><button data-command="fit">Fit the whole process</button><button data-command="checks-status" type="button">Checks</button><button data-command="undo">Undo</button><button data-command="redo">Redo</button><button data-command="tidy">Tidy up</button><button data-command="snap" aria-pressed="false">Snap to grid</button><button data-command="lock" aria-pressed="false">Lock diagram</button></div><div part="layout"><div part="canvas" tabindex="0" role="region" aria-label="Process diagram" aria-describedby="process-help"><div part="world"></div><svg part="minimap" role="img" aria-label="Diagram overview. Click to jump"></svg></div><div part="inspector" role="region" aria-label="Process details"><div part="palette"><label>Find a building block<input type="search" part="search"></label><div part="choices"></div></div><div part="editor"></div><div part="checks" role="region" aria-label="Checks"></div></div></div><p part="help" id="process-help">Tab moves between steps. Alt plus an arrow selects the next step that way. Arrows move the selected step; Shift moves it four grid squares. N opens the building-block chooser. Enter edits. Delete removes. Shift plus 1 fits the process. Drag the background to pan; pinch or use the controls to zoom. Escape cancels connecting.</p><div part="status" role="status" aria-live="polite"></div><div part="urgent-status" role="alert" aria-live="assertive"></div>`;
    const canvas = this.shadowRoot!.querySelector<HTMLElement>('[part=canvas]')!;
    const canvasStack = document.createElement('div'); canvasStack.setAttribute('part', 'canvas-stack');
    canvas.before(canvasStack); canvasStack.append(canvas);
    const chooser = document.createElement("dialog"); chooser.setAttribute("part", "insert-chooser"); chooser.setAttribute("aria-label", "Insert a building block");
    const picker = new KindPicker();
    picker.variant = "menu"; picker.searchable = true; chooser.append(picker); this.shadowRoot!.append(chooser);
    picker.addEventListener("kind-pick", event => {
      const insertion = this.insertion; dismissModal(chooser); this.insertion = undefined;
      if (insertion) this.requestEdit({ ...insertion, kind: (event as CustomEvent).detail.kind });
    });
    picker.addEventListener("picker-cancel", () => { dismissModal(chooser); this.insertion = undefined; });
    const keyboardChooser = document.createElement('div');
    keyboardChooser.setAttribute('part', 'keyboard-chooser');
    keyboardChooser.setAttribute('popover', 'manual');
    keyboardChooser.setAttribute('role', 'dialog');
    keyboardChooser.setAttribute('aria-labelledby', 'process-keyboard-chooser-title');
    const keyboardTitle = document.createElement('h3');
    keyboardTitle.id = 'process-keyboard-chooser-title';
    keyboardTitle.setAttribute('part', 'chooser-title');
    const keyboardPicker = new KindPicker();
    keyboardPicker.variant = 'menu'; keyboardPicker.searchable = true;
    keyboardChooser.append(keyboardTitle, keyboardPicker);
    this.shadowRoot!.append(keyboardChooser);
    keyboardPicker.addEventListener('kind-pick', event => {
      const edit = this.keyboardInsertion;
      this.closeKeyboardChooser(true);
      // Keep a stable step focused while the host applies and accepts the edit.
      // World refreshes preserve step focus, including deferred acceptance.
      if (edit?.from) this.focusBox(edit.from);
      if (edit) this.requestEdit({ ...edit, kind: (event as CustomEvent).detail.kind });
    });
    keyboardPicker.addEventListener('picker-cancel', () => this.closeKeyboardChooser(true));
    this.setupPanes();
  }
  private setupPanes(): void {
    const root = this.shadowRoot!;
    const toolbar = root.querySelector<HTMLElement>('[part=toolbar]')!;
    const viewSwitch = document.createElement("div"); viewSwitch.setAttribute("part", "view-switch"); viewSwitch.setAttribute("role", "group"); viewSwitch.setAttribute("aria-label", "Diagram detail");
    for (const [value, label] of [["business", "Business view"], ["technical", "Technical view"]] as const) {
      const button = document.createElement("button"); button.type = "button"; button.dataset.detail = value; button.textContent = label;
      button.onclick = () => { this.detail = value; };
      viewSwitch.append(button);
    }
    const runToggle = document.createElement("label"); runToggle.setAttribute("part", "run-toggle");
    const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.setAttribute("aria-label", "Show last run");
    checkbox.onchange = () => { this.showLastRun = checkbox.checked; };
    runToggle.append(checkbox, document.createTextNode("Last run"));
    const checksStatus = toolbar.querySelector<HTMLButtonElement>('[data-command=checks-status]')!;
    checksStatus.onclick = () => { this.select(null); this.activePane = 'Checks'; this.renderPane(); if (this.narrowValue) this.openDrawer('inspector'); root.querySelector<HTMLButtonElement>('#process-tab-checks')?.focus(); };
    const viewMenu = document.createElement("details"); viewMenu.setAttribute("part", "view-menu");
    const summary = document.createElement("summary"); summary.textContent = "View"; viewMenu.append(summary);
    const viewOptions = document.createElement('div'); viewOptions.setAttribute('part', 'view-menu-options'); viewMenu.append(viewOptions);
    for (const [value, label] of [["business", "Business view"], ["technical", "Technical view"]] as const) {
      const button = document.createElement("button"); button.type = "button"; button.dataset.detail = value; button.textContent = label;
      button.onclick = () => { this.detail = value; viewMenu.open = false; };
      viewOptions.append(button);
    }
    const mobileRun = document.createElement('button'); mobileRun.type = 'button'; mobileRun.dataset.viewOption = 'last-run'; mobileRun.textContent = 'Last run'; mobileRun.onclick = () => { this.showLastRun = !this.showLastRun; viewMenu.open = false; }; viewOptions.append(mobileRun);
    const mobileChecks = document.createElement('button'); mobileChecks.type = 'button'; mobileChecks.textContent = 'Checks'; mobileChecks.onclick = () => { this.select(null); this.activePane = 'Checks'; this.renderPane(); viewMenu.open = false; this.openDrawer('inspector'); }; viewOptions.append(mobileChecks);
    toolbar.prepend(viewSwitch, runToggle, viewMenu);
    const layout = root.querySelector('[part=layout]')!;
    const scrim = document.createElement('div'); scrim.setAttribute('part', 'pane-scrim'); scrim.setAttribute('aria-hidden', 'true'); scrim.hidden = true;
    scrim.onclick = () => this.closeDrawer(true); root.append(scrim);
    const palette = root.querySelector<HTMLElement>('[part=palette]')!;
    const searchLabel = palette.querySelector('label')!;
    searchLabel.querySelector('input')?.setAttribute('placeholder', 'Find a building block');
    const searchIcon = svgElement('svg'); searchIcon.setAttribute('part', 'search-icon'); searchIcon.setAttribute('viewBox', '0 0 24 24'); searchIcon.setAttribute('fill', 'none'); searchIcon.setAttribute('stroke', 'currentColor'); searchIcon.setAttribute('stroke-width', '1.8'); searchIcon.setAttribute('aria-hidden', 'true');
    const searchCircle = svgElement('circle'); searchCircle.setAttribute('cx', '10.5'); searchCircle.setAttribute('cy', '10.5'); searchCircle.setAttribute('r', '6.5');
    const searchHandle = svgElement('path'); searchHandle.setAttribute('d', 'm16 16 5 5'); searchIcon.append(searchCircle, searchHandle); searchLabel.append(searchIcon);
    const skip = document.createElement("button"); skip.type = "button"; skip.setAttribute("part", "skip-link"); skip.textContent = "Skip to the diagram";
    skip.onclick = () => { const target = this.selectedId ?? this.projection.boxes.find(box => box.kind === "start")?.id; if (target) this.focusBox(target); else root.querySelector<HTMLElement>('[part=canvas]')?.focus(); };
    const paletteHeading = document.createElement("h2"); paletteHeading.setAttribute("part", "palette-heading"); paletteHeading.textContent = "Add to the process";
    palette.prepend(skip, paletteHeading);
    const hint = document.createElement("p"); hint.setAttribute("part", "palette-hint"); hint.textContent = "Drag onto the canvas, a connection, or a frame. Select a step first to add after it."; palette.append(hint);
    for (const [part, label] of [["palette", "Building blocks"], ["inspector", "Process details"]]) {
      const pane = root.querySelector(`[part=${part}]`)!;
      const dialog = document.createElement("dialog"); dialog.setAttribute("part", "pane-drawer"); dialog.setAttribute("aria-label", label); dialog.dataset.pane = part;
      dialog.inert = this.narrowValue;
      dialog.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); this.closeDrawer(true); } });
      dialog.addEventListener('cancel', event => { event.preventDefault(); this.closeDrawer(true); });
      if (part === "palette") {
        const title = document.createElement("h2"); title.id = "process-palette-title"; title.setAttribute("part", "pane-title"); title.textContent = "Add to the process";
        dialog.removeAttribute("aria-label"); dialog.setAttribute("aria-labelledby", title.id); dialog.append(title);
      }
      const close = document.createElement("button"); close.setAttribute("part", "pane-close"); close.textContent = '×'; close.setAttribute('aria-label', `Close ${label.toLowerCase()}`);
      close.onclick = () => this.closeDrawer(true); dialog.append(close, pane);
      if (part === "palette") layout.prepend(dialog); else layout.append(dialog);
      const trigger = document.createElement("button"); trigger.dataset.command = part === "palette" ? "palette" : "details"; trigger.textContent = part === "palette" ? "Add" : "Details"; trigger.setAttribute("aria-label", part === "palette" ? "Add building blocks" : `Open ${label.toLowerCase()}`);
      trigger.setAttribute('aria-expanded', 'false');
      trigger.onclick = () => this.openDrawer(part as 'palette' | 'inspector'); toolbar.append(trigger);
    }
    const inspector = root.querySelector('[part=inspector]')!;
    const heading = document.createElement("div"); heading.setAttribute("part", "process-heading");
    const title = document.createElement("strong"); title.setAttribute("part", "process-title");
    const summaryText = document.createElement("span"); summaryText.setAttribute("part", "process-summary");
    heading.append(title, summaryText); inspector.prepend(heading);
    const tabs = document.createElement("div"); tabs.setAttribute("part", "pane-tabs"); tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", "Process details");
    for (const name of ["Outline", "Checks", "Variables", "Connections", "Shortcuts"]) {
      const button = document.createElement("button"); button.textContent = name; button.dataset.pane = name; button.setAttribute("role", "tab"); button.id = `process-tab-${name.toLowerCase()}`;
      button.setAttribute("aria-controls", "process-pane-content");
      button.onclick = () => { this.activePane = name; this.renderPane(); };
      button.onkeydown = event => {
        const buttons = Array.from(tabs.querySelectorAll<HTMLButtonElement>("button")); const index = buttons.indexOf(button);
        const next = event.key === "ArrowRight" ? (index + 1) % buttons.length : event.key === "ArrowLeft" ? (index + buttons.length - 1) % buttons.length : event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : -1;
        if (next >= 0) { event.preventDefault(); buttons[next].click(); buttons[next].focus(); }
      };
      tabs.append(button);
    }
    const content = document.createElement("div"); content.setAttribute("part", "pane-content"); content.setAttribute("role", "tabpanel"); content.id = "process-pane-content";
    heading.after(tabs); inspector.append(content);
    root.querySelector('[part=checks]')!.setAttribute("role", "group");
    const canvas = root.querySelector('[part=canvas]')!;
    const hold = document.createElement('div'); hold.setAttribute('part', 'hold'); hold.setAttribute('role', 'status'); hold.hidden = true;
    const holdText = document.createElement('span'); holdText.setAttribute('part', 'hold-text');
    const showChecks = document.createElement('button'); showChecks.type = 'button'; showChecks.textContent = 'Show checks';
    showChecks.onclick = () => { this.select(null); this.activePane = 'Checks'; this.renderPane(); if (this.narrowValue) this.openDrawer('inspector'); root.querySelector<HTMLButtonElement>('#process-tab-checks')?.focus(); };
    hold.append(holdText, showChecks); canvas.before(hold);
    const controls = document.createElement("div"); controls.setAttribute("part", "controls"); controls.setAttribute("role", "toolbar"); controls.setAttribute("aria-label", "Canvas view controls");
    for (const command of ["zoom-out", "reset", "zoom-in", "fit", "snap", "lock"]) {
      const button = root.querySelector<HTMLButtonElement>(`[data-command=${command}]`);
      if (button) controls.append(button);
    }
    canvas.append(controls);
    const commandIcons: Record<string, string> = {
      "zoom-out": '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
      "zoom-in": '<circle cx="12" cy="12" r="9"/><path d="M8 12h8m-4-4v8"/>',
      fit: '<path d="M4 9V4h5m6 0h5v5m0 6v5h-5m-6 0H4v-5"/>',
      snap: '<circle cx="5" cy="5" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="19" cy="5" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="19" r="1"/><circle cx="12" cy="19" r="1"/><circle cx="19" cy="19" r="1"/>',
      lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      undo: '<path d="M9 7 4 12l5 5M4 12h10a6 6 0 0 1 6 6"/>',
      redo: '<path d="m15 7 5 5-5 5m5-5H10a6 6 0 0 0-6 6"/>',
    };
    for (const [command, path] of Object.entries(commandIcons)) {
      const button = root.querySelector<HTMLButtonElement>(`[data-command=${command}]`)!;
      const label = button.textContent ?? command;
      button.setAttribute("aria-label", label);
      button.title = label;
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg><span part="sr-only">${label}</span>`;
    }
    const floating = document.createElement("div"); floating.setAttribute("part", "selection-toolbar"); floating.setAttribute("role", "toolbar"); floating.setAttribute("aria-label", "Selected steps");
    canvas.append(floating);
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(entries => {
        const narrow = entries[0].contentRect.width < 900;
        this.narrowValue = narrow; this.toggleAttribute("data-narrow", narrow);
        this.toggleAttribute('data-phone', entries[0].contentRect.width < 560);
        this.renderSelectionToolbar(); this.positionSelectionToolbar();
        if (!narrow) this.closeDrawer();
        root.querySelectorAll<HTMLDialogElement>('[part=pane-drawer]').forEach(dialog => { dialog.inert = narrow && !dialog.open; });
      });
      this.resizeObserver.observe(this);
    }
  }
  private openDrawer(pane: 'palette' | 'inspector'): void {
    if (!this.narrowValue) return;
    const root = this.shadowRoot!;
    const dialog = root.querySelector<HTMLDialogElement>(`[part=pane-drawer][data-pane=${pane}]`)!;
    const returnTo = root.activeElement as HTMLElement | null;
    this.closeDrawer();
    this.drawerReturn = returnTo ?? undefined;
    try { dialog.show(); } catch { dialog.setAttribute('open', ''); }
    dialog.inert = false;
    this.activeDrawer = dialog;
    root.querySelector<HTMLElement>('[part=pane-scrim]')!.hidden = false;
    root.querySelector<HTMLButtonElement>(`[data-command=${pane === 'palette' ? 'palette' : 'details'}]`)?.setAttribute('aria-expanded', 'true');
    const focus = pane === 'palette'
      ? dialog.querySelector<HTMLElement>('[part=search]')
      : (this.selected
        ? dialog.querySelector<HTMLElement>('[part=editor] input, [part=editor] textarea, [part=editor] select')
        : dialog.querySelector<HTMLElement>('[role=tab][aria-selected=true]'))
        ?? dialog.querySelector<HTMLElement>('[part=pane-close]');
    focus?.focus({ preventScroll: true });
  }
  private closeDrawer(returnFocus = false): void {
    const dialog = this.activeDrawer;
    if (dialog?.open) {
      try { dialog.close(); } catch { dialog.removeAttribute('open'); }
      dialog.inert = this.narrowValue;
      this.shadowRoot?.querySelector<HTMLButtonElement>(`[data-command=${dialog.dataset.pane === 'palette' ? 'palette' : 'details'}]`)?.setAttribute('aria-expanded', 'false');
    }
    const scrim = this.shadowRoot?.querySelector<HTMLElement>('[part=pane-scrim]');
    if (scrim) scrim.hidden = true;
    const returnTo = this.drawerReturn;
    this.activeDrawer = undefined; this.drawerReturn = undefined;
    if (returnFocus) returnTo?.focus({ preventScroll: true });
  }
  private renderPane(): void {
    if (!this.isRendered) return;
    const root = this.shadowRoot!;
    const selected = this.selected;
    root.querySelector('[part=process-title]')!.textContent = this.selectedIds.size > 1 ? `${this.selectedIds.size} steps selected` : selected?.title ?? this.processTitleValue;
    root.querySelector('[part=process-summary]')!.textContent = this.selectedIds.size > 1 ? 'Arrange or group these steps' : selected ? this.catalog.find(kind => kind.kind === selected.kind)?.label ?? selected.kind : this.processSummaryValue;
    root.querySelector<HTMLElement>('[part=pane-tabs]')!.hidden = Boolean(selected);
    root.querySelectorAll<HTMLButtonElement>('[part=pane-tabs] button').forEach(button => {
      button.textContent = button.dataset.pane === "Checks" ? `Checks ${this.allChecks.length}` : button.dataset.pane ?? "";
      const selected = button.dataset.pane === this.activePane; button.setAttribute("aria-selected", String(selected)); button.tabIndex = selected ? 0 : -1;
    });
    const content = root.querySelector<HTMLElement>('[part=pane-content]')!;
    content.hidden = Boolean(selected);
    content.setAttribute("aria-labelledby", `process-tab-${this.activePane.toLowerCase()}`);
    const checks = root.querySelector<HTMLElement>('[part=checks]')!;
    checks.hidden = this.activePane !== "Checks";
    // Move the checks node out before replacing its parent; keep its handlers.
    root.querySelector('[part=inspector]')!.append(checks);
    content.replaceChildren();
    root.querySelector<HTMLElement>('[part=editor]')!.hidden = !selected;
    if (this.activePane === "Outline") {
      const intro = document.createElement("p"); intro.setAttribute("part", "outline-intro"); intro.textContent = "The process as numbered steps, written from the diagram. Share it as documentation or read it aloud."; content.append(intro);
      const fallback: ProcessOutlineItem[] = this.projection.boxes.map(box => ({ title: box.title, description: box.description, boxId: box.id }));
      const outline = this.outlineValue.length ? this.outlineValue : fallback;
      const copy = document.createElement('button'); copy.type = 'button'; copy.setAttribute('part', 'copy-outline'); copy.textContent = 'Copy as text';
      copy.onclick = () => {
        const lines: string[] = [];
        const walk = (items: readonly ProcessOutlineItem[], depth: number) => items.forEach((item, index) => { lines.push(`${'  '.repeat(depth)}${index + 1}. ${item.title}${item.description ? ` — ${item.description}` : ''}`); if (item.children) walk(item.children, depth + 1); });
        walk(outline, 0);
        const value = lines.join('\n'); emit(this, 'outline-copy-request', { text: value });
        void navigator.clipboard?.writeText(value).then(() => this.setStatus('Outline copied')).catch(() => this.setStatus('Use your host copy action to copy the outline'));
      };
      const appendOutline = (items: readonly ProcessOutlineItem[], parent: HTMLElement): void => {
        const list = document.createElement("ol"); list.setAttribute("part", "outline-list");
        for (const item of items) {
          const row = document.createElement("li");
          const label = document.createElement(item.boxId ? "button" : "strong");
          label.textContent = item.title;
          if (item.boxId && label instanceof HTMLButtonElement) {
            label.type = "button"; label.setAttribute("aria-current", String(this.selectedIds.has(item.boxId)));
            label.onclick = () => { this.select(item.boxId!); this.focusBox(item.boxId!); };
          }
          row.append(label);
          if (item.description) { const detail = document.createElement("p"); detail.textContent = item.description; row.append(detail); }
          if (item.children?.length) appendOutline(item.children, row);
          list.append(row);
        }
        parent.append(list);
      };
      appendOutline(outline, content);
      content.append(copy);
    } else if (this.activePane === "Checks") {
      content.append(checks);
    } else if (this.activePane === "Variables") {
      if (!this.variables.length) content.textContent = 'No variables supplied by the host.';
      for (const [index, variable] of this.variables.entries()) {
        const row = document.createElement('div'); row.setAttribute('part', 'variable-row');
        const identify = (control: HTMLElement, key: string) => { control.dataset.variable = variable.name; control.dataset.variableKey = key; control.dataset.variableIndex = String(index); };
        if (this.variablesEditable) {
          const label = document.createElement('label'); label.textContent = 'Name';
          const name = document.createElement('input'); name.type = 'text'; name.value = variable.name; name.disabled = this.locked; identify(name, 'name');
          name.onchange = () => this.requestVariableEdit({ type: 'rename', name: variable.name, value: name.value }); label.append(name); row.append(label);
          const scopeLabel = document.createElement('label'); scopeLabel.textContent = 'Scope';
          const scope = document.createElement('select'); identify(scope, 'scope'); scope.disabled = this.locked;
          for (const [value, text] of [['iteration', 'Each iteration'], ['process', 'The whole process']] as const) { const option = document.createElement('option'); option.value = value; option.textContent = text; scope.append(option); }
          scope.value = variable.scope ?? 'iteration'; scope.onchange = () => this.requestVariableEdit({ type: 'scope', name: variable.name, value: scope.value as 'iteration' | 'process' }); scopeLabel.append(scope); row.append(scopeLabel);
        } else {
          const heading = document.createElement('strong'); heading.textContent = variable.name; row.append(heading);
          if (variable.scope) { const scope = document.createElement('span'); scope.textContent = variable.scope; scope.setAttribute('part', 'variable-scope'); row.append(scope); }
        }
        if (variable.description) { const description = document.createElement('p'); description.textContent = variable.description; row.append(description); }
        if (variable.startingValue !== undefined) { const label = document.createElement('label'); label.textContent = 'Starting value'; const input = document.createElement('input'); input.type = 'text'; identify(input, 'value'); input.value = variable.startingValue; input.disabled = this.locked; input.setAttribute('aria-invalid', String(Boolean(variable.problem))); input.addEventListener('input', () => emit(this, 'process-variable-change-request', { name: variable.name, value: input.value })); label.append(input); row.append(label); }
        const scopeControl = row.querySelector('[data-variable-key=scope]')?.closest('label'); if (scopeControl) row.append(scopeControl);
        if (variable.problem) { const problem = document.createElement('p'); problem.setAttribute('part', 'field-problem'); problem.textContent = variable.problem; row.append(problem); }
        if (this.variablesEditable) { const remove = document.createElement('button'); remove.type = 'button'; remove.setAttribute('part', 'variable-remove'); remove.setAttribute('aria-label', `Remove ${variable.name || 'this variable'}`); remove.textContent = '×'; remove.disabled = this.locked; identify(remove, 'remove'); remove.onclick = () => this.requestVariableEdit({ type: 'remove', name: variable.name }); row.append(remove); }
        content.append(row);
      }
      if (this.variablesEditable) { const add = document.createElement('button'); add.type = 'button'; add.setAttribute('part', 'variable-add'); add.dataset.variable = '@add'; add.dataset.variableKey = 'add'; add.textContent = 'Add a variable'; add.disabled = this.locked; add.onclick = () => this.requestVariableEdit({ type: 'add' }); content.append(add); }
    } else if (this.activePane === "Connections") {
      if (!this.connections.length) content.textContent = 'No connections supplied by the host.';
      for (const connection of this.connections) {
        const row = document.createElement('div'); row.setAttribute('part', 'connection-row');
        const name = document.createElement('strong'); name.textContent = connection.name;
        const kind = document.createElement('span'); kind.textContent = `(${connection.kind})${connection.signIn ? ` · ${connection.signIn}` : ''}`;
        row.append(name, document.createTextNode(' '), kind); content.append(row);
      }
      const setup = document.createElement('button'); setup.type = 'button'; setup.textContent = 'Manage connections'; setup.onclick = () => emit(this, 'connection-setup-request', {}); content.append(setup);
    } else if (this.activePane === "Shortcuts") {
      content.textContent = "Tab: move between steps. Alt+arrows: select the nearest step that way. Arrows: move one grid square. Shift+arrows: move four. N: add the next step. Ctrl+Alt+arrows: add in a direction. Enter: edit. Delete: remove. Ctrl/Command+A: select all. Ctrl/Command+C/V/D: copy, paste, duplicate. Ctrl/Command+Z and Shift+Ctrl/Command+Z: undo and redo. Shift+1: fit the whole process. Shift+drag: select a region. Drag a port: connect. Escape: cancel.";
    }
  }
  private requestVariableEdit(edit: ProcessVariableEdit): void {
    if (!this.locked) {
      if (edit.type === 'rename') this.pendingVariableRename = { name: edit.name, value: edit.value };
      emit(this, 'process-variable-edit-request', edit);
    }
  }
  private selectionDimensions(box: ProcessBox<N>): { width: number; height: number } {
    const shape = box.shape ?? this.catalog.find(kind => kind.kind === box.kind)?.shape;
    const compact = shape === 'gateway' || shape === 'event';
    const position = this.layoutValue.boxes[box.id];
    return { width: position.width ?? (compact ? 56 : 224), height: position.height ?? (compact ? 56 : 64) };
  }
  private selectionCommand(command: string): void {
    if (this.locked) return;
    const boxes = this.selectedBoxes;
    if (command === "delete-many") { for (const box of boxes) this.requestEdit({ type: "delete", boxId: box.id }); return; }
    if (command === 'space') { this.tidySelection(); return; }
    const rectangles = boxes.map(box => ({ ...this.layoutValue.boxes[box.id], ...this.selectionDimensions(box) }));
    const width = Math.max(...rectangles.map(r => r.x + r.width)) - Math.min(...rectangles.map(r => r.x));
    const height = Math.max(...rectangles.map(r => r.y + r.height)) - Math.min(...rectangles.map(r => r.y));
    this.arrangeSelection(width >= height ? 'middle' : 'center');
  }
  private tidySelection(): void {
    if (this.locked || this.selectedBoxes.length < 2) return;
    const next = this.layout;
    const roots = this.selectedBoxes.filter(box => {
      let parent = box.parentId;
      while (parent) {
        if (this.selectedIds.has(parent)) return false;
        parent = this.projection.boxes.find(candidate => candidate.id === parent)?.parentId;
      }
      return true;
    });
    const groups = new Map<string | undefined, ProcessBox<N>[]>();
    for (const box of roots) groups.set(box.parentId, [...(groups.get(box.parentId) ?? []), box]);
    for (const group of groups.values()) {
      if (group.length < 2) continue;
      const included = new Set(group.map(box => box.id));
      for (let changed = true; changed;) {
        changed = false;
        for (const box of this.projection.boxes) {
          if (box.parentId && included.has(box.parentId) && !included.has(box.id)) {
            included.add(box.id); changed = true;
          }
        }
      }
      const subset: ProcessProjection<N> = {
        boxes: this.projection.boxes.filter(box => included.has(box.id)).map(box => ({
          ...box, parentId: box.parentId && included.has(box.parentId) ? box.parentId : undefined,
        })),
        lines: this.projection.lines.filter(line => included.has(line.from) && included.has(line.to)),
      };
      const arranged = this.model.arrange?.(subset) ?? arrangeProcess(subset);
      const startX = Math.min(...group.map(box => next.boxes[box.id].x));
      const startY = Math.min(...group.map(box => next.boxes[box.id].y));
      const arrangedX = Math.min(...group.map(box => arranged.boxes[box.id]?.x ?? Infinity));
      const arrangedY = Math.min(...group.map(box => arranged.boxes[box.id]?.y ?? Infinity));
      if (![arrangedX, arrangedY].every(Number.isFinite)) continue;
      for (const box of subset.boxes) {
        const position = arranged.boxes[box.id];
        if (!position || !next.boxes[box.id]) continue;
        next.boxes[box.id] = { ...next.boxes[box.id], x: startX + position.x - arrangedX, y: startY + position.y - arrangedY };
      }
    }
    this.commitLayout(next);
  }
  arrangeSelection(action: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'distribute-horizontal' | 'distribute-vertical'): void {
    if (this.locked || this.selectedBoxes.length < 2) return;
    const boxes = this.selectedBoxes;
    const next = this.layout;
    const sorted = [...boxes].filter(box => {
      let parent = box.parentId; while (parent) { if (this.selectedIds.has(parent)) return false; parent = this.projection.boxes.find(box => box.id === parent)?.parentId; } return true;
    });
    if (sorted.length < 2) return;
    const width = (box: ProcessBox<N>) => this.selectionDimensions(box).width;
    const height = (box: ProcessBox<N>) => this.selectionDimensions(box).height;
    const minX = Math.min(...sorted.map(box => next.boxes[box.id].x));
    const maxX = Math.max(...sorted.map(box => next.boxes[box.id].x + width(box)));
    const minY = Math.min(...sorted.map(box => next.boxes[box.id].y));
    const maxY = Math.max(...sorted.map(box => next.boxes[box.id].y + height(box)));
    const snap = (value: number) => Math.round(value / 16) * 16;
    const targets = new Map(sorted.map(box => [box.id, { x: next.boxes[box.id].x, y: next.boxes[box.id].y }]));
    const vertical = action === 'distribute-vertical';
    if (action === 'distribute-horizontal' || vertical) {
      if (sorted.length < 3) return;
      const axis = vertical ? 'y' : 'x';
      const size = vertical ? height : width;
      const ordered = [...sorted].sort((a, b) => targets.get(a.id)![axis] - targets.get(b.id)![axis]);
      const first = targets.get(ordered[0].id)![axis];
      const last = targets.get(ordered.at(-1)!.id)![axis] + size(ordered.at(-1)!);
      const gap = (last - first - ordered.reduce((total, box) => total + size(box), 0)) / (ordered.length - 1);
      let position = first + size(ordered[0]) + gap;
      for (const box of ordered.slice(1, -1)) { targets.get(box.id)![axis] = position; position += size(box) + gap; }
    } else {
      for (const box of sorted) {
        const target = targets.get(box.id)!;
        if (action === 'left') target.x = minX;
        if (action === 'center') target.x = snap((minX + maxX) / 2) - width(box) / 2;
        if (action === 'right') target.x = maxX - width(box);
        if (action === 'top') target.y = minY;
        if (action === 'middle') target.y = snap((minY + maxY) / 2) - height(box) / 2;
        if (action === 'bottom') target.y = maxY - height(box);
      }
      if (action === 'middle' || action === 'center') {
        const axis = action === 'middle' ? 'x' : 'y';
        const size = action === 'middle' ? width : height;
        const ordered = [...sorted].sort((a, b) => targets.get(a.id)![axis] - targets.get(b.id)![axis]);
        for (let index = 1; index < ordered.length; index++) {
          const previous = ordered[index - 1], box = ordered[index];
          const minimum = targets.get(previous.id)![axis] + size(previous) + 48;
          const target = targets.get(box.id)!;
          if (target[axis] < minimum) target[axis] += snap(minimum - target[axis] + 8);
        }
      }
    }
    for (const box of sorted) {
      const position = next.boxes[box.id], target = targets.get(box.id)!;
      const dx = target.x - position.x, dy = target.y - position.y;
      const group = new Set([box.id]);
      for (let changed = true; changed;) { changed = false; for (const candidate of this.projection.boxes) if (candidate.parentId && group.has(candidate.parentId) && !group.has(candidate.id)) { group.add(candidate.id); changed = true; } }
      for (const id of group) next.boxes[id] = { ...next.boxes[id], x: next.boxes[id].x + dx, y: next.boxes[id].y + dy };
    }
    if (emit(this, "move-request", { boxId: sorted[0].id, position: next.boxes[sorted[0].id], boxIds: sorted.map(box => box.id), positions: next.boxes })) this.commitLayout(next);
  }
  makeSection(title = 'New section'): void {
    if (this.locked || this.selectedBoxes.length < 2) return;
    const positions = this.selectedBoxes.map(box => this.layoutValue.boxes[box.id]);
    const x = Math.min(...positions.map(position => position.x)) - 24;
    const y = Math.min(...positions.map(position => position.y)) - 48;
    const right = Math.max(...positions.map(position => position.x + (position.width ?? 224))) + 24;
    const bottom = Math.max(...positions.map(position => position.y + (position.height ?? 64))) + 24;
    const id = `section-${++this.sectionSequence}`;
    this.setSection({ id, title, x, y, width: right - x, height: bottom - y });
  }
  protected setupListeners(): void {
    this.shadowRoot!.addEventListener(
      "click",
      (event) => {
        const command = (
          event.target as HTMLElement
        ).closest<HTMLButtonElement>("button")?.dataset.command;
        if (command === "zoom-in") this.zoomBy(1.2);
        else if (command === "zoom-out") this.zoomBy(1 / 1.2);
        else if (command === "reset") this.zoomBy(1 / this.viewport.zoom);
        else if (command === "fit") this.fit();
        else if (command === "tidy") this.tidy();
        else if (command === "undo") this.undo();
        else if (command === "redo") this.redo();
        else if (command === "snap") this.snapToGrid = !this.snapToGrid;
        else if (command === "lock") this.locked = !this.locked;
        else if (command === "connect" && this.selected && !this.locked && !this.disableConnections) {
          this.connecting = this.selected.id;
          this.setStatus(
            `Select the next box to connect from ${this.selected.title}`,
          );
        } else if (command === "delete" && this.selected)
          this.selectionCommand("delete-many");
      },
    );
    this.shadowRoot!.querySelector("[part=search]")!.addEventListener(
      "input",
      () => this.renderPalette(),
    );
    const canvas =
      this.shadowRoot!.querySelector<HTMLElement>("[part=canvas]")!;
    this.shadowRoot!.addEventListener("keydown", event => {
      if ((event as KeyboardEvent).key !== "Escape") return;
      const menu = this.shadowRoot!.querySelector<HTMLDetailsElement>('[part=view-menu]');
      if (!menu?.open) return;
      menu.open = false;
      menu.querySelector<HTMLElement>("summary")?.focus();
      event.preventDefault();
      event.stopPropagation();
    }, true);
    canvas.addEventListener("keydown", (event) => this.onKey(event));
    canvas.addEventListener('keyup', event => { if (event.key === ' ') this.spacePressed = false; });
    canvas.addEventListener('blur', () => { this.spacePressed = false; }, true);
    canvas.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        if (event.ctrlKey || event.metaKey) {
          const delta = -event.deltaY * (event.deltaMode === 1 ? .05 : event.deltaMode ? 1 : .002)
            * (event.ctrlKey && !event.metaKey && Math.abs(event.deltaY) < 50 ? 10 : 1);
          const rect = canvas.getBoundingClientRect();
          this.zoomAround(2 ** Math.max(-1, Math.min(1, delta)), event.clientX - rect.left, event.clientY - rect.top);
        } else {
          const multiplier = event.deltaMode === 1 ? 20 : 1;
          let dx = event.deltaX * multiplier, dy = event.deltaY * multiplier;
          if (event.shiftKey && !dx) { dx = dy; dy = 0; }
          this.viewport.x -= dx;
          this.viewport.y -= dy;
          this.paintViewport();
        }
      },
      { passive: false },
    );
    canvas.addEventListener("pointerdown", (event) => this.pointerDown(event));
    canvas.addEventListener("pointermove", (event) => this.pointerMove(event));
    canvas.addEventListener("pointerup", (event) =>
      this.pointerEnd(event, true),
    );
    canvas.addEventListener("pointercancel", (event) =>
      this.pointerEnd(event, false),
    );
    canvas.addEventListener("lostpointercapture", event => {
      // Touch transfers implicit box capture to the canvas during a drag.
      if (event.target === canvas) this.pointerEnd(event, false);
    });
    canvas.addEventListener("gesturestart", (event) => {
      event.preventDefault();
      this.gestureZoom = this.viewport.zoom;
    });
    canvas.addEventListener("gesturechange", (event) => {
      event.preventDefault();
      const scale = (event as Event & { scale: number }).scale;
      if (scale > 0 && this.pointers.size < 2) {
        const gesture = event as Event & { clientX: number; clientY: number };
        const rect = canvas.getBoundingClientRect();
        this.zoomAround((this.gestureZoom * scale) / this.viewport.zoom,
          Number.isFinite(gesture.clientX) ? gesture.clientX - rect.left : canvas.clientWidth / 2,
          Number.isFinite(gesture.clientY) ? gesture.clientY - rect.top : canvas.clientHeight / 2);
      }
    });
    const minimap =
      this.shadowRoot!.querySelector<SVGSVGElement>("[part=minimap]")!;
    minimap.setAttribute("tabindex", "0");
    minimap.setAttribute("role", "button");
    minimap.setAttribute(
      "aria-label",
      "Diagram overview. Arrow keys pan; Enter fits the whole process",
    );
    minimap.addEventListener("keydown", (event) => {
      const key = event as KeyboardEvent;
      key.stopPropagation();
      if (key.key === "Enter" || key.key === " ") {
        key.preventDefault();
        this.fit();
        return;
      }
      const direction = {
        ArrowLeft: [100, 0],
        ArrowRight: [-100, 0],
        ArrowUp: [0, 100],
        ArrowDown: [0, -100],
      }[key.key];
      if (direction) {
        key.preventDefault();
        this.viewport.x += direction[0];
        this.viewport.y += direction[1];
        this.paintViewport();
      }
    });
    minimap.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      const rect = minimap.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const bounds = this.minimapBounds(canvas);
      this.viewport.x =
        canvas.clientWidth / 2 -
        (bounds.x + ((event.clientX - rect.left) / rect.width) * bounds.width) *
          this.viewport.zoom;
      this.viewport.y =
        canvas.clientHeight / 2 -
        (bounds.y +
          ((event.clientY - rect.top) / rect.height) * bounds.height) *
          this.viewport.zoom;
      this.paintViewport();
    });
  }
  private onKey(event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    const target = event.target as HTMLElement;
    if (target.closest("input,textarea,select,[contenteditable],button,summary")) return;
    if (event.key === ' ') { event.preventDefault(); this.spacePressed = true; return; }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      if (this.locked || !(event.shiftKey ? this.history.canRedo : this.history.canUndo)) return;
      event.preventDefault();
      if (event.shiftKey) this.redo();
      else this.undo();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
      event.preventDefault(); this.selectMany(this.projection.boxes.map(box => box.id)); this.setStatus(`${this.projection.boxes.length} steps selected`); return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c' && this.selectedIds.size) {
      event.preventDefault(); this.clipboardIds = [...this.selectedIds]; this.setStatus(`${this.clipboardIds.length} steps copied`); return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v' && this.clipboardIds.length && !this.locked) {
      event.preventDefault(); this.clipboardIds.forEach((id, index) => { const position = this.layoutValue.boxes[id]; if (position) this.requestEdit({ type: 'duplicate', sourceId: id, position: { x: position.x + 32 * (index + 1), y: position.y + 32 * (index + 1) } }); }); return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd' && this.selectedIds.size && !this.locked) {
      event.preventDefault(); [...this.selectedIds].forEach(id => { const position = this.layoutValue.boxes[id]; this.requestEdit({ type: 'duplicate', sourceId: id, position: { x: position.x + 32, y: position.y + 32 } }); }); return;
    }
    if (event.key === "Escape") {
      const wasConnecting = Boolean(this.connecting || this.pendingReattach || this.portDrag || this.endDrag);
      this.connecting = null;
      this.pendingReattach = undefined;
      if (this.selectedLineId) this.selectLine(null);
      this.portDrag = undefined; this.marquee = undefined; this.segmentDrag = undefined; this.drag = undefined; this.pointers.clear(); this.refresh();
      if (wasConnecting) this.setStatus("Connecting cancelled");
      return;
    }
    if (event.shiftKey && (event.key === "1" || event.key === "!" || event.code === "Digit1")) {
      event.preventDefault(); this.fit(); this.setStatus("Whole process fitted to the canvas"); return;
    }
    const box = this.selected;
    if (this.selectedLine && (event.key === 'Delete' || event.key === 'Backspace') && !this.locked && !this.disableConnections) {
      event.preventDefault(); this.requestEdit({ type: 'disconnect', lineId: this.selectedLine.id }); return;
    }
    if ((event.key === "n" || event.key === "N") && box && !this.locked && this.catalog.length && !['finish', 'end'].includes(box.kind)) {
      event.preventDefault(); this.openKeyboardChooser(box); return;
    }
    const direction = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (direction && !event.ctrlKey && (event.altKey || !box || this.locked)) {
      event.preventDefault(); this.navigateSelection(direction); return;
    }
    if (!box || this.locked) return;
    if (event.key === "Enter") {
      event.preventDefault();
      this.activePane = "Outline"; this.renderPane();
      const editor = this.shadowRoot!.querySelector<HTMLElement>('[part=editor]')!;
      if (this.narrowValue) this.openDrawer('inspector');
      const field = editor.querySelector<HTMLElement>('input,select,textarea,button,[contenteditable]');
      if (field) field.focus();
      else { const heading = editor.querySelector<HTMLElement>('[part=inspector-heading]'); heading?.setAttribute('tabindex', '-1'); heading?.focus(); }
      return;
    }
    if (event.key.toLowerCase() === "c" && !this.disableConnections) {
      event.preventDefault();
      this.connecting = box.id;
      this.setStatus(`Select the next box to connect from ${box.title}`);
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      this.selectionCommand("delete-many");
    }
    if (direction) {
      event.preventDefault();
      if (event.ctrlKey && event.altKey && this.catalog.length && !this.disableConnections) {
        const side = direction[0] < 0 ? "west" : direction[0] > 0 ? "east" : direction[1] < 0 ? "north" : "south";
        const pos = this.layoutValue.boxes[box.id];
        const anchor = Array.from(this.shadowRoot!.querySelectorAll<HTMLElement>('[part=port]'))
          .find(element => element.dataset.owner === box.id && element.dataset.side === side);
        const returnFocus = Array.from(this.shadowRoot!.querySelectorAll<HTMLElement>('[data-box-id]'))
          .find(element => element.dataset.boxId === box.id);
        this.openAnchoredChooser(this.nextEdit(box, side, { x: pos.x + direction[0] * 320, y: pos.y + direction[1] * 170 }),
          this.nextChooserTitle(box, side), anchor, returnFocus);
        return;
      }
      const pos = this.layoutValue.boxes[box.id];
      const distance = event.shiftKey ? 64 : 16;
      this.move(
        box.id,
        pos.x + direction[0] * distance,
        pos.y + direction[1] * distance,
      );
      this.focusBox(box.id);
    }
  }
  private navigateSelection(direction: number[]): void {
    const canvas = this.shadowRoot!.querySelector<HTMLElement>('[part=canvas]')!;
    const box = this.selected;
    const origin = box ? this.layoutValue.boxes[box.id] : undefined;
    const originSize = box ? this.selectionDimensions(box) : undefined;
    const center = origin && originSize
      ? { x: origin.x + originSize.width / 2, y: origin.y + originSize.height / 2 }
      : { x: (canvas.clientWidth / 2 - this.viewport.x) / this.viewport.zoom, y: (canvas.clientHeight / 2 - this.viewport.y) / this.viewport.zoom };
    const candidates = this.projection.boxes.filter(candidate => candidate.id !== box?.id && candidate.kind !== 'section').map(candidate => {
      const position = this.layoutValue.boxes[candidate.id];
      const size = this.selectionDimensions(candidate);
      const dx = position.x + size.width / 2 - center.x;
      const dy = position.y + size.height / 2 - center.y;
      const forward = dx * direction[0] + dy * direction[1];
      const sideways = Math.abs(dx * direction[1] - dy * direction[0]);
      return { candidate, forward, score: forward + sideways * 2.5 };
    }).filter(item => item.forward > 4).sort((a, b) => a.score - b.score);
    const next = candidates[0]?.candidate;
    if (!next) { this.setStatus('Nothing further that way'); return; }
    this.select(next.id); this.revealBox(next); this.focusBox(next.id); this.setStatus(`${next.title} selected`);
  }
  private revealBox(box: ProcessBox<N>): void {
    const canvas = this.shadowRoot!.querySelector<HTMLElement>('[part=canvas]')!;
    if (!canvas.clientWidth || !canvas.clientHeight) return;
    const position = this.layoutValue.boxes[box.id]; const size = this.selectionDimensions(box);
    const left = position.x * this.viewport.zoom + this.viewport.x;
    const top = position.y * this.viewport.zoom + this.viewport.y;
    if (left > 48 && top > 48 && left + size.width * this.viewport.zoom < canvas.clientWidth - 48 && top + size.height * this.viewport.zoom < canvas.clientHeight - 48) return;
    this.setView({ x: canvas.clientWidth / 2 - (position.x + size.width / 2) * this.viewport.zoom,
      y: canvas.clientHeight / 2 - (position.y + size.height / 2) * this.viewport.zoom, zoom: this.viewport.zoom });
  }
  private pointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.suppressClick = false;
    if (this.portDrag || this.endDrag || this.segmentDrag || this.marquee || this.frameResize) return;
    const resize = (event.target as HTMLElement).closest<HTMLElement>('[part=frame-resize]');
    if (resize && !this.locked) {
      event.preventDefault(); event.stopPropagation();
      const id = resize.dataset.owner!; const position = this.layoutValue.boxes[id];
      this.frameResize = { pointerId: event.pointerId, id, start: this.canvasPoint(event), width: position.width ?? 224, height: position.height ?? 64 };
      this.shadowRoot!.querySelector<HTMLElement>('[part=canvas]')!.setPointerCapture?.(event.pointerId);
      return;
    }
    const grip = (event.target as HTMLElement).closest<HTMLElement>('[part=end-grip]');
    if (grip && !this.locked && !this.disableConnections) {
      event.preventDefault();
      const point = this.canvasPoint(event);
      this.endDrag = { pointerId: event.pointerId, lineId: grip.dataset.lineId!, end: grip.dataset.end as 'from' | 'to', start: point, point };
      this.shadowRoot!.querySelector<HTMLElement>('[part=canvas]')!.setPointerCapture?.(event.pointerId);
      return;
    }
    const control = (event.target as HTMLElement).closest<HTMLElement>("[part=port]");
    if (control && !this.locked && !this.disableConnections) {
      event.preventDefault();
      const point = this.canvasPoint(event);
      this.portDrag = { pointerId: event.pointerId, id: control.dataset.owner!, side: control.dataset.side as NonNullable<typeof this.portDrag>["side"], start: point, point };
      this.shadowRoot!.querySelector<HTMLElement>('[part=canvas]')!.setPointerCapture?.(event.pointerId);
      return;
    }
    const segment = (event.target as HTMLElement).closest<HTMLElement>("[data-segment]");
    if (segment && !this.locked) {
      const line = this.projection.lines.find(line => line.id === segment.dataset.lineId)!;
      this.selectLine(line.id);
      this.segmentDrag = { pointerId: event.pointerId, id: line.id, index: Number(segment.dataset.segment), points: routeProcessLine(line, this.layoutValue, this.projection) };
      this.shadowRoot!.querySelector<HTMLElement>('[part=canvas]')!.setPointerCapture?.(event.pointerId); event.preventDefault(); return;
    }
    if (
      event.button !== 0 ||
      (event.target as HTMLElement).closest("[part=connection],button,input,select,textarea,[contenteditable]")
    )
      return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 2) {
      this.drag = undefined;
      const [a, b] = [...this.pointers.values()];
      this.pinch = { distance: this.distance(), zoom: this.viewport.zoom,
        anchor: this.canvasPoint({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 }) };
      this.refresh();
      return;
    }
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-box-id]",
    );
    const id = target?.dataset.boxId;
    const canvas =
      this.shadowRoot!.querySelector<HTMLElement>("[part=canvas]")!;
    if (id && !this.spacePressed && !this.selectedIds.has(id) && !event.shiftKey) this.select(id);
    if (!id && event.shiftKey && !this.locked) { const point = this.canvasPoint(event); this.marquee = { pointerId: event.pointerId, start: point, point }; canvas.setPointerCapture?.(event.pointerId); event.preventDefault(); return; }
    this.drag = {
      id: this.locked || this.spacePressed ? undefined : id,
      x: event.clientX,
      y: event.clientY,
      position: id ? { ...this.layoutValue.boxes[id] } : undefined,
      panX: this.viewport.x,
      panY: this.viewport.y,
    };
  }
  private distance(): number {
    const [a, b] = [...this.pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }
  private pointerMove(event: PointerEvent): void {
    const gesture = this.portDrag ?? this.endDrag ?? this.segmentDrag ?? this.marquee ?? this.frameResize;
    if (gesture && gesture.pointerId !== event.pointerId) return;
    const point = this.canvasPoint(event);
    if (this.frameResize) {
      const resize = this.frameResize;
      const element = Array.from(this.shadowRoot!.querySelectorAll<HTMLElement>('[part=frame]')).find(frame => frame.dataset.boxId === resize.id);
      if (element) { element.style.width = `${Math.max(120, resize.width + point.x - resize.start.x)}px`; element.style.height = `${Math.max(64, resize.height + point.y - resize.start.y)}px`; }
      return;
    }
    if (this.portDrag) {
      this.portDrag.point = point;
      let ghost = this.shadowRoot!.querySelector<SVGPolylineElement>('[part=connection-preview]');
      if (!ghost) { ghost = svgElement("polyline"); ghost.setAttribute("part", "connection-preview"); this.shadowRoot!.querySelector('[part=lines]')!.append(ghost); }
      const start = this.portDrag.start; ghost.setAttribute("points", `${start.x},${start.y} ${point.x},${start.y} ${point.x},${point.y}`);
      const target = this.boxAt(point, this.portDrag.id);
      const pinned = target ? this.sideAt(target, point) : undefined;
      this.shadowRoot!.querySelectorAll<HTMLElement>('[data-box-id]').forEach(box => { box.dataset.connectTarget = String(box.dataset.boxId === target?.id); });
      this.shadowRoot!.querySelectorAll<HTMLElement>('[part=port]').forEach(port => { port.dataset.hot = String(port.dataset.owner === target?.id && port.dataset.side === pinned); });
      this.showConnectTooltip(point, target ? pinned ? `Pin to the ${pinned} of ${target.title}` : `Connect to ${target.title}` : 'Drop here to add a connected step');
      return;
    }
    if (this.endDrag) {
      this.endDrag.point = point;
      let ghost = this.shadowRoot!.querySelector<SVGPolylineElement>('[part=connection-preview]');
      if (!ghost) { ghost = svgElement('polyline'); ghost.setAttribute('part', 'connection-preview'); this.shadowRoot!.querySelector('[part=lines]')!.append(ghost); }
      const points = this.routedLines.get(this.endDrag.lineId);
      const fixed = this.endDrag.end === 'from' ? points?.at(-1) : points?.[0];
      if (fixed) ghost.setAttribute('points', `${fixed.x},${fixed.y} ${point.x},${fixed.y} ${point.x},${point.y}`);
      const target = this.boxAt(point);
      const pinned = target ? this.sideAt(target, point) : undefined;
      this.shadowRoot!.querySelectorAll<HTMLElement>('[data-box-id]').forEach(box => { box.dataset.connectTarget = String(box.dataset.boxId === target?.id); });
      this.shadowRoot!.querySelectorAll<HTMLElement>('[part=port]').forEach(port => { port.dataset.hot = String(port.dataset.owner === target?.id && port.dataset.side === pinned); });
      this.showConnectTooltip(point, target ? pinned ? `Pin to the ${pinned} of ${target.title}` : `Attach to ${target.title}` : 'Drop on a step to reattach', !target);
      this.setStatus(target ? `Release to attach the connection to ${target.title}` : 'Move over a step to attach this connection');
      return;
    }
    if (this.segmentDrag) {
      const { index, points } = this.segmentDrag;
      if (points[index].x === points[index + 1].x) points[index].x = points[index + 1].x = point.x;
      else points[index].y = points[index + 1].y = point.y;
      const path = Array.from(this.shadowRoot!.querySelectorAll<SVGPathElement>('[part=line]')).find(path => path.dataset.lineId === this.segmentDrag!.id);
      path?.setAttribute("d", roundedProcessPath(points)); return;
    }
    if (this.marquee) {
      this.marquee.point = point; let region = this.shadowRoot!.querySelector<HTMLElement>('[part=marquee]');
      if (!region) { region = document.createElement("div"); region.setAttribute("part", "marquee"); this.shadowRoot!.querySelector('[part=world]')!.append(region); }
      this.place(region, { x: Math.min(point.x, this.marquee.start.x), y: Math.min(point.y, this.marquee.start.y), width: Math.abs(point.x - this.marquee.start.x), height: Math.abs(point.y - this.marquee.start.y) }); return;
    }
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (this.pointers.size === 2) {
      const distance = this.distance();
      if (this.pinch?.distance) {
        const [a, b] = [...this.pointers.values()];
        const rect = this.shadowRoot!.querySelector('[part=canvas]')!.getBoundingClientRect();
        const zoom = Math.max(.25, Math.min(2, this.pinch.zoom * distance / this.pinch.distance));
        this.viewport = { zoom, x: (a.x + b.x) / 2 - rect.left - this.pinch.anchor.x * zoom,
          y: (a.y + b.y) / 2 - rect.top - this.pinch.anchor.y * zoom };
        this.paintViewport();
      }
      return;
    }
    if (!this.drag) return;
    const dx = event.clientX - this.drag.x;
    const dy = event.clientY - this.drag.y;
    if (Math.hypot(dx, dy) <= 4) return;
    this.shadowRoot!.querySelector<HTMLElement>('[part=canvas]')!.setPointerCapture?.(event.pointerId);
    if (this.drag.id && this.drag.position) {
      const element = Array.from(
        this.shadowRoot!.querySelectorAll<HTMLElement>("[data-box-id]"),
      ).find((box) => box.dataset.boxId === this.drag!.id);
      if (element) {
        this.drag.previewed = true;
        const position = this.alignedPoint(this.drag.id, this.drag.position.x + dx / this.viewport.zoom, this.drag.position.y + dy / this.viewport.zoom);
        const moved = this.selectedIds.size > 1 && this.selectedIds.has(this.drag.id)
          ? new Set(this.selectedIds) : new Set([this.drag.id]);
        for (let changed = true; changed;) {
          changed = false;
          for (const box of this.projection.boxes) {
            if (box.parentId && moved.has(box.parentId) && !moved.has(box.id)) {
              moved.add(box.id); changed = true;
            }
          }
        }
        const shiftX = position.x - this.drag.position.x, shiftY = position.y - this.drag.position.y;
        this.shadowRoot!.querySelectorAll<HTMLElement>('[data-box-id]').forEach(box => {
          const id = box.dataset.boxId!;
          if (!moved.has(id)) return;
          const original = this.layoutValue.boxes[id];
          box.style.left = `${original.x + shiftX}px`;
          box.style.top = `${original.y + shiftY}px`;
        });
        this.markDropLine(point, this.drag.id);
      }
    } else {
      this.viewport.x = this.drag.panX + dx;
      this.viewport.y = this.drag.panY + dy;
      this.paintViewport();
    }
  }
  private pointerEnd(event: PointerEvent, commit: boolean): void {
    const gesture = this.portDrag ?? this.endDrag ?? this.segmentDrag ?? this.marquee ?? this.frameResize;
    if (gesture && gesture.pointerId !== event.pointerId) return;
    const point = this.canvasPoint(event);
    if (this.frameResize) {
      const resize = this.frameResize; this.frameResize = undefined;
      if (commit) this.resize(resize.id, resize.width + point.x - resize.start.x, resize.height + point.y - resize.start.y);
      else this.refresh();
      return;
    }
    if (this.portDrag) {
      const port = this.portDrag; this.portDrag = undefined;
      this.shadowRoot!.querySelector('[part=connection-preview]')?.remove();
      this.shadowRoot!.querySelector('[part=connect-tooltip]')?.remove();
      this.shadowRoot!.querySelectorAll<HTMLElement>('[data-connect-target]').forEach(box => { delete box.dataset.connectTarget; });
      this.shadowRoot!.querySelectorAll<HTMLElement>('[part=port]').forEach(port => { delete port.dataset.hot; });
      if (commit) {
        if (Math.hypot(point.x - port.start.x, point.y - port.start.y) < 8) {
          const pos = this.layoutValue.boxes[port.id];
          const offsets = { east: [320, 0], west: [-320, 0], north: [0, -170], south: [0, 170] }[port.side];
          const source = this.projection.boxes.find(box => box.id === port.id)!;
          const anchor = Array.from(this.shadowRoot!.querySelectorAll<HTMLElement>('[part=port]'))
            .find(element => element.dataset.owner === port.id && element.dataset.side === port.side);
          this.openAnchoredChooser(this.nextEdit(source, port.side, { x: pos.x + offsets[0], y: pos.y + offsets[1] }),
            this.nextChooserTitle(source, port.side), anchor);
        } else {
          const target = this.boxAt(point, port.id);
          if (target) this.requestEdit({ type: "connect", from: port.id, to: target.id, fromSide: port.side, toSide: this.sideAt(target, point) });
          else {
            const source = this.projection.boxes.find(box => box.id === port.id)!;
            const frame = this.boxAt(point, undefined, true);
            if ((frame?.id ?? null) !== (source.parentId ?? null)) this.setStatus('Drop inside the same frame to add a connected step');
            else this.openChooserAtPoint({ type: 'add', from: port.id, fromSide: port.side, parentId: source.parentId, position: point },
              `Add after ${source.title}`, point);
          }
        }
      }
      return;
    }
    if (this.endDrag) {
      const drag = this.endDrag; this.endDrag = undefined;
      this.shadowRoot!.querySelector('[part=connection-preview]')?.remove();
      this.shadowRoot!.querySelector('[part=connect-tooltip]')?.remove();
      this.shadowRoot!.querySelectorAll<HTMLElement>('[data-connect-target]').forEach(box => { delete box.dataset.connectTarget; });
      this.shadowRoot!.querySelectorAll<HTMLElement>('[part=port]').forEach(port => { delete port.dataset.hot; });
      if (commit) {
        if (Math.hypot(point.x - drag.start.x, point.y - drag.start.y) < 8) { this.pendingReattach = { lineId: drag.lineId, end: drag.end }; this.setStatus('Select a step to reattach the connection'); }
        else { const target = this.boxAt(point); if (target) this.requestEdit({ type: 'reattach', lineId: drag.lineId, [drag.end]: target.id, [drag.end === 'from' ? 'fromSide' : 'toSide']: this.sideAt(target, point) }); else this.setStatus('Connection unchanged. Drop on a step to reattach.'); }
      }
      return;
    }
    if (this.segmentDrag) { const segment = this.segmentDrag; this.segmentDrag = undefined; if (commit) this.routeLine(segment.id, segment.points.slice(1, -1)); else this.refresh(); return; }
    if (this.marquee) {
      const { start } = this.marquee; this.marquee = undefined;
      if (commit) this.selectMany(this.projection.boxes.filter(box => { const p = this.layoutValue.boxes[box.id]; return p.x < Math.max(start.x, point.x) && p.x + (p.width ?? 224) > Math.min(start.x, point.x) && p.y < Math.max(start.y, point.y) && p.y + (p.height ?? 64) > Math.min(start.y, point.y); }).map(box => box.id));
      this.shadowRoot!.querySelector('[part=marquee]')?.remove(); this.pointers.delete(event.pointerId); return;
    }
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.delete(event.pointerId);
    const drag = this.drag;
    this.drag = undefined;
    this.pinch = undefined;
    if (drag?.id && drag.position) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (commit && Math.hypot(dx, dy) > 4) {
        this.suppressClick = true;
        const position = this.alignedPoint(drag.id, drag.position.x + dx / this.viewport.zoom, drag.position.y + dy / this.viewport.zoom);
        const line = this.lineAt(point, drag.id);
        const frame = this.boxAt(point, drag.id, true);
        if (line) this.requestEdit({ type: "insert", boxId: drag.id, lineId: line.id, from: line.from, to: line.to, position });
        else if (this.projection.boxes.find(box => box.id === drag.id)?.parentId !== frame?.id) this.requestEdit({ type: "reparent", boxId: drag.id, parentId: frame?.id, position });
        else if (this.selectedIds.size > 1 && this.selectedIds.has(drag.id)) {
          const next = this.layout; const dx = position.x - drag.position.x; const dy = position.y - drag.position.y;
          const moved = new Set(this.selectedIds);
          for (let changed = true; changed;) { changed = false; for (const box of this.projection.boxes) if (box.parentId && moved.has(box.parentId) && !moved.has(box.id)) { moved.add(box.id); changed = true; } }
          const primary = next.boxes[drag.id];
          const shiftX = this.snapToGrid ? Math.round((primary.x + dx) / 16) * 16 - primary.x : dx;
          const shiftY = this.snapToGrid ? Math.round((primary.y + dy) / 16) * 16 - primary.y : dy;
          for (const id of moved) next.boxes[id] = { ...next.boxes[id], x: next.boxes[id].x + shiftX, y: next.boxes[id].y + shiftY };
          if (emit(this, "move-request", { boxId: drag.id, position: next.boxes[drag.id], boxIds: [...moved], positions: next.boxes })) this.commitLayout(next);
        } else this.move(drag.id, position.x, position.y);
      }
      else if (!commit) this.refresh();
    }
    this.shadowRoot!.querySelectorAll('[part=guide],[part=measure]').forEach(element => element.remove());
    this.markDropLine(undefined);
    if (drag?.id && (drag.previewed || !commit || Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 4)) this.refresh();
  }
  private canvasPoint(event: { clientX: number; clientY: number }) {
    const rect = this.shadowRoot!.querySelector('[part=canvas]')!.getBoundingClientRect();
    return { x: (event.clientX - rect.left - this.viewport.x) / this.viewport.zoom, y: (event.clientY - rect.top - this.viewport.y) / this.viewport.zoom };
  }
  private boxAt(point: { x: number; y: number }, except?: string, frameOnly = false) {
    return [...this.projection.boxes].reverse().find(box => {
      if (box.id === except || (frameOnly && !box.frame)) return false;
      // A frame cannot be dropped inside its own descendants.
      let parent = box.parentId;
      while (parent) { if (parent === except) return false; parent = this.projection.boxes.find(b => b.id === parent)?.parentId; }
      const p = this.layoutValue.boxes[box.id]; return point.x >= p.x - 12 && point.x <= p.x + (p.width ?? 224) + 12 && point.y >= p.y - 12 && point.y <= p.y + (p.height ?? 64) + 12;
    });
  }
  private sideAt(box: ProcessBox<N>, point: { x: number; y: number }): ProcessSide | undefined {
    const p = this.layoutValue.boxes[box.id]; const width = p.width ?? 224; const height = p.height ?? 64;
    const sides: [ProcessSide, number, number][] = [['north', p.x + width / 2, p.y], ['east', p.x + width, p.y + height / 2], ['south', p.x + width / 2, p.y + height], ['west', p.x, p.y + height / 2]];
    return sides.find(([, x, y]) => Math.hypot(point.x - x, point.y - y) <= 12 / this.viewport.zoom)?.[0];
  }
  private lineAt(point: { x: number; y: number }, except?: string) {
    return this.projection.lines.find(line => line.from !== except && line.to !== except && nearProcessLine(point, this.routedLines.get(line.id) ?? [], 16 / this.viewport.zoom));
  }
  private markDropLine(point?: { x: number; y: number }, except?: string): void {
    this.dropLine = point ? this.lineAt(point, except)?.id : undefined;
    this.shadowRoot!.querySelectorAll<SVGElement>('[part=line]').forEach(path => { const active = path.dataset.lineId === this.dropLine; path.dataset.drop = String(active); path.setAttribute('marker-end', `url(#${active || path.dataset.selected === 'true' ? 'boe-process-arrow-brand' : 'boe-process-arrow'})`); });
  }
  private alignedPoint(id: string, x: number, y: number) {
    const world = this.shadowRoot!.querySelector('[part=world]')!;
    world.querySelectorAll('[part=guide],[part=measure]').forEach(element => element.remove());
    for (const box of this.projection.boxes) {
      if (box.id === id) continue;
      const p = this.layoutValue.boxes[box.id];
      for (const axis of ["x", "y"] as const) {
        const value = axis === "x" ? x : y;
        if (Math.abs(value - p[axis]) < 8 / this.viewport.zoom) {
          if (axis === "x") x = p.x; else y = p.y;
          const guide = document.createElement("div"); guide.setAttribute("part", "guide");
          guide.style.cssText = axis === "x" ? `left:${x}px;top:${Math.min(y, p.y)}px;width:1px;height:${Math.abs(y - p.y) + 64}px` : `left:${Math.min(x, p.x)}px;top:${y}px;height:1px;width:${Math.abs(x - p.x) + 224}px`; world.append(guide);
        }
      }
      if (Math.abs(y - p.y) < 8) {
        const distance = x - p.x - (p.width ?? 224);
        if (distance > 0) { const measure = document.createElement("span"); measure.setAttribute("part", "measure"); measure.textContent = `${Math.round(distance)}px`; measure.style.cssText = `left:${p.x + (p.width ?? 224)}px;top:${y + 40}px`; world.append(measure); }
      }
    }
    return { x, y };
  }
  private openChooser(edit: ProcessEdit): void {
    this.insertion = edit;
    const chooser = this.shadowRoot!.querySelector<HTMLDialogElement>('[part=insert-chooser]')!;
    this.shadowRoot!.querySelector('[part=ghost-box]')?.remove();
    if ('position' in edit && edit.position) {
      const ghost = document.createElement('div'); ghost.setAttribute('part', 'ghost-box'); ghost.textContent = edit.kind?.label ?? 'New step';
      this.place(ghost, { ...edit.position, width: 224, height: 64 }); this.shadowRoot!.querySelector('[part=world]')?.append(ghost);
    }
    chooser.addEventListener('close', () => this.shadowRoot?.querySelector('[part=ghost-box]')?.remove(), { once: true });
    const picker = chooser.querySelector<KindPicker>('box-kind-picker')!; picker.catalog = this.catalog.filter(kind => !kind.placement); picker.refresh(); promoteModal(chooser); picker.focus();
  }
  private nextEdit(box: ProcessBox<N>, side?: ProcessSide, position?: BoxPosition): ProcessEdit {
    const shape = box.shape ?? this.catalog.find(kind => kind.kind === box.kind)?.shape;
    const outgoing = this.projection.lines.filter(line => line.from === box.id);
    if ((!side || side === 'east') && shape !== 'gateway' && outgoing.length === 1)
      return { type: 'insert', lineId: outgoing[0].id, from: box.id, to: outgoing[0].to };
    return { type: 'add', from: box.id, ...(side ? { fromSide: side } : {}), parentId: box.parentId, ...(position ? { position } : {}) };
  }
  private nextChooserTitle(box: ProcessBox<N>, side?: ProcessSide): string {
    const edit = this.nextEdit(box, side);
    if (edit.type === 'insert') {
      const target = this.projection.boxes.find(candidate => candidate.id === edit.to);
      return `Insert between ${box.title} and ${target?.title ?? 'the next step'}`;
    }
    if (box.shape === 'gateway') return `Add a path from ${box.title}`;
    return side && side !== 'east' ? `Add ${ { north: 'above', south: 'below', west: 'before' }[side] } ${box.title}, connected` : `Add after ${box.title}`;
  }
  private openChooserAtPoint(edit: ProcessEdit, title: string, point: { x: number; y: number }, returnFocus?: HTMLElement): void {
    if (this.keyboardInsertion) this.closeKeyboardChooser();
    const anchor = document.createElement('span');
    anchor.style.cssText = `position:absolute;left:${point.x}px;top:${point.y}px;width:1px;height:1px;pointer-events:none`;
    this.shadowRoot!.querySelector('[part=world]')!.append(anchor);
    this.transientChooserAnchor = anchor;
    const source = edit.from ? Array.from(this.shadowRoot!.querySelectorAll<HTMLElement>('[data-box-id]')).find(box => box.dataset.boxId === edit.from) : undefined;
    this.openAnchoredChooser(edit, title, anchor, returnFocus ?? source ?? this.shadowRoot!.querySelector<HTMLElement>('[part=canvas]')!);
  }
  private openLineChooser(line: ProcessProjection<N>['lines'][number], returnFocus?: HTMLElement): void {
    const source = this.projection.boxes.find(box => box.id === line.from);
    const target = this.projection.boxes.find(box => box.id === line.to);
    const points = this.routedLines.get(line.id) ?? routeProcessLine(line, this.layoutValue, this.projection);
    this.openChooserAtPoint(
      { type: 'insert', lineId: line.id, from: line.from, to: line.to },
      `Insert between ${source?.title ?? line.from} and ${target?.title ?? line.to}`,
      lineMidpoint(points), returnFocus,
    );
  }
  private closeKeyboardChooser(returnFocus = false): void {
    const chooser = this.shadowRoot?.querySelector<HTMLElement>('[part=keyboard-chooser]');
    dismissPopover(chooser ?? null);
    this.stopKeyboardAnchor?.(); this.stopKeyboardAnchor = undefined;
    this.transientChooserAnchor?.remove(); this.transientChooserAnchor = undefined;
    document.removeEventListener('pointerdown', this.dismissKeyboardChooserOutside, true);
    this.keyboardInsertion = undefined;
    if (returnFocus) this.keyboardReturn?.focus({ preventScroll: true });
    this.keyboardReturn = undefined;
  }
  private dismissKeyboardChooserOutside = (event: PointerEvent): void => {
    const chooser = this.shadowRoot?.querySelector<HTMLElement>('[part=keyboard-chooser]');
    if (chooser && !event.composedPath().includes(chooser)) this.closeKeyboardChooser();
  };
  private openKeyboardChooser(box: ProcessBox<N>): void {
    const shape = box.shape ?? this.catalog.find(kind => kind.kind === box.kind)?.shape ?? (box.frame ? 'frame' : 'task');
    const outgoing = this.projection.lines.filter(line => line.from === box.id);
    const target = outgoing.length === 1 ? this.projection.boxes.find(candidate => candidate.id === outgoing[0].to) : undefined;
    const insert = shape !== 'gateway' && outgoing.length === 1 && target;
    const anchor = Array.from(this.shadowRoot!.querySelectorAll<HTMLElement>('[data-box-id]'))
      .find(element => element.dataset.boxId === box.id);
    this.openAnchoredChooser(insert
      ? { type: 'insert', lineId: outgoing[0].id, from: box.id, to: target.id }
      : { type: 'add', from: box.id },
    insert ? `Insert between ${box.title} and ${target.title}`
      : shape === 'gateway' ? `Add a path from ${box.title}` : `Add after ${box.title}`,
    anchor);
  }
  private openAnchoredChooser(edit: ProcessEdit, title: string, anchor?: HTMLElement, returnFocus?: HTMLElement): void {
    const chooser = this.shadowRoot!.querySelector<HTMLElement>('[part=keyboard-chooser]')!;
    if (this.keyboardInsertion) this.closeKeyboardChooser();
    this.keyboardInsertion = edit;
    chooser.querySelector<HTMLElement>('[part=chooser-title]')!.textContent = title;
    const picker = chooser.querySelector<KindPicker>('box-kind-picker')!;
    picker.catalog = this.catalog.filter(kind => !kind.placement);
    picker.refresh();
    this.keyboardReturn = returnFocus ?? anchor;
    if (!anchor || !promotePopover(chooser)) {
      const edit = this.keyboardInsertion;
      this.closeKeyboardChooser();
      if (edit) this.openChooser(edit);
      return;
    }
    this.stopKeyboardAnchor = trackAnchor(anchor, chooser, {
      placement: { side: 'right', align: 'start' }, offset: 8, padding: 12,
    });
    document.addEventListener('pointerdown', this.dismissKeyboardChooserOutside, true);
    picker.focus();
  }
  private addLayoutKind(kind: ProcessKind, point?: { x: number; y: number }): void {
    const canvas = this.shadowRoot!.querySelector<HTMLElement>('[part=canvas]')!;
    const position = point ?? { x: (canvas.clientWidth / 2 - this.viewport.x) / this.viewport.zoom, y: (canvas.clientHeight / 2 - this.viewport.y) / this.viewport.zoom };
    const id = `${kind.placement}-${++this.sectionSequence}`;
    if (kind.placement === 'note') this.setNote({ id, text: kind.label, x: position.x, y: position.y });
    if (kind.placement === 'section') this.setSection({ id, title: kind.label, description: '', x: position.x, y: position.y, width: 320, height: 240 });
  }
  private showConnectTooltip(point: { x: number; y: number }, message: string, invalid = false): void {
    const world = this.shadowRoot!.querySelector('[part=world]')!;
    let tooltip = world.querySelector<HTMLElement>('[part=connect-tooltip]');
    if (!tooltip) { tooltip = document.createElement('div'); tooltip.setAttribute('part', 'connect-tooltip'); world.append(tooltip); }
    tooltip.textContent = message; tooltip.dataset.invalid = String(invalid);
    tooltip.style.left = `${point.x + 16}px`; tooltip.style.top = `${point.y + 16}px`;
  }
  protected update(): void {
    const selectionBefore = JSON.stringify({ ids: [...this.selectedIds], path: this.selectedPath });
    if (this.documentValue !== undefined) {
      this.projection = this.model.project(this.documentValue);
      validateProjection(this.projection);
    } else this.projection = { boxes: [], lines: [] };
    this.layoutValue = this.arrangedLayout(this.layoutValue);
    this.routedLines = new Map(this.projection.lines.map(line => [line.id, routeProcessLine(line, this.layoutValue, this.projection)]));
    this.computedChecks = this.collectChecks();
    if (this.selectedId && !this.selected) this.selectedId = null;
    if (this.selectedLineId && !this.selectedLine) this.selectedLineId = null;
    this.selectedIds = new Set([...this.selectedIds].filter(id => this.projection.boxes.some(box => box.id === id)));
    if (!this.selectedId) this.selectedId = this.selectedIds.values().next().value ?? null;
    const serialized = JSON.stringify({
      boxes: this.projection.boxes.map(box => ({ id: box.id, kind: box.kind, title: box.title, description: box.description, path: box.path, fingerprint: box.fingerprint, frame: box.frame, loopMark: box.loopMark, parentId: box.parentId })),
      lines: this.projection.lines,
    });
    if (this.documentValue !== undefined && (serialized !== this.lastProjection || this.documentValue !== this.lastDocument)) {
      if (this.lastProjection) this.versionValue = typeof this.versionValue === "number" ? this.versionValue + 1 : `${this.versionValue}+1`;
      this.lastProjection = serialized;
      this.lastDocument = this.documentValue;
      emit(this, "projection-changed", { projection: snapshotProcessProjection(this.projection), version: this.versionValue, checks: this.allChecks });
    }
    // Riptide or another host owns conversion. It supplies validate() and
    // receives this event only when that conversion can read the drawing.
    if (this.allChecks.length) this.lastReadableProjection = "";
    const readableKey = JSON.stringify([this.versionValue, serialized]);
    if (this.documentValue !== undefined && !this.allChecks.length && readableKey !== this.lastReadableProjection) {
      this.lastReadableProjection = readableKey;
      this.readableValue = snapshotProcessProjection(this.projection);
      emit(this, "readable-projection-changed", { projection: snapshotProcessProjection(this.readableValue), version: this.versionValue });
    }
    if (this.documentValue === undefined) {
      this.lastProjection = "";
      this.lastReadableProjection = "";
      this.readableValue = null;
      this.lastDocument = undefined;
    }
    const focused = (this.shadowRoot!.activeElement as HTMLElement | null)
      ?.dataset.boxId;
    this.renderWorld();
    this.renderPalette();
    this.renderChecks();
    this.renderSelection();
    this.paintViewport();
    this.updateToolbar();
    if (selectionBefore !== JSON.stringify({ ids: [...this.selectedIds], path: this.selectedPath })) emit(this, "selection-changed", { box: this.selected, boxes: this.selectedBoxes, path: this.selectedPath });
    if (focused) {
      this.restoringBoxFocus = true;
      try { this.focusBox(focused); } finally { this.restoringBoxFocus = false; }
    }
  }
  private get allChecks(): readonly ProcessCheck[] { return this.computedChecks; }
  private collectChecks(): readonly ProcessCheck[] {
    const routes = this.projection.lines.filter(line => !this.routedLines.get(line.id)?.length)
      .map(line => ({ message: "A connection is blocked by overlapping steps. Move a step or adjust its route.", boxId: line.from }));
    const hostChecks = this.documentValue === undefined ? undefined : this.model.validate?.(this.documentValue, this.projection);
    return [...this.checks, ...(hostChecks ?? graphChecks(this.projection)), ...routes];
  }
  private renderWorld(): void {
    const world = this.shadowRoot!.querySelector<HTMLElement>("[part=world]")!;
    world.replaceChildren();
    for (const section of this.layoutValue.sections ?? []) {
      const element = document.createElement("div");
      element.setAttribute("part", "section");
      const title = document.createElement('strong'); title.textContent = section.title; element.append(title);
      if (section.description) { const description = document.createElement('small'); description.textContent = section.description; element.append(description); }
      this.place(element, section);
      world.append(element);
    }
    for (const box of [...this.projection.boxes].sort(
      (a, b) => Number(Boolean(b.frame)) - Number(Boolean(a.frame)),
    )) {
      const element = document.createElement("div");
      element.tabIndex = 0;
      element.addEventListener('focus', () => {
        if (!this.restoringBoxFocus && !this.pointers.size && !this.portDrag && !this.endDrag && !this.segmentDrag && !this.marquee && !this.frameResize) { this.select(box.id); if (box.kind !== 'section') this.revealBox(box); }
      });
      element.setAttribute("role", "group");
      element.setAttribute("part", box.frame ? "frame" : "box");
      element.dataset.boxId = box.id;
      const kind = this.catalog.find((entry) => entry.kind === box.kind);
      const shape = box.shape ?? kind?.shape ?? (box.frame ? "frame" : "task");
      element.dataset.shape = shape;
      element.dataset.kind = box.kind;
      element.dataset.tone = kind?.tone === "accent" ? "accent" : "neutral";
      const problem = this.allChecks.find(check => check.boxId === box.id || (check.path && JSON.stringify(check.path) === JSON.stringify(box.path)));
      const incoming = this.projection.lines.filter(line => line.to === box.id).length;
      const outgoing = this.projection.lines.filter(line => line.from === box.id).length;
      element.setAttribute(
        "aria-label",
        [`${kind?.label ?? box.kind}: ${box.title}. ${incoming} in, ${outgoing} out`, problem ? `Needs attention: ${problem.message}` : ""]
          .filter(Boolean)
          .join(". "),
      );
      element.setAttribute("aria-current", String(this.selectedIds.has(box.id)));
      this.place(element, this.layoutValue.boxes[box.id]);
      const icon = document.createElement("span"); icon.setAttribute("part", "icon"); icon.setAttribute("aria-hidden", "true");
      if (kind?.icon) {
        icon.append(kind.icon());
      }
      element.append(icon);
      const title = document.createElement("strong");
      title.textContent = box.title;
      element.append(title);
      let descriptionParent: HTMLElement = element;
      if (shape === 'event' && this.detailValue === 'technical' && box.technicalDetails?.length) {
        const details = document.createElement('div'); details.setAttribute('part', 'event-details');
        element.append(details); descriptionParent = details;
      }
      if (shape === 'gateway' && this.detailValue === 'technical' && box.technicalDetails?.length) {
        const caption = document.createElement('div'); caption.setAttribute('part', 'caption');
        const position = this.layoutValue.boxes[box.id];
        let topUsed = false, bottomUsed = false;
        for (const line of this.projection.lines) {
          const points = this.routedLines.get(line.id);
          const end = line.from === box.id ? points?.[0] : line.to === box.id ? points?.at(-1) : undefined;
          if (!end) continue;
          if (Math.abs(end.y - position.y) < .01) topUsed = true;
          if (Math.abs(end.y - (position.y + 56)) < .01) bottomUsed = true;
        }
        caption.dataset.side = bottomUsed && !topUsed ? 'above' : 'below';
        caption.append(title); element.append(caption); descriptionParent = caption;
      }
      if (shape === 'task' && box.technicalDetails) icon.style.gridRow = 'span 4';
      if (this.detailValue === "technical" && box.technicalDetails) {
        for (const line of box.technicalDetails) {
          if (!line.text && !line.segments?.length) continue;
          const description = document.createElement("small");
          if (line.segments) {
            for (const segment of line.segments) {
              if (segment.format === "code") {
                const code = document.createElement("span");
                code.setAttribute("part", "technical-inline-code");
                code.textContent = segment.text;
                description.append(code);
              } else description.append(document.createTextNode(segment.text));
            }
          } else description.textContent = line.text;
          description.setAttribute("part", line.format === "code" ? "technical-description" : "technical-summary");
          descriptionParent.append(description);
        }
      } else {
        const descriptionText = this.detailValue === "technical" ? box.technicalDescription ?? box.description : box.description;
        if (descriptionText) {
          const description = document.createElement("small");
          description.textContent = descriptionText;
          if (this.detailValue === "technical") description.setAttribute("part", "technical-description");
          descriptionParent.append(description);
        }
      }
      if (box.frame && box.loopMark) {
        const loop = document.createElement('span'); loop.setAttribute('part', 'loop-mark'); loop.setAttribute('aria-hidden', 'true'); loop.textContent = '↻'; element.append(loop);
      }
      const metrics = this.showLastRunValue ? this.lastRunValue?.steps[box.id] : undefined;
      if (this.showLastRunValue && this.lastRunValue && shape === 'task' && box.runMetrics !== false) {
        const line = document.createElement("span"); line.setAttribute("part", "metrics");
        if (!metrics || metrics.notInRun) {
          line.dataset.state = 'unmeasured'; line.textContent = "Not in the last run";
        } else {
          const parts: HTMLElement[] = [];
          const add = (text: string, warning = false) => { const part = document.createElement('span'); part.textContent = text; if (warning) part.setAttribute('part', 'metric-warning'); parts.push(part); };
          if (metrics.callsPerSecond !== undefined) add(`${metrics.callsPerSecond.toFixed(1)}/s`);
          if (metrics.p95Ms !== undefined) add(`p95 ${formatRunDuration(metrics.p95Ms)}`);
          if (metrics.failedShare !== undefined && metrics.failedShare > 0) add(`${formatFailedShare(metrics.failedShare)} failed`, true);
          for (const [index, part] of parts.entries()) {
            if (index) { const separator = document.createElement('span'); separator.setAttribute('part', 'metric-separator'); separator.textContent = '·'; line.append(document.createTextNode(' '), separator, document.createTextNode(' ')); }
            line.append(part);
          }
        }
        element.append(line);
      }
      if (problem) { const message = document.createElement("span"); message.setAttribute("part", "problem"); message.append(checkGlyph(), document.createTextNode(problem.title ?? problem.message)); element.append(message); }
      element.addEventListener("keydown", event => {
        if (event.target !== element) return;
        // Space reaches the canvas handler so holding it pans from a focused step.
        // Let Enter reach the canvas handler after selecting the focused step.
        // Cancelling it here prevents the editor from opening and taking focus.
        if (event.key === "Enter") {
          // Connection completion consumes Enter; it must not also edit the target.
          if (this.connecting || this.pendingReattach) event.preventDefault();
          element.click();
        }
      });
      element.addEventListener("click", event => {
        if (this.suppressClick && event.detail !== 0) { this.suppressClick = false; return; }
        if (this.pendingReattach) {
          const pending = this.pendingReattach; this.pendingReattach = undefined;
          this.requestEdit({ type: 'reattach', lineId: pending.lineId, [pending.end]: box.id });
          return;
        }
        if (this.connecting && this.connecting !== box.id) {
          this.requestEdit({
            type: "connect",
            from: this.connecting,
            to: box.id,
          });
          this.connecting = null;
        }
        if (event.shiftKey) this.selectMany(this.selectedIds.has(box.id) ? [...this.selectedIds].filter(id => id !== box.id) : [...this.selectedIds, box.id]);
        else this.select(box.id);
      });
      if (!this.disableConnections && !this.locked && !['end', 'finish'].includes(box.kind)) {
        for (const side of ["north", "east", "south", "west"] as const) {
          const port = document.createElement("button"); port.type = "button"; port.tabIndex = -1; port.setAttribute("part", "port"); port.dataset.side = side; port.dataset.owner = box.id;
          port.setAttribute("aria-label", `Add or connect a step ${side} of ${box.title}`);
          port.addEventListener("click", event => {
            event.stopPropagation();
            if (!event.detail) {
              const pos = this.layoutValue.boxes[box.id]; const offsets = { east: [320, 0], west: [-320, 0], north: [0, -170], south: [0, 170] }[side];
              this.openAnchoredChooser(this.nextEdit(box, side, { x: pos.x + offsets[0], y: pos.y + offsets[1] }),
                this.nextChooserTitle(box, side), port);
            }
          });
          element.append(port);
        }
      }
      if (box.frame && !this.locked) {
        const handle = document.createElement('button'); handle.type = 'button'; handle.setAttribute('part', 'frame-resize');
        handle.dataset.owner = box.id; handle.setAttribute('aria-label', `Resize ${box.title}`);
        handle.addEventListener('keydown', event => {
          const delta = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[event.key];
          if (!delta) return; event.preventDefault(); event.stopPropagation();
          const current = this.layoutValue.boxes[box.id]; this.resize(box.id, (current.width ?? 224) + delta[0], (current.height ?? 64) + delta[1]);
          Array.from(this.shadowRoot!.querySelectorAll<HTMLElement>('[part=frame-resize]')).find(handle => handle.dataset.owner === box.id)?.focus();
        });
        element.append(handle);
      }
      world.append(element);
    }
    const lines = svgElement("svg");
    lines.setAttribute("part", "lines");
    lines.setAttribute("aria-hidden", "true");
    const defs = svgElement('defs');
    for (const [id, fill] of [['boe-process-arrow', 'var(--boe-token-text-text-secondary, #6f6f6f)'], ['boe-process-arrow-brand', 'var(--boe-token-surface-surface-brand, #0061d5)']] as const) {
      const marker = svgElement('marker'); marker.id = id; marker.setAttribute('viewBox', '0 0 8 8'); marker.setAttribute('refX', '7'); marker.setAttribute('refY', '4'); marker.setAttribute('markerWidth', '8'); marker.setAttribute('markerHeight', '8'); marker.setAttribute('orient', 'auto');
      const arrow = svgElement('path'); arrow.setAttribute('d', 'M 0 0 L 8 4 L 0 8 Z'); arrow.setAttribute('fill', fill); marker.append(arrow); defs.append(marker);
    }
    lines.append(defs);
    world.append(lines);
    for (const line of this.projection.lines) {
      const points = this.routedLines.get(line.id)!;
      if (!points.length) continue;
      const midpoint = lineMidpoint(points);
      const path = svgElement("path");
      path.setAttribute("part", "line");
      path.dataset.lineId = line.id;
      path.dataset.selected = String(this.selectedLineId === line.id);
      path.setAttribute('marker-end', `url(#${this.selectedLineId === line.id ? 'boe-process-arrow-brand' : 'boe-process-arrow'})`);
      path.setAttribute("vector-effect", "non-scaling-stroke");
      path.setAttribute("d", roundedProcessPath(points));
      if (line.dashed) path.setAttribute("stroke-dasharray", "6 4");
      if (this.showLastRunValue && line.share !== undefined) { path.style.strokeWidth = `${Math.round((1.5 + Math.max(0, Math.min(1, line.share)) * 2.5) * 100) / 100}px`; path.setAttribute('aria-label', `${Math.round(line.share * 100)}% of last-run traffic`); }
      lines.append(path);
      for (const point of [line.fromSide ? points[0] : null, line.toSide ? points.at(-1) : null]) {
        if (!point) continue;
        const pin = svgElement('circle'); pin.setAttribute('part', 'pinned-end'); pin.setAttribute('cx', String(point.x)); pin.setAttribute('cy', String(point.y)); pin.setAttribute('r', '3'); lines.append(pin);
      }
      for (let i = 1; i < points.length - 2; i++) {
        const hit = svgElement("polyline"); hit.setAttribute("part", "line-hit"); hit.dataset.lineId = line.id; hit.dataset.segment = String(i);
        hit.setAttribute("vector-effect", "non-scaling-stroke");
        hit.setAttribute("points", `${points[i].x},${points[i].y} ${points[i + 1].x},${points[i + 1].y}`); lines.append(hit);
      }
      const label = document.createElement("div");
      label.setAttribute("part", "connection");
      label.setAttribute('role', 'group'); label.tabIndex = 0;
      label.style.left = `${midpoint.x}px`;
      label.style.top = `${midpoint.y}px`;
      const names = `${this.projection.boxes.find((box) => box.id === line.from)!.title} to ${this.projection.boxes.find((box) => box.id === line.to)!.title}${line.label ? `, ${line.label}` : ""}`;
      label.setAttribute('aria-label', `Connection: ${names}${this.showLastRunValue && line.share !== undefined ? `. ${Math.round(line.share * 100)}% of last-run traffic` : ''}`);
      label.addEventListener('click', event => { if ((event.target as HTMLElement).closest('button')) return; this.selectLine(line.id); });
      label.addEventListener('keydown', event => { if (event.target === label && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); this.selectLine(line.id); } });
      const text = document.createElement("span");
      const source = this.projection.boxes.find(box => box.id === line.from)!;
      const branchIndex = this.projection.lines.filter(candidate => candidate.from === line.from).indexOf(line);
      text.textContent = line.label ?? (line.weight !== undefined ? String(line.weight) : /decision/i.test(source.kind) ? ["Yes", "No"][branchIndex] ?? `Route ${branchIndex + 1}` : /try/i.test(source.kind) && line.dashed ? "If it fails" : "");
      label.append(text);
      if (this.showLastRunValue && line.share !== undefined) {
        const share = document.createElement('small'); share.textContent = `${Math.round(line.share * 100)}%`; label.append(share);
      }
      const actions = document.createElement("div"); actions.setAttribute("part", "connection-actions"); label.append(actions);
      if (points.length >= 4 && !this.locked) {
        const adjust = document.createElement("button"); adjust.type = "button"; adjust.textContent = "Route";
        adjust.dataset.segment = "1"; adjust.dataset.lineId = line.id;
        adjust.setAttribute("aria-label", `Adjust route: ${names}. Use arrow keys`);
        adjust.onkeydown = event => {
          const direction = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, -10], ArrowDown: [0, 10] }[event.key];
          if (!direction) return; event.preventDefault(); event.stopPropagation();
          const current = routeProcessLine(line, this.layoutValue, this.projection);
          const vertical = current[1].x === current[2].x;
          for (const point of [current[1], current[2]]) { if (vertical) point.x += direction[0]; else point.y += direction[1]; }
          this.routeLine(line.id, current.slice(1, -1));
          Array.from(this.shadowRoot!.querySelectorAll<HTMLButtonElement>('[data-segment]')).find(button => button.dataset.lineId === line.id)?.focus();
        };
        actions.append(adjust);
      }
      for (const [type, title] of [
        ["insert", "Insert a step here"],
        ["disconnect", "Remove connection"],
      ] as const) {
        if (type === "disconnect" && this.disableConnections) continue;
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = type === "insert" ? "+" : "Remove";
        button.setAttribute("aria-label", `${title}: ${names}`);
        button.disabled = this.locked;
        button.addEventListener("click", () => {
          const edit: ProcessEdit = {
            type,
            lineId: line.id,
            from: line.from,
            to: line.to,
          };
          if (type === "insert" && this.catalog.length) {
            this.openLineChooser(line, button);
          } else this.requestEdit(edit);
        });
        actions.append(button);
      }
      world.append(label);
      if (this.selectedLineId === line.id && !this.locked && !this.disableConnections) {
        for (const [end, point] of [['from', points[0]], ['to', points.at(-1)!]] as const) {
          const grip = document.createElement('button'); grip.type = 'button'; grip.setAttribute('part', 'end-grip'); grip.dataset.lineId = line.id; grip.dataset.end = end; grip.style.left = `${point.x - 12}px`; grip.style.top = `${point.y - 12}px`;
          grip.setAttribute('aria-label', `Reattach ${end === 'from' ? 'start' : 'end'} of connection: ${names}`);
          grip.addEventListener('click', event => { event.stopPropagation(); this.pendingReattach = { lineId: line.id, end }; this.setStatus('Select a step to reattach the connection'); });
          world.append(grip);
        }
      }
    }
    for (const note of this.layoutValue.notes ?? []) {
      const element = document.createElement("div");
      element.setAttribute("part", "note");
      element.textContent = note.text;
    this.place(element, { ...note, width: 208, height: 80 });
      world.append(element);
    }
  }
  private place(element: HTMLElement, position: BoxPosition): void {
    Object.assign(element.style, {
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${position.width ?? 224}px`,
      height: `${position.height ?? 64}px`,
    });
  }
  private renderPalette(): void {
    const choices =
      this.shadowRoot!.querySelector<HTMLElement>("[part=choices]")!;
    const query =
      this.shadowRoot!.querySelector<HTMLInputElement>(
        "[part=search]",
      )!.value.toLowerCase();
    choices.replaceChildren();
    let group = "";
    for (const kind of this.catalog.filter((kind) =>
      `${kind.label} ${kind.description} ${kind.group ?? ""} ${(kind.aliases ?? []).join(" ")}`
        .toLowerCase()
        .includes(query),
    )) {
      if (kind.group && kind.group !== group) {
        group = kind.group;
        const heading = document.createElement("p");
        heading.setAttribute("part", "group");
        heading.textContent = group;
        choices.append(heading);
      }
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("part", "choice");
      button.dataset.tone = kind.tone === "accent" ? "accent" : "neutral";
      const icon = document.createElement("span"); icon.setAttribute("part", "choice-icon"); icon.setAttribute("aria-hidden", "true"); if (kind.icon) icon.append(kind.icon());
      const name = document.createElement("span"); name.setAttribute("part", "choice-name"); name.textContent = kind.label;
      const description = document.createElement("span"); description.setAttribute("part", "choice-description"); description.textContent = kind.description;
      button.append(icon, name, description);
      button.disabled = this.locked;
      button.draggable = !this.locked;
      button.addEventListener("click", () => {
        if (kind.placement) { this.addLayoutKind(kind); return; }
        const from = this.selectedId;
        const outgoing = from ? this.projection.lines.filter(line => line.from === from) : [];
        const line = outgoing.length === 1 ? outgoing[0] : undefined;
        this.requestEdit(line ? { type: "insert", kind, lineId: line.id, from: line.from, to: line.to } : { type: "add", kind, ...(from ? { from } : {}) });
      });
      button.addEventListener("dragstart", event => { this.paletteDragKind = kind; event.dataTransfer?.setData("application/boe-process-kind", kind.kind); });
      button.addEventListener("dragend", () => { this.paletteDragKind = null; this.shadowRoot?.querySelector('[part=palette-ghost]')?.remove(); this.markDropLine(undefined); });
      choices.append(button);
    }
    const canvas =
      this.shadowRoot!.querySelector<HTMLElement>("[part=canvas]")!;
    canvas.ondragover = (event) => {
      if (!this.locked) {
        event.preventDefault(); const point = this.canvasPoint(event); this.markDropLine(point);
        if (this.paletteDragKind) {
          let ghost = this.shadowRoot!.querySelector<HTMLElement>('[part=palette-ghost]');
          if (!ghost) { ghost = document.createElement('div'); ghost.setAttribute('part', 'palette-ghost'); this.shadowRoot!.querySelector('[part=world]')!.append(ghost); }
          ghost.textContent = this.paletteDragKind.label;
          this.place(ghost, { x: point.x - 112, y: point.y - 32, width: 224, height: 64 });
        }
      }
    };
    canvas.ondragleave = () => { this.markDropLine(undefined); this.shadowRoot!.querySelector('[part=palette-ghost]')?.remove(); };
    canvas.ondrop = (event) => {
      event.preventDefault();
      this.shadowRoot!.querySelector('[part=palette-ghost]')?.remove(); this.paletteDragKind = null;
      const kind = this.catalog.find(
        (kind) =>
          kind.kind ===
          event.dataTransfer?.getData("application/boe-process-kind"),
      );
      if (!kind || this.locked) return;
      const position = this.canvasPoint(event);
      if (kind.placement) { this.addLayoutKind(kind, position); this.markDropLine(undefined); return; }
      const line = this.lineAt(position);
      const frame = this.boxAt(position, undefined, true);
      this.requestEdit({
        type: line ? "insert" : "add",
        kind,
        lineId: line?.id, from: line?.from, to: line?.to, parentId: frame?.id,
        position,
      });
      this.markDropLine(undefined);
    };
  }
  private renderChecks(): void {
    const checks = this.shadowRoot!.querySelector("[part=checks]")!;
    checks.replaceChildren();
    if (!this.allChecks.length) { const message = document.createElement('p'); message.setAttribute('part', 'checks-ready'); message.append(checkGlyph(true), document.createTextNode('Ready to run. Every step connects from start to finish.')); checks.append(message); }
    const hold = this.shadowRoot!.querySelector<HTMLElement>('[part=hold]')!;
    hold.hidden = this.allChecks.length === 0;
    hold.querySelector('[part=hold-text]')!.textContent = `${this.allChecks.length} ${this.allChecks.length === 1 ? 'problem needs' : 'problems need'} fixing before this drawing can be read back.`;
    this.allChecks.forEach((check) => {
      const button = document.createElement("button");
      button.type = "button";
      const box = this.projection.boxes.find(
        (box) =>
          box.id === check.boxId ||
          (check.path &&
            JSON.stringify(box.path) === JSON.stringify(check.path)),
      );
      const icon = checkGlyph();
      const text = document.createElement('span');
      const title = document.createElement('strong'); title.textContent = check.title ? box ? `${box.title}: ${check.title.toLowerCase()}` : check.title : check.message; text.append(title);
      if (check.title) { const detail = document.createElement('small'); detail.textContent = check.message; text.append(detail); }
      button.append(icon, text);
      button.addEventListener("click", () => {
        if (box) {
          this.select(box.id);
          this.focusBox(box.id);
        }
        this.setStatus(check.message, true);
      });
      checks.append(button);
    });
  }
  private renderField(box: ProcessBox<N>, field: ProcessField): HTMLElement {
    const row = document.createElement('div'); row.setAttribute('part', 'field');
    const label = document.createElement('label'); label.textContent = field.label;
    let control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (field.kind === 'multiline') control = document.createElement('textarea');
    else if (field.kind === 'choice') {
      const select = document.createElement('select');
      const groups = new Map<string, HTMLOptGroupElement>();
      for (const option of field.options ?? []) {
        const item = document.createElement('option'); item.value = option.value; item.textContent = option.label;
        if (option.group) {
          let group = groups.get(option.group);
          if (!group) { group = document.createElement('optgroup'); group.label = option.group; groups.set(option.group, group); select.append(group); }
          group.append(item);
        } else select.append(item);
      }
      control = select;
    } else { const input = document.createElement('input'); input.type = field.kind === 'boolean' ? 'checkbox' : field.kind === 'number' ? 'number' : field.kind === 'search' ? 'search' : 'text'; control = input; }
    control.dataset.field = field.key;
    if (control instanceof HTMLInputElement && control.type === 'checkbox') control.checked = Boolean(field.value);
    else control.value = field.kind === 'action' ? field.options?.find(option => option.value === field.value)?.label ?? String(field.value) : String(field.value);
    control.disabled = Boolean(field.disabled || this.locked);
    control.required = Boolean(field.required);
    if (field.placeholder && control instanceof HTMLInputElement) control.placeholder = field.placeholder;
    if (field.problem) control.setAttribute('aria-invalid', 'true');
    const submit = () => emit(this, 'process-field-change-request', { boxId: box.id, path: box.path, key: field.key, value: control instanceof HTMLInputElement && control.type === 'checkbox' ? control.checked : control instanceof HTMLInputElement && control.type === 'number' && control.value !== '' ? Number(control.value) : control.value });
    if (field.kind !== 'action') control.addEventListener(field.kind === 'expression' ? 'input' : 'change', submit);
    label.append(control); row.append(label);
    if (field.kind === 'action' && control instanceof HTMLInputElement) {
      const input = control; const options = field.options ?? [];
      const list = document.createElement('div'); list.setAttribute('part', 'action-options');
      list.id = `process-action-${box.id}-${field.key}`.replace(/[^a-zA-Z0-9-]/g, '-'); list.hidden = true;
      const optionList = document.createElement('div'); optionList.setAttribute('role', 'listbox'); optionList.id = `${list.id}-choices`; optionList.setAttribute('aria-label', `${field.label} choices`);
      input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-controls', optionList.id); input.setAttribute('aria-expanded', 'false'); input.autocomplete = 'off';
      let group: string | null = null; let active = 0; let browse = false;
      const close = () => { list.hidden = true; browse = false; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); };
      const choose = (option: (typeof options)[number]) => { input.focus(); input.value = option.value; close(); submit(); };
      const render = () => {
        list.replaceChildren(); optionList.replaceChildren();
        const query = browse ? '' : input.value.trim().toLocaleLowerCase();
        const matches = options.filter(option => (!group || option.group === group) && (!query || `${option.label} ${option.value} ${option.group ?? ''}`.toLocaleLowerCase().includes(query)));
        if (!group && !query) {
          const groups = [...new Set(options.map(option => option.group).filter((name): name is string => Boolean(name)))];
          for (const name of groups) { const button = document.createElement('button'); button.type = 'button'; button.setAttribute('part', 'action-group'); button.textContent = name; button.onclick = () => { input.focus(); group = name; browse = true; render(); }; list.append(button); }
        }
        if (group) { const back = document.createElement('button'); back.type = 'button'; back.setAttribute('part', 'action-back'); back.textContent = `All actions / ${group}`; back.onclick = () => { input.focus(); group = null; browse = true; render(); }; list.prepend(back); }
        for (const [index, option] of matches.entries()) {
          const item = document.createElement('button'); item.type = 'button'; item.setAttribute('role', 'option'); item.setAttribute('part', 'action-option'); item.id = `${list.id}-${index}`; item.setAttribute('aria-selected', String(index === active));
          const title = document.createElement('strong'); title.textContent = option.label; item.append(title);
          if (option.value !== option.label) { const code = document.createElement('small'); code.textContent = option.value; item.append(code); }
          item.onclick = () => choose(option); optionList.append(item);
        }
        if (!matches.length) { const empty = document.createElement('p'); empty.textContent = 'No matching actions'; list.append(empty); }
        list.append(optionList);
        active = Math.min(active, Math.max(0, matches.length - 1));
        list.hidden = false; input.setAttribute('aria-expanded', 'true');
        const selected = list.querySelectorAll<HTMLElement>('[role=option]')[active];
        if (selected) input.setAttribute('aria-activedescendant', selected.id); else input.removeAttribute('aria-activedescendant');
      };
      input.addEventListener('focus', () => { group = null; browse = false; render(); });
      input.addEventListener('input', () => { group = null; browse = false; active = 0; render(); });
      input.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.preventDefault(); close(); return; }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); if (list.hidden) render();
          const items = Array.from(list.querySelectorAll<HTMLButtonElement>('[role=option]')); if (!items.length) return;
          active = (active + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
          items.forEach((item, index) => item.setAttribute('aria-selected', String(index === active)));
          input.setAttribute('aria-activedescendant', items[active].id); items[active].scrollIntoView?.({ block: 'nearest' });
        } else if (event.key === 'Enter' && !list.hidden) {
          const items = Array.from(list.querySelectorAll<HTMLButtonElement>('[role=option]')); if (items[active]) { event.preventDefault(); items[active].click(); }
        }
      });
      const caret = document.createElement('button'); caret.type = 'button'; caret.setAttribute('part', 'action-caret'); caret.setAttribute('aria-label', `Browse ${field.label.toLowerCase()} choices`); caret.textContent = '⌄'; caret.disabled = input.disabled;
      caret.onclick = () => { input.focus(); group = null; browse = true; active = 0; render(); };
      row.addEventListener('focusout', event => { if (!row.contains(event.relatedTarget as Node)) close(); });
      row.append(caret, list);
    }
    if (field.kind === 'search' && field.options?.length && control instanceof HTMLInputElement) {
      const options = document.createElement('datalist'); options.id = `process-field-${box.id}-${field.key}`.replace(/[^a-zA-Z0-9-]/g, '-');
      for (const option of field.options) { const item = document.createElement('option'); item.value = option.value; item.label = option.label; options.append(item); }
      control.setAttribute('list', options.id); row.append(options);
    }
    if (field.kind === 'expression' && this.variables.length) {
      const chips = document.createElement('div'); chips.setAttribute('part', 'variable-chips'); chips.setAttribute('aria-label', 'Variables in scope');
      for (const variable of this.variables) { const chip = document.createElement('button'); chip.type = 'button'; chip.textContent = variable.name; chip.disabled = control.disabled; chip.onclick = () => { control.value += variable.name; submit(); control.focus(); }; chips.append(chip); }
      row.append(chips);
    }
    if (field.description) { const help = document.createElement('small'); help.textContent = field.description; row.append(help); }
    if (field.problem) { const problem = document.createElement('small'); problem.setAttribute('part', 'field-problem'); problem.textContent = field.problem; row.append(problem); }
    return row;
  }
  private renderSelection(): void {
    if (!this.isRendered) return;
    const focusedControl = this.shadowRoot!.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
    const focusedKey = focusedControl?.dataset.field ?? focusedControl?.dataset.variable;
    const variableKey = focusedControl?.dataset.variableKey;
    const focusedType = focusedControl?.dataset.field !== undefined ? 'field' : focusedControl?.dataset.variable !== undefined ? 'variable' : null;
    const caret = focusedControl && 'selectionStart' in focusedControl ? focusedControl.selectionStart : null;
    const restoreControlFocus = () => {
      if (focusedKey === undefined || !focusedType) return;
      const controls = Array.from(this.shadowRoot!.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement>('input,textarea,select,button'));
      const control = controls.find(item => item.dataset[focusedType] === focusedKey && (focusedType !== 'variable' || item.dataset.variableKey === variableKey))
        ?? (focusedType === 'variable' ? controls.find(item => this.pendingVariableRename?.name === focusedKey && item.dataset.variable === this.pendingVariableRename.value && item.dataset.variableKey === variableKey) ?? controls.find(item => item.dataset.variableKey === 'add') : undefined);
      if (!control) return;
      control.focus();
      if (caret !== null && (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) && control.type !== 'number' && control.type !== 'checkbox') control.setSelectionRange(caret, caret);
    };
    this.shadowRoot!.querySelectorAll<SVGRectElement>('[part=minimap] [data-map-box]').forEach(rect => rect.dataset.selected = String(this.selectedIds.has(rect.dataset.mapBox!)));
    this.shadowRoot!.querySelectorAll<SVGPathElement>('[part=line]').forEach(line => { const selected = line.dataset.lineId === this.selectedLineId; line.dataset.selected = String(selected); line.setAttribute('marker-end', `url(#${selected ? 'boe-process-arrow-brand' : 'boe-process-arrow'})`); });
    this.shadowRoot!.querySelectorAll<HTMLElement>("[data-box-id]").forEach(
      (element) => {
        element.setAttribute(
          "aria-current",
          String(this.selectedIds.has(element.dataset.boxId!)),
        );
        const box = this.projection.boxes.find(
          (box) => box.id === element.dataset.boxId,
        )!;
        element.dataset.invalid = String(
          this.allChecks.some(
            (check) =>
              check.boxId === box.id ||
              (check.path &&
                JSON.stringify(check.path) === JSON.stringify(box.path)),
          ),
        );
      },
    );
    const editor =
      this.shadowRoot!.querySelector<HTMLElement>("[part=editor]")!;
    const selected = this.selected;
    const controlsKey = `${[...this.selectedIds].join(',')}|${this.locked}|${this.disableConnections}|${this.showLastRunValue}|${selected?.runMetrics}|${JSON.stringify(selected ? this.fieldsValue[selected.id] ?? [] : [])}`;
    this.shadowRoot!.querySelector<HTMLElement>("[part=palette]")!.hidden = false;
    this.shadowRoot!.querySelector<HTMLElement>('[part=selection-toolbar]')!.hidden = this.selectedIds.size === 0 && !this.selectedLineId;
    this.renderSelectionToolbar();
    this.renderPane();
    this.positionSelectionToolbar();
    if (
      this.inspected === selected?.node &&
      this.inspectedId === selected?.id &&
      this.inspectedControls === controlsKey &&
      editor.querySelector(`[part=inspector-heading]`)?.tagName === `H${this.headingLevel}`
    ) {
      editor.querySelector("[part=inspector-heading]")!.textContent = selected?.title ?? "";
      restoreControlFocus();
      return;
    }
    this.cleanupInspector?.();
    this.cleanupInspector = undefined;
    editor.replaceChildren();
    this.inspected = selected?.node;
    this.inspectedId = selected?.id;
    this.inspectedControls = controlsKey;
    if (this.selectedIds.size > 1) {
      const heading = document.createElement(`h${this.headingLevel}`); heading.setAttribute('part', 'inspector-heading'); heading.textContent = `${this.selectedIds.size} steps selected`; editor.append(heading);
      const actions = document.createElement('div'); actions.setAttribute('part', 'arrange-actions');
      for (const [label, action] of [['Align left', 'left'], ['Align centre', 'center'], ['Align right', 'right'], ['Align top', 'top'], ['Align middle', 'middle'], ['Align bottom', 'bottom'], ['Distribute horizontally', 'distribute-horizontal'], ['Distribute vertically', 'distribute-vertical']] as const) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = label; button.disabled = this.locked; button.onclick = () => this.arrangeSelection(action); actions.append(button);
      }
      const section = document.createElement('button'); section.type = 'button'; section.textContent = 'Make a section'; section.disabled = this.locked; section.onclick = () => this.makeSection(); actions.append(section); editor.append(actions);
      restoreControlFocus(); return;
    }
    if (selected) {
      const heading = document.createElement(`h${this.headingLevel}`);
      heading.setAttribute("part", "inspector-heading");
      heading.dataset.single = 'true';
      heading.textContent = selected.title;
      editor.append(heading);
      const kind = this.catalog.find(entry => entry.kind === selected.kind);
      const kindLabel = document.createElement('p'); kindLabel.setAttribute('part', 'inspector-kind'); kindLabel.textContent = kind?.label ?? selected.kind; editor.append(kindLabel);
      if (selected.description) { const purpose = document.createElement('p'); purpose.setAttribute('part', 'inspector-purpose'); purpose.textContent = selected.description; editor.append(purpose); }
      for (const field of this.fieldsValue[selected.id] ?? []) editor.append(this.renderField(selected, field));
      this.cleanupInspector =
        this.renderer?.(selected.node, editor) || undefined;
      const outgoing = this.projection.lines.filter(line => line.from === selected.id);
      const leads = document.createElement('section'); leads.setAttribute('part', 'leads-to');
      const leadsHeading = document.createElement('h3'); leadsHeading.textContent = 'Leads to'; leads.append(leadsHeading);
      for (const line of outgoing) {
        const row = document.createElement('div'); row.setAttribute('part', 'lead-row');
        const target = this.projection.boxes.find(box => box.id === line.to);
        const name = document.createElement('span'); name.textContent = `${line.label ? `${line.label}: ` : ''}${target?.title ?? line.to}`; row.append(name);
        if (!this.disableConnections) { const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove'; remove.setAttribute('aria-label', `Remove connection to ${target?.title ?? line.to}`); remove.disabled = this.locked; remove.onclick = () => this.requestEdit({ type: 'disconnect', lineId: line.id }); row.append(remove); }
        leads.append(row);
      }
      const connect = document.createElement('button'); connect.type = 'button'; connect.textContent = 'Connect to…'; connect.disabled = this.locked || this.disableConnections; connect.onclick = () => { this.connecting = selected.id; this.setStatus(`Select the next box to connect from ${selected.title}`); }; leads.append(connect); editor.append(leads);
      const metrics = this.showLastRunValue && selected.runMetrics !== false ? this.lastRunValue?.steps[selected.id] : undefined;
      if (metrics) {
        const report = document.createElement('section'); report.setAttribute('part', 'inspector-metrics');
        const title = document.createElement('h3'); title.textContent = 'Last run'; report.append(title);
        if (this.lastRunValue?.label) { const source = document.createElement('p'); source.textContent = `From ${this.lastRunValue.label}.`; report.append(source); }
        if (metrics.notInRun) { const note = document.createElement('p'); note.textContent = 'Not in this run'; report.append(note); }
        else {
          const list = document.createElement('table'); list.setAttribute('aria-label', 'Last run metrics');
          const body = document.createElement('tbody'); list.append(body);
          for (const [label, value] of [['Per second', metrics.callsPerSecond === undefined ? '–' : metrics.callsPerSecond.toFixed(1)], ['95% finished within', metrics.p95Ms === undefined ? '–' : formatRunDuration(metrics.p95Ms)], ['Failed', metrics.failedShare === undefined ? '–' : formatFailedShare(metrics.failedShare)]] as const) {
            const row = document.createElement('tr'); const term = document.createElement('th'); term.scope = 'row'; term.textContent = label; const detail = document.createElement('td'); detail.textContent = value; row.append(term, detail); body.append(row);
          }
          report.append(list);
        }
        editor.insertBefore(report, leads);
      }
      const actions = document.createElement('div'); actions.setAttribute('part', 'inspector-actions');
      const duplicate = document.createElement('button'); duplicate.type = 'button'; duplicate.textContent = 'Duplicate'; duplicate.disabled = this.locked; duplicate.onclick = () => this.requestEdit({ type: 'duplicate', sourceId: selected.id, position: { x: this.layoutValue.boxes[selected.id].x + 32, y: this.layoutValue.boxes[selected.id].y + 32 } });
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Delete'; remove.disabled = this.locked; remove.onclick = () => this.requestEdit({ type: 'delete', boxId: selected.id }); actions.append(duplicate, remove); editor.append(actions);
    }
    restoreControlFocus();
  }
  private renderSelectionToolbar(): void {
    const toolbar = this.shadowRoot!.querySelector<HTMLElement>('[part=selection-toolbar]')!;
    const key = `${[...this.selectedIds].join(',')}|${this.selected?.kind}|${this.selected?.shape}|${this.selectedLineId}|${Boolean(this.selectedLineId && this.layoutValue.lines?.[this.selectedLineId])}|${this.locked}|${this.narrowValue}|${this.projection.lines.filter(line => line.from === this.selectedId).map(line => `${line.id}:${line.label}:${line.dashed}`).join(',')}`;
    if (key === this.selectionToolbarKey) return;
    this.selectionToolbarKey = key;
    toolbar.replaceChildren();
    if (!this.selectedIds.size && !this.selectedLineId) return;
    const add = (label: string, command: string, action: () => void, withPlus = false) => {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.selectionCommand = command; button.setAttribute('aria-label', label); button.disabled = this.locked; button.onclick = action;
      if (withPlus) {
        const icon = document.createElement('span'); icon.setAttribute('part', 'selection-plus'); icon.setAttribute('aria-hidden', 'true'); icon.textContent = '+'; button.append(icon);
      }
      const text = document.createElement('span'); text.textContent = label; button.append(text);
      toolbar.append(button);
    };
    if (this.selectedLine) {
      const line = this.selectedLine;
      add('Insert a step', 'insert', () => this.openLineChooser(line, toolbar.querySelector<HTMLElement>('[data-selection-command=insert]') ?? undefined), true);
      if (this.layoutValue.lines?.[line.id]) add('Reset line', 'reset-line', () => this.resetLine(line.id));
      if (!this.disableConnections) add('Delete', 'delete-line', () => this.requestEdit({ type: 'disconnect', lineId: line.id }));
    } else if (this.selectedIds.size === 1) {
      const box = this.selected!;
      const failurePath = box.kind === 'try' && !this.projection.lines.some(line => line.from === box.id && (line.dashed || line.label === 'If it fails'));
      if (this.narrowValue) add('Details', 'details', () => this.openDrawer('inspector'));
      if (!['end', 'finish', 'section', 'note'].includes(box.kind)) add(box.shape === 'gateway' ? 'Add a path' : 'Add next', 'add-next', () =>
        this.openAnchoredChooser(this.nextEdit(box), this.nextChooserTitle(box), toolbar.querySelector<HTMLElement>('[data-selection-command=add-next]') ?? undefined), true);
      if (failurePath) add('If it fails', 'add-failure', () => this.openAnchoredChooser(
        { type: 'add', from: box.id, routeLabel: 'If it fails', dashed: true },
        `If a step in ${box.title} fails`,
        toolbar.querySelector<HTMLElement>('[data-selection-command=add-failure]') ?? undefined,
        Array.from(this.shadowRoot!.querySelectorAll<HTMLElement>('[data-box-id]')).find(element => element.dataset.boxId === box.id),
      ), true);
      if (!['start', 'timer', 'section'].includes(box.kind)) add('Duplicate', 'duplicate', () => { const position = this.layoutValue.boxes[box.id]; this.requestEdit({ type: 'duplicate', sourceId: box.id, position: { x: position.x + 32, y: position.y + 32 } }); });
      if (!['start', 'timer'].includes(box.kind)) add('Delete', 'delete-many', () => this.selectionCommand('delete-many'));
    } else {
      add('Line up', 'align', () => this.selectionCommand('align'));
      add('Tidy these', 'space', () => this.selectionCommand('space'));
      add('Delete', 'delete-many', () => this.selectionCommand('delete-many'));
    }
  }
  private updateToolbar(): void {
    const button = (command: string) =>
      this.shadowRoot!.querySelector<HTMLButtonElement>(
        `[data-command=${command}]`,
      )!;
    button("undo").disabled = !this.history.canUndo || this.locked;
    button("redo").disabled = !this.history.canRedo || this.locked;
    button("tidy").disabled = this.locked;
    button("lock").setAttribute("aria-pressed", String(this.locked));
    button("snap").setAttribute("aria-pressed", String(this.snapToGrid));
    this.shadowRoot!.querySelectorAll<HTMLButtonElement>('[data-detail]').forEach(control => {
      control.setAttribute("aria-pressed", String(control.dataset.detail === this.detailValue));
    });
    const runToggle = this.shadowRoot!.querySelector<HTMLElement>('[part=run-toggle]')!;
    runToggle.hidden = !this.lastRunValue;
    runToggle.querySelector<HTMLInputElement>('input')!.checked = this.showLastRunValue;
    const mobileRun = this.shadowRoot!.querySelector<HTMLButtonElement>('[data-view-option=last-run]')!;
    mobileRun.hidden = !this.lastRunValue;
    mobileRun.setAttribute('aria-pressed', String(this.showLastRunValue));
    const checksStatus = button('checks-status');
    const count = this.allChecks.length;
    checksStatus.textContent = count ? `${count} ${count === 1 ? 'problem' : 'problems'}` : '✓ Ready to run';
    checksStatus.dataset.state = count ? 'bad' : 'ready';
  }
  private paintViewport(): void {
    const world = this.shadowRoot!.querySelector<HTMLElement>("[part=world]")!;
    world.style.setProperty('--boe-process-inverse-zoom', String(1 / this.viewport.zoom));
    world.style.transform =
      `translate(${this.viewport.x}px,${this.viewport.y}px) scale(${this.viewport.zoom})`;
    const canvas = this.shadowRoot!.querySelector<HTMLElement>("[part=canvas]")!;
    const grid = 16 * this.viewport.zoom * (this.viewport.zoom < 0.5 ? 4 : 1);
    canvas.style.backgroundSize = `${grid}px ${grid}px`;
    canvas.style.backgroundPosition = `${this.viewport.x}px ${this.viewport.y}px`;
    this.shadowRoot!.querySelectorAll<HTMLElement>('[part=port]').forEach(port => port.style.transform = `scale(${1 / this.viewport.zoom})`);
    this.positionSelectionToolbar();
    this.shadowRoot!.querySelector("[data-command=reset]")!.textContent =
      `${Math.round(this.viewport.zoom * 100)}%`;
    const minimap =
      this.shadowRoot!.querySelector<SVGSVGElement>("[part=minimap]")!;
    const bounds = this.minimapBounds(canvas);
    minimap.replaceChildren();
    minimap.setAttribute(
      "viewBox",
      `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`,
    );
    minimap.setAttribute("preserveAspectRatio", "none");
    for (const section of this.layoutValue.sections ?? []) { const rect = svgElement('rect'); rect.dataset.section = 'true'; for (const key of ['x','y','width','height'] as const) rect.setAttribute(key, String(section[key])); rect.setAttribute('rx', '16'); minimap.append(rect); }
    this.projection.boxes.forEach((box) => {
      const pos = this.layoutValue.boxes[box.id];
      const rect = svgElement("rect");
      rect.setAttribute("x", String(pos.x));
      rect.setAttribute("y", String(pos.y));
      rect.setAttribute("width", String(pos.width ?? 224));
      rect.setAttribute("height", String(pos.height ?? 64));
      rect.setAttribute('rx', box.frame ? '12' : '8');
      rect.dataset.mapBox = box.id;
      rect.dataset.selected = String(this.selectedIds.has(box.id));
      if (box.frame) rect.setAttribute('fill-opacity', '.35');
      minimap.append(rect);
    });
    const viewport = svgElement("rect");
    viewport.dataset.viewport = "true";
    viewport.setAttribute("x", String(-this.viewport.x / this.viewport.zoom));
    viewport.setAttribute("y", String(-this.viewport.y / this.viewport.zoom));
    viewport.setAttribute(
      "width",
      String(canvas.clientWidth / this.viewport.zoom),
    );
    viewport.setAttribute(
      "height",
      String(canvas.clientHeight / this.viewport.zoom),
    );
    viewport.setAttribute('rx', '4');
    minimap.append(viewport);
  }
  private positionSelectionToolbar(): void {
    if (!this.isRendered || (!this.selectedIds.size && !this.selectedLineId)) return;
    const canvas = this.shadowRoot!.querySelector<HTMLElement>('[part=canvas]')!;
    const toolbar = this.shadowRoot!.querySelector<HTMLElement>('[part=selection-toolbar]')!;
    const positions = [...this.selectedIds].map(id => this.layoutValue.boxes[id]).filter(Boolean);
    if (!positions.length && this.selectedLine) {
      const point = lineMidpoint(this.routedLines.get(this.selectedLine.id) ?? []);
      toolbar.style.left = `${Math.max(8, Math.min(point.x * this.viewport.zoom + this.viewport.x, Math.max(8, canvas.clientWidth - toolbar.offsetWidth - 8)))}px`;
      toolbar.style.top = `${Math.max(8, point.y * this.viewport.zoom + this.viewport.y - 52)}px`;
      return;
    }
    if (!positions.length) return;
    const left = Math.min(...positions.map(position => position.x * this.viewport.zoom + this.viewport.x));
    const top = Math.min(...positions.map(position => position.y * this.viewport.zoom + this.viewport.y));
    const bottom = Math.max(...positions.map(position => (position.y + (position.height ?? 64)) * this.viewport.zoom + this.viewport.y));
    toolbar.style.left = `${Math.max(8, Math.min(left, Math.max(8, canvas.clientWidth - toolbar.offsetWidth - 8)))}px`;
    toolbar.style.top = `${top > 56 ? top - 48 : Math.min(bottom + 8, Math.max(8, canvas.clientHeight - toolbar.offsetHeight - 8))}px`;
  }
  private focusBox(id: string): void {
    Array.from(this.shadowRoot!.querySelectorAll<HTMLElement>("[data-box-id]"))
      .find((box) => box.dataset.boxId === id)
      ?.focus({ preventScroll: true });
  }
  private setStatus(message: string, urgent = false): void {
    this.shadowRoot!.querySelector(urgent ? "[part=status]" : "[part=urgent-status]")!.textContent = "";
    this.shadowRoot!.querySelector(urgent ? "[part=urgent-status]" : "[part=status]")!.textContent = message;
  }
}
ProcessModeler.register();
