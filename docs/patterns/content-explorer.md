# Content Explorer

This document frames the content explorer pattern from a third-party developer's point of view.

The goal is not "one explorer component with lots of props." The goal is "small headless lego blocks" that can be assembled into many different experiences. This validated itself in the original repo: Box's React `ContentExplorer` mixes search, folder browsing, metadata query, create/rename/delete, share, upload, preview, side panels, pagination, and view switching into one element — this pattern deliberately decomposes instead.

## Product goal

A third-party developer should be able to build all of these without forking the behavior layer:

- a classic file-manager explorer
- a media browser with large cards
- a compact picker modal
- a left-nav + content-pane workspace
- a mobile-first stacked list flow

A content picker is essentially a constrained explorer shell with a specialized footer and tighter selection — a good explorer decomposition yields reusable pieces that later serve a picker without re-architecting.

## Block model

### 1. Session block

Responsibility: auth token, language, transport, root folder, feature flags.

Headless API shape: `ContentExplorerController` with `connect()`, `disconnect()`, `refresh()`.

This becomes the shared root context for all explorer blocks.

### 2. Navigation block

Responsibility: current folder, breadcrumb path, navigate to folder, back/up behavior.

Headless API shape: `ExplorerNavigationController` with `currentFolder`, `breadcrumbs`, `navigateTo(folderId)`, `navigateUp()`.

Many custom experiences want a different nav treatment from the default explorer.

### 3. Collection block

Responsibility: list of visible items, pagination, loading state, refresh state, empty state.

Headless API shape: `ExplorerCollectionController` with `items`, `pagination`, `loadNextPage()`, `refreshCollection()`.

A grid, table, masonry view, and carousel can all consume the same collection state.

### 4. Selection block — **built** (`src/patterns/content-explorer/selection`)

Responsibility: single vs multiple selection, toggle/select/clear, range selection later, selected item ids.

Headless API shape: `ExplorerSelectionController` with `selectionMode`, `selectedItemIds`, `select(ids)`, `toggleSelection(id)`, `clearSelection()`.

Selection is reusable across explorer, picker, share dialog, and batch-action flows.

### 5. Actions block

Responsibility: inline actions, available actions by item, action rules, action invocation.

Headless API shape: `ExplorerActionsController` with `getItemActions(itemId)`, `invokeItemAction(itemId, actionId)`.

Third parties keep their own action UX while using shared behavior rules.

### 6. Presentation adapters

Responsibility: render the blocks, wire DOM events to headless commands, expose composition APIs.

Built adapters are explorer-scoped Web Components under
`patterns/content-explorer/adapters`: `box-explorer-breadcrumbs`,
`box-explorer-list`, `box-explorer-table`, `box-explorer-toolbar`,
`box-explorer-items`, and `box-explorer-action-menu`. They bind directly to the
shared controller and remain pattern-owned because their behavior is
explorer-specific. Generic catalog counterparts can be added later only when a
transport-free use case justifies them.

### Item gestures (select vs activate)

`box-content-explorer`, `box-explorer-list`, and `box-explorer-table` expose `item-gesture`:

| Value | Click / Space | Enter / double-click |
|---|---|---|
| `split` (default) | toggle selection only | activate (open folder / emit `item-activated`) |
| `legacy` | select **and** activate | select **and** activate |

Use `legacy` only when a host app still expects single-click folder navigation.

## Composition root

`ContentExplorerController` composes session, navigation, collection, selection, and actions into an explorer-oriented facade for shipping quickly, while each block remains independently consumable.

```ts
const explorer = new ContentExplorerController({
  token,
  transport,
  rootFolderId: "0",
});
```

Then choose any UI: custom React components, Vue SFCs, Angular templates, Web Components, or plain DOM. That is the "lego block" threshold to optimize toward.

## Rebuild status

The complete explorer stack is built: selection, collection, navigation,
actions, the `ContentExplorerController` facade, transport/data-source
contracts, presentation adapters, and the composed `box-content-explorer`
surface. New work is gap-driven: `recents` needs a real transport contract, and
configurable or permission-gated columns need an explicit host/component API.

## Item contract (enriched)

`ExplorerItem` keeps required `id` / `name` / `type` and adds optional summary fields for list rows and actions: `size`, `modifiedAt`, `createdAt`, `extension`, `owner`, `permissions`, `sharedLink`, `preview`, `parent`. Thin three-field payloads remain valid.

