import { isLineageNodeRecord } from "./types.js";
import type { LineageNode } from "./types.js";
import { computeVersionGraphLayout } from "../versions/graph-layout.js";
import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-provenance-strip";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const elementStyles = `
        [hidden] {
          display: none !important;
        }

        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        /* Read as a flow diagram rather than a breadcrumb. The anatomy is
           React Flow's, taken from its stylesheet: nodes are bordered boxes
           with a small radius (not pills), ports are 6px circles sitting on
           the node's edge, and the connection between them is a drawn edge
           with an arrowhead rather than a text glyph.

           The canvas dot grid is the other half of the signal — a node graph
           reads as a canvas, not as a line of text. */
        [part="strip"] {
          display: flex;
          /* A canvas scrolls; it does not reflow. Wrapping put an edge at the
             start of the second line with its arrow pointing into nothing,
             which reads as broken rather than as a continuation. */
          flex-wrap: nowrap;
          overflow-x: auto;
          align-items: center;
          gap: 0;
          margin: 0;
          padding: 0.75rem;
          list-style: none;
          border-radius: ${boeRadius.large};
          background-image: radial-gradient(
            color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 85%, transparent) 1px,
            transparent 1px
          );
          background-size: 12px 12px;
          background-position: -1px -1px;
        }

        [part="item"] {
          display: inline-flex;
          align-items: center;
          /* No shrinking: with nowrap a long chain must scroll, not compress
             the nodes until their labels ellipsize. */
          flex: 0 0 auto;
        }

        /* The node. React Flow's default: 10px padding, a small radius, a 1px
           border and a centred 12px label. Width is left to the content —
           React Flow fixes it at 150px because it lays out on a free canvas,
           whereas this strip is a row in a header and the labels are short. */
        [part="chip"] {
          appearance: none;
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font: inherit;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.4rem 0.6rem;
          /* 4px, the nearest token to React Flow's 3px. The control radius is
             20px here, which rendered the nodes as stadium pills — the shape
             the strip was moving away from. */
          border-radius: ${boeRadius.size};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 90%, var(--boe-token-text-text, #222222));
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          box-shadow: 0 1px 2px rgb(0 0 0 / 6%);
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard},
            border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        /* Ports. 6px circles straddling the node's edge, ringed in the surface
           colour so they read as attached to the node rather than floating —
           the same construction React Flow uses for its handles. */
        [part="chip"]::before,
        [part="chip"]::after {
          content: "";
          position: absolute;
          inset-block-start: 50%;
          inline-size: 6px;
          block-size: 6px;
          border-radius: 100%;
          background: var(--boe-token-text-text-secondary, #6f6f6f);
          border: 1px solid var(--boe-token-surface-surface, #ffffff);
          transform: translateY(-50%);
        }

        [part="chip"]::before {
          inset-inline-start: -4px;
        }

        [part="chip"]::after {
          inset-inline-end: -4px;
        }

        /* The first node has nothing feeding it and the last nothing leaving
           it, so they carry one port each — React Flow's input and output
           nodes do the same. */
        [part="item"]:first-child [part="chip"]::before,
        [part="item"]:last-child [part="chip"]::after {
          display: none;
        }

        [part="chip"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="chip"][aria-current="true"] {
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface, #ffffff));
        }

        [part="chip"][aria-current="true"]::before,
        [part="chip"][aria-current="true"]::after {
          background: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="chip"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="kind-dot"] {
          inline-size: 0.45rem;
          block-size: 0.45rem;
          border-radius: 999px;
          background: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="item"][data-kind="clause"] [part="kind-dot"] {
          background: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="item"][data-kind="template"] [part="kind-dot"] {
          border-radius: 2px;
        }

        /* The edge: a drawn line between two ports with an arrowhead, in place
           of the "→" character the strip used to print. Two co-linear handles
           are exactly the case where React Flow's bezier degenerates to a
           straight line, so a straight edge is the faithful shape here rather
           than a simplification. */
        [part="separator"] {
          position: relative;
          display: inline-flex;
          align-items: center;
          inline-size: 1.6rem;
          block-size: 2px;
          margin-inline: 4px;
          background: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 90%, var(--boe-token-text-text, #222222));
          user-select: none;
        }

        [part="separator"]::after {
          content: "";
          position: absolute;
          inset-inline-end: -1px;
          inset-block-start: 50%;
          inline-size: 0;
          block-size: 0;
          border-block: 4px solid transparent;
          border-inline-start: 6px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 90%, var(--boe-token-text-text, #222222));
          transform: translateY(-50%);
        }

      `;

/**
 * The cheap, high-frequency lineage sibling: a linear ancestry strip
 * (Library clause v5 → Template 2026 → MSA_Acme §4.2) for record headers
 * and the sidebar. Renders the chain oldest-first from the same topology
 * contract as `box-lineage-graph` (branched input degrades to topological
 * order), marks the newest entry as current, and emits `node-selected`.
 */
export class ProvenanceStrip extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["nodes"];
  }

  private nodesValue: LineageNode[] = [];

  private hostEl!: HTMLElement;

  get nodes(): LineageNode[] {
    return this.nodesValue;
  }

  set nodes(value: LineageNode[]) {
    this.nodesValue = Array.isArray(value) ? value.filter(isLineageNodeRecord) : [];
    if (this.isRendered) {
      this.update();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "nodes") {
      this.nodesValue = this.parseNodesAttribute(newValue);
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
      const chip = (event.target as HTMLElement).closest('[part="chip"]') as HTMLButtonElement | null;
      if (!chip || !this.hostEl.contains(chip)) {
        return;
      }
      const node = this.nodesValue.find(entry => entry.id === chip.getAttribute("data-id"));
      if (node) {
        this.dispatchEvent(
          new CustomEvent("node-selected", {
            bubbles: true,
            composed: true,
            detail: { node },
          }),
        );
      }
    });
  }

  protected update(): void {
    if (!this.hostEl) {
      return;
    }

    // Placements come newest-first; the strip reads oldest → newest.
    const layout = computeVersionGraphLayout(
      this.nodesValue.map(node => ({
        id: node.id,
        label: node.label,
        parents: (node.parents ?? []).map(link => link.id),
      })),
    );
    const byId = new Map(this.nodesValue.map(node => [node.id, node]));
    const chain = [...layout.placements].reverse().map(placement => byId.get(placement.id)!);

    const items = chain
      .map((node, index) => {
        const isCurrent = index === chain.length - 1;
        const kind = node.kind ?? "";
        return `
          <li part="item"${kind ? ` data-kind="${escapeHtml(kind)}"` : ""}>
            ${index > 0 ? `<span part="separator" aria-hidden="true"></span>` : ""}
            <button
              type="button"
              part="chip"
              data-id="${escapeHtml(node.id)}"
              ${isCurrent ? `aria-current="true"` : ""}
            ><span part="kind-dot" aria-hidden="true"></span>${escapeHtml(node.label)}</button>
          </li>
        `;
      })
      .join("");

    this.hostEl.innerHTML = chain.length
      ? `<ol part="strip" aria-label="Provenance">${items}</ol>`
      : "";
  }
}

ProvenanceStrip.register();
