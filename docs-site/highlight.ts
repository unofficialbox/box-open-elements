/**
 * Tiny, dependency-free syntax highlighter for the docs site's code blocks.
 *
 * Emits `<span class="tok-*">` tokens that styles.css colours with VS Code's
 * default dark theme (Dark+) palette. Deliberately small: the code we render is
 * limited to the snippets in the Code tab, markdown fences in the foundation
 * docs, and build-along lesson steps — not arbitrary source. It is a lexer, not
 * a parser, so it favours predictable colouring over perfect grammar coverage.
 *
 * DOM-free so the build-time prerender can use it too.
 */

export type HighlightLang = "html" | "ts" | "css" | "bash" | "json" | "mixed" | "text";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (value: string): string => value.replace(/[&<>"]/g, char => ESCAPES[char]);

/** Ordered token rules — earlier alternatives win at the same position. */
type Rules = Array<[name: string, pattern: string]>;

const TS_RULES: Rules = [
  ["comment", String.raw`\/\/[^\n]*|\/\*[\s\S]*?\*\/`],
  ["str", String.raw`\`(?:\\[\s\S]|[^\\\`])*\`|"(?:\\[\s\S]|[^\\"\n])*"|'(?:\\[\s\S]|[^\\'\n])*'`],
  ["fn", String.raw`@[A-Za-z_$][\w$]*|\b[A-Za-z_$][\w$]*(?=\s*\()`],
  ["ctrl", String.raw`\b(?:import|export|from|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|await|yield)\b`],
  ["kw", String.raw`\b(?:const|let|var|function|class|interface|type|enum|extends|implements|new|async|public|private|protected|readonly|static|as|in|of|void|typeof|instanceof|this|super|default|null|undefined|true|false)\b`],
  ["num", String.raw`\b\d+(?:\.\d+)?\b`],
  ["type", String.raw`\b[A-Z][A-Za-z0-9_$]*\b`],
  ["var", String.raw`\b[A-Za-z_$][\w$]*\b`],
];

const HTML_RULES: Rules = [
  ["comment", String.raw`<!--[\s\S]*?-->`],
  ["tag", String.raw`<\/?[a-zA-Z][\w.-]*`],
  ["str", String.raw`"(?:[^"\n]*)"|'(?:[^'\n]*)'`],
  ["attr", String.raw`[a-zA-Z_:@#\[\(][\w.:@\-\[\]\(\)]*(?=\s*=)`],
];

const CSS_RULES: Rules = [
  ["comment", String.raw`\/\*[\s\S]*?\*\/`],
  ["str", String.raw`"(?:[^"\n]*)"|'(?:[^'\n]*)'`],
  ["ctrl", String.raw`@[\w-]+`],
  ["num", String.raw`#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms|deg|fr)?\b`],
  ["attr", String.raw`[-a-zA-Z]+(?=\s*:)`],
  ["type", String.raw`\.[-\w]+|#[-\w]+|&[-\w]*`],
];

const BASH_RULES: Rules = [
  ["comment", String.raw`#[^\n]*`],
  ["str", String.raw`"(?:\\[\s\S]|[^\\"])*"|'(?:[^']*)'`],
  ["var", String.raw`\$\{?[\w]+\}?`],
  ["fn", String.raw`(?:^|\n)\s*[a-zA-Z_][\w.-]*`],
];

const JSON_RULES: Rules = [
  ["attr", String.raw`"(?:\\[\s\S]|[^\\"])*"(?=\s*:)`],
  ["str", String.raw`"(?:\\[\s\S]|[^\\"])*"`],
  ["num", String.raw`-?\b\d+(?:\.\d+)?(?:[eE][-+]?\d+)?\b`],
  ["kw", String.raw`\b(?:true|false|null)\b`],
];

const RULES: Record<Exclude<HighlightLang, "mixed" | "text">, Rules> = {
  ts: TS_RULES,
  html: HTML_RULES,
  css: CSS_RULES,
  bash: BASH_RULES,
  json: JSON_RULES,
};

const compiled = new Map<string, RegExp>();
const regexFor = (lang: keyof typeof RULES): RegExp => {
  const cached = compiled.get(lang);
  if (cached) return cached;
  const re = new RegExp(RULES[lang].map(([name, src]) => `(?<${name}>${src})`).join("|"), "gs");
  compiled.set(lang, re);
  return re;
};

/** Tokenize with one language's rules, escaping everything in between. */
const run = (code: string, lang: keyof typeof RULES): string => {
  const re = regexFor(lang);
  re.lastIndex = 0;
  let out = "";
  let last = 0;
  for (let match = re.exec(code); match; match = re.exec(code)) {
    if (!match[0]) {
      re.lastIndex += 1;
      continue;
    }
    if (match.index > last) out += esc(code.slice(last, match.index));
    const groups = match.groups ?? {};
    const name = Object.keys(groups).find(key => groups[key] !== undefined) ?? "text";
    out += `<span class="tok-${name}">${esc(match[0])}</span>`;
    last = match.index + match[0].length;
  }
  return out + esc(code.slice(last));
};

/**
 * Single-file components (Vue/Svelte): markup outside, TS inside <script>,
 * CSS inside <style>. Highlight each region with its own grammar.
 */
const runMixed = (code: string): string => {
  const region = /<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let out = "";
  let last = 0;
  for (let match = region.exec(code); match; match = region.exec(code)) {
    out += run(code.slice(last, match.index), "html");
    const openEnd = match.index + match[0].indexOf(match[2]);
    out += run(code.slice(match.index, openEnd), "html");
    out += run(match[2], match[1] === "script" ? "ts" : "css");
    out += run(code.slice(openEnd + match[2].length, match.index + match[0].length), "html");
    last = match.index + match[0].length;
  }
  return out + run(code.slice(last), "html");
};

/** Map a fence info string or framework id onto a supported grammar. */
export const normalizeLang = (info: string): HighlightLang => {
  const id = info.trim().toLowerCase().split(/[\s{,]/)[0];
  switch (id) {
    case "html":
    case "markup":
    case "xml":
    case "svg":
      return "html";
    case "vue":
    case "svelte":
      return "mixed";
    case "ts":
    case "tsx":
    case "typescript":
    case "js":
    case "jsx":
    case "javascript":
    case "react":
    case "angular":
      return "ts";
    case "css":
    case "scss":
    case "less":
      return "css";
    case "bash":
    case "sh":
    case "shell":
    case "zsh":
    case "console":
      return "bash";
    case "json":
    case "jsonc":
      return "json";
    default:
      return "text";
  }
};

/** Highlight `code`, returning escaped HTML. Unknown languages are escaped only. */
export const highlightCode = (code: string, lang: HighlightLang): string => {
  if (lang === "text") return esc(code);
  if (lang === "mixed") return runMixed(code);
  return run(code, lang);
};
