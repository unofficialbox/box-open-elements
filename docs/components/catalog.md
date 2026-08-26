# Components Catalog

This document is the canonical map for the `src/components` directory: single controls and narrowly scoped surfaces (the tier previously called `Primitives` in `box-open-web-components`).

It aligns three things:

- the filesystem layout under `src/components`
- the docs-site catalog structure
- the concise public package subpaths (`@unofficialbox/box-open-elements/<name>`)

For the higher-level taxonomy diagram, see [../taxonomy.md](../taxonomy.md).

## Status convention

- **built** — implemented in this repo with dedicated tests
- *(everything else)* — target inventory; the reference implementation lives in `box-open-web-components` and is ported (not copied blindly)

## Import contract

```ts
import { Button } from "@unofficialbox/box-open-elements";
// Optimized alternative: "@unofficialbox/box-open-elements/button"
```

Custom element tag names keep the `box-` prefix (`box-button`, `box-dialog`, …).
Exports use concise PascalCase names and register automatically on import. Every
class also exposes an idempotent static `register()` method for isolated custom
element registries and test realms.

## Target inventory by category

### Actions

- `button` — **built**
- `action-menu` — **built** as `box-menu`, an action menu driven by a JSON item list; `patterns/content-explorer/adapters/action-menu` (`box-explorer-action-menu`) is the controller-bound variant
- `button-group` — **built**
- `icon-button` — **built**
- `link-button` — **built**
- `menu` — **built**
- `menu-item` — **built**
- `segmented-control` — **built**
- `toolbar` — **built** as `box-toolbar`, which contributes `role="toolbar"`, an accessible name and roving tabindex over slotted controls; `patterns/content-explorer/adapters/toolbar` (`box-explorer-toolbar`) stays controller-bound, rendering its own search, status and selection controls from explorer state

### Collections

- `card` — **built**
- `carousel` — **built**
- `datalist-item` — **built**
- `draggable-list` — **built**
- `grid-view` — **built**
- `items` — *explorer-bound implementation lives at `patterns/content-explorer/adapters/items` (`box-explorer-items`); a generic version remains future work*
- `list` — *explorer-bound implementation lives at `patterns/content-explorer/adapters/list` (`box-explorer-list`); a generic version remains future work*
- `pagination` — **built**
- `table` — **built** as `box-table`, with cell descriptors, expansion, states, stacked rows and row virtualization; `patterns/content-explorer/adapters/table` (`box-explorer-table`) is the controller-bound variant
- `tree` — **built**
- `tree-grid` — **built**

### Feedback

- `alert` — **built**
- `badge` — **built**
- `empty-state` — **built**
- `error-mask` — **built**
- `help-text` — **built**
- `indicator` — **built** (distinct in shape as well as colour, for dense status columns)
- `nudge` — **built**
- `path` — **built** (renamed from `stage-path` in 0.11.0)
- `progress-bar` — **built**
- `progress-ring` — **built**
- `progress-steps` — **built**
- `skeleton` — **built**
- `spinner` — **built**
- `toast` — **built**

### Files

- `drop-zone` — **built**

### Output

Read-only renderers for typed values. Each is locale-aware, each hides itself
rather than rendering `Invalid Date` or `NaN`, and the instant-valued ones keep
the exact value in a `<time datetime>` beside the human-readable text.

- `formatted-date` — **built**
- `relative-time` — **built** (pins "now" with `reference-time`, like `due-badge`)
- `formatted-number` — **built** (`format-style`, not `style` — that one is a global HTML attribute)
- `formatted-file-size` — **built**
- `code-block` — **built** (renders code as text, never as markup; no bundled highlighting)

### Forms

- `category-selector` — **built**
- `checkbox` — **built**
- `checkbox-group` — **built**
- `color-picker` — **built**
- `combobox` — **built**
- `date-field` — **built**
- `dropdown` — **built**
- `dual-listbox` — **built**
- `fieldset` — **built**
- `multi-select` — **built**
- `number-input` — **built**
- `pill-cloud` — **built**
- `pill-selector-dropdown` — **built**
- `radio-group` — **built**
- `range-slider` — **built**
- `rating` — **built**
- `rich-text-input` — **built**
- `search-field` — **built**
- `select` — **built**
- `slider` — **built**
- `spin-button` — **built**
- `switch` — **built**
- `text-area` — **built**
- `text-field` — **built**
- `tile-group` — **built** (selectable cards over real radios/checkboxes)
- `time-field` — **built**

### Identity

- `avatar` — **built**
- `contact-datalist-item` — **built**
- `persona` — **built**

### Layout

- `app-shell` — **built**
- `grid` — **built** (Adobe Spectrum's 12-column responsive grid; shares `foundations/layout` with `skeleton`)
- `nav-sidebar` — **built**
- `section` — **built**
- `sidebar-toggle-button` — **built**
- `split-view` — **built** (emits `ratio-changed` with `detail: { ratio }` while resizing)

### Navigation

- `accordion` — **built**
- `breadcrumbs` — **built** as `box-breadcrumb`, taking a `BreadcrumbItem[]` of label/href/value and reporting `navigate`; `patterns/content-explorer/adapters/breadcrumbs` (`box-explorer-breadcrumbs`) is the controller-bound variant
- `tabs` — **built**

### Overlays

- `dialog` — **built**
- `drawer` — **built**
- `popover` — **built**
- `tooltip` — **built**

### Visuals

- `illustration` — **built**

## Scoped gap candidates

Beyond the 61 carried-over components, these gaps were identified by real comparisons against upstream `box/box-ui-elements` and seven major public design systems:

- strongest cross-system gaps: `chip`/`tag` (distinct from status-only `badge`), `divider` — **both built** (`box-chip`, `box-divider`)
- close seconds: standalone `calendar` grid (sibling to `date-field`), tag/token input field — **both built** (`box-calendar`, `box-tag-input`)
- from the box-ui-elements comparison: **all built** — `category-selector` (Forms), `datalist-item` (Collections), `contact-datalist-item` (Identity), plus `draggable-list`/`grid-view` (Collections), `error-mask`/`nudge` (Feedback), `fieldset`/`pill-cloud`/`pill-selector-dropdown` (Forms), and `nav-sidebar`/`section`/`sidebar-toggle-button` (Layout)

Re-verify each against actual upstream behavior before building — the comparisons were name-and-concept-level, not behavioral audits.

## Category rules

- Put a component here when it is a single control or a narrowly scoped surface.
- Data goes in through properties; interaction comes out through events. No transport.
- Keep category names stable once published.
- Prefer moving a component between tiers only when the abstraction is genuinely wrong.
- Keep the docs-site categories synchronized with this document and the filesystem.
