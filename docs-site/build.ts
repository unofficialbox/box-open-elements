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
import { homePage, prerenderPages, type PrerenderPage } from "./prerender.js";

/** Absolute deployed origin + base path (GitHub Pages project site). */
const SITE = "https://unofficialbox.github.io/box-open-elements";

// fileURLToPath (not URL.pathname) so checkout paths with spaces/non-ASCII decode.
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = join(ROOT, "docs-site/dist");
const LIB_SRC = join(ROOT, "dist");
const WORKSHOP_SRC = join(ROOT, "storybook/dist");

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
cpSync(LIB_SRC, join(OUT, "lib"), { recursive: true });
if (includeWorkshop) cpSync(WORKSHOP_SRC, join(OUT, "workshop"), { recursive: true });

// SEO / GEO discovery files, served from the deployed root (sitemap is generated below).
for (const file of ["robots.txt", "llms.txt"]) {
  cpSync(join(ROOT, "docs-site", file), join(OUT, file));
}

const html = rewriteIndexHtml(await Bun.file(join(ROOT, "docs-site/index.html")).text(), includeWorkshop);

// ── Per-page static prerender (SEO/GEO) ──────────────────────────────────────
// Emit a real HTML file per catalog/foundation route so crawlers and AI engines
// get content instead of an empty SPA shell. Each page carries per-page <title>,
// description, canonical/OG, and pre-rendered #stage-body; the app boots from
// `window.__ROUTE__` and replaces the body, so the interactive render is
// identical. Assets use a `../../` relative depth so the files work at the
// GitHub Pages subpath without a fragile <base href>.

/** Insert the boot globals immediately before the module script. */
function injectBoot(source: string, rel: string, route: PrerenderPage["route"] | null): string {
  const boot =
    `<script>window.__BUILT__=true;window.__REL__=${JSON.stringify(rel)};` +
    (route ? `window.__ROUTE__=${JSON.stringify(route)};` : "") +
    `</script>\n  `;
  return source.replace('<script type="module" src=', `${boot}<script type="module" src=`);
}

const escapeAttr = (v: string): string => v.replaceAll("&", "&amp;").replaceAll('"', "&quot;");

function buildPageHtml(rootHtml: string, page: PrerenderPage): string {
  const url = `${SITE}/${page.path}/`;
  let out = rootHtml
    // depth-2 relative asset refs
    .replace('href="./styles.css"', 'href="../../styles.css"')
    .replace('src="./main.js"', 'src="../../main.js"')
    .replace('"./lib/index.js"', '"../../lib/index.js"')
    // per-page metadata
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(page.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escapeAttr(page.description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escapeAttr(page.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escapeAttr(page.description)}$2`)
    .replaceAll("https://unofficialbox.github.io/box-open-elements/", url)
    // pre-rendered content
    .replace('<div id="stage-body"></div>', `<div id="stage-body">${page.bodyHtml}</div>`)
    .replace(
      '<nav id="stage-breadcrumb" aria-label="Breadcrumb"></nav>',
      `<nav id="stage-breadcrumb" aria-label="Breadcrumb">${page.breadcrumbHtml}</nav>`,
    );
  out = injectBoot(out, "../../", page.route);
  return out;
}

// Root: the landing page. Prerender the home content so crawlers and the no-JS
// view get it; the client re-renders on boot (route stays null → parseHash()
// resolves the empty hash to home). Nav links resolve from the root (rel "").
const home = homePage();
const rootHtml = html
  .replace('<div id="stage-body"></div>', `<div id="stage-body">${home.bodyHtml}</div>`)
  .replace(
    '<nav id="stage-breadcrumb" aria-label="Breadcrumb"></nav>',
    `<nav id="stage-breadcrumb" aria-label="Breadcrumb">${home.breadcrumbHtml}</nav>`,
  );
await Bun.write(join(OUT, "index.html"), injectBoot(rootHtml, "", null));

const pages = prerenderPages();
for (const page of pages) {
  const dir = join(OUT, ...page.path.split("/"));
  mkdirSync(dir, { recursive: true });
  await Bun.write(join(dir, "index.html"), buildPageHtml(html, page));
}

// sitemap.xml enumerating the root + every prerendered page.
const locs = ["", ...pages.map(p => `${p.path}/`)];
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  locs.map(loc => `  <url><loc>${SITE}/${loc}</loc></url>`).join("\n") +
  `\n</urlset>\n`;
await Bun.write(join(OUT, "sitemap.xml"), sitemap);

// GitHub Pages fallback: unknown paths redirect to the site root (every known
// route has its own generated file above).
await Bun.write(
  join(OUT, "404.html"),
  `<!doctype html>\n<meta http-equiv="refresh" content="0; url=${SITE}/" />\n<title>Not found — Box Open Elements</title>\n`,
);

console.log(
  `Docs site built → docs-site/dist (version ${version}, library external at lib/` +
    `${includeWorkshop ? ", workshop at workshop/" : ", no workshop"})`,
);
