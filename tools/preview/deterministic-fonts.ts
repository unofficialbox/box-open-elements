/**
 * Font determinism for the screenshot pipeline.
 *
 * Screenshots must render identically in this sandbox and in CI for a
 * pixel-diff gate to be meaningful. Two things break that: the docs-site loads
 * InterVariable from a CDN (reachable in CI, blocked here), and un-mapped
 * fallbacks resolve to whatever sans the environment happens to have.
 *
 * So the capture pipeline blocks all remote fonts and maps the entire sans
 * fallback chain (plus a forced monospace family) to committed DejaVu files
 * embedded as data: URIs. Inter stays the real runtime font for users — only
 * screenshot rendering is pinned. DejaVu is redistributable (see fonts/LICENSE).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { Page } from "playwright-core";

const FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), "fonts");

const dataUri = (file: string): string => {
  const base64 = readFileSync(join(FONT_DIR, file)).toString("base64");
  return `data:font/ttf;base64,${base64}`;
};

// The sans families named anywhere in the token stacks / gallery markup, all
// mapped to the same committed face so the first-available family is stable.
const SANS_FAMILIES = ["InterVariable", "Inter", "Lato", "Helvetica Neue", "Helvetica", "Arial"];

/** `@font-face` + monospace-override CSS pinning fonts to the bundled DejaVu. */
export const deterministicFontCss = (): string => {
  const sans = dataUri("DejaVuSans.ttf");
  const sansBold = dataUri("DejaVuSans-Bold.ttf");
  const mono = dataUri("DejaVuSansMono.ttf");

  const sansFaces = SANS_FAMILIES.flatMap(family => [
    `@font-face { font-family: "${family}"; font-weight: 100 500; font-style: normal; src: url("${sans}") format("truetype"); }`,
    `@font-face { font-family: "${family}"; font-weight: 600 900; font-style: normal; src: url("${sansBold}") format("truetype"); }`,
  ]);

  return [
    ...sansFaces,
    `@font-face { font-family: "BOEMono"; src: url("${mono}") format("truetype"); }`,
    // Force the monospace regions of the docs chrome onto the bundled mono face
    // (page-level rules do not pierce shadow DOM, but the code blocks live in
    // light DOM). The @font-face maps above DO reach shadow DOM.
    `pre, code, kbd, samp, .code-block, .code-line, .page-tag { font-family: "BOEMono", monospace !important; }`,
  ].join("\n");
};

/** Abort every remote font request so nothing but the injected faces load. */
export const blockRemoteFonts = async (page: Page): Promise<void> => {
  await page.route("**/*", route => {
    if (route.request().resourceType() === "font") {
      return route.abort();
    }
    return route.continue();
  });
};

/**
 * Apply the deterministic font environment to a page: block remote fonts,
 * inject the pinned faces, and wait for them to be ready. Call after the page
 * has rendered but before screenshotting.
 */
export const applyDeterministicFonts = async (page: Page): Promise<void> => {
  await page.addStyleTag({ content: deterministicFontCss() });
  await page.evaluate(() => (document as unknown as { fonts: FontFaceSet }).fonts.ready);
};
