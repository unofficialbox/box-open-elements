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
const BOX_PLOT_ONLY = process.argv.includes("--box-plot-only");
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
  ["components-grid", "#components/grid", "components/grid"],
  ["components-calendar", "#components/calendar", "components/calendar"],
  ["components-tag-input", "#components/tag-input", "components/tag-input"],
  ["patterns-content-explorer", "#patterns/content-explorer", "patterns/content-explorer"],
  ["patterns-call-console", "#patterns/call-console", "patterns/call-console"],
  ["patterns-flow-builder", "#patterns/flow-builder", "patterns/flow-builder"],
  ["patterns-content-picker", "#patterns/content-picker", "patterns/content-picker"],
  ["patterns-content-uploader", "#patterns/content-uploader", "patterns/content-uploader"],
  ["patterns-content-sidebar", "#patterns/content-sidebar", "patterns/content-sidebar"],
  ["patterns-form-wizard", "#patterns/form-wizard", "patterns/form-wizard"],
  ["patterns-wizard-summary", "#patterns/wizard-summary", "patterns/wizard-summary"],
  ["patterns-timeline", "#patterns/timeline", "patterns/timeline"],
  ["patterns-diff-viewer", "#patterns/diff-viewer", "patterns/diff-viewer"],
  ["patterns-compare-view", "#patterns/compare-view", "patterns/compare-view"],
  ["patterns-work-queue", "#patterns/work-queue", "patterns/work-queue"],
  ["patterns-workload-board", "#patterns/workload-board", "patterns/workload-board"],
  ["patterns-version-list", "#patterns/version-list", "patterns/version-list"],
  ["patterns-version-graph", "#patterns/version-graph", "patterns/version-graph"],
  ["patterns-lineage-graph", "#patterns/lineage-graph", "patterns/lineage-graph"],
  ["patterns-provenance-strip", "#patterns/provenance-strip", "patterns/provenance-strip"],
  ["patterns-signature-ceremony", "#patterns/signature-ceremony", "patterns/signature-ceremony"],
  ["patterns-run-trace", "#patterns/run-trace", "patterns/run-trace"],
  ["patterns-box-plot", "#patterns/box-plot", "patterns/box-plot"],
  ["patterns-agent-chat", "#patterns/agent-chat", "patterns/agent-chat"],
  ["patterns-audit-log", "#patterns/audit-log", "patterns/audit-log"],
  ["patterns-activity-density", "#patterns/activity-density", "patterns/activity-density"],
  ["patterns-comment-thread", "#patterns/comment-thread", "patterns/comment-thread"],
  ["patterns-annotation-thread", "#patterns/annotation-thread", "patterns/annotation-thread"],
  ["patterns-notification-bell", "#patterns/notification-bell", "patterns/notification-bell"],
  ["patterns-notification-inbox", "#patterns/notification-inbox", "patterns/notification-inbox"],
  ["components-command-palette", "#components/command-palette", "components/command-palette"],
  ["components-shortcuts-overlay", "#components/shortcuts-overlay", "components/shortcuts-overlay"],
  ["components-path", "#components/path", "components/path"],
  ["components-toast", "#components/toast", "components/toast"],
  ["components-alert", "#components/alert", "components/alert"],
  ["components-nudge", "#components/nudge", "components/nudge"],
  ["components-due-badge", "#components/due-badge", "components/due-badge"],
  ["components-formatted-date", "#components/formatted-date", "components/formatted-date"],
  ["components-indicator", "#components/indicator", "components/indicator"],
  ["components-resource-row", "#components/resource-row", "components/resource-row"],
  ["components-verdict-banner", "#components/verdict-banner", "components/verdict-banner"],
  ["components-mode-indicator", "#components/mode-indicator", "components/mode-indicator"],
  ["components-tile-group", "#components/tile-group", "components/tile-group"],
  ["components-code-block", "#components/code-block", "components/code-block"],
  ["components-formatted-file-size", "#components/formatted-file-size", "components/formatted-file-size"],
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
    if (BOX_PLOT_ONLY && name !== "patterns-box-plot") continue;
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

  if (!BOX_PLOT_ONLY) {
  // The trace spine must follow the visible glyph for both density presets,
  // including a host-customized marker column inside a narrow embed.
  await page.goto(`http://localhost:${PORT}/#patterns/run-trace`, { waitUntil: "networkidle" });
  await page.waitForSelector('body[data-route-ready="patterns/run-trace"]', { timeout: 15_000 });
  await applyDeterministicFonts(page);
  const traceGeometry = () => page.locator("box-run-trace").evaluate(element => {
    const steps = Array.from(element.shadowRoot!.querySelectorAll<HTMLElement>('[part="step"]'));
    const segments = steps.slice(0, -1).map((step, index) => {
      const marker = step.querySelector<SVGElement>('[part="marker"] svg')!;
      const nextMarker = steps[index + 1]!.querySelector<SVGElement>('[part="marker"] svg')!;
      const stepRect = step.getBoundingClientRect();
      const markerRect = marker.getBoundingClientRect();
      const connector = getComputedStyle(step, "::after");
      const connectorCenter = stepRect.left + parseFloat(connector.left) + parseFloat(connector.width) / 2;
      const markerCenter = markerRect.left + markerRect.width / 2;
      return {
        centerError: Math.abs(markerCenter - connectorCenter),
        startGap: stepRect.top + parseFloat(connector.top) - markerRect.bottom,
        endGap: nextMarker.getBoundingClientRect().top - (stepRect.bottom - parseFloat(connector.bottom)),
      };
    });
    return {
      rowHeight: steps[0]!.getBoundingClientRect().height,
      segments,
      lastConnector: getComputedStyle(steps.at(-1)!, "::after").content,
      hostOverflow: element.scrollWidth > element.clientWidth,
    };
  });
  const assertTraceGeometry = (geometry: Awaited<ReturnType<typeof traceGeometry>>, label: string): void => {
    if (geometry.hostOverflow || geometry.lastConnector !== "none" || geometry.segments.length === 0 ||
      geometry.segments.some(segment => segment.centerError > 1 || segment.startGap < -1 || segment.startGap > 5 || segment.endGap < -1 || segment.endGap > 9)) {
      throw new Error(`Run trace geometry failed for ${label}: ${JSON.stringify(geometry)}`);
    }
  };
  const defaultTrace = await traceGeometry();
  assertTraceGeometry(defaultTrace, "default desktop");
  await page.locator("#variant-select").selectOption("2");
  await waitForVisualSettle(page, "patterns-run-trace-compact");
  const compactTrace = await traceGeometry();
  assertTraceGeometry(compactTrace, "compact desktop");
  if (compactTrace.rowHeight >= defaultTrace.rowHeight) {
    throw new Error(`Compact run trace geometry failed at desktop: ${JSON.stringify({ defaultTrace, compactTrace })}`);
  }
  await page.screenshot({ path: join(OUT_DIR, "patterns-run-trace-compact.png"), animations: "disabled" });
  console.log("captured patterns-run-trace-compact.png");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("box-run-trace").evaluate(element => { (element as HTMLElement).style.width = "340px"; });
  await waitForVisualSettle(page, "patterns-run-trace-compact-mobile");
  const narrowTrace = await traceGeometry();
  assertTraceGeometry(narrowTrace, "compact mobile");
  await page.locator("box-run-trace").screenshot({ path: join(OUT_DIR, "patterns-run-trace-compact-mobile.png"), animations: "disabled" });
  console.log("captured patterns-run-trace-compact-mobile.png");

  await page.locator("box-run-trace").evaluate(element => {
    const trace = element as HTMLElement;
    trace.style.setProperty("--boe-run-trace-marker-column-width", "1.4rem");
    trace.style.setProperty("--boe-run-trace-marker-size", "1.15rem");
    trace.style.setProperty("--boe-run-trace-step-row-gap", "0.2rem");
  });
  await page.waitForTimeout(250);
  const customizedTrace = await traceGeometry();
  assertTraceGeometry(customizedTrace, "custom compact mobile");
  await page.locator("box-run-trace").locator('[part="toggle"]').first().click();
  assertTraceGeometry(await traceGeometry(), "expanded custom compact mobile");
  await page.locator("box-run-trace").evaluate(element => { element.setAttribute("density", "default"); });
  assertTraceGeometry(await traceGeometry(), "default after density toggle");
  await page.locator("box-run-trace").evaluate(element => { element.setAttribute("density", "compact"); });
  assertTraceGeometry(await traceGeometry(), "compact after density toggle");
  await page.evaluate(() => (document.getElementById("theme-toggle") as HTMLButtonElement | null)?.click());
  await page.waitForSelector('html[data-theme="dark"]');
  assertTraceGeometry(await traceGeometry(), "dark custom compact mobile");
  console.log("verified run-trace marker and connector alignment at desktop and narrow width");
  // Plain traces retain their historical spacing, while honoring the same host
  // padding contract as panel traces at either density.
  for (const density of ["default", "compact"] as const) {
    for (const padding of [null, "3px"] as const) {
      await page.locator("box-run-trace").evaluate((element, settings) => {
        element.setAttribute("variant", "plain");
        element.setAttribute("density", settings.density);
        const style = (element as HTMLElement).style;
        if (settings.padding) style.setProperty("--boe-run-trace-step-padding-block", settings.padding);
        else style.removeProperty("--boe-run-trace-step-padding-block");
      }, { density, padding });
      const spacing = await page.locator('box-run-trace [part="step"]').first().evaluate(element => {
        const style = getComputedStyle(element);
        return { top: parseFloat(style.paddingTop), bottom: parseFloat(style.paddingBottom), rem: parseFloat(getComputedStyle(document.documentElement).fontSize) };
      });
      const expected = padding ? 3 : 0.35 * spacing.rem;
      if (Math.abs(spacing.top - expected) > 0.1 || Math.abs(spacing.bottom - expected) > 0.1) {
        throw new Error(`Plain run trace padding failed (${density}, ${padding ?? "default"}): ${JSON.stringify(spacing)}`);
      }
    }
  }
  console.log("verified plain run-trace default and host padding at both densities");
  await page.evaluate(() => (document.getElementById("theme-toggle") as HTMLButtonElement | null)?.click());
  await page.waitForSelector('html[data-theme="light"]');
  await page.setViewportSize({ width: 1440, height: 940 });
  // The modeler's world is absolutely positioned. When the hold is hidden,
  // grid auto-placement must not leave the canvas in the zero-height auto row.
  await page.goto(`http://localhost:${PORT}/#patterns/process-modeler`, { waitUntil: "networkidle" });
  await page.waitForSelector('body[data-route-ready="patterns/process-modeler"]', { timeout: 15_000 });
  for (const theme of ["light", "dark"]) {
    await page.evaluate(targetTheme => {
      if (document.documentElement.dataset.theme !== targetTheme) {
        (document.getElementById("theme-toggle") as HTMLButtonElement | null)?.click();
      }
    }, theme);
    await page.waitForSelector(`html[data-theme="${theme}"]`);
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 940 });
      const sizes = await page.locator("box-process-modeler").evaluate((element, viewportWidth) => {
        const modeler = element as HTMLElement & { setValidation(checks: Array<{ boxId: string; message: string }>): void };
        modeler.style.width = viewportWidth === 390 ? "340px" : "";
        const shadow = modeler.shadowRoot!;
        const canvas = shadow.querySelector<HTMLElement>('[part="canvas"]')!;
        const hold = shadow.querySelector<HTMLElement>('[part="hold"]')!;
        const boxId = shadow.querySelector('[data-box-id]')?.getAttribute("data-box-id") ?? "missing";
        const validHeight = canvas.getBoundingClientRect().height;
        modeler.setValidation([{ boxId, message: "Layout check" }]);
        const heldHeight = canvas.getBoundingClientRect().height;
        const holdHeight = hold.getBoundingClientRect().height;
        const holdGap = Math.abs(hold.getBoundingClientRect().bottom - canvas.getBoundingClientRect().top);
        modeler.setValidation([]);
        return { viewportWidth: innerWidth, hostWidth: modeler.getBoundingClientRect().width, validHeight, heldHeight, holdHeight, holdGap, restoredHeight: canvas.getBoundingClientRect().height, holdHidden: hold.hidden };
      }, width);
      if (sizes.viewportWidth !== width || (width === 390 && sizes.hostWidth > 350) || sizes.validHeight <= 80 || sizes.heldHeight <= 80 || Math.abs(sizes.restoredHeight - sizes.validHeight) > 2 || sizes.holdHeight <= 0 || sizes.holdGap > 2 || !sizes.holdHidden) {
        throw new Error(`Process modeler canvas layout failed in ${theme} at ${width}px: ${JSON.stringify(sizes)}`);
      }
    }
  }
  await page.setViewportSize({ width: 1440, height: 940 });
  console.log("verified process-modeler canvas at 1440px and 390px in light/dark (valid → held → valid)");

  // Dark-theme pass: toggle dark, then capture a component page and a foundations page.
  const darkRoutes: Array<[string, string, string]> = [
    ["patterns-call-console-dark", "#patterns/call-console", "patterns/call-console"],
    ["components-button-dark", "#components/button", "components/button"],
    ["components-verdict-banner-dark", "#components/verdict-banner", "components/verdict-banner"],
    ["foundations-tokens-dark", "#foundations/tokens", "foundations/tokens"],
  ];
  for (const [name, hash, readyMarker] of darkRoutes) {
    await page.goto(`http://localhost:${PORT}/${hash}`, { waitUntil: "networkidle" });
    await page.waitForSelector(`body[data-route-ready="${readyMarker}"]`, { timeout: 15_000 });
    await page.evaluate(() => window.scrollTo(0, 0));
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
  await page.setViewportSize({width:390,height:844});
  await page.goto(`http://localhost:${PORT}/#patterns/call-console`,{waitUntil:"networkidle"});
  await page.waitForSelector('body[data-route-ready="patterns/call-console"]');
  await applyDeterministicFonts(page);
  // Populated event details must not widen the docs inspector on narrow screens.
  const consoleSearch = page.locator("box-call-console").getByRole("searchbox");
  await consoleSearch.fill("no-such-call");
  await consoleSearch.fill("");
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) {
    throw new Error("Call-console mobile preview overflows after filtering");
  }
  await page.addStyleTag({content:".masthead{position:static!important}"});
  await waitForVisualSettle(page,"patterns-call-console-mobile");
  await page.locator("box-call-console").first().screenshot({path:join(OUT_DIR,"patterns-call-console-mobile.png"),animations:"disabled"});
  console.log("captured patterns-call-console-mobile.png");

  await page.goto(`http://localhost:${PORT}/#components/resource-row`,{waitUntil:"networkidle"});
  await page.waitForSelector('body[data-route-ready="components/resource-row"]');
  await applyDeterministicFonts(page);
  await waitForVisualSettle(page,"components-resource-row-mobile");
  await page.locator("box-resource-row").first().screenshot({path:join(OUT_DIR,"components-resource-row-mobile.png"),animations:"disabled"});
  console.log("captured components-resource-row-mobile.png");
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`http://localhost:${PORT}/#patterns/box-plot`, { waitUntil: "networkidle" });
  await page.waitForSelector('body[data-route-ready="patterns/box-plot"]');
  await page.evaluate(() => {
    if (document.documentElement.dataset.theme !== "light") document.getElementById("theme-toggle")?.click();
  });
  await applyDeterministicFonts(page);
  await page.addScriptTag({ path: join(ROOT, "node_modules/axe-core/axe.min.js") });
  const verifyBoxPlotAxe = async (label: string): Promise<void> => {
    const violations = await page.evaluate(async () => {
      const axe = (window as typeof window & { axe?: { run: (context: Element) => Promise<{ violations: Array<{ id: string; nodes: Array<{ target: string[] }> }> }> } }).axe;
      const chart = document.querySelector("box-box-plot");
      if (!axe || !chart) throw new Error("Box plot or axe missing");
      return (await axe.run(chart)).violations.map(violation => ({ id: violation.id, targets: violation.nodes.map(node => node.target) }));
    });
    if (violations.length) throw new Error(`${label} axe violations: ${JSON.stringify(violations)}`);
  };
  await verifyBoxPlotAxe("horizontal mobile light");
  await waitForVisualSettle(page, "patterns-box-plot-mobile");
  await page.locator("box-box-plot").screenshot({ path: join(OUT_DIR, "patterns-box-plot-mobile.png"), animations: "disabled" });
  await page.locator('box-box-plot [part="table-toggle"]').click();
  await verifyBoxPlotAxe("table mobile light");
  await page.locator('box-box-plot [part="table-toggle"]').click();
  const verifyBoxPlotTooltips = async (label: string): Promise<void> => {
    const marks = page.locator('box-box-plot [part="mark"]');
    for (let index = 0; index < await marks.count(); index += 1) {
      const mark = marks.nth(index);
      for (const mode of ["hover", "focus"] as const) {
        if (mode === "hover") await mark.hover();
        else await mark.press("ArrowRight");
        const geometry = await mark.locator('[part="detail"]').evaluate(detail => {
          const host = (detail.getRootNode() as ShadowRoot).host;
          const tooltip = detail.getBoundingClientRect();
          const bounds = host.getBoundingClientRect();
          return { visible: getComputedStyle(detail).display !== "none", left: tooltip.left, right: tooltip.right, hostLeft: bounds.left, hostRight: bounds.right };
        });
        if (!geometry.visible || geometry.left < geometry.hostLeft - 1 || geometry.right > geometry.hostRight + 1) {
          throw new Error(`${label} tooltip ${index} ${mode} overflows: ${JSON.stringify(geometry)}`);
        }
      }
    }
  };
  await verifyBoxPlotTooltips("horizontal mobile");
  await page.locator("#variant-select").selectOption("1");
  await verifyBoxPlotAxe("vertical mobile light");
  const boxPlotMetrics = await page.locator("box-box-plot").evaluate(element => {
    const mark = element.shadowRoot?.querySelector<HTMLElement>('[part="mark"]');
    const box = element.shadowRoot?.querySelector<HTMLElement>('[part="box"]');
    return {
      viewportWidth: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      candleRatio: box && mark ? box.getBoundingClientRect().width / mark.getBoundingClientRect().width : 0,
    };
  });
  if (boxPlotMetrics.documentWidth > boxPlotMetrics.viewportWidth || boxPlotMetrics.candleRatio < 0.28 || boxPlotMetrics.candleRatio > 0.4) {
    throw new Error(`Box plot mobile geometry failed: ${JSON.stringify(boxPlotMetrics)}`);
  }
  await verifyBoxPlotTooltips("vertical mobile");
  await page.locator("#variant-select").focus();
  await page.mouse.move(0, 0);
  await waitForVisualSettle(page, "patterns-box-plot-vertical-mobile");
  await page.locator("box-box-plot").screenshot({ path: join(OUT_DIR, "patterns-box-plot-vertical-mobile.png"), animations: "disabled" });
  await page.evaluate(() => document.getElementById("theme-toggle")?.click());
  await page.waitForSelector('html[data-theme="dark"]');
  await verifyBoxPlotAxe("vertical mobile dark");
  await waitForVisualSettle(page, "patterns-box-plot-vertical-mobile-dark");
  await page.locator("box-box-plot").screenshot({ path: join(OUT_DIR, "patterns-box-plot-vertical-mobile-dark.png"), animations: "disabled" });
  await page.locator("#variant-select").selectOption("0");
  await verifyBoxPlotAxe("horizontal mobile dark");
  await page.locator('box-box-plot [part="table-toggle"]').click();
  await verifyBoxPlotAxe("table mobile dark");
  await page.locator('box-box-plot [part="table-toggle"]').click();
  await page.setViewportSize({ width: 1440, height: 940 });
  for (const theme of ["light", "dark"] as const) {
    await page.evaluate(target => {
      if (document.documentElement.dataset.theme !== target) document.getElementById("theme-toggle")?.click();
    }, theme);
    await page.waitForSelector(`html[data-theme="${theme}"]`);
    for (const variant of ["0", "1"] as const) {
      await page.locator("#variant-select").selectOption(variant);
      await verifyBoxPlotAxe(`${variant === "0" ? "horizontal" : "vertical"} desktop ${theme}`);
    }
  }
  console.log("captured box-plot horizontal and vertical mobile fixtures");

  if (!BOX_PLOT_ONLY) {
  await page.setViewportSize({width:1440,height:940});
  await page.goto(`http://localhost:${PORT}/#patterns/agent-workspace`,{waitUntil:"networkidle"});
  await page.waitForSelector('body[data-route-ready="patterns/agent-workspace"]');
  await page.evaluate(() => {
    if (document.documentElement.dataset.theme !== "light") document.getElementById("theme-toggle")?.click();
  });
  await applyDeterministicFonts(page);
  await page.getByRole("button",{name:"Expand workspace",exact:true}).click();
  await waitForVisualSettle(page,"patterns-agent-workspace-wide");
  if (await page.locator("box-agent-workspace").evaluate(el=>el.clientWidth<1200)) throw new Error("Workspace desktop fixture is not wide enough");
  await page.screenshot({path:join(OUT_DIR,"patterns-agent-workspace-wide.png"),animations:"disabled"});
  await page.getByRole("button",{name:"Exit expanded view",exact:true}).click();
  await page.setViewportSize({width:390,height:844});
  await page.locator("box-agent-workspace").getByRole("button",{name:"Details",exact:true}).click();
  await page.getByRole("dialog",{name:"Conversation details"}).waitFor();
  await waitForVisualSettle(page,"patterns-agent-workspace-mobile");
  await page.locator("box-agent-workspace").screenshot({path:join(OUT_DIR,"patterns-agent-workspace-mobile.png"),animations:"disabled"});
  console.log("captured workspace wide and mobile fixtures");
  }
} finally {
  await browser?.close();
  server.kill();
}
