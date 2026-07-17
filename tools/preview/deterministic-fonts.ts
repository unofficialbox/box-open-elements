/**
 * Font determinism for the screenshot pipeline.
 *
 * Screenshots must render identically in this sandbox and in CI for a
 * pixel-diff gate to be meaningful. The capture pipeline embeds the same
 * pinned Inter Variable WOFF2 that the docs site ships. Only developer-facing
 * monospace regions use committed DejaVu Sans Mono.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { Page } from "playwright-core";

const FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), "fonts");
const INTER_FONT_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../docs-site/fonts");

const dataUri = (directory: string, file: string, mimeType: string): string => {
  const base64 = readFileSync(join(directory, file)).toString("base64");
  return `data:${mimeType};base64,${base64}`;
};

/** Pinned Inter faces plus a monospace override for developer tooling. */
export const deterministicFontCss = (): string => {
  const inter = dataUri(INTER_FONT_DIR, "InterVariable.woff2", "font/woff2");
  const mono = dataUri(FONT_DIR, "DejaVuSansMono.ttf", "font/ttf");

  return [
    `@font-face { font-family: "InterVariable"; font-weight: 100 900; font-style: normal; src: url("${inter}") format("woff2"); }`,
    `@font-face { font-family: "Inter"; font-weight: 100 900; font-style: normal; src: url("${inter}") format("woff2"); }`,
    `@font-face { font-family: "BOEMono"; src: url("${mono}") format("truetype"); }`,
    // Force the monospace regions of the docs chrome onto the bundled mono face
    // (page-level rules do not pierce shadow DOM, but the code blocks live in
    // light DOM). The Inter @font-face definitions DO reach shadow DOM.
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
