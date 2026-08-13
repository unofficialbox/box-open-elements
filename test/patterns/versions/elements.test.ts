import { afterEach, describe, expect, it, vi } from "vitest";

import { VersionGraph } from "../../../src/patterns/versions/version-graph.js";
import { VersionList } from "../../../src/patterns/versions/version-list.js";
import type { VersionNode } from "../../../src/patterns/versions/types.js";

VersionList.register();
VersionGraph.register();

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const history: VersionNode[] = [
  {
    id: "v1",
    label: "v1.0",
    kind: "major",
    status: "executed",
    actor: { name: "Morgan Lee" },
    timestamp: "2026-05-01T09:00:00.000Z",
  },
  { id: "v2", label: "v2.0", kind: "major", status: "superseded", parents: ["v1"] },
  { id: "v21", label: "v2.1", kind: "minor", parents: ["v2"] },
  { id: "r1", label: "Redline r1", kind: "draft", parents: ["v2"] },
  { id: "r2", label: "Redline r2", kind: "draft", parents: ["r1"] },
  { id: "v3", label: "v3.0", kind: "merge", status: "current", parents: ["v21", "r2"] },
];

const mountList = async (configure?: (element: VersionList) => void): Promise<VersionList> => {
  const element = document.createElement("box-version-list") as VersionList;
  element.versions = history;
  configure?.(element);
  document.body.append(element);
  await flush();
  return element;
};

