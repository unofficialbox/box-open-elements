# Components Catalog

This document is the canonical map for the `src/components` directory: single controls and narrowly scoped surfaces (the tier previously called `Primitives` in `box-open-web-components`).

It aligns three things:

- the filesystem layout under `src/components`
- the docs-site catalog structure
- the public package subpaths (`box-open-elements/components/<category>/<name>`)

For the higher-level taxonomy diagram, see [../taxonomy.md](../taxonomy.md). For the old-repo → new-repo mapping, see [../migration-map.md](../migration-map.md).

## Status convention

- **built** — implemented in this repo with dedicated tests
- *(everything else)* — target inventory; the reference implementation lives in `box-open-web-components` and is ported (not copied blindly) per the roadmap in [../roadmap.md](../roadmap.md)

## Import contract

```ts
import { defineBoxButtonElement } from "box-open-elements/components/actions/button";
```

Custom element tag names keep the `box-` prefix (`box-button`, `box-dialog`, …). Each module exports the element class and an idempotent `defineBox<Name>Element()` helper.

## Target inventory by category

### Actions

- `button` — **built**
- `action-menu`
- `button-group`
- `icon-button`
- `link-button`
- `menu`
- `menu-item`
- `segmented-control`
- `toolbar`

### Collections

- `card`
- `carousel`
- `items`
- `list`
- `pagination`
- `table`
- `tree`
- `tree-grid`

### Feedback

- `alert`
- `badge`
- `empty-state`
- `help-text`
- `progress-bar`
- `progress-ring`
- `progress-steps`
- `skeleton`
- `spinner`
- `toast`

### Files

- `drop-zone`

### Forms

- `checkbox`
- `checkbox-group`
- `color-picker`
- `combobox`
- `date-field`
- `dropdown`
- `dual-listbox`
- `multi-select`
- `number-input`
- `radio-group`
- `range-slider`
- `rating`
- `rich-text-input`
- `search-field`
- `select`
- `slider`
- `spin-button`
- `switch`
- `text-area`
- `text-field`
- `time-field`

### Identity

- `avatar`
- `persona`

### Layout

- `app-shell`
- `split-view`

### Navigation

- `accordion`
- `breadcrumbs`
- `tabs`

### Overlays

- `dialog`
- `drawer`
- `popover`
- `tooltip`

### Visuals

- `illustration`

## Scoped gap candidates

Beyond the 61 carried-over components, these gaps were identified by real comparisons against upstream `box/box-ui-elements` and seven major public design systems (see [../research/upstream-gaps.md](../research/upstream-gaps.md) and [../research/component-inventory-comparison.md](../research/component-inventory-comparison.md)):

- strongest cross-system gaps: `chip`/`tag` (distinct from status-only `badge`), `divider`
- close seconds: standalone `calendar` grid (sibling to `date-field`), tag/token input field
- from the box-ui-elements comparison: `category-selector`, `datalist-item`, `contact-datalist-item`, `draggable-list`, `error-mask`, `fieldset`, `section`, `grid-view`, `nav-sidebar`, `sidebar-toggle-button`, `nudge`, `pill-cloud`, `pill-selector-dropdown`

Re-verify each against actual upstream behavior before building — the comparisons were name-and-concept-level, not behavioral audits.

## Category rules

- Put a component here when it is a single control or a narrowly scoped surface.
- Data goes in through properties; interaction comes out through events. No transport.
- Keep category names stable once published.
- Prefer moving a component between tiers only when the abstraction is genuinely wrong.
- Keep the docs-site categories synchronized with this document and the filesystem.
