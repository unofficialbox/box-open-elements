/**
 * Pure helpers for reading **compiled** CSS out of the box-ui-elements Storybook
 * webpack bundles and extracting a specific selector + interaction-state
 * declaration from it. No IO — the runnable `color-audit.ts` fetches the bundle
 * bytes and hands the text here.
 *
 * The Storybook is a webpack build using css-loader, which embeds each compiled
 * stylesheet as a JS string literal:
 *
 *     ___CSS_LOADER_EXPORT___.push([module.id,'<the whole compiled CSS>',""])
 *
 * `extractBundleCss` pulls those string literals back out; the rest of this
 * module reads a resolved declaration for a given `.btn` / `.btn-primary`
 * (+ `:hover` / `:active` / `:focus`) rule.
 */

const CSS_LOADER_MARKER = "___CSS_LOADER_EXPORT___.push([module.id,";

/** Decode a single JS string literal starting at `start` (the opening quote). */
function decodeStringLiteral(js: string, start: number): { value: string; end: number } {
  const quote = js[start];
  let out = "";
  let i = start + 1;
  while (i < js.length) {
    const ch = js[i];
    if (ch === "\\") {
      const n = js[i + 1];
      if (n === "n") out += "\n";
      else if (n === "t") out += "\t";
      else if (n === "r") out += "\r";
      else out += n ?? "";
      i += 2;
      continue;
    }
    if (ch === quote) {
      return { value: out, end: i + 1 };
    }
    out += ch;
    i += 1;
  }
  return { value: out, end: i };
}

/**
 * Extract and concatenate every css-loader stylesheet embedded in a webpack
 * bundle. Returns "" when the bundle carries no compiled CSS.
 */
export function extractBundleCss(js: string): string {
  const sheets: string[] = [];
  let idx = 0;
  while ((idx = js.indexOf(CSS_LOADER_MARKER, idx)) !== -1) {
    let i = idx + CSS_LOADER_MARKER.length;
    while (i < js.length && js[i] !== "'" && js[i] !== '"' && js[i] !== "`") {
      i += 1;
    }
    if (i >= js.length) {
      break;
    }
    const { value, end } = decodeStringLiteral(js, i);
    sheets.push(value);
    idx = end;
  }
  return sheets.join("\n");
}

/**
 * Recover the lazy-chunk filenames from the webpack runtime bundle. Component
 * CSS is code-split: only the button family ships in the always-loaded bundle,
 * while badge / menu / tooltip / … styles live in per-story chunks. The runtime
 * builds their URLs from a `{chunkId:"hash",…}[id]+".iframe.bundle.js"` map;
 * this reads that map back out and returns `id.hash.iframe.bundle.js` names.
 */
export function parseChunkNames(runtimeJs: string): string[] {
  const marker = ".iframe.bundle.js";
  const at = runtimeJs.indexOf(marker);
  if (at === -1) {
    return [];
  }
  const before = runtimeJs.slice(0, at);
  const close = before.lastIndexOf("}");
  if (close === -1) {
    return [];
  }
  // Walk backward to the matching `{` of the chunk map object literal.
  let depth = 0;
  let open = -1;
  for (let i = close; i >= 0; i -= 1) {
    const ch = before[i];
    if (ch === "}") {
      depth += 1;
    } else if (ch === "{") {
      depth -= 1;
      if (depth === 0) {
        open = i;
        break;
      }
    }
  }
  if (open === -1) {
    return [];
  }
  const map = before.slice(open, close + 1);
  const names: string[] = [];
  const pair = /(\d+):"([0-9a-f]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = pair.exec(map)) !== null) {
    names.push(`${m[1]}.${m[2]}.iframe.bundle.js`);
  }
  return names;
}

export type State = "base" | "hover" | "active" | "focus";

/**
 * Does one comma-separated selector part name `selector` in `state`?
 *
 * Accepts the subject plus same-element `:not(...)` guards and pseudo-state
 * suffixes (`.btn-primary:not(.is-disabled):hover`), but rejects descendant /
 * combinator rules and any *extra* attribute/class/id that would make it a
 * different variant or element (so `.btn` does not match `.btn-primary`, and
 * bare `button` does not match `button[data-tone="neutral"]`). `focus` matches
 * both `:focus` and `:focus-visible`.
 */
