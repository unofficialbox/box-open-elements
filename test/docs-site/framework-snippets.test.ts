// @vitest-environment node
import { describe, expect, it } from "vitest";
import { FRAMEWORKS, frameworkSnippet } from "../../docs-site/framework-snippets.js";
import { jsxLessonSnippet } from "../../docs-site/lesson-jsx.js";
import { lessons } from "../../docs-site/lessons.js";
import { normalizeLang } from "../../docs-site/highlight.js";
import { frameworkIconSvg } from "../../docs-site/framework-icons.js";

describe("Solid and Preact docs snippets", () => {
  for (const framework of ["solid", "preact"] as const) {
    it(`${framework}: shares the selector, grammar, logo and real adapter factory`, () => {
      expect(FRAMEWORKS.map(item => item.id)).toContain(framework);
      expect(normalizeLang(framework)).toBe("ts");
      expect(frameworkIconSvg(framework)).toContain("<path");
      const code = frameworkSnippet(framework, "button", "box-button", '<box-button label="Save" disabled></box-button>');
      expect(code).toContain(`@unofficialbox/box-open-elements-${framework}`);
      expect(code).toContain('tagName: "box-button"');
      expect(code).toContain('label="Save"');
      expect(code).toContain("disabled");
      expect(code).not.toContain('from "react"');
      expect(code).not.toContain("preact/compat");
      if (framework === "preact") expect(code).toContain("@jsxImportSource preact");
    });
    it(`${framework}: imports the optional editor and preserves loading/input variant attributes`, () => {
      expect(frameworkSnippet(framework, "code-editor", "box-code-editor", "<box-code-editor></box-code-editor>"))
        .toContain('import "@unofficialbox/box-open-elements/code-editor"');
      for (const state of ["loading", "unavailable"]) {
        const code = frameworkSnippet(framework, "folder-tree", "box-folder-tree", `<box-folder-tree label="Projects" ${state}></box-folder-tree>`);
        expect(code).toContain(`label="Projects" ${state}`);
        expect(code).toContain("const nodes: FolderTreeNode[] = [];");
      }
      const input = frameworkSnippet(framework, "number-input", "box-number-input", '<box-number-input label="Count" allow-empty placeholder="Any" min="1" max="9" disabled></box-number-input>');
      for (const attr of ['label="Count"', 'placeholder="Any"', 'min="1"', 'max="9"', "disabled"]) expect(input).toContain(attr);
      const diff = frameworkSnippet(framework, "folder-tree-diff", "box-folder-tree-diff", '<box-folder-tree-diff left-label="Source" right-label="Destination" partial></box-folder-tree-diff>');
      expect(diff).toContain('left-label="Source" right-label="Destination" partial');
    });
    it(`${framework}: shows nullable input event/state and preserves the default numeric variant`, () => {
      const optional = frameworkSnippet(framework, "number-input", "box-number-input", '<box-number-input allow-empty></box-number-input>');
      expect(optional).toContain("number | null");
      expect(optional).toContain('eventName: "value-changed"');
      expect(optional).toContain("setValue(event.detail.value)");
      expect(optional).toContain("allow-empty={true}");
      expect(frameworkSnippet(framework, "number-input", "box-number-input", '<box-number-input value="12"></box-number-input>'))
        .toContain('value="12"');
    });
    it(`${framework}: supplies typed tree data and controlled selection/expansion with exact diff mode`, () => {
      for (const [id, mode] of [["folder-tree", ""], ["folder-tree-diff", "unified"], ["folder-tree-diff", "side-by-side"]]) {
        const code = frameworkSnippet(framework, id, `box-${id}`, `<box-${id} mode="${mode}"></box-${id}>`);
        expect(code).toContain('id: "plan"');
        expect(code).toContain('eventName: "expanded-changed"');
        expect(code).toContain("setSelected(event.detail.selectedIds)");
        expect(code).toContain(framework === "solid" ? "expandedIds={expanded()}" : "expandedIds={expanded}");
        if (mode) expect(code).toContain(`mode="${mode}"`);
      }
    });
    it(`${framework}: scopes every cumulative lesson step and cleans up on unmount`, () => {
      for (const lesson of lessons) {
        expect(lesson.stepFrameworks[framework]).toHaveLength(lesson.steps.length);
        for (const code of lesson.stepFrameworks[framework]) {
          expect(code).toContain("host.replaceChildren()");
          expect(code).not.toContain("document.getElementById");
          expect(code).toContain(framework === "solid" ? "onMount" : "useLayoutEffect");
          if (framework === "preact") expect(code).toContain("@jsxImportSource preact");
        }
        expect(lesson.frameworks[framework]).toBe(lesson.stepFrameworks[framework].at(-1));
      }
    });
  }
  it("keeps imports at module scope while lookup and controller code belong to the mounted host", () => {
    const code = jsxLessonSnippet("preact", 'import { ContentExplorer } from "@unofficialbox/box-open-elements";\nconst node = document.createElement("box-content-explorer");\ndocument.getElementById("app").append(node);\nconst field = document.getElementById("counterparty");');
    expect(code.indexOf("import { ContentExplorer")).toBeLessThan(code.indexOf("export function Example"));
    expect(code).toContain("host.append(node)");
    expect(code).toContain('byId("counterparty")');
  });
});
