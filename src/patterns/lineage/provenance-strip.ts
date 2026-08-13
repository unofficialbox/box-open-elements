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

        [part="strip"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.35rem;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        [part="item"] {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        [part="chip"] {
          appearance: none;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.22rem 0.55rem;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 60%, transparent);
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="chip"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="chip"][aria-current="true"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 45%, transparent);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, var(--boe-token-surface-surface, #ffffff));
        }

        [part="chip"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
          border-radius: ${boeRadius.large};
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

        [part="separator"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          user-select: none;
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
            ${index > 0 ? `<span part="separator" aria-hidden="true">→</span>` : ""}
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
