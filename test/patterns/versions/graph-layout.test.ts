import { describe, expect, it } from "vitest";

import {
  computeVersionGraphLayout,
  orderVersionsForDisplay,
} from "../../../src/patterns/versions/graph-layout.js";
import type { VersionNode } from "../../../src/patterns/versions/types.js";

// A contract history: trunk v1 -> v2 -> v2.1, a redline branch off v2
// (r1 -> r2), and v3 merging the branch back onto trunk.
const history: VersionNode[] = [
  { id: "v1", label: "v1.0", kind: "major", status: "executed" },
  { id: "v2", label: "v2.0", kind: "major", status: "superseded", parents: ["v1"] },
  { id: "v21", label: "v2.1", kind: "minor", parents: ["v2"] },
  { id: "r1", label: "Redline r1", kind: "draft", parents: ["v2"] },
  { id: "r2", label: "Redline r2", kind: "draft", parents: ["r1"] },
  { id: "v3", label: "v3.0", kind: "merge", status: "current", parents: ["v21", "r2"] },
];

describe("computeVersionGraphLayout", () => {
  it("keeps a linear chain on the trunk lane", () => {
    const layout = computeVersionGraphLayout([
      { id: "a", label: "v1" },
      { id: "b", label: "v2", parents: ["a"] },
      { id: "c", label: "v3", parents: ["b"] },
    ]);

    expect(layout.laneCount).toBe(1);
    expect(layout.placements.map(p => p.id)).toEqual(["c", "b", "a"]);
    expect(layout.placements.every(p => p.lane === 0)).toBe(true);
    expect(layout.warnings).toEqual([]);
  });

  it("branches to a side lane and merges back, releasing the lane", () => {
    const layout = computeVersionGraphLayout(history);
    const laneOf = new Map(layout.placements.map(p => [p.id, p.lane]));

    // Trunk continues in lane 0; the redline branch takes lane 1.
    expect(laneOf.get("v1")).toBe(0);
    expect(laneOf.get("v2")).toBe(0);
    expect(laneOf.get("v21")).toBe(0);
    expect(laneOf.get("r1")).toBe(1);
    expect(laneOf.get("r2")).toBe(1);
    expect(laneOf.get("v3")).toBe(0);
    expect(layout.laneCount).toBe(2);

    // Rows run newest first.
    expect(layout.placements[0]?.id).toBe("v3");
    expect(layout.placements.at(-1)?.id).toBe("v1");

    // The branch edge changes lanes out, the merge edge changes lanes back.
    const branch = layout.edges.find(e => e.fromId === "v2" && e.toId === "r1");
    expect(branch).toMatchObject({ fromLane: 0, toLane: 1 });
    const merge = layout.edges.find(e => e.fromId === "r2" && e.toId === "v3");
    expect(merge).toMatchObject({ fromLane: 1, toLane: 0 });
    expect(layout.edges).toHaveLength(6);
  });

  it("reuses a lane released by a merge for the next branch", () => {
    const layout = computeVersionGraphLayout([
      ...history,
      { id: "d1", label: "Draft A", kind: "draft", parents: ["v3"] },
      { id: "d2", label: "Draft B", kind: "draft", parents: ["v3"] },
    ]);
    const laneOf = new Map(layout.placements.map(p => [p.id, p.lane]));

    expect(laneOf.get("d1")).toBe(0);
    // The second branch takes the lane the merged redline released.
    expect(laneOf.get("d2")).toBe(1);
    expect(layout.laneCount).toBe(2);
  });

  it("degrades on malformed topology instead of throwing", () => {
    const layout = computeVersionGraphLayout([
      { id: "a", label: "v1" },
      { id: "a", label: "duplicate" },
      { id: "b", label: "v2", parents: ["missing"] },
      { id: "x", label: "cycle x", parents: ["y"] },
      { id: "y", label: "cycle y", parents: ["x"] },
    ]);

    expect(layout.placements).toHaveLength(4);
    expect(layout.warnings).toEqual([
      "Duplicate version id dropped: a",
      "Unknown parent ignored: b -> missing",
      "Cycle detected; appended in input order: x",
      "Cycle detected; appended in input order: y",
    ]);
  });
});

describe("orderVersionsForDisplay", () => {
  it("orders topologically (newest first) even when the input is shuffled", () => {
    const shuffled = [history[3]!, history[0]!, history[5]!, history[1]!, history[4]!, history[2]!];
    // Topology dominates: v1 -> v2 always precede their descendants, v3
    // always lands newest; input order only breaks topological ties.
    expect(orderVersionsForDisplay(shuffled).map(node => node.id)).toEqual([
      "v3",
      "v21",
      "r2",
      "r1",
      "v2",
      "v1",
    ]);
  });
});
