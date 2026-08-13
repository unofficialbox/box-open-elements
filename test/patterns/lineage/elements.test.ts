import { afterEach, describe, expect, it, vi } from "vitest";

import { LineageGraph } from "../../../src/patterns/lineage/lineage-graph.js";
import { ProvenanceStrip } from "../../../src/patterns/lineage/provenance-strip.js";
import { isLineageNodeRecord } from "../../../src/patterns/lineage/types.js";
import type { LineageNode } from "../../../src/patterns/lineage/types.js";

LineageGraph.register();
ProvenanceStrip.register();

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

// A clause fanning out through two templates into two executed contracts.
const lineage: LineageNode[] = [
  { id: "clause-5", label: "Clause 4.2 v5", kind: "clause", actor: { name: "Morgan Lee" } },
  {
    id: "tpl-2026",
    label: "Template 2026",
    kind: "template",
    parents: [{ id: "clause-5", deviation: "none" }],
  },
  {
    id: "tpl-2026-emea",
    label: "Template 2026 EMEA",
    kind: "template",
    parents: [{ id: "clause-5", deviation: "minor", note: "GDPR annex" }],
  },
  {
    id: "msa-acme",
    label: "MSA_Acme §4.2",
    kind: "contract",
    parents: [{ id: "tpl-2026", deviation: "major", note: "liability cap reworded" }],
  },
  {
    id: "nda-globex",
    label: "NDA_Globex §4.2",
    kind: "contract",
    parents: [{ id: "tpl-2026-emea", deviation: "none" }],
  },
];

const mountGraph = async (nodes: LineageNode[] = lineage): Promise<LineageGraph> => {
  const element = document.createElement("box-lineage-graph") as LineageGraph;
  element.nodes = nodes;
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("isLineageNodeRecord", () => {
  it("validates parent links and nested records", () => {
    expect(isLineageNodeRecord(lineage[3])).toBe(true);
    expect(isLineageNodeRecord({ id: "x", label: "ok", parents: [{ id: "" }] })).toBe(false);
    expect(isLineageNodeRecord({ id: "x", label: "ok", parents: [{ id: "p", note: 4 }] })).toBe(false);
    expect(isLineageNodeRecord({ id: "x", label: "ok", note: 9 })).toBe(false);
    expect(isLineageNodeRecord({ id: "x", label: "ok", entityRef: { label: "no id" } })).toBe(false);
  });
});

describe("box-lineage-graph", () => {
  it("renders a node button per record and a deviation-toned edge per parent link", async () => {
    const element = await mountGraph();

    expect(element.shadowRoot?.querySelectorAll('[part="node"]')).toHaveLength(5);
    const edges = Array.from(element.shadowRoot?.querySelectorAll('[part="edge"]') ?? []);
    expect(edges).toHaveLength(4);
    expect(edges.filter(edge => edge.getAttribute("data-deviation") === "major")).toHaveLength(1);
    expect(edges.filter(edge => edge.getAttribute("data-deviation") === "minor")).toHaveLength(1);

    const clauseNode = element.shadowRoot?.querySelector('[part="node"][data-id="clause-5"]');
    expect(clauseNode?.getAttribute("data-kind")).toBe("clause");
    expect(clauseNode?.getAttribute("aria-label")).toContain("Morgan Lee");
  });

  it("emits node-selected from node buttons", async () => {
    const element = await mountGraph();
    const selected = vi.fn();
    element.addEventListener("node-selected", selected);

    (
      element.shadowRoot?.querySelector('[part="node"][data-id="tpl-2026"]') as HTMLButtonElement
    ).click();

    expect(selected.mock.calls[0]?.[0]?.detail.node.id).toBe("tpl-2026");
  });

  it("emits edge-selected with the parent/child pair from the edge chips", async () => {
    const element = await mountGraph();
    const edgeSelected = vi.fn();
    element.addEventListener("edge-selected", edgeSelected);

    const chip = element.shadowRoot?.querySelector(
      '[part="edge-chip"][data-parent-id="tpl-2026"][data-child-id="msa-acme"]',
    ) as HTMLButtonElement;
    expect(chip.textContent).toContain("major deviation");
    chip.click();

    const detail = edgeSelected.mock.calls[0]?.[0]?.detail;
    expect(detail.parent.id).toBe("tpl-2026");
    expect(detail.child.id).toBe("msa-acme");
    expect(detail.deviation).toBe("major");
    expect(detail.note).toBe("liability cap reworded");
  });

  it("moves roving focus through nodes with the arrow keys", async () => {
    const element = await mountGraph();
    const buttons = Array.from(
      element.shadowRoot?.querySelectorAll('[part="node"]') ?? [],
    ) as HTMLButtonElement[];

    expect(buttons.map(button => button.tabIndex)).toEqual([0, -1, -1, -1, -1]);

    buttons[0]!.focus();
    buttons[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    expect(element.shadowRoot?.activeElement).toBe(buttons[1]);
    expect(buttons[1]!.tabIndex).toBe(0);
  });

  it("validates the nodes attribute payload", async () => {
    const element = document.createElement("box-lineage-graph") as LineageGraph;
    element.setAttribute(
      "nodes",
      JSON.stringify([
        { id: "ok", label: "v1" },
        { id: "bad", label: "x", parents: [{ deviation: "major" }] },
        "nope",
      ]),
    );
    document.body.append(element);
    await flush();

    expect(element.nodes.map(node => node.id)).toEqual(["ok"]);
    expect(element.shadowRoot?.querySelectorAll('[part="node"]')).toHaveLength(1);
  });
});

describe("box-provenance-strip", () => {
  const chain = [lineage[0]!, lineage[1]!, lineage[3]!];

  it("renders the ancestry oldest-first and marks the newest as current", async () => {
    const element = document.createElement("box-provenance-strip") as ProvenanceStrip;
    element.nodes = chain;
    document.body.append(element);
    await flush();

    const chips = Array.from(element.shadowRoot?.querySelectorAll('[part="chip"]') ?? []);
    expect(chips.map(chip => chip.textContent)).toEqual([
      "Clause 4.2 v5",
      "Template 2026",
      "MSA_Acme §4.2",
    ]);
    expect(chips.at(-1)?.getAttribute("aria-current")).toBe("true");
    expect(chips[0]?.getAttribute("aria-current")).toBeNull();
    // Separators sit between chips, not before the first.
    expect(element.shadowRoot?.querySelectorAll('[part="separator"]')).toHaveLength(2);
  });

  it("emits node-selected from a chip", async () => {
    const element = document.createElement("box-provenance-strip") as ProvenanceStrip;
    element.nodes = chain;
    document.body.append(element);
    await flush();
    const selected = vi.fn();
    element.addEventListener("node-selected", selected);

    (element.shadowRoot?.querySelector('[part="chip"][data-id="tpl-2026"]') as HTMLButtonElement).click();

    expect(selected.mock.calls[0]?.[0]?.detail.node.id).toBe("tpl-2026");
  });
});
