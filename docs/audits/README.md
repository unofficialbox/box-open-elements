# box-ui-elements Conformance Program

How box-open-elements proves its styling against the real Box Design Language,
across three complementary audits. This page is the committed home of the
program: the generated reports in this directory are build artefacts
(gitignored, rewritten on every run), so current coverage, accepted
divergences, and the refresh runbook are recorded here.

## The three audits

| Audit | Command | Reference | CI gate |
| --- | --- | --- | --- |
| **Layer 1 — geometry** | `bun run bue-conformance` | Upstream [box-ui-elements](https://github.com/box/box-ui-elements) SCSS source, pinned `v26.0.0` (fetched, cached) | `--strict` |
| **Layer 2 — colour / shadow / interaction state** | `bun run bue-conformance:color` | Compiled CSS of the public BUE Storybook — a committed, frozen snapshot under `tools/bue-conformance/.cache/` | `--strict --offline --min-conformant=<floor>` |
| **Webapp — ground truth** | `bun run bue-conformance:webapp` | Live `app.box.com` (Blueprint design system), captured to the committed `box-webapp-reference.data.json` | `--strict` |

All three run on every PR (`.github/workflows/ci.yml`, `conformance` job).
Layer 1 resolves what static SCSS can (lengths); Layer 2 reads the resolved,
post-Sass values SCSS functions hide (colours, shadows, `:hover`/`:active`/
`:focus`); the webapp audit diffs design tokens, control geometry, and
interaction states against the actual shipping Box product — the strongest
reference, used to arbitrate the other two.

## Verdict model

Every claim resolves to one of:

- ✅ **conformant** — matches the reference within tolerance.
- 🎯 **intentional/accepted divergence** — deliberately differs, with the
  divergence *vouched for*: geometry claims marked `intentional` track the
  live Box app's pill radii; colour claims carry a `webappToken` and pass only
  if the box-open-elements value matches the live-Box capture. Passes strict.
- 🔍 **review** — an unvouched difference. Fails strict CI; a review row must
  be either confirmed against the live Box app (add `webappToken`) or fixed.
- ⚠️/🚫 **missing** — a stale anchor on either side. Fails strict CI.

The **conformant-count floor** (`--min-conformant`) is a non-regression
backstop on top of strict: a token change that breaks a currently-conformant
claim fails CI even if it would otherwise resolve to an accepted verdict.
When broadening raises the conformant count, bump the floor to match in
`.github/workflows/ci.yml`.

## Current coverage (2026-08-11)

- **Layer 1 geometry:** 17 claims — 11 conformant, 6 intentional (pill radii).
- **Layer 2 colour:** 72 claims across 25 component families — 63 conformant,
  9 accepted-divergence, 0 review. Floor: 63.
- **Webapp:** 25 tokens (24 conformant + 1 accepted), 6/6 geometry,
  4 interaction states (3 conformant + 1 accepted).

The accepted colour divergences are all confirmed Blueprint modernisations the
legacy Storybook hasn't caught up to: the brand hover (`#006ae9` vs legacy
`#0074fe`), secondary text (`#6f6f6f` vs `#4e4e4e`/`#909090` — neutral-button
text, alert outline, breadcrumb links), the secondary surface (`#fbfbfb` vs
`#e8e8e8` — badge/toast/alert neutral fills), the selected-item tint
(`#f2f7fd`), and current-crumb text (`#222` vs `#4e4e4e`).

**Surveyed, no upstream anchor** (do not re-survey): tabs (box-ui-elements
ships no tabs styling in its Storybook CSS), datalist-item (no base/hover
colour upstream; `.is-active` diverges unvouched), pagination (upstream border
is an unresolved Blueprint `var()`), icon-button (`.btn-plain` declares no
colours), the alert brand-`info` tone and chip tonal fills (deliberate
box-open-elements mixes with no live-Box token to vouch).

## Broadening coverage

New claims live in `tools/bue-conformance/color-manifest.ts`. Each imports its
box-open-elements value (never hand-copied), names a `boeAnchor` substring that
must exist in the shipped component (enforced by tests), and cites an upstream
selector — `selector`+`state` for simple/compound selectors, `rawSelector` for
descendant selectors. Add fixture rules and verdict expectations to
`test/tools/bue-conformance-color.test.ts`, then bump the CI floor.

## Refresh runbook

All three references are **dated snapshots** — currently captured
**2026-07-18** (webapp + Storybook CSS). Refresh roughly **quarterly** (next
due ≈ **2026-10-18**) or after a visible Box redesign:

1. **Storybook CSS:** `bun run bue-conformance:color --refresh` (needs egress
   to `opensource.box.com`), commit the refreshed `tools/bue-conformance/.cache/`,
   reconcile any new drift, re-bump the floor.
2. **Webapp capture:** from a browser signed in to the real Box app, re-read
   the Blueprint `:root` tokens, rendered control geometry, and in-situ
   `:hover`/`:active` colours into `box-webapp-reference.data.json`, then bump
   its `capturedOn` (field shapes: `tools/bue-conformance/webapp-audit.ts`).
   Cannot run from a sandbox without Box credentials.
3. **Layer 1 pin:** bump the box-ui-elements tag in
   `tools/bue-conformance/manifest.ts` when upstream cuts a release worth
   tracking.
