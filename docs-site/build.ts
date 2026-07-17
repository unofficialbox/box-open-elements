/**
 * Build the docs-site into a self-contained, host-agnostic static site under
 * docs-site/dist — deployable to GitHub Pages, Vercel, or any static host.
 *
 * Unlike the dev server (docs-site/server.ts, which serves files dynamically and
 * exposes the library via a server route), this emits a flat static artifact:
 *   dist/index.html   relative asset paths + importmap; version inlined
 *   dist/main.js      bundled app (the library is kept external)
 *   dist/styles.css
 *   dist/lib/**        the built box-open-elements tree (the importmap target)
 *   dist/workshop/**   the Storybook workshop static build
 *
 * The library is kept external and copied under lib/ so the deployed app still
 * consumes box-open-elements through the package boundary, exactly like the dev
 * server. All asset paths are relative, so the same artifact works at a sub-path
 * (user.github.io/box-open-elements/) or at a domain root (Vercel) unchanged.
 *
 * Assumes `bun run build` and `bun run storybook:build` already produced dist/
 * and storybook/dist/. Usage: bun run site:build
 */
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { rewriteIndexHtml } from "./build-helpers.js";

// fileURLToPath (not URL.pathname) so checkout paths with spaces/non-ASCII decode.
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = join(ROOT, "docs-site/dist");
const LIB_SRC = join(ROOT, "dist");
const WORKSHOP_SRC = join(ROOT, "storybook/dist");
const FONT_SRC = join(ROOT, "docs-site/fonts");

const version = ((await Bun.file(join(ROOT, "package.json")).json()) as { version: string }).version;

if (!existsSync(join(LIB_SRC, "index.js"))) {
  console.error("dist/index.js not found — run `bun run build` first.");
  process.exit(1);
}
// The workshop is opt-in via an explicit flag (site:build passes it; docs:build
// does not) rather than inferred from filesystem state, so a stale storybook/dist
// can't silently change the docs-only build.
const includeWorkshop = process.argv.includes("--include-workshop");
if (includeWorkshop && !existsSync(join(WORKSHOP_SRC, "index.html"))) {
  console.error("--include-workshop given but storybook/dist not found — run `bun run storybook:build` first.");
  process.exit(1);
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const build = await Bun.build({
  entrypoints: [join(ROOT, "docs-site/main.ts")],
  outdir: OUT,
  external: ["box-open-elements"],
  format: "esm",
  minify: true,
  naming: "[name].[ext]",
  loader: { ".md": "text" },
  // Inline the package version so the rail footer needs no /api/status endpoint.
  define: { __BOE_VERSION__: JSON.stringify(version) },
});
if (!build.success) {
  for (const log of build.logs) console.error(log);
  process.exit(1);
}

// Static assets: styles, the built library tree (importmap target), the workshop.
cpSync(join(ROOT, "docs-site/styles.css"), join(OUT, "styles.css"));
cpSync(FONT_SRC, join(OUT, "fonts"), { recursive: true });
cpSync(LIB_SRC, join(OUT, "lib"), { recursive: true });
if (includeWorkshop) cpSync(WORKSHOP_SRC, join(OUT, "workshop"), { recursive: true });

const html = rewriteIndexHtml(await Bun.file(join(ROOT, "docs-site/index.html")).text(), includeWorkshop);
await Bun.write(join(OUT, "index.html"), html);

console.log(
  `Docs site built → docs-site/dist (version ${version}, library external at lib/` +
    `${includeWorkshop ? ", workshop at workshop/" : ", no workshop"})`,
);
