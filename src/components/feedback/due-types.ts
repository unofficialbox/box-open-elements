/**
 * SLA / aging urgency model, shared by `box-due-badge` and the work-queue
 * pattern. Pure and timezone-independent.
 *
 * This lives with the component rather than the pattern because patterns
 * compose components, not the other way round. `patterns/work-queue/types`
 * re-exports it, so its public import path is unchanged.
 */

/** Urgency buckets, most urgent first. */
export type DueBucket = "overdue" | "today" | "this-week" | "later" | "none";

export const DUE_BUCKET_ORDER: readonly DueBucket[] = [
  "overdue",
  "today",
  "this-week",
  "later",
  "none",
];

export const DUE_BUCKET_LABELS: Record<DueBucket, string> = {
  overdue: "Overdue",
  today: "Due today",
  "this-week": "Due this week",
  later: "Later",
  none: "No due date",
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Bucket a due timestamp relative to `now`. Pure and timezone-independent:
 * callers supply the reference time and day boundaries resolve against the
 * reference time's UTC day, so the same inputs bucket identically on every
 * host. A host that wants local-day semantics offsets the reference time it
 * passes.
 */
export const resolveDueBucket = (dueAt: string | undefined, now: Date): DueBucket => {
  if (!dueAt) {
    return "none";
  }
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) {
    return "none";
  }

  if (due.getTime() < now.getTime()) {
    return "overdue";
  }

  const endOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) - 1;
  if (due.getTime() <= endOfToday) {
    return "today";
  }

  if (due.getTime() <= endOfToday + 6 * DAY_MS) {
    return "this-week";
  }

  return "later";
};

/**
 * Whole days between `dueAt` and `now`, negative when overdue. Measured
 * between UTC day boundaries rather than by elapsed milliseconds, so
 * "tomorrow" is 1 whether it is 23 hours away or 25.
 */
export const daysUntilDue = (dueAt: string | undefined, now: Date): number | null => {
  if (!dueAt) {
    return null;
  }
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) {
    return null;
  }
  const dueDay = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const nowDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((dueDay - nowDay) / DAY_MS);
};

/**
 * Human phrasing for a due date: "Overdue by 3 days", "Due today",
 * "Due tomorrow", "Due in 5 days". Aging is stated in days rather than as a
 * bare date because an SLA badge exists to answer "how late is this?".
 */
export const formatDueLabel = (dueAt: string | undefined, now: Date): string => {
  const days = daysUntilDue(dueAt, now);
  if (days === null) {
    return DUE_BUCKET_LABELS.none;
  }
  if (days < 0) {
    const overdue = Math.abs(days);
    return `Overdue by ${String(overdue)} ${overdue === 1 ? "day" : "days"}`;
  }
  if (days === 0) {
    // A same-day deadline that has already passed is overdue by hours, not
    // days — the bucket knows, the day count does not.
    return resolveDueBucket(dueAt, now) === "overdue" ? "Overdue" : "Due today";
  }
  if (days === 1) {
    return "Due tomorrow";
  }
  return `Due in ${String(days)} days`;
};
