/**
 * Captures preview-gallery screenshots into docs/screenshots/gallery/.
 *
 * Usage: bun run build && bun tools/preview/capture.ts
 *
 * Serves the repo root statically so /dist/index.js resolves, loads
 * tools/preview/gallery.html and tools/preview/state-matrix.html in headless
 * Chromium, waits for their deterministic ready markers, then screenshots
 * catalog sections and explicit interaction states.
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

  const sections = await page.locator("section[id]").all();
  for (const section of sections) {
    const id = await section.getAttribute("id");
    const target = join(OUT_DIR, `${id!.replace(/^section-/, "")}.png`);
    await section.screenshot({ path: target });
    console.log(`captured ${target}`);
  }

  await page.goto(`http://localhost:${PORT}/tools/preview/state-matrix.html`, { waitUntil: "networkidle" });
  await page.waitForSelector('body[data-state-matrix-ready="true"]', { timeout: 15_000 });
  await applyDeterministicFonts(page);
  await page.waitForTimeout(150);

  const stateSections = await page.locator("section[data-state-section]").all();
  for (const section of stateSections) {
    const stateName = await section.getAttribute("data-state-section");
    const target = join(OUT_DIR, `states-${stateName}.png`);
    await section.screenshot({ path: target });
    console.log(`captured ${target}`);
  }

  const actionsSection = page.locator('[data-state-section="actions"]');
  const transientButton = page.locator("#transient-button").locator('[part="button"]');
  await transientButton.hover();
  await page.waitForTimeout(250); // settle the shared 140ms interactive transition
  await actionsSection.screenshot({ path: join(OUT_DIR, "states-actions-hover.png") });
  await transientButton.focus();
  await page.mouse.move(1140, 880);
  await page.waitForTimeout(250); // settle hover-out and focus-visible transitions
  await actionsSection.screenshot({ path: join(OUT_DIR, "states-actions-focus.png") });

  const rowsSection = page.locator('[data-state-section="rows"]');
  const transientRow = page.locator("#transient-row").locator('[part="item"]');
  await transientRow.hover();
  await page.waitForTimeout(250); // settle the shared 140ms interactive transition
  await rowsSection.screenshot({ path: join(OUT_DIR, "states-rows-hover.png") });
  await transientRow.focus();
  await page.mouse.move(1140, 880);
  await page.waitForTimeout(250); // settle hover-out and focus-visible transitions
  await rowsSection.screenshot({ path: join(OUT_DIR, "states-rows-focus.png") });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: join(OUT_DIR, "states-mobile.png"), fullPage: true });
  console.log(`captured ${join(OUT_DIR, "states-mobile.png")}`);
} finally {
  await browser.close();
  server.stop();
}
