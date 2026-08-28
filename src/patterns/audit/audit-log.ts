import {
  AUDIT_GROUP_BY_LABELS,
  AUDIT_GROUP_BY_VALUES,
  filterAuditEvents,
  groupAuditEvents,
  hasAuditFacets,
  resolveAuditGroupBy,
  summarizeAuditFacets,
  toAuditCsv,
} from "./types.js";
import type {
  AuditEvent,
  AuditFacets,
  AuditFacetValue,
  AuditGroup,
  AuditGroupBy,
} from "./types.js";
import {
  auditToneColor,
  escapeHtml,
  formatAuditTimestamp,
  resolveReferenceTime,
} from "./shared.js";
import { isSafeHref } from "../internal/safe-href.js";
import { isTimelineEventRecord, resolveTimelineTone } from "../timeline/types.js";
import { BaseElement, sameRowWindow } from "../../core/index.js";
import type { RowWindow } from "../../core/index.js";
import { buildAuditIndex, flattenAuditRows, planAuditWindow } from "./window.js";
import type { AuditRow, AuditRowHeights, AuditWindowPlan } from "./window.js";
import type { OffsetIndex } from "../../core/offset-window.js";
import { boeInputControlStyles, boePanel, boeRadius } from "../../foundations/geometry/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

/**
 * How many times the element will adopt a fresh height measurement for one row
 * set. A hard stop, not a tuning knob: without it a non-uniform list can adopt,
 * re-window, re-measure and adopt again on every animation frame forever.
 */
const MAX_HEIGHT_ADOPTIONS = 3;

const DEFAULT_TAG_NAME = "box-audit-log";

/** Facet attribute ↔ `AuditFacets` key. One row per facet, no other mapping. */
const FACET_ATTRIBUTES: ReadonlyArray<readonly [keyof AuditFacets, string]> = [
  ["actor", "facet-actor"],
  ["action", "facet-action"],
  ["correlationId", "facet-correlation-id"],
  ["from", "facet-from"],
  ["to", "facet-to"],
];

