/**
 * Screenshot-regression gate.
 *
 * Re-captures the gallery and docs-site screenshots into a temp directory
 * (through the same deterministic-font pipeline the baselines were generated
 * with), then pixel-diffs each fresh capture against the committed baseline in
 * docs/screenshots/**. Fails if any baseline is missing a capture, differs in
 * dimensions, or exceeds the changed-pixel tolerance. Diff images are written
 * to .regression-tmp/diff for inspection (uploaded as a CI artifact on failure).
 *
 * Usage: bun run test:regression   (runs `bun run build` first)
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const ROOT = new URL("../..", import.meta.url).pathname;
const TMP = join(ROOT, ".regression-tmp");
const DIFF_DIR = join(TMP, "diff");

// Per-pixel color tolerance (0-1; higher = more forgiving of anti-aliasing) and
// the maximum share of pixels allowed to differ before a baseline is a failure.
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

interface Failure {
  file: string;
  reason: string;
}

const compare = (target: Target): Failure[] => {
  const failures: Failure[] = [];
  const baselines = readdirSync(target.baselineDir).filter(file => file.endsWith(".png"));

  for (const file of baselines) {
    const freshPath = join(target.freshDir, file);
    if (!existsSync(freshPath)) {
      failures.push({ file: `${target.name}/${file}`, reason: "no fresh capture produced" });
      continue;
    }
    const baseline = PNG.sync.read(readFileSync(join(target.baselineDir, file)));
    const fresh = PNG.sync.read(readFileSync(freshPath));
    if (baseline.width !== fresh.width || baseline.height !== fresh.height) {
      failures.push({
        file: `${target.name}/${file}`,
        reason: `dimensions changed ${baseline.width}x${baseline.height} -> ${fresh.width}x${fresh.height}`,
      });
      continue;
    }
    const diff = new PNG({ width: baseline.width, height: baseline.height });
    const changed = pixelmatch(baseline.data, fresh.data, diff.data, baseline.width, baseline.height, {
      threshold: PIXEL_THRESHOLD,
    });
    const ratio = changed / (baseline.width * baseline.height);
    if (ratio > MAX_DIFF_RATIO) {
      const diffPath = join(DIFF_DIR, `${target.name}__${file}`);
      writeFileSync(diffPath, PNG.sync.write(diff));
      failures.push({
        file: `${target.name}/${file}`,
        reason: `${changed} px differ (${(ratio * 100).toFixed(3)}% > ${(MAX_DIFF_RATIO * 100).toFixed(3)}%) — diff at ${diffPath}`,
      });
    }
  }
  return failures;
};

rmSync(TMP, { recursive: true, force: true });
mkdirSync(DIFF_DIR, { recursive: true });

const allFailures: Failure[] = [];
for (const target of targets) {
  console.log(`\n▶ capturing ${target.name}…`);
  await capture(target);
  const failures = compare(target);
  const total = readdirSync(target.baselineDir).filter(file => file.endsWith(".png")).length;
  console.log(`  ${target.name}: ${total - failures.length}/${total} match`);
  allFailures.push(...failures);
}

if (allFailures.length) {
  console.error(`\n✗ screenshot regression: ${allFailures.length} baseline(s) drifted`);
  for (const failure of allFailures) {
    console.error(`  - ${failure.file}: ${failure.reason}`);
  }
  console.error(
    `\nIf the change is intentional, regenerate baselines with 'bun run preview:capture'` +
      ` and 'bun run docs:shots', review the diff, and commit.`,
  );
  process.exit(1);
}

console.log("\n✓ screenshot regression: all baselines match");
