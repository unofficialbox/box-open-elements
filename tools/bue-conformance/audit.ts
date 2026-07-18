/**
 * box-ui-elements (BUE) conformance audit — runnable driver.
 *
 * Fetches the real upstream SCSS named in `manifest.ts` from
 * `raw.githubusercontent.com/box/box-ui-elements`, resolves each geometry claim,
 * compares it against the value box-open-elements ships, and writes a report to
 * `docs/audits/bue-conformance-audit.md` (+ `.data.json`).
 *
 * Usage:
 *   bun tools/bue-conformance/audit.ts            # fetch (cached) + report
 *   bun tools/bue-conformance/audit.ts --refresh  # force re-fetch upstream
 *   bun tools/bue-conformance/audit.ts --offline   # use cache only, no network
 *   bun tools/bue-conformance/audit.ts --strict   # exit 1 if any drift found
 *
 * Network-blocked sandboxes: only `raw.githubusercontent.com` is reachable here,
 * which is exactly what this script uses. The live-Storybook colour/pixel phase
 * (blocked until `opensource.box.com` is allowlisted) is tracked in
 * plans/bue-conformance-execplan.md.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  compareValue,
  extractScopedDeclarations,
  parseScssVariables,
  resolveScssValue,
  type Verdict,
} from "./signals.js";
import {
  CLAIMS,
  UPSTREAM_FILES,
  UPSTREAM_REVISION,
  upstreamUrl,
  type Claim,
} from "./manifest.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const CACHE_DIR = join(HERE, ".cache");
const REPORT_MD = join(REPO_ROOT, "docs/audits/bue-conformance-audit.md");
const REPORT_JSON = join(REPO_ROOT, "docs/audits/bue-conformance-audit.data.json");
const CA_BUNDLE = "/root/.ccr/ca-bundle.crt";

export interface Args {
  refresh: boolean;
  offline: boolean;
  strict: boolean;
}

export function parseArgs(argv: string[]): Args {
  return {
    refresh: argv.includes("--refresh"),
    offline: argv.includes("--offline"),
    strict: argv.includes("--strict"),
  };
}

/** The revision to fetch — pinned in the manifest, overridable per run. */
const REVISION = process.env.BUE_UPSTREAM_REV || UPSTREAM_REVISION;

function cachePathFor(id: string): string {
  return join(CACHE_DIR, `${REVISION}.${id}.scss`);
}

/**
 * Fetch one upstream file with curl (honours HTTPS_PROXY + CA bundle).
 * `--fail` makes curl exit non-zero on any HTTP >= 400 so a 404/5xx body is
 * never returned and never cached as if it were SCSS.
 */
function fetchUpstream(url: string): string | null {
  const curlArgs = ["-sS", "--fail", "--max-time", "30", url];
  if (existsSync(CA_BUNDLE)) {
    curlArgs.unshift("--cacert", CA_BUNDLE);
  }
  const proc = Bun.spawnSync(["curl", ...curlArgs]);
  if (proc.exitCode !== 0) {
    return null;
  }
  const body = proc.stdout.toString();
  return body.length > 0 ? body : null;
}

export interface LoadedFile {
  id: string;
  path: string;
  content: string | null;
}

function loadUpstreamFiles(args: Args): LoadedFile[] {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
  return UPSTREAM_FILES.map(file => {
    const cachePath = cachePathFor(file.id);
    const cached = existsSync(cachePath);

    if (cached && (args.offline || !args.refresh)) {
      return { id: file.id, path: file.path, content: readFileSync(cachePath, "utf8") };
    }
    if (args.offline) {
      return { id: file.id, path: file.path, content: null };
    }

    const body = fetchUpstream(upstreamUrl(file.path, REVISION));
    if (body !== null) {
      writeFileSync(cachePath, body);
      return { id: file.id, path: file.path, content: body };
    }
    // Network failed but a cache copy exists — fall back to it.
    if (cached) {
      return { id: file.id, path: file.path, content: readFileSync(cachePath, "utf8") };
    }
    return { id: file.id, path: file.path, content: null };
  });
}

export interface Row {
  claim: Claim;
  upstreamRaw: string | null;
  upstreamResolved: string | null;
  verdict: Verdict;
  boePx: number | null;
  upstreamPx: number | null;
  deltaPx: number | null;
  note?: string;
}