export function partMatches(part: string, selector: string, state: State): boolean {
  const trimmed = part.trim();
  if (!trimmed.startsWith(selector)) {
    return false;
  }
  const rest = trimmed.slice(selector.length);
  // Must end at a selector boundary so `.btn` != `.btn-primary`.
  if (rest !== "" && !/^[:[.#\s>+~]/.test(rest)) {
    return false;
  }
  // Drop same-element `:not(...)` guards; they do not change the subject.
  const bare = rest.replace(/:not\([^)]*\)/g, "");
  // Any descendant/combinator or extra attribute/class/id => different subject.
  if (/[\s>+~[.#]/.test(bare)) {
    return false;
  }
  const hasHover = /:hover\b/.test(bare);
  const hasActive = /:active\b/.test(bare);
  const hasFocus = /:focus(-visible)?\b/.test(bare);
  switch (state) {
    case "base":
      return !hasHover && !hasActive && !hasFocus;
    case "hover":
      return hasHover;
    case "active":
      return hasActive;
    case "focus":
      return hasFocus;
    default:
      return false;
  }
}

/**
 * Strip CSS block comments (quote-aware). CSS has no `//` line comments, so only
 * slash-star comments are removed — a `url(http://…)` is safe. Run before rule
 * scanning so a comment banner (e.g. the per-chunk name marker, or a css-loader
 * sourceMap note) preceding a rule cannot leak into that rule's selector.
 */
export function stripCssComments(css: string): string {
  let out = "";
  let quote: string | null = null;
  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i];
    const next = css[i + 1];
    if (quote) {
      out += ch;
      if (ch === quote) {
        quote = null;
      } else if (ch === "\\" && next !== undefined) {
        out += next;
        i += 1;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      out += ch;
      continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < css.length && !(css[i] === "*" && css[i + 1] === "/")) {
        i += 1;
      }
      i += 1; // land on the '/'
      continue;
    }
    out += ch;
  }
  return out;
}

/** Extract every value of `property` declared directly inside a rule body. */
function declarationsIn(body: string, property: string): string[] {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?:^|[;{])\\s*${escaped}\\s*:\\s*([^;{}]+)`, "g");
  const values: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    values.push(match[1].trim());
  }
  return values;
}

/**
 * Read the value of `property` from every rule in the compiled CSS whose
 * selector list names `selector` in `state`, in source order. Compiled CSS is
 * flat (no nesting), so a single brace scan is sufficient.
 */
function collectDeclarations(
  rawCss: string,
  headerMatches: (header: string) => boolean,
  property: string,
): string[] {
  const css = stripCssComments(rawCss);
  const values: string[] = [];
  let depth = 0;
  let header = "";
  let body = "";
  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i];
    if (ch === "{") {
      depth += 1;
      if (depth === 1) {
        body = "";
      }
      continue;
    }
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        if (headerMatches(header)) {
          values.push(...declarationsIn(body, property));
        }
        header = "";
      }
      continue;
    }
    if (depth === 0) {
      header += ch;
    } else if (depth === 1) {
      body += ch;
    }
  }
  return values;
}

export function extractCompiledDeclarations(
  rawCss: string,
  selector: string,
  state: State,
  property: string,
): string[] {
  return collectDeclarations(
    rawCss,
    header => header.split(",").some(part => partMatches(part, selector, state)),
    property,
  );
}

/**
 * Read `property` from rules whose selector list contains `rawSelector` as an
 * exact comma-separated part. Unlike `extractCompiledDeclarations`, this matches
 * the whole compound selector verbatim — for upstream rules that `partMatches`
 * intentionally rejects (child combinators, pseudo-elements), e.g. the custom
 * checkbox/radio marks `.checkbox-label>input[type=checkbox]+span::after`.
 */
export function extractRawDeclarations(
  rawCss: string,
  rawSelector: string,
  property: string,
): string[] {
  return collectDeclarations(
    rawCss,
    header => header.split(",").some(part => part.trim() === rawSelector),
    property,
  );
}
