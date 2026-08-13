import { computeTextDiff, formatDiffStats } from "./engine.js";
import type { DiffLine, DiffResult } from "./types.js";
import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-diff-viewer";

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

        [part="panel"] {
          display: grid;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: ${boePanel.background};
        }

        [part="header"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: ${boePanel.gap};
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="stats"] {
          display: inline-flex;
          padding: 0.2rem 0.55rem;
          border-radius: 999px;
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.78rem;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        [part="nav"] {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          margin-left: auto;
        }

        [part="nav-position"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.8rem;
          font-variant-numeric: tabular-nums;
        }

        [part="nav-previous"],
        [part="nav-next"] {
          appearance: none;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.3rem 0.6rem;
          border-radius: ${boeRadius.control};
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="nav-previous"]:hover:not(:disabled),
        [part="nav-next"]:hover:not(:disabled) {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="nav-previous"]:disabled,
        [part="nav-next"]:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        [part="nav-previous"]:focus-visible,
        [part="nav-next"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="scroller"] {
          overflow-x: auto;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 62%, transparent);
          border-radius: ${boeRadius.large};
        }

        [part="table"] {
          width: 100%;
          border-collapse: collapse;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
          font-size: 0.82rem;
          line-height: 1.55;
        }

        [part="column-label"] {
          padding: 0.45rem 0.6rem;
          text-align: left;
          font-family: inherit;
          font-size: 0.74rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          border-bottom: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 62%, transparent);
          background: var(--boe-token-surface-surface-secondary, #fbfbfb);
        }

        [part="line-number"] {
          width: 1%;
          min-width: 2.4rem;
          padding: 0 0.55rem;
          text-align: right;
          vertical-align: top;
          color: color-mix(in srgb, var(--boe-token-text-text-secondary, #6f6f6f) 72%, transparent);
          user-select: none;
          border-right: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 46%, transparent);
        }

        [part="cell"] {
          padding: 0 0.6rem;
          vertical-align: top;
          white-space: pre-wrap;
          word-break: break-word;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="row"][data-kind="removed"] [part="cell"][data-side="before"],
        [part="row"][data-kind="changed"] [part="cell"][data-side="before"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 8%, transparent);
        }

        [part="row"][data-kind="added"] [part="cell"][data-side="after"],
        [part="row"][data-kind="changed"] [part="cell"][data-side="after"] {
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26a27b) 10%, transparent);
        }

        [part="row"][data-active="true"] [part="cell"] {
          box-shadow: inset 3px 0 0 var(--boe-token-surface-surface-brand, #0061d5);
        }

        del {
          text-decoration: line-through;
          text-decoration-thickness: 1px;
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 22%, transparent);
          color: inherit;
        }

        ins {
          text-decoration: none;
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26a27b) 26%, transparent);
          color: inherit;
        }

        [part="empty"] {
          padding: ${boePanel.padding};
          border-radius: ${boeRadius.large};
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }
      `;

export class DiffViewer extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["after-label", "after-text", "before-label", "before-text", "heading", "mode"];
  }

  private titleEl!: HTMLElement;

  private statsEl!: HTMLElement;

  private navEl!: HTMLElement;

  private navPositionEl!: HTMLElement;

  private navPreviousEl!: HTMLButtonElement;

  private navNextEl!: HTMLButtonElement;

  private scrollerEl!: HTMLElement;

  private emptyEl!: HTMLElement;

  private result: DiffResult | null = null;

  private resultSignature = "";

  private activeChangeIndex = -1;

  get heading(): string {
    return this.getAttribute("heading") ?? "Comparison";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  /** The original document text. (`before`/`after` collide with ChildNode methods.) */
  get beforeText(): string {
    return this.getAttribute("before-text") ?? "";
  }

  set beforeText(value: string) {
    this.setAttribute("before-text", value);
  }

  /** The revised document text. */
  get afterText(): string {
    return this.getAttribute("after-text") ?? "";
  }

  set afterText(value: string) {
    this.setAttribute("after-text", value);
  }

  get beforeLabel(): string {
    return this.getAttribute("before-label") ?? "Original";
  }

  set beforeLabel(value: string) {
    this.setAttribute("before-label", value);
  }

  get afterLabel(): string {
    return this.getAttribute("after-label") ?? "Revised";
  }

  set afterLabel(value: string) {
    this.setAttribute("after-label", value);
  }

  /** `split` (side-by-side, default) or `inline` (unified). */
  get mode(): "split" | "inline" {
    return this.getAttribute("mode") === "inline" ? "inline" : "split";
  }

  set mode(value: "split" | "inline") {
    this.setAttribute("mode", value);
  }

  /** The computed diff for the current inputs. */
  get diff(): DiffResult | null {
    return this.result;
  }

  /** Step change navigation programmatically; used by the header buttons. */
  goToChange(index: number): void {
    const ranges = this.result?.changeRanges ?? [];
    if (!ranges.length) {
      return;
    }

    const clamped = Math.max(0, Math.min(ranges.length - 1, index));
    this.activeChangeIndex = clamped;
    if (this.isRendered) {
      this.update();
    }

    const range = ranges[clamped];
    const target = this.scrollerEl.querySelector(`[part="row"][data-row-index="${String(range?.start ?? 0)}"]`);
    (target as HTMLElement | null)?.scrollIntoView?.({ block: "center" });

    this.dispatchEvent(
      new CustomEvent("change-focused", {
        bubbles: true,
        composed: true,
        detail: { index: clamped, total: ranges.length },
      }),
    );
  }

  private lineHtml(line: DiffLine | undefined): string {
    if (!line) {
      return "";
    }
    if (!line.segments) {
      return escapeHtml(line.text);
    }

    return line.segments
      .map(segment => {
        const text = escapeHtml(segment.text);
        if (segment.kind === "removed") {
          return `<del>${text}</del>`;
        }
        if (segment.kind === "added") {
          return `<ins>${text}</ins>`;
        }
        return text;
      })
      .join("");
  }

  private rowHtml(rowIndex: number, active: boolean): string {
    const row = this.result?.rows[rowIndex];
    if (!row) {
      return "";
    }

    const attrs = `part="row" data-kind="${row.kind}" data-row-index="${String(rowIndex)}" data-active="${active ? "true" : "false"}"`;

    if (this.mode === "inline") {
      const lines: string[] = [];
      if (row.before && row.kind !== "equal") {
        lines.push(`
          <tr ${attrs}>
            <td part="line-number">${String(row.before.number)}</td>
            <td part="line-number"></td>
            <td part="cell" data-side="before">${this.lineHtml(row.before)}</td>
          </tr>
        `);
      }
      if (row.after) {
        lines.push(`
          <tr ${attrs}>
            <td part="line-number">${row.kind === "equal" && row.before ? String(row.before.number) : ""}</td>
            <td part="line-number">${String(row.after.number)}</td>
            <td part="cell" data-side="${row.kind === "equal" ? "context" : "after"}">${this.lineHtml(row.after)}</td>
          </tr>
        `);
      }
      return lines.join("");
    }

    return `
      <tr ${attrs}>
        <td part="line-number">${row.before ? String(row.before.number) : ""}</td>
        <td part="cell" data-side="before">${this.lineHtml(row.before)}</td>
        <td part="line-number">${row.after ? String(row.after.number) : ""}</td>
        <td part="cell" data-side="after">${this.lineHtml(row.after)}</td>
      </tr>
    `;
  }

  private rebuildTable(): void {
    const rows = this.result?.rows ?? [];
    const activeRange =
      this.activeChangeIndex >= 0 ? this.result?.changeRanges[this.activeChangeIndex] : undefined;

    const isActive = (index: number): boolean =>
      !!activeRange && index >= activeRange.start && index <= activeRange.end;

    const header =
      this.mode === "inline"
        ? `<tr>
            <th part="column-label" scope="col" colspan="2">Line</th>
            <th part="column-label" scope="col">${escapeHtml(`${this.beforeLabel} → ${this.afterLabel}`)}</th>
          </tr>`
        : `<tr>
            <th part="column-label" scope="col" colspan="2">${escapeHtml(this.beforeLabel)}</th>
            <th part="column-label" scope="col" colspan="2">${escapeHtml(this.afterLabel)}</th>
          </tr>`;

    this.scrollerEl.innerHTML = `
      <table part="table" aria-label="${escapeHtml(`${this.heading}: ${this.beforeLabel} vs ${this.afterLabel}`)}">
        <thead>${header}</thead>
        <tbody>${rows.map((_, index) => this.rowHtml(index, isActive(index))).join("")}</tbody>
      </table>
    `;
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <section part="panel">
        <header part="header">
          <h2 part="title"></h2>
          <span part="stats"></span>
          <span part="nav" hidden>
            <button type="button" part="nav-previous" aria-label="Previous change">‹ Prev</button>
            <span part="nav-position" aria-live="polite"></span>
            <button type="button" part="nav-next" aria-label="Next change">Next ›</button>
          </span>
        </header>
        <div part="scroller" tabindex="0"></div>
        <div part="empty" hidden>Nothing to compare.</div>
      </section>
    `;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.statsEl = this.shadowRoot.querySelector('[part="stats"]')!;
    this.navEl = this.shadowRoot.querySelector('[part="nav"]')!;
    this.navPositionEl = this.shadowRoot.querySelector('[part="nav-position"]')!;
    this.navPreviousEl = this.shadowRoot.querySelector('[part="nav-previous"]')!;
    this.navNextEl = this.shadowRoot.querySelector('[part="nav-next"]')!;
    this.scrollerEl = this.shadowRoot.querySelector('[part="scroller"]')!;
    this.emptyEl = this.shadowRoot.querySelector('[part="empty"]')!;
  }

  protected setupListeners(): void {
    this.navPreviousEl.addEventListener("click", () => {
      this.goToChange(this.activeChangeIndex <= 0 ? 0 : this.activeChangeIndex - 1);
    });
    this.navNextEl.addEventListener("click", () => {
      this.goToChange(this.activeChangeIndex + 1);
    });
  }

  protected update(): void {
    if (!this.scrollerEl) {
      return;
    }

    this.titleEl.textContent = this.heading;

    const before = this.beforeText;
    const after = this.afterText;
    const hasContent = before.length > 0 || after.length > 0;
    this.emptyEl.hidden = hasContent;
    this.scrollerEl.hidden = !hasContent;

    // The diff and the table rebuild only when the inputs (or mode) change;
    // navigation just re-marks the active rows.
    const signature = JSON.stringify([before.length, after.length, this.mode, before, after]);
    if (signature !== this.resultSignature) {
      this.resultSignature = signature;
      this.result = hasContent ? computeTextDiff(before, after) : null;
      this.activeChangeIndex = -1;
      if (hasContent) {
        this.rebuildTable();
      } else {
        this.scrollerEl.innerHTML = "";
      }
    } else if (this.result) {
      // Re-mark active rows in place.
      const activeRange =
        this.activeChangeIndex >= 0 ? this.result.changeRanges[this.activeChangeIndex] : undefined;
      this.scrollerEl.querySelectorAll<HTMLElement>('[part="row"]').forEach(row => {
        const index = Number(row.dataset.rowIndex);
        row.dataset.active =
          activeRange && index >= activeRange.start && index <= activeRange.end ? "true" : "false";
      });
    }

    const stats = this.result?.stats ?? { added: 0, removed: 0, changed: 0 };
    this.statsEl.textContent = formatDiffStats(stats);

    const total = this.result?.changeRanges.length ?? 0;
    this.navEl.hidden = total === 0;
    this.navPositionEl.textContent =
      this.activeChangeIndex >= 0 ? `Change ${String(this.activeChangeIndex + 1)} of ${String(total)}` : `${String(total)} changes`;
    this.navPreviousEl.disabled = this.activeChangeIndex <= 0;
    this.navNextEl.disabled = total === 0 || this.activeChangeIndex >= total - 1;
  }
}

DiffViewer.register();
