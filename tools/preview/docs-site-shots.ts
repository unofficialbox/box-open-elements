/**
 * Captures docs-site screenshots into docs/screenshots/docs-site/.
 *
 * Usage: bun run build && bun tools/preview/docs-site-shots.ts
 */
import { chromium, type Browser, type Page } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { applyDeterministicFonts, blockRemoteFonts } from "./deterministic-fonts.js";

/** Sandbox chromium if present, else let playwright-core resolve its install (CI). */
const chromiumExecutablePath = (): string | undefined => {
  if (process.env.PLAYWRIGHT_CHROMIUM_PATH) return process.env.PLAYWRIGHT_CHROMIUM_PATH;
  return existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined;
};

const ROOT = new URL("../..", import.meta.url).pathname;
const OUT_DIR = process.env.DOCS_SHOTS_OUT_DIR ?? join(ROOT, "docs/screenshots/docs-site");
const PORT = 4601;
const BANNER_TIMEOUT_MS = 20_000;
const SETTLE_INTERVAL_MS = 250;
const SETTLE_ATTEMPTS = 24;

/**
 * Wait until two consecutive frames are byte-identical.
 *
 * A route's ready marker says it rendered, not that it finished moving. The
 * agent-chat demo streams its reply on a timer, so a shot taken at the ready
 * marker lands wherever the stream happens to have reached — two runs of the
 * *same commit* produced baselines differing by 43,000 pixels, one caught
 * mid-sentence with the caret showing. Comparing frames is route-agnostic, so
 * it also covers whichever asynchronous demo is added next.
 *
 * Frames are compared with animations disabled, matching how the real shot is
 * taken; otherwise a spinner would keep the page looking unsettled forever.
 */
const waitForVisualSettle = async (page: Page, label: string): Promise<void> => {
  let previous = await page.screenshot({ animations: "disabled" });
  for (let attempt = 0; attempt < SETTLE_ATTEMPTS; attempt += 1) {
    await page.waitForTimeout(SETTLE_INTERVAL_MS);
    const current = await page.screenshot({ animations: "disabled" });
    if (current.equals(previous)) {
      return;
    }
    previous = current;
  }
  // Capture anyway rather than failing the run: a genuinely unsettleable page
  // is a baseline problem to diagnose, not a reason to produce no shots.
  console.warn(`[settle] ${label} never stabilised in ${String(SETTLE_ATTEMPTS)} frames`);
};

const routes: Array<[name: string, hash: string, readyMarker: string, scrollTo?: string]> = [
  ["home", "#home", "home/home"],
  ["components-button", "#components/button", "components/button"],
  ["components-forms", "#components/multi-select", "components/multi-select"],
  ["components-chip", "#components/chip", "components/chip"],
  ["components-divider", "#components/divider", "components/divider"],
  ["components-calendar", "#components/calendar", "components/calendar"],
  ["components-tag-input", "#components/tag-input", "components/tag-input"],
  ["patterns-content-explorer", "#patterns/content-explorer", "patterns/content-explorer"],
  ["patterns-content-picker", "#patterns/content-picker", "patterns/content-picker"],
  ["patterns-content-uploader", "#patterns/content-uploader", "patterns/content-uploader"],
  ["patterns-content-sidebar", "#patterns/content-sidebar", "patterns/content-sidebar"],
  ["patterns-form-wizard", "#patterns/form-wizard", "patterns/form-wizard"],
  ["patterns-wizard-summary", "#patterns/wizard-summary", "patterns/wizard-summary"],
  ["patterns-timeline", "#patterns/timeline", "patterns/timeline"],
  ["patterns-diff-viewer", "#patterns/diff-viewer", "patterns/diff-viewer"],
  ["patterns-work-queue", "#patterns/work-queue", "patterns/work-queue"],
  ["patterns-workload-board", "#patterns/workload-board", "patterns/workload-board"],
  ["patterns-version-list", "#patterns/version-list", "patterns/version-list"],
  ["patterns-version-graph", "#patterns/version-graph", "patterns/version-graph"],
  ["patterns-lineage-graph", "#patterns/lineage-graph", "patterns/lineage-graph"],
  ["patterns-provenance-strip", "#patterns/provenance-strip", "patterns/provenance-strip"],
  ["patterns-agent-chat", "#patterns/agent-chat", "patterns/agent-chat"],
  ["patterns-audit-log", "#patterns/audit-log", "patterns/audit-log"],
  ["patterns-activity-density", "#patterns/activity-density", "patterns/activity-density"],
  ["patterns-notification-bell", "#patterns/notification-bell", "patterns/notification-bell"],
  ["patterns-notification-inbox", "#patterns/notification-inbox", "patterns/notification-inbox"],
  ["components-command-palette", "#components/command-palette", "components/command-palette"],
  ["components-shortcuts-overlay", "#components/shortcuts-overlay", "components/shortcuts-overlay"],
  ["components-stage-path", "#components/stage-path", "components/stage-path"],
  ["components-due-badge", "#components/due-badge", "components/due-badge"],
  ["lessons-share", "#lessons/share", "lessons/share", ".lesson-frameworks"],
  ["lessons-explorer-step", "#lessons/explorer", "lessons/explorer", "#step-0"],
  ["lessons-intake", "#lessons/intake", "lessons/intake", "#step-5"],
  ["patterns-share-panel", "#patterns/share-panel", "patterns/share-panel"],
  ["foundations-tokens", "#foundations/tokens", "foundations/tokens"],
  ["foundations-theming", "#foundations/theming", "foundations/theming"],
  ["foundations-geometry", "#foundations/geometry", "foundations/geometry"],
  ["foundations-motion", "#foundations/motion", "foundations/motion"],
  ["foundations-icons", "#foundations/icons", "foundations/icons"],
  ["foundations-accessibility", "#foundations/accessibility", "foundations/accessibility"],
  ["foundations-brand", "#foundations/brand", "foundations/brand"],
];

