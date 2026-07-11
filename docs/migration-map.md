# Migration Map: box-open-web-components → box-open-elements

This document maps everything in the original repo onto the new taxonomy so ports are mechanical and nothing gets lost. The original repo remains the reference implementation until a surface is rebuilt here.

## Tier mapping

| Old | New | Notes |
| --- | --- | --- |
| *(unnamed: tokens rail tab + brand/iconography docs)* | `Foundations` | now a first-class tier — the structural gap the old repo's own research identified |
| `Primitives` (`src/web-components/primitives/**`) | `Components` (`src/components/**`) | same ten categories |
| `Composites` (`src/web-components/composites/**`) | `Patterns` — compositions (`src/patterns/<area>/**`) | grouped by Box noun, unchanged |
| `Elements` (`src/web-components/elements/**`) | `Patterns` — workflows | content explorer, preview shell |
| Headless layer (`src/elements/**`) | `Patterns` — headless modules | controllers/contracts live inside their pattern area |
| `src/design-system/**` | `src/foundations/tokens/**` (+ future `foundations/icons`) | token prefix `--obp-token-*` → `--boe-token-*`; change event `obp:design-system-change` → `boe:design-system-change` |
| `src/core/**` | `src/core/**` | unchanged support layer |
| `packages/box-server` | future `packages/box-server` | same boundary; see [integration/box-server.md](./integration/box-server.md) |

## Import path mapping

| Old | New |
| --- | --- |
| `box-open-web-components` | `box-open-elements` |
| `box-open-web-components/web-components/primitives/<category>/<name>` | `box-open-elements/components/<category>/<name>` |
| `box-open-web-components/web-components/composites/<category>/<name>` | `box-open-elements/patterns/<category>/<name>` |
| `box-open-web-components/web-components/elements/<name>` | `box-open-elements/patterns/<area>` composed surface |
| `box-open-web-components/elements/content-explorer/<module>` | `box-open-elements/patterns/content-explorer/<module>` |
| `box-open-web-components/elements/preview/*` | `box-open-elements/patterns/preview/*` |
| `box-open-web-components/elements/metadata/contracts` | `box-open-elements/patterns/metadata/contracts` |
| `box-open-web-components/elements/share/contracts` | `box-open-elements/patterns/share/contracts` |

Custom element tag names (`box-button`, `box-dialog`, …) are unchanged.

## Component mapping

All 61 primitives map 1:1 into `src/components/` with the same category and name:

- `primitives/actions/*` → `components/actions/*` (action-menu, button, button-group, icon-button, link-button, menu, menu-item, segmented-control, toolbar)
- `primitives/collections/*` → `components/collections/*` (card, carousel, items, list, pagination, table, tree, tree-grid)
- `primitives/feedback/*` → `components/feedback/*` (alert, badge, empty-state, help-text, progress-bar, progress-ring, progress-steps, skeleton, spinner, toast)
- `primitives/files/*` → `components/files/*` (drop-zone)
- `primitives/forms/*` → `components/forms/*` (checkbox, checkbox-group, color-picker, combobox, date-field, dropdown, dual-listbox, multi-select, number-input, radio-group, range-slider, rating, rich-text-input, search-field, select, slider, spin-button, switch, text-area, text-field, time-field)
- `primitives/identity/*` → `components/identity/*` (avatar, persona)
- `primitives/layout/*` → `components/layout/*` (app-shell, split-view)
- `primitives/navigation/*` → `components/navigation/*` (accordion, breadcrumbs, tabs)
- `primitives/overlays/*` → `components/overlays/*` (dialog, drawer, popover, tooltip)
- `primitives/visuals/*` → `components/visuals/*` (illustration)

All 23 composites map 1:1 into `src/patterns/` with the same area and name:

