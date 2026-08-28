import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Every custom element that gives `:host` a `display` must also honour
 * `[hidden]`.
 *
 * The HTML stylesheet's `[hidden] { display: none }` loses to a component's own
 * `:host { display: block }` — same specificity, and the component's sheet wins.
 * So `element.hidden = true` from a host silently does nothing, and the element
 * stays on screen.
 *
 * This is asserted against the source rather than a rendered element because
 * jsdom never applies `:host` rules at all: it reports `display: none` for a
 * hidden element whether or not the fix is present, so a DOM test here would
 * pass just as happily on the broken version. Real rendering is covered by the
 * visual baselines and by manual Chromium checks.
 */

// Resolved from the working directory rather than import.meta.url: vitest
// rewrites module URLs, and the rewritten one does not point at the repo.
const SRC = join(process.cwd(), "src");

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    return statSync(path).isDirectory()
      ? sourceFiles(path)
      : path.endsWith(".ts")
        ? [path]
        : [];
  });

interface HostRule {
  file: string;
  display: string;
  hidden: string | null;
  nested: boolean;
}

/**
 * Whether an offset sits inside an unclosed CSS block.
 *
 * A rule can be present in the file and still be inert. `box-nav-sidebar` has a
 * comment inside its `:host` block containing a `}`; a rule inserted after that
 * brace landed *within* `:host` rather than beside it, which parses as a nested
 * rule and never applied. The text was there, so a search for it passed — only
 * a real browser noticed. Comments are stripped first, since a brace inside one
 * is not a block at all.
 */
const nestedInBlock = (source: string, index: number): boolean => {
  const before = source.slice(source.indexOf(":host"), index).replace(/\/\*[\s\S]*?\*\//g, "");
  let depth = 0;
  for (const character of before) {
    if (character === "{") depth += 1;
    else if (character === "}") depth -= 1;
  }
  return depth > 0;
};

const hostRules = (): HostRule[] => {
  const rules: HostRule[] = [];

  for (const file of sourceFiles(SRC)) {
    const source = readFileSync(file, "utf8");
    if (!/extends\s+BaseElement|extends\s+FormAssociated/.test(source)) {
      continue;
    }

    // The bare `:host { … }` block — `:host(…)` variants are matched separately.
    const bare = /(?:^|\n)[ \t]*:host\s*\{([^}]*)\}/.exec(source);
    const display = bare ? /(?:^|[\s;])display\s*:\s*([^;]+)/.exec(bare[1] ?? "") : null;
    if (!display) {
      continue;
    }

    const hidden = /:host\(\[hidden\]\)\s*\{([^}]*)\}/.exec(source);
    rules.push({
      file: file.slice(SRC.length + 1),
      display: (display[1] ?? "").trim(),
      hidden: hidden ? (hidden[1] ?? "").trim() : null,
      nested: hidden ? nestedInBlock(source, hidden.index) : false,
    });
  }

  return rules;
};

describe("custom elements honour [hidden]", () => {
  const rules = hostRules();

  it("finds the elements that set a host display", () => {
    // A guard on the guard: a regex that silently stopped matching would make
    // every assertion below vacuous.
    expect(rules.length).toBeGreaterThan(100);
  });

  it("gives every one of them a :host([hidden]) rule", () => {
    const missing = rules.filter(rule => rule.hidden === null).map(rule => rule.file);

    expect(missing).toEqual([]);
  });

  it("leaves none of those rules nested inside another block", () => {
    const inert = rules.filter(rule => rule.nested).map(rule => rule.file);

    expect(inert).toEqual([]);
  });

  it("makes that rule win over any later or more specific host rule", () => {
    // `:host([variant="line"])` and friends come later in the sheet with equal
    // specificity, so without !important they would take the display back —
    // which is exactly how box-code-block stayed visible while hidden.
    const weak = rules
      .filter(rule => rule.hidden !== null && !/display:\s*none\s*!important/.test(rule.hidden))
      .map(rule => rule.file);

    expect(weak).toEqual([]);
  });
});
