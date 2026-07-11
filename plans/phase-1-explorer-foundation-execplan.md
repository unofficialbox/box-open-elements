# Phase 1: Explorer Foundation ExecPlan

## Purpose / Big Picture

After this change, `box-open-elements` contains the full explorer foundation from the roadmap's Phase 1: the complete headless content-explorer stack (collection, navigation, actions, selection, facade controller, data-source contracts, Box transport, wire schemas), the explorer presentation adapters, and the Phase 1 set of generic components (actions, forms, feedback, overlays, collections). A developer can build a working file explorer, picker, or workspace shell from this package alone, verified by `bun run verify`.

Everything is ported from the reference implementation in `box-open-web-components` (a sibling checkout), relocated under the Foundations → Components → Patterns taxonomy.

## Progress

- [x] Reset working branch from merged `main`
- [x] Write this ExecPlan
- [x] Port headless explorer blocks (`collection`, `navigation`, `actions`, `controller`, `types`, `contracts`, `box-transport`, `schemas`) + tests
- [x] Port explorer presentation adapters (`action-menu`, `toolbar`, `list`, `table`, `items`, `breadcrumbs`) + tests
- [x] Port actions components (`icon-button`, `link-button`, `button-group`, `menu`, `menu-item`) + tests
- [x] Port forms components (`search-field`, `text-field`, `text-area`, `select`, `combobox`, `multi-select`, `dropdown`, `checkbox`, `checkbox-group`, `radio-group`) + tests
- [x] Port feedback/overlays/collections components (`spinner`, `skeleton`, `toast`, `alert`, `badge`, `empty-state`, `dialog`, `popover`, `pagination`) + tests
- [x] Update root exports, catalogs, migration map, README status
- [x] `bun run verify` green
- [x] Push and open PR

## Surprises & Discoveries

- The old catalog listed `action-menu`, `toolbar`, `list`, `table`, `items`, and `breadcrumbs` as generic primitives, but their implementations are `BoxExplorer*` elements bound to `ContentExplorerController`. Under the new taxonomy they are explorer presentation adapters, so they live in `src/patterns/content-explorer/adapters/` — the generic versions remain future work in the components catalog.

## Decision Log

- Decision: Explorer-bound `BoxExplorer*` elements port into `patterns/content-explorer/adapters/`, not `components/`.
  Rationale: Components never own transport or controller coupling per `docs/taxonomy.md`; these elements require the explorer controller to function.
  Date/Author: 2026-07-11 / Claude

- Decision: Faithful port — keep tag names, class names, and behavior identical; only relocate paths, update import specifiers, and swap the `--obp-`/`obp:` prefixes for `--boe-`/`boe:` where present.
  Rationale: The reference implementations shipped with dedicated tests and are known-good; API cleanups happen as separate, reviewable changes.
  Date/Author: 2026-07-11 / Claude

- Decision: Replace the minimal `patterns/content-explorer/types.ts` seeded in Phase 0 with the full reference version.
  Rationale: The full version is a superset used by every headless block; the Phase 0 file was a placeholder.
  Date/Author: 2026-07-11 / Claude

## Outcomes & Retrospective

Shipped: full headless explorer stack (5 controllers + contracts + Box transport + wire schemas), 6 explorer adapters, 24 generic components, and the vendored Box iconography manifest, all with their reference tests ported (110 tests total, `bun run verify` green). Root exports, catalogs, migration map, and README updated to match.

Remaining (intentionally out of Phase 1): generic (non-explorer-bound) `list`/`table`/`toolbar`/`action-menu`/`breadcrumbs` variants, `segmented-control` (Phase 3), and everything in roadmap Phases 2+.

Lesson: the reference repo's category labels don't always match its implementations (see Surprises) — check class names and imports, not just catalog placement, when porting.

## Context and Orientation

- Reference repo: `/workspace/box-open-web-components` (read-only source of truth)
- Target: this repo; taxonomy rules in `docs/taxonomy.md`, API rules in `docs/api-guidelines.md`
- Path mapping: `docs/migration-map.md`
- Already present from Phase 0: `src/core`, `src/foundations/tokens`, `src/components/actions/button.ts`, `src/patterns/content-explorer/selection/`

## Plan of Work

1. Port headless blocks into `src/patterns/content-explorer/` with tests under `test/patterns/content-explorer/`.
2. Port explorer adapters into `src/patterns/content-explorer/adapters/` with tests.
3. Port the three generic component batches into `src/components/<category>/` with tests under `test/components/`.
4. Integrate: root `src/index.ts` exports, catalog statuses, migration-map statuses, README current-state section.
5. Verify, push, PR.

## Concrete Steps

From the repository root:

- `bun run typecheck`
- `bun run test`
- `bun run verify`

## Validation and Acceptance

- `bun run verify` passes (typecheck + full vitest suite + build).
- Ported tests preserve the reference repo's behavioral assertions.
- Root exports resolve for every ported module.

## Idempotence and Recovery

All steps are file ports plus config edits; re-running a port overwrites the same target files. If a batch fails typecheck, fix or re-port only that batch — batches are disjoint file sets.

## Interfaces and Dependencies

- `ContentExplorerController` composes `ExplorerCollectionController`, `ExplorerNavigationController`, `ExplorerSelectionController`, `ExplorerActionsController`.
- Adapters depend on `patterns/content-explorer/controller` and `types`.
- `components/actions/icon-button` depends on `foundations/tokens` (`resolveDesignIcon`).
- Wire schemas align with `docs/integration/wire-examples.md`.