const mountGraph = async (configure?: (element: VersionGraph) => void): Promise<VersionGraph> => {
  const element = document.createElement("box-version-graph") as VersionGraph;
  element.versions = history;
  configure?.(element);
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("box-version-list", () => {
  it("renders topological newest-first rows with status tones and kind markers", async () => {
    const element = await mountList();

    const rows = Array.from(element.shadowRoot?.querySelectorAll('[part="row"]') ?? []);
    expect(rows.map(row => row.getAttribute("data-id"))).toEqual([
      "v3",
      "r2",
      "r1",
      "v21",
      "v2",
      "v1",
    ]);
    expect(rows[0]?.getAttribute("data-status")).toBe("current");
    expect(rows[0]?.querySelector('[part="status"]')?.textContent).toBe("Current");
    expect(rows[0]?.querySelector('[part="marker"]')?.getAttribute("data-kind")).toBe("merge");
    expect(rows[5]?.textContent).toContain("Morgan Lee");
  });

  it("emits version-selected from the row title", async () => {
    const element = await mountList();
    const selected = vi.fn();
    element.addEventListener("version-selected", selected);

    (element.shadowRoot?.querySelector('[part="row-title"][data-id="v2"]') as HTMLButtonElement).click();

    expect(selected.mock.calls[0]?.[0]?.detail.version.id).toBe("v2");
  });

  it("pairs two compare toggles into compare-requested with the older side as base", async () => {
    const element = await mountList();
    const compare = vi.fn();
    element.addEventListener("compare-requested", compare);

    const toggle = (id: string): void =>
      (
        element.shadowRoot?.querySelector(
          `[part="row-action"][data-action="compare"][data-id="${id}"]`,
        ) as HTMLButtonElement
      ).click();

    toggle("r1");
    expect(compare).not.toHaveBeenCalled();
    expect(element.compareSelection).toEqual(["r1"]);

    toggle("v3");
    expect(compare).toHaveBeenCalledTimes(1);
    expect(compare.mock.calls[0]?.[0]?.detail).toEqual({ baseId: "r1", targetId: "v3" });

    element.clearCompareSelection();
    expect(element.compareSelection).toEqual([]);
  });

  it("gates restore/promote on their attributes and hides them on the current version", async () => {
    const element = await mountList();
    expect(element.shadowRoot?.querySelectorAll('[data-action="restore"]')).toHaveLength(0);

    element.canRestore = true;
    element.canPromote = true;
    await flush();

    const restores = Array.from(
      element.shadowRoot?.querySelectorAll('[data-action="restore"]') ?? [],
    );
    expect(restores).toHaveLength(5);
    expect(restores.some(button => button.getAttribute("data-id") === "v3")).toBe(false);

    const restoreRequested = vi.fn();
    element.addEventListener("restore-requested", restoreRequested);
    (element.shadowRoot?.querySelector('[data-action="restore"][data-id="v2"]') as HTMLButtonElement).click();
    expect(restoreRequested.mock.calls[0]?.[0]?.detail.version.id).toBe("v2");
  });

  it("validates versions from the attribute payload", async () => {
    const element = document.createElement("box-version-list") as VersionList;
    element.setAttribute(
      "versions",
      JSON.stringify([
        { id: "ok", label: "v1" },
        { id: "", label: "missing id" },
        { id: "bad-parents", label: "x", parents: [7] },
        { id: "bad-note", label: "x", note: 5 },
        { id: "bad-timestamp", label: "x", timestamp: 12345 },
        { id: "bad-initials", label: "x", actor: { name: "A", initials: 9 } },
        "not a record",
      ]),
    );
    document.body.append(element);
    await flush();

    expect(element.versions.map(node => node.id)).toEqual(["ok"]);

    element.setAttribute("versions", "not json");
    await flush();
    expect(element.shadowRoot?.querySelector('[part="empty"]')).not.toBeNull();
  });

  it("keeps keyboard focus inside the list when the focused version is removed", async () => {
    const element = await mountList();

    const title = element.shadowRoot?.querySelector(
      '[part="row-title"][data-id="r1"]',
    ) as HTMLButtonElement;
    title.focus();
    element.versions = history.filter(node => node.id !== "r1" && node.id !== "r2");
    await flush();

    const activeElement = element.shadowRoot?.activeElement as HTMLElement | null;
    expect(activeElement).not.toBeNull();
    expect(element.shadowRoot?.contains(activeElement)).toBe(true);
  });
});

describe("box-version-graph", () => {
  it("renders one node button per version and one edge path per parent link", async () => {
    const element = await mountGraph();

    expect(element.shadowRoot?.querySelectorAll('[part="node"]')).toHaveLength(6);
    expect(element.shadowRoot?.querySelectorAll('[part="edge"]')).toHaveLength(6);

    const current = element.shadowRoot?.querySelector('[part="node"][data-id="v3"]');
    expect(current?.getAttribute("data-status")).toBe("current");
    expect(current?.getAttribute("aria-label")).toContain("v3.0");
  });

  it("emits version-selected on click and pairs a modified click into compare-requested", async () => {
    const element = await mountGraph();
    const selected = vi.fn();
    const compare = vi.fn();
    element.addEventListener("version-selected", selected);
    element.addEventListener("compare-requested", compare);

    const node = (id: string): HTMLButtonElement =>
      element.shadowRoot?.querySelector(`[part="node"][data-id="${id}"]`) as HTMLButtonElement;

    node("v21").click();
    expect(selected.mock.calls[0]?.[0]?.detail.version.id).toBe("v21");

    node("v2").dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));
    node("v3").dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));

    expect(compare).toHaveBeenCalledTimes(1);
    expect(compare.mock.calls[0]?.[0]?.detail).toEqual({ baseId: "v2", targetId: "v3" });
    expect(selected).toHaveBeenCalledTimes(1);

    // The compare-selected state is announced, not just styled.
    expect(node("v2").getAttribute("aria-label")).toContain("selected for comparison");
    expect(node("v21").getAttribute("aria-label")).not.toContain("selected for comparison");
  });

  it("restores focus safely for hostile ids and falls back when the node is removed", async () => {
    const hostile: VersionNode[] = [
      { id: 'bad\\"id\\', label: "v1" },
      { id: "v2", label: "v2", parents: ['bad\\"id\\'] },
    ];
    const element = await mountGraph(el => {
      el.versions = hostile;
    });

    const first = element.shadowRoot?.querySelector(
      '[part="node"][tabindex="0"]',
    ) as HTMLButtonElement;
    first.focus();
    // A rebuild with the focused hostile id must neither throw nor lose focus.
    element.versions = [...hostile];
    await flush();
    expect(
      (element.shadowRoot?.activeElement as HTMLElement | null)?.getAttribute("part"),
    ).toBe("node");

    // Removing the focused node keeps focus on a surviving node button.
    element.versions = [{ id: "only", label: "v1" }];
    await flush();
    expect(
      (element.shadowRoot?.activeElement as HTMLElement | null)?.getAttribute("data-id"),
    ).toBe("only");
  });

  it("moves roving focus through nodes with the arrow keys", async () => {
    const element = await mountGraph();
    const buttons = Array.from(
      element.shadowRoot?.querySelectorAll('[part="node"]') ?? [],
    ) as HTMLButtonElement[];

    // Newest node is the initial tab stop.
    expect(buttons.map(button => button.tabIndex)).toEqual([0, -1, -1, -1, -1, -1]);

    buttons[0]!.focus();
    buttons[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    expect(element.shadowRoot?.activeElement).toBe(buttons[1]);
    expect(buttons[1]!.tabIndex).toBe(0);
    expect(buttons[0]!.tabIndex).toBe(-1);

    buttons[1]!.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(element.shadowRoot?.activeElement).toBe(buttons.at(-1));
  });

  it("exposes toggleCompare for host-driven pairing", async () => {
    const element = await mountGraph();
    const compare = vi.fn();
    element.addEventListener("compare-requested", compare);

    element.toggleCompare("v1");
    element.toggleCompare("v1");
    element.toggleCompare("v1");
    element.toggleCompare("r2");

    expect(compare).toHaveBeenCalledTimes(1);
    expect(compare.mock.calls[0]?.[0]?.detail).toEqual({ baseId: "v1", targetId: "r2" });
  });
});
