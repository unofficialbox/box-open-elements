// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  auditRowHeights,
  flattenAuditRows,
  planAuditWindow,
} from "../../../src/patterns/audit/window.js";
import type { AuditGroup } from "../../../src/patterns/audit/types.js";

const HEIGHTS = { heading: 28, event: 64 };

const group = (key: string, events: number): AuditGroup => ({
  key,
  label: key,
  count: events,
  actorCount: 1,
  events: Array.from({ length: events }, (_, index) => ({
    id: `${key}-${String(index)}`,
    action: "viewed",
    timestamp: "2026-08-23T00:00:00Z",
  })) as AuditGroup["events"],
});

const groups = (count: number, per: number): AuditGroup[] =>
  Array.from({ length: count }, (_, index) => group(`g${String(index)}`, per));

describe("flattenAuditRows", () => {
  it("emits a heading row then one row per event", () => {
    const rows = flattenAuditRows([group("a", 2), group("b", 1)], new Set());
    expect(rows).toEqual([
      { kind: "heading", groupIndex: 0 },
      { kind: "event", groupIndex: 0, eventIndex: 0 },
      { kind: "event", groupIndex: 0, eventIndex: 1 },
      { kind: "heading", groupIndex: 1 },
      { kind: "event", groupIndex: 1, eventIndex: 0 },
    ]);
  });

  it("gives a collapsed group its heading and nothing else", () => {
    const rows = flattenAuditRows([group("a", 500), group("b", 1)], new Set(["a"]));
    expect(rows).toEqual([
      { kind: "heading", groupIndex: 0 },
      { kind: "heading", groupIndex: 1 },
      { kind: "event", groupIndex: 1, eventIndex: 0 },
    ]);
  });

  it("handles no groups", () => {
    expect(flattenAuditRows([], new Set())).toEqual([]);
  });
});

describe("auditRowHeights", () => {
  it("maps each row kind to its height", () => {
    const rows = flattenAuditRows([group("a", 2)], new Set());
    expect(auditRowHeights(rows, HEIGHTS)).toEqual([28, 64, 64]);
  });
});