const elementStyles = `
        [hidden] {
          display: none !important;
        }

        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        /* The host's own display would otherwise beat the UA rule for [hidden],
           leaving the element on screen when a host hides it. */
        :host([hidden]) {
          display: none !important;
        }

        [part="panel"] {
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

        [part="toolbar"] {
          display: flex;
          flex-wrap: wrap;
          align-items: end;
          gap: 0.6rem;
        }

        [part="group-by"] {
          display: inline-flex;
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          border-radius: 999px;
          overflow: hidden;
        }

        [part="group-by-option"] {
          appearance: none;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.3rem 0.7rem;
          border: none;
          background: transparent;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="group-by-option"][aria-pressed="true"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, transparent);
          color: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="facet"] {
          display: grid;
          gap: 0.2rem;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        ${boeInputControlStyles('[part="facet"] select, [part="facet"] input')}

        [part="facet"] select,
        [part="facet"] input {
          font: inherit;
          font-size: 0.85rem;
          text-transform: none;
          letter-spacing: normal;
          font-weight: 400;
        }

        [part="clear-filters"],
        [part="export"],
        [part="drilldown-clear"] {
          appearance: none;
          font: inherit;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.35rem 0.7rem;
          border-radius: ${boeRadius.control};
          border: 1px solid var(--boe-token-stroke-stroke, #e8e8e8);
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          cursor: pointer;
        }

        [part="clear-filters"]:hover,
        [part="export"]:hover,
        [part="drilldown-clear"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
        }

        [part="drilldown"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.6rem;
          border-radius: ${boeRadius.med};
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 8%, transparent);
          font-size: 0.82rem;
        }

        [part="drilldown-id"] {
          font-family: ui-monospace, monospace;
          font-weight: 700;
        }

        [part="result-summary"] {
          margin: 0;
          font-size: 0.8rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="groups"] {
          display: grid;
          gap: 0.5rem;
        }

        /* Windowing needs a bounded viewport to scroll within:
           --boe-audit-height is the host's knob, defaulting to a page-sized
           band. */
        :host([virtualize]) [part="groups"] {
          max-block-size: var(--boe-audit-height, 32rem);
          overflow-y: auto;
        }

        [part="spacer"] {
          /* The grid gap must not apply to the spacers, or the scroll range
             gains a gap's height at each end and the content drifts. */
          margin-block: calc(-0.25rem);
        }

        [part="group"] {
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          border-radius: ${boeRadius.med};
          overflow: hidden;
        }

        [part="group-heading"] {
          margin: 0;
          font: inherit;
        }

        [part="group-toggle"] {
          appearance: none;
          display: flex;
          inline-size: 100%;
          align-items: baseline;
          gap: 0.5rem;
          padding: 0.5rem 0.65rem;
          border: none;
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
          color: var(--boe-token-text-text, #1f1e1b);
          font: inherit;
          font-weight: 700;
          text-align: start;
          cursor: pointer;
        }

        [part="group-toggle"]::before {
          content: "▾";
          font-size: 0.7rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="group-toggle"][aria-expanded="false"]::before {
          content: "▸";
        }

        [part="group-count"] {
          margin-left: auto;
          font-size: 0.76rem;
          font-weight: 600;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="events"] {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
        }

        [part="event"] {
          display: grid;
          gap: 0.25rem;
          padding: 0.5rem 0.65rem;
          border-top: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 55%, transparent);
        }

        [part="event-topline"] {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 0.4rem;
        }

        [part="event-action"] {
          appearance: none;
          padding: 0;
          border: none;
          background: none;
          font: inherit;
          font-weight: 600;
          color: var(--boe-token-text-text, #1f1e1b);
          text-align: start;
          cursor: pointer;
        }

        [part="event-action"]:hover {
          text-decoration: underline;
        }

        [part="actor"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          font-size: 0.82rem;
        }

        [part="badge"] {
          display: inline-flex;
          padding: 0.12rem 0.42rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--audit-tone, var(--boe-token-surface-surface-brand, #0061d5)) 12%, transparent);
          color: color-mix(in srgb, var(--audit-tone, var(--boe-token-surface-surface-brand, #0061d5)) 74%, black 26%);
          font-size: 0.72rem;
          font-weight: 600;
        }

        [part="timestamp"] {
          margin-left: auto;
          white-space: nowrap;
          font-size: 0.75rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="event-summary"] {
          margin: 0;
          font-size: 0.85rem;
          line-height: 1.5;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="evidence"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        [part="evidence-link"] {
          appearance: none;
          display: inline-flex;
          align-items: center;
          padding: 0.18rem 0.5rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 30%, transparent);
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 6%, transparent);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font: inherit;
          font-size: 0.74rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
        }

        [part="correlation"] {
          appearance: none;
          justify-self: start;
          padding: 0.1rem 0.35rem;
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 90%, transparent);
          border-radius: ${boeRadius.size};
          background: none;
          font-family: ui-monospace, monospace;
          font-size: 0.7rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          cursor: pointer;
        }

        [part="correlation"]:hover {
          color: var(--boe-token-surface-surface-brand, #0061d5);
          border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 45%, transparent);
        }

        [part="empty"] {
          padding: ${boePanel.padding};
          border-radius: ${boeRadius.large};
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="group-by-option"]:focus-visible,
        [part="group-toggle"]:focus-visible,
        [part="event-action"]:focus-visible,
        [part="evidence-link"]:focus-visible,
        [part="correlation"]:focus-visible,
        [part="clear-filters"]:focus-visible,
        [part="export"]:focus-visible,
        [part="drilldown-clear"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }
      `;

/**
 * The aggregation, faceting, and export layer over the `box-timeline` event
 * contract (opportunity 3 of `plans/component-opportunities.md`): the same
 * records the flat feed renders, grouped into collapsible day/actor/action
 * sections with counts, narrowed by facets and a date range, drillable to one
 * workflow run by correlation id, and exportable as CSV.
 *
 * Aggregation is client-side and pure. `virtualize` windows the log for
 * production-scale volumes; server-side paging remains a tracked depth
 * limitation.
 */
