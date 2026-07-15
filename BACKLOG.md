# Backlog

This file tracks the highest-signal follow-up work that is still open. The phased build-out itself lives in [docs/roadmap.md](./docs/roadmap.md); this file is for cross-cutting follow-ups and known debts. Session status for the fidelity program lives in [docs/HANDOFF.md](./docs/HANDOFF.md).

## Component fidelity program

Driver: [docs/audits/component-fidelity-audit.md](./docs/audits/component-fidelity-audit.md).

- **Done:** Batches 0 (security), 1 (`BaseElement` in-place render), 2 (dark mode), 3 (focus/hover/active/disabled), 4 (ARIA/keyboard + heading semantics), 5 (form association + invalid state), 6 (`title`→`heading` + docs fixes).
- **Next:** Batch 7 (polish — skeleton short-circuit, multi-value form assoc, leftover nits).

## Build-out

- Phases 0–5 of `docs/roadmap.md` are complete for catalog parity; further ports are gap-driven, not phase-gated.
- Keep catalogs / migration-map status markers honest as surfaces change.

## Foundations

- Port the iconography generator (`tools/iconography/`) and generate the full icon manifest once the catalog needs more than the curated set (see `docs/foundations/iconography.md`).
- Add explicit per-component guidance for consuming design tokens directly versus relying on shell styling.
- Review the Box brand imagery Figma frame — imagery guidance has been open since the original brand review (see `docs/foundations/brand.md`).
- Add Theming and Motion foundation docs when there is real content for them (do not create placeholder pages).

## Patterns

- Enrich the `ExplorerItem` contract with optional server-neutral summary fields (permissions, ownership, modified date, size, shared-link state) — the thin contract was a known limitation in the reference repo.
- Wire search through the explorer transport/controller end-to-end (contract exists; composition wiring is incomplete).
- Design the explorer view-state model (folder / search / recents) explicitly.

## Tooling and infrastructure

- Docs site shell + shipped follow-ons (`bun run docs`, variant dropdown from Storybook extraction, dark theme, markdown foundation docs in-shell, GitHub Pages deploy). Still open per [docs/workshop/docs-site.md](./docs/workshop/docs-site.md): **Usage/Best-practices guidance cards** — need real per-component keyboard/usage content first (content rule forbids invented placeholders).
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
