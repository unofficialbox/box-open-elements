import { BaseElement } from "../../core/index.js";
import { Drawer } from "../../components/overlays/drawer.js";
import { announce } from "../../foundations/a11y/index.js";
import { defaultFlowModel, nodeAtPath, nodeDescription, nodeTitle, type FlowInsertDetail, type FlowKind, type FlowModel, type FlowNode, type FlowNodeBase, type NodePath } from "./model.js";
import { FLOW_SPINE_PARTS, FlowSpine, InsertPoint, KIND_PICKER_PARTS, KindPicker } from "./primitives.js";

export type InspectorRenderer<N extends FlowNodeBase = FlowNode> = (node: N, container: HTMLElement) => void | (() => void);

export interface ValidationOptions {
  /**
   * Show the message in the builder's own error line (default `true`). Pass
   * `false` when the host already shows the error persistently, so the
   * message isn't on screen twice; the step is still marked and announced.
   */
  showMessage?: boolean;
}

/**
 * Host-owned document editing with accessible navigation and responsive inspection.
 * `N` is the host's node type; it defaults to {@link FlowNode}, which the default
 * model reads. Hosts with their own document shape set {@link model}.
 */
export class FlowBuilder<N extends FlowNodeBase = FlowNode> extends BaseElement {
  static readonly tagName = "box-flow-builder";
  private nodesValue: N[] = [];
  private modelValue = defaultFlowModel as unknown as FlowModel<N>;
  private catalogValue: readonly FlowKind<N>[] = [];
  private selectedValue: N | null = null;
  private invalidValue: N | null = null;
  private renderer?: InspectorRenderer<N>;
  private cleanupInspector?: () => void;
  private inspected: N | null | undefined;
  private headingEl?: HTMLElement;
  private renderedRenderer?: InspectorRenderer<N>;
  private observer?: ResizeObserver;
  private narrow = false;
  private insertion?: FlowInsertDetail;
  private invoker?: InsertPoint;
  private spine!: FlowSpine;
  private palette!: KindPicker;
  private picker!: KindPicker;
  private popup!: HTMLElement;
  private aside!: HTMLElement;
  private inspector!: HTMLElement;
  private drawer!: Drawer;
  private error!: HTMLElement;

  static get observedAttributes(): string[] { return ["start-label", "end-label"]; }

