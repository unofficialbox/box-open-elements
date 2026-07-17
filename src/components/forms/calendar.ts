import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";

const DEFAULT_TAG_NAME = "box-calendar";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (value: number): string => String(value).padStart(2, "0");

/** An immutable calendar date expressed as {y, m (1-12), d}. */
interface CalendarDate {
  y: number;
  m: number;
  d: number;
}

const toISO = ({ y, m, d }: CalendarDate): string => `${y}-${pad(m)}-${pad(d)}`;

const parseISO = (value: string): CalendarDate | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return null;
  }
  return { y, m, d };
};

const parseMonth = (value: string): { y: number; m: number } | null => {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }
  const m = Number(match[2]);
  if (m < 1 || m > 12) {
    return null;
  }
  return { y: Number(match[1]), m };
};

const daysInMonth = (y: number, m: number): number => new Date(Date.UTC(y, m, 0)).getUTCDate();

const firstWeekday = (y: number, m: number): number => new Date(Date.UTC(y, m - 1, 1)).getUTCDay();

/** Add `delta` days to a date, rolling across month/year boundaries. */
const addDays = ({ y, m, d }: CalendarDate, delta: number): CalendarDate => {
  const next = new Date(Date.UTC(y, m - 1, d + delta));
  return { y: next.getUTCFullYear(), m: next.getUTCMonth() + 1, d: next.getUTCDate() };
};

const clampDay = (y: number, m: number, d: number): number => Math.min(d, daysInMonth(y, m));

