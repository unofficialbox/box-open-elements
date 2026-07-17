/**
 * Pure signal extraction + comparison for the box-ui-elements (BUE) conformance
 * audit. No network or filesystem access lives here so the logic stays unit
 * testable; the runnable side (fetch + report) is in `audit.ts`.
 *
 * The audit compares a resolved box-open-elements geometry value (see
 * `src/foundations/geometry`) against the concrete value declared in the real
 * upstream SCSS at `github.com/box/box-ui-elements`. Only length-valued claims
 * are auto-verified — colours/shadows in the upstream source are produced by
 * Sass functions (`fade-out($black, …)`) that cannot be resolved statically, so
 * those are surfaced for human review with both raw values shown.
 */

export interface Length {
  px: number;
  raw: string;
}

/**
 * Strip `//` line comments and `/* … *​/` block comments from SCSS while
 * preserving comment-like text inside single/double-quoted strings. Runs before
 * any variable/declaration extraction so commented-out code can never be read as
 * active (a commented `$x: 9px;` must not override the real value, and a
 * commented property must not shift declaration indexes).
 */
export function stripScssComments(input: string): string {
  let out = "";
  let quote: string | null = null;
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    const next = input[i + 1];
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
    if (ch === "/" && next === "/") {
      while (i < input.length && input[i] !== "\n") {
        i += 1;
      }
      if (i < input.length) {
        out += "\n";
      }
      continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < input.length && !(input[i] === "*" && input[i + 1] === "/")) {
        i += 1;
      }
      i += 1; // land on the '/'
      continue;
    }
    out += ch;
  }
  return out;
}

/** Parse a single CSS/SCSS length token (`px` or `rem`) into pixels. */
export function parseLength(value: string): Length | null {
  const trimmed = value.trim();
  const match = /^(-?\d*\.?\d+)(px|rem)$/.exec(trimmed);
  if (!match) {
    return null;
  }
  const magnitude = Number.parseFloat(match[1]);
  if (!Number.isFinite(magnitude)) {
    return null;
  }
  const px = match[2] === "rem" ? magnitude * 16 : magnitude;
  return { px, raw: trimmed };
}

/**
 * Parse SCSS `$name: value;` declarations into a map. A trailing `!default`
 * flag is stripped. Later declarations win (matching Sass override order).
 */
export function parseScssVariables(scss: string): Map<string, string> {
  const vars = new Map<string, string>();
  const pattern = /\$([\w-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(stripScssComments(scss))) !== null) {
    const name = match[1];
    const value = match[2].replace(/\s*!default\s*$/, "").trim();
    vars.set(name, value);
  }
  return vars;
}

/**
 * Resolve an SCSS value that may reference other variables and use simple
 * `*` / `/` arithmetic (e.g. `$bdl-border-radius-size * 1.5`). Substitution is
 * iterated so chained references (`$a: $b`, `$b: 4px`) resolve. Returns the
 * value unchanged when it cannot be fully reduced.
 */
export function resolveScssValue(
  value: string,
  vars: Map<string, string>,
  maxDepth = 8,
): string {
  let current = value.trim();
  for (let depth = 0; depth < maxDepth; depth += 1) {
    const substituted = current.replace(/\$([\w-]+)/g, (whole, name: string) =>
      vars.has(name) ? (vars.get(name) as string) : whole,
    );
    const evaluated = evaluateLengthArithmetic(substituted);
    if (evaluated === current) {
      return evaluated;
    }
    current = evaluated;
  }
  return current;
}

/**
 * Evaluate a single binary `length * number`, `number * length`, or
 * `length / number` expression to a concrete length. Anything else is returned
 * unchanged so non-arithmetic values pass through untouched.
 */
function evaluateLengthArithmetic(value: string): string {
  const mul = /^(-?\d*\.?\d+)(px|rem)?\s*\*\s*(-?\d*\.?\d+)(px|rem)?$/.exec(
    value.trim(),
  );
  if (mul) {
    const leftUnit = mul[2];
    const rightUnit = mul[4];
    // Reject length × length (e.g. `2px * 3rem`): the product is not a concrete
    // CSS length. Require at most one operand to carry a unit.
    if (Boolean(leftUnit) && Boolean(rightUnit)) {
      return value;
    }
    const left = Number.parseFloat(mul[1]);
    const right = Number.parseFloat(mul[3]);
    const unit = leftUnit ?? rightUnit ?? "";
    if (Number.isFinite(left) && Number.isFinite(right)) {
      return `${trimNumber(left * right)}${unit}`;
    }
  }
  const div = /^(-?\d*\.?\d+)(px|rem)\s*\/\s*(-?\d*\.?\d+)$/.exec(value.trim());
  if (div) {
    const left = Number.parseFloat(div[1]);
    const right = Number.parseFloat(div[3]);
    if (Number.isFinite(left) && Number.isFinite(right) && right !== 0) {
      return `${trimNumber(left / right)}${div[2]}`;
    }
  }
  return value;
}

function trimNumber(value: number): string {
  return Number.parseFloat(value.toFixed(4)).toString();
}

/**
 * Extract every declared value for a CSS property from a stylesheet. Matching
 * is property-boundary aware so `border-radius` does not match
 * `border-radius-foo` and `padding` does not match `padding-left`.
 */
