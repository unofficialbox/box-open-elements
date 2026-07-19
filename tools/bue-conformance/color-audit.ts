/**
 * box-ui-elements (BUE) conformance audit — **Layer 2** runnable driver
 * (resolved colour / shadow / interaction state).
 *
 * Fetches the compiled CSS of the public box-ui-elements Storybook
 * (`opensource.box.com/box-ui-elements`), reads the resolved colour/shadow value
 * for each rule named in `color-manifest.ts`, and compares it against the value
 * box-open-elements ships — verifying the post-Sass colour information Layer 1
 * cannot resolve from source. Writes `docs/audits/bue-conformance-color-audit.md`
 * (+ `.data.json`).
 *
 * Usage:
 *   bun tools/bue-conformance/color-audit.ts            # fetch (cached) + report
 *   bun tools/bue-conformance/color-audit.ts --refresh  # force re-fetch Storybook
 *   bun tools/bue-conformance/color-audit.ts --offline  # use cache only, no network
 *   bun tools/bue-conformance/color-audit.ts --strict   # exit 1 unless every claim conformant
 *
 * Network: reads `opensource.box.com` + `*.boxcdn.net` (Storybook + fonts). The
 * bundle hash is discovered from `iframe.html` at run time, so the audit follows
 * Storybook redeploys without a manifest edit. See
 * plans/bue-conformance-execplan.md for the environment findings.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  extractBundleCss,
  extractCompiledDeclarations,
  extractRawDeclarations,
  parseChunkNames,
} from "./css-extract.js";
import {
  compareColor,
  resolveCssVars,
  type Verdict,
} from "./color-signals.js";
import {
  COLOR_CLAIMS,
  STORYBOOK_BASE,
  buildTokenMap,
  type ColorClaim,
} from "./color-manifest.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..");
const CACHE_DIR = join(HERE, ".cache");
const CSS_CACHE = join(CACHE_DIR, "storybook-compiled.css");
const BUNDLES_CACHE = join(CACHE_DIR, "storybook-bundles.json");
const REPORT_MD = join(REPO_ROOT, "docs/audits/bue-conformance-color-audit.md");
const REPORT_JSON = join(REPO_ROOT, "docs/audits/bue-conformance-color-audit.data.json");
const CA_BUNDLE = "/root/.ccr/ca-bundle.crt";

export interface Args {
  refresh: boolean;
  offline: boolean;
  strict: boolean;
  /** `--min-conformant=N`: fail if fewer than N claims are conformant. */
  minConformant: number | null;
}

export function parseArgs(argv: string[]): Args {
  const floorArg = argv.find(a => a.startsWith("--min-conformant="));
  const parsedFloor = floorArg
    ? Number.parseInt(floorArg.slice("--min-conformant=".length), 10)
    : Number.NaN;
  return {
    refresh: argv.includes("--refresh"),
    offline: argv.includes("--offline"),
    strict: argv.includes("--strict"),
    minConformant: Number.isFinite(parsedFloor) ? parsedFloor : null,
  };
}

/** Build curl arguments for one URL (proxy-aware, CA-pinned, no redirects). */
function curlArgsFor(url: string): string[] {
  const args = ["-sS", "--fail", "--max-time", "40", "--max-redirs", "0", url];
  if (existsSync(CA_BUNDLE)) {
    args.unshift("--cacert", CA_BUNDLE);
  }
  return args;
}

/** curl one URL (honours HTTPS_PROXY + CA bundle). Returns body or null. */
function curl(url: string): string | null {
  const proc = Bun.spawnSync(["curl", ...curlArgsFor(url)]);
  if (proc.exitCode !== 0) {
    return null;
  }
  const body = proc.stdout.toString();
  return body.length > 0 ? body : null;
}

/**
 * Fetch many URLs with a bounded concurrency pool and hand each body to
 * `onBody` as it arrives (bodies are large — extract and discard immediately
 * rather than holding them all in memory).
 */
async function curlEach(
  urls: string[],
  onBody: (url: string, body: string) => void,
  concurrency = 16,
): Promise<void> {
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < urls.length) {
      const url = urls[next++];
      const proc = Bun.spawn(["curl", ...curlArgsFor(url)], {
        stdout: "pipe",
        stderr: "ignore",
      });
      const body = await new Response(proc.stdout).text();
      await proc.exited;
      if (proc.exitCode === 0 && body.length > 0) {
        onBody(url, body);
      }
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, urls.length) }, () => worker()),
  );
}

const CHUNK_NAME = /^[\w.~-]+\.iframe\.bundle\.js$/;

/**
 * Parse the `import './xxx.iframe.bundle.js'` references out of the Storybook
 * `iframe.html`. Names are validated to a strict pattern so a discovered value
 * can never redirect the fetch off the known Storybook path.
 */
