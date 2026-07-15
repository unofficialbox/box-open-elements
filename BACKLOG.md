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

- **Open PR #45:** iconography generator (`tools/iconography/`, `bun run icons:generate`) — full 472-icon manifest already vendored; regenerate from the external pack when the inventory updates (see `docs/foundations/iconography.md`).
- Add explicit per-component guidance for consuming design tokens directly versus relying on shell styling.
- Review the Box brand imagery Figma frame — imagery guidance has been open since the original brand review (see `docs/foundations/brand.md`).
- Add Theming and Motion foundation docs when there is real content for them (do not create placeholder pages).

## Patterns

- Explorer search + enriched item columns + UI chrome shipped (#43).
- Defer: `recents` view mode; configurable/permission-gated columns; filter-bar / saved-view wiring.

## Tooling and infrastructure

- Docs site shell + shipped follow-ons (`bun run docs`, variant dropdown, dark theme, markdown foundation docs, GitHub Pages, Usage/Best-practices/Keyboard guidance cards — #44). Grow guidance coverage by authoring more workshop stories / example notes; do not invent placeholder cards.
- Screenshot pixel-diff CI shipped (`visual-regression` job in `.github/workflows/ci.yml` via pinned Playwright container). Local: `bun run test:regression:pixel` / `bun run baselines:regen`. Latent: `components-calendar.png` is date-dependent (pin the demo date someday).
- Storybook workshop shipped (`storybook/`, see `docs/workshop/storybook.md`) — extraction backend for docs-site variants; not deployed publicly.
- `packages/box-server` shipped (see `docs/integration/box-server.md`).
- CI (`bun run verify` + pixel gate) shipped on pushes/PRs.
- Port the style bridge per `docs/integration/style-bridge.md` when the first real re-styling scenario appears.
- Validate and then enforce a repo-wide coverage threshold once a real baseline exists; only hard-gate after the baseline is measured and justified.

## Deliberate deferrals

- Framework adapters (React, Vue, Angular) stay optional layers on top; do not start them before the Web Component catalog stabilizes.
- Box AI preview integrations stay deferred until the annotation contract is stable and provider-neutral (see `docs/patterns/preview.md`).
- Further build-along lessons (preview, share, upload, metadata) wait for authored lesson content — the Explorer lesson already ships (see `docs/workshop/build-alongs.md`).