/** Pull the raw upstream token for a claim out of the loaded files. */
export function extractUpstream(
  claim: Claim,
  byId: Map<string, string | null>,
): string | null {
  const content = byId.get(claim.extractor.file) ?? null;
  if (content === null) {
    return null;
  }
  if (claim.extractor.kind === "scss-var") {
    const vars = parseScssVariables(content);
    return vars.get(claim.extractor.name) ?? null;
  }
  const values = extractScopedDeclarations(
    content,
    claim.extractor.selector,
    claim.extractor.property,
  );
  const index = claim.extractor.index ?? 0;
  return values[index] ?? null;
}

export function evaluate(files: LoadedFile[]): Row[] {
  const byId = new Map<string, string | null>(files.map(f => [f.id, f.content]));

  // Merge every parsed SCSS variable so cross-file references resolve
  // (e.g. Modal.scss uses $bdl-border-radius-size-xlarge from _layout.scss).
  const mergedVars = new Map<string, string>();
  for (const file of files) {
    if (file.content) {
      for (const [name, value] of parseScssVariables(file.content)) {
        mergedVars.set(name, value);
      }
    }
  }

  return CLAIMS.map(claim => {
    const upstreamRaw = extractUpstream(claim, byId);
    const upstreamResolved =
      upstreamRaw === null ? null : resolveScssValue(upstreamRaw, mergedVars);
    const comparison = compareValue({
      boeValue: claim.boeValue,
      upstreamValue: upstreamResolved,
      tolerancePx: claim.tolerancePx,
    });
    // A claim box-open-elements deliberately diverges on (tracking the live Box
    // web app, not box-ui-elements source) reports its mismatch as an intentional
    // divergence rather than drift.
    const verdict: Verdict =
      claim.intentional && comparison.verdict === "drift"
        ? "intentional-divergence"
        : comparison.verdict;
    return {
      claim,
      upstreamRaw,
      upstreamResolved,
      verdict,
      boePx: comparison.boePx,
      upstreamPx: comparison.upstreamPx,
      deltaPx: comparison.deltaPx,
      note: claim.intentional && verdict === "intentional-divergence" ? claim.intentional : comparison.note,
    };
  });
}

const VERDICT_ICON: Record<Verdict, string> = {
  conformant: "✅",
  drift: "❌",
  "missing-upstream": "⚠️",
  review: "🔍",
  "intentional-divergence": "🎯",
};

/**
 * Strict mode treats anything other than `conformant` or `intentional-divergence`
 * as a failure — `drift`, `missing-upstream` (could not verify), and `review`
 * (unresolved non-length) all mean the audit did not confirm conformance.
 * `intentional-divergence` is a deliberate, documented choice and passes.
 */
export function computeExitCode(rows: Row[], strict: boolean): number {
  if (!strict) {
    return 0;
  }
  return rows.every(
    row => row.verdict === "conformant" || row.verdict === "intentional-divergence",
  )
    ? 0
    : 1;
}

