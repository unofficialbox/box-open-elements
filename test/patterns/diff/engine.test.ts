import { describe, expect, it } from "vitest";

import {
  computeInlineSegments,
  computeTextDiff,
  formatDiffStats,
} from "../../../src/patterns/diff/engine.js";

describe("computeTextDiff", () => {
  it("reports identical documents as all-equal with no changes", () => {
    const text = "Clause 1\nClause 2\nClause 3";
    const result = computeTextDiff(text, text);

    expect(result.rows).toHaveLength(3);
    expect(result.rows.every(row => row.kind === "equal")).toBe(true);
    expect(result.stats).toEqual({ added: 0, removed: 0, changed: 0 });
    expect(result.changeRanges).toEqual([]);
  });

  it("detects pure additions and removals with correct line numbers", () => {
    const result = computeTextDiff("a\nb\nc", "a\nb\nnew\nc");

    expect(result.stats).toEqual({ added: 1, removed: 0, changed: 0 });
    const added = result.rows.find(row => row.kind === "added");
    expect(added?.after).toMatchObject({ number: 3, text: "new" });
    expect(added?.before).toBeUndefined();

    const removal = computeTextDiff("a\nb\nc", "a\nc");
    expect(removal.stats).toEqual({ added: 0, removed: 1, changed: 0 });
    expect(removal.rows.find(row => row.kind === "removed")?.before).toMatchObject({
      number: 2,
      text: "b",
    });
  });

  it("pairs similar removed/added lines into changed rows with word segments", () => {
    const result = computeTextDiff(
      "The liability cap is $1,000,000 per incident.",
      "The liability cap is $2,000,000 per incident.",
    );

    expect(result.rows).toHaveLength(1);
    const row = result.rows[0]!;
    expect(row.kind).toBe("changed");
    expect(row.before?.segments?.some(segment => segment.kind === "removed" && segment.text.includes("$1,000,000"))).toBe(true);
    expect(row.after?.segments?.some(segment => segment.kind === "added" && segment.text.includes("$2,000,000"))).toBe(true);
    expect(result.stats).toEqual({ added: 0, removed: 0, changed: 1 });
  });

  it("keeps dissimilar replacements as separate removed and added rows", () => {
    const result = computeTextDiff("Aaaa bbbb cccc dddd", "Zzzz yyyy xxxx wwww");

    expect(result.rows.map(row => row.kind)).toEqual(["removed", "added"]);
    expect(result.stats).toEqual({ added: 1, removed: 1, changed: 0 });
  });

  it("groups consecutive non-equal rows into one navigable change range", () => {
    const result = computeTextDiff("keep\nold 1\nold 2\nkeep 2\nold 3", "keep\nnew 1\nnew 2\nkeep 2\nnew 3");

    expect(result.changeRanges).toHaveLength(2);
    const [first, second] = result.changeRanges;
    expect(first).toEqual({ start: 1, end: 2 });
    expect(result.rows[second!.start]?.kind).not.toBe("equal");
  });

  it("handles empty documents", () => {
    expect(computeTextDiff("", "").rows).toEqual([]);
    const onlyAfter = computeTextDiff("", "a\nb");
    expect(onlyAfter.stats).toEqual({ added: 2, removed: 0, changed: 0 });
    const onlyBefore = computeTextDiff("a\nb", "");
    expect(onlyBefore.stats).toEqual({ added: 0, removed: 2, changed: 0 });
  });

  it("stays exact around a large unchanged region (prefix/suffix trim)", () => {
    const common = Array.from({ length: 500 }, (_, index) => `line ${String(index)}`).join("\n");
    const before = `${common}\nremoved tail`;
    const after = `${common}\nadded tail`;

    const result = computeTextDiff(before, after);
    expect(result.stats.changed + result.stats.added + result.stats.removed).toBeGreaterThan(0);
    expect(result.rows.filter(row => row.kind !== "equal").length).toBeLessThanOrEqual(2);
  });

  it("degrades to whole-replacement above the LCS cap instead of blowing up", () => {
    // Two documents with zero shared lines, big enough to exceed the DP cap.
    const before = Array.from({ length: 700 }, (_, index) => `before ${String(index)}`).join("\n");
    const after = Array.from({ length: 700 }, (_, index) => `after ${String(index)}`).join("\n");

    const result = computeTextDiff(before, after);
    expect(result.rows.length).toBeGreaterThan(0);
    expect(result.stats.removed + result.stats.changed).toBeGreaterThan(0);
    expect(result.stats.added + result.stats.changed).toBeGreaterThan(0);
  });
});

describe("computeInlineSegments", () => {
  it("splits a line into equal/removed/added runs that reassemble both lines", () => {
    const before = "Payment due within 30 days of invoice.";
    const after = "Payment due within 45 days of receipt of invoice.";
    const segments = computeInlineSegments(before, after);

    expect(segments.before.map(segment => segment.text).join("")).toBe(before);
    expect(segments.after.map(segment => segment.text).join("")).toBe(after);
    expect(segments.before.some(segment => segment.kind === "removed")).toBe(true);
    expect(segments.after.some(segment => segment.kind === "added")).toBe(true);
    expect(segments.before.some(segment => segment.kind === "equal" && segment.text.includes("Payment due within"))).toBe(true);
  });

  it("merges adjacent runs of the same kind", () => {
    const segments = computeInlineSegments("a b c", "x y z");
    expect(segments.before).toHaveLength(1);
    expect(segments.before[0]).toMatchObject({ kind: "removed", text: "a b c" });
    expect(segments.after[0]).toMatchObject({ kind: "added", text: "x y z" });
  });
});

describe("formatDiffStats", () => {
  it("formats compact summaries and the no-change case", () => {
    expect(formatDiffStats({ added: 3, removed: 1, changed: 2 })).toBe("+3 −1 ~2");
    expect(formatDiffStats({ added: 0, removed: 0, changed: 1 })).toBe("~1");
    expect(formatDiffStats({ added: 0, removed: 0, changed: 0 })).toBe("No changes");
  });
});
