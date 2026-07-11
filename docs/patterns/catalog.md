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
  preview/          # built — provider adapter, content-preview adapter, annotations, box-preview-element
  search/             # target
  item/             # built — item-form, item-details-panel, bulk-action-bar, preview-header
  metadata/           # built — contracts, schemas, metadata-filter-builder, metadata-inspector
  share/              # built — contracts, schemas, permission-matrix, share-panel
  file-request/       # built — file-request-builder
  task/               # built — review-queue-item, task-assignment-panel
  governance/         # built — governance-panel
  insights/           # built — metric-card, chart-panel, bar/line/donut charts
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
- composed surface: `box-content-explorer` — **built**

### Preview (workflow + compositions)

- provider-adapter contract (`PreviewProvider`, `PreviewAdapterState`, `PreviewProviderAdapter`) — **built**
- `content-preview-adapter` (Box Content Preview integration) — **built**
- `annotation-toolbar`, `annotation-inspector`, `annotation-thread` — **built**
- composed surface: `box-preview-element` (pluggable adapter host) — **built**

### Search (compositions)

- `filter-bar` — **built**
- `saved-view-picker` — **built**
- `search-results-header` — **built**

### Item (compositions)

- `bulk-action-bar` — **built**
- `item-details-panel` — **built**
- `item-form` — **built**
- `preview-header` — **built**

### Metadata (compositions + contracts)

- `metadata-filter-builder` — **built**
- `metadata-inspector` — **built**
- `contracts` (`MetadataDataSource`, templates, instances, query) — **built**

### Share (compositions + contracts)

- `permission-matrix` — **built**
- `share-panel` — **built**
- `contracts` (`ShareDataSource`, shared links, collaborators) — **built**

### File Request (compositions)

- `file-request-builder` — **built**

### Task (compositions)

- `review-queue-item` — **built**
- `task-assignment-panel` — **built**

### Governance (compositions)

- `governance-panel` — **built**

### Insights (compositions)

- `bar-chart` — **built**
- `chart-panel` — **built**
- `donut-chart` — **built**
- `line-chart` — **built**
- `metric-card` — **built**

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
