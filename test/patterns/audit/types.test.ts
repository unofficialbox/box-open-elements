import { describe, expect, it } from "vitest";

import {
  AUDIT_CSV_COLUMNS,
  computeActivityDensity,
  filterAuditEvents,
  formatAuditDay,
  groupAuditEvents,
  hasAuditFacets,
  resolveAuditDay,
  resolveAuditGroupBy,
  summarizeAuditFacets,
  toAuditCsv,
} from "../../../src/patterns/audit/types.js";
import type { AuditEvent } from "../../../src/patterns/audit/types.js";

const NOW = new Date("2026-08-13T12:00:00.000Z");

const events: AuditEvent[] = [
  {
    id: "a1",
    action: "Approved",
    actor: { name: "Morgan Lee" },
    timestamp: "2026-08-13T09:00:00.000Z",
    correlationId: "run-1",
  },
  {
    id: "a2",
    action: "Approved",
    actor: { name: "Avery Chen" },
    timestamp: "2026-08-13T23:30:00.000Z",
    correlationId: "run-2",
  },
  {
    id: "a3",
    action: "Redlined",
    actor: { name: "Morgan Lee" },
    timestamp: "2026-08-12T10:00:00.000Z",
    correlationId: "run-1",
  },
  { id: "a4", action: "Imported", timestamp: "2026-08-01T08:00:00.000Z" },
  { id: "a5", action: "Imported" },
];

describe("resolveAuditGroupBy", () => {
  it("falls back to day for unknown values", () => {
    expect(resolveAuditGroupBy("actor")).toBe("actor");
    expect(resolveAuditGroupBy("nonsense")).toBe("day");
    expect(resolveAuditGroupBy(null)).toBe("day");
  });
});

describe("resolveAuditDay", () => {
  it("resolves the UTC calendar day and reports undated events", () => {
    expect(resolveAuditDay(events[1]!)).toBe("2026-08-13");
    expect(resolveAuditDay(events[4]!)).toBeNull();
    expect(resolveAuditDay({ id: "x", action: "y", timestamp: "not a date" })).toBeNull();
  });
});

describe("formatAuditDay", () => {
  it("uses relative labels only against the supplied reference time", () => {
    expect(formatAuditDay("2026-08-13", NOW)).toBe("Today");
    expect(formatAuditDay("2026-08-12", NOW)).toBe("Yesterday");
    expect(formatAuditDay("2026-08-01", NOW)).toBe("Aug 1, 2026");
    // Without a reference time nothing is relative — deterministic by default.
    expect(formatAuditDay("2026-08-13")).toBe("Aug 13, 2026");
  });
});

describe("filterAuditEvents", () => {
  it("matches actor, action, and correlation id exactly", () => {
    expect(filterAuditEvents(events, { actor: "Morgan Lee" }).map(e => e.id)).toEqual(["a1", "a3"]);
    expect(filterAuditEvents(events, { action: "Imported" }).map(e => e.id)).toEqual(["a4", "a5"]);
    expect(filterAuditEvents(events, { correlationId: "run-1" }).map(e => e.id)).toEqual([
      "a1",
      "a3",
    ]);
  });

  it("treats an empty facet as unselected", () => {
    expect(filterAuditEvents(events, { actor: "", action: "" })).toHaveLength(events.length);
    expect(hasAuditFacets({ actor: "" })).toBe(false);
    expect(hasAuditFacets({ actor: "Morgan Lee" })).toBe(true);
  });

  it("covers the whole UTC day for a date-only upper bound", () => {
    // a2 lands at 23:30 — a naive midnight bound would drop it.
    expect(filterAuditEvents(events, { to: "2026-08-13" }).map(e => e.id)).toEqual([
      "a1",
      "a2",
      "a3",
      "a4",
    ]);
    expect(filterAuditEvents(events, { from: "2026-08-13" }).map(e => e.id)).toEqual(["a1", "a2"]);
  });

  it("honours full ISO bounds verbatim", () => {
    expect(
      filterAuditEvents(events, { to: "2026-08-13T12:00:00.000Z" }).map(e => e.id),
    ).toEqual(["a1", "a3", "a4"]);
  });

  it("excludes undated events once a date bound is set", () => {
    expect(filterAuditEvents(events, { from: "2020-01-01" }).map(e => e.id)).not.toContain("a5");
  });
});

