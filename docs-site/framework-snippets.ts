import { formatFrameworkMarkup, indentBlock } from "./format-html.js";
import { jsxFrameworkSnippet } from "./jsx-framework-snippets.js";

export type Framework = "html" | "react" | "angular" | "vue" | "svelte" | "solid" | "preact";
export const FRAMEWORKS: Array<{ id: Framework; label: string }> = [
  { id: "html", label: "HTML" }, { id: "react", label: "React" },
  { id: "angular", label: "Angular" }, { id: "vue", label: "Vue" },
  { id: "svelte", label: "Svelte" }, { id: "solid", label: "Solid" },
  { id: "preact", label: "Preact" },
];

/** Every tab renders the same complete markup; only framework syntax differs. */
export const frameworkSnippet = (framework: Framework, id: string, tag: string, html: string): string => {
  if (framework === "react" || framework === "solid" || framework === "preact") return jsxFrameworkSnippet(framework, id, tag, html);
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]).join("\n");
  const markup = formatFrameworkMarkup(framework === "vue" ? html.replace(/<style[^>]*>[\s\S]*?<\/style>/g, "") : html, framework);
  const registration = `import "@unofficialbox/box-open-elements";${id === "code-editor" ? '\nimport "@unofficialbox/box-open-elements/code-editor";' : ""}`;
  switch (framework) {
    case "html": return `<script type="module">\n${indentBlock(registration, 2)}\n</script>\n\n${markup}`;
    case "angular": return `import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";\n${registration}\n\n@Component({\n  selector: "app-example",\n  standalone: true,\n  schemas: [CUSTOM_ELEMENTS_SCHEMA],\n  template: \`\n${indentBlock(markup.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${"), 4)}\n  \`,\n})\nexport class Example {}`;
    case "vue": return `<script setup lang="ts">\n${registration}\n</script>\n\n<template>\n${indentBlock(markup, 2)}\n</template>${styles ? `\n\n<style scoped>\n${styles}\n</style>` : ""}`;
    case "svelte": return `<script lang="ts">\n${indentBlock(registration, 2)}\n</script>\n\n${markup}`;
  }
};
