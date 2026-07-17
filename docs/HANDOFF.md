# Handoff — box-open-elements

Snapshot for the next agent picking up this work. Read this first, then
`BACKLOG.md`, `docs/foundations/brand.md` (imagery from Blueprint / UI Elements),
`docs/foundations/tokens.md` (token consumption vs shell contract), and
`docs/audits/box-design-fidelity-reconciliation.md` (active visual-fidelity program).

## What this repo is

A framework-agnostic **Web Components** design system for Box workflows
(Bun + TypeScript + Vitest). Tokens are `--boe-token-*` CSS custom properties
with hex fallbacks; two bundles — `box-default` (light) and `box-dark`
(`src/foundations/tokens/`). Components live in `src/components/<category>/`,
pattern compositions in `src/patterns/<area>/`. There is a **docs-site** SPA
(`docs-site/`, hash-router, consumes the built library via an import map) and an
internal **Storybook workshop** (`storybook/`) whose stories are extracted to
`storybook/generated/workshop.json` and feed the docs-site variant dropdown.

## Current state (as of 2026-07-17)

- **Active branch:** `codex/light-mode-state-reconciliation`. The branch contains the exhaustive design-fidelity audit, Slice 0 reference/state harness, and Slice 1a Inter typography foundation. See the concise root [HANDOFF.md](../HANDOFF.md).
- **Live site:** GitHub Pages, `https://unofficialbox.github.io/box-open-elements/`,
  auto-deploys on push to `main` via `.github/workflows/deploy.yml`
  (build cmd `bun run site:build`, output `docs-site/dist`). The Workshop is
  **not** deployed (internal tool).
- **CI** (`.github/workflows/ci.yml`): `Verify` (typecheck + **coverage-gated** tests + build) and
  `Visual regression` (strict pixel diff inside a pinned Playwright container).
  Coverage floors: [docs/coverage-baseline.md](./coverage-baseline.md).
- Recent merged work through **#73** includes the earlier systemic fidelity batches, 108-story workshop, density/BUE visual conformance, React adapter PoC, agent workflow rules, the BUE Content Explorer style-bridge config, documentation synchronization, and the four-framework progress tracker.
- **Current visual status:** catalog presence and earlier systemic fixes are complete, but professional Box parity is not. The exhaustive 2026-07-17 reconciliation covers all 8 documented foundations, 72 components, and 36 rendered patterns. Slice 0 ships a dated reference contract plus deterministic desktop/mobile state baselines. Slice 1a establishes Inter across all 107 rendered hosts and pins one official Inter Variable asset for docs/visual tests. Slice 1b geometry, elevation, surface, icon, and interaction roles is next in `plans/box-design-fidelity-reconciliation-execplan.md`.
- **Known docs-shell follow-up:** at a 390px viewport the shell still measures 604px wide. This is an existing responsive-layout defect, not a typography fallback.
- Workshop stories: **108** extracted surfaces (full catalog). Workshop UI runs live `setup()` for controller-bound explorer demos; extraction still strips `setup`.
- Content explorer: folder host chrome + **Metadata query chrome** docs-site variant (`docs-site/explorer-metadata-demo.ts`) — host-owned, not a controller view mode.
- Foundations/tooling: theming + motion docs; `src/foundations/motion`; style bridge CLI + BUE Content Explorer config; explorer host bindings for filter-bar / saved views.
- Build-alongs: Explorer + Share + Preview lessons in `docs-site/lessons.ts` (Share/Preview are attribute/JSON + events; Explorer uses mock transport).
- **Density:** full-catalog chrome pass + maintainer audit (`bun tools/density-audit.ts`). Reference = segmented-control.

## Earlier initiative: systemic component fidelity program

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

The earlier batches closed major security, behavior, accessibility, and systemic styling defects; they did not establish professional visual parity. Follow the exhaustive row-by-row audit in `docs/audits/box-design-fidelity-reconciliation.md` and the active ExecPlan in `plans/box-design-fidelity-reconciliation-execplan.md`. Do not describe visual fidelity as complete until those rows are reconciled and verified against current Box.

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

- Preserve the repository's configured Git identity; do not rewrite authorship or add model/session identifiers to commits, PRs, or source.
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
- **Repo scope:** keep GitHub operations limited to `unofficialbox/box-open-elements`; use the available GitHub tooling for status and PR work.
- **Always update docs** when behavior/architecture/status changes (`HANDOFF.md`,
  owning subsystem docs, catalogs/migration-map when public surface moves).
- **Always commit and push** working branches as you go; open/update the PR each
  turn that lands changes.
- **jsdom ElementInternals** stubs omit `setFormValue` / `setValidity` — use
  `getMirroredFormValue(el.internals)` in tests.

## Open user-facing threads
- Fidelity program complete; workshop at **108** extracted stories; explorer metadata host chrome shipped.
- Density peer-consistency + Foundations GFM tables shipped.
- **BUE visual conformance**: controls, overlays/tabs/feedback, drawer, and pattern shells aligned via `boeOverlay` / `boePanel` geometry tokens.
- Motion literals migrated to `boeMotionDuration` / `interactive`.
- Explorer Folder host chrome swaps list/table adapters via filter-bar `onViewChange`.
- `recents` still needs a transport contract; configurable columns remain open.
- Framework adapter progress is tracked in `docs/integration/framework-adapters.md`: React is **Validated** with `BoxButton`, `BoxTextField`, and `BoxSelect`; its next Beta proof is an overlay + controller composition + SSR guidance. Angular, Vue, and Svelte remain Tracked. Explorer `recents` remains blocked on a real transport contract.