export function renderMarkdown(rows: Row[], files: LoadedFile[]): string {
  const counts: Record<Verdict, number> = {
    conformant: 0,
    drift: 0,
    "missing-upstream": 0,
    review: 0,
    "intentional-divergence": 0,
  };
  for (const row of rows) {
    counts[row.verdict] += 1;
  }

  const lines: string[] = [];
  lines.push("# box-ui-elements Geometry Conformance Audit");
  lines.push("");
  lines.push(
    "Generated by `bun run bue-conformance`. Verifies box-open-elements geometry " +
      "constants (`src/foundations/geometry`) against the real Box Design Language " +
      "values in [box/box-ui-elements](https://github.com/box/box-ui-elements) " +
      `(\`${REVISION}\`). Length claims are resolved statically; colour/shadow conformance ` +
      "is verified in the live-Storybook phase (see " +
      "`plans/bue-conformance-execplan.md`). Some radii now **intentionally diverge** " +
      "from box-ui-elements source to track the live Box web app's pill geometry — " +
      "see `docs/audits/bue-conformance-webapp-audit.md`.",
  );
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Verdict | Count |");
  lines.push("| --- | ---: |");
  lines.push(`| ✅ Conformant | ${counts.conformant} |`);
  lines.push(`| 🎯 Intentional divergence (tracks live Box app) | ${counts["intentional-divergence"]} |`);
  lines.push(`| ❌ Drift | ${counts.drift} |`);
  lines.push(`| ⚠️ Missing upstream | ${counts["missing-upstream"]} |`);
  lines.push(`| 🔍 Needs review | ${counts.review} |`);
  lines.push(`| **Total claims** | **${rows.length}** |`);
  lines.push("");

  const missingFiles = files.filter(f => f.content === null);
  if (missingFiles.length > 0) {
    lines.push(
      `> ⚠️ Could not load ${missingFiles.length} upstream file(s): ` +
        `${missingFiles.map(f => `\`${f.path}\``).join(", ")}. ` +
        "Re-run with network access to `raw.githubusercontent.com`.",
    );
    lines.push("");
  }

  lines.push("## Claims");
  lines.push("");
  lines.push("| | Surface | box-open-elements | Value | Upstream (resolved) | Δpx | Upstream anchor |");
  lines.push("| --- | --- | --- | --- | --- | ---: | --- |");
  for (const row of rows) {
    const delta = row.deltaPx === null ? "—" : String(row.deltaPx);
    lines.push(
      `| ${VERDICT_ICON[row.verdict]} | ${row.claim.surface} | \`${row.claim.boeConst}\` | ` +
        `${row.claim.boeValue} | ${row.upstreamResolved ?? "—"} | ${delta} | ${row.claim.citation} |`,
    );
  }
  lines.push("");
  lines.push("## Legend");
  lines.push("");
  lines.push("- ✅ **Conformant** — resolved value matches upstream within tolerance.");
  lines.push("- 🎯 **Intentional divergence** — box-open-elements deliberately differs from box-ui-elements source to track the live Box web app (pill geometry); documented, not a defect.");
  lines.push("- ❌ **Drift** — box-open-elements value differs from upstream unexpectedly; investigate.");
  lines.push("- ⚠️ **Missing upstream** — anchor not found (path/selector moved upstream, or offline).");
  lines.push("- 🔍 **Needs review** — non-length value (colour/shadow/Sass function); verify visually.");
  lines.push("");
  return lines.join("\n");
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const files = loadUpstreamFiles(args);
  const rows = evaluate(files);

  const data = {
    upstream: `box/box-ui-elements@${REVISION}`,
    revision: REVISION,
    files: files.map(f => ({ id: f.id, path: f.path, loaded: f.content !== null })),
    claims: rows.map(row => ({
      id: row.claim.id,
      surface: row.claim.surface,
      boeConst: row.claim.boeConst,
      boeValue: row.claim.boeValue,
      upstreamRaw: row.upstreamRaw,
      upstreamResolved: row.upstreamResolved,
      verdict: row.verdict,
      boePx: row.boePx,
      upstreamPx: row.upstreamPx,
      deltaPx: row.deltaPx,
      note: row.note ?? null,
      citation: row.claim.citation,
    })),
  };

  writeFileSync(REPORT_JSON, `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(REPORT_MD, renderMarkdown(rows, files));

  const drift = rows.filter(r => r.verdict === "drift");
  const missing = rows.filter(r => r.verdict === "missing-upstream");
  const conformant = rows.filter(r => r.verdict === "conformant");
  const review = rows.filter(r => r.verdict === "review");
  // eslint-disable-next-line no-console
  console.log(
    `BUE conformance: ${conformant.length} conformant, ${drift.length} drift, ` +
      `${missing.length} missing, ${review.length} review (of ${rows.length}). ` +
      `Report: ${REPORT_MD}`,
  );
  for (const row of drift) {
    // eslint-disable-next-line no-console
    console.log(
      `  ❌ ${row.claim.id}: box-open-elements ${row.claim.boeValue} vs upstream ${row.upstreamResolved}`,
    );
  }

  const exitCode = computeExitCode(rows, args.strict);
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

// Only run when executed directly, so tests can import the pure helpers above
// without triggering network fetches or report writes.
if (import.meta.main) {
  main();
}
