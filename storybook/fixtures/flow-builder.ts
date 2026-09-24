import { FlowBuilder, type FlowKind, type FlowNode } from "../../src/patterns/flow-builder/index.js";
import { offerUndo, removeAt, type UndoOffer } from "../../src/patterns/undo/index.js";
import { iconCloud, iconClock1, iconGroupCall, iconFolder } from "../../src/foundations/icons/glyphs/index.js";

export const flowBuilderDemoHtml = `<div style="display:grid;gap:12px;min-width:0"><div style="display:flex;gap:8px;flex-wrap:wrap"><box-button data-flow-error label="Show validation error" tone="neutral"></box-button><box-button data-flow-reset label="Reset flow" tone="neutral"></box-button><span data-flow-state aria-live="polite">Saved</span></div><box-flow-builder></box-flow-builder></div>`;
export const flowBuilderSetupCode = `import { FlowBuilder } from "@unofficialbox/box-open-elements/patterns/flow-builder";
import { offerUndo, removeAt } from "@unofficialbox/box-open-elements/patterns/undo";

const builder = document.querySelector("box-flow-builder");
let undoOffer;
builder.catalog = [{ kind: "call", label: "Call API", description: "Calls an endpoint", create: () => ({ kind: "call", title: "New call" }) }];
builder.nodes = [{ kind: "call", title: "Read contract", description: "Gets the source document" }];
builder.renderInspector = (node, container) => {
  // Host owns its editor, validation, persistence, and saved state.
  const remove = document.createElement("button");
  remove.textContent = "Remove step";
  remove.onclick = () => {
    const index = builder.nodes.indexOf(node);
    if (index < 0) return;
    const restore = removeAt(builder.nodes, index);
    builder.select(null);
    builder.refresh();
    undoOffer?.dispose();
    undoOffer = offerUndo("Step removed", restore, { onRestore: () => builder.refresh() });
  };
  container.append(remove);
};
builder.addEventListener("flow-changed", () => { /* mark unsaved and persist on Save */ });
// On route teardown: undoOffer?.dispose();`;

const initialNodes = (): FlowNode[] => [
  { kind: "call", title: "Read contract", description: "Gets the source document" },
  { kind: "parallel", title: "Check in parallel", description: "Checks two records at once", branches: [
    { label: "Contract", body: [{ kind: "call", title: "Extract terms", description: "Reads renewal and dates" }] },
    { label: "Account", body: [{ kind: "call", title: "Get account", description: "Looks up customer details" }] },
  ] },
  { kind: "call", title: "Save results", description: "Writes the verified summary" },
];

export function setupFlowBuilderDemo(root: HTMLElement): () => void {
  const builder = root.querySelector<FlowBuilder>("box-flow-builder")!;
  const state = root.querySelector<HTMLElement>("[data-flow-state]")!;
  let offer: UndoOffer | undefined;
  const glyph = (markup: string) => () => {
    const template = document.createElement("template");
    template.innerHTML = markup; // Static SVG from the generated, authored icon pack.
    return template.content.firstElementChild!;
  };
  const catalog: FlowKind[] = [
    { kind: "call", label: "Call API", description: "Calls a service endpoint", group: "Actions", icon: glyph(iconCloud), create: () => ({ kind: "call", title: "New call" }) },
    { kind: "wait", label: "Wait", description: "Pauses before continuing", group: "Actions", icon: glyph(iconClock1), create: () => ({ kind: "wait" }) },
    { kind: "parallel", label: "Parallel", description: "Runs named branches at once", group: "Branches", icon: glyph(iconGroupCall), create: () => ({ kind: "parallel", branches: [{ label: "Branch 1", body: [] }, { label: "Branch 2", body: [] }] }) },
    { kind: "group", label: "Group", description: "Organizes steps into one section", group: "Containers", icon: glyph(iconFolder), create: () => ({ kind: "group", body: [] }) },
  ];
  builder.catalog = catalog;
  builder.nodes = initialNodes();
  builder.renderInspector = (node, container) => {
    const description = document.createElement("p");
    description.textContent = catalog.find(kind => kind.kind === node.kind)?.description ?? "Step configuration";
    const label = document.createElement("label"); label.textContent = "Step name";
    const input = document.createElement("input"); input.value = node.title ?? ""; input.style.cssText = "display:block;width:100%;font:inherit;padding:8px;margin:6px 0 12px";
    label.append(input);
    input.addEventListener("input", () => { node.title = input.value; state.textContent = "Unsaved changes"; builder.refresh(); });
    const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove step";
    remove.addEventListener("click", () => {
      const find = (list: FlowNode[]): { list: FlowNode[]; index: number } | undefined => {
        const index = list.indexOf(node); if (index >= 0) return { list, index };
        for (const item of list) {
          if (item.body) { const result = find(item.body); if (result) return result; }
          for (const branch of item.branches ?? []) { const result = find(branch.body); if (result) return result; }
        }
      };
      const location = find(builder.nodes); if (!location) return;
      const restore = removeAt(location.list, location.index);
      builder.select(null); builder.refresh(); state.textContent = "Unsaved changes";
      offer?.dispose(); offer = offerUndo(`${node.title || "Step"} removed`, restore, { onRestore: () => { builder.refresh(); builder.select(node); } });
    });
    container.append(description, label, remove);
  };
  const changed = () => { state.textContent = "Unsaved changes"; };
  const showError = () => builder.setValidation("The first step needs an endpoint.", ["body", 0]);
  const reset = () => { offer?.dispose(); builder.select(null); builder.nodes = initialNodes(); builder.setValidation(""); state.textContent = "Saved"; };
  builder.addEventListener("flow-changed", changed);
  const errorButton = root.querySelector<HTMLElement>("[data-flow-error]")!;
  const resetButton = root.querySelector<HTMLElement>("[data-flow-reset]")!;
  errorButton.addEventListener("click", showError); resetButton.addEventListener("click", reset);
  return () => { offer?.dispose(); builder.removeEventListener("flow-changed", changed); errorButton.removeEventListener("click", showError); resetButton.removeEventListener("click", reset); builder.renderInspector = undefined; };
}
