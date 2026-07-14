/**
 * Docs-site server. Bundles docs-site/main.ts on startup (the library itself
 * stays external, served from /dist via the page's import map, so the app
 * consumes the package exactly like a consumer would) and serves everything
 * statically.
 *
 * Usage: bun run docs   (builds the library first)
 */
import { extname, join, normalize } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const PORT = Number(process.env.PORT ?? 4600);

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

const build = await Bun.build({
  entrypoints: [join(ROOT, "docs-site/main.ts")],
  external: ["box-open-elements"],
  format: "esm",
  minify: false,
  // Foundation markdown docs are inlined as text and rendered in-shell.
  loader: { ".md": "text" },
});

if (!build.success) {
  for (const log of build.logs) console.error(log);
  process.exit(1);
}

const mainBundle = await build.outputs[0].text();
const version = (await Bun.file(join(ROOT, "package.json")).json()).version as string;

Bun.serve({
  port: PORT,
  async fetch(request) {
    const path = normalize(new URL(request.url).pathname).replace(/^\/+/, "");
    if (path.includes("..")) return new Response("forbidden", { status: 403 });
    if (path === "" || path === "index.html") {
      return new Response(Bun.file(join(ROOT, "docs-site/index.html")), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    if (path === "docs-site/main.js") {
      return new Response(mainBundle, { headers: { "content-type": "text/javascript; charset=utf-8" } });
    }
    if (path === "api/status") {
      return Response.json({ version });
    }
    if (!path.startsWith("docs-site/") && !path.startsWith("dist/")) {
      return new Response("not found", { status: 404 });
    }
    const file = Bun.file(join(ROOT, path));
    if (!(await file.exists())) return new Response("not found", { status: 404 });
    return new Response(file, {
      headers: { "content-type": CONTENT_TYPES[extname(path)] ?? "application/octet-stream" },
    });
  },
});

console.log(`docs site on http://localhost:${PORT}`);
