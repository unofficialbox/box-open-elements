# ExecPlan: Explorer item contract + search view-state

## Outcome

Ship an additive `ExplorerItem` summary contract and end-to-end **folder | search** view-state through transport → controller → `box-content-explorer`, including HTTP/data-source bridge and `box-server` search.

## Tier

Patterns (`content-explorer`) + server integration (`packages/box-server`) + docs.

## Scope (this PR)

1. Optional summary fields on `ExplorerItem` (permissions, owner, dates, size, shared-link, preview, parent).
2. `view.mode: "folder" | "search"` on explorer state.
3. `search` / `clearSearch` on controller + element; optional `transport.searchItems`.
4. HTTP DS + box-server Box `/2.0/search` route.
5. Focused tests + docs/BACKLOG/HANDOFF updates.

## Explicit deferrals

- `recents` mode
- Wiring `patterns/search` UI into explorer shell / toolbar
- Rich list/table metadata columns
- Permission-gated actions

## Progress

- [x] Types + schemas
- [x] Controller view-state + search
- [x] Contracts / box-transport
- [x] Element API + minimal search chrome
- [x] box-server mapper/DS/route
- [x] Tests + docs
- [x] `bun run verify` + PR (#43)
