# Phase 3: Broader App Coverage ExecPlan

## Purpose / Big Picture

After this change, `box-open-elements` contains the roadmap's Phase 3 — the rest of the catalog except the deliberately deferred Phase 4 specialized components: the remaining app-shell and form components, every remaining pattern area (metadata, share, preview, file-request, task, governance, insights) with their contracts and wire schemas, the provider-neutral preview adapter stack, and both composed workflow surfaces (`box-content-explorer`, `box-preview-element`). Verified by `bun run verify` and the real-browser screenshot gallery.

## Progress

- [x] Port 11 components: `date-field`, `time-field`, `number-input`, `spin-button`, `slider`, `range-slider`, `switch`, `drawer`, `segmented-control`, `app-shell`, `split-view` + tests
- [x] Port metadata area: `contracts`, `schemas`, `metadata-filter-builder`, `metadata-inspector` + tests
- [x] Port share area: `contracts`, `schemas`, `permission-matrix`, `share-panel` + tests
- [x] Port preview area: `provider-adapter`, `content-preview-adapter`, `annotation-toolbar`, `annotation-inspector`, `annotation-thread`, `box-preview-element` + tests
- [x] Port file-request, task, governance, insights compositions + tests
- [x] Port composed `box-content-explorer` surface + test
- [x] Area indexes, root exports, package-exports entries for the new areas
- [x] Extend the screenshot gallery with insights, share/governance, task/file-request, preview, and composed-explorer sections; recapture
- [x] Update catalogs, README, this ExecPlan
- [x] `bun run verify` green

## Surprises & Discoveries

- None material — the Phase 1/2 transform rules applied cleanly; all 262 tests passed on the first full run after the port.
- The insights compositions ship with real Box-blue styling (unlike the deliberately unopinionated controls), which shows clearly in the new gallery screenshots.

## Decision Log

- Decision: The composed surfaces live inside their pattern areas (`patterns/content-explorer/content-explorer.ts`, `patterns/preview/preview-element.ts`) rather than a separate top-level elements directory.
  Rationale: Per the taxonomy, each pattern area owns its headless modules, adapters, and composed surfaces together.
  Date/Author: 2026-07-11 / Claude

- Decision: Same faithful-port rules as Phases 1–2; schema `$id` strings renamed to `box-open-elements/patterns/<area>/...`.
  Date/Author: 2026-07-11 / Claude

## Outcomes & Retrospective

Shipped: 11 components, 17 pattern compositions, metadata/share contracts + schemas, the preview adapter stack, and both composed workflow surfaces — with all reference tests (262 tests across 95 files, `bun run verify` green) and refreshed gallery screenshots (11 sections, including the functional composed explorer).

The full 86-surface reference catalog is now rebuilt except the five Phase 4 specialized components (`color-picker`, `dual-listbox`, `rich-text-input`, `rating`, `carousel`), which stay deferred until a product need appears.

## Context and Orientation

Same as Phases 1–2: reference repo at `/workspace/box-open-web-components`, transforms in `docs/migration-map.md`, gallery harness at `tools/preview/`.

## Plan of Work / Concrete Steps / Validation and Acceptance

Same mechanics as Phases 1–2: scripted copy + import-path/prefix transforms, ported tests, area indexes, exports, then `bun run verify` and `bun run preview:capture`.

## Idempotence and Recovery

Re-running a port overwrites the same target files; batches are disjoint.

## Interfaces and Dependencies

- `box-content-explorer` composes `ContentExplorerController` from its attributes and accepts an injected `transport` property.
- `box-preview-element` exposes the provider-adapter contract (`provider`, `adapterState`, `action`, `provider-action`).
- Metadata and share wire schemas align with `docs/integration/wire-examples.md`.
