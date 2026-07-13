# Roadmap

This document captures the build-out roadmap for `box-open-elements`. It carries forward the prioritization logic from the predecessor's component system plan — which was validated end to end there (all 86 surfaces shipped) — reframed as the rebuild sequence for this repo. `box-open-web-components` is the reference implementation throughout: port deliberately, don't copy blindly, and fix the known API inconsistencies (`heading` vs `title`, `caption` vs `message`) at port time instead of carrying compatibility aliases forward.

The original prioritization was based on comparing Carbon, Material Web, Fluent 2, and Salesforce Lightning base components, filtered by:

1. cross-system frequency
2. fit for explorer, picker, and workspace-style experiences
3. value to third-party developers building custom compositions
4. reusability as headless behavior plus optional presentation adapters

The roadmap is intentionally biased toward enterprise workflows rather than marketing-site components.

## Phase 0: Foundations and scaffold — **done**

- fresh Bun + TypeScript + Vitest scaffold with `typecheck` / `test` / `build` / `verify`
- `src/core` runtime (typed event emitter, controller base)
- `src/foundations/tokens` (design-system registry, Box default bundle, `--boe-token-*` custom properties)
- first exemplar component (`box-button`) and first exemplar headless pattern module (`ExplorerSelectionController`), both tested
- docs reorganized under the Foundations → Components → Patterns taxonomy

## Phase 1: Explorer foundation

The components needed for a credible file explorer, picker, and embedded workspace shell:

1. Button family (`button` done, `icon-button`, `link-button`, `button-group`)
2. Menu family (`menu`, `menu-item`, `action-menu`, `dropdown`)
3. `toolbar`, `breadcrumbs`
4. `list`, `table`, `items`
5. Remaining explorer headless blocks (`collection`, `navigation`, `actions`, `controller`, `contracts`, `box-transport`)
6. `search-field`, `text-field`, `text-area`
7. `select`, `combobox`, `multi-select`
8. `dialog`, `popover`
9. `spinner`, `skeleton`
10. `toast`, `alert`, `badge`, `empty-state`
11. `pagination`
12. `checkbox`, `checkbox-group`, `radio-group`

## Phase 2: Composition depth

1. `tabs`, `card`, `tree`, `tree-grid`
2. `drop-zone`
3. `tooltip`, `help-text`
4. `progress-bar`, `progress-ring`, `progress-steps`
5. `accordion`, `avatar`, `persona`, `illustration`
6. first pattern compositions: search (`filter-bar`, `search-results-header`, `saved-view-picker`) and item (`item-form`, `item-details-panel`, `bulk-action-bar`, `preview-header`)

## Phase 3: Broader app coverage

1. `date-field`, `time-field`, `number-input`, `spin-button`, `slider`, `range-slider`
2. `drawer`, `switch`, `segmented-control`
3. `app-shell`, `split-view`
4. remaining pattern compositions: metadata, share, file-request, task, governance, insights
5. preview pattern: provider adapter, content-preview adapter, annotation surfaces, preview shell
6. the composed `box-content-explorer` surface

## Phase 4: Specialized / domain-specific — **done**

`color-picker`, `dual-listbox`, `rich-text-input`, `rating`, `carousel` — ported with tests; `color-picker` gained the source-level Box styling it never had upstream.

## Phase 5: New gaps (never built anywhere)

From the validated gap analyses ([research/upstream-gaps.md](./research/upstream-gaps.md), [research/component-inventory-comparison.md](./research/component-inventory-comparison.md)):

- strongest first: `chip`/`tag`, `divider` — **done** (`box-chip`, `box-divider`)
- then: standalone `calendar`, tag/token input field — **done** (`box-calendar`, `box-tag-input`)
- component gaps: `nav-sidebar`/`sidebar-toggle-button` — **done** (`box-nav-sidebar`, `box-sidebar-toggle-button`, layout tier); `grid-view` — **done** (`box-grid-view`, collections tier); `fieldset`/`section` — **done** (`box-fieldset` forms tier, `box-section` layout tier); `error-mask` — **done** (`box-error-mask`, feedback tier); `draggable-list` — **done** (`box-draggable-list`, collections tier); `nudge`/`pill-cloud`/`pill-selector-dropdown` — **done** (`box-nudge` feedback tier, `box-pill-cloud` + `box-pill-selector-dropdown` forms tier); then picker list items (`datalist-item`, `contact-datalist-item`), `category-selector`
- pattern compositions: `access-stats`, `collaborator-avatars`
- pattern workflows: `invite-collaborators-modal`, `unified-share-modal`, `presence`
- re-verify each against upstream behavior before building

## Cross-cutting tracks

These run alongside the phases rather than after them:

- **Docs site** — rebuild the component-docs-site shell per [workshop/docs-site.md](./workshop/docs-site.md) once Phase 1 gives it a real catalog to show; wire screenshot checkpoints + regression into CI with it.
- **Storybook** — reintroduce as the extraction backend per [workshop/storybook.md](./workshop/storybook.md) once the docs site exists.
- **Build alongs** — first lesson is Explorer, per [workshop/build-alongs.md](./workshop/build-alongs.md), after the composed explorer surface lands.
- **Server package** — rebuild `packages/box-server` from the original scaffold per [integration/box-server.md](./integration/box-server.md) when the explorer transport lands.
- **API consistency** — apply [api-guidelines.md](./api-guidelines.md) at port time; this rebuild is the chance to shed the old repo's compatibility aliases.

## Headless-first rule

Where possible, components begin as behavior primitives and then gain presentation adapters. The most important headless targets: actions, navigation, collection views (compatible with pagination, infinite scroll, and windowing), selection, overlays, feedback, and forms.

## Ordering notes

- Build the smallest set of components that makes the explorer credible before broadening.
- Some items may ship first as internal building blocks before becoming public components.
- Revisit ordering when the explorer headless blocks are complete.