export function parseBundleNames(iframeHtml: string): string[] {
  const names = new Set<string>();
  const pattern = /['"]\.\/([\w.~-]+\.iframe\.bundle\.js)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(iframeHtml)) !== null) {
    if (/^[\w.~-]+\.iframe\.bundle\.js$/.test(match[1])) {
      names.add(match[1]);
    }
  }
  return [...names];
}

export interface CompiledCss {
  css: string;
  bundles: string[];
  fromCache: boolean;
}

/**
 * Fetch and concatenate the compiled CSS of every Storybook bundle — the
 * always-loaded ones named in `iframe.html` (button family) **and** the lazy
 * per-story chunks discovered from the webpack runtime map (badge / menu /
 * tooltip / …). The result is cached, so only `--refresh` re-fetches; a plain
 * run reads the cache.
 */
async function loadCompiledCss(args: Args): Promise<CompiledCss> {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
  const haveCache = existsSync(CSS_CACHE);
  if (haveCache && (args.offline || !args.refresh)) {
    const bundles = existsSync(BUNDLES_CACHE)
      ? (JSON.parse(readFileSync(BUNDLES_CACHE, "utf8")) as string[])
      : [];
    return { css: readFileSync(CSS_CACHE, "utf8"), bundles, fromCache: true };
  }
  const fallback = (): CompiledCss =>
    haveCache
      ? { css: readFileSync(CSS_CACHE, "utf8"), bundles: [], fromCache: true }
      : { css: "", bundles: [], fromCache: false };
  if (args.offline) {
    return fallback();
  }

  const iframeHtml = curl(`${STORYBOOK_BASE}/iframe.html`);
  if (iframeHtml === null) {
    return fallback();
  }

  // Always-loaded bundles + the lazy chunks the runtime bundle enumerates.
  const eager = parseBundleNames(iframeHtml);
  const runtimeName = eager.find(n => n.startsWith("runtime~"));
  let chunkNames: string[] = [];
  if (runtimeName) {
    const runtimeJs = curl(`${STORYBOOK_BASE}/${runtimeName}`);
    if (runtimeJs !== null) {
      chunkNames = parseChunkNames(runtimeJs).filter(n => CHUNK_NAME.test(n));
    }
  }
  const allNames = [...new Set([...eager, ...chunkNames])].filter(n =>
    CHUNK_NAME.test(n),
  );
  // eslint-disable-next-line no-console
  console.log(
    `Fetching ${allNames.length} Storybook bundles ` +
      `(${eager.length} eager + ${chunkNames.length} lazy chunks)…`,
  );

  const sheetByName = new Map<string, string>();
  await curlEach(
    allNames.map(n => `${STORYBOOK_BASE}/${n}`),
    (url, body) => {
      const name = url.slice(url.lastIndexOf("/") + 1);
      const css = extractBundleCss(body);
      if (css.trim() !== "") {
        sheetByName.set(name, css);
      }
    },
  );

  // Deterministic order (name-sorted) so the cached corpus is stable.
  const loaded = [...sheetByName.keys()].sort();
  const css = loaded.map(name => `/* ${name} */\n${sheetByName.get(name)}`).join("\n");
  if (css.trim() !== "") {
    writeFileSync(CSS_CACHE, css);
    writeFileSync(BUNDLES_CACHE, `${JSON.stringify(loaded, null, 2)}\n`);
    return { css, bundles: loaded, fromCache: false };
  }
  return fallback();
}

export interface Row {
  claim: ColorClaim;
  boeResolved: string | null;
  upstreamRaw: string | null;
  boeCanonical: string | null;
  upstreamCanonical: string | null;
  verdict: Verdict;
  delta: number | null;
  note?: string;
}

/**
 * Verify a claim's `boeAnchor` still exists in its shipped component. Grounds
 * the box-open-elements side in source: if the component stops declaring the
 * cited token/value, the claim fails loudly rather than asserting a stale value.
 */
export function anchorPresent(
  claim: ColorClaim,
  componentSource: Map<string, string | null>,
): boolean {
  const src = componentSource.get(claim.boeComponent);
  return src != null && src.includes(claim.boeAnchor);
}

