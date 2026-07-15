# Handoff — box-open-elements

Snapshot for the next agent picking up this work. Read this first, then
`docs/audits/component-fidelity-audit.md` (the active work driver).

## What this repo is

A framework-agnostic **Web Components** design system for Box workflows
(Bun + TypeScript + Vitest). Tokens are `--boe-token-*` CSS custom properties
with hex fallbacks; two bundles — `box-default` (light) and `box-dark`
(`src/foundations/tokens/`). Components live in `src/components/<category>/`,
pattern compositions in `src/patterns/<area>/`. There is a **docs-site** SPA
(`docs-site/`, hash-router, consumes the built library via an import map) and an
internal **Storybook workshop** (`storybook/`) whose stories are extracted to
`storybook/generated/workshop.json` and feed the docs-site variant dropdown.

## Current state (as of this handoff)

- **Branch:** `claude/box-design-system-rebuild-dsi468` — develop here, always.
  It currently points at `origin/main` tip (everything below is merged).
- **Live site:** GitHub Pages, `https://unofficialbox.github.io/box-open-elements/`,
  auto-deploys on push to `main` via `.github/workflows/deploy.yml`
  (build cmd `bun run site:build`, output `docs-site/dist`). The Workshop is
  **not** deployed (internal tool).
- **CI** (`.github/workflows/ci.yml`): `Verify` (typecheck + tests + build) and
  `Visual regression` (strict pixel diff inside a pinned Playwright container).
- Recent merged PRs: #25 render-health→pixel gate, #26 docs-site polish,
  #27 containerized pixel gate, #28 Pages deployment, **#29 fidelity audit +
  Batches 0/2/6** (the big one).

## The active initiative: component fidelity program

A multi-agent audit scored all 109 components (avg **2.78/5**, 51 below 3/5,
229 high-severity issues). Full report + per-component data:
`docs/audits/component-fidelity-audit.md` and `…-audit.data.json`. Work is
organized into **systemic sweeps**, not per-component rewrites.

### Done (merged in #29)
- **Batch 0 — security:** fixed 3 injection holes (link-button scheme
  validation incl. tab/newline bypass, skeleton CSSOM sizing, content-explorer
  error escaping).
- **Batch 2 — dark mode:** replaced `color-mix(…, white)` with
  `var(--boe-token-surface-surface,#ffffff)` (flips in dark; no-op in light)
  across 94 files; added tokens `SurfaceItemSurfaceHover`, `TextTextDanger`.
- **Batch 6:** renamed the heading attribute `title`→`heading` across 26
  components (collided with native `HTMLElement.title`), fixed crashing/blank
  docs examples, humanized the Design-Tokens labels, unlinked the Workshop.

### Remaining (do these next, in order)
1. **Batch 1 — the render-pattern fix (highest impact, ~55 components).** Most
   interactive components do `attributeChangedCallback → render()` that
   reassigns `shadowRoot.innerHTML`, which **destroys focus, drops in-progress
   input, and breaks drag** (acute: checkbox, radio-group, combobox,
   split-view, tree-grid, carousel). Introduce a shared in-place-update helper
   (build shadow DOM once in `connectedCallback`; on change, mutate
   text/classes/`aria-*`; preserve/restore focus). Architecturally significant —
   confirm the base-helper approach before fanning out.
2. **Batch 3 — focus-visible rings + hover/active/disabled states (~25).**
3. **Batch 4 — ARIA roles + keyboard nav for composite widgets (~18).** Folds
   in the deferred **heading semantics** (render `heading` as a real `<h*>` /
   `role="heading"` with `aria-level`, not a `<div part="title">`).
4. **Batch 5 — form-field completeness (~13):** error/invalid state,
   `ElementInternals`/`name` so values submit.
5. **Batch 7 — polish:** deferred `skeleton` render short-circuit; extra
   jsdom style-assertion tests for rating/rich-text-input/action-menu.

### Deferred CodeRabbit items (intentional, tracked above)
- Heading `role="heading"` semantics → Batch 4 (systematic, not one-off).
- `skeleton` attributeChangedCallback short-circuit → Batch 1/7.
- "add style tests" nitpicks → covered by the screenshot gate; low value.

## How to run things

- `bun run verify` — typecheck + all tests + build (must be green before commit).
- `bun run docs` — dev docs-site at :4600. `bun run site:build` — static build.
- `bun run baselines:regen` — regenerate screenshot baselines **inside the
  pinned container** (needs Docker; see gotchas). `bun run test:regression:pixel`
  runs the exact CI pixel gate locally.
- **Multi-agent sweeps:** the fidelity work uses the Workflow tool. Reusable
  scripts in `scripts/*.workflow.js` (audit, darkmode-sweep, title-rename,
  heading-test-assert) — good templates. Pattern: scout the file list inline,
  then fan out one agent per file (disjoint files → safe parallel edits; never
  let two agents edit the same shared file like `docs-site/examples.ts` — do
  shared-file edits centrally yourself). Requires user opt-in ("ultracode" /
  "use a workflow" / explicit multi-agent request).

## Gotchas / conventions (important)

- **Git identity:** `git config user.email noreply@anthropic.com` +
  `user.name Claude`, or commits show Unverified. (The `8f58d75` merge commit is
  GitHub's own — don't try to re-sign it.)
- **Never** put the model identifier (`claude-opus-4-8`) in commits/PRs/code.
  Commit footer: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` +
  `Claude-Session: …`.
- **PR flow:** open **draft** PRs; CodeRabbit skips drafts and reviews on
  "ready". CI success does **not** fire a webhook — poll check-runs (a short
  background `sleep` timer works) to know when to merge. After merge, reset:
  `git fetch origin main && git checkout -B <branch> origin/main`.
- **Baselines regen needs Docker.** In this sandbox: `sudo -n dockerd &` then
  `bun run baselines:regen`. The proxy blocks `bun.sh`/`github.io`, so
  `container-run.sh` mounts the host Bun binary and forwards the CA bundle; you
  cannot `curl` the live Pages URL from here (proxy 403 — that's expected, not a
  deploy failure).
- **Light vs dark screenshots:** most baselines are light-mode; `surface-surface`
  = `#ffffff` in light, so token-for-white swaps are pixel-identical in light —
  only dark shots change. `components-calendar.png` is **date-dependent** (renders
  "today"); it drifts across days — a latent determinism bug to fix someday
  (pin the demo date).
- **Self-mixing `color-mix` trap:** when tokenizing white, never end up with the
  same token on both operands (`color-mix(surface X%, surface Y%)` is a no-op).
  Use `surface-secondary` for the minority operand. (Caused a regression in #29;
  fixed — but watch for it in future sweeps.)
- **Docs-site content rule:** no invented placeholder content — every card/link/
  token/variant must point at real data. Examples live in `docs-site/examples.ts`
  and the gallery mirror in `tools/preview/gallery.html` (keep both in sync).
- **Repo scope:** GitHub access is limited to `unofficialbox/box-open-elements`.
  Use the `mcp__github__*` tools (no `gh` CLI).

## Open user-facing threads
- The user's original review points are all addressed: token labels ✅,
  dark theme ✅ (Batch 2), Workshop question ✅ (unlinked), "components not very
  good" → the audit + batch program (Batches 1/3/4/5/7 remain).
- Next decision the user was weighing: start **Batch 1** vs pause to review the
  merged result + redeployed site.