export function extractDeclarations(css: string, property: string): string[] {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(?:^|[;{}])\\s*${escaped}\\s*:\\s*([^;{}]+)`,
    "g",
  );
  const values: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(stripScssComments(css))) !== null) {
    values.push(match[1].trim());
  }
  return values;
}

/**
 * Remove every brace-balanced nested block, keeping only depth-0 text. Quote
 * aware so a brace inside a string value (e.g. `content: "{"`) is not treated as
 * a structural delimiter.
 */
function stripNestedBlocks(body: string): string {
  let out = "";
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (quote) {
      if (depth === 0) {
        out += ch;
      }
      if (ch === quote) {
        quote = null;
      } else if (ch === "\\" && i + 1 < body.length) {
        if (depth === 0) {
          out += body[i + 1];
        }
        i += 1;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      if (depth === 0) {
        out += ch;
      }
      continue;
    }
    if (ch === "{") {
      depth += 1;
      continue;
    }
    if (ch === "}") {
      depth = Math.max(0, depth - 1);
      continue;
    }
    if (depth === 0) {
      out += ch;
    }
  }
  return out;
}

/**
 * Does a rule header (possibly a comma list) name `selector` as its subject?
 * Accepts same-subject compound/state suffixes (`.menu-item:hover`,
 * `.menu-item.active`, `.menu-item[aria-current]`) but rejects descendant or
 * combinator rules (`.menu-item .icon`, `.menu-item > x`) and longer names
 * (`.modal-dialog-container`), whose declarations style a different element.
 */
function headerMatchesSelector(header: string, selector: string): boolean {
  return header.split(",").some(part => {
    const trimmed = part.trim();
    if (trimmed === selector) {
      return true;
    }
    return (
      trimmed.startsWith(selector) &&
      /^[.:[#]/.test(trimmed.slice(selector.length))
    );
  });
}

/**
 * Extract a property only from rules whose header names `selector`, ignoring
 * unrelated declarations elsewhere in the file. Nested blocks inside a matched
 * rule are removed so only that rule's own declarations are read. Values are
 * returned in source order across every matching rule, so a stray empty
 * same-named block (e.g. an animation-only `.modal-dialog`) does not shift the
 * result.
 */
export function extractScopedDeclarations(
  css: string,
  selector: string,
  property: string,
): string[] {
  const clean = stripScssComments(css);
  const stack: { header: string; start: number }[] = [];
  const matched: { start: number; body: string }[] = [];
  let lastBoundary = 0;
  let quote: string | null = null;
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else if (ch === "\\") {
        i += 1;
      }
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === "{") {
      stack.push({ header: clean.slice(lastBoundary, i).trim(), start: i + 1 });
      lastBoundary = i + 1;
    } else if (ch === "}") {
      const rule = stack.pop();
      if (rule && headerMatchesSelector(rule.header, selector)) {
        matched.push({ start: rule.start, body: clean.slice(rule.start, i) });
      }
      lastBoundary = i + 1;
    } else if (ch === ";") {
      lastBoundary = i + 1;
    }
  }
  // Rules close innermost-first; re-sort by opening position for source order.
  return matched
    .sort((a, b) => a.start - b.start)
    .flatMap(rule => extractDeclarations(stripNestedBlocks(rule.body), property));
}

export type Verdict =
  | "conformant"
  | "drift"
  | "missing-upstream"
  | "review";

export interface ComparisonInput {
  boeValue: string;
  upstreamValue: string | null;
  /** Allowed absolute pixel difference for a length claim. */
  tolerancePx?: number;
}

export interface Comparison {
  verdict: Verdict;
  boePx: number | null;
  upstreamPx: number | null;
  deltaPx: number | null;
  note?: string;
}

/**
 * Compare a box-open-elements value against the upstream value.
 *
 * - Both parse as lengths → auto verdict (`conformant` within tolerance,
 *   otherwise `drift`).
 * - Upstream missing → `missing-upstream`.
 * - Either side is a non-length (colour, shadow, Sass function) → `review`,
 *   because it cannot be resolved statically.
 */
export function compareValue({
  boeValue,
  upstreamValue,
  tolerancePx = 0,
}: ComparisonInput): Comparison {
  if (upstreamValue === null || upstreamValue.trim() === "") {
    return {
      verdict: "missing-upstream",
      boePx: parseLength(boeValue)?.px ?? null,
      upstreamPx: null,
      deltaPx: null,
      note: "Upstream value could not be located; check the manifest path/selector.",
    };
  }

  const boeLength = parseLength(boeValue);
  const upstreamLength = parseLength(upstreamValue);

  if (boeLength && upstreamLength) {
    const deltaPx = Math.abs(boeLength.px - upstreamLength.px);
    return {
      verdict: deltaPx <= tolerancePx ? "conformant" : "drift",
      boePx: boeLength.px,
      upstreamPx: upstreamLength.px,
      deltaPx,
    };
  }

  if (normalizeToken(boeValue) === normalizeToken(upstreamValue)) {
    return {
      verdict: "conformant",
      boePx: boeLength?.px ?? null,
      upstreamPx: upstreamLength?.px ?? null,
      deltaPx: null,
      note: "Exact non-length match.",
    };
  }

  return {
    verdict: "review",
    boePx: boeLength?.px ?? null,
    upstreamPx: upstreamLength?.px ?? null,
    deltaPx: null,
    note: "Non-length value (colour/shadow/Sass function) — verify by eye.",
  };
}

/** Collapse whitespace and lowercase for tolerant string comparison. */
export function normalizeToken(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
