import { afterEach, describe, expect, it, vi } from "vitest";
import { FlowBuilder, FlowSpine, FlowCard, KindPicker, InsertPoint, cardLabel, insertLabel, nodeAtPath, type FlowKind, type FlowModel, type FlowNode } from "../../src/patterns/flow-builder/index.js";
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
  describe("host-shaped documents", () => {
    // A document that doesn't use body/branches the way FlowNode does:
    // fork branches are plain arrays, if/else is body + else, and a
    // weighted switch keeps its arms as { weight, body }.
    type Step = { kind: string; name?: string; body?: Step[]; else?: Step[]; branches?: Step[][]; arms?: { weight: number; body: Step[] }[] };
    const model: FlowModel<Step> = {
      children: node => [
        ...(node.kind === "if" ? [{ label: "If yes", list: node.body! }, { label: "Otherwise", list: node.else! }] : node.body ? [{ list: node.body }] : []),
        ...(node.branches ?? []).map((list, i) => ({ label: `Branch ${i + 1}`, list, removable: node.branches!.length > 2 })),
        ...(node.arms ?? []).map(arm => ({ label: `Weight ${arm.weight}`, list: arm.body, removable: node.arms!.length > 1 })),
      ],
      title: node => node.name,
      description: node => node.kind === "fork" ? `Runs ${node.branches!.length} branches at once` : undefined,
      addBranchLabel: node => node.kind === "fork" ? "Add branch" : node.kind === "switch" ? "Add arm" : undefined,
    };
    const stepKinds: FlowKind<Step>[] = [
      { kind: "step", label: "Step", description: "Calls the API", tone: "accent", icon: () => document.createElementNS("http://www.w3.org/2000/svg", "svg"), create: () => ({ kind: "step", name: "new.step" }) },
      { kind: "pause", label: "Think time", description: "Waits", tone: "neutral", icon: () => document.createElementNS("http://www.w3.org/2000/svg", "svg"), create: () => ({ kind: "pause" }) },
      { kind: "fork", label: "Parallel", description: "Runs branches at once", create: () => ({ kind: "fork", branches: [[], []] }) },
      { kind: "if", label: "If / Else", description: "Your code picks a branch", create: () => ({ kind: "if", body: [], else: [] }) },
      { kind: "switch", label: "Switch", description: "Picks a weighted arm", create: () => ({ kind: "switch", arms: [{ weight: 1, body: [] }] }) },
    ];
    const mount = (nodes: Step[]) => {
      const builder = new FlowBuilder<Step>(); builder.model = model; builder.catalog = stepKinds; builder.nodes = nodes;
      document.body.append(builder);
      const spine = builder.shadowRoot!.querySelector<FlowSpine>("box-flow-spine")!;
      return { builder, spine };
    };
    const cardFor = (spine: FlowSpine, node: Step) => Array.from(spine.shadowRoot!.querySelectorAll<FlowCard>("box-flow-card")).find(card => card.node === node)!;

    it("walks the host's own lists through the model and inserts into them", () => {
      const upload: Step = { kind: "step", name: "files.upload" };
      const branchA: Step[] = [upload]; const branchB: Step[] = [];
      const doc: Step[] = [{ kind: "fork", branches: [branchA, branchB] }, { kind: "if", body: [], else: [] }];
      const { builder, spine } = mount(doc);
      const labels = Array.from(spine.shadowRoot!.querySelectorAll("[part=branch]")).map(branch => branch.getAttribute("aria-label"));
      expect(labels).toEqual(["Branch 1", "Branch 2", "If yes", "Otherwise"]);
      expect(cardFor(spine, upload).shadowRoot!.querySelector("button")!.getAttribute("aria-label")).toBe("files.upload. Step. Calls the API");
      expect(cardFor(spine, doc[0]).shadowRoot!.querySelector("[part=description]")!.textContent).toBe("Runs 2 branches at once");
      // Insert into Branch 2: the host's own array receives the new step.
      const point = Array.from(spine.shadowRoot!.querySelectorAll<InsertPoint>("box-insert-point")).find(p => p.detail.list === branchB)!;
      expect(point.detail.label).toBe("Add the first step in Branch 2");
      point.shadowRoot!.querySelector("button")!.click();
      builder.shadowRoot!.querySelector<KindPicker>("[part=picker-popup] box-kind-picker")!.shadowRoot!.querySelector("button")!.click();
      expect(branchB).toHaveLength(1); expect(doc[0].branches![1]).toBe(branchB);
      expect(builder.selected).toBe(branchB[0]);
    });

    it("requests branch changes instead of editing the document", () => {
      const fork: Step = { kind: "fork", branches: [[], [], []] };
      const sw: Step = { kind: "switch", arms: [{ weight: 1, body: [] }] };
      const { builder, spine } = mount([fork, sw]);
      const add = vi.fn(); const remove = vi.fn();
      builder.addEventListener("branch-add-request", add); builder.addEventListener("branch-remove-request", remove);
      const addButtons = Array.from(spine.shadowRoot!.querySelectorAll<HTMLButtonElement>("[part=branch-add]"));
      expect(addButtons.map(b => b.getAttribute("aria-label"))).toEqual(["Add branch to Parallel", "Add arm to Switch"]);
      addButtons[0].click();
      expect((add.mock.calls[0][0] as CustomEvent).detail.node).toBe(fork);
      // Forks with more than two branches are removable; a lone switch arm is not.
      const removeButtons = Array.from(spine.shadowRoot!.querySelectorAll<HTMLButtonElement>("[part=branch-remove]"));
      expect(removeButtons).toHaveLength(3);
      removeButtons[1].click();
      const detail = (remove.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.node).toBe(fork); expect(detail.index).toBe(1); expect(detail.list).toBe(fork.branches![1]);
      expect(fork.branches).toHaveLength(3);
    });

    it("forwards start and end labels and applies icon tone in cards and the picker", () => {
      const pause: Step = { kind: "pause" };
      const { builder, spine } = mount([{ kind: "step", name: "a" }, pause]);
      builder.setAttribute("start-label", "Iteration starts"); builder.endLabel = "Iteration ends";
      expect(Array.from(spine.shadowRoot!.querySelectorAll("[part=endpoint]")).map(e => e.textContent)).toEqual(["Iteration starts", "Iteration ends"]);
      expect(cardFor(spine, pause).shadowRoot!.querySelector<HTMLElement>("[part=icon]")!.dataset.tone).toBe("neutral");
      const palette = builder.shadowRoot!.querySelector<KindPicker>("aside box-kind-picker")!;
      const tones = Array.from(palette.shadowRoot!.querySelectorAll<HTMLElement>("[part=choice-icon]")).map(icon => icon.dataset.tone);
      expect(tones).toEqual(["accent", "neutral"]);
      expect(palette.shadowRoot!.querySelector("[part=choice-icon] svg")).not.toBeNull();
    });

    it("exports card, spine and picker parts through the builder", () => {
      const { builder, spine } = mount([{ kind: "step", name: "a" }]);
      const exported = builder.shadowRoot!.querySelector("box-flow-spine")!.getAttribute("exportparts")!;
      for (const part of ["card", "icon", "title", "description", "branch-add", "branch-remove", "insert", "endpoint"]) expect(exported).toContain(part);
      expect(spine.shadowRoot!.querySelector("box-flow-card")!.getAttribute("exportparts")).toContain("icon");
      expect(builder.shadowRoot!.querySelector("aside box-kind-picker")!.getAttribute("exportparts")).toContain("choice-icon");
    });

    it("marks validation without its own message when the host shows the error", () => {
      const doc: Step[] = [{ kind: "fork", branches: [[{ kind: "step" }], []] }];
      const { builder, spine } = mount(doc);
      builder.setValidation("Every step needs a name", ["body", 0, "branches", 0, 0], { body: doc }, { showMessage: false });
      const invalid = doc[0].branches![0][0];
      expect(builder.shadowRoot!.querySelector<HTMLElement>("[part=error]")!.hidden).toBe(true);
      expect(cardFor(spine, invalid).shadowRoot!.querySelector<HTMLElement>("[part=error]")!.hidden).toBe(false);
      expect(builder.selected).toBe(invalid);
    });

    it("refreshes one card and the inspector heading without re-rendering the inspector", () => {
      const step: Step = { kind: "step", name: "old.name" };
      const { builder, spine } = mount([step]);
      const render = vi.fn(); builder.renderInspector = render; builder.select(step);
      step.name = "new.name"; builder.refreshNode(step);
      expect(cardFor(spine, step).shadowRoot!.querySelector("[part=title]")!.textContent).toBe("new.name");
      expect(builder.shadowRoot!.querySelector("[part=inspector-heading]")!.textContent).toBe("new.name");
      expect(render).toHaveBeenCalledOnce();
    });
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
