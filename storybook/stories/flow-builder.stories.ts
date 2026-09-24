import type { StoryModule } from "../metadata.js";
import { flowBuilderDemoHtml, flowBuilderSetupCode, setupFlowBuilderDemo } from "../fixtures/flow-builder.js";

const story: StoryModule = {
  title: "Patterns/Builders/Flow Builder",
  meta: {
    id: "flow-builder", tag: "box-flow-builder",
    shortDescription: "A typed step spine with named insertion, nested branches, validation and a responsive inspector.",
    docsDescription: "Provide host-owned nodes and a shared kind catalog. The pattern handles insertion, selection, keyboard navigation and responsive inspection. The host owns domain fields, validation, persistence and Undo of removals.",
    sourceSnippet: `<box-flow-builder></box-flow-builder>\n<script type="module">\n${flowBuilderSetupCode}\n</script>`,
    referenceRows: [
      { kind: "property", name: "nodes", type: "FlowNode[]", description: "Mutable host-owned sequence. Call refresh() after host edits." },
      { kind: "property", name: "catalog", type: "FlowKind[]", description: "Shared kind names, descriptions and node factories for palette and insertion." },
      { kind: "property", name: "renderInspector", type: "InspectorRenderer", description: "Host editor callback; may return teardown cleanup." },
      { kind: "event", name: "flow-changed", type: "{ nodes, node, reason }", description: "A kind was inserted into the host document." },
      { kind: "event", name: "selection-changed", type: "{ node }", description: "Selected node changed, including sheet close." },
      { kind: "part", name: "layout", description: "Responsive flow and inspector arrangement." },
      { kind: "part", name: "error", description: "Persistent validation summary." },
    ],
  },
  variants: [{ name: "Editable flow", html: flowBuilderDemoHtml, setup: setupFlowBuilderDemo }],
};
export default story;
