/**
 * Style bridge — translate third-party CSS/SCSS subsets into BOE-facing output.
 * See docs/integration/style-bridge.md.
 */

export type SelectorBridgeConfig = {
  mode: "selector-bridge";
  /** Legacy selector → component / host selector */
  selectorMap: Record<string, string>;
  /** Literal declaration value → tokenized value (exact match on value side) */
  declarationMap?: Record<string, string>;
  /** Simple `$name` → substitution value before flattening */
  variableMap?: Record<string, string>;
};

export type TokenBridgeConfig = {
  mode: "token-bridge";
  /** Custom-property prefix remap, e.g. { "--obp-": "--boe-" } */
  prefixMap: Record<string, string>;
  /** Optional `token(name)` → `var(--boe-token-…)` replacements */
  tokenFnMap?: Record<string, string>;
  /** Appended after remapping (semantic aliases) */
  aliasBlock?: string;
};

export type BridgeConfig = SelectorBridgeConfig | TokenBridgeConfig;

export type BridgeReport = {
  mode: BridgeConfig["mode"];
  inlinedImports: string[];
  missingVariables: string[];
  unresolvedImports: string[];
  appliedSelectorMappings: number;
  appliedDeclarationMappings: number;
  appliedPrefixRemaps: number;
  appliedTokenFns: number;
};

export type BridgeOptions = {
  /** Resolve `@import '…'` / `@import "…"` paths relative to the entry file. */
  resolveImport?: (specifier: string) => string | null;
};

/**
 * Build a filesystem import resolver that understands Sass-style partials
 * (`variables` → `_variables.scss`) and bare extensionless paths.
 */
export const createFileImportResolver = (
  readFile: (absolutePath: string) => string | null,
  resolvePath: (fromDir: string, specifier: string) => string,
  fromDir: string,
): NonNullable<BridgeOptions["resolveImport"]> => {
  return (specifier: string) => {
    const base = resolvePath(fromDir, specifier);
    const basename = base.split(/[/\\]/).pop() ?? "";
    const dir = base.slice(0, Math.max(0, base.length - basename.length));
    const candidates = [
      base,
      `${base}.scss`,
      `${base}.css`,
      `${dir}_${basename}.scss`,
      `${dir}_${basename}.css`,
      `${dir}_${basename}`,
    ];
    for (const candidate of candidates) {
      const contents = readFile(candidate);
      if (contents != null) {
        return contents;
      }
    }
    return null;
  };
};

export type BridgeResult = {
  css: string;
  report: BridgeReport;
};

const emptyReport = (mode: BridgeConfig["mode"]): BridgeReport => ({
  mode,
  inlinedImports: [],
  missingVariables: [],
  unresolvedImports: [],
  appliedSelectorMappings: 0,
  appliedDeclarationMappings: 0,
  appliedPrefixRemaps: 0,
  appliedTokenFns: 0,
});

const IMPORT_RE = /@import\s+(?:url\()?['"]([^'"]+)['"]\)?\s*;/g;
const VAR_RE = /\$([A-Za-z_][\w-]*)/g;
const TOKEN_FN_RE = /token\(\s*['"]?([^'")\s]+)['"]?\s*\)/g;

const inlineImports = (
  source: string,
  resolveImport: BridgeOptions["resolveImport"],
  report: BridgeReport,
  seen = new Set<string>(),
): string => {
  if (!resolveImport) {
    return source;
  }

  return source.replace(IMPORT_RE, (_match, specifier: string) => {
    if (seen.has(specifier)) {
      // Empty — a comment token here can confuse the simple nest flattener.
      return "";
    }
    const resolved = resolveImport(specifier);
    if (resolved == null) {
      report.unresolvedImports.push(specifier);
      return `/* unresolved import: ${specifier} */`;
    }
    seen.add(specifier);
    report.inlinedImports.push(specifier);
    return inlineImports(resolved, resolveImport, report, seen);
  });
};

