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
  attr.value === null ? attr.name : `${attr.name}=${attr.quote}${attr.value}${attr.quote}`;

const render = (node: Node, depth: number, jsx: boolean): string => {
  const pad = "  ".repeat(depth);
  if (node.type === "text") return pad + node.value;

  const attrs = node.attrs.map(renderAttr);
  const open = attrs.length ? `<${node.name} ${attrs.join(" ")}` : `<${node.name}`;
  const close = node.selfClosing ? (jsx ? " />" : ">") : ">";
  const inlineChildren = node.children.every(child => child.type === "text");
  const inlineText = node.children.map(child => (child as TextNode).value).join(" ");
  const singleLine =
    `${pad}${open}${close}${inlineChildren ? inlineText : ""}` +
    (node.selfClosing ? "" : `</${node.name}>`);

  if (inlineChildren && singleLine.length <= MAX_LINE) return singleLine;

  // Too long for one line: one attribute per line, closing bracket on its own.
  const head =
    attrs.length && `${pad}${open}${close}`.length > MAX_LINE
      ? [`${pad}<${node.name}`, ...attrs.map(a => `${pad}  ${a}`), `${pad}${node.selfClosing && jsx ? "/>" : ">"}`].join("\n")
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

/** Indent an already-formatted block, leaving blank lines empty. */
export const indentBlock = (code: string, spaces: number): string => {
  const pad = " ".repeat(spaces);
  return code
    .split("\n")
    .map(line => (line.trim() ? pad + line : line))
    .join("\n");
};
