/**
 * Pure helpers for the static build (docs-site/build.ts), split out so the
 * index.html rewriting is unit-testable without running a full build.
 */

/** Replace exactly one occurrence; throw on zero or many so we never ship a broken page. */
export function replaceOnce(haystack: string, needle: string, replacement: string): string {
  const parts = haystack.split(needle);
  if (parts.length !== 2) {
    throw new Error(
      `expected exactly one occurrence of ${JSON.stringify(needle)} in index.html, found ${parts.length - 1}`,
    );
  }
  return parts.join(replacement);
}

/**
 * Rewrite the dev index.html for static hosting: server-absolute asset refs
 * become relative (host-agnostic — work at a sub-path or a domain root), the
 * importmap points at the copied library tree, and — when the workshop is
 * bundled — a rail-footer link to it is added.
 */
export function rewriteIndexHtml(html: string, includeWorkshop: boolean): string {
  let out = replaceOnce(html, 'href="/docs-site/styles.css"', 'href="./styles.css"');
  out = replaceOnce(out, '"box-open-elements": "/dist/index.js"', '"box-open-elements": "./lib/index.js"');
  out = replaceOnce(out, 'src="/docs-site/main.js"', 'src="./main.js"');
  if (includeWorkshop) {
    out = replaceOnce(
      out,
      '<a href="https://github.com/unofficialbox/box-open-elements" target="_blank" rel="noreferrer">GitHub</a>',
      '<a href="./workshop/">Workshop</a>\n        ' +
        '<a href="https://github.com/unofficialbox/box-open-elements" target="_blank" rel="noreferrer">GitHub</a>',
    );
  }
  return out;
}