const substituteVariables = (
  source: string,
  variableMap: Record<string, string> | undefined,
  report: BridgeReport,
): string => {
  if (!variableMap) {
    return source;
  }
  return source.replace(VAR_RE, (match, name: string, offset: number) => {
    // Leave Sass definitions (`$name: …`) intact; only substitute references.
    const after = source.slice(offset + match.length);
    if (/^\s*:/.test(after)) {
      return match;
    }
    if (Object.prototype.hasOwnProperty.call(variableMap, name)) {
      return variableMap[name]!;
    }
    if (!report.missingVariables.includes(name)) {
      report.missingVariables.push(name);
    }
    return match;
  });
};

/** Drop `$name: value;` lines so the flattener never treats them as selectors. */
const stripSassDefinitions = (source: string): string =>
  source.replace(/^\s*\$[A-Za-z_][\w-]*\s*:[^;]*;\s*$/gm, "");

/**
 * Strip SCSS `//` line comments without corrupting `url(//…)`, quoted `//`,
 * or `//` inside CSS block comments. Strips `//` inside other parentheses
 * (e.g. calc) while preserving protocol-relative URLs in `url(…)`.
 */
export const stripScssLineComments = (source: string): string => {
  let out = "";
  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let urlParenDepth = 0;

  while (i < source.length) {
    const c = source[i]!;
    const next = source[i + 1];

    if (inSingle) {
      out += c;
      if (c === "\\" && i + 1 < source.length) {
        out += source[i + 1]!;
        i += 2;
        continue;
      }
      if (c === "'") inSingle = false;
      i += 1;
      continue;
    }

    if (inDouble) {
      out += c;
      if (c === "\\" && i + 1 < source.length) {
        out += source[i + 1]!;
        i += 2;
        continue;
      }
      if (c === '"') inDouble = false;
      i += 1;
      continue;
    }

    if (c === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      const stop = end === -1 ? source.length : end + 2;
      out += source.slice(i, stop);
      i = stop;
      continue;
    }

    if (c === "'" || c === '"') {
      if (c === "'") inSingle = true;
      else inDouble = true;
      out += c;
      i += 1;
      continue;
    }

    if (urlParenDepth === 0 && source.slice(i, i + 4).toLowerCase() === "url(") {
      out += source.slice(i, i + 4);
      i += 4;
      urlParenDepth = 1;
      continue;
    }

    if (urlParenDepth > 0) {
      if (c === "(") urlParenDepth += 1;
      else if (c === ")") urlParenDepth -= 1;
      out += c;
      i += 1;
      continue;
    }

    if (c === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }

    out += c;
    i += 1;
  }

  return out;
};

const normalizeDeclBody = (raw: string): string =>
  raw
    .trim()
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean)
    .join("\n  ");

/** Combine parent/child selectors, expanding comma lists (Cartesian product). */
export const combineSelectors = (parentSelector: string, selectorPart: string): string => {
  if (!parentSelector) return selectorPart;
  const parents = parentSelector.split(",").map(s => s.trim()).filter(Boolean);
  const children = selectorPart.split(",").map(s => s.trim()).filter(Boolean);
  const parts: string[] = [];
  for (const parent of parents) {
    for (const child of children) {
      parts.push(child.startsWith("&") ? parent + child.slice(1) : `${parent} ${child}`);
    }
  }
  return parts.join(", ");
};

/**
 * Find the index just past a matching `}` for a block whose `{` was already consumed.
 * Ignores braces inside strings and comments. Returns `{ end, hasNesting }`.
 */