describe("planAuditWindow", () => {
  const plan = (
    auditGroups: AuditGroup[],
    viewport: { viewportHeight: number; scrollTop: number; overscan?: number },
    collapsed = new Set<string>(),
  ) => planAuditWindow(flattenAuditRows(auditGroups, collapsed), HEIGHTS, viewport);

  it("renders a handful of sections out of a very long log", () => {
    // 200 groups x 50 events = 10,200 rows. The point of the exercise.
    const result = plan(groups(200, 50), { viewportHeight: 640, scrollTop: 0 });
    expect(result.groups.length).toBeLessThan(3);
    expect(result.totalHeight).toBe(200 * (28 + 50 * 64));
  });

  it("keeps the scroll range constant wherever the window sits", () => {
    const auditGroups = groups(40, 20);
    const rows = flattenAuditRows(auditGroups, new Set());
    const heights = auditRowHeights(rows, HEIGHTS);
    const total = heights.reduce((sum, height) => sum + height, 0);

    for (const scrollTop of [0, 200, 5_000, 30_000, total]) {
      const result = plan(auditGroups, { viewportHeight: 500, scrollTop });
      const rendered = result.groups.reduce((sum, planned) => {
        const events = planned.eventEnd - planned.eventStart;
        return sum + HEIGHTS.heading + events * HEIGHTS.event;
      }, 0);
      // The straddling group's heading is rendered out of the top spacer, so
      // spacers + rendered still sums to the whole log.
      expect(result.paddingTop + rendered + result.paddingBottom).toBe(total);
    }
  });

  it("renders the heading of a group whose heading has scrolled away", () => {
    // Scroll into the middle of the first group. Its heading is above the
    // window, but the section still needs it: [part="group-body"] is
    // aria-labelledby the toggle inside that heading, and without it the
    // section is unlabelled and cannot be collapsed.
    const result = plan(groups(5, 20), { viewportHeight: 200, scrollTop: 600, overscan: 0 });

    const first = result.groups[0]!;
    expect(first.groupIndex).toBe(0);
    expect(first.headingInWindow).toBe(false);
    expect(first.eventStart).toBeGreaterThan(0);
  });

  it("takes the straddling heading's height back out of the top spacer", () => {
    // Without the correction the rendered heading is pure extra height and
    // every event below it sits one heading too low — the content drifts away
    // from where the scrollbar says it is.
    const withHeading = plan(groups(5, 20), {
      viewportHeight: 200,
      scrollTop: 600,
      overscan: 0,
    });
    const rows = flattenAuditRows(groups(5, 20), new Set());
    const heights = auditRowHeights(rows, HEIGHTS);
    const rawTop = heights
      .slice(0, rows.findIndex((row, index) => index >= withHeading.window.startIndex))
      .reduce((sum, height) => sum + height, 0);

    expect(withHeading.window.paddingTop).toBe(rawTop);
    expect(withHeading.paddingTop).toBe(rawTop - HEIGHTS.heading);
  });

  it("does not correct the spacer when the window starts on a heading", () => {
    // Group 1's heading is at 28 + 20*64 = 1308.
    const result = plan(groups(5, 20), { viewportHeight: 200, scrollTop: 1_308, overscan: 0 });
    expect(result.groups[0]!.headingInWindow).toBe(true);
    expect(result.paddingTop).toBe(result.window.paddingTop);
  });

  it("splits a window that spans several groups", () => {
    const result = plan(groups(10, 2), { viewportHeight: 400, scrollTop: 0, overscan: 0 });
    expect(result.groups.length).toBeGreaterThan(1);
    expect(result.groups.map(planned => planned.groupIndex)).toEqual(
      [...result.groups.map(planned => planned.groupIndex)].sort((a, b) => a - b),
    );
    // Every group after the first starts at its own heading and its first event.
    for (const planned of result.groups.slice(1)) {
      expect(planned.headingInWindow).toBe(true);
      expect(planned.eventStart).toBe(0);
    }
  });

  it("plans a collapsed group as a heading with no events", () => {
    const result = plan(groups(3, 40), { viewportHeight: 400, scrollTop: 0 }, new Set(["g0"]));
    const first = result.groups[0]!;
    expect(first.groupIndex).toBe(0);
    expect(first.eventEnd - first.eventStart).toBe(0);
    expect(first.headingInWindow).toBe(true);
    // Collapsing shrinks the whole log, so the scroll range shrinks with it.
    expect(result.totalHeight).toBe(28 + (28 + 40 * 64) * 2);
  });

  it("reaches the end of the log when the estimate ran long", () => {
    // Two heights per row kind is an estimate; over thousands of rows it drifts
    // from what the browser actually laid out. Measured in Chromium on a
    // 2,000-event log: estimate 116,061px against 115,002px real, 0.9% long.
    // Scrolled fully to the bottom of the *real* range, an unmapped plan still
    // believes a screenful remains below and never renders the last rows — the
    // final events become unreachable. Reproduced here: the same scroll
    // position with and without the measured height.
    const auditGroups = groups(40, 50);
    const rows = flattenAuditRows(auditGroups, new Set());
    const estimated = auditRowHeights(rows, HEIGHTS).reduce((sum, h) => sum + h, 0);
    const real = Math.round(estimated * 0.991); // the browser-measured shortfall
    const viewportHeight = 512;
    const atBottom = real - viewportHeight;

    const unmapped = planAuditWindow(rows, HEIGHTS, {
      viewportHeight,
      scrollTop: atBottom,
    });
    expect(unmapped.window.endIndex).toBeLessThan(rows.length);
    expect(unmapped.paddingBottom).toBeGreaterThan(0);

    const mapped = planAuditWindow(rows, HEIGHTS, {
      viewportHeight,
      scrollTop: atBottom,
      contentHeight: real,
    });
    expect(mapped.window.endIndex).toBe(rows.length);
    expect(mapped.paddingBottom).toBe(0);
  });

  it("leaves the top of the log at the top when mapping", () => {
    const rows = flattenAuditRows(groups(40, 50), new Set());
    const mapped = planAuditWindow(rows, HEIGHTS, {
      viewportHeight: 512,
      scrollTop: 0,
      contentHeight: 115_002,
    });
    expect(mapped.window.startIndex).toBe(0);
    expect(mapped.paddingTop).toBe(0);
  });

  it("ignores a content height that cannot be a scroll range", () => {
    const rows = flattenAuditRows(groups(10, 5), new Set());
    const base = planAuditWindow(rows, HEIGHTS, { viewportHeight: 400, scrollTop: 300 });
    for (const contentHeight of [0, 200, Number.NaN]) {
      const mapped = planAuditWindow(rows, HEIGHTS, {
        viewportHeight: 400,
        scrollTop: 300,
        contentHeight,
      });
      expect(mapped.window).toEqual(base.window);
    }
  });

  it("returns an empty plan for an unmeasured viewport rather than everything", () => {
    const result = plan(groups(50, 10), { viewportHeight: 0, scrollTop: 0 });
    expect(result.groups).toEqual([]);
    expect(result.paddingBottom).toBe(result.totalHeight);
  });

  it("returns an empty plan for an empty log", () => {
    const result = plan([], { viewportHeight: 640, scrollTop: 0 });
    expect(result).toMatchObject({ groups: [], paddingTop: 0, paddingBottom: 0, totalHeight: 0 });
  });

  it("covers every event visible in the band", () => {
    const auditGroups = groups(12, 8);
    const rows = flattenAuditRows(auditGroups, new Set());
    const heights = auditRowHeights(rows, HEIGHTS);

    for (const scrollTop of [0, 150, 900, 3_000]) {
      const result = plan(auditGroups, { viewportHeight: 400, scrollTop, overscan: 0 });
      const planned = new Set(
        result.groups.flatMap(entry =>
          Array.from(
            { length: entry.eventEnd - entry.eventStart },
            (_, offset) => `${String(entry.groupIndex)}:${String(entry.eventStart + offset)}`,
          ),
        ),
      );

      let top = 0;
      for (const [rowIndex, row] of rows.entries()) {
        const height = heights[rowIndex]!;
        const overlaps = top + height > scrollTop && top < scrollTop + 400;
        if (overlaps && row.kind === "event") {
          expect(
            planned.has(`${String(row.groupIndex)}:${String(row.eventIndex!)}`),
            `event ${String(row.groupIndex)}:${String(row.eventIndex!)} at scrollTop ${String(scrollTop)}`,
          ).toBe(true);
        }
        top += height;
      }
    }
  });
});
