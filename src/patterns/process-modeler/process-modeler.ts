import { BaseElement } from "../../core/index.js";
import { announce } from "../../foundations/a11y/index.js";
import { boeFocusVisibleStyles } from "../../foundations/tokens/interaction.js";
import type { FlowKind, NodePath } from "../flow-builder/model.js";
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
    return ["locked", "snap-to-grid"];
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
    this.cleanupInspector?.();
    this.cleanupInspector = undefined;
    this.inspected = undefined;
    this.pointers.clear();
    this.drag = undefined;
  }
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
    this.selectedId = id;
    this.renderSelection();
    if (this.isRendered) this.updateToolbar();
    emit(this, "selection-changed", { box: this.selected });
  }
  setValidation(checks: readonly ProcessCheck[]): void {
    this.checks = checks;
    this.refresh();
  }
  setValidationAtPath(message: string, path: NodePath): void {
    this.setValidation(message ? [{ message, path }] : []);
  }
  requestEdit(edit: ProcessEdit): void {
    if (this.locked) return;
    const before = this.layout;
    const previousIds = new Set(this.projection.boxes.map((box) => box.id));
    let accepted = false;
    const request: ProcessEditRequest = {
      ...edit,
      accept: (command) => {
        if (accepted) return;
        accepted = true;
        this.refresh();
        if (
          edit.position &&
          Number.isFinite(edit.position.x) &&
          Number.isFinite(edit.position.y)
        ) {
          const added = this.projection.boxes.find(
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
          emit(this, "layout-changed", { layout: this.layout });
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
          emit(this, "layout-changed", { layout: this.layout });
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
      emit(this, "layout-changed", { layout: this.layout });
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
      completeLayout(this.projection, { ...this.layout, boxes: {} }),
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
      [part=layout]{display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,280px);gap:16px}
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
      [part=inspector]{min-width:0;padding:12px;border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:12px;background:var(--boe-token-surface-surface,#fff)}
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
        else if (command === "connect" && this.selected && !this.locked) {
          this.connecting = this.selected.id;
          this.setStatus(
            `Select the next box to connect from ${this.selected.title}`,
          );
        } else if (command === "delete" && this.selected)
          this.requestEdit({ type: "delete", boxId: this.selected.id });
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
      event.preventDefault();
      if (event.shiftKey) this.redo();
      else this.undo();
      return;
    }
    if (event.key === "Escape") {
      this.connecting = null;
      this.setStatus("Connecting cancelled");
      return;
    }
    const box = this.selected;
    if (!box || this.locked) return;
    if (event.key.toLowerCase() === "c") {
      event.preventDefault();
      this.connecting = box.id;
      this.setStatus(`Select the next box to connect from ${box.title}`);
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      this.requestEdit({ type: "delete", boxId: box.id });
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
    if (
      event.button !== 0 ||
      (event.target as HTMLElement).closest("[part=connection]")
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
    (target ?? canvas).setPointerCapture?.(event.pointerId);
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
    if (this.drag.id && this.drag.position) {
      const element = Array.from(
        this.shadowRoot!.querySelectorAll<HTMLElement>("[data-box-id]"),
      ).find((box) => box.dataset.boxId === this.drag!.id);
      if (element) {
        element.style.left = `${this.drag.position.x + dx / this.viewport.zoom}px`;
        element.style.top = `${this.drag.position.y + dy / this.viewport.zoom}px`;
      }
    } else {
      this.viewport.x = this.drag.panX + dx;
      this.viewport.y = this.drag.panY + dy;
      this.paintViewport();
    }
  }
  private pointerEnd(event: PointerEvent, commit: boolean): void {
    this.pointers.delete(event.pointerId);
    const drag = this.drag;
    this.drag = undefined;
    this.pinchDistance = 0;
    if (drag?.id && drag.position) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (commit && Math.hypot(dx, dy) > 4)
        this.move(
          drag.id,
          drag.position.x + dx / this.viewport.zoom,
          drag.position.y + dy / this.viewport.zoom,
        );
      else if (!commit) this.refresh();
    }
  }
  protected update(): void {
    if (this.documentValue !== undefined) {
      this.projection = this.model.project(this.documentValue);
      validateProjection(this.projection);
    } else this.projection = { boxes: [], lines: [] };
    this.layoutValue = completeLayout(this.projection, this.layoutValue);
    if (this.selectedId && !this.selected) this.selectedId = null;
    const focused = (this.shadowRoot!.activeElement as HTMLElement | null)
      ?.dataset.boxId;
    this.renderWorld();
    this.renderPalette();
    this.renderChecks();
    this.renderSelection();
    this.paintViewport();
    this.updateToolbar();
    if (focused) this.focusBox(focused);
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
      const element = document.createElement("button");
      element.type = "button";
      element.setAttribute("part", box.frame ? "frame" : "box");
      element.dataset.boxId = box.id;
      element.setAttribute(
        "aria-label",
        [box.title, box.description, box.frame ? "Frame" : ""]
          .filter(Boolean)
          .join(". "),
      );
      element.setAttribute("aria-pressed", String(box.id === this.selectedId));
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
      element.addEventListener("click", () => {
        if (this.connecting && this.connecting !== box.id) {
          this.requestEdit({
            type: "connect",
            from: this.connecting,
            to: box.id,
          });
          this.connecting = null;
        }
        this.select(box.id);
      });
      world.append(element);
    }
    const lines = svgElement("svg");
    lines.setAttribute("part", "lines");
    lines.setAttribute("aria-hidden", "true");
    world.append(lines);
    for (const line of this.projection.lines) {
      const from = this.layoutValue.boxes[line.from];
      const to = this.layoutValue.boxes[line.to];
      const x1 = from.x + (from.width ?? 220) / 2;
      const y1 = from.y + (from.height ?? 96);
      const x2 = to.x + (to.width ?? 220) / 2;
      const y2 = to.y;
      const path = svgElement("polyline");
      path.setAttribute("part", "line");
      path.setAttribute(
        "points",
        [
          { x: x1, y: y1 },
          ...(this.layoutValue.lines?.[line.id] ?? line.points ?? []),
          { x: x2, y: y2 },
        ]
          .map((point) => `${point.x},${point.y}`)
          .join(" "),
      );
      if (line.dashed) path.setAttribute("stroke-dasharray", "6 4");
      lines.append(path);
      const label = document.createElement("div");
      label.setAttribute("part", "connection");
      label.style.left = `${(x1 + x2) / 2}px`;
      label.style.top = `${(y1 + y2) / 2}px`;
      const names = `${this.projection.boxes.find((box) => box.id === line.from)!.title} to ${this.projection.boxes.find((box) => box.id === line.to)!.title}${line.label ? `, ${line.label}` : ""}`;
      const text = document.createElement("span");
      text.textContent = line.label ?? "Connection";
      label.append(text);
      for (const [type, title] of [
        ["insert", "Insert a step here"],
        ["disconnect", "Remove connection"],
      ] as const) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = type === "insert" ? "+" : "Remove";
        button.setAttribute("aria-label", `${title}: ${names}`);
        button.disabled = this.locked;
        button.addEventListener("click", () =>
          this.requestEdit({
            type,
            lineId: line.id,
            from: line.from,
            to: line.to,
          }),
        );
        label.append(button);
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
        this.requestEdit({ type: "add", kind, position: { x: 40, y: 40 } }),
      );
      button.addEventListener("dragstart", (event) =>
        event.dataTransfer?.setData("application/boe-process-kind", kind.kind),
      );
      choices.append(button);
    }
    const canvas =
      this.shadowRoot!.querySelector<HTMLElement>("[part=canvas]")!;
    canvas.ondragover = (event) => {
      if (!this.locked) event.preventDefault();
    };
    canvas.ondrop = (event) => {
      event.preventDefault();
      const kind = this.catalog.find(
        (kind) =>
          kind.kind ===
          event.dataTransfer?.getData("application/boe-process-kind"),
      );
      if (!kind) return;
      const rect = canvas.getBoundingClientRect();
      this.requestEdit({
        type: "add",
        kind,
        position: {
          x: (event.clientX - rect.left - this.viewport.x) / this.viewport.zoom,
          y: (event.clientY - rect.top - this.viewport.y) / this.viewport.zoom,
        },
      });
    };
  }
  private renderChecks(): void {
    const checks = this.shadowRoot!.querySelector("[part=checks]")!;
    checks.replaceChildren();
    this.checks.forEach((check) => {
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
          "aria-pressed",
          String(element.dataset.boxId === this.selectedId),
        );
        const box = this.projection.boxes.find(
          (box) => box.id === element.dataset.boxId,
        )!;
        element.dataset.invalid = String(
          this.checks.some(
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
    if (
      this.inspected === selected?.node &&
      this.inspectedId === selected?.id &&
      editor.childNodes.length
    ) {
      editor.querySelector("h3")!.textContent = selected?.title ?? "";
      return;
    }
    this.cleanupInspector?.();
    this.cleanupInspector = undefined;
    editor.replaceChildren();
    this.inspected = selected?.node;
    this.inspectedId = selected?.id;
    if (selected) {
      const heading = document.createElement("h3");
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
    button("connect").disabled = !this.selected || this.locked;
    button("delete").disabled = !this.selected || this.locked;
    button("lock").setAttribute("aria-pressed", String(this.locked));
    button("snap").setAttribute("aria-pressed", String(this.snapToGrid));
  }
  private paintViewport(): void {
    this.shadowRoot!.querySelector<HTMLElement>(
      "[part=world]",
    )!.style.transform =
      `translate(${this.viewport.x}px,${this.viewport.y}px) scale(${this.viewport.zoom})`;
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