const scanBlockEnd = (
  source: string,
  start: number,
): { end: number; hasNesting: boolean } => {
  let i = start;
  let depth = 1;
  let hasNesting = false;
  let inSingle = false;
  let inDouble = false;

  while (i < source.length && depth > 0) {
    const c = source[i]!;
    const next = source[i + 1];

    if (inSingle) {
      if (c === "\\" && i + 1 < source.length) {
        i += 2;
        continue;
      }
      if (c === "'") inSingle = false;
      i += 1;
      continue;
    }
    if (inDouble) {
      if (c === "\\" && i + 1 < source.length) {
        i += 2;
        continue;
      }
      if (c === '"') inDouble = false;
      i += 1;
      continue;
    }

    if (c === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      i = end === -1 ? source.length : end + 2;
      continue;
    }
    if (c === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }
    if (c === "'") {
      inSingle = true;
      i += 1;
      continue;
    }
    if (c === '"') {
      inDouble = true;
      i += 1;
      continue;
    }
    if (c === "{") {
      depth += 1;
      if (depth > 1) hasNesting = true;
      i += 1;
      continue;
    }
    if (c === "}") {
      depth -= 1;
      i += 1;
      continue;
    }
    i += 1;
  }

  return { end: i, hasNesting };
};

/**
 * Flatten simple SCSS nesting: `parent { &.child { … } }` and
 * `parent { .child { … } }`. Not a full Sass compiler — see style-bridge.md limits.
 */
