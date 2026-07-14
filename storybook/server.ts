/**
 * Workshop dev server. Bundles storybook/app.ts (library included) on startup
 * and serves the static shell. For a deployable artifact use storybook/build.ts.
 *
 * Usage: bun run build && bun storybook/server.ts   (or: bun run storybook:dev)
 */
import { extname, join, normalize } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const PORT = Number(process.env.PORT ?? 4610);

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

const build = await Bun.build({
  entrypoints: [join(ROOT, "storybook/app.ts")],
  format: "esm",
  minify: false,
});

if (!build.success) {
  for (const log of build.logs) console.error(log);
  process.exit(1);
}

const appBundle = await build.outputs[0].text();

Bun.serve({
  port: PORT,
  async fetch(request) {
    const path = normalize(new URL(request.url).pathname).replace(/^\/+/, "");
    if (path.includes("..")) return new Response("forbidden", { status: 403 });
    if (path === "" || path === "index.html") {
      return new Response(Bun.file(join(ROOT, "storybook/index.html")), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
    if (path === "app.js") {
      return new Response(appBundle, { headers: { "content-type": "text/javascript; charset=utf-8" } });
    }
    if (path === "styles.css") {
      return new Response(Bun.file(join(ROOT, "storybook/styles.css")), {
        headers: { "content-type": "text/css; charset=utf-8" },
      });
    }
    const file = Bun.file(join(ROOT, "storybook", path));
    if (!(await file.exists())) return new Response("not found", { status: 404 });
    return new Response(file, {
      headers: { "content-type": CONTENT_TYPES[extname(path)] ?? "application/octet-stream" },
    });
  },
});

console.log(`workshop on http://localhost:${PORT}`);
