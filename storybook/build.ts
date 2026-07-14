/**
 * Build the workshop into a self-contained static site under storybook/dist.
 *
 * Unlike the docs site (which keeps the library external via an import map),
 * the workshop bundles box-open-elements IN, so storybook/dist is a fully
 * standalone artifact deployable to any static host (Netlify, Vercel, GitHub
 * Pages, S3/CloudFront, …) with no server, import map, or Storybook runtime.
 *
 * Usage: bun run build && bun storybook/build.ts   (or: bun run storybook:build)
 */
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "storybook/dist");

const build = await Bun.build({
  entrypoints: [join(ROOT, "storybook/app.ts")],
  outdir: OUT,
  format: "esm",
  minify: true,
  naming: "[dir]/[name].[ext]",
});

if (!build.success) {
  for (const log of build.logs) console.error(log);
  process.exit(1);
}

await Bun.write(join(OUT, "index.html"), await Bun.file(join(ROOT, "storybook/index.html")).text());
await Bun.write(join(OUT, "styles.css"), await Bun.file(join(ROOT, "storybook/styles.css")).text());

console.log(`Workshop built → storybook/dist (${build.outputs.length} bundle)`);
