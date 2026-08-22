import type { TimelineEvent } from "../timeline/types.js";

/**
 * The audit layer reads the same append-only event contract `box-timeline`
 * renders. The timeline is the flat feed; this pattern is the aggregation,
 * faceting, drill-down, and export layer over identical records, so a host
 * feeds both surfaces from one source without a second model.
 */
export type AuditEvent = TimelineEvent;

/** The dimension sections are grouped by. */
export type AuditGroupBy = "day" | "actor" | "action";

export const AUDIT_GROUP_BY_VALUES: readonly AuditGroupBy[] = ["day", "actor", "action"];

export const AUDIT_GROUP_BY_LABELS: Record<AuditGroupBy, string> = {
  day: "Day",
  actor: "Actor",
  action: "Action",
};

export const resolveAuditGroupBy = (value: string | null | undefined): AuditGroupBy =>
  value && (AUDIT_GROUP_BY_VALUES as readonly string[]).includes(value)
    ? (value as AuditGroupBy)
    : "day";

/**
 * Facet selection. Every facet is an exact match except `from`/`to`, which
 * bound the event instant inclusively.
 */
export interface AuditFacets {
  /** Matches `actor.name` exactly. */
  actor?: string;
  /** Matches `action` exactly. */
  action?: string;
  /** The workflow-run drill-down. */
  correlationId?: string;
  /** Inclusive ISO lower bound. */
  from?: string;
  /** Inclusive ISO upper bound. */
  to?: string;
}

export interface AuditGroup {
  /** Stable identity for the section — the collapse state is keyed by it. */
  key: string;
  label: string;
  events: AuditEvent[];
  count: number;
  /** Distinct attributed actors in the group; 0 when every event is unattributed. */
  actorCount: number;
}

export interface AuditFacetValue {
  value: string;
  label: string;
  count: number;
}

export interface AuditFacetSummary {
  actors: AuditFacetValue[];
  actions: AuditFacetValue[];
}

export const AUDIT_UNDATED_KEY = "undated";
export const AUDIT_UNATTRIBUTED_KEY = "";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The event's instant in epoch milliseconds, or `null` when it carries no
 * usable timestamp. Undated events are a real case in imported audit data —
 * they sort last rather than being dropped.
 */
export const auditEventInstant = (event: AuditEvent): number | null => {
  if (!event.timestamp) {
    return null;
  }
  const value = new Date(event.timestamp).getTime();
  return Number.isNaN(value) ? null : value;
};

/** Newest first; undated events sink to the end without reordering among themselves. */
const byNewestFirst = (left: AuditEvent, right: AuditEvent): number => {
  const a = auditEventInstant(left);
  const b = auditEventInstant(right);
  if (a === b) {
    return 0;
  }
  if (a === null) {
    return 1;
  }
  if (b === null) {
    return -1;
  }
  return b - a;
};

/**
 * The UTC calendar day (`YYYY-MM-DD`) an event belongs to, or `null` when it
 * is undated. Day keys and day labels are both derived in UTC so a viewer's
 * timezone can never split one audit day across two sections. A host that
 * wants local-day semantics offsets the timestamps it supplies.
 */
export const resolveAuditDay = (event: AuditEvent): string | null => {
  const instant = auditEventInstant(event);
  if (instant === null) {
    return null;
  }
  return new Date(instant).toISOString().slice(0, 10);
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * The one absolute-day formatter — `Aug 13, 2026`, always in UTC. Accepts a
 * `YYYY-MM-DD` key or an instant. Every audit surface formats days through
 * this, so a rendered date can never disagree with the UTC day key that
 * grouped it. An unparseable key is returned unchanged.
 */
export const formatUtcDay = (value: Date | string): string => {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00.000Z`) : value;
  if (Number.isNaN(date.getTime())) {
    return typeof value === "string" ? value : "";
  }
  return `${MONTHS[date.getUTCMonth()]!} ${String(date.getUTCDate())}, ${String(date.getUTCFullYear())}`;
};

/** The short UTC month name — `Aug` — for sparse calendar column headers. */
export const formatUtcMonth = (value: Date | string): string => {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00.000Z`) : value;
  return Number.isNaN(date.getTime()) ? "" : MONTHS[date.getUTCMonth()]!;
};

/**
 * Label a `YYYY-MM-DD` day key, with Today/Yesterday relative labels resolved
 * against the caller's reference time so the output is deterministic rather
 * than clock-dependent.
 */
