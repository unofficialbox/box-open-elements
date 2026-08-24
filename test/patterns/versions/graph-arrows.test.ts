// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import {
  hasEndArrow,
  hasStartArrow,
  resolveGraphArrows,
} from "../../../src/patterns/versions/graph-arrows.js";
import { VersionGraph } from "../../../src/patterns/versions/version-graph.js";
import { LineageGraph } from "../../../src/patterns/lineage/lineage-graph.js";

describe("resolveGraphArrows", () => {
  it("accepts the four settings", () => {
    for (const value of ["none", "start", "end", "both"] as const) {
      expect(resolveGraphArrows(value)).toBe(value);
    }
  });

  it("falls back to end, so a typo cannot silently drop the direction", () => {
    // These are directed graphs; losing the head loses the reading.
    expect(resolveGraphArrows("backwards")).toBe("end");
    expect(resolveGraphArrows("")).toBe("end");
    expect(resolveGraphArrows(null)).toBe("end");
    expect(resolveGraphArrows(undefined)).toBe("end");
  });

  it("maps each setting to the ends it draws", () => {
    expect([hasStartArrow("none"), hasEndArrow("none")]).toEqual([false, false]);
    expect([hasStartArrow("start"), hasEndArrow("start")]).toEqual([true, false]);
    expect([hasStartArrow("end"), hasEndArrow("end")]).toEqual([false, true]);
    expect([hasStartArrow("both"), hasEndArrow("both")]).toEqual([true, true]);
  });
});

// Timestamps included deliberately: the shared layout orders by them, and
// without one the second node was dropped and the graph rendered a single
// row with no edges at all.
const VERSIONS = [
  { id: "v1", label: "v1.0", timestamp: "2026-05-01T09:00:00.000Z" },
  { id: "v2", label: "v2.0", parents: ["v1"], timestamp: "2026-06-01T09:00:00.000Z" },
];

// Lineage parents are records, not id strings the way version parents are —
// a plain string is rejected by the guard and the edge silently never exists.
const NODES = [
  { id: "c1", label: "Clause v5", kind: "clause", timestamp: "2026-04-01T09:00:00.000Z" },
  {
    id: "t1",
    label: "Template 2026",
    kind: "template",
    parents: [{ id: "c1", deviation: "none" }],
    timestamp: "2026-05-01T09:00:00.000Z",
  },
];

describe("graph edge markers", () => {
  const mount = <T extends HTMLElement>(
    tag: string,
    register: () => void,
    payloadAttr: string,
    payload: unknown,
    arrows?: string,
  ): T => {
    register();
    const element = document.createElement(tag) as T;
    element.setAttribute(payloadAttr, JSON.stringify(payload));
    if (arrows !== undefined) element.setAttribute("arrows", arrows);
    document.body.append(element);
    return element;
  };

  const markers = (element: HTMLElement): { start: number; end: number; edges: number } => {
    const paths = Array.from(element.shadowRoot!.querySelectorAll('[part="edge"]'));
    return {
      edges: paths.length,
      start: paths.filter(p => p.hasAttribute("marker-start")).length,
      end: paths.filter(p => p.hasAttribute("marker-end")).length,
    };
  };

  const cases: [string, string, () => void, string, unknown][] = [
    ["box-version-graph", "versions", () => VersionGraph.register(), "versions", VERSIONS],
    ["box-lineage-graph", "nodes", () => LineageGraph.register(), "nodes", NODES],
  ];

  for (const [tag, , register, attr, payload] of cases) {
    it(`${tag} defaults to a head on the child end only`, () => {
      const element = mount<HTMLElement>(tag, register, attr, payload);
      const found = markers(element);
      expect(found.edges).toBeGreaterThan(0);
      expect(found.end).toBe(found.edges);
      expect(found.start).toBe(0);
      document.body.innerHTML = "";
    });

    it(`${tag} draws both heads when asked`, () => {
      const element = mount<HTMLElement>(tag, register, attr, payload, "both");
      const found = markers(element);
      expect(found.start).toBe(found.edges);
      expect(found.end).toBe(found.edges);
      document.body.innerHTML = "";
    });

    it(`${tag} draws neither when arrows are off`, () => {
      const element = mount<HTMLElement>(tag, register, attr, payload, "none");
      const found = markers(element);
      expect(found.edges).toBeGreaterThan(0);
      expect(found.start).toBe(0);
      expect(found.end).toBe(0);
      document.body.innerHTML = "";
    });

    it(`${tag} draws only the parent head for arrows="start"`, () => {
      const element = mount<HTMLElement>(tag, register, attr, payload, "start");
      const found = markers(element);
      expect(found.start).toBe(found.edges);
      expect(found.end).toBe(0);
      document.body.innerHTML = "";
    });

    it(`${tag} reverses the shared marker at the start end`, () => {
      // One marker definition serves both ends; without auto-start-reverse a
      // head placed at the start would point into the node it leaves.
      const element = mount<HTMLElement>(tag, register, attr, payload, "both");
      const marker = element.shadowRoot!.querySelector("marker");
      expect(marker?.getAttribute("orient")).toBe("auto-start-reverse");
      document.body.innerHTML = "";
    });
  }
});
