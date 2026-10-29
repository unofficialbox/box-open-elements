import { formatFrameworkMarkup, indentBlock } from "./format-html.js";

export type JSXFramework = "react" | "solid" | "preact";

/** Native JSX usage; adapter construction belongs in the integration guide. */
export const jsxFrameworkSnippet = (framework: JSXFramework, id: string, _tag: string, html: string): string => {
  const markup = formatFrameworkMarkup(html, framework);
  const registration = `import "@unofficialbox/box-open-elements";${id === "code-editor" ? '\nimport "@unofficialbox/box-open-elements/code-editor";' : ""}`;
  return `${registration}\n\nexport function Example() {\n  return (\n${indentBlock(markup, 4)}\n  );\n}`;
};
