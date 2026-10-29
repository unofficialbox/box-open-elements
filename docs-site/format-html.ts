import workshop from "../storybook/generated/workshop.json" with { type: "json" };

/**
 * Pretty-printer for the HTML shown in the docs site's Code tab.
 *
 * Catalog examples are authored as compact one-liners, which is fine as input
 * but reads badly once an element carries several attributes (the chart panel's
 * tag is ~490 characters, all on one line). This lays each attribute on its own
 * line when the tag is too long for one, and indents nested elements.
 *
 * Operates on the docs' own trusted example markup, not arbitrary HTML: it
 * understands elements, attributes (single- or double-quoted, including JSON
 * payloads) and text, which is all the examples contain. Attribute *values* are
 * never reformatted, so the snippet stays copy-pasteable and byte-identical in
 * meaning to what the preview renders.
 *
 * DOM-free so the build-time prerender can use it too.
 */

/** Elements that never have a closing tag. */
const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "source", "track", "wbr",
]);

/** Width past which an opening tag is broken onto multiple lines. */
const MAX_LINE = 76;

interface Attr {
  name: string;
  value: string | null;
  quote: string;
  expression?: string;
}

interface ElementNode {
  type: "element";
  name: string;
  attrs: Attr[];
  children: Node[];
  selfClosing: boolean;
}

interface TextNode {
  type: "text";
  value: string;
}

type Node = ElementNode | TextNode;

const ATTR_RE = /([^\s=/>]+)(?:\s*=\s*("[^"]*"|'[^']*'|[^\s/>]+))?/g;

const parseAttrs = (source: string): Attr[] => {
  const attrs: Attr[] = [];
  ATTR_RE.lastIndex = 0;
  for (let m = ATTR_RE.exec(source); m; m = ATTR_RE.exec(source)) {
    const raw = m[2];
    if (raw === undefined) {
      attrs.push({ name: m[1], value: null, quote: '"' });
      continue;
    }
    const quoted = raw[0] === '"' || raw[0] === "'";
    attrs.push({
      name: m[1],
      value: quoted ? raw.slice(1, -1) : raw,
      // Keep the author's quoting: JSON payloads rely on single quotes so their
      // inner double quotes stay valid.
      quote: quoted ? raw[0] : '"',
    });
  }
  return attrs;
};

/** Parse trusted example markup into a shallow element tree. */
const parse = (html: string): Node[] => {
  const root: ElementNode = { type: "element", name: "#root", attrs: [], children: [], selfClosing: false };
  const stack: ElementNode[] = [root];
  const tagRe = /<(\/)?([a-zA-Z][\w-]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/)?>/g;
  let last = 0;

  const pushText = (raw: string): void => {
    const text = raw.trim();
    if (text) stack[stack.length - 1].children.push({ type: "text", value: text });
  };

  for (let m = tagRe.exec(html); m; m = tagRe.exec(html)) {
    if (m.index > last) pushText(html.slice(last, m.index));
    last = m.index + m[0].length;
    const [, closing, name, attrSource, selfClose] = m;
    if (closing) {
      // Unwind to the matching open tag; ignore strays rather than throwing.
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].name === name) {
          stack.length = i;
          break;
        }
      }
      continue;
    }
    const node: ElementNode = {
      type: "element",
      name,
      attrs: parseAttrs(attrSource ?? ""),
      children: [],
      selfClosing: Boolean(selfClose) || VOID_ELEMENTS.has(name),
    };
    stack[stack.length - 1].children.push(node);
    if (!node.selfClosing) stack.push(node);
  }
  if (last < html.length) pushText(html.slice(last));
  return root.children;
};

const renderAttr = (attr: Attr): string =>
  attr.expression !== undefined ? `${attr.name}={${attr.expression}}` :
    attr.value === null ? attr.name : `${attr.name}=${attr.quote}${attr.value}${attr.quote}`;

const render = (node: Node, depth: number, jsx: boolean): string => {
  const pad = "  ".repeat(depth);
  if (node.type === "text") return pad + node.value;

  const attrs = node.attrs.map(renderAttr);
  const open = attrs.length ? `<${node.name} ${attrs.join(" ")}` : `<${node.name}`;
  const slash = jsx || !VOID_ELEMENTS.has(node.name);
  const close = node.selfClosing ? (slash ? " />" : ">") : ">";
  const inlineChildren = node.children.every(child => child.type === "text");
  const inlineText = node.children.map(child => (child as TextNode).value).join(" ");
  const singleLine =
    `${pad}${open}${close}${inlineChildren ? inlineText : ""}` +
    (node.selfClosing ? "" : `</${node.name}>`);

  if (inlineChildren && singleLine.length <= MAX_LINE) return singleLine;

  // Too long for one line: one attribute per line, closing bracket on its own.
  const head =
    attrs.length && `${pad}${open}${close}`.length > MAX_LINE
      ? [`${pad}<${node.name}`, ...attrs.map(a => `${pad}  ${a}`), `${pad}${node.selfClosing && slash ? "/>" : ">"}`].join("\n")
      : `${pad}${open}${close}`;

  if (node.selfClosing) return head;
  const body = node.children.map(child => render(child, depth + 1, jsx)).join("\n");
  return body ? `${head}\n${body}\n${pad}</${node.name}>` : `${head}</${node.name}>`;
};

/**
 * Pretty-print example markup.
 *
 * @param jsx when true, self-closing tags render as `<tag />` (JSX/React) rather
 *            than `<tag>` (HTML).
 */
