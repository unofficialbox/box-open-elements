# Patterns Catalog

This document is the canonical map for the `src/patterns` directory: combinations of components that address common user objectives with sequences and flows, grouped by Box noun or workflow area.

Patterns absorb both of the old repo's upper tiers: `Composites` (display-oriented assemblies) and `Elements` (orchestrated workflow shells). See [../taxonomy.md](../taxonomy.md).

## Two kinds of patterns

- **Compositions** — reusable assemblies of components that solve a recognizable interface task, fed data via properties. No owned transport. (Share panel, filter bar, metric card.)
- **Workflows** — orchestrated surfaces that depend on transport contracts, headless controllers, or provider adapters. (Content explorer, preview shell.)

Do not treat a workflow-heavy surface as a composition if it depends on transport, permission semantics, or orchestration.

## Filesystem layout

Each pattern area owns its headless modules and composed surfaces together:

```text
src/patterns/
  content-explorer/
    selection/        # built
    navigation/       # built
    collection/       # built
    actions/          # built
    adapters/         # built — box-explorer-{action-menu,toolbar,list,table,items,breadcrumbs}
    contracts.ts      # built — data-source contracts + HTTP adapter
    box-transport.ts  # built — Box API transport
    controller.ts     # built — composition-root facade
    schemas.ts        # built — wire schemas
    types.ts          # built
  preview/            # target — provider adapter + annotation surfaces + shell
  search/             # target
  item/               # target
  metadata/           # target
  share/              # target
  file-request/       # target
  task/               # target
  governance/         # target
  insights/           # target
```

## Import contract

```ts
import { ExplorerSelectionController } from "box-open-elements/patterns/content-explorer/selection";
import { ExplorerSelectionController } from "box-open-elements/patterns/content-explorer"; // area root re-export
```

## Target inventory by area

Status: **built** = implemented here with tests; everything else has its reference implementation in `box-open-web-components` (see [../migration-map.md](../migration-map.md)).

### Content Explorer (workflow)

Headless blocks (see [content-explorer.md](./content-explorer.md) for the composition model):

- `selection` — **built**
- `navigation` — **built**
- `collection` — **built**
- `actions` — **built**
- `controller` (composition-root facade) — **built**
- `contracts` + `box-transport` (data-source contracts, HTTP adapter, Box API transport, wire schemas) — **built**
- presentation adapters (`box-explorer-action-menu`, `box-explorer-toolbar`, `box-explorer-list`, `box-explorer-table`, `box-explorer-items`, `box-explorer-breadcrumbs`) — **built**
- composed surface: `box-content-explorer` — target

### Preview (workflow + compositions)

- provider-adapter contract (`PreviewProvider`, `PreviewAdapterState`, `PreviewProviderAdapter`)
- `content-preview-adapter` (Box Content Preview integration)
- `annotation-toolbar`, `annotation-inspector`, `annotation-thread`
- composed surface: `box-preview-element` (pluggable adapter host)

### Search (compositions)

- `filter-bar`
- `saved-view-picker`
- `search-results-header`

### Item (compositions)

- `bulk-action-bar`
- `item-details-panel`
- `item-form`
- `preview-header`

### Metadata (compositions + contracts)

- `metadata-filter-builder`
- `metadata-inspector`
- `contracts` (`MetadataDataSource`, templates, instances, query)

### Share (compositions + contracts)

- `permission-matrix`
- `share-panel`
- `contracts` (`ShareDataSource`, shared links, collaborators)

### File Request (compositions)

- `file-request-builder`

### Task (compositions)

- `review-queue-item`
- `task-assignment-panel`

### Governance (compositions)

- `governance-panel`

### Insights (compositions)

- `bar-chart`
- `chart-panel`
- `donut-chart`
- `line-chart`
- `metric-card`

## Scoped workflow gap candidates

From the upstream `box/box-ui-elements` comparison (see [../research/upstream-gaps.md](../research/upstream-gaps.md)):

- **Compositions**: `access-stats` (data-injected statistics display), `collaborator-avatars` (stacked avatar group)
- **Workflows**: `invite-collaborators-modal` (multi-step, transport-aware), `unified-share-modal` (Box's most orchestration-heavy share surface), `presence` (live data subscription)
- Cross-system candidates: coach mark / product tour (sequenced multi-anchor onboarding), timeline / activity feed

## Design rules

- Keep headless modules headless: plain objects and controllers, no framework coupling, no UI chrome.
- Keep transport contracts narrow and explicit; one narrow data source per workflow area over one giant client interface.
- Composed surfaces consume the same public component catalog third parties use.
- Add reusable compositions before pattern-private shell logic whenever a UI slice could later serve explorer, picker, uploader, preview, or sidebar experiences.
- When introducing a new headless module, add its public subpath entrypoint if it should be directly consumable.
- Keep this document synchronized with the actual `src/patterns` tree and package exports.
