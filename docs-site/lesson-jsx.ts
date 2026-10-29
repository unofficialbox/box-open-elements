import { indentBlock } from "./format-html.js";
import type { JSXFramework } from "./jsx-framework-snippets.js";

/** Keep the lesson's cumulative controller code inside a framework-owned mount. */
export const jsxLessonSnippet = (framework: JSXFramework, code: string): string => {
  const imports = code.match(/^import[\s\S]*?;(?=\n|$)/gm) ?? [];
  const body = code.replace(/^import[\s\S]*?;(?=\n|$)/gm, "").trim()
    .replace(/document\.getElementById\("app"\)/g, "host")
    .replace(/document\.getElementById\(/g, "byId(");
  const scoped = `const byId = id => host.querySelector("#" + CSS.escape(id));\n${body}`;
  const install = `${framework === "preact" ? "/** @jsxImportSource preact */\n" : ""}// Example.jsx — npm install @unofficialbox/box-open-elements ${framework === "solid" ? "solid-js" : "preact"}`;
  const note = "// This lesson keeps its imperative controller inside the framework lifecycle.\n// Each mounted instance owns its DOM; unmounting disconnects the custom elements.";
  if (framework === "solid") return `${install}
import { onMount, onCleanup } from "solid-js";
${imports.join("\n")}

${note}
export function Example() {
  let host;
  onMount(() => {
${indentBlock(scoped, 4)}
    onCleanup(() => host.replaceChildren());
  });
  return <div ref={element => { host = element; }} />;
}`;
  return `${install}
import { useLayoutEffect, useRef } from "preact/hooks";
${imports.join("\n")}

${note}
export function Example() {
  const container = useRef(null);
  useLayoutEffect(() => {
    const host = container.current;
${indentBlock(scoped, 4)}
    return () => host.replaceChildren();
  }, []);
  return <div ref={container} />;
}`;
};
