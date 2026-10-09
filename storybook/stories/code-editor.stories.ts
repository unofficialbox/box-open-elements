import type { StoryModule } from "../metadata.js";
import type { CodeEditor } from "../../src/components/forms/code-editor.js";
import { editorHtml, setupCodeEditor } from "../fixtures/editors.js";
const story: StoryModule = {
  title: "Components/Forms/Code Editor",
  meta: {
    id: "code-editor",
    tag: "box-code-editor",
    shortDescription: "An optional CodeMirror editor for host-owned code.",
    docsDescription:
      "Import the code-editor entrypoint. Supply value, language, problems and completions; listen to value-changed. Escape then Tab leaves the editor.",
    sourceSnippet: editorHtml,
    referenceRows: [
      { kind: "attribute", name: "wrap", type: "boolean", description: "Wrap long lines." },
      { kind: "attribute", name: "bracket-colors", type: "boolean", description: "Color parsed bracket pairs by depth and flag unmatched brackets." },
      { kind: "attribute", name: "pass-keys", type: "string", description: "Space-separated host shortcuts such as Mod-Enter Mod-s." },
      { kind: "property", name: "highlights", type: "CodeHighlight[]", description: "UTF-16 ranges shown with a tint and left bar." },
      { kind: "property", name: "completionSource", type: "CodeCompletionSource", description: "Cursor-aware host completions, including asynchronous sources." },
      { kind: "event", name: "selection-changed", type: "{ anchor, head }", description: "Immediate cursor and selection changes." },
      {
        kind: "property",
        name: "value",
        type: "string",
        description:
          "Controlled source text. Programmatic changes do not emit events.",
      },
      {
        kind: "property",
        name: "problems",
        type: "CodeProblem[]",
        description: "One-based line/column or UTF-16 offset diagnostics with error, warning or info tone.",
      },
      {
        kind: "property",
        name: "completions",
        type: "CodeCompletion[]",
        description: "Host-owned completion candidates.",
      },
      {
        kind: "event",
        name: "value-changed",
        type: "{ value: string }",
        description: "Debounced edits, flushed on blur.",
      },
    ],
  },
  variants: [
    { name: "TypeScript workflow", html: editorHtml, setup: setupCodeEditor },
    {
      name: "Bracket colors and host shortcuts",
      html: '<box-code-editor label="Workflow code" language="typescript" bracket-colors pass-keys="Mod-Enter Mod-s"></box-code-editor>',
      setup: root => {
        setupCodeEditor(root);
        const editor = root.querySelector<CodeEditor>("box-code-editor")!;
        editor.wrap = true;
        editor.problems = [];
        editor.value = 'const workflow = {\n  steps: [\n    flow().step("Read file")\n  ]\n};';
      },
    },
  ],
};
export default story;