export function evaluate(
  css: string,
  componentSource: Map<string, string | null>,
): Row[] {
  const tokenMap = buildTokenMap();
  return COLOR_CLAIMS.map(claim => {
    const grounded = anchorPresent(claim, componentSource);
    const boeResolved = resolveCssVars(claim.boeValue, tokenMap);
    const rule = claim.upstream;
    const upstreamValues =
      rule.rawSelector !== undefined
        ? extractRawDeclarations(css, rule.rawSelector, rule.property)
        : extractCompiledDeclarations(css, rule.selector, rule.state, rule.property);
    const upstreamRaw = upstreamValues[rule.index ?? 0] ?? null;

    if (!grounded) {
      return {
        claim,
        boeResolved,
        upstreamRaw,
        boeCanonical: null,
        upstreamCanonical: null,
        verdict: "missing-boe" as Verdict,
        delta: null,
        note: `Anchor not found in ${claim.boeComponent} — the component no longer declares this value; update the manifest.`,
      };
    }

    const comparison = compareColor({
      boeValue: boeResolved,
      upstreamValue: upstreamRaw,
      kind: claim.kind,
      tolerance: claim.tolerance,
    });
    return {
      claim,
      boeResolved,
      upstreamRaw,
      boeCanonical: comparison.boeCanonical,
      upstreamCanonical: comparison.upstreamCanonical,
      verdict: comparison.verdict,
      delta: comparison.delta,
      note: comparison.note,
    };
  });
}

const VERDICT_ICON: Record<Verdict, string> = {
  conformant: "✅",
  review: "🔍",
  "missing-upstream": "⚠️",
  "missing-boe": "🚫",
};

/** Strict mode: anything other than `conformant` is a failure. */
export function computeExitCode(rows: Row[], strict: boolean): number {
  if (!strict) {
    return 0;
  }
  return rows.every(row => row.verdict === "conformant") ? 0 : 1;
}

/**
 * Non-regression floor. Unlike `--strict` (which the intentional Blueprint-
 * modernisation `review` rows make unreachable), this only asserts that the
 * number of `conformant` claims never drops below `floor` — so a box-open-elements
 * token change that breaks a currently-conformant claim fails CI, while the
 * documented reviews are left alone. `null` floor is a no-op.
 */
export function conformantFloorExitCode(rows: Row[], floor: number | null): number {
  if (floor === null) {
    return 0;
  }
  const conformant = rows.filter(row => row.verdict === "conformant").length;
  return conformant >= floor ? 0 : 1;
}

