# Handoff — box-open-elements

Snapshot for the next agent picking up this work. Read this first, then
`BACKLOG.md`, `docs/foundations/brand.md` (imagery from Blueprint / UI Elements),
`docs/foundations/tokens.md` (token consumption vs shell contract), and
`docs/audits/component-fidelity-audit.md` (completed fidelity program).

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

- **Branch tip:** develop from `origin/main` (fidelity complete through #42).
- **Live site:** GitHub Pages, `https://unofficialbox.github.io/box-open-elements/`,
  auto-deploys on push to `main` via `.github/workflows/deploy.yml`
  (build cmd `bun run site:build`, output `docs-site/dist`). The Workshop is
  **not** deployed (internal tool).
- **CI** (`.github/workflows/ci.yml`): `Verify` (typecheck + tests + build) and
  `Visual regression` (strict pixel diff inside a pinned Playwright container).
- Recent merged PRs: fidelity Batches 0–7 + #41–**#47** (through brand imagery from
  Blueprint / UI Elements).
- **Open PR #48:** workshop story expansion for docs-site Usage cards —
  `cursor/workshop-guidance-stories-7eb7`.

## Completed initiative: component fidelity program

A multi-agent audit scored all 109 components (avg **2.78/5**, 51 below 3/5,
229 high-severity issues). Full report + per-component data:
`docs/audits/component-fidelity-audit.md` and `…-audit.data.json`. Work is
organized into **systemic sweeps**, not per-component rewrites.

### Done
- **Batch 0 — security** (#29): fixed 3 injection holes (link-button scheme
  validation incl. tab/newline bypass, skeleton CSSOM sizing, content-explorer
  error escaping).
- **Batch 2 — dark mode** (#29): replaced `color-mix(…, white)` with
  `var(--boe-token-surface-surface,#ffffff)` across 94 files; added tokens
  `SurfaceItemSurfaceHover`, `TextTextDanger`.
- **Batch 6** (#29): renamed heading attribute `title`→`heading` across 26
  components, fixed crashing/blank docs examples, humanized Design-Tokens
  labels, unlinked the Workshop.
- **Batch 1 — render-pattern / `BaseElement`** (#31, #32, **#33** merged): every
  catalog component and pattern custom element extends `BaseElement`
  (`renderTemplate` / `setupListeners` / `update`). No remaining
  `attributeChangedCallback → shadowRoot.innerHTML` rebuild loop in
  `src/components` or `src/patterns`. Focus/input/drag fidelity tests added for
  acute surfaces (forms, split-view, carousel, accordion/tabs,
  metadata-filter-builder, drop-zone). See
  [architecture.md](./architecture.md#web-component-render-contract).

- **Batch 3 — focus-visible + hover/active/disabled** (#35 merged
  `1a86235`): shared helpers in `src/foundations/tokens/interaction.ts`
  applied across catalog + pattern interactive parts, with CodeRabbit
  follow-ups (opaque focus-ring fallback, selected-state hover precedence,
  expanded action-menu focus ring, style tests).
- **Batch 4 — ARIA/keyboard + heading semantics** (#38): shared helpers in
  `src/foundations/a11y/`; composite keyboard; modal focus trap/restore;
  heading as native `<h2 part="title">`.
- **Batch 5 — form association + invalid state** (#39):
  `FormAssociatedElement` in `src/core/form-associated.ts` (`name`,
  `invalid`, `error-message`, `ElementInternals`, error styles via
  `SurfaceStatusSurfaceError`). Wired across 13 everyday controls.
- **Batch 7 — polish** (#40): `skeleton` update short-circuit; form association
  for multi-value / niche controls via `FormData` helpers;
  `applyInvalidStateToControls` for multi-focusable fields.
- **Medium/low audit nits** (#41): high-signal per-component polish
  (identity size/fallback, alert/permission a11y, checkbox indeterminate,
  combobox value mapping, accordion collapse/headings, overlay/layout/explorer/
  chart/tree fixes, calendar `today` pin, etc.).
- **Design-heavy leftovers** (#42): floating popover (`placement` +
  open focus), slotted tooltip trigger, explorer `item-gesture` select-vs-
  activate split, app-shell `@container` reflow, nav-sidebar collapsed icon
  contract (`--boe-nav-label-display`).

### Remaining (fidelity)
1. Spacing/token rhythm noise only if needed. Fidelity program is otherwise complete.

### Deferred CodeRabbit items (intentional)
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
- **PR flow:** open **draft** PRs first, then mark **ready for review** so
  CodeRabbit runs (it skips drafts). Poll until the CodeRabbit commit status is
  `Review completed` / success (large diffs can stall — a small push retriggers).
  CI success does **not** fire a webhook — poll check-runs. After merge, reset:
  `git fetch origin main && git checkout -B <branch> origin/main`.
- **Always create/update the PR** for the working branch, then **wait for
  CodeRabbit to finish** before treating the turn as done.
- **Baselines regen needs Docker.** In this sandbox: `sudo -n dockerd &` then
  `bun run baselines:regen`. The proxy blocks `bun.sh`/`github.io`, so
  `container-run.sh` mounts the host Bun binary and forwards the CA bundle; you
  cannot `curl` the live Pages URL from here (proxy 403 — that's expected, not a
  deploy failure).
- **Light vs dark screenshots:** most baselines are light-mode; `surface-surface`
  = `#ffffff` in light, so token-for-white swaps are pixel-identical in light —
  only dark shots change. Calendar demos can pin `today="YYYY-MM-DD"` (docs-site
  example uses `today="2026-07-15"`) so pixel baselines stay deterministic.
- **Self-mixing `color-mix` trap:** when tokenizing white, never end up with the
  same token on both operands (`color-mix(surface X%, surface Y%)` is a no-op).
  Use `surface-secondary` for the minority operand. (Caused a regression in #29;
  fixed — but watch for it in future sweeps.)
- **Docs-site content rule:** no invented placeholder content — every card/link/
  token/variant must point at real data. Examples live in `docs-site/examples.ts`
  and the gallery mirror in `tools/preview/gallery.html` (keep both in sync).
- **Repo scope:** GitHub access is limited to `unofficialbox/box-open-elements`.
  Use the `mcp__github__*` tools (no `gh` CLI).
- **Always update docs** when behavior/architecture/status changes (`HANDOFF.md`,
  owning subsystem docs, catalogs/migration-map when public surface moves).
- **Always commit and push** working branches as you go; open/update the PR each
  turn that lands changes.
- **jsdom ElementInternals** stubs omit `setFormValue` / `setValidity` — use
  `getMirroredFormValue(el.internals)` in tests.

## Open user-facing threads
- Fidelity program complete; #44–#46 merged (guidance cards, token-vs-shell, iconography generator).
- Brand imagery closed from Blueprint + UI Elements product illustrations (**PR #47**).
- Next: grow workshop guidance coverage with real stories/notes; Theming/Motion docs
  only with real content.
