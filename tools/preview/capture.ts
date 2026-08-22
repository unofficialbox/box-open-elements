/**
 * Captures preview-gallery screenshots into docs/screenshots/gallery/.
 *
 * Usage: bun run build && bun tools/preview/capture.ts
 *
 * Serves the repo root statically so /dist/index.js resolves, loads
 * tools/preview/gallery.html in headless Chromium, waits for the gallery
 * to mark itself ready, then screenshots each <section>.
 */
import { chromium } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { applyDeterministicFonts, blockRemoteFonts } from "./deterministic-fonts.js";

/** Sandbox chromium if present, else let playwright-core resolve its install (CI). */
const chromiumExecutablePath = (): string | undefined => {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  return existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined;
};

const ROOT = new URL("../..", import.meta.url).pathname;
const OUT_DIR = process.env.GALLERY_OUT_DIR ?? join(ROOT, "docs/screenshots/gallery");
const PORT = 4599;

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8",
};

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const path = normalize(new URL(request.url).pathname).replace(/^\/+/, "");
    if (path.includes("..")) {
      return new Response("forbidden", { status: 403 });
    }
    const file = Bun.file(join(ROOT, path));
    if (!(await file.exists())) {
      return new Response("not found", { status: 404 });
    }
    return new Response(file, {
      headers: { "content-type": CONTENT_TYPES[extname(path)] ?? "application/octet-stream" },
    });
  },
});

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromiumExecutablePath(),
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-device-scale-factor=2"],
});

try {
  const page = await browser.newPage({ viewport: { width: 1160, height: 900 } });
  await blockRemoteFonts(page);
  page.on("console", message => {
    // Aborted remote fonts surface as resource-load errors — expected, not a failure.
    if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
      console.error(`[page] ${message.text()}`);
    }
  });
  page.on("pageerror", error => {
    console.error(`[pageerror] ${error.stack ?? error.message}`);
    process.exitCode = 1;
  });

  await page.goto(`http://localhost:${PORT}/tools/preview/gallery.html`, { waitUntil: "networkidle" });
  await page.waitForSelector('body[data-gallery-ready="true"]', { timeout: 15_000 });
  await applyDeterministicFonts(page);
  await page.waitForTimeout(250);

  // Reserve the scrollbar gutter for the whole run. Sections are captured one
  // at a time with the others hidden (below), which leaves the page short
  // enough to lose its scrollbar — and a scrollbar appearing or disappearing
  // changes the content width, which would move everything horizontally.
  await page.addStyleTag({ content: "html { overflow-y: scroll !important; }" });

  const sectionIds = await page.locator("section[id]").evaluateAll(nodes =>
    nodes.map(node => node.id),
  );

  for (const id of sectionIds) {
    const target = join(OUT_DIR, `${id.replace(/^section-/, "")}.png`);

    // Photograph each section alone.
    //
    // An element screenshot clips at the element's bounding box, and glyphs
    // are rasterised against their position in the viewport. While every
    // section shares one tall page, that position depends on how much content
    // sits above — so adding a single row to the CLM section shifted two
    // untouched baselines by a pixel and dragged them into the diff, one of
    // them by 12,601 pixels. Hiding the siblings puts every section at the
    // same content-independent offset, so a section's capture can only change
    // when that section changes.
    await page.evaluate(visible => {
      for (const node of document.querySelectorAll<HTMLElement>("section[id]")) {
        node.style.display = node.id === visible ? "" : "none";
      }
      window.scrollTo(0, 0);
    }, id);

    // `animations: "disabled"` rewinds CSS animations to their first frame
    // rather than catching them mid-flight — without it the spinner lands on
    // a different rotation phase every run and feedback.png drifts forever.
    await page.locator(`#${id}`).screenshot({ path: target, animations: "disabled" });
    console.log(`captured ${target}`);
  }

  await page.evaluate(() => {
    for (const node of document.querySelectorAll<HTMLElement>("section[id]")) {
      node.style.display = "";
    }
  });
} finally {
  await browser.close();
  server.stop();
}