describe("groupAuditEvents", () => {
  it("groups by day newest first with a trailing undated section", () => {
    const groups = groupAuditEvents(events, "day", NOW);

    expect(groups.map(group => group.key)).toEqual([
      "2026-08-13",
      "2026-08-12",
      "2026-08-01",
      "undated",
    ]);
    expect(groups.map(group => group.label)).toEqual([
      "Today",
      "Yesterday",
      "Aug 1, 2026",
      "Undated",
    ]);
    expect(groups[0]).toMatchObject({ count: 2, actorCount: 2 });
    // Newest first inside the section.
    expect(groups[0]?.events.map(event => event.id)).toEqual(["a2", "a1"]);
    expect(groups[3]).toMatchObject({ count: 1, actorCount: 0 });
  });

  it("orders actor and action groups by count with label tie-breaks", () => {
    const byActor = groupAuditEvents(events, "actor", NOW);
    expect(byActor.map(group => group.key)).toEqual(["Morgan Lee", "Avery Chen", ""]);
    expect(byActor[2]?.label).toBe("Unattributed");

    const byAction = groupAuditEvents(events, "action", NOW);
    // Approved and Imported both have 2 — the label breaks the tie, so the
    // order never depends on which arrived first.
    expect(byAction.map(group => group.key)).toEqual(["Approved", "Imported", "Redlined"]);
  });

  it("sinks undated events to the end of a mixed section", () => {
    const mixed: AuditEvent[] = [
      { id: "m1", action: "Same", actor: { name: "A" } },
      { id: "m2", action: "Same", actor: { name: "A" }, timestamp: "2026-08-01T00:00:00.000Z" },
      { id: "m3", action: "Same", actor: { name: "A" }, timestamp: "2026-08-05T00:00:00.000Z" },
    ];
    expect(groupAuditEvents(mixed, "actor", NOW)[0]?.events.map(e => e.id)).toEqual([
      "m3",
      "m2",
      "m1",
    ]);
  });
});

describe("summarizeAuditFacets", () => {
  it("counts values by frequency then label", () => {
    const summary = summarizeAuditFacets(events);
    expect(summary.actors).toEqual([
      { value: "Morgan Lee", label: "Morgan Lee", count: 2 },
      { value: "", label: "Unattributed", count: 2 },
      { value: "Avery Chen", label: "Avery Chen", count: 1 },
    ]);
    expect(summary.actions.map(entry => entry.value)).toEqual([
      "Approved",
      "Imported",
      "Redlined",
    ]);
  });
});

describe("toAuditCsv", () => {
  it("quotes every field and doubles embedded quotes", () => {
    const csv = toAuditCsv([
      {
        id: "x1",
        action: 'Said "no"',
        actor: { name: "Morgan, Lee" },
        summary: "Line one",
        timestamp: "2026-08-13T09:00:00.000Z",
        badge: "pass",
        correlationId: "run-1",
        evidence: [{ id: "e1", label: "MSA §4.2", href: "/docs/1" }],
      },
    ]);
    const [header, row] = csv.split("\r\n");

    expect(header).toBe(AUDIT_CSV_COLUMNS.map(column => `"${column}"`).join(","));
    expect(row).toBe(
      '"x1","2026-08-13T09:00:00.000Z","Morgan, Lee","Said ""no""","Line one","pass","run-1","MSA §4.2 (/docs/1)"',
    );
  });

  it("neutralizes values a spreadsheet would execute as a formula", () => {
    const csv = toAuditCsv([{ id: "x", action: "=SUM(A1:A9)", summary: "@import" }]);
    expect(csv).toContain('"\'=SUM(A1:A9)"');
    expect(csv).toContain('"\'@import"');
  });

  it("emits a header even with no rows", () => {
    expect(toAuditCsv([]).split("\r\n")).toHaveLength(1);
  });
});

describe("computeActivityDensity", () => {
  it("builds whole week columns ending on the reference day", () => {
    const density = computeActivityDensity(events, { now: NOW, weeks: 3 });

    // 2026-08-13 is a Thursday: two full weeks plus Sun–Thu of the last one.
    expect(density.end).toBe("2026-08-13");
    expect(density.start).toBe("2026-07-26");
    expect(density.cells).toHaveLength(2 * 7 + 5);
    expect(density.weeks).toBe(3);
    expect(density.cells[0]).toMatchObject({ week: 0, weekday: 0 });
    expect(density.cells.at(-1)).toMatchObject({ date: "2026-08-13", week: 2, weekday: 4 });
  });

  it("counts per UTC day and scales levels against the busiest day", () => {
    const density = computeActivityDensity(events, { now: NOW, weeks: 3 });
    const cell = (date: string) => density.cells.find(entry => entry.date === date);

    expect(density.total).toBe(4);
    expect(density.max).toBe(2);
    expect(cell("2026-08-13")).toMatchObject({ count: 2, level: 4 });
    expect(cell("2026-08-12")).toMatchObject({ count: 1, level: 2 });
    expect(cell("2026-08-11")).toMatchObject({ count: 0, level: 0 });
    // The undated event is not placed on any day.
    expect(density.cells.reduce((sum, entry) => sum + entry.count, 0)).toBe(4);
  });

  it("clamps the window and survives an empty set", () => {
    expect(computeActivityDensity([], { now: NOW, weeks: 0 }).weeks).toBe(1);
    expect(computeActivityDensity([], { now: NOW, weeks: 999 }).weeks).toBe(53);
    const empty = computeActivityDensity([], { now: NOW, weeks: 2 });
    expect(empty.max).toBe(0);
    expect(empty.cells.every(cell => cell.level === 0)).toBe(true);
  });
});
