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
export function extractCompiledDeclarations(
  css: string,
  selector: string,
  state: State,
  property: string,
): string[] {
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
        const matched = header
          .split(",")
          .some(part => partMatches(part, selector, state));
        if (matched) {
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
