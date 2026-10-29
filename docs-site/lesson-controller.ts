import { indentBlock } from "./format-html.js";
import type { Framework } from "./framework-snippets.js";

/** One controller/data/event implementation for every framework and teaching step. */
export const lessonController = (code: string): string => {
  const imports = code.match(/^import[\s\S]*?;(?=\n|$)/gm) ?? [];
  const body = code.replace(/^import[\s\S]*?;(?=\n|$)/gm, "").trim()
    .replace(/document\.getElementById\("app"\)/g, "host")
    .replace(/document\.getElementById\(/g, "byId(");
  return `${imports.join("\n")}\n\nexport function mountExample(host) {\n  const byId = id => host.querySelector("#" + CSS.escape(id));\n${indentBlock(body, 2)}\n  return () => host.replaceChildren();\n}`;
};

/** Framework files differ only in their native mount/unmount contract. */
export const lessonEntry = (framework: Framework): string => {
  const controller = 'import { mountExample } from "./controller.js";';
  switch (framework) {
    case "html": return `<div id="app"></div>\n<script type="module">\n  ${controller}\n  const cleanup = mountExample(document.getElementById("app"));\n  // Call cleanup() when your host removes this view.\n</script>`;
    case "react":
    case "preact": return `import { useLayoutEffect, useRef } from "${framework === "react" ? "react" : "preact/hooks"}";\n${controller}\n\nexport function Example() {\n  const host = useRef<HTMLDivElement>(null);\n  useLayoutEffect(() => mountExample(host.current!), []);\n  return <div ref={host} />;\n}`;
    case "solid": return `import { onMount, onCleanup } from "solid-js";\n${controller}\n\nexport function Example() {\n  let host!: HTMLDivElement;\n  onMount(() => onCleanup(mountExample(host)));\n  return <div ref={host} />;\n}`;
    case "vue": return `<script setup lang="ts">\nimport { ref, onMounted, onBeforeUnmount } from "vue";\n${controller}\nconst host = ref<HTMLDivElement>();\nlet cleanup: (() => void) | undefined;\nonMounted(() => { cleanup = mountExample(host.value!); });\nonBeforeUnmount(() => cleanup?.());\n</script>\n\n<template><div ref="host"></div></template>`;
    case "svelte": return `<script lang="ts">\n  import { onMount } from "svelte";\n  ${controller}\n  let host: HTMLDivElement;\n  onMount(() => mountExample(host));\n</script>\n\n<div bind:this={host}></div>`;
    case "angular": return `import { Component, ElementRef, viewChild } from "@angular/core";\n${controller}\n\n@Component({\n  selector: "app-example",\n  standalone: true,\n  template: '<div #host></div>',\n})\nexport class Example {\n  readonly host = viewChild.required<ElementRef<HTMLDivElement>>("host");\n  private cleanup?: () => void;\n  ngAfterViewInit() { this.cleanup = mountExample(this.host().nativeElement); }\n  ngOnDestroy() { this.cleanup?.(); }\n}`;
  }
};
