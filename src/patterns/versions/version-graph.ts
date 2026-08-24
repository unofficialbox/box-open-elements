import { computeVersionGraphLayout, orderVersionsForDisplay } from "./graph-layout.js";
import { escapeHtml, STATUS_LABELS } from "./shared.js";
import { isVersionNodeRecord, resolveVersionKind, resolveVersionStatus } from "./types.js";
import type { VersionNode } from "./types.js";
import { formatItemDate } from "../content-explorer/adapters/item-summary.js";
import { BaseElement } from "../../core/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-version-graph";

const LANE_WIDTH = 26;
const ROW_HEIGHT = 46;
const EDGE_PAD = 8;
/**
 * How far short of a node's centre an edge stops.
 *
 * The arrowhead marks the path's end vertex, so an edge running to the centre
 * would bury its head under the node disc. The largest node here is ~1.05rem
 * across, so backing off 9px leaves the head just clear of the biggest one.
 */
const NODE_EDGE_OFFSET = 9;

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
          fill: color-mix(in srgb, var(--boe-token-text-text-secondary, #6f6f6f) 55%, transparent);
          stroke: none;
        }

        [part="edge"] {
          fill: none;
          stroke: color-mix(in srgb, var(--boe-token-text-text-secondary, #6f6f6f) 55%, transparent);
          stroke-width: 2;
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

        [part="row"][data-compare-selected="true"] {
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
        }

        [part="node"] {
          position: absolute;
          inset-block-start: 50%;
          transform: translate(-50%, -50%);
          appearance: none;
          padding: 0;
          inline-size: 0.85rem;
          block-size: 0.85rem;
          border-radius: 999px;
          border: 2px solid var(--boe-token-text-text-secondary, #6f6f6f);
          background: var(--boe-token-surface-surface, #ffffff);
          cursor: pointer;
        }

        [part="node"][data-kind="major"],
        [part="node"][data-kind="merge"] {
          background: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="node"][data-kind="major"] {
          inline-size: 1.05rem;
          block-size: 1.05rem;
        }

        [part="node"][data-kind="draft"] {
          border-style: dashed;
        }

        [part="node"][data-status="current"] {
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          background: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="node"][data-status="executed"] {
          border-color: var(--boe-token-surface-status-surface-success, #26c281);
          background: var(--boe-token-surface-status-surface-success, #26c281);
        }

        [part="node"][data-status="abandoned"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 70%, transparent);
          background: transparent;
        }

        [part="node"][data-compare-selected="true"] {
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 30%, transparent);
        }

        [part="node"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 45%, transparent);
        }

        [part="row-label"] {
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="row"][data-kind="minor"] [part="row-label"],
        [part="row"][data-kind="draft"] [part="row-label"] {
          font-weight: 600;
          font-size: 0.9rem;
        }

        [part="status"] {
          display: inline-flex;
          padding: 0.1rem 0.4rem;
          border-radius: 999px;
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.72rem;
          font-weight: 700;
        }

        [part="status"][data-status="current"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 14%, transparent);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="status"][data-status="executed"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 16%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26c281) 52%, black 48%);
        }

        [part="status"][data-status="abandoned"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 12%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 74%, black 26%);
        }

        [part="row-meta"] {
          font-size: 0.78rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="empty"] {
          padding: ${boePanel.padding};
          border-radius: ${boeRadius.large};
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }
      `;

/**
 * Git-network rendering of a version history (opportunity 4): lanes and
 * branch/merge curves from the pure `computeVersionGraphLayout`, with one
 * HTML button per node so activation, focus, and compare selection stay
 * native. Click emits `version-selected`; a modified click (Shift/Ctrl/Meta)
 * or the `toggleCompare` method pairs two nodes into `compare-requested`.
 * `box-version-list` renders the same model as the accessible table-style
 * fallback — pair them when the graph is the primary surface.
 */
export class VersionGraph extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["heading", "versions"];
  }

  private versionsValue: VersionNode[] = [];

  private compareIds: string[] = [];

  private rovingId: string | null = null;

  private hostEl!: HTMLElement;

  get heading(): string {
    return this.getAttribute("heading") ?? "Version graph";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get versions(): VersionNode[] {
    return this.versionsValue;
  }

  set versions(value: VersionNode[]) {
    this.versionsValue = Array.isArray(value) ? value.filter(isVersionNodeRecord) : [];
    this.pruneSelection();
    if (this.isRendered) {
      this.update();
    }
  }

  /** Ids currently toggled for compare, in selection order (max two). */
  get compareSelection(): string[] {
    return [...this.compareIds];
  }

  clearCompareSelection(): void {
    this.compareIds = [];
    if (this.isRendered) {
      this.update();
    }
  }

  /** Toggle a node in the compare pair; two toggled nodes emit `compare-requested`. */
  toggleCompare(id: string): void {
    if (!this.versionsValue.some(node => node.id === id)) {
      return;
    }
    if (this.compareIds.includes(id)) {
      this.compareIds = this.compareIds.filter(other => other !== id);
    } else {
      this.compareIds = [...this.compareIds, id].slice(-2);
    }

    if (this.compareIds.length === 2) {
      const ordered = orderVersionsForDisplay(this.versionsValue).map(node => node.id);
      const [a, b] = this.compareIds as [string, string];
      const older = ordered.indexOf(a) > ordered.indexOf(b) ? a : b;
      const newer = older === a ? b : a;
      this.dispatchEvent(
        new CustomEvent("compare-requested", {
          bubbles: true,
          composed: true,
          detail: { baseId: older, targetId: newer },
        }),
      );
    }
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "versions") {
      this.versionsValue = this.parseVersionsAttribute(newValue);
      this.pruneSelection();
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private parseVersionsAttribute(raw: string | null): VersionNode[] {
    if (!raw) {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isVersionNodeRecord) : [];
    } catch {
      return [];
    }
  }

  private pruneSelection(): void {
    const known = new Set(this.versionsValue.map(node => node.id));
    this.compareIds = this.compareIds.filter(id => known.has(id));
    if (this.rovingId && !known.has(this.rovingId)) {
      this.rovingId = null;
    }
  }

  private getVersion(id: string): VersionNode | undefined {
    return this.versionsValue.find(node => node.id === id);
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
      const nodeButton = target.closest('[part="node"]') as HTMLButtonElement | null;
      if (!nodeButton || !this.hostEl.contains(nodeButton)) {
        return;
      }
      const id = nodeButton.getAttribute("data-id") ?? "";
      const version = this.getVersion(id);
      if (!version) {
        return;
      }
      this.rovingId = id;
      if (event.shiftKey || event.ctrlKey || event.metaKey) {
        this.toggleCompare(id);
        return;
      }
      this.dispatchEvent(
        new CustomEvent("version-selected", {
          bubbles: true,
          composed: true,
          detail: { version },
        }),
      );
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

    const layout = computeVersionGraphLayout(this.versionsValue);
    const byId = new Map(this.versionsValue.map(node => [node.id, node]));
    const graphWidth = EDGE_PAD * 2 + layout.laneCount * LANE_WIDTH;
    const graphHeight = layout.rowCount * ROW_HEIGHT;
    const centerX = (lane: number): number => EDGE_PAD + lane * LANE_WIDTH + LANE_WIDTH / 2;
    const centerY = (row: number): number => row * ROW_HEIGHT + ROW_HEIGHT / 2;

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
        const dy = (y2 - y1) / 2;
        // Stop at the node's edge, not its centre: the arrowhead marks the
        // vertex, and a vertex inside the node disc would bury it. Backing off
        // by the node's radius along the direction of travel leaves the head
        // just outside the child it points at.
        const yEnd = y2 + Math.sign(y1 - y2) * NODE_EDGE_OFFSET;
        const d = `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${yEnd - dy}, ${x2} ${yEnd}`;
        return `<path part="edge" data-from="${escapeHtml(edge.fromId)}" data-to="${escapeHtml(edge.toId)}" d="${d}" marker-end="url(#boe-graph-arrow)"></path>`;
      })
      .join("");

    const rovingId =
      this.rovingId && byId.has(this.rovingId)
        ? this.rovingId
        : (layout.placements[0]?.id ?? null);

    const rows = layout.placements
      .map(placement => {
        const node = byId.get(placement.id)!;
        const kind = resolveVersionKind(node.kind);
        const status = resolveVersionStatus(node.status);
        const compareSelected = this.compareIds.includes(node.id);
        const when = node.timestamp ? formatItemDate(node.timestamp) : "";
        const ariaLabel = [
          node.label,
          kind,
          status ? STATUS_LABELS[status] : "",
          node.actor?.name ?? "",
          compareSelected ? "selected for comparison" : "",
        ]
          .filter(Boolean)
          .join(", ");

        return `
          <li part="row" data-id="${escapeHtml(node.id)}" data-kind="${kind}"${status ? ` data-status="${status}"` : ""} data-compare-selected="${compareSelected ? "true" : "false"}" style="padding-inline-start: ${String(graphWidth + 10)}px;">
            <button
              type="button"
              part="node"
              data-id="${escapeHtml(node.id)}"
              data-kind="${kind}"
              ${status ? `data-status="${status}"` : ""}
              data-compare-selected="${compareSelected ? "true" : "false"}"
              tabindex="${node.id === rovingId ? "0" : "-1"}"
              aria-label="${escapeHtml(ariaLabel)}"
              style="inset-inline-start: ${String(centerX(placement.lane))}px;"
            ></button>
            <span part="row-label">${escapeHtml(node.label)}</span>
            ${status ? `<span part="status" data-status="${status}">${STATUS_LABELS[status]}</span>` : ""}
            <span part="row-meta">${[node.actor?.name, when].filter(Boolean).map(text => escapeHtml(text!)).join(" · ")}</span>
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
                <svg part="edges" width="${String(graphWidth)}" height="${String(graphHeight)}" viewBox="0 0 ${String(graphWidth)} ${String(graphHeight)}" aria-hidden="true"><defs><marker id="boe-graph-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="4" markerHeight="4" orient="auto"><path part="edge-arrow" d="M 0 0 L 8 4 L 0 8 z"></path></marker></defs>${edgePaths}</svg>
                <ol part="rows" role="list">${rows}</ol>
              </div>
            `
            : `<div part="empty">No versions.</div>`
        }
      </section>
    `;

    if (focusedId) {
      // Compare data-id directly — ids are author input, and building a CSS
      // selector from one can throw. Fall back to the current tab stop so
      // focus stays inside the component when the focused node was removed.
      const buttons = this.nodeButtons();
      const target =
        buttons.find(button => button.getAttribute("data-id") === focusedId) ??
        buttons.find(button => button.tabIndex === 0) ??
        buttons[0];
      target?.focus();
    }
  }
}

VersionGraph.register();
