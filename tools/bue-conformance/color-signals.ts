/**
 * Pure signal extraction + comparison for the box-ui-elements (BUE) conformance
 * audit, **Layer 2** (resolved colour / shadow / interaction state). No network
 * or filesystem access lives here so the logic stays unit testable; the runnable
 * side (fetch + report) is in `color-audit.ts`.
 *
 * Layer 1 (`signals.ts`) resolves *geometry* from source SCSS. It deliberately
 * routes colour/shadow to "review" because upstream produces them with Sass
 * functions that cannot be evaluated statically. Layer 2 closes that gap without
 * a browser: it reads the **compiled** Storybook CSS (post-Sass, resolved) and
 * compares the concrete colour/shadow values box-open-elements ships against the
 * concrete values box-ui-elements renders — including hover/active/focus states.
 */

/** Normalised colour: integer channels 0-255 plus alpha 0-1. */
export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const NAMED_COLORS: Record<string, Rgba> = {
  transparent: { r: 0, g: 0, b: 0, a: 0 },
  white: { r: 255, g: 255, b: 255, a: 1 },
  black: { r: 0, g: 0, b: 0, a: 1 },
};

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function parseAlpha(token: string): number {
  const trimmed = token.trim();
  if (trimmed.endsWith("%")) {
    return Math.max(0, Math.min(1, Number.parseFloat(trimmed) / 100));
  }
  const n = Number.parseFloat(trimmed);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 1;
}

function parseChannel(token: string): number {
  const trimmed = token.trim();
  if (trimmed.endsWith("%")) {
    return clampChannel((Number.parseFloat(trimmed) / 100) * 255);
  }
  return clampChannel(Number.parseFloat(trimmed));
}

/**
 * Parse a single CSS colour token into normalised RGBA. Understands hex
 * (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`), legacy `rgb()/rgba()` with commas,
 * modern space-separated `rgb(r g b / a)`, and the named colours the audit
 * needs (`white`, `black`, `transparent`). Returns `null` for anything else.
 */
export function parseColor(input: string): Rgba | null {
  const value = input.trim().toLowerCase();
  if (value in NAMED_COLORS) {
    return { ...NAMED_COLORS[value] };
  }

  const hex = /^#([0-9a-f]{3,8})$/.exec(value);
  if (hex) {
    const h = hex[1];
    const expand = (s: string): number => Number.parseInt(s + s, 16);
    if (h.length === 3 || h.length === 4) {
      return {
        r: expand(h[0]),
        g: expand(h[1]),
        b: expand(h[2]),
        a: h.length === 4 ? expand(h[3]) / 255 : 1,
      };
    }
    if (h.length === 6 || h.length === 8) {
      return {
        r: Number.parseInt(h.slice(0, 2), 16),
        g: Number.parseInt(h.slice(2, 4), 16),
        b: Number.parseInt(h.slice(4, 6), 16),
        a: h.length === 8 ? Number.parseInt(h.slice(6, 8), 16) / 255 : 1,
      };
    }
    return null;
  }

  const rgb = /^rgba?\(([^)]*)\)$/.exec(value);
  if (rgb) {
    // Split on commas and/or slashes (modern syntax uses `r g b / a`).
    const body = rgb[1].trim();
    const slash = body.split("/");
    const channels = slash[0].trim().split(/[\s,]+/).filter(Boolean);
    if (channels.length < 3) {
      return null;
    }
    const alphaToken = slash[1] ?? channels[3];
    return {
      r: parseChannel(channels[0]),
      g: parseChannel(channels[1]),
      b: parseChannel(channels[2]),
      a: alphaToken === undefined ? 1 : parseAlpha(alphaToken),
    };
  }

  return null;
}

