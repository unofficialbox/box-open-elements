/**
 * Captures docs-site screenshots into docs/screenshots/docs-site/.
 *
 * Usage: bun run build && bun tools/preview/docs-site-shots.ts
 */
import { chromium, type Browser } from "playwright-core";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("../..", import.meta.url).pathname;
const OUT_DIR = join(ROOT, "docs/screenshots/docs-site");
const PORT = 4601;
const BANNER_TIMEOUT_MS = 20_000;

const routes: Array<[string, string, string]> = [
  ["components-button", "#components/button", "components/button"],
  ["components-forms", "#components/multi-select", "components/multi-select"],
  ["patterns-content-explorer", "#patterns/content-explorer", "patterns/content-explorer"],
  ["patterns-share-panel", "#patterns/share-panel", "patterns/share-panel"],
  ["foundations-tokens", "#foundations/tokens", "foundations/tokens"],
  ["foundations-icons", "#foundations/icons", "foundations/icons"],
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

  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";
  browser = await chromium.launch({
    executablePath,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--force-device-scale-factor=2"],
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  page.on("pageerror", error => {
    console.error(`[pageerror] ${error.stack ?? error.message}`);
    process.exitCode = 1;
  });
  page.on("console", message => {
    if (message.type() === "error") {
      console.error(`[page] ${message.text()}`);
      process.exitCode = 1;
    }
  });

  for (const [name, hash, readyMarker] of routes) {
    await page.goto(`http://localhost:${PORT}/${hash}`, { waitUntil: "networkidle" });
    await page.waitForSelector(`body[data-route-ready="${readyMarker}"]`, { timeout: 15_000 });
    await page.waitForTimeout(150);
    await page.screenshot({ path: join(OUT_DIR, `${name}.png`) });
    console.log(`captured ${name}.png`);
  }
} finally {
  await browser?.close();
  server.kill();
}
