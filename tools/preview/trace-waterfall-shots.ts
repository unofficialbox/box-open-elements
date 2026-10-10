/** Rendered waterfall contract checks and four-view component baselines. */
import { chromium, type Browser } from "playwright-core";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { applyDeterministicFonts, blockRemoteFonts } from "./deterministic-fonts.js";

const ROOT = new URL("../..", import.meta.url).pathname;
const OUT = process.env.TRACE_WATERFALL_OUT_DIR ?? join(ROOT, "docs/screenshots/trace-waterfall");
const PORT = 4602;
const server = Bun.spawn(["bun", join(ROOT, "docs-site/server.ts")], { env: { ...process.env, PORT: String(PORT) }, stdout: "pipe", stderr: "inherit" });
let browser: Browser | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
try {
  const reader = server.stdout.getReader();
  const ready = (async () => { let banner = ""; const decoder = new TextDecoder(); while (!banner.includes("docs site on")) { const { done, value } = await reader.read(); if (done) throw new Error("Docs server exited before ready"); banner += decoder.decode(value); } })();
  await Promise.race([ready, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Docs server did not become ready")), 20000); })]);
  clearTimeout(timer);
  mkdirSync(OUT, { recursive: true });
  browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ?? (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined), args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 940 } });
  await blockRemoteFonts(page);
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://localhost:${PORT}/#patterns/trace-waterfall`, { waitUntil: "networkidle" });
  await page.waitForSelector('body[data-route-ready="patterns/trace-waterfall"]');
  await applyDeterministicFonts(page);
  await page.addScriptTag({ path: join(ROOT, "node_modules/axe-core/axe.min.js") });
  const trace = page.locator("box-trace-waterfall");
  const checkAxe = async (label: string): Promise<void> => {
    const violations = await trace.evaluate(async element => {
      const axe = (window as typeof window & { axe: { run(context: Element): Promise<{ violations: Array<{ id: string; nodes: Array<{ target: string[] }> }> }> } }).axe;
      return (await axe.run(element)).violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }));
    });
    if (violations.length) throw new Error(`${label}: axe ${JSON.stringify(violations)}`);
  };
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 940 });
    for (const theme of ["light", "dark"]) {
      await page.evaluate(target => { if (document.documentElement.dataset.theme !== target) document.getElementById("theme-toggle")?.click(); }, theme);
      await page.waitForSelector(`html[data-theme="${theme}"]`);
      await trace.evaluate((element, targetWidth) => { (element as HTMLElement).style.width = targetWidth === 390 ? "340px" : ""; }, width);
      await checkAxe(`${width} ${theme} treegrid`);
      const geometry = await trace.evaluate(element => {
        const root = element.shadowRoot!;
        return { overflow: element.scrollWidth - element.clientWidth, rows: Array.from(root.querySelectorAll<HTMLElement>('[part="row"]')).map(row => {
          const track = row.querySelector<HTMLElement>('[part="track"]')!.getBoundingClientRect();
          const bar = row.querySelector<HTMLElement>('[part="bar"]')!.getBoundingClientRect();
          const marker = row.querySelector<HTMLElement>('[part="marker"]')?.getBoundingClientRect();
          return { id: row.dataset.spanId, start: (bar.left - track.left) / track.width, size: bar.width / track.width, marker: marker ? (marker.left - track.left) / track.width : null };
        }) };
      });
      const upload = geometry.rows.find(row => row.id === "upload")!;
      const parallel = geometry.rows.find(row => row.id === "metadata")!;
      if (geometry.overflow > 1 || Math.abs(upload.start - 180 / 1400) > .005 || Math.abs(upload.size - 587 / 1400) > .005 || Math.abs(upload.marker! - 1050 / 1400) > .005 || Math.abs(parallel.start - 250 / 1400) > .005) throw new Error(`${width} ${theme} shared axis/overflow failed: ${JSON.stringify(geometry)}`);
      await trace.screenshot({ path: join(OUT, `waterfall-${width}-${theme}.png`), animations: "disabled" });
      await trace.locator('[part="table-toggle"]').click();
      await checkAxe(`${width} ${theme} table`);
      if (await trace.evaluate(element => element.scrollWidth - element.clientWidth > 1)) throw new Error(`${width} ${theme} table overflows`);
      await trace.screenshot({ path: join(OUT, `table-${width}-${theme}.png`), animations: "disabled" });
      await trace.locator('[part="table-toggle"]').click();
    }
  }
  const rows = trace.locator('[part="row"]');
  await rows.first().focus();
  await rows.first().press("ArrowLeft");
  if (await rows.count() !== 1) throw new Error("ArrowLeft did not collapse root");
  await rows.first().press("ArrowRight");
  await rows.first().press("ArrowRight");
  await rows.nth(1).press("ArrowDown");
  await rows.nth(2).press("Enter");
  if (await trace.getAttribute("selected-span-id") !== "upload") throw new Error("Keyboard selection failed");
  await checkAxe("Selected details");
  await trace.locator('[part="close-details"]').press("Escape");
  const focused = await trace.evaluate(element => element.shadowRoot?.activeElement?.getAttribute("data-span-id"));
  if (focused !== "upload") throw new Error("Escape did not restore selected row focus");
  await trace.getByLabel("Search spans").fill("files.upload");
  if (await rows.count() !== 2) throw new Error("Search did not retain matched ancestors");
  await trace.getByLabel("Search spans").fill("");
  await trace.locator('[part="system-toggle"]').click();
  if (await rows.count() !== 6) throw new Error("System spans were not revealed");
  await trace.locator('[part="system-toggle"]').click();
  await trace.locator('[part="fullscreen-toggle"]').click();
  await trace.locator("dialog[open]").waitFor();
  await checkAxe("Expanded modal");
  await trace.locator('[part="fullscreen-toggle"]').press("Escape");
  if (await trace.locator("dialog").count()) throw new Error("Expanded view did not close");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await rows.nth(2).focus();
  await trace.evaluate(element => {
    const live = element as HTMLElement & { nowMs: number; spans: Array<{ id: string; parentId?: string; label: string; kind: string; startMs: number; durationMs: number; status: "running" | "ok" | "failed" | "skipped" }> };
    live.nowMs = 2000;
    live.spans = [...live.spans.map(span => span.id === "upload" ? { ...span, status: "running" as const, durationMs: 0 } : span), { id: "later", parentId: "run", label: "New live span", kind: "Action", startMs: 1900, durationMs: 100, status: "ok" }];
  });
  const liveState = await trace.evaluate(element => {
    const bar = element.shadowRoot!.querySelector('[data-span-id="upload"] [part="bar"]')!;
    return { focused: element.shadowRoot!.activeElement?.getAttribute("data-span-id"), animation: getComputedStyle(bar).animationName, transition: getComputedStyle(bar).transitionDuration, text: element.shadowRoot!.textContent };
  });
  if (liveState.focused !== "upload" || liveState.animation !== "none" || liveState.transition !== "0s" || !liveState.text?.includes("New live span")) throw new Error(`Live/reduced-motion failed: ${JSON.stringify(liveState)}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join("; ")}`);
  console.log("verified waterfall/table shared axis, markers, overlap, 1440/390 light/dark axe, keyboard, search/system, modal, live focus and reduced motion");
} finally {
  clearTimeout(timer); await browser?.close(); server.kill();
}
