/**
 * Captures docs-site screenshots into docs/screenshots/docs-site/.
 *
 * Usage: bun run build && bun tools/preview/docs-site-shots.ts
 */
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname;
const OUT_DIR = join(ROOT, "docs/screenshots/docs-site");
const PORT = 4601;

const server = Bun.spawn(["bun", join(ROOT, "docs-site/server.ts")], {
  env: { ...process.env, PORT: String(PORT) },
  stdout: "pipe",
  stderr: "inherit",
});

// Wait for the server banner
const reader = server.stdout.getReader();
const decoder = new TextDecoder();
let banner = "";
while (!banner.includes("docs site on")) {
  const { value, done } = await reader.read();
  if (done) break;
  banner += decoder.decode(value);
}

mkdirSync(OUT_DIR, { recursive: true });

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
const browser = await chromium.launch({
  executablePath,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-device-scale-factor=2"],
});

const routes: Array<[string, string]> = [
  ["components-button", "#components/button"],
  ["components-forms", "#components/multi-select"],
  ["patterns-content-explorer", "#patterns/content-explorer"],
  ["patterns-share-panel", "#patterns/share-panel"],
  ["foundations-tokens", "#foundations/tokens"],
  ["foundations-icons", "#foundations/icons"],
];

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  page.on("pageerror", error => {
    console.error(`[pageerror] ${error.stack ?? error.message}`);
    process.exitCode = 1;
  });
  page.on("console", message => {
    if (message.type() === "error") console.error(`[page] ${message.text()}`);
  });

  for (const [name, hash] of routes) {
    await page.goto(`http://localhost:${PORT}/${hash}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(OUT_DIR, `${name}.png`) });
    console.log(`captured ${name}.png`);
  }
} finally {
  await browser.close();
  server.kill();
}
