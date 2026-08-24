import { isLineageNodeRecord, resolveLineageDeviation } from "./types.js";
import type { LineageNode } from "./types.js";
import { computeVersionGraphLayout } from "../versions/graph-layout.js";
import { hasEndArrow, hasStartArrow, resolveGraphArrows } from "../versions/graph-arrows.js";
import type { GraphArrows } from "../versions/graph-arrows.js";
import { formatItemDate } from "../content-explorer/adapters/item-summary.js";
import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-lineage-graph";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const LANE_WIDTH = 26;
const ROW_HEIGHT = 56;
const EDGE_PAD = 8;
/**
 * How far short of a node's centre an edge stops.
 *
 * The arrowhead marks the path's end vertex, so an edge running to the centre
 * would bury its head under the node disc. The largest node here is ~1.05rem
 * across, so backing off 9px leaves the head just clear of the biggest one.
 */
const NODE_EDGE_OFFSET = 9;

const DEVIATION_LABELS: Record<string, string> = {
  none: "in sync",
  minor: "minor deviation",
  major: "major deviation",
};

const elementStyles = `
        [hidden] {
          display: none !important;
        }

        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        section[part="panel"] {
          display: grid;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: ${boePanel.background};
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="graph"] {
          position: relative;
          overflow-x: auto;
        }

        [part="edges"] {
          position: absolute;
          inset-block-start: 0;
          inset-inline-start: 0;
          pointer-events: none;
        }

        /* The arrowhead. Same colour as the stroke it terminates, stated
           rather than inherited: context-stroke is not supported everywhere. */
        [part="edge-arrow"] {
          fill: color-mix(in srgb, var(--boe-token-text-text-secondary, #6f6f6f) 45%, transparent);
          stroke: none;
        }

        [part="edge-arrow"][data-deviation="minor"] {
          fill: color-mix(in srgb, var(--boe-token-surface-status-surface-warning, #f5b31b) 75%, transparent);
        }

        [part="edge-arrow"][data-deviation="major"] {
          fill: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 70%, transparent);
        }

        [part="edge"] {
          fill: none;
          stroke: color-mix(in srgb, var(--boe-token-text-text-secondary, #6f6f6f) 45%, transparent);
          stroke-width: 2;
        }

        [part="edge"][data-deviation="minor"] {
          stroke: color-mix(in srgb, var(--boe-token-surface-status-surface-warning, #f5b31b) 75%, transparent);
        }

        [part="edge"][data-deviation="major"] {
          stroke: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 70%, transparent);
        }

        [part="rows"] {
          list-style: none;
          margin: 0;
          padding: 0;
          position: relative;
        }

        [part="row"] {
          position: relative;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.45rem;
          block-size: ${ROW_HEIGHT}px;
          border-radius: ${boeRadius.med};
        }

        [part="node"] {
          position: absolute;
          inset-block-start: 50%;
          transform: translate(-50%, -50%);
          appearance: none;
          padding: 0;
          inline-size: 0.9rem;
          block-size: 0.9rem;
          border-radius: 999px;
          border: 2px solid var(--boe-token-text-text-secondary, #6f6f6f);
          background: var(--boe-token-surface-surface, #ffffff);
          cursor: pointer;
        }

        [part="node"][data-kind="clause"] {
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          background: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="node"][data-kind="template"] {
          border-radius: ${boeRadius.size};
        }

        [part="node"][data-kind="contract"] {
          background: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="node"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 45%, transparent);
        }

        [part="row-label"] {
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="kind"] {
          display: inline-flex;
          padding: 0.1rem 0.4rem;
          border-radius: 999px;
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: capitalize;
        }

        [part="row-meta"] {
          font-size: 0.78rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="edge-chip"] {
          appearance: none;
          font: inherit;
          font-size: 0.74rem;
          font-weight: 600;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 60%, transparent);
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="edge-chip"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="edge-chip"][data-deviation="minor"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-warning, #f5b31b) 55%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-warning, #f5b31b) 46%, black 54%);
        }

        [part="edge-chip"][data-deviation="major"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 45%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 74%, black 26%);
        }

        [part="edge-chip"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="empty"] {
          padding: ${boePanel.padding};
          border-radius: ${boeRadius.large};
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }
      `;

