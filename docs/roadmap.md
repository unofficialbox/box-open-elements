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
- component gaps: `nav-sidebar`/`sidebar-toggle-button` — **done** (`box-nav-sidebar`, `box-sidebar-toggle-button`, layout tier); `grid-view` — **done** (`box-grid-view`, collections tier); `fieldset`/`section` — **done** (`box-fieldset` forms tier, `box-section` layout tier); `error-mask` — **done** (`box-error-mask`, feedback tier); `draggable-list` — **done** (`box-draggable-list`, collections tier); `nudge`/`pill-cloud`/`pill-selector-dropdown` — **done** (`box-nudge` feedback tier, `box-pill-cloud` + `box-pill-selector-dropdown` forms tier); picker list items + `category-selector` — **done** (`box-datalist-item` collections tier, `box-contact-datalist-item` identity tier, `box-category-selector` forms tier). **All Phase 5 component gaps are now built.**
- pattern compositions: `access-stats`, `collaborator-avatars` — **done** (`box-access-stats`, `box-collaborator-avatars`, share pattern area)
- pattern workflows: `presence` — **done** (`PresenceController` + `box-presence`); `invite-collaborators-modal` — **done** (`InviteCollaboratorsController` + `box-invite-collaborators-modal`, share pattern area); `unified-share-modal` — **done** (`UnifiedShareController` + `box-unified-share-modal`, share pattern area). **All Phase 5 pattern workflows are now built.**

**Phase 5 is complete** — every component gap, pattern composition, and pattern workflow from the gap analyses has shipped with tests.

## Cross-cutting tracks

These run alongside the phases rather than after them:

- **Docs site** — **done** (v1 + follow-ons): the component-docs-site shell is built per [workshop/docs-site.md](./workshop/docs-site.md) — the taxonomy rail, tabbed component pages with live Events/Properties inspectors and runtime-derived API tables, foundations token/icon pages, a dark-mode toggle, variant dropdown (Storybook extraction), and guided build-along lessons (`bun run docs`). Screenshot checkpoints and CI are wired: render-health via `bun run test:regression`, and a **strict pixel-diff gate** in the `visual-regression` CI job inside the pinned Playwright container (`bun run test:regression:pixel` / `bun run baselines:regen`). See [workshop/docs-site.md](./workshop/docs-site.md).
- **Storybook** — **done**: reintroduced Bun-natively as the extraction backend per [workshop/storybook.md](./workshop/storybook.md) — a `storybook/` workshop (typed stories → identity-guarded extracted JSON → a self-contained, separately-deployable static site). See its [README](../storybook/README.md). No Storybook/Vite runtime or consumer dependency.
- **Build-alongs** — **done** (first lesson): the Explorer build-along ships in the docs site per [workshop/build-alongs.md](./workshop/build-alongs.md) — a live-website-first, build-it-yourself guide with a mandatory setup step, per-step live previews and highlighted deltas, copy-whole-file checkpoints, and a copyable standalone starter. Further lessons (preview, share, upload, metadata) are follow-ups.
- **Design system + theming** — **done**: retoned to Box's modernized Blueprint palette with an Inter typography baseline, then a design-QA pass drove focus rings and status colors through design tokens (`color-mix` off `--boe-token-*`) so every surface adapts between light and dark instead of leaving hardcoded, off-brand, or non-theming values.
- **Server package** — **done**: `packages/box-server` rebuilt per [integration/box-server.md](./integration/box-server.md) — CCG auth + REST client, Box-backed explorer/share/metadata data sources, DTO mappers, and framework-neutral route handlers, all dependency-free (platform `fetch`) and covered by `bun run verify`.
- **API consistency** — apply [api-guidelines.md](./api-guidelines.md) at port time; this rebuild is the chance to shed the old repo's compatibility aliases.

## Headless-first rule

Where possible, components begin as behavior primitives and then gain presentation adapters. The most important headless targets: actions, navigation, collection views (compatible with pagination, infinite scroll, and windowing), selection, overlays, feedback, and forms.

## Ordering notes

- Build the smallest set of components that makes the explorer credible before broadening.
- Some items may ship first as internal building blocks before becoming public components.
- Revisit ordering when the explorer headless blocks are complete.
