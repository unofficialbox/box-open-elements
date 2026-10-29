// @vitest-environment node
import { describe, expect, it } from "vitest";
import { FRAMEWORKS, frameworkSnippet } from "../../docs-site/framework-snippets.js";
import { lessonController, lessonEntry } from "../../docs-site/lesson-controller.js";
import { lessons } from "../../docs-site/lessons.js";
import { formatFrameworkMarkup } from "../../docs-site/format-html.js";

describe("framework-neutral docs examples", () => {
  for (const { id: framework } of FRAMEWORKS) {
    it(`${framework}: preserves attributes and complete slotted/nested markup without adapters`, () => {
      const code = frameworkSnippet(framework, "card", "box-card", '<box-card heading="Contract"><span slot="actions">Review</span><p>Same content</p></box-card>');
      for (const text of ['heading="Contract"', 'slot="actions"', "Review", "Same content", "@unofficialbox/box-open-elements"]) expect(code).toContain(text);
      expect(code).not.toContain("createWebComponent");
      expect(code).not.toContain("npm install");
    });
    it(`${framework}: retains every selected tree/diff/input variant instead of adding framework-only demos`, () => {
      for (const state of ["loading", "unavailable"]) expect(frameworkSnippet(framework, "folder-tree", "box-folder-tree", `<box-folder-tree label="Projects" ${state}></box-folder-tree>`)).toContain(state);
      const diff = frameworkSnippet(framework, "folder-tree-diff", "box-folder-tree-diff", '<box-folder-tree-diff mode="side-by-side" left-label="Source" right-label="Destination" partial></box-folder-tree-diff>');
      for (const attr of ['mode="side-by-side"', 'left-label="Source"', 'right-label="Destination"', "partial"]) expect(diff).toContain(attr);
      const input = frameworkSnippet(framework, "number-input", "box-number-input", '<box-number-input label="Count" min="1" allow-empty placeholder="Any"></box-number-input>');
      expect(input).toContain('placeholder="Any"');
      expect(input.indexOf("allow-empty")).toBeLessThan(input.search(/(?:\[|:)?min(?:\]|=)/));
      expect(input).not.toContain("setValue");
    });
    it(`${framework}: includes optional editor registration`, () => expect(frameworkSnippet(framework, "code-editor", "box-code-editor", "<box-code-editor></box-code-editor>")).toContain('@unofficialbox/box-open-elements/code-editor'));
    it(`${framework}: uses the same cumulative lesson controller with native cleanup`, () => {
      for (const lesson of lessons) {
        expect(lesson.stepFrameworks[framework]).toHaveLength(lesson.steps.length);
        expect(lesson.frameworks[framework]).toBe(lessonEntry(framework));
        for (let i = 0; i < lesson.steps.length; i++) {
          expect(lesson.controllers[i]).toBe(lesson.steps[i].code);
          expect(lesson.controllers[i]).toContain("return () => host.replaceChildren()");
          expect(lesson.stepFrameworks[framework][i]).toContain('./controller.js');
        }
      }
    });
  }
  it("preserves native SVG attributes in Preact while converting React attributes", () => {
    const svg = '<svg viewBox="0 0 16 16"><g stroke-width="2"><path fill-rule="evenodd" clip-rule="evenodd" stroke-linecap="round" d="M0 0" /></g></svg>';
    for (const name of ["stroke-width", "fill-rule", "clip-rule", "stroke-linecap"]) {
      expect(formatFrameworkMarkup(svg, "preact")).toContain(name + '=');
      expect(formatFrameworkMarkup(svg, "react")).not.toContain(name + '=');
    }
  });
  it("uses native array and numeric bindings without changing string-valued controls", () => {
    for (const {id} of FRAMEWORKS.filter(item => item.id !== "html")) {
      const rating = frameworkSnippet(id,"rating","box-rating",'<box-rating value="4"></box-rating>');
      expect(rating).not.toContain('value="4"');
      const picker = frameworkSnippet(id,"content-picker","box-content-picker",'<box-content-picker extensions="pdf,docx"></box-content-picker>');
      expect(picker).toContain('["pdf","docx"]');
      const text = frameworkSnippet(id,"text-field","box-text-field",`<box-text-field value='{"a":1}'></box-text-field>`);
      expect(text).not.toContain('value={{');
    }
  });
  it("preserves multiline strings, false tokens and Angular regex escapes", () => {
    const multiline = formatFrameworkMarkup('<box-resource-row meta="First&#10;Second"></box-resource-row>', "svelte");
    expect(multiline).toContain('meta={"First\\nSecond"}');
    for (const framework of ["react", "solid", "preact"] as const) expect(formatFrameworkMarkup('<box-compare-view sync="off"></box-compare-view>', framework)).toContain('sync={false}');
    expect(frameworkSnippet("angular", "text-field", "box-text-field", '<box-text-field pattern="\\d+"></box-text-field>')).toContain('pattern="\\\\d+"');
  });
  it("renders equivalent inline styles, escaping text for native template parsers", () => {
    const html='<div class="row" style="font-size:12px;--gap:4px">{same} @example</div>';
    expect(formatFrameworkMarkup(html,"react")).toContain('style={{"fontSize":"12px","--gap":"4px"}}');
    expect(formatFrameworkMarkup(html,"solid")).toContain('style={{"font-size":"12px","--gap":"4px"}}');
    expect(formatFrameworkMarkup(html,"angular")).toContain('&#64;example');
    expect(formatFrameworkMarkup(html,"svelte")).toContain('&#123;same&#125;');
  });
});