export const formatAuditDay = (day: string, now?: Date): string => {
  const parsed = new Date(`${day}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    return day;
  }

  if (now) {
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const delta = today - parsed.getTime();
    if (delta === 0) {
      return "Today";
    }
    if (delta === DAY_MS) {
      return "Yesterday";
    }
  }

  return formatUtcDay(parsed);
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Resolve a bound to an instant. A date-only bound (what `<input type="date">`
 * produces) covers the whole UTC day, so `to: "2026-08-13"` includes
 * everything that happened on the 13th rather than only its first
 * millisecond. A full ISO instant is used verbatim.
 */
const resolveBound = (value: string | undefined, edge: "start" | "end"): number => {
  if (!value) {
    return Number.NaN;
  }
  const resolved = DATE_ONLY.test(value)
    ? `${value}${edge === "start" ? "T00:00:00.000Z" : "T23:59:59.999Z"}`
    : value;
  return new Date(resolved).getTime();
};

/**
 * Apply the facet selection. An empty string is "not selected" rather than a
 * match on empty — the same meaning `""` carries as an unset attribute and as
 * a select's all-values option, so the DOM and the engine never disagree.
 *
 * A date bound excludes undated events: an event with no timestamp cannot be
 * shown to fall inside the window, and an audit surface must not imply it does.
 */
export const filterAuditEvents = (
  events: readonly AuditEvent[],
  facets: AuditFacets,
): AuditEvent[] => {
  const from = resolveBound(facets.from, "start");
  const to = resolveBound(facets.to, "end");
  const hasFrom = !Number.isNaN(from);
  const hasTo = !Number.isNaN(to);

  return events.filter(event => {
    if (facets.actor && (event.actor?.name ?? "") !== facets.actor) {
      return false;
    }
    if (facets.action && event.action !== facets.action) {
      return false;
    }
    if (facets.correlationId && event.correlationId !== facets.correlationId) {
      return false;
    }
    if (!hasFrom && !hasTo) {
      return true;
    }

    const instant = auditEventInstant(event);
    if (instant === null) {
      return false;
    }
    return (!hasFrom || instant >= from) && (!hasTo || instant <= to);
  });
};

/** True when any facet narrows the set — drives the Clear-filters affordance. */
export const hasAuditFacets = (facets: AuditFacets): boolean =>
  Object.values(facets).some(value => value !== undefined && value !== "");

interface GroupSeed {
  key: string;
  label: string;
  events: AuditEvent[];
}

/**
 * Group events into collapsible sections.
 *
 * Day sections run newest first with undated events in a trailing section;
 * actor and action sections run by descending count, ties broken by label so
 * the order never depends on input order. Events inside every section are
 * newest first.
 */
export const groupAuditEvents = (
  events: readonly AuditEvent[],
  groupBy: AuditGroupBy,
  now?: Date,
): AuditGroup[] => {
  const seeds = new Map<string, GroupSeed>();
  const seedFor = (key: string, label: string): GroupSeed => {
    let seed = seeds.get(key);
    if (!seed) {
      seed = { key, label, events: [] };
      seeds.set(key, seed);
    }
    return seed;
  };

  for (const event of events) {
    if (groupBy === "day") {
      const day = resolveAuditDay(event);
      seedFor(day ?? AUDIT_UNDATED_KEY, day ? formatAuditDay(day, now) : "Undated").events.push(
        event,
      );
    } else if (groupBy === "actor") {
      const name = event.actor?.name ?? "";
      seedFor(name || AUDIT_UNATTRIBUTED_KEY, name || "Unattributed").events.push(event);
    } else {
      seedFor(event.action, event.action).events.push(event);
    }
  }

  const groups = [...seeds.values()].map<AuditGroup>(seed => {
    const actors = new Set<string>();
    for (const event of seed.events) {
      if (event.actor?.name) {
        actors.add(event.actor.name);
      }
    }
    return {
      key: seed.key,
      label: seed.label,
      events: [...seed.events].sort(byNewestFirst),
      count: seed.events.length,
      actorCount: actors.size,
    };
  });

  if (groupBy === "day") {
    return groups.sort((left, right) => {
      if (left.key === AUDIT_UNDATED_KEY || right.key === AUDIT_UNDATED_KEY) {
        return left.key === right.key ? 0 : left.key === AUDIT_UNDATED_KEY ? 1 : -1;
      }
      return left.key < right.key ? 1 : left.key > right.key ? -1 : 0;
    });
  }

  const trailingKey = groupBy === "actor" ? AUDIT_UNATTRIBUTED_KEY : null;
  return groups.sort((left, right) => {
    if (trailingKey !== null && (left.key === trailingKey || right.key === trailingKey)) {
      return left.key === right.key ? 0 : left.key === trailingKey ? 1 : -1;
    }
    if (left.count !== right.count) {
      return right.count - left.count;
    }
    return left.label < right.label ? -1 : left.label > right.label ? 1 : 0;
  });
};

const summarize = (values: readonly string[]): AuditFacetValue[] => {
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: value || "Unattributed", count }))
    .sort((left, right) =>
      left.count !== right.count
        ? right.count - left.count
        : left.label < right.label
          ? -1
          : left.label > right.label
            ? 1
            : 0,
    );
};

/**
 * Available facet values with counts, derived from the *unfiltered* set so
 * selecting one facet never removes the options for another — a filter UI
 * that can dead-end is worse than no counts.
 */
export const summarizeAuditFacets = (events: readonly AuditEvent[]): AuditFacetSummary => ({
  actors: summarize(events.map(event => event.actor?.name ?? "")),
  actions: summarize(events.map(event => event.action)),
});

/** Formulas are data in an audit export, never something a spreadsheet should run. */
const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

const csvField = (value: string): string => {
  const neutralized = FORMULA_PREFIXES.some(prefix => value.startsWith(prefix))
    ? `'${value}`
    : value;
  return `"${neutralized.replaceAll('"', '""')}"`;
};

export const AUDIT_CSV_COLUMNS = [
  "id",
  "timestamp",
  "actor",
  "action",
  "summary",
  "badge",
  "correlationId",
  "evidence",
] as const;

/**
 * Render events as RFC 4180 CSV for the export toolbar. Every field is
 * quoted, embedded quotes are doubled, and a value that would otherwise be
 * read as a spreadsheet formula is prefixed so it stays text.
 */
export const toAuditCsv = (events: readonly AuditEvent[]): string => {
  const rows = events.map(event =>
    [
      event.id,
      event.timestamp ?? "",
      event.actor?.name ?? "",
      event.action,
      event.summary ?? "",
      event.badge ?? "",
      event.correlationId ?? "",
      (event.evidence ?? [])
        .map(entry => (entry.href ? `${entry.label} (${entry.href})` : entry.label))
        .join("; "),
    ]
      .map(csvField)
      .join(","),
  );

  return [AUDIT_CSV_COLUMNS.map(csvField).join(","), ...rows].join("\r\n");
};

export interface ActivityDensityCell {
  /** UTC calendar day, `YYYY-MM-DD`. */
  date: string;
  count: number;
  /** 0 for an empty day, otherwise 1–4 scaled against the busiest day in the window. */
  level: number;
  /** Column index, oldest week first. */
  week: number;
  /** Row index, 0 = Sunday. */
  weekday: number;
}

export interface ActivityDensity {
  cells: ActivityDensityCell[];
  weeks: number;
  total: number;
  max: number;
  /** First day in the window (the Sunday that opens the oldest column). */
  start: string;
  /** Last day in the window — the reference day. */
  end: string;
}

export interface ActivityDensityOptions {
  /** Reference day; the window ends on it. */
  now: Date;
  /** Number of week columns, clamped to 1–53. Defaults to 12. */
  weeks?: number;
}

/**
 * Build the calendar heatmap window: whole week columns ending on the
 * reference day's week, rows Sunday → Saturday. Pure and UTC-based, so the
 * same events and reference time always produce the same grid.
 */
export const computeActivityDensity = (
  events: readonly AuditEvent[],
  options: ActivityDensityOptions,
): ActivityDensity => {
  const weeks = Math.min(53, Math.max(1, Math.trunc(options.weeks ?? 12)));
  const now = options.now;
  const endDay = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const endWeekday = new Date(endDay).getUTCDay();
  // Open on the Sunday of the oldest column so every column is a whole week.
  const startDay = endDay - endWeekday * DAY_MS - (weeks - 1) * 7 * DAY_MS;

  const counts = new Map<string, number>();
  for (const event of events) {
    const day = resolveAuditDay(event);
    if (day) {
      counts.set(day, (counts.get(day) ?? 0) + 1);
    }
  }

  const cells: ActivityDensityCell[] = [];
  let total = 0;
  let max = 0;
  for (let offset = 0; startDay + offset * DAY_MS <= endDay; offset += 1) {
    const date = new Date(startDay + offset * DAY_MS).toISOString().slice(0, 10);
    const count = counts.get(date) ?? 0;
    total += count;
    max = Math.max(max, count);
    cells.push({ date, count, level: 0, week: Math.floor(offset / 7), weekday: offset % 7 });
  }

  for (const cell of cells) {
    cell.level = cell.count === 0 ? 0 : Math.min(4, Math.max(1, Math.ceil((cell.count / max) * 4)));
  }

  return {
    cells,
    weeks,
    total,
    max,
    start: new Date(startDay).toISOString().slice(0, 10),
    end: new Date(endDay).toISOString().slice(0, 10),
  };
};
