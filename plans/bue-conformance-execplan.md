# ExecPlan: box-ui-elements conformance program

## Purpose / Big Picture

Stand up a **repeatable conformance program** that measures box-open-elements
against the *real* [box/box-ui-elements](https://github.com/box/box-ui-elements)
(BUE) source, rather than by eye. The prior density / BUE-visual passes aligned
geometry once; this program turns that into an instrument that can be re-run as
upstream and the catalog evolve, and that fails loudly on drift.

Two evidence layers, sourced independently:

1. **Source-level (this session, runnable now)** — resolve box-open-elements
   geometry constants (`src/foundations/geometry`) and diff each against the
   concrete value declared in upstream SCSS, fetched from
   `raw.githubusercontent.com/box/box-ui-elements`. Deterministic, no auth.
2. **Live computed-style / pixel (deferred — blocked)** — drive the public BUE
   **Storybook** in headless Chromium, read computed styles / capture pixels for
   the same surfaces, and diff colour, shadow, spacing, and states that Sass
   functions make unresolvable from source alone.

## Tiers changing

- **foundations** — `src/foundations/geometry` is the box-open-elements side of
  every claim (read-only; the audit imports it so a claim can never silently
  drift from what the catalog ships).
- **tools** — new `tools/bue-conformance/` harness.
- **docs** — generated audit at `docs/audits/bue-conformance-audit.md`
  (+ `.data.json`); this plan; `BACKLOG.md` / `docs/HANDOFF.md` status.
- No `src/` component or public-API change in the staging slice. Remediation of
  any drift the audit surfaces is separate, per-surface follow-up work.

## Environment constraint (why the program is split)

The sandbox's egress policy allows only `raw.githubusercontent.com` for upstream
traffic. Confirmed **403 at the proxy**: `github.com` (clone), `codeload.github.com`
(tarball), `api.github.com` (tree), the public BUE Storybook hosts, and
`*.boxcdn.net`. The authenticated tenant `kadams.ent.box.com/folder/0` is doubly
out of reach (egress + enterprise login; cloud sessions cannot do interactive
SSO). Consequences the harness is designed around:

- No directory listing / tree API → the upstream file set is a **curated path
  manifest**, not a crawl. Every path is fetched individually and verified `200`.
- No live rendering → Layer 2 is deferred until `opensource.box.com` +
  `*.boxcdn.net` are allowlisted and a new session is started (this container
  keeps its creation-time policy).

## Architecture

```
tools/bue-conformance/
  signals.ts   # PURE: parse/resolve/extract/compare. Unit-tested. No IO.
  manifest.ts  # DATA: box-open-elements geometry claim -> upstream file + extractor.
  audit.ts     # RUNNABLE: fetch (curl+proxy+CA) -> resolve -> compare -> report.
  .cache/      # gitignored upstream fetch cache
```

The split mirrors the repo's `regression-config.ts` (tested) vs `regression.ts`
(IO) convention so coverage instruments only the pure module.

**Resolution model.** Upstream SCSS uses variables *and arithmetic*
(`$bdl-border-radius-size-med: $bdl-border-radius-size * 1.5`) and cross-file
references (`Modal.scss` uses `$bdl-border-radius-size-xlarge` from
`_layout.scss`). `audit.ts` parses every fetched file into one merged variable
map, then `resolveScssValue` substitutes refs and evaluates `length * n` /
`length / n` before comparison. Only **length** claims auto-verify; colour /
shadow / Sass-function values are routed to `review` with both raw values shown
(they belong to Layer 2).

**Verdicts:** `conformant` (within px tolerance) · `drift` (differs — investigate)
· `missing-upstream` (anchor moved or offline) · `review` (non-length).

## Commands

```bash
bun run bue-conformance             # fetch (cached) + regenerate the report
bun tools/bue-conformance/audit.ts --refresh   # force re-fetch upstream
bun tools/bue-conformance/audit.ts --offline   # cache only, no network
bun tools/bue-conformance/audit.ts --strict    # exit 1 on any drift (CI-gate ready)
bun run test test/tools/bue-conformance.test.ts # harness unit tests
bun run verify                                  # typecheck + coverage-gated tests + build
```

## Progress

- [x] Pure signals module (`signals.ts`) — length parse, SCSS var parse, ref +
      arithmetic resolver, declaration extractor, verdict comparison.
- [x] Claim manifest (`manifest.ts`) — imports real geometry constants; **17**
      length claims mapped to verified upstream paths: radii ×4, grid unit,
      control height/large/pad + input padding, modal radius/padding/width,
      menu item min-height, overlay container padding/radius + list-item radius,
      badge radius.
- [x] Runnable audit (`audit.ts`) — curl fetch via proxy + CA, merged-var
      resolution, Markdown + JSON report, `--refresh/--offline/--strict`.
- [x] Unit tests (`test/tools/bue-conformance.test.ts`, 37 cases — signals +
      audit workflow via `import.meta.main` guard).
- [x] First pass run — **12/12 conformant**; report committed.
- [x] Review hardening (PR #76): pinned upstream revision `v26.0.0` (reproducible,
      `BUE_UPSTREAM_REV` override); quote-aware SCSS comment stripping;
      selector-scoped declaration extraction (no cross-rule index bleed);
      `curl --fail` so HTTP errors are never cached; `--strict` fails on any
      non-conformant verdict.
- [x] `package.json` script `bue-conformance`; `.cache/` gitignored.
- [x] Broaden Layer 1 (round 1): `box-inputs` padding, overlay container
      padding/radius, list-item radius, badge radius (12 → 17 claims).
- [ ] Broaden Layer 1 (round 2): avatar size, tooltip radius/max-width, select
      height, drawer width, tabs metrics, menu item padding (needs multi-value
      shorthand resolution).
- [ ] Layer 2 (live colour/shadow/state capture): see
      [`bue-conformance-layer2-handoff.md`](./bue-conformance-layer2-handoff.md)
      for the environment findings — network is openable, but headless Chromium
      can't use the MITM proxy directly (curl-backed request interception is the
      proven workaround) and the public Storybook is blocked by an MSW service
      worker. Recommended next: compiled-CSS extraction, or the tenant path in a
      fresh session with `BOX_USERNAME/PASSWORD`.
