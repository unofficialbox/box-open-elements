# Backlog

This file tracks the highest-signal follow-up work that is still open. The phased build-out itself lives in [docs/roadmap.md](./docs/roadmap.md); this file is for cross-cutting follow-ups and known debts. Session status for the fidelity program lives in [docs/HANDOFF.md](./docs/HANDOFF.md).

## Component fidelity program

Driver: [docs/audits/component-fidelity-audit.md](./docs/audits/component-fidelity-audit.md).

- **Done:** Batches 0 (security), 1 (`BaseElement` in-place render), 2 (dark mode), 3 (focus/hover/active/disabled), 6 (`title`→`heading` + docs fixes).
- **Next:** Batch 4 (ARIA/keyboard + heading semantics) → Batch 5 (form association) → Batch 7 (polish).

## Build-out

- Phases 0–5 of `docs/roadmap.md` are complete for catalog parity; further ports are gap-driven, not phase-gated.
- Keep catalogs / migration-map status markers honest as surfaces change.

## Foundations

- Port the iconography generator (`tools/iconography/`) and generate the full icon manifest once the catalog needs more than the curated set (see `docs/foundations/iconography.md`).
- Add explicit per-component guidance for consuming design tokens directly versus relying on shell styling.
- Review the Box brand imagery Figma frame — imagery guidance has been open since the original brand review (see `docs/foundations/brand.md`).
- Add Theming and Motion foundation docs when there is real content for them (do not create placeholder pages).

## Patterns

- Enrich the `ExplorerItem` contract with optional server-neutral summary fields (permissions, ownership, modified date, size, shared-link state) when the collection block lands — the thin contract was a known limitation in the reference repo.
- Wire search through the explorer transport/controller (it existed only in the data-source contract before).
- Design the explorer view-state model (folder / search / recents) explicitly.

## Tooling and infrastructure

- Docs site v1 shipped (`bun run docs`, see `plans/docs-site-v1-execplan.md`). Device-size preview toolbar, Related-links cards, and a real dark theme (the `box-dark` token bundle plus a footer toggle) now shipped. Remaining per `docs/workshop/docs-site.md`: variant dropdown (needs per-variant data), Usage/Best-practices guidance cards (need per-component keyboard docs), in-shell markdown foundation docs; then wire screenshot checkpoints + regression into CI alongside `bun run verify`.
  - A first real-browser harness now exists: `bun run preview:capture` renders `tools/preview/gallery.html` (built dist + Box tokens + mock explorer) in headless Chromium and writes `docs/screenshots/gallery/*.png`. Grow this into the checkpoint/regression pipeline.
  - Carried caution from the predecessor: its demo-regression CI job was `continue-on-error` due to a CI-only race between `networkidle` and async panel activation; root-cause properly before hard-gating here.
- Reintroduce Storybook as the extraction backend per `docs/workshop/storybook.md` after the docs site exists.
- Port the style bridge per `docs/integration/style-bridge.md` when the first real re-styling scenario appears.
- Rebuild `packages/box-server` from the original scaffold when the explorer transport lands.
- Add CI (GitHub Actions) running `bun run verify` on pushes and pull requests.
- Validate and then enforce a repo-wide coverage threshold once a real baseline exists; only hard-gate after the baseline is measured and justified.

## Deliberate deferrals

- Framework adapters (React, Vue, Angular) stay optional layers on top; do not start them before the Web Component catalog stabilizes.
- Box AI preview integrations stay deferred until the annotation contract is stable and provider-neutral (see `docs/patterns/preview.md`).
- Build-along lessons wait for the composed explorer surface (see `docs/workshop/build-alongs.md`).
