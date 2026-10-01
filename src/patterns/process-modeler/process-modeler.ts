import { BaseElement } from "../../core/index.js";
import { announce } from "../../foundations/a11y/index.js";
import { boeFocusVisibleStyles } from "../../foundations/tokens/interaction.js";
import { dismissModal, promoteModal } from "../../foundations/overlay/index.js";
import type { FlowKind, NodePath } from "../flow-builder/model.js";
import { KindPicker } from "../flow-builder/primitives.js";
import { arrangeProcess, routeProcessLine, lineMidpoint, nearProcessLine } from "./geometry.js";
import { restoreProcessPositions, snapshotProcessPositions, graphChecks, normalizeProcessSelectionPath } from "./bridge.js";
import type { ProcessConnection, ProcessVariable, ProcessLoadOptions } from "./model.js";
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
const emit = (element: HTMLElement, name: string, detail: unknown): boolean =>
  element.dispatchEvent(
    new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
      cancelable: true,
    }),
  );

/** Projects host documents without owning workflow schemas or persistence. */
export class ProcessModeler<
  D = ProcessProjection,
  N = unknown,
> extends BaseElement {
  static readonly tagName = "box-process-modeler";
  static get observedAttributes(): string[] {
    return ["locked", "snap-to-grid", "heading-level", "disable-connections"];
  }
  private documentValue?: D;
  private modelValue: ProcessModel<D, N> = {
    project: (document) => document as unknown as ProcessProjection<N>,
  };
  private projection: ProcessProjection<N> = { boxes: [], lines: [] };
  private layoutValue: ProcessLayout = { boxes: {} };
  private catalogValue: readonly FlowKind[] = [];
  private selectedId: string | null = null;
  private connecting: string | null = null;
  private checks: readonly ProcessCheck[] = [];
  private renderer?: (node: N, container: HTMLElement) => void | (() => void);
  private cleanupInspector?: () => void;
  private inspected?: N;
  private inspectedId?: string;
  private historyValue = new ProcessHistory();
  private viewport = { x: 0, y: 0, zoom: 1 };
  private pointers = new Map<number, { x: number; y: number }>();
  private drag?: {
    id?: string;
    x: number;
    y: number;
    position?: BoxPosition;
    panX: number;
    panY: number;
  };
  private pinchDistance = 0;
  private gestureZoom = 1;
  private insertion?: ProcessEdit;
  private selectedIds = new Set<string>();
  private versionValue: string | number = 0;
  private lastProjection = "";
  private lastDocument?: D;
  private connectionsValue: readonly ProcessConnection[] = [];
  private variablesValue: readonly ProcessVariable[] = [];
  private activePane = "Outline";
  private portDrag?: { pointerId: number; id: string; side: "north" | "east" | "south" | "west"; start: { x: number; y: number }; point: { x: number; y: number } };
  private marquee?: { pointerId: number; start: { x: number; y: number }; point: { x: number; y: number } };
  private segmentDrag?: { pointerId: number; id: string; index: number; points: { x: number; y: number }[] };
  private dropLine?: string;
  private narrowValue = false;
  private suppressClick = false;
  private resizeObserver?: ResizeObserver;
  private routedLines = new Map<string, { x: number; y: number }[]>();
  private computedChecks: readonly ProcessCheck[] = [];
  get selectedBoxes(): readonly ProcessBox<N>[] { return this.projection.boxes.filter(box => this.selectedIds.has(box.id)); }
  get selectedPath(): NodePath | null { return this.selected?.path ? [...this.selected.path] : null; }
  set selectedPath(path: NodePath | null) {
    if (!this.isRendered && this.documentValue !== undefined) { this.projection = this.model.project(this.documentValue); validateProjection(this.projection); }
    const normalized = normalizeProcessSelectionPath(this.projection, path);
    this.select(normalized === null ? null : this.projection.boxes.find(box => JSON.stringify(box.path) === JSON.stringify(normalized))?.id ?? null);
  }
  get connections(): readonly ProcessConnection[] { return this.connectionsValue; }
  set connections(value: readonly ProcessConnection[]) { this.connectionsValue = value; this.refresh(); }
  get variables(): readonly ProcessVariable[] { return this.variablesValue; }
  set variables(value: readonly ProcessVariable[]) { this.variablesValue = value; this.refresh(); }
  get version(): string | number { return this.versionValue; }
  get narrow(): boolean { return this.narrowValue; }
  get positions() { return snapshotProcessPositions(this.projection, this.layoutValue); }
  load(document: D, options: ProcessLoadOptions = {}): void {
    const projection = this.model.project(document); validateProjection(projection);
    this.documentValue = document;
    this.projection = projection;
    this.versionValue = options.version ?? 0;
    this.lastProjection = "";
    this.layoutValue = restoreProcessPositions(projection, options.positions ?? []);
    this.history.clear(); this.selectedId = null; this.selectedIds.clear();
    this.refresh();
    if (options.selectedPath) this.selectedPath = options.selectedPath;
  }
  selectMany(ids: readonly string[]): void {
    if (!this.isRendered && this.documentValue !== undefined) { this.projection = this.model.project(this.documentValue); validateProjection(this.projection); }
    const next = new Set(ids.filter(id => this.projection.boxes.some(box => box.id === id)));
    if (next.size === this.selectedIds.size && [...next].every(id => this.selectedIds.has(id))) return;
    this.selectedIds = next;
    this.selectedId = this.selectedIds.values().next().value ?? null;
    this.renderSelection(); if (this.isRendered) this.updateToolbar();
    emit(this, "selection-changed", { box: this.selected, boxes: this.selectedBoxes, path: this.selectedPath });
  }
  get headingLevel(): number { const level = Number(this.getAttribute("heading-level") ?? 2); return Number.isInteger(level) && level >= 1 && level <= 6 ? level : 2; }
  set headingLevel(value: number) { this.setAttribute("heading-level", String(value)); }
  get disableConnections(): boolean { return this.hasAttribute("disable-connections"); }
  set disableConnections(value: boolean) { this.toggleAttribute("disable-connections", value); }
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
  get catalog(): readonly FlowKind[] {
    return this.catalogValue;
  }
  set catalog(value: readonly FlowKind[]) {
    this.catalogValue = value;
    this.refresh();
  }
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
    this.shadowRoot?.querySelectorAll<HTMLDialogElement>("[part=pane-drawer]").forEach(dialog => dismissModal(dialog));
    const chooser = this.shadowRoot?.querySelector<HTMLDialogElement>("[part=insert-chooser]");
    if (chooser) dismissModal(chooser);
    this.cleanupInspector?.();
    this.cleanupInspector = undefined;
    this.inspected = undefined;
    this.pointers.clear();
    this.drag = undefined;
    this.portDrag = undefined; this.marquee = undefined; this.segmentDrag = undefined;
  }
  connectedCallback(): void { super.connectedCallback(); this.resizeObserver?.observe(this); }
  refresh(): void {
    if (this.isRendered) this.update();
  }
  select(id: string | null): void {
    if (!this.isRendered && this.documentValue !== undefined) {
      this.projection = this.model.project(this.documentValue);
      validateProjection(this.projection);
    }
    if (id !== null && !this.projection.boxes.some((box) => box.id === id))
      return;
    if (id === this.selectedId && this.selectedIds.size === (id ? 1 : 0)) return;
    this.selectedId = id;
    this.selectedIds = new Set(id ? [id] : []);
    this.renderSelection();
    if (this.isRendered) this.updateToolbar();
    emit(this, "selection-changed", { box: this.selected, boxes: this.selectedBoxes, path: this.selectedPath });
  }
  setValidation(checks: readonly ProcessCheck[]): void {
    this.checks = checks;
    this.refresh();
  }
  setValidationAtPath(message: string, path: NodePath): void {
    this.setValidation(message ? [{ message, path }] : []);
  }
  requestEdit(edit: ProcessEdit): void {
    if (this.locked || (this.disableConnections && (edit.type === "connect" || edit.type === "disconnect"))) return;
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
        if (
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
    const snap = (n: number) => (this.snapToGrid ? Math.round(n / 20) * 20 : n);
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
  tidy(): void {
    if (this.locked) return;
    this.commitLayout(
      this.arrangedLayout({ ...this.layout, boxes: {} }),
    );
    this.fit();
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
    const centerX = viewport.clientWidth / 2;
    const centerY = viewport.clientHeight / 2;
    const previous = this.viewport.zoom;
    const next = Math.max(0.25, Math.min(3, previous * factor));
    this.viewport.x = centerX - ((centerX - this.viewport.x) / previous) * next;
    this.viewport.y = centerY - ((centerY - this.viewport.y) / previous) * next;
    this.viewport.zoom = next;
    this.paintViewport();
  }
  fit(): void {
    const bounds = this.bounds();
    const canvas =
      this.shadowRoot!.querySelector<HTMLElement>("[part=canvas]")!;
    this.viewport.zoom = Math.max(
      0.25,
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
        Math.max(100, ...positions.map((pos) => pos.x + (pos.width ?? 220))) -
        x,
      height:
        Math.max(100, ...positions.map((pos) => pos.y + (pos.height ?? 96))) -
        y,
    };
  }
  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>
      :host{display:block;font:inherit;color:var(--boe-token-text-text,#222);min-width:0}:host([hidden]){display:none!important}
      *{box-sizing:border-box}button,input{font:inherit;color:inherit}button{background:var(--boe-token-surface-surface,#fff);border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:8px;padding:8px;min-height:36px;cursor:pointer}button:disabled{opacity:.5;cursor:default}
      ${boeFocusVisibleStyles(":is(button,input,[part=canvas],[part=minimap])")}
      [part=toolbar]{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
      [part=layout]{display:grid;grid-template-columns:minmax(0,1fr) minmax(var(--boe-process-inspector-min-width,240px),var(--boe-process-inspector-width,320px));gap:16px}
      [part=canvas]{position:relative;overflow:hidden;height:var(--boe-process-height,560px);background:var(--boe-token-surface-surface-secondary,#fbfbfb);border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:12px;touch-action:none}
      [part=world]{position:absolute;inset:0;transform-origin:0 0}
      [part=lines]{position:absolute;inset:0;width:1px;height:1px;overflow:visible;pointer-events:none}
      [part=line]{stroke:var(--boe-token-text-text-secondary,#666);stroke-width:2;fill:none}
      [part=box],[part=frame]{position:absolute;padding:12px;display:flex;flex-direction:column;gap:6px;text-align:start;background:var(--boe-token-surface-surface,#fff);border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:8px;touch-action:none}
      [part=box] strong,[part=frame] strong{overflow-wrap:anywhere}[part=box] small{color:var(--boe-token-text-text-secondary,#666)}
      [part=frame]{background:color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 4%,var(--boe-token-surface-surface,#fff));justify-content:flex-start}
      [aria-pressed=true]{border-color:var(--boe-token-surface-surface-brand,#0061d5)}[data-invalid=true]{border-color:var(--boe-token-text-status-text-error,#b92340);border-width:2px}
      [part=connection]{position:absolute;display:flex;gap:4px;align-items:center;background:var(--boe-token-surface-surface,#fff);border-radius:8px;padding:4px;font-size:12px;white-space:nowrap}
      [part=connection] button{font-size:12px;min-height:32px;padding:4px}
      [part=connection] button{opacity:0;pointer-events:none}
      [part=connection]:hover button,[part=connection]:focus-within button{opacity:1;pointer-events:auto}
      [part=connection]{min-width:40px;min-height:32px}
      [part=insert-chooser]{padding:12px;background:var(--boe-token-surface-surface,#fff);border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:12px;max-width:calc(100vw - 32px);max-height:65vh;overflow:auto}
      [part=inspector]{min-width:0;padding:12px;border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:12px;background:var(--boe-token-surface-surface,#fff)}
      [hidden]{display:none!important}
      [part=palette]{display:grid;gap:8px}[part=palette] input{width:100%;min-width:0;padding:8px;background:var(--boe-token-surface-surface,#fff);border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:8px}
      [part=choices]{display:grid;gap:6px;max-height:300px;overflow:auto}[part=group]{font-weight:600;margin:8px 0 0}
      [part=checks]{display:grid;gap:6px;margin-top:12px}[part=checks] button{text-align:start;color:var(--boe-token-text-status-text-error,#b92340)}
      [part=minimap]{position:absolute;right:12px;bottom:12px;width:150px;height:90px;background:var(--boe-token-surface-surface,#fff);border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:8px;touch-action:none}
      [part=minimap] rect{fill:var(--boe-token-surface-surface-brand,#0061d5)}[part=minimap] [data-viewport]{fill:none;stroke:var(--boe-token-text-text,#222);stroke-width:3}
      [part=icon]{width:20px;height:20px;color:var(--boe-token-surface-surface-brand,#0061d5)}[part=icon] svg{width:20px;height:20px}
      [part=note],[part=section]{position:absolute;border:1px dashed var(--boe-token-stroke-stroke,#ddd);background:var(--boe-token-surface-surface,#fff);padding:8px;pointer-events:none}
      [part=help]{font-size:13px;color:var(--boe-token-text-text-secondary,#666)}
      @media(max-width:800px){[part=layout]{grid-template-columns:minmax(0,1fr)}[part=canvas]{height:420px}}
      @media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important;scroll-behavior:auto!important}}
    </style><div part="toolbar" role="toolbar" aria-label="Diagram controls"><button data-command="zoom-out">Zoom out</button><button data-command="reset">100%</button><button data-command="zoom-in">Zoom in</button><button data-command="fit">Fit the whole process</button><button data-command="tidy">Tidy up</button><button data-command="undo">Undo</button><button data-command="redo">Redo</button><button data-command="snap" aria-pressed="false">Snap to grid</button><button data-command="lock" aria-pressed="false">Lock diagram</button></div><div part="layout"><div part="canvas" tabindex="0" role="region" aria-label="Process diagram" aria-describedby="process-help"><div part="world"></div><svg part="minimap" role="img" aria-label="Diagram overview. Click to jump"></svg></div><div part="inspector" role="region" aria-label="Process details"><div part="palette"><label>Find a building block<input type="search" part="search"></label><div part="choices"></div></div><div part="editor"></div><div part="checks" role="region" aria-label="Checks"></div></div></div><p part="help" id="process-help">Select a box. Arrow keys move it; C then another box connects it; Delete removes it. Drag the background to pan. Use zoom controls or pinch to zoom. Escape cancels connecting.</p><div part="status" role="status" aria-live="polite"></div>`;
    const chooser = document.createElement("dialog"); chooser.setAttribute("part", "insert-chooser"); chooser.setAttribute("aria-label", "Insert a building block");
    const picker = new KindPicker();
    picker.variant = "menu"; chooser.append(picker); this.shadowRoot!.append(chooser);
    picker.addEventListener("kind-pick", event => {
      const insertion = this.insertion; dismissModal(chooser); this.insertion = undefined;
      if (insertion) this.requestEdit({ ...insertion, kind: (event as CustomEvent).detail.kind });
    });
    picker.addEventListener("picker-cancel", () => { dismissModal(chooser); this.insertion = undefined; });
    this.setupPanes();
  }
  private setupPanes(): void {
    const root = this.shadowRoot!;
    const style = document.createElement("style");
    style.textContent = `
      [part=layout]{grid-template-columns:180px minmax(0,1fr) minmax(var(--boe-process-inspector-min-width,220px),var(--boe-process-inspector-width,280px))}
      [part=pane-drawer]{display:contents;color:inherit}[part=pane-drawer]::backdrop{background:rgb(0 0 0 / .45)}
      [part=pane-close],[data-command=palette],[data-command=details]{display:none}
      [part=palette]{align-content:start;border:1px solid var(--boe-control-edge,#6f6f6f);border-radius:12px;padding:12px;background:var(--boe-token-surface-surface,#fff)}
      [part=pane-tabs]{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px}[part=pane-tabs] button{font-size:12px;min-height:28px}
      [part=pane-content]{display:grid;gap:8px}[part=pane-content] button{min-height:28px;text-align:start}
      [part=port]{position:absolute;width:24px;height:24px;min-height:24px;border-radius:50%;padding:0;background:var(--boe-token-surface-surface-brand,#0061d5);border:2px solid var(--boe-token-surface-surface,#fff);opacity:0;z-index:3}
      [part=box]:hover [part=port],[part=box]:focus-within [part=port],[part=box][aria-current=true] [part=port],[part=frame]:hover [part=port]{opacity:1}
      [data-side=north]{left:calc(50% - 12px);top:-12px}[data-side=south]{left:calc(50% - 12px);bottom:-12px}[data-side=east]{right:-12px;top:calc(50% - 12px)}[data-side=west]{left:-12px;top:calc(50% - 12px)}
      [part=box][aria-current=true],[part=frame][aria-current=true]{border:2px solid var(--boe-token-surface-surface-brand,#0061d5)}
      [part=line-hit]{fill:none;stroke:transparent;stroke-width:24;pointer-events:stroke}[data-drop=true]{stroke:var(--boe-token-surface-surface-brand,#0061d5);stroke-width:4}
      [part=connection]{transform:translate(-50%,-50%);font-size:12px}
      [part=connection-actions]{position:absolute;top:100%;left:50%;transform:translateX(-50%);display:flex;gap:4px;width:max-content;background:var(--boe-token-surface-surface,#fff);border-radius:8px}
      [part=marquee]{position:absolute;border:2px solid var(--boe-token-surface-surface-brand,#0061d5);background:color-mix(in srgb,var(--boe-token-surface-surface-brand,#0061d5) 12%,transparent);pointer-events:none}
      [part=guide]{position:absolute;background:var(--boe-token-surface-surface-brand,#0061d5);pointer-events:none}
      [part=measure]{position:absolute;background:var(--boe-token-surface-surface,#fff);font-size:12px;padding:4px;pointer-events:none}
      [part=selection-toolbar]{position:absolute;left:12px;bottom:12px;display:flex;gap:4px;flex-wrap:wrap;background:var(--boe-token-surface-surface,#fff);padding:6px;border:1px solid var(--boe-control-edge,#6f6f6f);border-radius:8px;z-index:5}
      :host([data-narrow]) [part=layout]{grid-template-columns:minmax(0,1fr)}
      :host([data-narrow]) [part=pane-drawer]{display:none;max-width:calc(100vw - 24px);width:320px;max-height:85vh;overflow:auto;border:1px solid var(--boe-control-edge,#6f6f6f);border-radius:12px;padding:12px;background:var(--boe-token-surface-surface,#fff)}
      :host([data-narrow]) [part=pane-drawer][open]{display:block}
      :host([data-narrow]) [part=pane-close],:host([data-narrow]) [data-command=palette],:host([data-narrow]) [data-command=details]{display:inline-block}
    `;
    root.append(style);
    const layout = root.querySelector('[part=layout]')!;
    for (const [part, label] of [["palette", "Building blocks"], ["inspector", "Process details"]]) {
      const pane = root.querySelector(`[part=${part}]`)!;
      const dialog = document.createElement("dialog"); dialog.setAttribute("part", "pane-drawer"); dialog.setAttribute("aria-label", label);
      const close = document.createElement("button"); close.setAttribute("part", "pane-close"); close.textContent = `Close ${label.toLowerCase()}`;
      close.onclick = () => dismissModal(dialog); dialog.append(close, pane);
      if (part === "palette") layout.prepend(dialog); else layout.append(dialog);
      const trigger = document.createElement("button"); trigger.dataset.command = part === "palette" ? "palette" : "details"; trigger.textContent = label;
      trigger.onclick = () => promoteModal(dialog); root.querySelector('[part=toolbar]')!.append(trigger);
    }
    const inspector = root.querySelector('[part=inspector]')!;
    const tabs = document.createElement("div"); tabs.setAttribute("part", "pane-tabs"); tabs.setAttribute("role", "tablist"); tabs.setAttribute("aria-label", "Process details");
    for (const name of ["Outline", "Checks", "Variables", "Connections", "Shortcuts"]) {
      const button = document.createElement("button"); button.textContent = name; button.setAttribute("role", "tab"); button.id = `process-tab-${name.toLowerCase()}`;
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
    inspector.prepend(tabs); inspector.append(content);
    root.querySelector('[part=checks]')!.removeAttribute("role");
    const canvas = root.querySelector('[part=canvas]')!;
    const floating = document.createElement("div"); floating.setAttribute("part", "selection-toolbar"); floating.setAttribute("role", "toolbar"); floating.setAttribute("aria-label", "Selected steps");
    for (const [command, label] of [["align", "Align tops"], ["space", "Space evenly"], ["delete-many", "Delete selected"]]) {
      const button = document.createElement("button"); button.textContent = label;
      button.onclick = () => this.selectionCommand(command); floating.append(button);
    }
    canvas.append(floating);
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(entries => {
        const narrow = entries[0].contentRect.width < 1000;
        this.narrowValue = narrow; this.toggleAttribute("data-narrow", narrow);
        if (!narrow) root.querySelectorAll<HTMLDialogElement>('[part=pane-drawer]').forEach(dialog => dismissModal(dialog));
      });
      this.resizeObserver.observe(this);
    }
  }
  private renderPane(): void {
    if (!this.isRendered) return;
    const root = this.shadowRoot!;
    root.querySelectorAll<HTMLButtonElement>('[part=pane-tabs] button').forEach(button => {
      const selected = button.textContent === this.activePane; button.setAttribute("aria-selected", String(selected)); button.tabIndex = selected ? 0 : -1;
    });
    const content = root.querySelector<HTMLElement>('[part=pane-content]')!;
    content.setAttribute("aria-labelledby", `process-tab-${this.activePane.toLowerCase()}`);
    const checks = root.querySelector<HTMLElement>('[part=checks]')!;
    checks.hidden = this.activePane !== "Checks";
    // Move the checks node out before replacing its parent; keep its handlers.
    root.querySelector('[part=inspector]')!.append(checks);
    content.replaceChildren();
    root.querySelector<HTMLElement>('[part=editor]')!.hidden = this.activePane !== "Outline";
    if (this.activePane === "Outline") {
      this.projection.boxes.forEach(box => {
        const button = document.createElement("button"); button.textContent = box.title; button.setAttribute("aria-current", String(this.selectedIds.has(box.id)));
        button.onclick = () => { this.select(box.id); this.focusBox(box.id); }; content.append(button);
      });
    } else if (this.activePane === "Checks") {
      content.append(checks);
      if (!this.allChecks.length) { const message = document.createElement("p"); message.textContent = "No checks to resolve."; content.prepend(message); }
    } else if (this.activePane === "Connections" || this.activePane === "Variables") {
      const items = this.activePane === "Connections" ? this.connections : this.variables;
      for (const item of items) {
        const row = document.createElement("p"); row.textContent = "kind" in item ? `${item.name} (${item.kind})` : `${item.name}${item.description ? `: ${item.description}` : ""}`; content.append(row);
      }
      if (!items.length) content.textContent = "None supplied by the host.";
    } else if (this.activePane === "Shortcuts") {
      content.textContent = "Arrow keys: move selected step. Shift+arrows: move farther. C: connect selected step. Shift+drag background: select steps. Delete: remove selected. Escape: cancel. Ctrl/Command+Z: undo. Shift+Ctrl/Command+Z: redo.";
    }
  }
  private selectionCommand(command: string): void {
    if (this.locked) return;
    const boxes = this.selectedBoxes;
    if (command === "delete-many") { for (const box of boxes) this.requestEdit({ type: "delete", boxId: box.id }); return; }
    if (boxes.length < 2) return;
    const next = this.layout;
    const sorted = [...boxes].filter(box => {
      let parent = box.parentId; while (parent) { if (this.selectedIds.has(parent)) return false; parent = this.projection.boxes.find(box => box.id === parent)?.parentId; } return true;
    }).sort((a, b) => next.boxes[a.id].x - next.boxes[b.id].x);
    if (sorted.length < 2) return;
    const first = next.boxes[sorted[0].id]; const last = next.boxes[sorted.at(-1)!.id];
    sorted.forEach((box, i) => {
      const current = next.boxes[box.id];
      const moved = this.translatedLayout(box.id, command === "align" ? current.x : first.x + i * (last.x - first.x) / (sorted.length - 1), command === "align" ? first.y : current.y);
      for (const candidate of this.projection.boxes) if (moved.boxes[candidate.id].x !== this.layoutValue.boxes[candidate.id].x || moved.boxes[candidate.id].y !== this.layoutValue.boxes[candidate.id].y) next.boxes[candidate.id] = moved.boxes[candidate.id];
    });
    if (emit(this, "move-request", { boxId: sorted[0].id, position: next.boxes[sorted[0].id], boxIds: sorted.map(box => box.id), positions: next.boxes })) this.commitLayout(next);
  }
  protected setupListeners(): void {
    const toolbar = this.shadowRoot!.querySelector("[part=toolbar]")!;
    for (const [command, label] of [
      ["connect", "Connect selected"],
      ["delete", "Delete selected"],
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.command = command;
      button.textContent = label;
      toolbar.append(button);
    }
    this.shadowRoot!.querySelector("[part=toolbar]")!.addEventListener(
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
    canvas.addEventListener("keydown", (event) => this.onKey(event));
    canvas.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        if (event.ctrlKey || event.metaKey)
          this.zoomBy(Math.exp(-event.deltaY * 0.01));
        else {
          this.viewport.x -= event.deltaX;
          this.viewport.y -= event.deltaY;
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
      if (scale > 0)
        this.zoomBy((this.gestureZoom * scale) / this.viewport.zoom);
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
      const bounds = this.bounds();
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
    if (
      (event.target as HTMLElement).closest(
        "input,textarea,select,[contenteditable]",
      )
    )
      return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      if (this.locked || !(event.shiftKey ? this.history.canRedo : this.history.canUndo)) return;
      event.preventDefault();
      if (event.shiftKey) this.redo();
      else this.undo();
      return;
    }
    if (event.key === "Escape") {
      this.connecting = null;
      this.portDrag = undefined; this.marquee = undefined; this.segmentDrag = undefined; this.drag = undefined; this.pointers.clear(); this.refresh();
      this.setStatus("Connecting cancelled");
      return;
    }
    const box = this.selected;
    if (!box || this.locked) return;
    if (event.key === "Enter" || event.key === " ") return;
    if (event.key.toLowerCase() === "c" && !this.disableConnections) {
      event.preventDefault();
      this.connecting = box.id;
      this.setStatus(`Select the next box to connect from ${box.title}`);
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      this.selectionCommand("delete-many");
    }
    const direction = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    }[event.key];
    if (direction) {
      event.preventDefault();
      const pos = this.layoutValue.boxes[box.id];
      const distance = event.shiftKey ? 100 : this.snapToGrid ? 20 : 10;
      this.move(
        box.id,
        pos.x + direction[0] * distance,
        pos.y + direction[1] * distance,
      );
      this.focusBox(box.id);
    }
  }
  private pointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    this.suppressClick = false;
    if (this.portDrag || this.segmentDrag || this.marquee) return;
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
      this.pinchDistance = this.distance();
      this.refresh();
      return;
    }
    const target = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-box-id]",
    );
    const id = target?.dataset.boxId;
    const canvas =
      this.shadowRoot!.querySelector<HTMLElement>("[part=canvas]")!;
    if (id && !this.selectedIds.has(id) && !event.shiftKey) this.select(id);
    if (!id && event.shiftKey && !this.locked) { const point = this.canvasPoint(event); this.marquee = { pointerId: event.pointerId, start: point, point }; canvas.setPointerCapture?.(event.pointerId); event.preventDefault(); return; }
    this.drag = {
      id: this.locked ? undefined : id,
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
    const gesture = this.portDrag ?? this.segmentDrag ?? this.marquee;
    if (gesture && gesture.pointerId !== event.pointerId) return;
    const point = this.canvasPoint(event);
    if (this.portDrag) {
      this.portDrag.point = point;
      let ghost = this.shadowRoot!.querySelector<SVGPolylineElement>('[part=connection-preview]');
      if (!ghost) { ghost = svgElement("polyline"); ghost.setAttribute("part", "connection-preview"); ghost.style.cssText = "fill:none;stroke:var(--boe-token-surface-surface-brand,#0061d5);stroke-width:3"; this.shadowRoot!.querySelector('[part=lines]')!.append(ghost); }
      const start = this.portDrag.start; ghost.setAttribute("points", `${start.x},${start.y} ${point.x},${start.y} ${point.x},${point.y}`); return;
    }
    if (this.segmentDrag) {
      const { index, points } = this.segmentDrag;
      if (points[index].x === points[index + 1].x) points[index].x = points[index + 1].x = point.x;
      else points[index].y = points[index + 1].y = point.y;
      const path = Array.from(this.shadowRoot!.querySelectorAll<SVGPolylineElement>('[part=line]')).find(path => path.dataset.lineId === this.segmentDrag!.id);
      path?.setAttribute("points", points.map(p => `${p.x},${p.y}`).join(" ")); return;
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
      if (this.pinchDistance) this.zoomBy(distance / this.pinchDistance);
      this.pinchDistance = distance;
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
        const position = this.alignedPoint(this.drag.id, this.drag.position.x + dx / this.viewport.zoom, this.drag.position.y + dy / this.viewport.zoom);
        element.style.left = `${position.x}px`;
        element.style.top = `${position.y}px`;
        this.markDropLine(point, this.drag.id);
      }
    } else {
      this.viewport.x = this.drag.panX + dx;
      this.viewport.y = this.drag.panY + dy;
      this.paintViewport();
    }
  }
  private pointerEnd(event: PointerEvent, commit: boolean): void {
    const gesture = this.portDrag ?? this.segmentDrag ?? this.marquee;
    if (gesture && gesture.pointerId !== event.pointerId) return;
    const point = this.canvasPoint(event);
    if (this.portDrag) {
      const port = this.portDrag; this.portDrag = undefined;
      this.shadowRoot!.querySelector('[part=connection-preview]')?.remove();
      if (commit) {
        if (Math.hypot(point.x - port.start.x, point.y - port.start.y) < 8) {
          const pos = this.layoutValue.boxes[port.id];
          const offsets = { east: [320, 0], west: [-320, 0], north: [0, -170], south: [0, 170] }[port.side];
          this.openChooser({ type: "add", from: port.id, fromSide: port.side, position: { x: pos.x + offsets[0], y: pos.y + offsets[1] } });
        } else {
          const target = this.boxAt(point, port.id);
          if (target) this.requestEdit({ type: "connect", from: port.id, to: target.id, fromSide: port.side });
        }
      }
      return;
    }
    if (this.segmentDrag) { const segment = this.segmentDrag; this.segmentDrag = undefined; if (commit) this.routeLine(segment.id, segment.points.slice(1, -1)); else this.refresh(); return; }
    if (this.marquee) {
      const { start } = this.marquee; this.marquee = undefined;
      if (commit) this.selectMany(this.projection.boxes.filter(box => { const p = this.layoutValue.boxes[box.id]; return p.x < Math.max(start.x, point.x) && p.x + (p.width ?? 220) > Math.min(start.x, point.x) && p.y < Math.max(start.y, point.y) && p.y + (p.height ?? 96) > Math.min(start.y, point.y); }).map(box => box.id));
      this.shadowRoot!.querySelector('[part=marquee]')?.remove(); this.pointers.delete(event.pointerId); return;
    }
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.delete(event.pointerId);
    const drag = this.drag;
    this.drag = undefined;
    this.pinchDistance = 0;
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
          const shiftX = this.snapToGrid ? Math.round((primary.x + dx) / 20) * 20 - primary.x : dx;
          const shiftY = this.snapToGrid ? Math.round((primary.y + dy) / 20) * 20 - primary.y : dy;
          for (const id of moved) next.boxes[id] = { ...next.boxes[id], x: next.boxes[id].x + shiftX, y: next.boxes[id].y + shiftY };
          if (emit(this, "move-request", { boxId: drag.id, position: next.boxes[drag.id], boxIds: [...moved], positions: next.boxes })) this.commitLayout(next);
        } else this.move(drag.id, position.x, position.y);
      }
      else if (!commit) this.refresh();
    }
    this.shadowRoot!.querySelectorAll('[part=guide],[part=measure]').forEach(element => element.remove());
    this.markDropLine(undefined);
    if (drag?.id && (!commit || Math.hypot(event.clientX - drag.x, event.clientY - drag.y) > 4)) this.refresh();
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
      const p = this.layoutValue.boxes[box.id]; return point.x >= p.x - 12 && point.x <= p.x + (p.width ?? 220) + 12 && point.y >= p.y - 12 && point.y <= p.y + (p.height ?? 96) + 12;
    });
  }
  private lineAt(point: { x: number; y: number }, except?: string) {
    return this.projection.lines.find(line => line.from !== except && line.to !== except && nearProcessLine(point, this.routedLines.get(line.id) ?? [], 16 / this.viewport.zoom));
  }
  private markDropLine(point?: { x: number; y: number }, except?: string): void {
    this.dropLine = point ? this.lineAt(point, except)?.id : undefined;
    this.shadowRoot!.querySelectorAll<SVGElement>('[part=line]').forEach(path => path.dataset.drop = String(path.dataset.lineId === this.dropLine));
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
          guide.style.cssText = axis === "x" ? `left:${x}px;top:${Math.min(y, p.y)}px;width:1px;height:${Math.abs(y - p.y) + 96}px` : `left:${Math.min(x, p.x)}px;top:${y}px;height:1px;width:${Math.abs(x - p.x) + 220}px`; world.append(guide);
        }
      }
      if (Math.abs(y - p.y) < 8) {
        const distance = x - p.x - (p.width ?? 220);
        if (distance > 0) { const measure = document.createElement("span"); measure.setAttribute("part", "measure"); measure.textContent = `${Math.round(distance)}px`; measure.style.cssText = `left:${p.x + (p.width ?? 220)}px;top:${y + 40}px`; world.append(measure); }
      }
    }
    return { x, y };
  }
  private openChooser(edit: ProcessEdit): void {
    this.insertion = edit;
    const chooser = this.shadowRoot!.querySelector<HTMLDialogElement>('[part=insert-chooser]')!;
    const picker = chooser.querySelector<KindPicker>('box-kind-picker')!; picker.catalog = this.catalog; picker.refresh(); promoteModal(chooser); picker.focus();
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
    this.selectedIds = new Set([...this.selectedIds].filter(id => this.projection.boxes.some(box => box.id === id)));
    if (!this.selectedId) this.selectedId = this.selectedIds.values().next().value ?? null;
    const serialized = JSON.stringify({
      boxes: this.projection.boxes.map(box => ({ id: box.id, kind: box.kind, title: box.title, description: box.description, path: box.path, fingerprint: box.fingerprint, frame: box.frame, parentId: box.parentId })),
      lines: this.projection.lines,
    });
    if (serialized !== this.lastProjection || this.documentValue !== this.lastDocument) {
      if (this.lastProjection) this.versionValue = typeof this.versionValue === "number" ? this.versionValue + 1 : `${this.versionValue}+1`;
      this.lastProjection = serialized;
      this.lastDocument = this.documentValue;
      emit(this, "projection-changed", { projection: this.projection, version: this.versionValue, checks: this.allChecks });
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
    if (focused) this.focusBox(focused);
  }
  private get allChecks(): readonly ProcessCheck[] { return this.computedChecks; }
  private collectChecks(): readonly ProcessCheck[] {
    const routes = this.projection.lines.filter(line => !this.routedLines.get(line.id)?.length)
      .map(line => ({ message: "A connection is blocked by overlapping steps. Move a step or adjust its route.", boxId: line.from }));
    return [...this.checks, ...graphChecks(this.projection), ...routes, ...(this.documentValue === undefined ? [] : this.model.validate?.(this.documentValue, this.projection) ?? [])];
  }
  private renderWorld(): void {
    const world = this.shadowRoot!.querySelector<HTMLElement>("[part=world]")!;
    world.replaceChildren();
    for (const section of this.layoutValue.sections ?? []) {
      const element = document.createElement("div");
      element.setAttribute("part", "section");
      element.textContent = section.title;
      this.place(element, section);
      world.append(element);
    }
    for (const box of [...this.projection.boxes].sort(
      (a, b) => Number(Boolean(b.frame)) - Number(Boolean(a.frame)),
    )) {
      const element = document.createElement("div");
      element.tabIndex = 0;
      element.setAttribute("role", "group");
      element.setAttribute("part", box.frame ? "frame" : "box");
      element.dataset.boxId = box.id;
      element.setAttribute(
        "aria-label",
        [box.title, box.description, box.frame ? "Frame" : ""]
          .filter(Boolean)
          .join(". "),
      );
      element.setAttribute("aria-current", String(this.selectedIds.has(box.id)));
      this.place(element, this.layoutValue.boxes[box.id]);
      const kind = this.catalog.find((kind) => kind.kind === box.kind);
      if (kind?.icon) {
        const icon = document.createElement("span");
        icon.setAttribute("part", "icon");
        icon.setAttribute("aria-hidden", "true");
        icon.append(kind.icon());
        element.append(icon);
      }
      const title = document.createElement("strong");
      title.textContent = box.title;
      element.append(title);
      if (box.description) {
        const description = document.createElement("small");
        description.textContent = box.description;
        element.append(description);
      }
      element.addEventListener("keydown", event => {
        if (event.target === element && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); element.click(); }
      });
      element.addEventListener("click", event => {
        if (this.suppressClick && event.detail !== 0) { this.suppressClick = false; return; }
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
      if (!this.disableConnections && !this.locked) {
        for (const side of ["north", "east", "south", "west"] as const) {
          const port = document.createElement("button"); port.type = "button"; port.setAttribute("part", "port"); port.dataset.side = side; port.dataset.owner = box.id;
          port.setAttribute("aria-label", `Add or connect a step ${side} of ${box.title}`);
          port.addEventListener("click", event => {
            event.stopPropagation();
            if (!event.detail) {
              const pos = this.layoutValue.boxes[box.id]; const offsets = { east: [320, 0], west: [-320, 0], north: [0, -170], south: [0, 170] }[side];
              this.openChooser({ type: "add", from: box.id, fromSide: side, position: { x: pos.x + offsets[0], y: pos.y + offsets[1] } });
            }
          });
          element.append(port);
        }
      }
      world.append(element);
    }
    const lines = svgElement("svg");
    lines.setAttribute("part", "lines");
    lines.setAttribute("aria-hidden", "true");
    world.append(lines);
    for (const line of this.projection.lines) {
      const points = this.routedLines.get(line.id)!;
      if (!points.length) continue;
      const midpoint = lineMidpoint(points);
      const path = svgElement("polyline");
      path.setAttribute("part", "line");
      path.dataset.lineId = line.id;
      path.setAttribute("vector-effect", "non-scaling-stroke");
      path.setAttribute(
        "points",
        points
          .map((point) => `${point.x},${point.y}`)
          .join(" "),
      );
      if (line.dashed) path.setAttribute("stroke-dasharray", "6 4");
      lines.append(path);
      for (let i = 1; i < points.length - 2; i++) {
        const hit = svgElement("polyline"); hit.setAttribute("part", "line-hit"); hit.dataset.lineId = line.id; hit.dataset.segment = String(i);
        hit.setAttribute("vector-effect", "non-scaling-stroke");
        hit.setAttribute("points", `${points[i].x},${points[i].y} ${points[i + 1].x},${points[i + 1].y}`); lines.append(hit);
      }
      const label = document.createElement("div");
      label.setAttribute("part", "connection");
      label.style.left = `${midpoint.x}px`;
      label.style.top = `${midpoint.y}px`;
      const names = `${this.projection.boxes.find((box) => box.id === line.from)!.title} to ${this.projection.boxes.find((box) => box.id === line.to)!.title}${line.label ? `, ${line.label}` : ""}`;
      const text = document.createElement("span");
      const source = this.projection.boxes.find(box => box.id === line.from)!;
      const branchIndex = this.projection.lines.filter(candidate => candidate.from === line.from).indexOf(line);
      text.textContent = line.label ?? (line.weight !== undefined ? String(line.weight) : /decision/i.test(source.kind) ? ["Yes", "No"][branchIndex] ?? `Route ${branchIndex + 1}` : /try/i.test(source.kind) && line.dashed ? "If it fails" : "");
      label.append(text);
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
            this.openChooser(edit);
          } else this.requestEdit(edit);
        });
        actions.append(button);
      }
      world.append(label);
    }
    for (const note of this.layoutValue.notes ?? []) {
      const element = document.createElement("div");
      element.setAttribute("part", "note");
      element.textContent = note.text;
      this.place(element, { ...note, width: 180, height: 80 });
      world.append(element);
    }
  }
  private place(element: HTMLElement, position: BoxPosition): void {
    Object.assign(element.style, {
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${position.width ?? 220}px`,
      height: `${position.height ?? 96}px`,
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
      `${kind.label} ${kind.description} ${kind.group ?? ""}`
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
      button.textContent = kind.label;
      button.disabled = this.locked;
      button.draggable = !this.locked;
      button.addEventListener("click", () =>
        this.requestEdit({ type: "add", kind }),
      );
      button.addEventListener("dragstart", (event) =>
        event.dataTransfer?.setData("application/boe-process-kind", kind.kind),
      );
      choices.append(button);
    }
    const canvas =
      this.shadowRoot!.querySelector<HTMLElement>("[part=canvas]")!;
    canvas.ondragover = (event) => {
      if (!this.locked) { event.preventDefault(); this.markDropLine(this.canvasPoint(event)); }
    };
    canvas.ondragleave = () => this.markDropLine(undefined);
    canvas.ondrop = (event) => {
      event.preventDefault();
      const kind = this.catalog.find(
        (kind) =>
          kind.kind ===
          event.dataTransfer?.getData("application/boe-process-kind"),
      );
      if (!kind || this.locked) return;
      const position = this.canvasPoint(event);
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
    this.allChecks.forEach((check) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = check.message;
      const box = this.projection.boxes.find(
        (box) =>
          box.id === check.boxId ||
          (check.path &&
            JSON.stringify(box.path) === JSON.stringify(check.path)),
      );
      button.addEventListener("click", () => {
        if (box) {
          this.select(box.id);
          this.focusBox(box.id);
        }
        this.setStatus(check.message);
      });
      checks.append(button);
    });
  }
  private renderSelection(): void {
    if (!this.isRendered) return;
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
    this.shadowRoot!.querySelector<HTMLElement>("[part=palette]")!.hidden = false;
    this.shadowRoot!.querySelector<HTMLElement>('[part=selection-toolbar]')!.hidden = this.selectedIds.size === 0;
    this.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part=selection-toolbar] button').forEach((button, index) => button.disabled = this.locked || (index < 2 && this.selectedIds.size < 2));
    this.renderPane();
    if (
      this.inspected === selected?.node &&
      this.inspectedId === selected?.id &&
      editor.querySelector(`[part=inspector-heading]`)?.tagName === `H${this.headingLevel}`
    ) {
      editor.querySelector("[part=inspector-heading]")!.textContent = selected?.title ?? "";
      return;
    }
    this.cleanupInspector?.();
    this.cleanupInspector = undefined;
    editor.replaceChildren();
    this.inspected = selected?.node;
    this.inspectedId = selected?.id;
    if (selected) {
      const heading = document.createElement(`h${this.headingLevel}`);
      heading.setAttribute("part", "inspector-heading");
      heading.textContent = selected.title;
      editor.append(heading);
      this.cleanupInspector =
        this.renderer?.(selected.node, editor) || undefined;
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
    button("connect").disabled = !this.selected || this.locked || this.disableConnections;
    button("delete").disabled = !this.selected || this.locked;
    button("lock").setAttribute("aria-pressed", String(this.locked));
    button("snap").setAttribute("aria-pressed", String(this.snapToGrid));
  }
  private paintViewport(): void {
    this.shadowRoot!.querySelector<HTMLElement>(
      "[part=world]",
    )!.style.transform =
      `translate(${this.viewport.x}px,${this.viewport.y}px) scale(${this.viewport.zoom})`;
    this.shadowRoot!.querySelectorAll<HTMLElement>('[part=port]').forEach(port => port.style.transform = `scale(${1 / this.viewport.zoom})`);
    this.shadowRoot!.querySelector("[data-command=reset]")!.textContent =
      `${Math.round(this.viewport.zoom * 100)}%`;
    const minimap =
      this.shadowRoot!.querySelector<SVGSVGElement>("[part=minimap]")!;
    const bounds = this.bounds();
    minimap.replaceChildren();
    minimap.setAttribute(
      "viewBox",
      `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`,
    );
    minimap.setAttribute("preserveAspectRatio", "none");
    this.projection.boxes.forEach((box) => {
      const pos = this.layoutValue.boxes[box.id];
      const rect = svgElement("rect");
      rect.setAttribute("x", String(pos.x));
      rect.setAttribute("y", String(pos.y));
      rect.setAttribute("width", String(pos.width ?? 220));
      rect.setAttribute("height", String(pos.height ?? 96));
      minimap.append(rect);
    });
    const canvas =
      this.shadowRoot!.querySelector<HTMLElement>("[part=canvas]")!;
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
    minimap.append(viewport);
  }
  private focusBox(id: string): void {
    Array.from(this.shadowRoot!.querySelectorAll<HTMLElement>("[data-box-id]"))
      .find((box) => box.dataset.boxId === id)
      ?.focus();
  }
  private setStatus(message: string): void {
    this.shadowRoot!.querySelector("[part=status]")!.textContent = message;
  }
}
ProcessModeler.register();