export const formatHtml = (html: string, jsx = false): string =>
  parse(html)
    .map(node => render(node, 0, jsx))
    .join("\n");

/** Preserve the same complete example through native framework syntax. */
export const formatFrameworkMarkup = (html: string, framework: string): string => {
  const jsx = ["react", "solid", "preact"].includes(framework);
  const nodes = parse(html.replace(/<!--[\s\S]*?-->/g, ""));
  const visit = (node: Node, parent?: string): void => {
    if (node.type === "text") {
      if (parent === "style" || parent === "script") {
        if (jsx) node.value = `{${JSON.stringify(node.value)}}`;
        return;
      }
      if (framework !== "html") node.value = node.value.replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
      if (jsx) node.value = node.value.replace(/>/g, "&gt;");
      if (framework === "angular") node.value = node.value.replace(/@/g, "&#64;");
      return;
    }
    if (node.name === "box-number-input") node.attrs.sort((a, b) => Number(b.name === "allow-empty") - Number(a.name === "allow-empty"));
    for (const attr of node.attrs) {
      const type = workshop.stories.find(story => story.tag === node.name)?.referenceRows.find(row => row.name === attr.name && ["attribute", "property"].includes(row.kind))?.type;
      // These native attributes are comma-separated; their property setters take arrays.
      const csv = ["box-content-picker", "box-content-uploader"].includes(node.name) && ["extensions", "selectable-types"].includes(attr.name);
      if (framework !== "html" && csv && attr.value !== null) attr.value = JSON.stringify(attr.value.split(",").map(value => value.trim()).filter(Boolean));
      const numeric = type !== undefined && /^number(?:\s*\|\s*(?:null|undefined))*$/.test(type);
      const falseToken = node.name === "box-compare-view" && attr.name === "sync" ? "off" : (node.name === "box-sidebar-toggle-button" && attr.name === "expanded") || (node.name === "box-content-uploader" && ["auto-start", "closable"].includes(attr.name)) ? "false" : undefined;
      if (framework !== "html" && node.name.includes("-") && !/^(data-|aria-)/.test(attr.name) && attr.value !== null && (falseToken !== undefined || ((csv || type !== "string") && /^[\[{]/.test(attr.value.trim())) || (numeric && attr.value.trim() !== "" && Number.isFinite(Number(attr.value))))) {
        try {
          const decoded = attr.value.replace(/&(?:amp|quot|apos|lt|gt|#39|#34);/g, entity => ({ "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">", "&#39;": "'", "&#34;": '"' })[entity]!);
          const expression = JSON.stringify(falseToken !== undefined ? decoded !== falseToken : numeric ? Number(decoded) : JSON.parse(decoded));
          attr.name = attr.name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
          if (framework === "vue" || framework === "angular") {
            attr.name = framework === "vue" ? `:${attr.name}` : `[${attr.name}]`;
            attr.value = expression.replace(/'/g, "&#39;");
            attr.quote = "'";
          } else {
            if (framework === "solid") attr.name = `prop:${attr.name}`;
            attr.expression = expression;
          }
        } catch { /* A literal string beginning with a bracket stays a string. */ }
      }
      if (framework === "svelte" && attr.value !== null && /[\n\r]|&#(?:10|13);/.test(attr.value) && attr.expression === undefined) attr.expression = JSON.stringify(attr.value.replace(/&#10;/g, "\n").replace(/&#13;/g, "\r"));
      if (framework === "svelte" && attr.value !== null) attr.value = attr.value.replace(/\{/g, "&#123;").replace(/\}/g, "&#125;").replace(/\n/g, "&#10;").replace(/\r/g, "&#13;");
      if (jsx && framework !== "solid") {
        const names: Record<string, string> = { class: "className", for: "htmlFor", tabindex: "tabIndex", readonly: "readOnly", autofocus: "autoFocus", contenteditable: "contentEditable", spellcheck: "spellCheck", "xlink:href": "xlinkHref" };
        attr.name = names[attr.name] ?? attr.name;
        if (!node.name.includes("-") && !/^(aria-|data-)/.test(attr.name)) attr.name = attr.name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
      }
      if (jsx && attr.name === "style" && attr.value !== null) {
        const declarations = Object.fromEntries(attr.value.split(";").filter(value => value.trim()).map(value => {
          const colon = value.indexOf(":");
          let name = value.slice(0, colon).trim();
          if (framework !== "solid" && !name.startsWith("--")) name = name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
          return [name, value.slice(colon + 1).trim()];
        }));
        attr.expression = JSON.stringify(declarations);
      }
      if (jsx && !node.name.includes("-") && /^(tabindex|rowspan|colspan|maxlength|minlength|rows|cols|size|start)$/i.test(attr.name) && attr.value !== null && Number.isFinite(Number(attr.value))) attr.expression = String(Number(attr.value));
    }
    node.children.forEach(child => visit(child, node.name));
  };
  nodes.forEach(node => visit(node));
  const markup = nodes.map(node => render(node, 0, jsx)).join("\n");
  return jsx && nodes.length > 1 ? `<>\n${indentBlock(markup, 2)}\n</>` : markup;
};

/** Indent an already-formatted block, leaving blank lines empty. */
export const indentBlock = (code: string, spaces: number): string => {
  const pad = " ".repeat(spaces);
  return code
    .split("\n")
    .map(line => (line.trim() ? pad + line : line))
    .join("\n");
};
