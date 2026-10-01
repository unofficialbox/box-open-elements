import { describe, expect, it } from "vitest";
import {
  graphChecks,
  normalizeProcessSelectionPath,
  restoreProcessPositions,
  snapshotProcessPositions,
} from "../../src/patterns/process-modeler/bridge.js";
import type {
  ProcessBox,
  ProcessConnection,
  ProcessEdit,
  ProcessLayout,
  ProcessLoadOptions,
  ProcessModel,
  ProcessProjection,
  ProcessVariable,
} from "../../src/patterns/process-modeler/model.js";

const box = (id: string, kind = "step", extra: Partial<ProcessBox> = {}): ProcessBox =>
  ({ id, node: {}, kind, title: id, ...extra });
const graph = (boxes: ProcessBox[], edges: [string, string][]): ProcessProjection => ({
  boxes,
  lines: edges.map(([from, to], index) => ({ id: `line-${index}`, from, to })),
});
const projection: ProcessProjection = {
  boxes: [
    box("b", "step", { path: ["body", 1], fingerprint: "step:save" }),
    box("a", "step", { path: ["body", 0], fingerprint: "step:read" }),
    box("unidentified", "step", { path: ["body", 2] }),
    box("free"),
  ],
  lines: [],
};
const positions = {
  '["body",0]': { fingerprint: "step:read", position: { x: 10, y: 20, width: 220, height: 96 } },
  '["body",1]': { fingerprint: "step:save", position: { x: 310, y: 20 } },
};