/** Canonical string form so equal colours compare equal regardless of syntax. */
export function canonicalColor(color: Rgba): string {
  const a = Number.parseFloat(color.a.toFixed(3));
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${a})`;
}

/**
 * Largest per-channel absolute difference (0-255 scale; alpha scaled to 255).
 * Used to distinguish an exact match from a near-match from a real divergence.
 */
export function colorDelta(a: Rgba, b: Rgba): number {
  return Math.round(
    Math.max(
      Math.abs(a.r - b.r),
      Math.abs(a.g - b.g),
      Math.abs(a.b - b.b),
      Math.abs(a.a - b.a) * 255,
    ),
  );
}

const COLOR_TOKEN =
  /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|\b(?:transparent|white|black)\b/g;

/**
 * Mix two colours in the sRGB space with premultiplied alpha, per the CSS
 * Color 5 `color-mix()` algorithm. `p1`/`p2` are percentages (0-100) or `null`
 * to be inferred (both null → 50/50; one null → the other's complement). When
 * the specified percentages sum to < 100 the result alpha is scaled down.
 */
export function mixColors(
  c1: Rgba,
  p1: number | null,
  c2: Rgba,
  p2: number | null,
): Rgba | null {
  let a1 = p1;
  let a2 = p2;
  if (a1 === null && a2 === null) {
    a1 = 50;
    a2 = 50;
  } else if (a2 === null) {
    a2 = 100 - (a1 as number);
  } else if (a1 === null) {
    a1 = 100 - a2;
  }
  const sum = (a1 as number) + (a2 as number);
  if (sum <= 0) {
    return null;
  }
  const w1 = (a1 as number) / sum;
  const w2 = (a2 as number) / sum;
  const alphaMult = sum < 100 ? sum / 100 : 1;
  const outAlpha = c1.a * w1 + c2.a * w2;
  const premix = (ch1: number, ch2: number): number =>
    outAlpha === 0 ? 0 : (ch1 * c1.a * w1 + ch2 * c2.a * w2) / outAlpha;
  return {
    r: clampChannel(premix(c1.r, c2.r)),
    g: clampChannel(premix(c1.g, c2.g)),
    b: clampChannel(premix(c1.b, c2.b)),
    a: Number.parseFloat((outAlpha * alphaMult).toFixed(4)),
  };
}

/** Extract the first balanced `color-mix( … )` expression from a value, if any. */
function firstColorMix(value: string): string | null {
  const start = value.toLowerCase().indexOf("color-mix(");
  if (start === -1) {
    return null;
  }
  let depth = 0;
  for (let i = start + "color-mix".length; i < value.length; i += 1) {
    if (value[i] === "(") {
      depth += 1;
    } else if (value[i] === ")") {
      depth -= 1;
      if (depth === 0) {
        return value.slice(start, i + 1);
      }
    }
  }
  return null;
}

/**
 * Evaluate a `color-mix(in srgb, A p1?, B p2?)` expression to a concrete colour.
 * Only the sRGB colour space is supported (the box-open-elements catalog uses
 * `in srgb` exclusively); other spaces, gradients, or unresolved operands return
 * `null` so the caller can route them to review. Operand `var()` must already be
 * resolved to concrete colours.
 */
export function parseColorMix(input: string): Rgba | null {
  const expr = firstColorMix(input);
  if (expr === null) {
    return null;
  }
  const inner = expr.slice("color-mix(".length, -1);
  const parts = splitTopLevel(inner).map(p => p.trim());
  if (parts.length !== 3 || !/^in\s+srgb$/i.test(parts[0])) {
    return null;
  }
  const parseComponent = (part: string): { color: Rgba; pct: number | null } | null => {
    const pctMatch = /\s(\d*\.?\d+)%$/.exec(part);
    const colorText = pctMatch ? part.slice(0, part.length - pctMatch[0].length) : part;
    const color = parseColor(colorText.trim());
    if (!color) {
      return null;
    }
    return { color, pct: pctMatch ? Number.parseFloat(pctMatch[1]) : null };
  };
  const a = parseComponent(parts[1]);
  const b = parseComponent(parts[2]);
  if (!a || !b) {
    return null;
  }
  return mixColors(a.color, a.pct, b.color, b.pct);
}

/**
 * Pull the first colour token out of a declaration value. Handles shorthand
 * such as `1px solid #0061d5` (→ `#0061d5`) so a `border` shorthand and a
 * `border-color` longhand compare on the same footing.
 *
 * A `color-mix(in srgb, …)` is evaluated to its concrete result (see
 * `parseColorMix`). Gradients — and any `color-mix` that does not fully resolve
 * — return `null` so the caller can route them to review, the colour analogue of
 * Layer 1 deferring unresolvable Sass functions.
 */
