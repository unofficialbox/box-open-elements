import { formatHtml, indentBlock } from "./format-html.js";

export type JSXFramework = "solid" | "preact";

const stateTools = (framework: JSXFramework): { imports: string; state: (name: string, type: string, initial: string) => string; read: (name: string) => string } => ({
  imports: framework === "solid" ? 'import { createSignal } from "solid-js";' : 'import { useState } from "preact/hooks";',
  state: (name, type, initial) => `const [${name}, set${name[0].toUpperCase() + name.slice(1)}] = ${framework === "solid" ? "createSignal" : "useState"}<${type}>(${initial});`,
  read: name => framework === "solid" ? `${name}()` : name,
});

const rootAttributes = (html: string, tag: string, omit: string[] = []): string => {
  const open = new RegExp(`<${tag}(?:[^>"']|"[^"]*"|'[^']*')*>`).exec(html)?.[0] ?? `<${tag}>`;
  return [...open.slice(tag.length + 1, -1).matchAll(/([^\s=]+)(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s]+))?/g)]
    .filter(match => !omit.includes(match[1])).map(match => match[0]).join(" ");
};

/** Uses the public factory for components without a named framework wrapper. */
export const jsxFrameworkSnippet = (framework: JSXFramework, id: string, tag: string, html: string): string => {
  const adapter = `@unofficialbox/box-open-elements-${framework}`;
  const install = `${framework === "preact" ? "/** @jsxImportSource preact */\n" : ""}// npm install @unofficialbox/box-open-elements ${adapter} ${framework === "solid" ? "solid-js" : "preact"}`;
  const tools = stateTools(framework);
  if (id === "number-input" && /\ballow-empty\b/.test(html)) {
    return `${install}
${tools.imports}
import { createWebComponent, type WebComponentProps } from "${adapter}";
import { NumberInput as NumberInputElement } from "@unofficialbox/box-open-elements/number-input";

type Props = WebComponentProps & {
  value: number | null;
  "allow-empty": boolean;
  [attribute: string]: unknown;
  onValueChanged?: (event: CustomEvent<{ value: number | null }>) => void;
};
const NumberInput = createWebComponent<NumberInputElement, Props>({
  tagName: "box-number-input",
  propertyNames: ["value"],
  events: [{ propName: "onValueChanged", eventName: "value-changed" }],
  sync: (element, props) => { element.allowEmpty = true; element.value = props.value; },
});

export function Example() {
  ${tools.state("value", "number | null", "null")}
  // Seed the empty mode as a host attribute before connection/form reset capture.
  return <NumberInput allow-empty={true} ${rootAttributes(html, tag, ["value", "allow-empty"])}
    value={${tools.read("value")}} onValueChanged={event => setValue(event.detail.value)} />;
}`;
  }
  if (id === "folder-tree" || id === "folder-tree-diff") {
    const diff = id === "folder-tree-diff";
    const name = diff ? "FolderTreeDiff" : "FolderTree";
    const node = diff ? "FolderTreeDiffNode" : "FolderTreeNode";
    return `${install}
${tools.imports}
import { createWebComponent, type WebComponentProps } from "${adapter}";
import { ${name} as TreeElement } from "@unofficialbox/box-open-elements/${id}";
import type { ${node}, FolderTreeExpandedDetail, FolderTreeSelectedDetail } from "@unofficialbox/box-open-elements/patterns/folder-tree";

type Props = WebComponentProps & Pick<TreeElement, "nodes" | "expandedIds" | "selectedIds"${diff ? ' | "mode"' : ""}> & {
  [attribute: string]: unknown;
  onExpandedChanged?: (event: CustomEvent<FolderTreeExpandedDetail>) => void;
  onSelectedChanged?: (event: CustomEvent<FolderTreeSelectedDetail>) => void;
};
const Tree = createWebComponent<TreeElement, Props>({
  tagName: "${tag}",
  propertyNames: ["nodes", "expandedIds", "selectedIds"${diff ? ', "mode"' : ""}],
  events: [
    { propName: "onExpandedChanged", eventName: "expanded-changed" },
    { propName: "onSelectedChanged", eventName: "selected-changed" },
  ],
  sync: (element, props) => {
    element.nodes = props.nodes;
    element.expandedIds = props.expandedIds;
    element.selectedIds = props.selectedIds;${diff ? "\n    element.mode = props.mode;" : ""}
  },
});
const nodes: ${node}[] = ${/\b(?:loading|unavailable)(?:\s|>)/.test(html) ? "[];\n/* Example data when available:\n[" : "["}
  { id: "root", name: "Projects", type: "folder"${diff ? ', path: "/Projects", status: "equal", hasChangedDescendants: true' : ""} },
  { id: "plan", parentId: "root", name: "Plan.pdf", type: "file"${diff ? ', path: "/Projects/Plan.pdf", status: "changed"' : ""} },
${/\b(?:loading|unavailable)(?:\s|>)/.test(html) ? "]\n*/" : "];"}

export function Example() {
  ${tools.state("expanded", "string[]", /\b(?:loading|unavailable)(?:\s|>)/.test(html) ? "[]" : '["root"]')}
  ${tools.state("selected", "string[]", "[]")}
  // The host supplies nodes/changes; fetching, matching and mutations stay outside the view.
  return <Tree ${rootAttributes(html, tag, ["mode"])}${diff ? ` mode="${html.includes('mode="side-by-side"') ? 'side-by-side' : 'unified'}"` : ""}
    nodes={nodes} expandedIds={${tools.read("expanded")}} selectedIds={${tools.read("selected")}}
    onExpandedChanged={event => setExpanded(event.detail.expandedIds)}
    onSelectedChanged={event => setSelected(event.detail.selectedIds)} />;
}`;
  }
  const open = `<${tag} ${rootAttributes(html, tag)}>`;
  const markup = formatHtml(open.replace(new RegExp(`^<${tag}`), "<BoxElement").replace(/\s*>$/, " />"), true);
  return `${install}
import { createWebComponent, type WebComponentProps } from "${adapter}";
import "@unofficialbox/box-open-elements${id === "code-editor" ? "/code-editor" : ""}";

// The factory passes these static host attributes through to the custom element.
// For rich data, declare typed props, list propertyNames and assign them in sync.
const BoxElement = createWebComponent<HTMLElement, WebComponentProps & Record<string, unknown>>({
  tagName: "${tag}",
  sync: () => {},
});

export function Example() {
  return (
${indentBlock(markup, 4)}
  );
}`;
};