describe("process host bridge", () => {
  it("adds host contracts without requiring host validation", () => {
    const model: ProcessModel<ProcessProjection> = { project: document => document };
    const checked: ProcessModel<ProcessProjection> = {
      ...model,
      validate: (_document, current) => [{ message: "Host rule", boxId: current.boxes[0].id }],
    };
    const edit: ProcessEdit = { type: "reparent", boxId: "a", parentId: "frame", fromSide: "east", toSide: "west" };
    const connection: ProcessConnection = { name: "Box", kind: "oauth", id: "box" };
    const variable: ProcessVariable = { name: "input", value: { count: 2 }, description: "Host input" };
    const options: ProcessLoadOptions = { positions, version: 0, selectedPath: null };
    expect(model.project(projection)).toBe(projection);
    expect(checked.validate!(projection, projection)).toEqual([{ message: "Host rule", boxId: "b" }]);
    expect(edit.type).toBe("reparent");
    expect(connection.name).toBe("Box");
    expect(variable.value).toEqual({ count: 2 });
    expect(options.version).toBe(0);
  });

  it("restores by path and fingerprint rather than old IDs, without sharing positions", () => {
    const restored = restoreProcessPositions(projection, positions);
    expect(restored).toEqual({ boxes: { a: positions['["body",0]'].position, b: positions['["body",1]'].position } });
    restored.boxes.a.x = 999;
    expect(positions['["body",0]'].position.x).toBe(10);
    const changedIds = { ...projection, boxes: projection.boxes.map(entry => ({ ...entry, id: `new-${entry.id}` })) };
    expect(restoreProcessPositions(changedIds, positions).boxes["new-a"].x).toBe(10);
  });

  it("ignores unknown paths, changed fingerprints, and either missing fingerprint", () => {
    const saved = {
      '["body",0]': { position: { x: 1, y: 2 } },
      '["body",1]': { fingerprint: "step:replaced", position: { x: 1, y: 2 } },
      '["body",2]': { position: { x: 1, y: 2 } },
      '["body",999]': { fingerprint: "step:read", position: { x: 1, y: 2 } },
      free: { fingerprint: "free", position: { x: 1, y: 2 } },
    };
    expect(restoreProcessPositions(projection, saved)).toEqual({ boxes: {} });
    expect(restoreProcessPositions(projection, undefined)).toEqual({ boxes: {} });
    expect(restoreProcessPositions(projection, {
      '["body",2]': { fingerprint: "defined", position: { x: 1, y: 2 } },
    })).toEqual({ boxes: {} });
  });

  it("uses own saved keys and supports root paths and special box IDs", () => {
    const current = graph([box("__proto__", "step", { path: [], fingerprint: "" })], []);
    const saved = { "[]": { fingerprint: "", position: { x: 0, y: 0 } } };
    const restored = restoreProcessPositions(current, saved);
    expect(Object.keys(restored.boxes)).toEqual(["__proto__"]);
    expect(restored.boxes.__proto__).toEqual({ x: 0, y: 0 });
    expect(Object.getPrototypeOf(restored.boxes)).toBe(Object.prototype);
    expect(restoreProcessPositions(current, Object.create(saved))).toEqual({ boxes: {} });
  });

  it.each([
    { x: NaN, y: 0 }, { x: 0, y: Infinity },
    { x: 0, y: 0, width: 0 }, { x: 0, y: 0, height: -1 },
  ])("ignores invalid positions %j", position => {
    expect(restoreProcessPositions(projection, {
      '["body",0]': { fingerprint: "step:read", position },
    })).toEqual({ boxes: {} });
  });

  it("returns stable detached snapshots and omits stale or unplaced entries", () => {
    const layout: ProcessLayout = { boxes: {
      b: { x: 300, y: 40 }, a: { x: 40, y: 40, width: 220 },
      free: { x: 40, y: 200 }, stale: { x: 400, y: 400 },
    } };
    const snapshots = snapshotProcessPositions(projection, layout);
    expect(snapshots.map(entry => entry.id)).toEqual(["a", "b", "free"]);
    expect(snapshots).toEqual(snapshotProcessPositions({ ...projection, boxes: [...projection.boxes].reverse() }, layout));
    expect(snapshots[0]).toEqual({ id: "a", path: ["body", 0], fingerprint: "step:read", position: { x: 40, y: 40, width: 220 } });
    expect(snapshots[2]).toEqual({ id: "free", position: { x: 40, y: 200 } });
    snapshots[0].position.x = 100;
    expect(layout.boxes.a.x).toBe(40);
    expect(snapshots[0].path).not.toBe(projection.boxes[1].path);
  });

  it("round-trips path snapshots through a load map", () => {
    const layout: ProcessLayout = { boxes: { a: { x: -40, y: 12 }, b: { x: 8, y: 9 } } };
    const saved = Object.fromEntries(snapshotProcessPositions(projection, layout)
      .filter(entry => entry.path)
      .map(entry => [JSON.stringify(entry.path), { fingerprint: entry.fingerprint, position: entry.position }]));
    expect(restoreProcessPositions(projection, saved)).toEqual(layout);
    expect(restoreProcessPositions(projection, snapshotProcessPositions(projection, layout))).toEqual(layout);
    expect(restoreProcessPositions(projection, [{ id: "a", position: { x: 1, y: 2 } }])).toEqual({ boxes: {} });
    expect(restoreProcessPositions(projection, [])).toEqual({ boxes: {} });
    expect(snapshotProcessPositions(projection, { boxes: { a: { x: Infinity, y: 0 } } })).toEqual([]);
  });

  it("normalizes field selections to the deepest box path without coercion", () => {
    const nested = graph([
      box("parent", "group", { path: ["body", 0] }),
      box("child", "step", { path: ["body", 0, "body", 1] }),
    ], []);
    expect(normalizeProcessSelectionPath(nested, ["body", 0, "body", 1, "name"])).toEqual(["body", 0, "body", 1]);
    expect(normalizeProcessSelectionPath(nested, ["body", 0, "description"])).toEqual(["body", 0]);
    expect(normalizeProcessSelectionPath(nested, ["body", "0"])).toBeNull();
    expect(normalizeProcessSelectionPath(nested, ["unknown"])).toBeNull();
    expect(normalizeProcessSelectionPath(nested, null)).toBeNull();
    expect(normalizeProcessSelectionPath(nested, undefined)).toBeNull();
    expect(normalizeProcessSelectionPath(nested, ["body", 0])).not.toBe(nested.boxes[0].path);
    expect(normalizeProcessSelectionPath(graph([box("root", "step", { path: [] })], []), [])).toEqual([]);
  });
});

