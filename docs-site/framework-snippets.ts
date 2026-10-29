import { formatHtml, indentBlock } from "./format-html.js";
import { jsxFrameworkSnippet } from "./jsx-framework-snippets.js";

export type Framework = "html" | "react" | "angular" | "vue" | "svelte" | "solid" | "preact";

export const FRAMEWORKS: Array<{ id: Framework; label: string }> = [
  { id: "html", label: "HTML" },
  { id: "react", label: "React" },
  { id: "angular", label: "Angular" },
  { id: "vue", label: "Vue" },
  { id: "svelte", label: "Svelte" },
  { id: "solid", label: "Solid" },
  { id: "preact", label: "Preact" },
];

/**
 * The demo's representative root element, pretty-printed in self-closing (JSX)
 * and full forms. Attribute-heavy elements would otherwise be a single ~500
 * character line.
 */
const representativeTag = (html: string, tag: string): { selfClose: string; full: string } => {
  const open = new RegExp(`<${tag}(?:\\s[^>]*)?>`).exec(html)?.[0] ?? `<${tag}>`;
  return {
    selfClose: formatHtml(open.replace(/\s*>$/, "/>"), true),
    full: formatHtml(`${open}</${tag}>`),
  };
};

/** True when a formatted snippet spans more than one line. */
const isMultiline = (code: string): boolean => code.includes("\n");

/** A minimal copy-pasteable per-framework usage snippet for one component. */
export const frameworkSnippet = (framework: Framework, id: string, tag: string, html: string): string => {
  if (framework === "html") return formatHtml(html);
  if (framework === "solid" || framework === "preact") return jsxFrameworkSnippet(framework, id, tag, html);
  const { selfClose, full } = representativeTag(html, tag);
  const componentPath = id === "preview-element" ? "preview" : id;
  const imp = `import "@unofficialbox/box-open-elements/${componentPath}";`;
  switch (framework) {
    case "react": {
      // Multi-line JSX has to be parenthesised after `return`.
      const body = isMultiline(selfClose)
        ? `  return (\n${indentBlock(selfClose, 4)}\n  );`
        : `  return ${selfClose};`;
      return `${imp}\n\nexport function Example() {\n${body}\n}`;
    }
    case "angular":
      return `import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";\n${imp}\n\n@Component({\n  standalone: true,\n  schemas: [CUSTOM_ELEMENTS_SCHEMA],\n  template: \`\n${indentBlock(full, 4)}\n  \`,\n})\nexport class Example {}`;
    case "vue":
      return `<script setup lang="ts">\n${imp}\n</script>\n\n<template>\n${indentBlock(full, 2)}\n</template>`;
    case "svelte":
      return `<script lang="ts">\n${indentBlock(imp, 2)}\n</script>\n\n${full}`;
  }
};