const server = Bun.spawn(["bun", join(ROOT, "docs-site/server.ts")], {
  env: { ...process.env, PORT: String(PORT) },
  stdout: "pipe",
  stderr: "inherit",
});

const waitForBanner = async (): Promise<void> => {
  const reader = server.stdout.getReader();
  const decoder = new TextDecoder();
  let banner = "";
  const read = (async () => {
    while (!banner.includes("docs site on")) {
      const { value, done } = await reader.read();
      if (done) throw new Error("docs-site server exited before becoming ready");
      banner += decoder.decode(value);
    }
  })();
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(`docs-site server not ready within ${BANNER_TIMEOUT_MS}ms`)), BANNER_TIMEOUT_MS);
  });
  const exited = server.exited.then(code => {
    throw new Error(`docs-site server exited early (code ${code})`);
  });
  await Promise.race([read, timeout, exited]);
};

let browser: Browser | null = null;

try {
  await waitForBanner();
  mkdirSync(OUT_DIR, { recursive: true });

  browser = await chromium.launch({
    executablePath: chromiumExecutablePath(),
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-device-scale-factor=2"],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  await blockRemoteFonts(page);
  page.on("pageerror", error => {
    console.error(`[pageerror] ${error.stack ?? error.message}`);
    process.exitCode = 1;
  });
  page.on("console", message => {
    // Aborted remote fonts surface as resource-load errors — expected, not a failure.
    if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
      console.error(`[page] ${message.text()}`);
      process.exitCode = 1;
    }
  });

  for (const [name, hash, readyMarker, scrollTo] of routes) {
    await page.goto(`http://localhost:${PORT}/${hash}`, { waitUntil: "networkidle" });
    await page.waitForSelector(`body[data-route-ready="${readyMarker}"]`, { timeout: 15_000 });
    await applyDeterministicFonts(page);
    // A hash-only goto does not reload, so scroll persists between routes.
    // Reset it so each shot is independent of the order they run in.
    await page.evaluate(() => window.scrollTo(0, 0));
    // Shots are viewport-sized; a route may name a selector to bring into view
    // so a section further down the page is the one under test.
    if (scrollTo) {
      await page.locator(scrollTo).first().scrollIntoViewIfNeeded({ timeout: 15_000 });
    }
    await page.waitForTimeout(150);
    await waitForVisualSettle(page, name);
    // Rewind CSS animations to their first frame; otherwise anything spinning
    // on the page is caught at an arbitrary phase and the baseline drifts.
    await page.screenshot({ path: join(OUT_DIR, `${name}.png`), animations: "disabled" });
    console.log(`captured ${name}.png`);
  }

  // Dark-theme pass: toggle dark, then capture a component page and a foundations page.
  const darkRoutes: Array<[string, string, string]> = [
    ["components-button-dark", "#components/button", "components/button"],
    ["foundations-tokens-dark", "#foundations/tokens", "foundations/tokens"],
  ];
  for (const [name, hash, readyMarker] of darkRoutes) {
    await page.goto(`http://localhost:${PORT}/${hash}`, { waitUntil: "networkidle" });
    await page.waitForSelector(`body[data-route-ready="${readyMarker}"]`, { timeout: 15_000 });
    await page.evaluate(() => {
      if (document.documentElement.dataset.theme !== "dark") {
        (document.getElementById("theme-toggle") as HTMLButtonElement | null)?.click();
      }
    });
    await page.waitForSelector('html[data-theme="dark"]', { timeout: 5_000 });
    await applyDeterministicFonts(page);
    await page.waitForTimeout(200);
    await waitForVisualSettle(page, name);
    await page.screenshot({ path: join(OUT_DIR, `${name}.png`), animations: "disabled" });
    console.log(`captured ${name}.png`);
  }
} finally {
  await browser?.close();
  server.kill();
}
