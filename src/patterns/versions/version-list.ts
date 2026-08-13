import { orderVersionsForDisplay } from "./graph-layout.js";
import { escapeHtml, STATUS_LABELS } from "./shared.js";
import { isVersionNodeRecord, resolveVersionKind, resolveVersionStatus } from "./types.js";
import type { VersionNode } from "./types.js";
import { formatItemDate } from "../content-explorer/adapters/item-summary.js";
import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-version-list";

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

        [part="rows"] {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.45rem;
        }

        [part="row"] {
          display: grid;
          gap: 0.3rem;
          padding: 0.55rem 0.6rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 52%, transparent);
          border-radius: ${boeRadius.large};
          background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 82%, transparent);
        }

        [part="row"][data-status="current"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 45%, transparent);
        }

        [part="row"][data-compare-selected="true"] {
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
        }

        [part="row-header"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.45rem;
        }

        [part="marker"] {
          inline-size: 0.7rem;
          block-size: 0.7rem;
          border-radius: 999px;
          border: 2px solid var(--boe-token-text-text-secondary, #6f6f6f);
          background: transparent;
        }

        [part="marker"][data-kind="major"],
        [part="marker"][data-kind="merge"] {
          background: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="row"][data-status="current"] [part="marker"] {
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          background: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="marker"][data-kind="draft"] {
          border-style: dashed;
        }

        [part="row-title"] {
          appearance: none;
          border: none;
          background: transparent;
          padding: 0;
          font: inherit;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
          text-align: left;
          cursor: pointer;
        }

        [part="row-title"]:hover {
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="row-title"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
          border-radius: ${boeRadius.med};
        }

        [part="status"] {
          display: inline-flex;
          padding: 0.14rem 0.45rem;
          border-radius: 999px;
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.74rem;
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

        [part="meta"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.8rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="note"] {
          margin: 0;
          font-size: 0.84rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="row-actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        [part="row-action"] {
          appearance: none;
          font: inherit;
          font-size: 0.76rem;
          font-weight: 600;
          padding: 0.26rem 0.6rem;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 60%, transparent);
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="row-action"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="row-action"][aria-pressed="true"] {
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="row-action"]:focus-visible {
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
 * The accessible core of the versions surface (CLM gap 5): a topologically
 * ordered, newest-first version history with status tones, two-version
 * compare pairing, and restore/promote surfaced as intent events for the
 * host's confirm-before-apply flow. `box-version-graph` renders the same
 * model as a git-style network; this list is the contract, the graph is
 * progressive enhancement.
 */
export class VersionList extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["can-promote", "can-restore", "heading", "versions"];
  }

  private versionsValue: VersionNode[] = [];

  private compareIds: string[] = [];

  private hostEl!: HTMLElement;

  get heading(): string {
    return this.getAttribute("heading") ?? "Version history";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  /** Enables the per-row Restore intent button (non-current rows). */
  get canRestore(): boolean {
    return this.hasAttribute("can-restore");
  }

  set canRestore(value: boolean) {
    this.toggleAttribute("can-restore", value);
  }

  /** Enables the per-row Promote intent button (non-current rows). */
  get canPromote(): boolean {
    return this.hasAttribute("can-promote");
  }

  set canPromote(value: boolean) {
    this.toggleAttribute("can-promote", value);
  }

  get versions(): VersionNode[] {
    return this.versionsValue;
  }

  set versions(value: VersionNode[]) {
    this.versionsValue = Array.isArray(value) ? value.filter(isVersionNodeRecord) : [];
    this.pruneCompareSelection();
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

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "versions") {
      this.versionsValue = this.parseVersionsAttribute(newValue);
      this.pruneCompareSelection();
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

  private pruneCompareSelection(): void {
    const known = new Set(this.versionsValue.map(node => node.id));
    this.compareIds = this.compareIds.filter(id => known.has(id));
  }

  private getVersion(id: string): VersionNode | undefined {
    return this.versionsValue.find(node => node.id === id);
  }

  private toggleCompare(id: string): void {
    if (this.compareIds.includes(id)) {
      this.compareIds = this.compareIds.filter(other => other !== id);
    } else {
      this.compareIds = [...this.compareIds, id].slice(-2);
    }

    if (this.compareIds.length === 2) {
      const ordered = orderVersionsForDisplay(this.versionsValue).map(node => node.id);
      // Display order is newest first, so the later index is the older side.
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
    this.update();
  }

  private rowHtml(node: VersionNode): string {
    const kind = resolveVersionKind(node.kind);
    const status = resolveVersionStatus(node.status);
    const isCurrent = status === "current";
    const compareSelected = this.compareIds.includes(node.id);
    const when = node.timestamp ? formatItemDate(node.timestamp) : "";

    const actions: string[] = [
      `<button type="button" part="row-action" data-action="compare" data-id="${escapeHtml(node.id)}" aria-pressed="${compareSelected ? "true" : "false"}">Compare</button>`,
    ];
    if (this.canRestore && !isCurrent) {
      actions.push(
        `<button type="button" part="row-action" data-action="restore" data-id="${escapeHtml(node.id)}">Restore</button>`,
      );
    }
    if (this.canPromote && !isCurrent) {
      actions.push(
        `<button type="button" part="row-action" data-action="promote" data-id="${escapeHtml(node.id)}">Promote</button>`,
      );
    }

    return `
      <li part="row" data-id="${escapeHtml(node.id)}" data-kind="${kind}"${status ? ` data-status="${status}"` : ""} data-compare-selected="${compareSelected ? "true" : "false"}">
        <div part="row-header">
          <span part="marker" data-kind="${kind}" aria-hidden="true"></span>
          <button type="button" part="row-title" data-id="${escapeHtml(node.id)}">${escapeHtml(node.label)}</button>
          ${status ? `<span part="status" data-status="${status}">${STATUS_LABELS[status]}</span>` : ""}
        </div>
        <div part="meta">
          ${node.actor ? `<span part="actor">${escapeHtml(node.actor.name)}</span>` : ""}
          ${when ? `<time part="when" datetime="${escapeHtml(node.timestamp ?? "")}">${escapeHtml(when)}</time>` : ""}
        </div>
        ${node.note ? `<p part="note">${escapeHtml(node.note)}</p>` : ""}
        <div part="row-actions">${actions.join("")}</div>
      </li>
    `;
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

      const actionButton = target.closest('[part="row-action"]') as HTMLButtonElement | null;
      if (actionButton && this.hostEl.contains(actionButton)) {
        const id = actionButton.getAttribute("data-id") ?? "";
        const action = actionButton.getAttribute("data-action") ?? "";
        const version = this.getVersion(id);
        if (!version) {
          return;
        }
        if (action === "compare") {
          this.toggleCompare(id);
        } else if (action === "restore" || action === "promote") {
          // Restore/promote mutate governed records — the host owns the
          // confirm-before-apply flow, so these only surface intent.
          this.dispatchEvent(
            new CustomEvent(`${action}-requested`, {
              bubbles: true,
              composed: true,
              detail: { version },
            }),
          );
        }
        return;
      }

      const titleButton = target.closest('[part="row-title"]') as HTMLButtonElement | null;
      if (titleButton && this.hostEl.contains(titleButton)) {
        const version = this.getVersion(titleButton.getAttribute("data-id") ?? "");
        if (version) {
          this.dispatchEvent(
            new CustomEvent("version-selected", {
              bubbles: true,
              composed: true,
              detail: { version },
            }),
          );
        }
      }
    });
  }

  protected update(): void {
    if (!this.hostEl) {
      return;
    }

    const active = this.shadowRoot?.activeElement as HTMLElement | null;
    const focusKey =
      active && this.hostEl.contains(active)
        ? {
            part: active.getAttribute("part") ?? "",
            id: active.getAttribute("data-id"),
            action: active.getAttribute("data-action"),
          }
        : null;

    const ordered = orderVersionsForDisplay(this.versionsValue);
    this.hostEl.innerHTML = `
      <section part="panel" aria-label="${escapeHtml(this.heading)}">
        <h2 part="title">${escapeHtml(this.heading)}</h2>
        ${
          ordered.length > 0
            ? `<ol part="rows" role="list">${ordered.map(node => this.rowHtml(node)).join("")}</ol>`
            : `<div part="empty">No versions.</div>`
        }
      </section>
    `;

    if (focusKey?.part) {
      const target = Array.from(this.hostEl.querySelectorAll(`[part="${focusKey.part}"]`)).find(
        node =>
          node.getAttribute("data-id") === focusKey.id &&
          (!focusKey.action || node.getAttribute("data-action") === focusKey.action),
      ) as HTMLElement | undefined;
      // The rebuild removed the focused control's version (or its action):
      // keep keyboard focus inside the component instead of dropping to body.
      const fallback = this.hostEl.querySelector<HTMLElement>(
        '[part="row-title"], [part="row-action"]',
      );
      (target ?? fallback)?.focus();
    }
  }
}

VersionList.register();
