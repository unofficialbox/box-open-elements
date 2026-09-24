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

`removeKey` and `removeFromMapList` cover keyed collections. Restores are idempotent and preserve object identity. If a removed map key is recreated in the meantime, `removeKey` leaves the new value untouched. A Toast action and Command/Control-Z offer restoration for eight seconds; hovering or focusing pauses that timer. Shortcuts inside text inputs remain with the input.

For distinct step kinds, set `FlowKind.icon` to a function returning an SVG node. Named glyphs from `foundations/icons/glyphs` keep that import small. The icon is decorative; the card's accessible name always includes its title and kind.

The custom elements register on import and are safe to import during SSR. A host must attach the element before assigning properties in browsers. `installAnnouncer()` is available from `foundations/a11y` if an app needs to announce events outside these components.
