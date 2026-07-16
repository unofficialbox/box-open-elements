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
- Brand imagery: product-illustration contract documented from shipped registry/`box-illustration` assets in `docs/foundations/brand.md` (**open PR #47**). **Still open:** direct review of the Box brand-style-guide Imagery Figma frame (file URL + access not in-repo; do not invent photography/marketing art direction).
- Add Theming and Motion foundation docs when there is real content for them (do not create placeholder pages).

## Patterns

- Explorer search + enriched item columns + UI chrome shipped (#43).
- Defer: `recents` view mode; configurable/permission-gated columns; filter-bar / saved-view wiring.

## Tooling and infrastructure

- Docs site shell + shipped follow-ons (`bun run docs`, variant dropdown from Storybook extraction, dark theme, markdown foundation docs in-shell, GitHub Pages deploy). Guidance cards shipped (#44). Grow coverage by authoring more workshop stories / example notes; do not invent placeholder cards.
- Screenshot pixel-diff CI shipped (`visual-regression` job in `.github/workflows/ci.yml` via pinned Playwright container). Local: `bun run test:regression:pixel` / `bun run baselines:regen`. Calendar docs demo already pins `today` / `month` / `value` (see `docs-site/examples.ts`).
- Storybook workshop shipped (`storybook/`, see `docs/workshop/storybook.md`) — extraction backend for docs-site variants; not deployed publicly.
- `packages/box-server` shipped (see `docs/integration/box-server.md`).
- CI (`bun run verify` + pixel gate) shipped on pushes/PRs.
- Port the style bridge per `docs/integration/style-bridge.md` when the first real re-styling scenario appears.
- Validate and then enforce a repo-wide coverage threshold once a real baseline exists; only hard-gate after the baseline is measured and justified.

## Deliberate deferrals

- Framework adapters (React, Vue, Angular) stay optional layers on top; do not start them before the Web Component catalog stabilizes.
- Box AI preview integrations stay deferred until the annotation contract is stable and provider-neutral (see `docs/patterns/preview.md`).
- Further build-along lessons (preview, share, upload, metadata) wait for authored lesson content — the Explorer lesson already ships (see `docs/workshop/build-alongs.md`).
