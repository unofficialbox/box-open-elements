# Phase 2: Composition Depth ExecPlan

## Purpose / Big Picture

After this change, `box-open-elements` contains the roadmap's Phase 2: fourteen additional components (navigation, collections, files, overlays, feedback, identity, visuals) and the first two pattern-composition areas (`search`, `item`). This completes the component depth needed for richer catalog pages and gives the patterns tier its first display-oriented compositions. Verified by `bun run verify`.

## Progress

- [x] Port navigation components (`tabs`, `accordion`) + tests
- [x] Port collections components (`card`, `tree`, `tree-grid`) + tests
- [x] Port `drop-zone`, `tooltip`, `help-text`, `progress-bar`, `progress-ring`, `progress-steps` + tests
- [x] Port identity (`avatar`, `persona`) and visuals (`illustration`) + tests
- [x] Port search compositions (`filter-bar`, `search-results-header`, `saved-view-picker`) + tests
- [x] Port item compositions (`item-form`, `item-details-panel`, `bulk-action-bar`, `preview-header`) + tests
- [x] Area indexes for `patterns/search` and `patterns/item`; root export updates
- [x] Fix the `./patterns/*` package-exports contract (see Decision Log)
- [x] Update catalogs and README status
- [x] `bun run verify` green

## Surprises & Discoveries

- The Phase 1 `./patterns/*` exports wildcard mapped every specifier to `dist/patterns/*/index.js`, which resolved directory-index modules (`patterns/content-explorer/selection`) but silently broke file modules (`patterns/content-explorer/contracts`, the adapters). Latent until Phase 2 added more file modules.

## Decision Log

- Decision: The `./patterns/*` wildcard now maps to `./dist/patterns/*.js` (file modules), with explicit exact entries for each directory-index module (area roots plus the four explorer headless blocks). Exact keys beat patterns in Node exports resolution, so both import shapes work.
  Rationale: A single wildcard cannot resolve both `dir/index.js` and `file.js` shapes; explicit per-area entries are bounded (one per pattern area) and correctness beats the "wildcard by default" preference.
  Date/Author: 2026-07-11 / Claude

- Decision: Same faithful-port rules as Phase 1 (`plans/phase-1-explorer-foundation-execplan.md`).
  Date/Author: 2026-07-11 / Claude

## Outcomes & Retrospective

Shipped: 14 components + 7 compositions with all reference tests (176 tests total across 62 files, `bun run verify` green), the exports-contract fix, and doc/status updates. Remaining: roadmap Phase 3+ (app-shell tier, remaining forms, preview/metadata/share/etc. pattern areas, composed `box-content-explorer`).

## Context and Orientation

Same as Phase 1: reference repo at `/workspace/box-open-web-components`, transforms documented in `docs/migration-map.md`.

## Plan of Work / Concrete Steps / Validation and Acceptance

Same mechanics as Phase 1: scripted copy + import-path/prefix transforms, per-batch tests, then `bun run verify`. Acceptance: verify green with all ported reference assertions intact.

## Idempotence and Recovery

Re-running a port overwrites the same target files; batches are disjoint.

## Interfaces and Dependencies

- `help-text` and `illustration` depend on `foundations/tokens/registry` (`resolveDesignIcon` / `resolveDesignIllustration`, `DESIGN_SYSTEM_CHANGE_EVENT`).
- `patterns/search/*` and `patterns/item/*` are prop-fed compositions with no transport, per `docs/patterns/catalog.md`.