  get nodes(): N[] { return this.nodesValue; }
  set nodes(value: N[]) { this.nodesValue = value; this.refresh(); }
  /** How to read the host document; defaults to `body` / `branches` ({@link FlowNode}). */
  get model(): FlowModel<N> { return this.modelValue; }
  set model(value: FlowModel<N>) { this.modelValue = value; this.refresh(); }
  /** Text above the first step (`start-label`). */
  get startLabel(): string { return this.getAttribute("start-label") ?? "Flow starts"; }
  set startLabel(value: string) { this.setAttribute("start-label", value); }
  /** Text below the last step (`end-label`). */
  get endLabel(): string { return this.getAttribute("end-label") ?? "Flow ends"; }
  set endLabel(value: string) { this.setAttribute("end-label", value); }
  get catalog(): readonly FlowKind<N>[] { return this.catalogValue; }
  set catalog(value: readonly FlowKind<N>[]) { this.catalogValue = value; this.refresh(); }
  get selected(): N | null { return this.selectedValue; }
  set selected(node: N | null) { this.select(node); }
  get renderInspector(): InspectorRenderer<N> | undefined { return this.renderer; }
  set renderInspector(renderer: InspectorRenderer<N> | undefined) { this.renderer = renderer; if (this.isRendered) this.updateInspector(); }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (oldValue !== newValue) this.refresh();
  }
  connectedCallback(): void {
    super.connectedCallback();
    if (typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(entries => this.setNarrow(entries[0].contentRect.width < 800));
      this.observer.observe(this);
    }
    this.setNarrow((this.getBoundingClientRect().width || this.ownerDocument.defaultView?.innerWidth || 1024) < 800);
  }
  disconnectedCallback(): void {
    this.observer?.disconnect();
    this.cleanupInspector?.(); this.cleanupInspector = undefined;
    this.inspected = undefined;
    this.closePicker(false);
    this.selectedValue = null;
    this.drawer.open = false;
  }
  private setNarrow(narrow: boolean): void {
    if (this.narrow === narrow) return;
    this.narrow = narrow;
    this.shadowRoot!.querySelector<HTMLElement>("[part=layout]")!.dataset.narrow = String(narrow);
    this.updateInspector();
  }
  protected renderTemplate(): void {
    this.shadowRoot!.innerHTML = `<style>
      :host{display:block;min-width:0;font:inherit;color:var(--boe-token-text-text,#222)}
      :host([hidden]){display:none!important}
      [part=layout]{display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,320px);gap:24px;align-items:start}
      [part=layout][data-narrow=true]{grid-template-columns:minmax(0,1fr)}
      aside{min-width:0;padding:16px;border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:12px;background:var(--boe-token-surface-surface,#fff)}
      [part=picker-popup]{position:fixed;z-index:1000;max-width:min(360px,calc(100vw - 24px));max-height:65vh;overflow:auto;padding:16px;background:var(--boe-token-surface-surface,#fff);border:1px solid var(--boe-token-stroke-stroke,#ddd);border-radius:12px;box-shadow:0 8px 32px #0003}
      [part=error]{color:var(--boe-token-text-status-text-error,#b92340);margin-bottom:16px;overflow-wrap:anywhere}
      [hidden]{display:none!important} h2{font:inherit;font-weight:650;margin:0 0 12px}
      </style><div part="error" hidden></div><div part="layout"><box-flow-spine exportparts="${FLOW_SPINE_PARTS.join(", ")}"></box-flow-spine><aside part="inspector"><box-kind-picker exportparts="${KIND_PICKER_PARTS.join(", ")}"></box-kind-picker><div part="editor"></div></aside></div><div part="picker-popup" hidden><box-kind-picker exportparts="${KIND_PICKER_PARTS.join(", ")}"></box-kind-picker></div><box-drawer position="bottom" size="large"></box-drawer>`;
    this.spine = this.shadowRoot!.querySelector("box-flow-spine")!;
    this.aside = this.shadowRoot!.querySelector("aside")!;
    this.palette = this.aside.querySelector("box-kind-picker")!;
    this.inspector = this.aside.querySelector("[part=editor]")!;
    this.popup = this.shadowRoot!.querySelector("[part=picker-popup]")!;
    this.picker = this.popup.querySelector("box-kind-picker")!;
    this.picker.variant = "menu";
    this.drawer = this.shadowRoot!.querySelector("box-drawer")!;
    this.error = this.shadowRoot!.querySelector("[part=error]")!;
  }
  protected setupListeners(): void {
    this.spine.addEventListener("node-select", event => this.select((event as CustomEvent<{ node: N }>).detail.node));
    this.spine.addEventListener("insert-request", event => {
      this.insertion = (event as CustomEvent<FlowInsertDetail>).detail;
      this.invoker = event.composedPath().find(item => item instanceof InsertPoint) as InsertPoint;
      const rect = this.invoker.getBoundingClientRect();
      this.popup.hidden = false;
      this.picker.catalog = this.catalog; this.picker.refresh();
      const viewport = this.ownerDocument.defaultView!;
      const popupRect = this.popup.getBoundingClientRect();
      this.popup.style.left = `${Math.max(12, Math.min(rect.left, viewport.innerWidth - popupRect.width - 12))}px`;
      this.popup.style.top = `${Math.max(12, Math.min(rect.bottom + 8, viewport.innerHeight - popupRect.height - 12))}px`;
      this.picker.focus();
    });
    this.picker.addEventListener("picker-cancel", () => this.closePicker(true));
    this.picker.addEventListener("focusout", event => {
      const next = (event as FocusEvent).relatedTarget;
      if (next instanceof Node && (this.picker.contains(next) || this.picker.shadowRoot?.contains(next))) return;
      this.closePicker(false);
    });
    this.picker.addEventListener("kind-pick", event => {
      const insertion = this.insertion;
      if (!insertion) return;
      this.insert((event as CustomEvent<{ kind: FlowKind<N> }>).detail.kind, insertion);
    });
    this.palette.addEventListener("kind-pick", event => this.insert((event as CustomEvent<{ kind: FlowKind<N> }>).detail.kind, { list: this.nodes, index: this.nodes.length, label: "Append to flow" }));
    this.drawer.addEventListener("open-changed", event => {
      if (!(event as CustomEvent<{ open: boolean }>).detail.open && this.narrow && this.selectedValue) this.select(null);
    });
  }
  private closePicker(restoreFocus: boolean): void {
    if (!this.popup) return;
    this.popup.hidden = true; this.insertion = undefined;
    if (restoreFocus) this.invoker?.focus();
  }
  private insert(kind: FlowKind<N>, insertion: FlowInsertDetail): void {
    const node = kind.create();
    insertion.list.splice(insertion.index, 0, node);
    this.closePicker(false);
    this.selectedValue = this.narrow ? null : node;
    this.refresh();
    // Keep the newly inserted card visible on small screens; explicit selection opens editing.
    this.spine.focusNode(node);
    announce(`Added ${nodeTitle(node, this.catalog, this.model)}`, "polite", this.ownerDocument);
    this.dispatchEvent(new CustomEvent("flow-changed", { detail: { nodes: this.nodes, node, reason: "insert" }, bubbles: true, composed: true }));
  }
  select(node: N | null): void {
    this.selectedValue = node;
    if (this.isRendered) { this.spine.select(node, this.invalidValue); this.updateInspector(); }
    this.dispatchEvent(new CustomEvent("selection-changed", { detail: { node }, bubbles: true, composed: true }));
  }
  /** Mark validation without opening a sheet over the error on a narrow screen. */
  setValidation(message: string, path: NodePath = [], document: unknown = { body: this.nodes }, options: ValidationOptions = {}): void {
    this.invalidValue = message ? nodeAtPath(document, path) as N | null : null;
    const show = options.showMessage ?? true;
    this.error.textContent = show ? message : ""; this.error.hidden = !message || !show;
    this.spine.select(this.selected, this.invalidValue);
    if (message) {
      if (!this.narrow && this.invalidValue) this.select(this.invalidValue);
      else if (this.narrow) this.select(null);
      announce(message, "assertive", this.ownerDocument);
    }
  }
  refresh(): void { if (this.isRendered) this.update(); }
  /**
   * Re-render one step's card and the inspector heading after the host edits
   * its fields. Structural edits (adding, removing, moving steps) need
   * {@link refresh}.
   */
  refreshNode(node: N): void {
    if (!this.isRendered) return;
    this.spine.refreshNode(node);
    if (node === this.selected) {
      const title = nodeTitle(node, this.catalog, this.model);
      if (this.headingEl) this.headingEl.textContent = title;
      this.drawer.heading = title;
    }
  }
  protected update(): void {
    this.spine.nodes = this.nodes; this.spine.catalog = this.catalog; this.spine.model = this.model;
    this.spine.startLabel = this.startLabel; this.spine.endLabel = this.endLabel;
    this.spine.selected = this.selected; this.spine.invalid = this.invalidValue; this.spine.refresh();
    this.palette.catalog = this.catalog; this.palette.refresh();
    this.updateInspector();
  }
  private updateInspector(): void {
    this.aside.hidden = this.narrow;
    this.palette.hidden = Boolean(this.selected);
    const target = this.narrow ? this.drawer : this.aside;
    if (this.inspector.parentElement !== target) target.append(this.inspector);
    if (this.inspected === this.selected && this.renderedRenderer === this.renderer) {
      this.drawer.open = this.narrow && Boolean(this.selected);
      return;
    }
    this.cleanupInspector?.(); this.cleanupInspector = undefined;
    this.inspector.replaceChildren();
    this.inspected = this.selected;
    this.renderedRenderer = this.renderer;
    if (this.selected) {
      const heading = document.createElement("h2"); heading.setAttribute("part", "inspector-heading"); heading.textContent = nodeTitle(this.selected, this.catalog, this.model); this.inspector.append(heading); this.headingEl = heading;
      if (this.renderer) this.cleanupInspector = this.renderer(this.selected, this.inspector) || undefined;
      else { const description = document.createElement("p"); description.textContent = nodeDescription(this.selected, this.catalog, this.model) || "Select a step to inspect its configuration."; this.inspector.append(description); }
      this.drawer.heading = nodeTitle(this.selected, this.catalog, this.model);
    }
    this.drawer.open = this.narrow && Boolean(this.selected);
  }
}
FlowBuilder.register();
