import { afterEach, describe, expect, it, vi } from "vitest";
import { FlowBuilder, FlowSpine, FlowCard, KindPicker, InsertPoint, cardLabel, insertLabel, nodeAtPath, type FlowKind, type FlowNode } from "../../src/patterns/flow-builder/index.js";
const catalog: FlowKind[] = [
  { kind: "call", label: "Call API", description: "Calls an endpoint", icon: () => document.createElementNS("http://www.w3.org/2000/svg", "svg"), create: () => ({ kind: "call" }) },
  { kind: "wait", label: "Wait", description: "Pauses the flow", create: () => ({ kind: "wait" }) },
];
afterEach(() => { document.body.innerHTML = ""; vi.restoreAllMocks(); });
describe("flow-builder", () => {
  it("names cards and insertion points without duplicate kind text", () => {
    const nodes: FlowNode[] = [{ kind: "call", title: "Upload" }, { kind: "wait" }];
    expect(cardLabel(nodes[1], catalog)).toBe("Wait. Pauses the flow");
    expect(cardLabel(nodes[0], catalog, true)).toContain("Upload. Call API. Calls an endpoint. Needs attention");
    expect(insertLabel([], 0)).toContain("first step");
    expect(insertLabel(nodes, 0, "in branch A", catalog)).toBe("Insert before Upload in branch A");
    expect(insertLabel(nodes, 1, "in branch A", catalog)).toContain("between Upload and Wait");
    expect(insertLabel(nodes, 2, "in branch A", catalog)).toContain("after Wait");
    const document = { body: [{ kind: "parallel", branches: [nodes] }] };
    expect(nodeAtPath(document, ["body", 0, "branches", 0, 1, "description"])).toBe(nodes[1]);
    expect(nodeAtPath(document, ["missing"])).toBeNull();
  });
  it("renders nested named branches, selection and errors", () => {
    const spine = new FlowSpine(); const node = { kind: "call", title: "Upload" };
    spine.nodes = [{ kind: "parallel", branches: [{ label: "On success", body: [node] }] }]; spine.catalog = catalog;
    document.body.append(spine);
    expect(spine.shadowRoot!.querySelector('[aria-label="On success"]')).not.toBeNull();
    const point = spine.shadowRoot!.querySelector<InsertPoint>("box-insert-point")!;
    expect(point.shadowRoot!.querySelector("button")!.getAttribute("aria-label")).toContain("before");
    expect(point.shadowRoot!.querySelector("button")!.textContent).toBe("+");
    spine.select(node, node);
    const card = Array.from(spine.shadowRoot!.querySelectorAll<FlowCard>("box-flow-card")).find(card => card.node === node)!;
    expect(card.shadowRoot!.querySelector("button")!.getAttribute("aria-pressed")).toBe("true");
    expect(card.shadowRoot!.querySelector("[part=icon] svg")).not.toBeNull();
    expect(card.shadowRoot!.querySelector("[part=error]")!.hasAttribute("hidden")).toBe(false);
  });
  it("supports chooser arrow/Home/End and Escape", () => {
    const picker = new KindPicker(); picker.catalog = catalog; picker.variant = "menu"; document.body.append(picker); picker.focus();
    const cancel = vi.fn(); picker.addEventListener("picker-cancel", cancel);
    const key = (key: string) => picker.shadowRoot!.activeElement!.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
    key("End"); expect(picker.shadowRoot!.activeElement?.textContent).toContain("Wait");
    key("ArrowDown"); expect(picker.shadowRoot!.activeElement?.textContent).toContain("Call API");
    key("ArrowUp"); expect(picker.shadowRoot!.activeElement?.textContent).toContain("Wait");
    key("Home"); expect(picker.shadowRoot!.activeElement?.textContent).toContain("Call API");
    key("Escape"); expect(cancel).toHaveBeenCalledOnce();
  });
  it("inserts into the host document and focuses the new card", () => {
    const builder = new FlowBuilder(); builder.catalog = catalog; document.body.append(builder);
    const changed = vi.fn(); builder.addEventListener("flow-changed", changed);
    const spine = builder.shadowRoot!.querySelector<FlowSpine>("box-flow-spine")!;
    const point = spine.shadowRoot!.querySelector<InsertPoint>("box-insert-point")!;
    point.shadowRoot!.querySelector("button")!.click();
    const picker = builder.shadowRoot!.querySelector<KindPicker>("[part=picker-popup] box-kind-picker")!;
    picker.shadowRoot!.querySelector("button")!.click();
    expect(builder.nodes).toHaveLength(1); expect(changed).toHaveBeenCalledOnce();
    const card = spine.shadowRoot!.querySelector<FlowCard>("box-flow-card")!;
    expect(card.shadowRoot!.activeElement?.tagName).toBe("BUTTON");
    builder.setValidation("Endpoint required", ["body", 0]);
    expect(builder.selected).toBe(builder.nodes[0]);
    expect(builder.shadowRoot!.querySelector("[part=error]")!.textContent).toBe("Endpoint required");
  });
  it("keeps validation visible without a mobile sheet and cleans up host inspector", () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 390 } as DOMRect);
    const cleanup = vi.fn(); const render = vi.fn(() => cleanup);
    const builder = new FlowBuilder(); builder.catalog = catalog; builder.nodes = [{ kind: "call" }]; builder.renderInspector = render;
    document.body.append(builder); builder.selected = builder.nodes[0];
    builder.setValidation("Required", ["body", 0]);
    expect(builder.selected).toBeNull(); expect(cleanup).toHaveBeenCalled();
    builder.remove();
  });
});
