# ExecPlan: Explorer item contract + search view-state

## Outcome

Ship an additive `ExplorerItem` summary contract and end-to-end **folder | search** view-state through transport → controller → `box-content-explorer`, including HTTP/data-source bridge, `box-server` search, and presentation follow-through (toolbar search, results header, rich list/table columns).

## Tier

Patterns (`content-explorer`) + server integration (`packages/box-server`) + docs.

## Scope (this PR)

1. Optional summary fields on `ExplorerItem` (permissions, owner, dates, size, shared-link, preview, parent).
2. `view.mode: "folder" | "search"` on explorer state.
3. `search` / `clearSearch` on controller + element; optional `transport.searchItems`.
4. HTTP DS + box-server Box `/2.0/search` route.
5. Presentation: `box-search-field` in toolbar; `box-search-results-header` in composed shell; list meta line + table Modified/Size/Owner/Shared columns.
6. Docs mock transport with enriched fields + `searchItems`.
7. Focused tests + docs/BACKLOG/HANDOFF updates.

## Explicit deferrals

- `recents` mode
- Filter-bar / saved-view picker wiring
- Configurable or permission-gated columns
- Permission-gated actions

## Progress

- [x] Types + schemas
- [x] Controller view-state + search
- [x] Contracts / box-transport
- [x] Element API + search results header
- [x] Toolbar search field
- [x] Rich list meta + table columns
- [x] Docs mock transport
- [x] box-server mapper/DS/route
- [x] Tests + docs
- [ ] `bun run verify` + PR (#43) tip green
