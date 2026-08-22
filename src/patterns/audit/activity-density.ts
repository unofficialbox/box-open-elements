import {
  computeActivityDensity,
  formatUtcDay,
  formatUtcMonth,
  resolveAuditDay,
} from "./types.js";
import type { ActivityDensity, ActivityDensityCell, AuditEvent } from "./types.js";
import { escapeHtml, resolveReferenceTime } from "./shared.js";
import { isTimelineEventRecord } from "../timeline/types.js";
import { BaseElement } from "../../core/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-activity-density";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;


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

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="scroller"] {
          overflow-x: auto;
        }

        [part="grid"] {
          border-collapse: separate;
          border-spacing: 3px;
        }

        [part="caption"] {
          caption-side: top;
          text-align: start;
          padding-block-end: 0.35rem;
          font-size: 0.8rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="weekday"],
        [part="month"] {
          font-size: 0.66rem;
          font-weight: 600;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          text-align: end;
          padding-inline-end: 0.25rem;
          white-space: nowrap;
        }

        [part="month"] {
          text-align: start;
          padding: 0;
        }

        [part="cell"] {
          inline-size: 0.85rem;
          block-size: 0.85rem;
          padding: 0;
          border-radius: ${boeRadius.size};
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="cell"][data-level="1"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 28%, transparent);
        }

        [part="cell"][data-level="2"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 50%, transparent);
        }

        [part="cell"][data-level="3"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 74%, transparent);
        }

        [part="cell"][data-level="4"] {
          background: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="cell-button"] {
          appearance: none;
          display: block;
          inline-size: 100%;
          block-size: 100%;
          min-block-size: 0.85rem;
          padding: 0;
          border: none;
          border-radius: inherit;
          background: none;
          cursor: pointer;
        }

        [part="cell-button"]:focus-visible {
          outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5);
          outline-offset: 2px;
        }

        [part="legend"] {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.72rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="legend-swatch"] {
          inline-size: 0.7rem;
          block-size: 0.7rem;
          border-radius: ${boeRadius.size};
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="legend-swatch"][data-level="1"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 28%, transparent);
        }

        [part="legend-swatch"][data-level="2"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 50%, transparent);
        }

        [part="legend-swatch"][data-level="3"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 74%, transparent);
        }

        [part="legend-swatch"][data-level="4"] {
          background: var(--boe-token-surface-surface-brand, #0061d5);
        }
      `;

/**
 * The managerial companion to `box-audit-log`: a calendar heatmap of event
 * volume per UTC day over a trailing window, for spotting throughput and
 * quiet periods at a glance.
 *
 * Days with activity are buttons in a roving-tabindex grid (arrow keys move
 * by day and by week, Home/End jump to the ends of the window), each labelled
 * with its own count and date so the surface is understandable without the
 * colour. Selecting one emits `day-selected` with that day's events — the
 * drill-down into the log.
 */
export class ActivityDensityStrip extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;

  static get observedAttributes(): string[] {
    return ["events", "heading", "reference-time", "weeks"];
  }

  private titleEl!: HTMLElement;

  private gridEl!: HTMLElement;

  private captionEl!: HTMLElement;

  private monthsRowEl!: HTMLElement;

  private rowsEl!: HTMLElement;

  private signature = "";

  /** Roving focus position, `week:weekday`. Null until the first render. */
  private activeKey: string | null = null;

  private renderedWeeks = 0;

  /** Raw `events` attribute the parse cache was built from. */
  private eventsRaw: string | null = null;

  private eventsCache: AuditEvent[] = [];

  get heading(): string {
    return this.getAttribute("heading") ?? "Activity density";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  /**
   * Memoized on the raw attribute for the same reason as `box-audit-log`:
   * `density`, `eventsOn`, and `update` each read it, and an arrow keypress
   * must not re-parse the payload. Returns a copy.
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

  get weeks(): number {
    const raw = Number.parseInt(this.getAttribute("weeks") ?? "", 10);
    return Number.isFinite(raw) ? raw : 12;
  }

  set weeks(value: number) {
    this.setAttribute("weeks", String(value));
  }

  get referenceTime(): string {
    return this.getAttribute("reference-time") ?? "";
  }

  set referenceTime(value: string) {
    this.setAttribute("reference-time", value);
  }

  /** The computed window — cells, totals, and the busiest day's count. */
  get density(): ActivityDensity {
    return computeActivityDensity(this.events, {
      now: resolveReferenceTime(this.getAttribute("reference-time")),
      weeks: this.weeks,
    });
  }

  /** Every event on the given UTC day, in input order. */
  eventsOn(date: string): AuditEvent[] {
    return this.events.filter(event => resolveAuditDay(event) === date);
  }

  private emitDaySelected(date: string, count: number): void {
    this.dispatchEvent(
      new CustomEvent("day-selected", {
        bubbles: true,
        composed: true,
        detail: { date, count, events: this.eventsOn(date) },
      }),
    );
  }

  private buttons(): HTMLButtonElement[] {
    return Array.from(this.gridEl.querySelectorAll('[part="cell-button"]'));
  }

  /**
   * Buttons oldest → newest. DOM order is weekday-major (the grid renders one
   * row per weekday), so it is *not* chronological — anything that means
   * "first" or "last day in the window" has to sort by date.
   */
  private buttonsByDate(): HTMLButtonElement[] {
    return this.buttons().sort((left, right) =>
      (left.getAttribute("data-date") ?? "").localeCompare(right.getAttribute("data-date") ?? ""),
    );
  }

  private buttonAt(week: number, weekday: number): HTMLButtonElement | null {
    return this.gridEl.querySelector(
      `[part="cell-button"][data-week="${String(week)}"][data-weekday="${String(weekday)}"]`,
    );
  }

  /** Walk in one grid direction until a day with activity is found. */
  private step(
    week: number,
    weekday: number,
    deltaWeek: number,
    deltaWeekday: number,
  ): HTMLButtonElement | null {
    // The rendered column count, not a recomputed window: a keypress must not
    // re-parse the whole event payload.
    const total = this.renderedWeeks;
    let nextWeek = week + deltaWeek;
    let nextWeekday = weekday + deltaWeekday;
    while (nextWeek >= 0 && nextWeek < total && nextWeekday >= 0 && nextWeekday < 7) {
      const button = this.buttonAt(nextWeek, nextWeekday);
      if (button) {
        return button;
      }
      nextWeek += deltaWeek;
      nextWeekday += deltaWeekday;
    }
    return null;
  }

  private focusButton(button: HTMLButtonElement): void {
    this.activeKey = `${button.getAttribute("data-week") ?? ""}:${button.getAttribute("data-weekday") ?? ""}`;
    for (const candidate of this.buttons()) {
      candidate.tabIndex = candidate === button ? 0 : -1;
    }
    button.focus();
  }

  /**
   * A day with activity is a labelled button — that label is the accessible
   * contract, since colour alone carries no meaning. A quiet day is an inert
   * cell with a hover title: nothing to drill into, and no extra tab stop.
   */
  private cellHtml(cell: ActivityDensityCell): string {
    const date = escapeHtml(cell.date);
    const label = escapeHtml(
      `${String(cell.count)} ${cell.count === 1 ? "event" : "events"} on ${formatUtcDay(cell.date)}`,
    );
    const body =
      cell.count > 0
        ? `<button type="button" part="cell-button" tabindex="-1" data-date="${date}" data-week="${String(cell.week)}" data-weekday="${String(cell.weekday)}" data-count="${String(cell.count)}" aria-label="${label}"></button>`
        : "";

    return `<td part="cell" data-level="${String(cell.level)}" data-date="${date}" data-count="${String(cell.count)}" title="${label}">${body}</td>`;
  }

  private rebuild(density: ActivityDensity): void {
    this.renderedWeeks = density.weeks;
    const byWeekday = new Map<number, ActivityDensityCell[]>();
    for (const cell of density.cells) {
      const row = byWeekday.get(cell.weekday) ?? [];
      row.push(cell);
      byWeekday.set(cell.weekday, row);
    }

    // Column headers carry the month, printed once where it changes — the
    // same sparse labelling a git contribution graph uses.
    const firstRow = byWeekday.get(0) ?? [];
    let lastMonth = "";
    const monthCells = firstRow.map(cell => {
      const month = cell.date.slice(0, 7);
      const label = month === lastMonth ? "" : formatUtcMonth(cell.date);
      lastMonth = month;
      return `<th scope="col" part="month">${label}</th>`;
    });

    // Only the header row and the body are re-minted — the caption is part of
    // the stable shell, so rebuilding the grid never drops it.
    this.monthsRowEl.innerHTML = `<td></td>${monthCells.join("")}`;
    this.rowsEl.innerHTML = WEEKDAY_LABELS.map((label, weekday) => {
      const cells = (byWeekday.get(weekday) ?? []).map(cell => this.cellHtml(cell)).join("");
      return `<tr><th scope="row" part="weekday">${label}</th>${cells}</tr>`;
    }).join("");
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <section part="panel">
        <h2 part="title"></h2>
        <div part="scroller">
          <table part="grid">
            <caption part="caption"></caption>
            <thead><tr part="months-row"></tr></thead>
            <tbody part="rows"></tbody>
          </table>
        </div>
        <div part="legend">
          <span>Less</span>
          ${[0, 1, 2, 3, 4]
            .map(level => `<span part="legend-swatch" data-level="${String(level)}"></span>`)
            .join("")}
          <span>More</span>
        </div>
      </section>
    `;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.gridEl = this.shadowRoot.querySelector('[part="grid"]')!;
    this.captionEl = this.shadowRoot.querySelector('[part="caption"]')!;
    this.monthsRowEl = this.shadowRoot.querySelector('[part="months-row"]')!;
    this.rowsEl = this.shadowRoot.querySelector('[part="rows"]')!;
  }

  protected setupListeners(): void {
    this.gridEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest(
        '[part="cell-button"]',
      ) as HTMLButtonElement | null;
      if (!button || !this.gridEl.contains(button)) {
        return;
      }
      this.focusButton(button);
      this.emitDaySelected(
        button.getAttribute("data-date") ?? "",
        Number(button.getAttribute("data-count") ?? "0"),
      );
    });

    this.gridEl.addEventListener("keydown", event => {
      const button = (event.target as HTMLElement).closest(
        '[part="cell-button"]',
      ) as HTMLButtonElement | null;
      if (!button || !this.gridEl.contains(button)) {
        return;
      }

      const week = Number(button.getAttribute("data-week") ?? "0");
      const weekday = Number(button.getAttribute("data-weekday") ?? "0");
      // Home/End mean the ends of the *window*, not the ends of the DOM.
      const byDate = this.buttonsByDate();
      let next: HTMLButtonElement | null = null;

      switch (event.key) {
        case "ArrowLeft":
          next = this.step(week, weekday, -1, 0);
          break;
        case "ArrowRight":
          next = this.step(week, weekday, 1, 0);
          break;
        case "ArrowUp":
          next = this.step(week, weekday, 0, -1);
          break;
        case "ArrowDown":
          next = this.step(week, weekday, 0, 1);
          break;
        case "Home":
          next = byDate[0] ?? null;
          break;
        case "End":
          next = byDate[byDate.length - 1] ?? null;
          break;
        default:
          return;
      }

      if (next) {
        event.preventDefault();
        this.focusButton(next);
      }
    });
  }

  protected update(): void {
    if (!this.gridEl) {
      return;
    }

    this.titleEl.textContent = this.heading;

    const density = this.density;
    const signature = JSON.stringify([
      this.getAttribute("events") ?? "",
      this.weeks,
      this.referenceTime,
    ]);
    if (signature !== this.signature) {
      this.signature = signature;
      this.rebuild(density);
      // Cells are re-minted, so the previous roving position may be gone.
      this.activeKey = null;
    }

    this.captionEl.textContent = `${String(density.total)} ${density.total === 1 ? "event" : "events"} from ${formatUtcDay(density.start)} to ${formatUtcDay(density.end)}`;
    this.gridEl.setAttribute("aria-label", this.heading);

    const all = this.buttons();
    const byDate = this.buttonsByDate();
    const active =
      (this.activeKey
        ? all.find(
            button =>
              `${button.getAttribute("data-week") ?? ""}:${button.getAttribute("data-weekday") ?? ""}` ===
              this.activeKey,
          )
        : undefined) ??
      // Default the tab stop to the most recent day with activity — the last
      // by date, not the last in the weekday-major DOM order.
      byDate[byDate.length - 1];

    for (const button of all) {
      button.tabIndex = button === active ? 0 : -1;
    }
    if (active) {
      this.activeKey = `${active.getAttribute("data-week") ?? ""}:${active.getAttribute("data-weekday") ?? ""}`;
    }
  }
}

ActivityDensityStrip.register();
