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

Examples: `breadcrumbs`, `list`, `table`, `toolbar`, `action-menu` — all generic components from the `components` tier, not explorer-prefixed wrappers.

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

## Rebuild order

1. `ExplorerSelectionController` — done; well-bounded and highly reusable.
2. `ExplorerCollectionController` — pagination and refresh logic.
3. `ExplorerNavigationController` — breadcrumbs and folder transitions.
4. `ExplorerActionsController` — action rules and enablement.
5. `ContentExplorerController` facade + transport contracts (`contracts.ts`, `box-transport.ts`).
6. The composed `box-content-explorer` surface, assembled from generic catalog components.

## Lessons carried from the original recreation plan

- **Enrich the item contract.** The original `ExplorerItem` (`id`, `name`, `type`) proved too thin for Box-style rendering and actions. Real explorer/picker/share/preview shells need optional, server-neutral summary fields: permissions, ownership, modified date, size, shared-link state, preview affordances. Add them as optional fields when the collection block lands.
- **Search belongs in the contract and the controller.** The old data-source contract had `search` but it was never wired through transport/controller/element. Design the view-state model (folder / search / recents modes) explicitly this time.
- **Metadata-query browsing is a separate pattern.** Box's explorer mixes metadata-based views into the same element; keep metadata query in `patterns/metadata` with its own composed surface.
- **Workflow state (create-folder, rename, delete, upload, share handoff, preview handoff) deserves reusable headless seams**, not element-private shell logic.
- **Preview-platform responsibilities stay out.** Preview dialogs, preview navigation, preview sidebars, and open-with belong to the preview pattern (and historically to the sibling `box-open-preview` repo). The explorer integrates; it does not duplicate.