- [ ] Optional: add `--strict` to CI once the claim set is broad and stable.

## Surprises & Discoveries

- Only `raw.githubusercontent.com` is reachable; every richer GitHub route
  (clone/tarball/tree) and every Box host is 403 at the egress proxy.
- Upstream is **not** flat `Button.scss` per component: primitives like `button`
  ship `Button.tsx` (no co-located SCSS — migrated toward Blueprint), while
  `_layout.scss` / `_buttons.scss` carry the durable BDL geometry tokens. The
  manifest anchors on the stable token files, not volatile component SCSS.
- Radii are defined by arithmetic off a 4px root, so the resolver must evaluate
  `length * number`, not just substitute.
- box-open-elements geometry is already faithful (first pass: 12/12). The
  program's value is *breadth + repeatability + drift alarms*, not finding an
  initial pile of defects.

## Decision Log

- Import geometry constants into the manifest instead of hand-copying values —
  the box-open-elements side of a claim is always the shipped value.
- Auto-verify lengths only; defer colour/shadow to Layer 2 rather than fake a
  static comparison of Sass-function output.
- Curate upstream paths (no crawl) because the tree API is blocked; treat a
  moved anchor as `missing-upstream` (a visible signal), never a silent pass.
- Do not commit `.cache/`; the committed report + the unit tests are the record.
- Pin upstream to an immutable release tag (`v26.0.0`), not `master`: raw serves
  tags, the audit stays reproducible, and files can't be mixed across commits
  mid-run. A full SHA would be ideal but is undiscoverable here (the tree/commit
  APIs are 403); a release tag is immutable enough. Bump deliberately to
  re-baseline.
- Scope declaration extraction to the cited selector instead of a whole-file
  index — upstream has look-alike (`.modal-dialog-container`) and empty
  same-named (`.modal-dialog` animation-only) blocks that a bare index would
  misread.

## Outcomes & Acceptance

- `bun run bue-conformance` regenerates `docs/audits/bue-conformance-audit.md`
  with a per-claim verdict table.
- `bun run test test/tools/bue-conformance.test.ts` and `bun run verify` pass.
- Adding a claim is a one-line `manifest.ts` edit (+ its upstream file if new).

## Validation & QA

- Unit tests cover every `signals.ts` export incl. arithmetic, property-boundary
  extraction, tolerance, and each verdict branch.
- First pass proves end-to-end resolution against live upstream
  (`$…-med` → 6px; `Modal` `border-radius` → 12px via cross-file ref).
- Deferred Layer 2 acceptance: computed-style diff for ≥1 control + ≥1 overlay in
  the BUE Storybook once the network is open.