const calendarStyles = `
  :host {
    display: inline-block;
    color: inherit;
    font: inherit;
    font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
  }

  [part="calendar"] {
    display: grid;
    gap: 0.55rem;
    inline-size: 17.5rem;
    max-inline-size: 100%;
    padding: 0.7rem;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    border-radius: 0.7rem;
    background:
      linear-gradient(
        180deg,
        var(--boe-token-surface-surface, #ffffff) 0%,
        color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, var(--boe-token-surface-surface-secondary, #fbfbfb) 8%) 100%
      );
  }

  [part="header"] {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  [part="title"] {
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--boe-token-text-text, #222222);
  }

  [part~="nav"] {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    inline-size: 2rem;
    block-size: 2rem;
    padding: 0;
    border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 78%, var(--boe-token-surface-surface, #ffffff) 22%);
    border-radius: 0.6rem;
    background: var(--boe-token-surface-surface, #ffffff);
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    cursor: pointer;
    transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, border-color ${boeMotionDuration.interactive} ${boeMotionEasing.standard}, box-shadow ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
  }

  [part~="nav"] svg {
    inline-size: 0.85rem;
    block-size: 0.85rem;
  }

  [part~="nav"]:hover {
    border-color: var(--boe-token-stroke-stroke-hover, #bcbcbc);
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part~="nav"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 20%, transparent);
  }

  [part="weekdays"],
  [part="week"] {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.15rem;
  }

  [part="grid"] {
    display: grid;
    gap: 0.15rem;
  }

  [part="weekday"] {
    text-align: center;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--boe-token-text-text-secondary, #6f6f6f);
    padding-block: 0.2rem;
  }

  [part="day-blank"] {
    block-size: 2.1rem;
  }

  [part~="day"] {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    block-size: 2.1rem;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 0.55rem;
    background: transparent;
    font: inherit;
    font-size: 0.82rem;
    color: var(--boe-token-text-text, #222222);
    cursor: pointer;
    transition: background ${boeMotionDuration.fast} ${boeMotionEasing.standard}, color ${boeMotionDuration.fast} ${boeMotionEasing.standard}, border-color ${boeMotionDuration.fast} ${boeMotionEasing.standard}, box-shadow ${boeMotionDuration.fast} ${boeMotionEasing.standard};
  }

  [part~="day"]:hover:not(:disabled) {
    background: var(--boe-token-surface-surface-hover, #f4f4f4);
  }

  [part~="day"][data-today="true"] {
    border-color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 40%, transparent);
    font-weight: 700;
  }

  [part~="day"][data-selected="true"] {
    background: var(--boe-token-surface-surface-brand, #0061d5);
    border-color: var(--boe-token-surface-surface-brand, #0061d5);
    color: var(--boe-token-text-text-on-brand, #ffffff);
    font-weight: 700;
  }

  [part~="day"][data-selected="true"]:hover:not(:disabled) {
    background: var(--boe-token-surface-surface-brand-hover, #0057c0);
  }

  [part~="day"]:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 24%, transparent);
  }

  [part~="day"]:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export class BoxCalendarElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["disabled", "max", "min", "month", "today", "value"];
  }

  /** The date the roving tabindex currently points at. */
  private activeDate: CalendarDate | null = null;
  private titleEl!: HTMLElement;
  private gridEl!: HTMLElement;
  private weekdayCells = WEEKDAYS.map(
    label => `<span part="weekday" role="columnheader" aria-label="${escapeHtml(label)}">${label}</span>`,
  ).join("");

  get value(): string {
    return this.getAttribute("value") ?? "";
  }

  set value(next: string) {
    this.setAttribute("value", next);
  }

  get month(): string {
    return this.getAttribute("month") ?? "";
  }

  set month(next: string) {
    this.setAttribute("month", next);
  }

  get min(): string {
    return this.getAttribute("min") ?? "";
  }

  set min(next: string) {
    this.setAttribute("min", next);
  }

  get max(): string {
    return this.getAttribute("max") ?? "";
  }

  set max(next: string) {
    this.setAttribute("max", next);
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(next: boolean) {
    this.toggleAttribute("disabled", next);
  }

  /** Optional ISO date used as "today" for highlighting / fallback month (pin for demos). */
  get today(): string {
    return this.getAttribute("today") ?? "";
  }

  set today(next: string) {
    if (next) {
      this.setAttribute("today", next);
    } else {
      this.removeAttribute("today");
    }
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void {
    this.activeDate = null;
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  private resolveToday(): CalendarDate {
    const pinned = parseISO(this.today);
    if (pinned) {
      return pinned;
    }
    const now = new Date();
    return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() };
  }

  /** The year/month currently displayed: explicit `month`, else `value`'s month, else today. */
  private displayedMonth(): { y: number; m: number } {
    const explicit = parseMonth(this.month);
    if (explicit) {
      return explicit;
    }
    const selected = parseISO(this.value);
    if (selected) {
      return { y: selected.y, m: selected.m };
    }
    const today = this.resolveToday();
    return { y: today.y, m: today.m };
  }

  private isOutOfRange(iso: string): boolean {
    if (this.min && iso < this.min) {
      return true;
    }
    if (this.max && iso > this.max) {
      return true;
    }
    return false;
  }

  private goToMonth(y: number, m: number): void {
    const normalized = `${y}-${pad(m)}`;
    this.activeDate = null;
    this.setAttribute("month", normalized);
    this.dispatchEvent(
      new CustomEvent("month-changed", {
        bubbles: true,
        composed: true,
        detail: { month: normalized },
      }),
    );
  }

  private shiftMonth(delta: number): void {
    const { y, m } = this.displayedMonth();
    const next = new Date(Date.UTC(y, m - 1 + delta, 1));
    this.goToMonth(next.getUTCFullYear(), next.getUTCMonth() + 1);
  }

  private selectDate(date: CalendarDate): void {
    const iso = toISO(date);
    if (this.disabled || this.isOutOfRange(iso)) {
      return;
    }
    this.setAttribute("value", iso);
    // Keep the grid on the month of the chosen day.
    this.setAttribute("month", `${date.y}-${pad(date.m)}`);
    // `setAttribute` nulls activeDate via attributeChangedCallback — restore after.
    this.activeDate = date;
    this.update();
    this.focusActive();
    this.dispatchEvent(
      new CustomEvent("value-changed", {
        bubbles: true,
        composed: true,
        detail: { value: iso },
      }),
    );
  }

  /** Move roving focus by `delta` days, following into the neighbouring month if needed. */
  private moveActive(delta: number): void {
    const current = this.activeDate ?? this.resolveActiveDate();
    const next = this.clampToEnabled(addDays(current, delta));
    const display = this.displayedMonth();
    // `setAttribute` synchronously runs attributeChangedCallback, which nulls out
    // activeDate — so assign `next` *after* the month change or focus would be lost.
    if (next.y !== display.y || next.m !== display.m) {
      this.setAttribute("month", `${next.y}-${pad(next.m)}`);
    }
    this.activeDate = next;
    this.update();
    this.focusActive();
  }

  /**
   * Clamp a candidate roving date to the nearest in-range day so the tabbable cell
   * (and arrow-key navigation) never lands on a disabled/out-of-range button, which
   * would leave the grid unreachable via Tab. When the whole calendar is disabled
   * there is nothing to focus, so the candidate is returned untouched.
   */
  private clampToEnabled(candidate: CalendarDate): CalendarDate {
    if (this.disabled || !this.isOutOfRange(toISO(candidate))) {
      return candidate;
    }
    for (let step = 1; step <= 366; step += 1) {
      const forward = addDays(candidate, step);
      if (!this.isOutOfRange(toISO(forward))) {
        return forward;
      }
      const backward = addDays(candidate, -step);
      if (!this.isOutOfRange(toISO(backward))) {
        return backward;
      }
    }
    return candidate;
  }

  private focusActive(): void {
    if (!this.activeDate) {
      return;
    }
    const iso = toISO(this.activeDate);
    const button = this.gridEl?.querySelector(`[data-date="${iso}"]`) as HTMLButtonElement | null;
    button?.focus();
  }

  /** The date the roving tabindex should default to for the displayed month. */
  private resolveActiveDate(): CalendarDate {
    if (this.activeDate) {
      return this.activeDate;
    }
    const { y, m } = this.displayedMonth();
    const selected = parseISO(this.value);
    let candidate: CalendarDate;
    if (selected && selected.y === y && selected.m === m) {
      candidate = selected;
    } else {
      const today = this.resolveToday();
      candidate = today.y === y && today.m === m ? today : { y, m, d: 1 };
    }
    return this.clampToEnabled(candidate);
  }

  private handleGridKeydown(event: KeyboardEvent): void {
    const deltas: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    if (event.key in deltas) {
      event.preventDefault();
      this.moveActive(deltas[event.key]);
      return;
    }
    if (event.key === "PageUp") {
      event.preventDefault();
      this.moveActive(-daysInMonth(this.displayedMonth().y, this.displayedMonth().m));
      return;
    }
    if (event.key === "PageDown") {
      event.preventDefault();
      const { y, m } = this.displayedMonth();
      this.moveActive(daysInMonth(y, m));
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      const active = this.activeDate ?? this.resolveActiveDate();
      this.moveActive(1 - active.d);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      const active = this.activeDate ?? this.resolveActiveDate();
      this.moveActive(daysInMonth(active.y, active.m) - active.d);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const active = this.activeDate ?? this.resolveActiveDate();
      this.selectDate(active);
    }
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>${calendarStyles}</style>
      <div part="calendar" role="group" aria-label="Calendar">
        <div part="header">
          <button type="button" part="nav nav-prev" aria-label="Previous month">
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <span part="title" aria-live="polite"></span>
          <button type="button" part="nav nav-next" aria-label="Next month">
            <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
        <div part="grid" role="grid"></div>
      </div>
    `;
    this.titleEl = this.shadowRoot.querySelector('[part="title"]')!;
    this.gridEl = this.shadowRoot.querySelector('[part="grid"]')!;
  }

  protected setupListeners(): void {
    this.shadowRoot?.querySelector('[part~="nav-prev"]')?.addEventListener("click", () => this.shiftMonth(-1));
    this.shadowRoot?.querySelector('[part~="nav-next"]')?.addEventListener("click", () => this.shiftMonth(1));

    this.gridEl.addEventListener("click", event => {
      const button = (event.target as HTMLElement).closest('[part~="day"]') as HTMLButtonElement | null;
      if (!button || !this.gridEl.contains(button)) {
        return;
      }
      const date = parseISO(button.dataset.date ?? "");
      if (date) {
        this.selectDate(date);
      }
    });

    this.gridEl.addEventListener("keydown", event => this.handleGridKeydown(event as KeyboardEvent));
  }

  protected update(): void {
    if (!this.titleEl || !this.gridEl) {
      return;
    }

    const { y, m } = this.displayedMonth();
    const selected = parseISO(this.value);
    const active = this.resolveActiveDate();
    const activeIso = toISO({ y, m, d: clampDay(y, m, active.d) });
    const todayIso = toISO(this.resolveToday());

    this.titleEl.textContent = `${MONTH_NAMES[m - 1]} ${y}`;
    this.gridEl.setAttribute("aria-label", `${MONTH_NAMES[m - 1]} ${y}`);

    const leading = firstWeekday(y, m);
    const total = daysInMonth(y, m);

    const cells: string[] = [];
    for (let i = 0; i < leading; i += 1) {
      cells.push(`<span part="day-blank" aria-hidden="true"></span>`);
    }
    for (let day = 1; day <= total; day += 1) {
      const iso = toISO({ y, m, d: day });
      const isSelected = selected ? toISO(selected) === iso : false;
      const isToday = iso === todayIso;
      const isActive = iso === activeIso;
      const outOfRange = this.isOutOfRange(iso);
      const disabled = this.disabled || outOfRange;
      cells.push(
        `<button
          type="button"
          part="day${isSelected ? " day-selected" : ""}${isToday ? " day-today" : ""}"
          role="gridcell"
          data-date="${iso}"
          data-selected="${isSelected ? "true" : "false"}"
          data-today="${isToday ? "true" : "false"}"
          tabindex="${isActive && !disabled ? "0" : "-1"}"
          aria-selected="${isSelected ? "true" : "false"}"
          aria-label="${escapeHtml(`${MONTH_NAMES[m - 1]} ${day}, ${y}`)}"
          ${disabled ? "disabled" : ""}
        >${day}</button>`,
      );
    }
    while (cells.length % 7 !== 0) {
      cells.push(`<span part="day-blank" aria-hidden="true"></span>`);
    }

    const rows: string[] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(`<div part="week" role="row">${cells.slice(i, i + 7).join("")}</div>`);
    }

    this.gridEl.innerHTML = `
      <div part="weekdays" role="row">${this.weekdayCells}</div>
      ${rows.join("")}
    `;
  }
}

export const defineBoxCalendarElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxCalendarElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxCalendarElement;
  }

  customElements.define(tagName, BoxCalendarElement);
  return BoxCalendarElement;
};
