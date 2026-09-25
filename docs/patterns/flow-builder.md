# Flow builder and undo

The flow builder is a reusable editing shell for steps, nested groups and named branches. It does not save a document or define product-specific step schemas. A host owns the document, editor fields, validation and persistence. The [live example](https://unofficialbox.github.io/box-open-elements/#patterns/flow-builder) demonstrates insertion, selection, validation, removal and Undo.

```ts
import { FlowBuilder, type FlowKind, type FlowNode } from "@unofficialbox/box-open-elements/patterns/flow-builder";
import { offerUndo, removeAt } from "@unofficialbox/box-open-elements/patterns/undo";

const builder = document.querySelector("box-flow-builder") as FlowBuilder;
const kinds: FlowKind[] = [{
  kind: "call", label: "Call API", description: "Calls an endpoint",
  create: () => ({ kind: "call", title: "New call" }),
}];
const nodes: FlowNode[] = [{ kind: "call", title: "Read contract" }];
builder.catalog = kinds;
builder.nodes = nodes;
builder.renderInspector = (node, container) => {
  const input = document.createElement("input");
  input.value = node.title ?? "";
  input.addEventListener("input", () => {
    node.title = input.value;
    builder.refresh();
    // Mark your document unsaved here.
  });
  container.append(input);
};
builder.addEventListener("flow-changed", () => {
  // Mark your document unsaved. Save through your own API.
});

// After a failed Save, keep this message until the error is fixed:
builder.setValidation("The first step needs an endpoint", ["body", 0], { body: nodes });

// A remove action in the host inspector:
const restore = removeAt(nodes, 0);
builder.select(null);
builder.refresh();
const offer = offerUndo("Step removed", restore, {
  onRestore: () => builder.refresh(),
});
// Dispose the offer when this view unmounts: offer.dispose();
```

## Host-shaped documents

The builder never needs a document in `FlowNode` shape. Give it a `model` that says how to read your nodes, and pass your own objects: node identity is preserved, so selection, Undo and validation paths keep pointing at the host's data. `FlowBuilder` is generic over the host node type.

```ts
import { FlowBuilder, type FlowModel } from "@unofficialbox/box-open-elements/patterns/flow-builder";

type Step = { kind: string; name?: string; body?: Step[]; else?: Step[]; branches?: Step[][] };
const model: FlowModel<Step> = {
  // Unlabeled lists render inline; labeled lists render as branch columns.
  children: node => node.kind === "if"
    ? [{ label: "If yes", list: node.body! }, { label: "Otherwise", list: node.else! }]
    : [
        ...(node.body ? [{ list: node.body }] : []),
        ...(node.branches ?? []).map((list, i) => ({ label: `Branch ${i + 1}`, list, removable: node.branches!.length > 2 })),
      ],
  title: node => node.name,
  description: node => node.kind === "fork" ? `Runs ${node.branches!.length} branches at once` : undefined,
  addBranchLabel: node => node.kind === "fork" ? "Add branch" : undefined,
};

const builder = document.querySelector("box-flow-builder") as FlowBuilder<Step>;
builder.model = model;
builder.startLabel = "Iteration starts";
builder.endLabel = "Iteration ends";
builder.addEventListener("branch-add-request", event => {
  const { node } = (event as CustomEvent<{ node: Step }>).detail;
  node.branches!.push([]);
  builder.refresh();
});
builder.addEventListener("branch-remove-request", event => {
  const { node, index } = (event as CustomEvent<{ node: Step; index: number }>).detail;
  const restore = removeAt(node.branches!, index);
  builder.refresh();
  offerUndo("Branch removed", restore, { onRestore: () => builder.refresh() });
});
```

The builder splices inserted steps into the lists `children` returns. Branch changes are requests: the host edits the document and calls `refresh()`, as it does for removal. After editing a step's fields, `refreshNode(node)` re-renders that card and the inspector heading without re-mounting the inspector; structural edits need `refresh()`.

- **Labels.** `start-label` / `end-label` (or `startLabel` / `endLabel`) replace "Flow starts" / "Flow ends".
- **Icon tone.** `FlowKind.tone` is `"accent"` (default) or `"neutral"`, so a host can keep the accent for its primary step kind. Kind icons also appear in the chooser.
- **Validation without a second message.** A host that already shows the error persistently calls `setValidation(message, path, document, { showMessage: false })`: the step is marked and announced, and the builder's own error line stays hidden.
- **Styling.** Card parts (`card`, `icon`, `title`, `kind`, `description`, `status`, `error`), spine parts (`spine`, `endpoint`, `body`, `branches`, `branch`, `branch-header`, `branch-label`, `branch-add`, `branch-remove`, `insert`) and chooser parts (`choices`, `group-heading`, `choice`, `choice-icon`, `choice-label`, `choice-description`) are exported through `box-flow-builder`, so `box-flow-builder::part(icon)` works from the page.

`removeKey` and `removeFromMapList` cover keyed collections. Restores are idempotent and preserve object identity. If a removed map key is recreated in the meantime, `removeKey` leaves the new value untouched. A Toast action and Command/Control-Z offer restoration for eight seconds; hovering or focusing pauses that timer. Shortcuts inside text inputs remain with the input.

For distinct step kinds, set `FlowKind.icon` to a function returning an SVG node. Named glyphs from `foundations/icons/glyphs` keep that import small. The icon is decorative; the card's accessible name always includes its title and kind.

The custom elements register on import and are safe to import during SSR. A host must attach the element before assigning properties in browsers. `installAnnouncer()` is available from `foundations/a11y` if an app needs to announce events outside these components.
