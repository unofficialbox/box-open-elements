# Upstream Gap Analysis: box/box-ui-elements

This document is the condensed, durable version of the upstream comparison originally in `box-open-web-components/docs/box-blueprint-web-conformance-matrix.md`. It compares the 86-component target catalog (61 components, 23 pattern compositions, 2 workflow patterns — see [../migration-map.md](../migration-map.md)) against the real upstream inventory in [box/box-ui-elements](https://github.com/box/box-ui-elements): `src/components` (77 entries) and `src/features` (28 entries), fetched directly from GitHub on 2026-07-06.

The old matrix's 86-row self-audit tables certified the *old repo's* implementation/test status and were deliberately not carried over; the upstream comparison below is the durable part.

## Method and caveat

This is a first-pass, name-and-concept-level comparison, not a behavior-level audit. `Covered` means a catalog entry addresses the same concept (naming may differ, e.g. upstream `text-input` vs. `text-field`). **Before building anything from the `Missing` lists, re-verify against the actual upstream source and component behavior — do not treat this as a build queue without that check.**

## Headline findings

- Most upstream entries the catalog lacks are **utilities** (`i18n`, `hotkeys`, `focus-trap`, `portal`, `popper`, `media-query`, `scroll-wrapper`, `react-virtualized-helpers`, `badgeable`, `accessible-svg`, `form-elements`) or **Box-internal tooling** (`sandbox-banner`, `security-cloud-game`, `targeting`, `in-app-messenger`, `message-center`, `message-preview-*`, `header-flyout`) — explicitly out of scope unless a specific need arises.
- A handful are narrow/low-value on their own: `logo`, `time`, `footer-indicator`, `image-tooltip`, `select-button`.
- Roughly a dozen are **genuine, broadly useful gaps**, assigned to tiers below.
- Upstream's `src/features` folder does not justify a fourth tier — seven major design systems converge on a top "Patterns" tier for exactly this kind of surface (see [taxonomy-comparison.md](./taxonomy-comparison.md)).

## Recommended additions worth scoping

### Components (single controls / small focused surfaces)

- `category-selector`, `contact-datalist-item`, `datalist-item` — people/category picker list items
- `draggable-list` — drag-to-reorder collection
- `error-mask` — dedicated full-section error state (distinct from `empty-state`)
- `fieldset`, `section` — form/layout grouping
- `grid-view` — a grid/gallery collection view mode alongside `list`/`table`
- `nav-sidebar`, `left-sidebar`, `sidebar-toggle-button` — layout components, same tier as `app-shell` and `split-view`
- `nudge`, `pill-cloud`, `pill-selector-dropdown` — smaller form/feedback controls

### Patterns — compositions (data injected via props, no owned transport)

- `access-stats` — file-access-statistics display; same "data injected, not fetched" model as the insights compositions
- `collaborator-avatars` — stacked avatar-group display

### Patterns — workflows (transport, orchestration, or live data)

- `presence` — real-time collaborator-activity indicators (needs a live data subscription)
- `invite-collaborators-modal` — a real multi-step workflow (pick people, set permissions, send invites, surface errors) needing a transport-aware controller
- `unified-share-modal` — Box's most orchestration-heavy composed share surface; belongs at the workflow tier, not as an extension of the `share-panel` composition

## Partial-coverage notes worth remembering

- `close-button` — `icon-button` can serve this; consider a dedicated variant
- `context-menu` — `menu`/`action-menu` cover general menus; no explicit right-click pattern
- `count-badge` — `badge` could grow a count variant
- `date-picker` — `date-field` is a field; a full calendar popup differs in scope (see also the standalone-calendar row in [component-inventory-comparison.md](./component-inventory-comparison.md))
- `infinite-scroll` — covered strategically by the collection-rendering-strategy guidance rather than a dedicated component
- `text-input-with-copy-button` — `text-field` has no copy-button variant
- `virtualized-table` — windowing depth of `table`/`tree-grid` was never verified; treat as open

## Maintenance

Re-run this comparison against upstream when planning a major catalog expansion; upstream inventories drift.
