# Backlog

This file tracks the highest-signal follow-up work that is still open. The phased build-out itself lives in [docs/roadmap.md](./docs/roadmap.md); this file is for cross-cutting follow-ups and known debts. Session status for the fidelity program lives in [docs/HANDOFF.md](./docs/HANDOFF.md).

## Component fidelity program

Driver: [docs/audits/component-fidelity-audit.md](./docs/audits/component-fidelity-audit.md).

- **Done (merged):** Batches 0–7 + medium/low audit nits (#41) + design-heavy leftovers (#42).
- **Complete** for the fidelity program (spacing/token rhythm only if needed).

## Build-out

- Phases 0–5 of `docs/roadmap.md` are complete for catalog parity; further ports are gap-driven, not phase-gated.
- Keep catalogs / migration-map status markers honest as surfaces change.

## Foundations

- Iconography generator shipped (#45): `tools/iconography/`, `bun run icons:generate`. Full 472-icon manifest already vendored; regenerate from the external pack when the inventory updates (see `docs/foundations/iconography.md`).
- Token consumption vs shell / consumer overrides documented in `docs/foundations/tokens.md`; docs-site API tab lists derived `--boe-token-*` usage from live preview shadow styles (#46). No per-component strategy fields — source-level styling is the contract.
- Brand imagery closed from Blueprint + `box-ui-elements` product illustrations (monochrome Box-blue vectors for empty/education states) — see `docs/foundations/brand.md`. No Figma dependency.
- **Theming** foundation doc shipped (`docs/foundations/theming.md`) — runtime register/activate/apply/observe lifecycle.
- **Motion** foundation shipped (`src/foundations/motion/`, `docs/foundations/motion.md`) — shared durations/easing + reduced-motion helper; migrate remaining hard-coded transition literals opportunistically when touching styles.

## Patterns

- Explorer search + enriched item columns + UI chrome shipped (#43).
- **Active:** host wiring for `box-filter-bar` / `box-saved-view-picker` → explorer search (`bindFilterBarToExplorer`, `bindSavedViewPickerToExplorer` in `patterns/content-explorer`).
- **Next slices:**
  - Host demo in docs-site that composes filter-bar + saved-view + explorer (local presets).
  - Presentation switch (list/table) via filter-bar `view` + `onViewChange`.
  - `recents` view mode once a real transport contract exists (do not fake as a folder listing).
  - Configurable / permission-gated columns.

## Tooling and infrastructure

- Docs site shell + shipped follow-ons (`bun run docs`, variant dropdown from Storybook extraction, dark theme, markdown foundation docs in-shell, GitHub Pages deploy). Guidance cards shipped (#44). Workshop stories at **49** surfaces through #52. Grow coverage by authoring more workshop stories / example notes; do not invent placeholder cards.
- Screenshot pixel-diff CI shipped (`visual-regression` job in `.github/workflows/ci.yml` via pinned Playwright container). Local: `bun run test:regression:pixel` / `bun run baselines:regen`. Calendar docs demo already pins `today` / `month` / `value` (see `docs-site/examples.ts`).
- Storybook workshop shipped (`storybook/`, see `docs/workshop/storybook.md`) — extraction backend for docs-site variants; not deployed publicly.
- `packages/box-server` shipped (see `docs/integration/box-server.md`).
- CI (`bun run verify` + pixel gate) shipped on pushes/PRs. Agent CI/PR monitoring rules shipped in `AGENTS.md` (#50): poll checks, fix red immediately, cancel/rerun stuck runs.
- **Coverage baseline measured and hard-gated** (**Open PR #54**) — see [docs/coverage-baseline.md](./docs/coverage-baseline.md). `bun run verify` runs `test:coverage` with floors (lines/statements 80%, functions 85%, branches 65%). Raise floors only after a fresh measurement.
- **Style bridge shipped** (`tools/style-bridge/`, `bun run style-bridge`) — selector-bridge + token-bridge for the documented CSS/SCSS subset. Add real library configs only when restyling a concrete stylesheet.

## Active follow-ups (formerly deferred)

| Area | First slice | Notes |
| --- | --- | --- |
| Framework adapters | Thin React wrapper PoC for one everyday control (e.g. `box-button`) | Optional layer; do not block Web Component work |
| Preview / Box AI | Keep annotation + provider-adapter seams provider-neutral; document AI-specific UI only when contract-stable | See `docs/patterns/preview.md` |
| Build-along lessons | Author next lesson (preview or share) on existing lesson infra | Explorer lesson already ships; no new infra needed |
| Explorer recents | Transport + controller `recents` mode after contract exists | Host filter-bar / saved-view binding already available |
| Motion migration | Opportunistic replacement of hard-coded `120ms`/`140ms` literals | Foundation vocabulary already exists |
| Style-bridge configs | First real third-party stylesheet mapping | Engine/CLI already ship |

Do **not** invent placeholder docs, cards, or lessons — only real/derived content.
