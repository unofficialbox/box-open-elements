/**
 * Screenshot render-health gate.
 *
 * Re-captures the gallery and docs-site screenshots into a temp directory
 * (through the deterministic-font pipeline the baselines were generated with),
 * then checks each fresh capture against the committed baseline in
 * docs/screenshots/**. The default gate is environment-independent:
 *
 *   1. capture succeeded (the capture scripts exit non-zero on page errors),
 *   2. the render is not blank / near-blank, and
 *   3. its dimensions match the baseline.
 *
 * Because the fonts are bundled, text *metrics* (and therefore layout and
 * dimensions) are identical across environments — only pixel anti-aliasing
 * differs between Chromium builds. So this gate catches crashes, blank/broken
 * renders, and layout collapse without the cross-environment fragility of a
 * pixel-perfect diff.
 *
 * Strict pixel diffing (`--pixel`) additionally compares pixels with pixelmatch
 * — only meaningful when baselines and this run share a rendering environment
 * (e.g. the pinned Playwright container; see the follow-up in docs-site.md).
 *
 * Usage: bun run test:regression            (render-health, CI)
 *        bun tools/preview/regression.ts --pixel   (strict, matched env only)
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const ROOT = new URL("../..", import.meta.url).pathname;
const TMP = join(ROOT, ".regression-tmp");
const DIFF_DIR = join(TMP, "diff");

const PIXEL = process.argv.includes("--pixel") || process.env.REGRESSION_PIXEL === "1";

// Render-health thresholds.
const MIN_INK_RATIO = 0.003; // at least 0.3% of pixels differ from the background
const DIMENSION_SLACK = 2; // px; absorbs sub-pixel layout rounding across Chromium builds
// Strict-pixel thresholds (--pixel only).
const PIXEL_THRESHOLD = 0.1;
const MAX_DIFF_RATIO = 0.005;

interface Target {
  name: string;
  baselineDir: string;
  freshDir: string;
  envVar: string;
  script: string;
}

const targets: Target[] = [
  {
    name: "gallery",
    baselineDir: join(ROOT, "docs/screenshots/gallery"),
    freshDir: join(TMP, "gallery"),
    envVar: "GALLERY_OUT_DIR",
    script: "tools/preview/capture.ts",
  },
  {
    name: "docs-site",
    baselineDir: join(ROOT, "docs/screenshots/docs-site"),
    freshDir: join(TMP, "docs-site"),
    envVar: "DOCS_SHOTS_OUT_DIR",
    script: "tools/preview/docs-site-shots.ts",
  },
];

const capture = async (target: Target): Promise<void> => {
  mkdirSync(target.freshDir, { recursive: true });
  const proc = Bun.spawn(["bun", join(ROOT, target.script)], {
    env: { ...process.env, [target.envVar]: target.freshDir },
    stdout: "inherit",
    stderr: "inherit",
  });
  const code = await proc.exited;
  if (code !== 0) {
    throw new Error(`capture for ${target.name} exited with code ${code}`);
  }
};

/** Fraction of pixels whose color differs meaningfully from the top-left background. */
const inkRatio = (png: PNG): number => {
  const { data, width, height } = png;
  const br = data[0];
  const bg = data[1];
  const bb = data[2];
  let ink = 0;
  for (let i = 0; i < data.length; i += 4) {
    if (Math.abs(data[i] - br) + Math.abs(data[i + 1] - bg) + Math.abs(data[i + 2] - bb) > 24) ink += 1;
  }
  return ink / (width * height);
};

interface Failure {
  file: string;
  reason: string;
}

const compare = (target: Target): Failure[] => {
  const failures: Failure[] = [];
  const baselines = readdirSync(target.baselineDir).filter(file => file.endsWith(".png"));

  for (const file of baselines) {
    const label = `${target.name}/${file}`;
    const freshPath = join(target.freshDir, file);
    if (!existsSync(freshPath)) {
      failures.push({ file: label, reason: "no fresh capture produced (page failed to render?)" });
      continue;
    }
    const baseline = PNG.sync.read(readFileSync(join(target.baselineDir, file)));
    const fresh = PNG.sync.read(readFileSync(freshPath));

    const ink = inkRatio(fresh);
    if (ink < MIN_INK_RATIO) {
      failures.push({ file: label, reason: `render is blank / near-blank (${(ink * 100).toFixed(3)}% ink)` });
      continue;
    }
    if (
      Math.abs(baseline.width - fresh.width) > DIMENSION_SLACK ||
      Math.abs(baseline.height - fresh.height) > DIMENSION_SLACK
    ) {
      failures.push({
        file: label,
        reason: `dimensions changed ${baseline.width}x${baseline.height} -> ${fresh.width}x${fresh.height}`,
      });
      continue;
    }

    if (PIXEL && baseline.width === fresh.width && baseline.height === fresh.height) {
      const diff = new PNG({ width: baseline.width, height: baseline.height });
      const changed = pixelmatch(baseline.data, fresh.data, diff.data, baseline.width, baseline.height, {
        threshold: PIXEL_THRESHOLD,
      });
      const ratio = changed / (baseline.width * baseline.height);
      if (ratio > MAX_DIFF_RATIO) {
        const diffPath = join(DIFF_DIR, `${target.name}__${file}`);
        writeFileSync(diffPath, PNG.sync.write(diff));
        failures.push({
          file: label,
          reason: `${changed} px differ (${(ratio * 100).toFixed(3)}% > ${(MAX_DIFF_RATIO * 100).toFixed(3)}%) — diff at ${diffPath}`,
        });
      }
    }
  }
  return failures;
};

rmSync(TMP, { recursive: true, force: true });
mkdirSync(DIFF_DIR, { recursive: true });

console.log(`Mode: ${PIXEL ? "strict pixel diff" : "render-health (blank + dimensions)"}`);

const allFailures: Failure[] = [];
for (const target of targets) {
  console.log(`\n▶ capturing ${target.name}…`);
  await capture(target);
  const failures = compare(target);
  const total = readdirSync(target.baselineDir).filter(file => file.endsWith(".png")).length;
  console.log(`  ${target.name}: ${total - failures.length}/${total} healthy`);
  allFailures.push(...failures);
}

if (allFailures.length) {
  console.error(`\n✗ screenshot regression: ${allFailures.length} baseline(s) failed`);
  for (const failure of allFailures) {
    console.error(`  - ${failure.file}: ${failure.reason}`);
  }
  console.error(
    `\nIf a visual change is intentional, regenerate baselines with 'bun run preview:capture'` +
      ` and 'bun run docs:shots', review the diff, and commit.`,
  );
  process.exit(1);
}

console.log("\n✓ screenshot regression: all baselines healthy");