## View state (folder | search)

`ExplorerState.view` tracks:

| Field | Meaning |
|---|---|
| `mode` | `"folder"` (default) or `"search"` |
| `searchQuery` | Active query when mode is search |
| `searchAncestorFolderId` | Optional folder scope for search |

Controller API:

- `search(query, { ancestorFolderId? })` — empty/whitespace clears search
- `clearSearch()` — restore folder mode and reload the current folder
- `navigateTo` / `loadNextPage` / `refresh` branch on `view.mode`
- Events: `view-changed`, `search-succeeded`

Transport: optional `searchItems(request) → ExplorerSearchResult` (not a fake folder result). Data-source `search?` returns the same shape; HTTP path `GET /api/content-explorer/search?query=&ancestorFolderId=&limit=&offset=`.

Element: `search()` / `clearSearch()`, reflective `search-query`, events `view-changed` / `search-succeeded`. Search mode renders `box-search-results-header` (query, count, scope, Clear search).

Presentation adapters:

- `box-explorer-toolbar` embeds `box-search-field` and wires `search` / `clear` to the controller
- `box-explorer-list` / composed shell show a secondary `item-meta` line (size · modified · owner · shared)
- `box-explorer-table` columns: Name, Type, Modified, Size, Owner, Shared, Actions

## Host chrome: filter bar and saved views

`box-filter-bar` and `box-saved-view-picker` are standalone pattern components. Wire them at the **host** layer with helpers from `box-open-elements/patterns/content-explorer`:

```ts
import {
  bindFilterBarToExplorer,
  bindSavedViewPickerToExplorer,
} from "box-open-elements/patterns/content-explorer";

const unbindFilter = bindFilterBarToExplorer(filterBar, controller, {
  onViewChange: view => {
    // Host owns presentation: toggle adapter visibility (do not put this on the shell).
    list.hidden = view !== "list";
    table.hidden = view !== "table";
  },
});

const unbindViews = bindSavedViewPickerToExplorer(picker, controller, {
  resolvePreset: id => localPresets.find(p => p.id === id),
});
```

| Concern | Owner |
| --- | --- |
| Search query → `search` / `clearSearch` | `bindFilterBarToExplorer` / `bindSavedViewPickerToExplorer` |
| Presentation mode (list/table) | Host (`onViewChange`) |
| Saved-view persistence / server schema | Host (local presets first) |
| `recents` transport mode | Next slice — needs a real transport contract before controller mode |

The docs-site `content-explorer` **Folder host chrome** variant composes saved-view-picker + filter-bar + breadcrumbs + `box-explorer-list` / `box-explorer-table` against a shared `ContentExplorerController` and mock transport. Filter-bar `view` switches list↔table via `onViewChange` (host-owned; the composed `box-content-explorer` shell is not used in that variant).

## Metadata-query host chrome (not a controller view mode)

Docs-site ships a second **Metadata query chrome** variant on the `content-explorer` page (`docs-site/explorer-metadata-demo.ts`):

```text
box-metadata-filter-builder
  → MetadataDataSource.query(...)
  → map hits to ExplorerItem[]
  → ContentExplorerController + box-explorer-toolbar / box-explorer-table
box-metadata-inspector  ← selection-changed
```

Rules:

- Do **not** add a `metadata` value to `ExplorerViewMode` (`folder | search` only).
- The host owns the query, result mapping, and inspector wiring.
- Workshop adapter stories use live `setup()` + `ContentExplorerController`; extraction still strips `setup` for docs-site JSON.

## Lessons carried from the original recreation plan

- **Enrich the item contract.** — done (optional summary fields above).
- **Search belongs in the contract and the controller.** — done for folder \| search with toolbar + results-header chrome; host filter-bar / saved-view binding shipped.
- **Metadata-query browsing is a separate pattern.** — host chrome demo ships; keep query ownership in `patterns/metadata`, not inside the explorer controller.
- **Workflow state (create-folder, rename, delete, upload, share handoff, preview handoff) deserves reusable headless seams**, not element-private shell logic.
- **Preview-platform responsibilities stay out.** Preview dialogs, preview navigation, preview sidebars, and open-with belong to the preview pattern (and historically to the sibling `box-open-preview` repo). The explorer integrates; it does not duplicate.
