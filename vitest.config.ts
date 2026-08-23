import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const root = dirname(fileURLToPath(import.meta.url));
const CORE = "@unofficialbox/box-open-elements";

/**
 * Where a core subpath lives in `src`, mirroring the `exports` map in
 * package.json. Ordered by the same precedence: the explicit pattern entries
 * are all `<dir>/index.js`, and the `./patterns/*` fallback is a bare file, so
 * a pattern gets both candidates and the first that exists wins.
 */
const sourceCandidates = (subpath: string): string[] => {
  if (subpath === "") return ["src/index.ts"];
  if (subpath === "core") return ["src/core/index.ts"];
  if (subpath.startsWith("foundations/")) return [`src/${subpath}/index.ts`];
  if (subpath.startsWith("components/")) return [`src/${subpath}.ts`];
  if (subpath.startsWith("patterns/")) return [`src/${subpath}/index.ts`, `src/${subpath}.ts`];
  return [`src/entries/${subpath}.ts`];
};

/**
 * Resolve the core package to this workspace's `src`, for the adapter tests
 * under each package's own test directory.
 *
 * Without this they resolve to the *published* copy in node_modules, and the
 * consequences are not theoretical: while `box-drawer` was being rewritten to
 * stop relocating its host, the React test covering that very behaviour was
 * exercising the last release's drawer. `pkg.Drawer !== src.Drawer` — two
 * different classes, one of them stale, and nothing said so.
 *
 * It was also inconsistent with the type layer, which is the worse half:
 * `packages/react/tsconfig.json` already maps these specifiers to `src` via
 * `paths`. So types came from the working tree while runtime came from the
 * registry — a change could typecheck against code the tests never ran.
 *
 * A miss returns null and falls through to normal resolution rather than
 * failing, so a subpath that exists only in a published build still loads.
 *
 * The prefix check is deliberately exact: `…-react` and friends share the
 * core's name as a prefix and must not be captured by it.
 */
const workspaceSource = {
  name: "box-open-elements-workspace-source",
  enforce: "pre" as const,
  resolveId(id: string): string | null {
    if (id !== CORE && !id.startsWith(`${CORE}/`)) return null;
    const subpath = id === CORE ? "" : id.slice(CORE.length + 1);
    for (const candidate of sourceCandidates(subpath)) {
      const absolute = resolve(root, candidate);
      if (existsSync(absolute)) return absolute;
    }
    return null;
  },
};

export default defineConfig({
  plugins: [workspaceSource],
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost/",
      },
    },
    include: ["test/**/*.test.ts", "packages/*/test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      // Floors justified by docs/coverage-baseline.md (measured 2026-07-16).
      // Raise only after a fresh measurement — do not treat these as the
      // per-change quality target (see AGENTS.md: 85%+ on new logic).
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 85,
        branches: 65,
      },
    },
  },
});