/**
 * Provenance DAG for clause lineage (opportunity 2): source clause →
 * template versions → executed contracts, laid out by the versions
 * pattern's `computeVersionGraphLayout` and rendered with tone-coloured
 * deviation edges. Every node is an HTML button (`node-selected`), and every
 * derivation edge is ALSO a per-row chip button (`edge-selected` with the
 * parent/child pair — the diff viewer's input), so edge activation is
 * keyboard-accessible without SVG hit targets: the row rail is the
 * accessible contract, the SVG is presentation.
 */
export class LineageGraph extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["arrows", "heading", "nodes"];
  }

  /**
   * Which ends of each edge carry an arrowhead. Defaults to `end`, the head on
   * the derived node, because the layout builds edges source → derived.
   */
  get arrows(): GraphArrows {
    return resolveGraphArrows(this.getAttribute("arrows"));
  }

  set arrows(value: GraphArrows) {
    this.setAttribute("arrows", value);
  }

  private nodesValue: LineageNode[] = [];

  private rovingId: string | null = null;

  private hostEl!: HTMLElement;

  get heading(): string {
    return this.getAttribute("heading") ?? "Clause lineage";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get nodes(): LineageNode[] {
    return this.nodesValue;
  }

  set nodes(value: LineageNode[]) {
    this.nodesValue = Array.isArray(value) ? value.filter(isLineageNodeRecord) : [];
    if (this.rovingId && !this.nodesValue.some(node => node.id === this.rovingId)) {
      this.rovingId = null;
    }
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "nodes") {
      this.nodesValue = this.parseNodesAttribute(newValue);
      if (this.rovingId && !this.nodesValue.some(node => node.id === this.rovingId)) {
        this.rovingId = null;
      }
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private parseNodesAttribute(raw: string | null): LineageNode[] {
    if (!raw) {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isLineageNodeRecord) : [];
    } catch {
      return [];
    }
  }

  private getNode(id: string): LineageNode | undefined {
    return this.nodesValue.find(node => node.id === id);
  }

  private nodeButtons(): HTMLButtonElement[] {
    return Array.from(this.hostEl.querySelectorAll('[part="node"]')) as HTMLButtonElement[];
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <div part="content-host"></div>
    `;
    this.hostEl = this.shadowRoot.querySelector('[part="content-host"]')!;
  }

  protected setupListeners(): void {
    this.hostEl.addEventListener("click", event => {
      const target = event.target as HTMLElement;

      const edgeChip = target.closest('[part="edge-chip"]') as HTMLButtonElement | null;
      if (edgeChip && this.hostEl.contains(edgeChip)) {
        const parent = this.getNode(edgeChip.getAttribute("data-parent-id") ?? "");
        const child = this.getNode(edgeChip.getAttribute("data-child-id") ?? "");
        if (!parent || !child) {
          return;
        }
        const link = (child.parents ?? []).find(entry => entry.id === parent.id);
        this.dispatchEvent(
          new CustomEvent("edge-selected", {
            bubbles: true,
            composed: true,
            detail: {
              parent,
              child,
              deviation: resolveLineageDeviation(link?.deviation),
              ...(link?.note ? { note: link.note } : {}),
            },
          }),
        );
        return;
      }

      const nodeButton = target.closest('[part="node"]') as HTMLButtonElement | null;
      if (nodeButton && this.hostEl.contains(nodeButton)) {
        const node = this.getNode(nodeButton.getAttribute("data-id") ?? "");
        if (!node) {
          return;
        }
        this.rovingId = node.id;
        this.dispatchEvent(
          new CustomEvent("node-selected", {
            bubbles: true,
            composed: true,
            detail: { node },
          }),
        );
      }
    });

    this.hostEl.addEventListener("keydown", event => {
      const target = event.target as HTMLElement;
      if (target.getAttribute("part") !== "node") {
        return;
      }
      const buttons = this.nodeButtons();
      const index = buttons.indexOf(target as HTMLButtonElement);
      if (index === -1) {
        return;
      }

      let next: number | null = null;
      if (event.key === "ArrowDown") {
        next = Math.min(index + 1, buttons.length - 1);
      } else if (event.key === "ArrowUp") {
        next = Math.max(index - 1, 0);
      } else if (event.key === "Home") {
        next = 0;
      } else if (event.key === "End") {
        next = buttons.length - 1;
      }
      if (next === null || next === index) {
        return;
      }
      event.preventDefault();
      const button = buttons[next]!;
      this.rovingId = button.getAttribute("data-id");
      for (const other of buttons) {
        other.tabIndex = other === button ? 0 : -1;
      }
      button.focus();
    });
  }

  protected update(): void {
    if (!this.hostEl) {
      return;
    }

    const active = this.shadowRoot?.activeElement as HTMLElement | null;
    const focusedId =
      active && this.hostEl.contains(active) && active.getAttribute("part") === "node"
        ? active.getAttribute("data-id")
        : null;

    // The versions layout engine only needs the id topology; deviation data
    // stays on the lineage links and decorates the produced edges.
    const layout = computeVersionGraphLayout(
      this.nodesValue.map(node => ({
        id: node.id,
        label: node.label,
        parents: (node.parents ?? []).map(link => link.id),
      })),
    );
    const byId = new Map(this.nodesValue.map(node => [node.id, node]));
    const deviationFor = (parentId: string, childId: string): string => {
      const link = (byId.get(childId)?.parents ?? []).find(entry => entry.id === parentId);
      return resolveLineageDeviation(link?.deviation);
    };

    const graphWidth = EDGE_PAD * 2 + layout.laneCount * LANE_WIDTH;
    const graphHeight = layout.rowCount * ROW_HEIGHT;
    const centerX = (lane: number): number => EDGE_PAD + lane * LANE_WIDTH + LANE_WIDTH / 2;
    const centerY = (row: number): number => row * ROW_HEIGHT + ROW_HEIGHT / 2;

    const arrows = this.arrows;

    const edgePaths = layout.edges
      .map(edge => {
        const x1 = centerX(edge.fromLane);
        const y1 = centerY(edge.fromRow);
        const x2 = centerX(edge.toLane);
        const y2 = centerY(edge.toRow);
        // One curve rule for every edge, rather than a straight line for
        // same-lane edges and a cubic for lane changes: two rules made the
        // graph read as two different diagrams. A cubic whose ends share an x
        // degenerates to a straight vertical on its own, so same-lane edges
        // still render straight without being a special case.
        //
        // Control points are pulled *along* the direction of travel — half the
        // vertical distance each — so the bend always leaves the parent
        // downward and enters the child from above. The previous version
        // offset them by a fixed half-row in the wrong direction (up from the
        // start, down from the end on a downward edge), so an edge spanning
        // one row bowed backwards into an S while a longer one looked almost
        // straight.
        // Stop at each node's edge rather than its centre. A marker sits on
        // the path's end vertex, so a vertex inside the node disc buries it —
        // and an edge that starts and ends at the rim reads as connecting two
        // nodes rather than as passing through them, which is what React Flow
        // gets from anchoring edges to handles.
        const yStart = y1 + Math.sign(y2 - y1) * NODE_EDGE_OFFSET;
        const yEnd = y2 + Math.sign(y1 - y2) * NODE_EDGE_OFFSET;
        const dy = (yEnd - yStart) / 2;
        const d = `M ${x1} ${yStart} C ${x1} ${yStart + dy}, ${x2} ${yEnd - dy}, ${x2} ${yEnd}`;
        const deviation = deviationFor(edge.fromId, edge.toId);
        // One marker per deviation rather than context-stroke, which is not
        // supported everywhere: an arrowhead in the wrong colour reads as a
        // different edge.
        const marker = deviation === "minor" || deviation === "major" ? `boe-graph-arrow-${deviation}` : "boe-graph-arrow";
        const startMarker = hasStartArrow(arrows) ? ` marker-start="url(#${marker})"` : "";
        const endMarker = hasEndArrow(arrows) ? ` marker-end="url(#${marker})"` : "";
        return `<path part="edge" data-deviation="${deviation}" d="${d}"${startMarker}${endMarker}></path>`;
      })
      .join("");

    const rovingId =
      this.rovingId && byId.has(this.rovingId)
        ? this.rovingId
        : (layout.placements[0]?.id ?? null);

    const rows = layout.placements
      .map(placement => {
        const node = byId.get(placement.id)!;
        const kind = node.kind ?? "";
        const when = node.timestamp ? formatItemDate(node.timestamp) : "";
        const ariaLabel = [node.label, kind, node.actor?.name ?? ""].filter(Boolean).join(", ");

        const edgeChips = (node.parents ?? [])
          .filter(link => byId.has(link.id))
          .map(link => {
            const parent = byId.get(link.id)!;
            const deviation = resolveLineageDeviation(link.deviation);
            return `
              <button
                type="button"
                part="edge-chip"
                data-parent-id="${escapeHtml(parent.id)}"
                data-child-id="${escapeHtml(node.id)}"
                data-deviation="${deviation}"
                aria-label="Compare with ${escapeHtml(parent.label)} (${DEVIATION_LABELS[deviation]})"
              >⇠ ${escapeHtml(parent.label)} · ${DEVIATION_LABELS[deviation]}</button>
            `;
          })
          .join("");

        return `
          <li part="row" data-id="${escapeHtml(node.id)}"${kind ? ` data-kind="${escapeHtml(kind)}"` : ""} style="padding-inline-start: ${String(graphWidth + 10)}px;">
            <button
              type="button"
              part="node"
              data-id="${escapeHtml(node.id)}"
              ${kind ? `data-kind="${escapeHtml(kind)}"` : ""}
              tabindex="${node.id === rovingId ? "0" : "-1"}"
              aria-label="${escapeHtml(ariaLabel)}"
              style="inset-inline-start: ${String(centerX(placement.lane))}px;"
            ></button>
            <span part="row-label">${escapeHtml(node.label)}</span>
            ${kind ? `<span part="kind">${escapeHtml(kind)}</span>` : ""}
            <span part="row-meta">${[node.actor?.name, when].filter(Boolean).map(text => escapeHtml(text!)).join(" · ")}</span>
            ${edgeChips}
          </li>
        `;
      })
      .join("");

    this.hostEl.innerHTML = `
      <section part="panel" aria-label="${escapeHtml(this.heading)}">
        <h2 part="title">${escapeHtml(this.heading)}</h2>
        ${
          layout.placements.length > 0
            ? `
              <div part="graph">
                <svg part="edges" width="${String(graphWidth)}" height="${String(graphHeight)}" viewBox="0 0 ${String(graphWidth)} ${String(graphHeight)}" aria-hidden="true"><defs><marker id="boe-graph-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path part="edge-arrow" d="M 0 0 L 8 4 L 0 8 z"></path></marker><marker id="boe-graph-arrow-minor" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path part="edge-arrow" data-deviation="minor" d="M 0 0 L 8 4 L 0 8 z"></path></marker><marker id="boe-graph-arrow-major" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path part="edge-arrow" data-deviation="major" d="M 0 0 L 8 4 L 0 8 z"></path></marker></defs>${edgePaths}</svg>
                <ol part="rows" role="list">${rows}</ol>
              </div>
            `
            : `<div part="empty">No lineage.</div>`
        }
      </section>
    `;

    if (focusedId) {
      const buttons = this.nodeButtons();
      const target =
        buttons.find(button => button.getAttribute("data-id") === focusedId) ??
        buttons.find(button => button.tabIndex === 0) ??
        buttons[0];
      target?.focus();
    }
  }
}

LineageGraph.register();
