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
      return "/* cyclic import skipped */";
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
 * Flatten one level of simple SCSS nesting: `parent { &.child { … } }` and
 * `parent { .child { … } }`. Not a full Sass compiler — see style-bridge.md limits.
 */
export const flattenSimpleNesting = (source: string): string => {
  const out: string[] = [];
  let i = 0;

  const skipWs = (): void => {
    while (i < source.length && /\s/.test(source[i]!)) i += 1;
  };

  const readUntil = (chars: string): string => {
    let start = i;
    while (i < source.length && !chars.includes(source[i]!)) i += 1;
    return source.slice(start, i);
  };

  const parseBlock = (parentSelector: string): void => {
    skipWs();
    while (i < source.length && source[i] !== "}") {
      skipWs();
      if (i >= source.length || source[i] === "}") break;

      // at-rule passthrough (keep body as-is for @media etc.)
      if (source.startsWith("@", i) && !source.startsWith("@import", i)) {
        const atStart = i;
        while (i < source.length && source[i] !== "{" && source[i] !== ";") i += 1;
        if (source[i] === ";") {
          i += 1;
          out.push(source.slice(atStart, i));
          continue;
        }
        if (source[i] === "{") {
          i += 1;
          const innerStart = i;
          let depth = 1;
          while (i < source.length && depth > 0) {
            if (source[i] === "{") depth += 1;
            else if (source[i] === "}") depth -= 1;
            if (depth > 0) i += 1;
          }
          const inner = source.slice(innerStart, i);
          i += 1; // closing }
          out.push(`${source.slice(atStart, innerStart)}${inner}}`);
          continue;
        }
      }

      const selectorPart = readUntil("{").trim();
      if (source[i] !== "{") break;
      i += 1; // {

      // Peek: does this block contain nested `{` before its closing `}`?
      let depth = 1;
      let j = i;
      let hasNesting = false;
      while (j < source.length && depth > 0) {
        if (source[j] === "{") {
          depth += 1;
          if (depth > 1) hasNesting = true;
        } else if (source[j] === "}") {
          depth -= 1;
        }
        j += 1;
      }

      const combined = parentSelector
        ? selectorPart.startsWith("&")
          ? parentSelector + selectorPart.slice(1)
          : `${parentSelector} ${selectorPart}`
        : selectorPart;

      if (!hasNesting) {
        const body = source.slice(i, j - 1).trim();
        i = j;
        if (body) {
          out.push(`${combined} {\n  ${body}\n}`);
        }
      } else {
        // Parse nested with combined as parent; also collect direct decls first.
        const decls: string[] = [];
        while (i < source.length && source[i] !== "}") {
          skipWs();
          if (source[i] === "}") break;
          // Lookahead for nested rule vs declaration
          let k = i;
          while (k < source.length && source[k] !== "{" && source[k] !== ";" && source[k] !== "}") {
            k += 1;
          }
          if (source[k] === "{") {
            parseBlock(combined);
          } else if (source[k] === ";") {
            decls.push(source.slice(i, k + 1).trim());
            i = k + 1;
          } else {
            break;
          }
        }
        if (decls.length) {
          out.push(`${combined} {\n  ${decls.join("\n  ")}\n}`);
        }
        if (source[i] === "}") i += 1;
      }
    }
    if (source[i] === "}") i += 1;
  };

  while (i < source.length) {
    skipWs();
    if (i >= source.length) break;
    // top-level comment
    if (source.startsWith("/*", i)) {
      const end = source.indexOf("*/", i + 2);
      if (end === -1) break;
      out.push(source.slice(i, end + 2));
      i = end + 2;
      continue;
    }
    parseBlock("");
  }

  return out.join("\n\n");
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
    const re = new RegExp(escaped, "g");
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
  for (const [from, to] of Object.entries(declarationMap)) {
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
    css = flattenSimpleNesting(css);
    css = applySelectorMap(css, config.selectorMap, report);
    css = applyDeclarationMap(css, config.declarationMap, report);
    return { css: css.trim() + "\n", report };
  }

  css = applyTokenBridge(css, config, report);
  return { css, report };
};