export class AuditLog extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return [
      "events",
      "exportable",
      "facet-action",
      "facet-actor",
      "facet-correlation-id",
      "facet-from",
      "facet-to",
      "group-by",
      "heading",
      "reference-time",
      "virtualize",
      "row-height",
      "heading-height",
    ];
  }

  private toolbarEl!: HTMLElement;

  private groupByEl!: HTMLElement;

  private actorSelectEl!: HTMLSelectElement;

  private actionSelectEl!: HTMLSelectElement;

  private fromInputEl!: HTMLInputElement;

  private toInputEl!: HTMLInputElement;

  private clearFiltersEl!: HTMLButtonElement;

  private exportEl!: HTMLButtonElement;

  private drilldownEl!: HTMLElement;

  private drilldownIdEl!: HTMLElement;

  private summaryEl!: HTMLElement;

  private groupsEl!: HTMLElement;

  private emptyEl!: HTMLElement;

  private titleEl!: HTMLElement;

  /** Section keys the reader has collapsed. Absent means expanded. */
  private collapsedGroups = new Set<string>();

  /** The row window the last render used; null when it rendered everything. */
  private lastWindow: RowWindow | null = null;

  private scrollFrame = 0;

  private measuredHeights: AuditRowHeights | null = null;

  private measureFrame = 0;

  /** Row set the adoption budget below is counted against. */
  private adoptedFor: string | null = null;

  private adoptionCount = 0;

  private viewportObserver: ResizeObserver | null = null;

  private contentSignature = "";

  private optionsSignature = "";

  /** Raw `events` attribute the parse cache was built from. */
  private eventsRaw: string | null = null;

  private eventsCache: AuditEvent[] = [];

  get heading(): string {
    return this.getAttribute("heading") ?? "Audit log";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  /**
   * Audit records; JSON payloads are validated per record before rendering.
   *
   * Memoized on the raw attribute so a single keystroke in the date field
   * does not re-parse and re-validate the whole payload once per reader
   * (`update`, `visibleEvents`, and each click-handler branch all read it).
   * The cache invalidates itself when the attribute changes; the returned
   * array is a copy, so a caller cannot mutate the log out from under it.
   */
  get events(): AuditEvent[] {
    const raw = this.getAttribute("events");
    if (!raw) {
      return [];
    }
    if (raw !== this.eventsRaw) {
      this.eventsRaw = raw;
      try {
        const parsed: unknown = JSON.parse(raw);
        this.eventsCache =
          Array.isArray(parsed) && parsed.every(isTimelineEventRecord)
            ? (parsed as AuditEvent[])
            : [];
      } catch {
        this.eventsCache = [];
      }
    }
    return [...this.eventsCache];
  }

  set events(value: AuditEvent[]) {
    if (value.length) {
      this.setAttribute("events", JSON.stringify(value));
      return;
    }
    this.removeAttribute("events");
  }

  get groupBy(): AuditGroupBy {
    return resolveAuditGroupBy(this.getAttribute("group-by"));
  }

  set groupBy(value: AuditGroupBy) {
    this.setAttribute("group-by", resolveAuditGroupBy(value));
  }

  get facets(): AuditFacets {
    const facets: AuditFacets = {};
    for (const [key, attribute] of FACET_ATTRIBUTES) {
      const value = this.getAttribute(attribute);
      if (value) {
        facets[key] = value;
      }
    }
    return facets;
  }

  /** Replaces the whole selection — an omitted or empty facet is cleared. */
  set facets(value: AuditFacets) {
    for (const [key, attribute] of FACET_ATTRIBUTES) {
      const next = value[key];
      if (next) {
        this.setAttribute(attribute, next);
      } else {
        this.removeAttribute(attribute);
      }
    }
  }

  get exportable(): boolean {
    return this.hasAttribute("exportable");
  }

  set exportable(value: boolean) {
    this.toggleAttribute("exportable", value);
  }

  get referenceTime(): string {
    return this.getAttribute("reference-time") ?? "";
  }

  set referenceTime(value: string) {
    this.setAttribute("reference-time", value);
  }

  /** The events currently on screen: the full set narrowed by the facets. */
  get visibleEvents(): AuditEvent[] {
    return filterAuditEvents(this.events, this.facets);
  }

  /**
   * The sections the current facets and grouping produce.
   *
   * Public because windowing takes away the alternative: a host used to be
   * able to read the sections off the DOM, and once only a slice is rendered,
   * that stops being the whole picture.
   */
  get groups(): AuditGroup[] {
    return this.currentGroups();
  }

  toggleGroup(key: string, expanded?: boolean): void {
    const next = expanded ?? this.collapsedGroups.has(key);
    if (next) {
      this.collapsedGroups.delete(key);
    } else {
      this.collapsedGroups.add(key);
    }
    this.dispatchEvent(
      new CustomEvent("group-toggled", {
        bubbles: true,
        composed: true,
        detail: { key, expanded: next },
      }),
    );
    if (this.isRendered) {
      this.update();
    }
  }

  expandAll(): void {
    this.collapsedGroups.clear();
    if (this.isRendered) {
      this.update();
    }
  }

  collapseAll(): void {
    for (const group of this.currentGroups()) {
      this.collapsedGroups.add(group.key);
    }
    if (this.isRendered) {
      this.update();
    }
  }

  /**
   * Export what is on screen, not the whole set — an export that silently
   * widens past the reader's filters is a compliance hazard. Returns the CSV
   * and emits `export-requested` so the host owns delivery (download, mail,
   * archive API).
   */
  exportCsv(): string {
    const events = this.visibleEvents;
    const csv = toAuditCsv(events);
    this.dispatchEvent(
      new CustomEvent("export-requested", {
        bubbles: true,
        composed: true,
        detail: { format: "csv", csv, events },
      }),
    );
    return csv;
  }

  /**
   * Watch the scroller so a measurable — or resized — viewport re-plans.
   *
   * Separate from `setupListeners` because that runs *once*, on the element's
   * first connection, while `disconnectedCallback` tears the observer down
   * every time. A log removed and re-inserted would otherwise come back with
   * its listeners intact and its observer gone, so resizing its container
   * would silently stop re-planning. Idempotent, so both callers are safe.
   */
  private observeViewport(): void {
    if (this.viewportObserver || typeof ResizeObserver === "undefined") return;
    this.viewportObserver = new ResizeObserver(() => {
      if (!this.virtualize) return;
      const next = this.currentPlan().window;
      if (this.lastWindow && sameRowWindow(this.lastWindow, next)) return;
      this.update();
    });
    this.viewportObserver.observe(this.groupsEl);
  }

  connectedCallback(): void {
    super.connectedCallback();
    // Re-arm after a disconnect; no-op on the first connection, where
    // setupListeners has already done it.
    this.observeViewport();
  }

  disconnectedCallback(): void {
    // The observer holds a reference to the scroller and the pending frames
    // hold one to the element; a log removed mid-scroll should not keep either
    // alive, or re-render into a shadow root nobody is looking at.
    this.viewportObserver?.disconnect();
    this.viewportObserver = null;
    if (this.scrollFrame) cancelAnimationFrame(this.scrollFrame);
    if (this.measureFrame) cancelAnimationFrame(this.measureFrame);
    this.scrollFrame = 0;
    this.measureFrame = 0;
    super.disconnectedCallback?.();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    // A different grouping dimension mints different section keys, so the
    // collapse state from the old dimension cannot be carried over.
    if (name === "group-by" && oldValue !== newValue) {
      this.collapsedGroups.clear();
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  /**
   * Render only the sections near the viewport. Opt-in for the same reason
   * `box-table`'s is: a windowed surface needs a bounded height to scroll
   * within, and silently windowing an unbounded one would render nothing.
   *
   * Unlike the table, this *can* window a grouped, variable-height surface —
   * it plans over a cumulative offset index rather than a row count times a
   * row height. Grouping is the whole point of an audit log, so refusing to
   * window it would mean refusing the only shape it comes in.
   */
  get virtualize(): boolean {
    return this.hasAttribute("virtualize");
  }

  set virtualize(value: boolean) {
    this.toggleAttribute("virtualize", Boolean(value));
  }

  /**
   * Starting height estimates, in pixels — not contracts. The real heights
   * depend on density, font, and how much an event's summary wraps; after the
   * first paint the element measures one of each and uses that instead.
   */
  get rowHeight(): number {
    return this.measuredHeights?.event ?? this.declaredHeight("row-height", 76);
  }

  get headingHeight(): number {
    return this.measuredHeights?.heading ?? this.declaredHeight("heading-height", 40);
  }

  set rowHeight(value: number) {
    this.measuredHeights = null;
    this.setAttribute("row-height", String(value));
  }

  set headingHeight(value: number) {
    this.measuredHeights = null;
    this.setAttribute("heading-height", String(value));
  }

  private declaredHeight(attribute: string, fallback: number): number {
    const raw = Number(this.getAttribute(attribute));
    return Number.isFinite(raw) && raw > 0 ? raw : fallback;
  }

  /** The window the last render used, or null when it rendered every section. */
  get renderedWindow(): RowWindow | null {
    return this.virtualize ? this.lastWindow : null;
  }

  /**
   * Adopt the real rendered heights, once, when they differ from the ones the
   * last plan used. Re-planning with the measured heights settles immediately —
   * the next measurement matches — so this cannot loop.
   */
  /** Mean rendered height of the elements matching a part, or 0 if none. */
  private meanHeight(part: string): number {
    const nodes = Array.from(this.groupsEl.querySelectorAll<HTMLElement>(`[part="${part}"]`));
    if (nodes.length === 0) return 0;
    const total = nodes.reduce((sum, node) => sum + node.getBoundingClientRect().height, 0);
    return total / nodes.length;
  }

  /**
   * Adopt the real rendered heights when they differ from the ones in use.
   *
   * Two things here exist because the obvious version ran away. Sampling *one*
   * event row and adopting its height looks fine and is not: event rows are not
   * uniform — `summary`, `evidence` and `correlationId` are each optional — so
   * adopting the first rendered row's height moves the window, which renders a
   * different first row, which measures differently, which moves the window.
   * Measured in Chromium with every third event several lines taller: **55 full
   * rebuilds in 0.9 seconds while nothing was scrolling**, the sampled height
   * flipping between 33px and 166.5px.
   *
   * So: average across every rendered row rather than sampling one, which makes
   * the estimate both more representative and far less sensitive to which rows
   * happen to be on screen. And bound the adoptions per row set anyway, because
   * "the average is stable" is an argument about typical data, and this is the
   * code path where being wrong costs a frame-rate collapse rather than a
   * slightly wrong scrollbar.
   */
  private measureRowHeights(): void {
    if (!this.virtualize || this.measureFrame) return;

    const signature = this.heightSignature();
    if (signature !== this.adoptedFor) {
      this.adoptedFor = signature;
      this.adoptionCount = 0;
    }
    if (this.adoptionCount >= MAX_HEIGHT_ADOPTIONS) return;

    const headingHeight = this.meanHeight("group-heading");
    const eventHeight = this.meanHeight("event");
    if (headingHeight <= 0 || eventHeight <= 0) return;
    if (
      Math.abs(headingHeight - this.headingHeight) < 1 &&
      Math.abs(eventHeight - this.rowHeight) < 1
    ) {
      return;
    }

    this.adoptionCount++;
    this.measuredHeights = { heading: headingHeight, event: eventHeight };
    this.measureFrame = requestAnimationFrame(() => {
      this.measureFrame = 0;
      this.update();
    });
  }

  /**
   * What counts as "the same row set" for the adoption budget: change the data,
   * the grouping, the filters or the collapse state and the rows genuinely
   * differ, so measuring again is warranted.
   */
  private heightSignature(): string {
    return JSON.stringify([
      this.getAttribute("events") ?? "",
      this.groupBy,
      this.facets,
      [...this.collapsedGroups].sort(),
    ]);
  }

  private currentPlan(): AuditWindowPlan {
    const { rows, index } = this.cachedRows();
    return planAuditWindow(
      rows,
      { heading: this.headingHeight, event: this.rowHeight },
      {
        viewportHeight: this.groupsEl.clientHeight,
        scrollTop: this.groupsEl.scrollTop,
        contentHeight: this.groupsEl.scrollHeight,
      },
      index,
    );
  }

  private now(): Date {
    return resolveReferenceTime(this.getAttribute("reference-time"));
  }

  /**
   * Grouping, flattening and indexing for the current data, computed once and
   * reused until something that affects them changes.
   *
   * The scroll path asks "did the window move?" on every frame that is not
   * skipped, and answering it used to re-parse the whole `events` attribute,
   * re-filter, re-group, re-flatten and rebuild the offset array — then
   * `update()` did all of it again. That is O(n) twice per frame on a surface
   * whose entire purpose is not being O(n) at scale.
   */
  private rowCache: {
    signature: string;
    groups: AuditGroup[];
    rows: AuditRow[];
    index: OffsetIndex;
  } | null = null;

  private cachedRows(): { groups: AuditGroup[]; rows: AuditRow[]; index: OffsetIndex } {
    const heights = { heading: this.headingHeight, event: this.rowHeight };
    const signature = JSON.stringify([
      this.getAttribute("events") ?? "",
      this.groupBy,
      this.facets,
      this.referenceTime,
      [...this.collapsedGroups].sort(),
      heights,
    ]);
    if (this.rowCache?.signature === signature) return this.rowCache;

    const groups = groupAuditEvents(this.visibleEvents, this.groupBy, this.now());
    const rows = flattenAuditRows(groups, this.collapsedGroups);
    this.rowCache = { signature, groups, rows, index: buildAuditIndex(rows, heights) };
    return this.rowCache;
  }

  private currentGroups(): AuditGroup[] {
    return this.cachedRows().groups;
  }

  private patchFacets(patch: AuditFacets): void {
    this.facets = { ...this.facets, ...patch };
    this.dispatchEvent(
      new CustomEvent("facets-changed", {
        bubbles: true,
        composed: true,
        detail: { facets: this.facets },
      }),
    );
  }

  private eventHtml(event: AuditEvent): string {
    const tone = resolveTimelineTone(event.tone);
    const timestamp = formatAuditTimestamp(event.timestamp);
    const evidence = (event.evidence ?? [])
      .map(entry => {
        const attrs = `part="evidence-link" data-event-id="${escapeHtml(event.id)}" data-evidence-id="${escapeHtml(entry.id)}"`;
        // An unsafe scheme renders as a button: the chip still works as an
        // intent, it just never becomes a navigable link.
        return entry.href && isSafeHref(entry.href)
          ? `<a ${attrs} href="${escapeHtml(entry.href)}">${escapeHtml(entry.label)}</a>`
          : `<button type="button" ${attrs}>${escapeHtml(entry.label)}</button>`;
      })
      .join("");

    return `
      <li part="event" data-event-id="${escapeHtml(event.id)}" data-tone="${escapeHtml(tone)}" style="--audit-tone:${auditToneColor(tone)};">
        <div part="event-topline">
          <button type="button" part="event-action" data-event-id="${escapeHtml(event.id)}">${escapeHtml(event.action)}</button>
          ${event.actor ? `<span part="actor">${escapeHtml(event.actor.name)}</span>` : ""}
          ${event.badge ? `<span part="badge">${escapeHtml(event.badge)}</span>` : ""}
          ${timestamp ? `<time part="timestamp" datetime="${escapeHtml(event.timestamp ?? "")}">${escapeHtml(timestamp)}</time>` : ""}
        </div>
        ${event.summary ? `<p part="event-summary">${escapeHtml(event.summary)}</p>` : ""}
        ${evidence ? `<div part="evidence">${evidence}</div>` : ""}
        ${
          event.correlationId
            ? `<button type="button" part="correlation" data-correlation-id="${escapeHtml(event.correlationId)}" aria-label="Show only workflow run ${escapeHtml(event.correlationId)}">${escapeHtml(event.correlationId)}</button>`
            : ""
        }
      </li>
    `;
  }

  private groupHtml(
    group: AuditGroup,
    index: number,
    slice?: { start: number; end: number },
  ): string {
    const toggleId = `audit-group-toggle-${String(index)}`;
    const bodyId = `audit-group-body-${String(index)}`;
    // Windowed: only the events inside the window. The heading always renders
    // for an intersecting section — [part="group-body"] is aria-labelledby the
    // toggle inside it, so a section without its heading is both unlabelled and
    // impossible to collapse.
    const events = slice ? group.events.slice(slice.start, slice.end) : group.events;
    const actors = group.actorCount
      ? ` · ${String(group.actorCount)} ${group.actorCount === 1 ? "actor" : "actors"}`
      : "";

    return `
      <section part="group" data-group-key="${escapeHtml(group.key)}">
        <h3 part="group-heading">
          <button type="button" part="group-toggle" id="${toggleId}" aria-controls="${bodyId}" aria-expanded="true" data-group-key="${escapeHtml(group.key)}">
            <span part="group-label">${escapeHtml(group.label)}</span>
            <span part="group-count">${String(group.count)} ${group.count === 1 ? "event" : "events"}${actors}</span>
          </button>
        </h3>
        <div part="group-body" id="${bodyId}" role="region" aria-labelledby="${toggleId}">
          <ol part="events" role="list"${slice && slice.start > 0 ? ` start="${String(slice.start + 1)}"` : ""}>${events.map(event => this.eventHtml(event)).join("")}</ol>
        </div>
      </section>
    `;
  }

  private renderOptions(
    select: HTMLSelectElement,
    values: readonly AuditFacetValue[],
    allLabel: string,
  ): void {
    select.innerHTML = [
      `<option value="">${escapeHtml(allLabel)}</option>`,
      // The empty value is the all-values option, so unattributed events are
      // reachable by grouping rather than by faceting.
      ...values
        .filter(entry => entry.value !== "")
        .map(
          entry =>
            `<option value="${escapeHtml(entry.value)}">${escapeHtml(entry.label)} (${String(entry.count)})</option>`,
        ),
    ].join("");
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <section part="panel" aria-labelledby="audit-title">
        <h2 part="title" id="audit-title"></h2>
        <div part="toolbar" role="group" aria-label="Audit filters">
          <div part="group-by" role="group" aria-label="Group by">
            ${AUDIT_GROUP_BY_VALUES.map(
              value =>
                `<button type="button" part="group-by-option" data-group-by="${value}" aria-pressed="false">${AUDIT_GROUP_BY_LABELS[value]}</button>`,
            ).join("")}
          </div>
          <label part="facet">Actor<select part="facet-actor"></select></label>
          <label part="facet">Action<select part="facet-action"></select></label>
          <label part="facet">From<input type="date" part="facet-from"></label>
          <label part="facet">To<input type="date" part="facet-to"></label>
          <button type="button" part="clear-filters" hidden>Clear filters</button>
          <button type="button" part="export" hidden>Export CSV</button>
        </div>
        <div part="drilldown" hidden>
          <span>Workflow run</span>
          <span part="drilldown-id"></span>
          <button type="button" part="drilldown-clear">Clear drill-down</button>
        </div>
        <p part="result-summary" role="status"></p>
        <div part="groups"></div>
        <div part="empty" hidden>No audit events match these filters.</div>
      </section>
    `;

    const root = this.shadowRoot;
    this.titleEl = root.querySelector('[part="title"]')!;
    this.toolbarEl = root.querySelector('[part="toolbar"]')!;
    this.groupByEl = root.querySelector('[part="group-by"]')!;
    this.actorSelectEl = root.querySelector('[part="facet-actor"]')!;
    this.actionSelectEl = root.querySelector('[part="facet-action"]')!;
    this.fromInputEl = root.querySelector('[part="facet-from"]')!;
    this.toInputEl = root.querySelector('[part="facet-to"]')!;
    this.clearFiltersEl = root.querySelector('[part="clear-filters"]')!;
    this.exportEl = root.querySelector('[part="export"]')!;
    this.drilldownEl = root.querySelector('[part="drilldown"]')!;
    this.drilldownIdEl = root.querySelector('[part="drilldown-id"]')!;
    this.summaryEl = root.querySelector('[part="result-summary"]')!;
    this.groupsEl = root.querySelector('[part="groups"]')!;
    this.emptyEl = root.querySelector('[part="empty"]')!;
  }

  protected setupListeners(): void {
    // A windowed surface cannot bootstrap itself from an unmeasured viewport:
    // an empty scroller is zero pixels tall, a zero-height viewport plans an
    // empty window, and an empty window renders nothing to measure. Left alone
    // the log stays blank until something else happens to trigger a render.
    // The observer breaks that circle on the first layout, and keeps earning
    // its place afterwards — a resized container changes how much fits.
    this.observeViewport();

    // Scroll fires continuously; coalesce to one re-render per frame, and skip
    // entirely while the resolved slice is unchanged — most scroll events move
    // the viewport within the sections already rendered.
    this.groupsEl.addEventListener(
      "scroll",
      () => {
        if (!this.virtualize || this.scrollFrame) return;
        this.scrollFrame = requestAnimationFrame(() => {
          this.scrollFrame = 0;
          const next = this.currentPlan().window;
          if (this.lastWindow && sameRowWindow(this.lastWindow, next)) return;
          this.update();
        });
      },
      { passive: true },
    );

    // The toolbar is built once and patched in place, so a select stays open
    // and a half-typed date survives every re-render of the sections below.
    this.toolbarEl.addEventListener("click", event => {
      const target = event.target as HTMLElement;

      const option = target.closest('[part="group-by-option"]') as HTMLButtonElement | null;
      if (option && this.toolbarEl.contains(option)) {
        const next = resolveAuditGroupBy(option.getAttribute("data-group-by"));
        if (next !== this.groupBy) {
          this.groupBy = next;
          this.dispatchEvent(
            new CustomEvent("group-by-changed", {
              bubbles: true,
              composed: true,
              detail: { groupBy: next },
            }),
          );
        }
        return;
      }

      if (target.closest('[part="clear-filters"]')) {
        this.patchFacets({
          actor: undefined,
          action: undefined,
          correlationId: undefined,
          from: undefined,
          to: undefined,
        });
        return;
      }

      if (target.closest('[part="export"]')) {
        this.exportCsv();
      }
    });

    this.toolbarEl.addEventListener("change", event => {
      const target = event.target as HTMLElement;
      if (target === this.actorSelectEl) {
        this.patchFacets({ actor: this.actorSelectEl.value || undefined });
      } else if (target === this.actionSelectEl) {
        this.patchFacets({ action: this.actionSelectEl.value || undefined });
      } else if (target === this.fromInputEl) {
        this.patchFacets({ from: this.fromInputEl.value || undefined });
      } else if (target === this.toInputEl) {
        this.patchFacets({ to: this.toInputEl.value || undefined });
      }
    });

    this.drilldownEl.addEventListener("click", event => {
      if ((event.target as HTMLElement).closest('[part="drilldown-clear"]')) {
        this.patchFacets({ correlationId: undefined });
      }
    });

    this.groupsEl.addEventListener("click", event => {
      const target = event.target as HTMLElement;

      const toggle = target.closest('[part="group-toggle"]') as HTMLButtonElement | null;
      if (toggle && this.groupsEl.contains(toggle)) {
        this.toggleGroup(toggle.getAttribute("data-group-key") ?? "");
        return;
      }

      const correlation = target.closest('[part="correlation"]') as HTMLButtonElement | null;
      if (correlation && this.groupsEl.contains(correlation)) {
        const correlationId = correlation.getAttribute("data-correlation-id") ?? "";
        this.patchFacets({ correlationId });
        this.dispatchEvent(
          new CustomEvent("correlation-selected", {
            bubbles: true,
            composed: true,
            detail: {
              correlationId,
              events: filterAuditEvents(this.events, { correlationId }),
            },
          }),
        );
        return;
      }

      const evidenceLink = target.closest('[part="evidence-link"]') as HTMLElement | null;
      if (evidenceLink && this.groupsEl.contains(evidenceLink)) {
        const source = this.events.find(
          entry => entry.id === (evidenceLink.getAttribute("data-event-id") ?? ""),
        );
        const evidence = source?.evidence?.find(
          entry => entry.id === (evidenceLink.getAttribute("data-evidence-id") ?? ""),
        );
        if (evidence) {
          this.dispatchEvent(
            new CustomEvent("evidence-selected", {
              bubbles: true,
              composed: true,
              detail: { event: source, evidence },
            }),
          );
        }
        return;
      }

      const action = target.closest('[part="event-action"]') as HTMLButtonElement | null;
      if (action && this.groupsEl.contains(action)) {
        const source = this.events.find(
          entry => entry.id === (action.getAttribute("data-event-id") ?? ""),
        );
        if (source) {
          this.dispatchEvent(
            new CustomEvent("event-selected", {
              bubbles: true,
              composed: true,
              detail: { event: source },
            }),
          );
        }
      }
    });
  }

  protected update(): void {
    if (!this.groupsEl) {
      return;
    }

    this.titleEl.textContent = this.heading;

    const all = this.events;
    const facets = this.facets;
    const visible = filterAuditEvents(all, facets);
    const groupBy = this.groupBy;
    const groups = groupAuditEvents(visible, groupBy, this.now());

    for (const option of Array.from(this.groupByEl.querySelectorAll('[part="group-by-option"]'))) {
      option.setAttribute(
        "aria-pressed",
        option.getAttribute("data-group-by") === groupBy ? "true" : "false",
      );
    }

    // Facet options come from the unfiltered set, so choosing one facet never
    // empties another's list.
    const summary = summarizeAuditFacets(all);
    const optionsSignature = JSON.stringify(summary);
    if (optionsSignature !== this.optionsSignature) {
      this.optionsSignature = optionsSignature;
      this.renderOptions(this.actorSelectEl, summary.actors, "All actors");
      this.renderOptions(this.actionSelectEl, summary.actions, "All actions");
    }
    this.actorSelectEl.value = facets.actor ?? "";
    this.actionSelectEl.value = facets.action ?? "";
    this.fromInputEl.value = facets.from ?? "";
    this.toInputEl.value = facets.to ?? "";

    this.clearFiltersEl.hidden = !hasAuditFacets(facets);
    this.exportEl.hidden = !this.exportable;
    this.drilldownEl.hidden = !facets.correlationId;
    this.drilldownIdEl.textContent = facets.correlationId ?? "";

    this.summaryEl.textContent =
      visible.length === all.length
        ? `${String(all.length)} ${all.length === 1 ? "event" : "events"} in ${String(groups.length)} ${groups.length === 1 ? "group" : "groups"}`
        : `Showing ${String(visible.length)} of ${String(all.length)} events in ${String(groups.length)} ${groups.length === 1 ? "group" : "groups"}`;

    // The section markup depends on content only. Collapse state is applied
    // separately below, so expanding a section never rebuilds the log.
    // Windowed renders depend on the scroll position too, so the resolved
    // slice joins the signature — otherwise scrolling would keep the sections
    // that were already on screen and never draw the ones scrolled into view.
    const plan = this.virtualize ? this.currentPlan() : null;
    this.lastWindow = plan?.window ?? null;

    const contentSignature = JSON.stringify([
      this.getAttribute("events") ?? "",
      groupBy,
      facets,
      this.referenceTime,
      // The whole rendered geometry, not just the slice: collapsing a section
      // *below* the window leaves the slice and the top spacer untouched while
      // making the log shorter, and a stale bottom spacer outlives the content
      // it described.
      plan
        ? [plan.window.startIndex, plan.window.endIndex, plan.paddingTop, plan.paddingBottom]
        : null,
    ]);
    if (contentSignature !== this.contentSignature) {
      this.contentSignature = contentSignature;

      const active = this.shadowRoot?.activeElement as HTMLElement | null;
      const focusKey =
        active && this.groupsEl.contains(active)
          ? {
              part: active.getAttribute("part") ?? "",
              groupKey: active.getAttribute("data-group-key"),
              eventId: active.getAttribute("data-event-id"),
            }
          : null;

      const spacer = (height: number, position: string): string =>
        height > 0
          ? `<div part="spacer" data-position="${position}" aria-hidden="true" style="block-size:${String(height)}px;"></div>`
          : "";

      this.groupsEl.innerHTML = plan
        ? spacer(plan.paddingTop, "top") +
          plan.groups
            .map(planned =>
              this.groupHtml(groups[planned.groupIndex]!, planned.groupIndex, {
                start: planned.eventStart,
                end: planned.eventEnd,
              }),
            )
            .join("") +
          spacer(plan.paddingBottom, "bottom")
        : groups.map((group, index) => this.groupHtml(group, index)).join("");

      if (focusKey?.part) {
        const restored = Array.from(
          this.groupsEl.querySelectorAll(`[part="${focusKey.part}"]`),
        ).find(
          node =>
            node.getAttribute("data-group-key") === focusKey.groupKey &&
            node.getAttribute("data-event-id") === focusKey.eventId,
        ) as HTMLElement | undefined;
        restored?.focus();
      }
    }

    for (const section of Array.from(this.groupsEl.querySelectorAll('[part="group"]'))) {
      const key = section.getAttribute("data-group-key") ?? "";
      const expanded = !this.collapsedGroups.has(key);
      section.querySelector('[part="group-toggle"]')?.setAttribute("aria-expanded", String(expanded));
      const body = section.querySelector('[part="group-body"]') as HTMLElement | null;
      if (body) {
        body.hidden = !expanded;
      }
    }

    this.groupsEl.hidden = groups.length === 0;
    this.emptyEl.hidden = groups.length > 0;

    if (this.virtualize) {
      this.measureRowHeights();
    }
  }
}

AuditLog.register();