export function extractColor(value: string): Rgba | null {
  if (/\b(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(/i.test(value)) {
    return null;
  }
  if (/\bcolor-mix\s*\(/i.test(value)) {
    return parseColorMix(value);
  }
  const matches = value.match(COLOR_TOKEN);
  if (!matches) {
    return null;
  }
  for (const token of matches) {
    const parsed = parseColor(token);
    if (parsed) {
      return parsed;
    }
  }
  return null;
}

/**
 * Split a comma-separated list at top level only (commas inside parentheses,
 * e.g. `rgba(0,0,0,.1)`, are preserved).
 */
export function splitTopLevel(value: string, separator = ","): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of value) {
    if (ch === "(") {
      depth += 1;
    } else if (ch === ")") {
      depth = Math.max(0, depth - 1);
    }
    if (ch === separator && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim() !== "") {
    parts.push(current);
  }
  return parts;
}

/**
 * Normalise a `box-shadow` value so equal shadows compare equal regardless of
 * colour syntax and whitespace. Each comma-separated layer is trimmed, its
 * whitespace collapsed, and every colour token rewritten to canonical RGBA.
 * `none` normalises to `none`.
 */
export function normalizeShadow(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "" || trimmed === "none") {
    return "none";
  }
  return splitTopLevel(trimmed)
    .map(layer => {
      const rewritten = layer.replace(COLOR_TOKEN, token => {
        const parsed = parseColor(token);
        return parsed ? canonicalColor(parsed) : token;
      });
      return rewritten.trim().replace(/\s+/g, " ");
    })
    .join(", ");
}

/**
 * Resolve `var(--boe-token-name, fallback)` references against a token map keyed
 * by the CSS custom-property name (without the `--` prefix). Falls back to the
 * inline default when the token is unknown. Nested `var()` is resolved
 * left-to-right over a few passes. Values with no `var()` pass through.
 */
export function resolveCssVars(
  value: string,
  tokens: Map<string, string>,
  maxDepth = 5,
): string {
  let current = value.trim();
  for (let depth = 0; depth < maxDepth; depth += 1) {
    const next = current.replace(
      /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*?)\s*)?\)/g,
      (whole, name: string, fallback: string | undefined) => {
        const key = name.replace(/^--/, "");
        if (tokens.has(key)) {
          return tokens.get(key) as string;
        }
        return fallback !== undefined ? fallback : whole;
      },
    );
    if (next === current) {
      return next;
    }
    current = next;
  }
  return current;
}

export type ColorKind = "color" | "shadow";

export type Verdict = "conformant" | "review" | "missing-upstream" | "missing-boe";

export interface ColorComparisonInput {
  boeValue: string | null;
  upstreamValue: string | null;
  kind: ColorKind;
  /** Allowed per-channel delta for a colour match (0 = exact). */
  tolerance?: number;
}

export interface ColorComparison {
  verdict: Verdict;
  boeCanonical: string | null;
  upstreamCanonical: string | null;
  delta: number | null;
  note?: string;
}

/**
 * Compare a box-open-elements colour/shadow against the upstream resolved value.
 *
 * Unlike Layer 1 lengths, colour differences are **not** auto-labelled `drift`:
 * box-open-elements deliberately tracks Box's modernised "Blueprint" palette,
 * while the public Storybook may still render legacy component styles, so a
 * mismatch can be an intentional modernisation rather than a defect. Exact
 * (within tolerance) matches are `conformant`; anything else is `review` with
 * both resolved values and the channel delta shown for a human to judge.
 */
export function compareColor({
  boeValue,
  upstreamValue,
  kind,
  tolerance = 0,
}: ColorComparisonInput): ColorComparison {
  if (boeValue === null || boeValue.trim() === "") {
    return {
      verdict: "missing-boe",
      boeCanonical: null,
      upstreamCanonical: null,
      delta: null,
      note: "box-open-elements value could not be located; check the manifest anchor.",
    };
  }
  if (upstreamValue === null || upstreamValue.trim() === "") {
    return {
      verdict: "missing-upstream",
      boeCanonical: null,
      upstreamCanonical: null,
      delta: null,
      note: "Upstream value could not be located; check the selector/state/property.",
    };
  }

  if (kind === "shadow") {
    const boeCanonical = normalizeShadow(boeValue);
    const upstreamCanonical = normalizeShadow(upstreamValue);
    return {
      verdict: boeCanonical === upstreamCanonical ? "conformant" : "review",
      boeCanonical,
      upstreamCanonical,
      delta: null,
      note:
        boeCanonical === upstreamCanonical
          ? undefined
          : "Shadow differs — verify (may be an intentional modernisation).",
    };
  }

  const boeColor = extractColor(boeValue);
  const upstreamColor = extractColor(upstreamValue);
  if (!boeColor || !upstreamColor) {
    return {
      verdict: "review",
      boeCanonical: boeColor ? canonicalColor(boeColor) : null,
      upstreamCanonical: upstreamColor ? canonicalColor(upstreamColor) : null,
      delta: null,
      note: "Could not parse one side as a colour (e.g. color-mix / gradient) — verify by eye.",
    };
  }
  const delta = colorDelta(boeColor, upstreamColor);
  return {
    verdict: delta <= tolerance ? "conformant" : "review",
    boeCanonical: canonicalColor(boeColor),
    upstreamCanonical: canonicalColor(upstreamColor),
    delta,
    note:
      delta <= tolerance
        ? undefined
        : `Colours differ by ${delta} (per-channel, 0-255) — verify (may be an intentional modernisation).`,
  };
}