export const flattenSimpleNesting = (input: string): string => {
  const flattenBlock = (blockSource: string, initialParent: string): string => {
    const out: string[] = [];
    const source = blockSource;
    let i = 0;

    const skipWs = (): void => {
      while (i < source.length && /\s/.test(source[i]!)) i += 1;
    };

    const readUntil = (chars: string): string => {
      const start = i;
      while (i < source.length && !chars.includes(source[i]!)) i += 1;
      return source.slice(start, i);
    };

    const skipComments = (): void => {
      while (i < source.length) {
        skipWs();
        if (source.startsWith("/*", i)) {
          const end = source.indexOf("*/", i + 2);
          i = end === -1 ? source.length : end + 2;
          continue;
        }
        if (source.startsWith("//", i)) {
          while (i < source.length && source[i] !== "\n") i += 1;
          continue;
        }
        break;
      }
    };

    /** Parse block contents (decls + nested rules + at-rules) under `parentSelector`. */
    const parseBlockContents = (parentSelector: string, stopAtBrace: boolean): void => {
      const decls: string[] = [];
      const flushDecls = (): void => {
        if (!decls.length) return;
        if (parentSelector) {
          out.push(`${parentSelector} {\n  ${decls.join("\n  ")}\n}`);
        } else {
          out.push(decls.join("\n"));
        }
        decls.length = 0;
      };

      while (i < source.length) {
        skipComments();
        if (i >= source.length) break;
        if (stopAtBrace && source[i] === "}") break;

        if (source.startsWith("@", i) && !source.startsWith("@import", i)) {
          flushDecls();
          const atStart = i;
          while (i < source.length && source[i] !== "{" && source[i] !== ";") i += 1;
          if (source[i] === ";") {
            i += 1;
            out.push(source.slice(atStart, i));
            continue;
          }
          if (source[i] !== "{") break;
          const header = source.slice(atStart, i).trim();
          i += 1;
          const { end } = scanBlockEnd(source, i);
          const inner = source.slice(i, end - 1);
          i = end;
          const flattenedInner = flattenBlock(inner, parentSelector);
          if (flattenedInner.trim()) {
            out.push(`${header} {\n${flattenedInner}\n}`);
          }
          continue;
        }

        let k = i;
        while (k < source.length && source[k] !== "{" && source[k] !== ";" && source[k] !== "}") {
          k += 1;
        }
        if (source[k] === "{") {
          flushDecls();
          parseRule(parentSelector);
        } else if (source[k] === ";") {
          decls.push(source.slice(i, k + 1).trim());
          i = k + 1;
        } else {
          break;
        }
      }
      flushDecls();
    };

    const parseRule = (parentSelector: string): void => {
      skipComments();
      if (i >= source.length || source[i] === "}") return;

      const selectorPart = readUntil("{").trim();
      if (source[i] !== "{") return;
      i += 1;

      const { end, hasNesting } = scanBlockEnd(source, i);
      const combined = combineSelectors(parentSelector, selectorPart);

      if (!hasNesting) {
        const body = normalizeDeclBody(source.slice(i, end - 1));
        i = end;
        if (body) {
          out.push(`${combined} {\n  ${body}\n}`);
        }
        return;
      }

      parseBlockContents(combined, true);
      if (source[i] === "}") i += 1;
    };

    if (initialParent && !/[{@]/.test(source)) {
      const body = normalizeDeclBody(source);
      return body ? `${initialParent} {\n  ${body}\n}` : "";
    }

    parseBlockContents(initialParent, false);
    return out.join("\n\n");
  };

  return flattenBlock(input, "");
};

const applySelectorMap = (
  css: string,
  selectorMap: Record<string, string>,
  report: BridgeReport,
): string => {
  let next = css;
  // Longer selectors first so `.be.bce` wins over `.be`
  const keys = Object.keys(selectorMap).sort((a, b) => b.length - a.length);
  for (const from of keys) {
    const to = selectorMap[from]!;
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Refuse prefix matches (`.be` must not rewrite `.bce` / `.be-app`).
    const re = new RegExp(`${escaped}(?![-\\w])`, "g");
    const before = next;
    next = next.replace(re, to);
    if (next !== before) {
      report.appliedSelectorMappings += 1;
    }
  }
  return next;
};

const applyDeclarationMap = (
  css: string,
  declarationMap: Record<string, string> | undefined,
  report: BridgeReport,
): string => {
  if (!declarationMap) return css;
  let next = css;
  // Longer values first so `1px solid var(--x)` wins over bare `var(--x)`.
  const entries = Object.entries(declarationMap).sort((a, b) => b[0].length - a[0].length);
  for (const [from, to] of entries) {
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match as a CSS value (after `:`, before `;` or `}`)
    const re = new RegExp(`(:\\s*)${escaped}(\\s*[;}])`, "g");
    const before = next;
    next = next.replace(re, `$1${to}$2`);
    if (next !== before) {
      report.appliedDeclarationMappings += 1;
    }
  }
  return next;
};

const applyTokenBridge = (source: string, config: TokenBridgeConfig, report: BridgeReport): string => {
  let css = source;

  // Strip @import by inlining already done; strip leftover @import lines
  css = css.replace(IMPORT_RE, "");

  const prefixes = Object.keys(config.prefixMap).sort((a, b) => b.length - a.length);
  for (const from of prefixes) {
    const to = config.prefixMap[from]!;
    const escaped = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "g");
    const before = css;
    css = css.replace(re, to);
    if (css !== before) {
      report.appliedPrefixRemaps += 1;
    }
  }

  if (config.tokenFnMap) {
    css = css.replace(TOKEN_FN_RE, (match, name: string) => {
      if (Object.prototype.hasOwnProperty.call(config.tokenFnMap, name)) {
        report.appliedTokenFns += 1;
        return config.tokenFnMap![name]!;
      }
      return match;
    });
  }

  if (config.aliasBlock?.trim()) {
    css = `${css.trim()}\n\n${config.aliasBlock.trim()}\n`;
  }

  return css.trim() + "\n";
};

export const bridgeStylesheet = (
  source: string,
  config: BridgeConfig,
  options: BridgeOptions = {},
): BridgeResult => {
  const report = emptyReport(config.mode);
  let css = inlineImports(source, options.resolveImport, report);

  if (config.mode === "selector-bridge") {
    css = substituteVariables(css, config.variableMap, report);
    css = stripSassDefinitions(css);
    css = stripScssLineComments(css);
    css = flattenSimpleNesting(css);
    css = applySelectorMap(css, config.selectorMap, report);
    css = applyDeclarationMap(css, config.declarationMap, report);
    // Collapse excessive blank lines left by stripped defs / comments.
    css = css.replace(/\n{3,}/g, "\n\n");
    return { css: css.trim() + "\n", report };
  }

  css = applyTokenBridge(css, config, report);
  return { css, report };
};