- `composites/search/*` → `patterns/search/*` (filter-bar, saved-view-picker, search-results-header)
- `composites/item/*` → `patterns/item/*` (bulk-action-bar, item-details-panel, item-form, preview-header)
- `composites/metadata/*` → `patterns/metadata/*` (metadata-filter-builder, metadata-inspector)
- `composites/preview/*` → `patterns/preview/*` (annotation-inspector, annotation-thread, annotation-toolbar)
- `composites/share/*` → `patterns/share/*` (permission-matrix, share-panel)
- `composites/file-request/*` → `patterns/file-request/*` (file-request-builder)
- `composites/task/*` → `patterns/task/*` (review-queue-item, task-assignment-panel)
- `composites/governance/*` → `patterns/governance/*` (governance-panel)
- `composites/insights/*` → `patterns/insights/*` (bar-chart, chart-panel, donut-chart, line-chart, metric-card)

Both elements map into their pattern areas:

- `elements/content-explorer` → `patterns/content-explorer` composed surface
- `elements/preview-element` → `patterns/preview` composed surface

Headless modules:

- `elements/content-explorer/{controller,navigation,collection,selection,actions,types,contracts,box-transport,schemas}` → `patterns/content-explorer/*` (selection is already ported)
- `elements/preview/{provider-adapter,content-preview-adapter}` → `patterns/preview/*`
- `elements/metadata/{contracts,schemas}` → `patterns/metadata/*`
- `elements/share/{contracts,schemas}` → `patterns/share/*`

## Docs mapping

| Old doc | New home |
| --- | --- |
| `docs/taxonomy.md` | `docs/taxonomy.md` (rewritten for the new tiers) |
| `docs/architecture.md` | `docs/architecture.md` |
| `docs/component-api-guidelines.md` | `docs/api-guidelines.md` (+ accessibility split into `docs/foundations/accessibility.md`) |
| `docs/component-system-plan.md` | `docs/roadmap.md` (status noise dropped; tiers/phases kept) |
| `docs/web-components-catalog.md` | `docs/components/catalog.md` |
| `docs/elements-catalog.md` | `docs/patterns/catalog.md` |
| `docs/content-explorer-composition.md` | `docs/patterns/content-explorer.md` |
| preview direction (in api-guidelines + system plan) | `docs/patterns/preview.md` |
| `docs/box-brand-reference.md` | `docs/foundations/brand.md` |
| `docs/iconography.md` | `docs/foundations/iconography.md` |
| `docs/blueprint-web-assets-integration.md` | `docs/foundations/tokens.md` |
| `docs/box-server-integration.md` + `docs/box-server-package.md` | `docs/integration/box-server.md` |
| `docs/box-wire-examples.md` | `docs/integration/wire-examples.md` |
| `docs/style-bridge.md` | `docs/integration/style-bridge.md` |
| `docs/design-system-taxonomy-comparison.md` | `docs/research/taxonomy-comparison.md` |
| `docs/design-system-component-inventory-comparison.md` | `docs/research/component-inventory-comparison.md` |
| `docs/box-blueprint-web-conformance-matrix.md` (upstream comparison section) | `docs/research/upstream-gaps.md` (the old self-audit tables describe old-repo state and were not carried) |
| `docs/demo-design-language.md` + `docs/demo-app.md` + docs-site ExecPlan decisions | `docs/workshop/docs-site.md` |
| `docs/storybook-pilot.md` + Storybook ExecPlan decisions | `docs/workshop/storybook.md` |
| Build Along ExecPlan lesson anatomy | `docs/workshop/build-alongs.md` |
| `AGENTS.md`, `PLANS.md`, `BACKLOG.md` | same names, adapted |
| `docs/HANDOFF.md`, `docs/codex-workflow.md`, visual-review logs, screenshot checkpoints | not carried — old-repo session mechanics; the durable ideas (screenshot regression as a guardrail, skills/subagents split) are noted in `AGENTS.md` and `docs/workshop/docs-site.md` |

## Deliberately not carried

- The 86-row conformance self-audit tables (they certified old-repo test coverage, not a component spec).
- Demo shell implementation notes tied to `demo/*.ts` files that don't exist here yet.
- Archived Build Along fixtures and tests.
- Stale ExecPlan progress checklists (several were out of date; top-of-file status notes were treated as authoritative).