describe("free graph checks", () => {
  it("accepts empty graphs, disconnected steps and ordinary single paths", () => {
    expect(graphChecks(graph([], []))).toEqual([]);
    expect(graphChecks(graph([box("a"), box("b"), box("free")], [["a", "b"]]))).toEqual([]);
  });

  it("reports every cyclic box, including self loops and disconnected loops", () => {
    const current = graph([box("a", "step", { path: ["body", 0] }), box("b"), box("c"), box("free")],
      [["a", "b"], ["b", "a"], ["c", "c"]]);
    expect(graphChecks(current)).toEqual([
      { message: expect.stringMatching(/loop/), boxId: "a", path: ["body", 0] },
      { message: expect.stringMatching(/loop/), boxId: "b" },
      { message: expect.stringMatching(/loop/), boxId: "c" },
    ]);
  });

  it("detects overlapping cycles but does not flag a shared acyclic join", () => {
    const current = graph([box("a", "decision"), box("b"), box("c"), box("join")],
      [["a", "b"], ["a", "c"], ["b", "a"], ["c", "b"]]);
    expect(graphChecks(current).filter(check => check.message.includes("loop")).map(check => check.boxId)).toEqual(["a", "b", "c"]);
    expect(graphChecks(graph([box("a"), box("b"), box("join")], [["a", "join"], ["b", "join"]]))).toEqual([]);
  });

  it("reports multiple outgoing connections on an ordinary step", () => {
    expect(graphChecks(graph([box("a"), box("b"), box("c")], [["a", "b"], ["a", "c"]]))).toEqual([
      { message: expect.stringMatching(/multiple places/), boxId: "a" },
    ]);
  });

  it.each(["decision", "choice", "weighted", "weighted-choice", "parallel", "fork"])
    ("allows a %s fork when all routes meet at a join", kind => {
      expect(graphChecks(graph([box("a", kind), box("b"), box("c"), box("join", "join")],
        [["a", "b"], ["a", "c"], ["b", "join"], ["c", "join"]]))).toEqual([]);
    });

  it.each(["decision", "choice", "parallel", "fork"])
    ("links a missing join check to the %s fork", kind => {
      const checks = graphChecks(graph([box("a", kind, { path: ["body", 0] }), box("b"), box("c")],
        [["a", "b"], ["a", "c"]]));
      expect(checks).toEqual([{ message: expect.stringMatching(/meet/), boxId: "a", path: ["body", 0] }]);
    });

  it("requires Parallel to meet at Wait for all, not at an ordinary step", () => {
    const edges: [string, string][] = [["a", "b"], ["a", "c"], ["b", "end"], ["c", "end"]];
    expect(graphChecks(graph([box("a", "decision"), box("b"), box("c"), box("end")], edges))).toEqual([]);
    expect(graphChecks(graph([box("a", "parallel"), box("b"), box("c"), box("end")], edges))).toEqual([
      { message: expect.stringMatching(/Wait for all/), boxId: "a" },
    ]);
  });

  it("does not accept a reachable join when a nested route can escape", () => {
    const current = graph([box("a", "decision"), box("b", "decision"), box("c"), box("join"), box("escape")],
      [["a", "b"], ["a", "c"], ["b", "join"], ["b", "escape"], ["c", "join"]]);
    expect(graphChecks(current).map(check => check.boxId)).toEqual(["a", "b"]);
  });

  it("ignores dangling endpoints for topology checks; structural validation owns those", () => {
    expect(graphChecks(graph([box("a")], [["a", "missing"], ["missing", "a"]]))).toEqual([]);
  });

  it("handles long graphs without recursion and never mutates host input", () => {
    const boxes = Array.from({ length: 12000 }, (_, i) => box(String(i)));
    const current = graph(boxes, boxes.slice(1).map((entry, index) => [String(index), entry.id]));
    const before = JSON.stringify(current);
    expect(graphChecks(current)).toEqual([]);
    expect(JSON.stringify(current)).toBe(before);
  });
});