export function renderMarkdown(rows: Row[], bundles: string[]): string {
  const counts: Record<Verdict, number> = {
    conformant: 0,
    review: 0,
    "missing-upstream": 0,
    "missing-boe": 0,
  };
  for (const row of rows) {
    counts[row.verdict] += 1;
  }

  const lines: string[] = [];
  lines.push("# box-ui-elements Colour & Interaction-State Conformance Audit (Layer 2)");
  lines.push("");
  lines.push(
    "Generated by `bun run bue-conformance:color`. Reads the **compiled** " +
      "(post-Sass, resolved) CSS of the public " +
      `[box-ui-elements Storybook](${STORYBOOK_BASE}) and compares the concrete ` +
      "colour / shadow / interaction-state values box-open-elements ships " +
      "(imported from `src/foundations/tokens` + `src/foundations/geometry`) " +
      "against the values box-ui-elements renders. This is the colour layer that " +
      "Layer 1 (`bue-conformance`) defers because upstream produces it with Sass " +
      "functions that cannot be resolved statically.",
  );
  lines.push("");
  lines.push(
    "> **Reading the verdicts.** box-open-elements deliberately tracks Box's " +
      "modernised *Blueprint* palette, while the public Storybook may still render " +
      "legacy component styles. A `🔍 Review` is therefore **not** an assertion of a " +
      "defect — it flags a resolved difference for a human to judge (intentional " +
      "modernisation vs real drift). Both resolved values and the channel delta are " +
      "shown so that judgement needs no browser.",
  );
  lines.push("");
  lines.push(
    "> **Keeping this current.** CI runs this audit `--offline` against a **committed, " +
      "frozen snapshot** of the compiled Storybook CSS (`tools/bue-conformance/.cache/" +
      "storybook-compiled.css`) and gates on a conformant-count floor (`--min-conformant`), " +
      "so the check is deterministic and fails on box-open-elements regressions rather than " +
      "upstream drift. That snapshot is dated: re-fetch it with `bun run bue-conformance:" +
      "color --refresh` roughly **quarterly**, whenever you broaden claim coverage, or after " +
      "a material box-ui-elements Storybook change — then commit the refreshed cache and, if " +
      "the conformant count rose, bump the CI floor to match.",
  );
  lines.push("");
  if (bundles.length > 0) {
    lines.push(
      `Read from **${bundles.length}** compiled Storybook bundle(s) carrying CSS ` +
        "(the always-loaded button styles plus the per-story chunks for the other " +
        "surfaces, discovered from the webpack runtime map).",
    );
    lines.push("");
  }
  lines.push("## Summary");
  lines.push("");
  lines.push("| Verdict | Count |");
  lines.push("| --- | ---: |");
  lines.push(`| ✅ Conformant | ${counts.conformant} |`);
  lines.push(`| 🔍 Review | ${counts.review} |`);
  lines.push(`| ⚠️ Missing upstream | ${counts["missing-upstream"]} |`);
  lines.push(`| 🚫 Missing box-open-elements | ${counts["missing-boe"]} |`);
  lines.push(`| **Total claims** | **${rows.length}** |`);
  lines.push("");

  lines.push("## Claims");
  lines.push("");
  lines.push("| | Surface | box-open-elements | Resolved | Upstream (resolved) | Δ | Upstream anchor |");
  lines.push("| --- | --- | --- | --- | --- | ---: | --- |");
  for (const row of rows) {
    const delta = row.delta === null ? "—" : String(row.delta);
    lines.push(
      `| ${VERDICT_ICON[row.verdict]} | ${row.claim.surface} | \`${row.claim.boeConst}\` | ` +
        `${row.boeCanonical ?? row.boeResolved ?? "—"} | ${row.upstreamCanonical ?? row.upstreamRaw ?? "—"} | ` +
        `${delta} | ${row.claim.citation} |`,
    );
  }
  lines.push("");
  lines.push("## Legend");
  lines.push("");
  lines.push("- ✅ **Conformant** — resolved colour/shadow matches upstream within tolerance.");
  lines.push("- 🔍 **Review** — resolved values differ; judge intentional Blueprint modernisation vs drift (delta = max per-channel difference, 0-255).");
  lines.push("- ⚠️ **Missing upstream** — selector/state/property not found in the compiled Storybook CSS.");
  lines.push("- 🚫 **Missing box-open-elements** — the component no longer declares the cited value (manifest anchor stale).");
  lines.push("");
  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const { css, bundles, fromCache } = await loadCompiledCss(args);

  const componentFiles = [...new Set(COLOR_CLAIMS.map(c => c.boeComponent))];
  const componentSource = new Map<string, string | null>(
    componentFiles.map(rel => {
      const abs = join(REPO_ROOT, rel);
      return [rel, existsSync(abs) ? readFileSync(abs, "utf8") : null];
    }),
  );

  if (css.trim() === "") {
    // eslint-disable-next-line no-console
    console.error(
      "Layer 2 colour audit: no compiled CSS available (network to " +
        "opensource.box.com blocked and no cache). Re-run with the Box hosts " +
        "allow-listed, or `--offline` once a cache exists.",
    );
    process.exit(args.strict ? 1 : 0);
  }

  const rows = evaluate(css, componentSource);

  const data = {
    upstream: STORYBOOK_BASE,
    bundles,
    fromCache,
    claims: rows.map(row => ({
      id: row.claim.id,
      surface: row.claim.surface,
      boeConst: row.claim.boeConst,
      boeValue: row.claim.boeValue,
      boeResolved: row.boeResolved,
      boeCanonical: row.boeCanonical,
      upstreamRaw: row.upstreamRaw,
      upstreamCanonical: row.upstreamCanonical,
      kind: row.claim.kind,
      verdict: row.verdict,
      delta: row.delta,
      note: row.note ?? null,
      citation: row.claim.citation,
    })),
  };

  writeFileSync(REPORT_JSON, `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(REPORT_MD, renderMarkdown(rows, bundles));

  const by = (v: Verdict): number => rows.filter(r => r.verdict === v).length;
  // eslint-disable-next-line no-console
  console.log(
    `BUE colour conformance: ${by("conformant")} conformant, ${by("review")} review, ` +
      `${by("missing-upstream")} missing-upstream, ${by("missing-boe")} missing-boe ` +
      `(of ${rows.length}). Report: ${REPORT_MD}`,
  );
  for (const row of rows.filter(r => r.verdict === "review")) {
    // eslint-disable-next-line no-console
    console.log(
      `  🔍 ${row.claim.id}: box-open-elements ${row.boeCanonical} vs upstream ${row.upstreamCanonical}` +
        (row.delta === null ? "" : ` (Δ${row.delta})`),
    );
  }

  const floorCode = conformantFloorExitCode(rows, args.minConformant);
  if (args.minConformant !== null) {
    // eslint-disable-next-line no-console
    console.log(
      `Conformant floor: ${by("conformant")} conformant vs required ≥ ${args.minConformant} — ` +
        `${floorCode === 0 ? "PASS" : "FAIL (a previously-conformant claim regressed)"}`,
    );
  }

  const exitCode = computeExitCode(rows, args.strict) || floorCode;
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

// Only run when executed directly, so tests can import the pure helpers above.
if (import.meta.main) {
  main().catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  });
}
