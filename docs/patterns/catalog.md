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
  content-picker/
    types.ts          # built — pick constraints (types/extensions/max) + eligibility
    controller.ts     # built — roster facade composing the explorer controller
    content-picker.ts # built — box-content-picker choose/cancel shell
  content-uploader/
    types.ts          # built — queue item/status model, UploadTransport contract, constraints
    controller.ts     # built — headless queue (concurrency, cancel/retry/remove)
    box-transport.ts  # built — Box multipart upload transport
    content-uploader.ts # built — box-content-uploader drop-zone + queue shell
  content-sidebar/
    types.ts          # built — SidebarTab model + resolveSidebarTabs
    content-sidebar.ts # built — box-content-sidebar tabbed slot shell
  form-wizard/
    types.ts          # built — step model, validation contract, wizard state
    controller.ts     # built — headless step/session controller
    form-wizard.ts    # built — box-form-wizard rail + slot-per-step shell
  timeline/
    types.ts          # built — event/evidence model + record validation
    timeline.ts       # built — box-timeline append-only activity feed
  diff/
    types.ts          # built — segment/row/stats model
    engine.ts         # built — pure line+word diff engine
    diff-viewer.ts    # built — box-diff-viewer split/inline shell
  preview/          # built — provider adapter, content-preview adapter, annotations, box-preview-element
  search/             # built — filter-bar, saved-view-picker, search-results-header
  item/             # built — item-form, item-details-panel, bulk-action-bar, preview-header
  metadata/           # built — contracts, schemas, metadata-filter-builder, metadata-inspector
  share/              # built — contracts, schemas, access-stats, collaborator-avatars, invite-collaborators-modal, permission-matrix, presence, share-panel, unified-share-modal
  file-request/       # built — file-request-builder
  task/               # built — review-queue-item, task-assignment-panel
  governance/         # built — governance-panel
  insights/           # built — metric-card, chart-panel, bar/line/donut charts
```

## Import contract

```ts
import { ExplorerSelectionController } from "@unofficialbox/box-open-elements/patterns/content-explorer/selection";
import { ExplorerSelectionController } from "@unofficialbox/box-open-elements/patterns/content-explorer"; // area root re-export
```

## Target inventory by area

Status: **built** = implemented here with tests; everything else has its reference implementation in `box-open-web-components`.

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

### Content Picker (workflow)

A constrained explorer session for choosing content, composed from the explorer
headless blocks (same transport contract, navigation, search, pagination):

- `types` (pick constraints — `selectableTypes`, `extensions`, `maxSelectable` — and the `isItemPickable` eligibility check) — **built**
- `controller` (`ContentPickerController`: cross-folder pick roster over `ContentExplorerController`, `togglePick`/`choose`/`cancel`, `chosen`/`cancelled`/`selectionChanged`/`selectionRejected` events) — **built**
- composed surface: `box-content-picker` (browse + pick shell with a choose/cancel footer, selection count, disabled non-eligible rows, folders always navigable) — **built**

### Content Uploader (workflow)

An upload queue over a narrow transport contract; the drop-zone and progress
primitives come from the component catalog:

- `types` (`UploadQueueItem` status model, `UploadTransport` contract, `resolveUploadRejection` constraints — extension allowlist + max size, `summarizeUploadQueue`) — **built**
- `controller` (`ContentUploaderController`: validated enqueue, concurrency-limited pump, per-item AbortController cancel, retry/remove/clearCompleted, full lifecycle events + `queueDrained`) — **built**
- `box-transport` (`createBoxUploadTransport`: multipart `POST /files/content` against the upload host; chunked upload sessions are a future transport behind the same contract) — **built**
- composed surface: `box-content-uploader` (drop zone + queue rows with progress bars patched in place, per-row cancel/retry/remove, live summary footer) — **built**

### Content Sidebar (composition)

The tabbed details/activity/metadata/versions shell, composed over the
catalog's `box-tabs`; panels are supplied by the host through named slots
(`slot="details"` etc. — e.g. `box-item-details-panel`, `box-metadata-inspector`):

- `types` (`SidebarTab`, `DEFAULT_SIDEBAR_TABS`, `resolveSidebarTabs` — explicit config wins, otherwise defaults filtered to slots with content) — **built**
- composed surface: `box-content-sidebar` (labelled complementary region, tab strip with full ARIA tabs semantics via `box-tabs`, `active-tab` reflection + `tab-changed`, collapsible body with `collapsed-changed`, custom tabs via the `tabs` attribute with matching slot names, empty state) — **built**

### Form Wizard (workflow)

Multi-step form orchestration (first gap from the CLM horizontal coverage
plan — `plans/clm-horizontal-coverage.md`); the host owns the fields, the
wizard owns the choreography:

- `types` (`WizardStepConfig` — a step id doubles as its slot name, `WizardStepValidator` gate contract with message + field errors) — **built**
- `controller` (`FormWizardController`: value store, forward-gating validation — backward navigation and visited-step jumps never re-validate, optional steps skip gates, `saveDraft` never validates, `submit` validates all required steps and navigates to the first failure) — **built**
- composed surface: `box-form-wizard` (composes `box-progress-steps` as the rail with gated step jumps, slot-per-step panels, `role="alert"` step errors, Back/Next/Submit footer with an opt-in Save-draft button) — **built**

### Timeline (composition)

Append-only activity feed (CLM gap 3 — approvals history, audit trail, the
sidebar `activity` tab):

- `types` (`TimelineEvent` — actor/action/summary/timestamp/tone/badge/`correlationId`/evidence — with per-record validation and tone resolution) — **built**
- composed surface: `box-timeline` (tone-marked spine, evidence chips emitting `evidence-selected` — unsafe hrefs downgrade to buttons, monospace correlation ids, `has-more` → `load-more` paging contract, optional composer gated on `composable` emitting `entry-submitted`) — **built**

### Diff (composition)

Text comparison for clause/redline review (CLM gap 2 —
`plans/clm-horizontal-coverage.md`; the compare target for the planned
version-graph and clause-lineage surfaces —
`plans/component-opportunities.md`):

- `engine` (pure and DOM-free: line-level LCS with prefix/suffix trim and a DP-size cap that degrades to whole-replacement, similar-line pairing into `changed` rows, word-level segments with whitespace coalescing, stats + navigable change ranges) — **built**
- composed surface: `box-diff-viewer` (side-by-side `split` and unified `inline` modes over one table — synchronized scrolling by construction, per-document line-number gutters, `del`/`ins` word-level semantics, stats chip, prev/next change navigation emitting `change-focused`, escaped content) — **built**

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

### Share (compositions + workflows + contracts)

- `access-stats` — **built**
- `collaborator-avatars` — **built**
- `invite-collaborators-modal` — **built** (workflow: `InviteCollaboratorsTransport` contract + `InviteCollaboratorsController` + `box-invite-collaborators-modal`)
- `permission-matrix` — **built**
- `presence` — **built** (workflow: `PresenceTransport` contract + `PresenceController` + `box-presence` live-feed element)
- `share-panel` — **built**
- `unified-share-modal` — **built** (workflow: `UnifiedShareController` over the `ShareDataSource` contract + `box-unified-share-modal` — shared-link + people tabs, emits `invite`)
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

## Known gaps vs upstream box-ui-elements

Honest inventory of what upstream ships that has **no counterpart here yet** —
the roadmap for the next pattern rounds, in rough priority order:

- **Versions** — no version history, restore, or promote surface anywhere.
  (`box-content-sidebar` reserves a `versions` tab slot for it.)
- **Comments write path** — `box-timeline` now covers the general activity
  feed (display + a `composable` comment submit); a full comment
  create/edit/delete/mention transport contract is still future work.
- **ContentOpenWith** — deliberately deferred to a sibling repo.
- Cross-system candidates: coach mark / product tour (sequenced multi-anchor
  onboarding).

Previously listed candidates now built: `access-stats`, `collaborator-avatars`
(compositions), `unified-share-modal`, `invite-collaborators-modal`, `presence`
(workflows) — see the Share section above.

### Known depth limitations

"Built" does not mean feature-complete against upstream. Current intentional
limitations, tracked for future rounds: explorer grid view + sortable table
headers (the headless sort/mutation layer landed first), marker-based
pagination for >1000-item folders, drag-and-drop, i18n of pattern strings,
chunked upload sessions for large files (the multipart transport landed
first; the `UploadTransport` contract already accommodates a chunked
implementation with real progress fractions), and the static-shell depth of
the task / governance / file-request areas.

## Design rules

- Keep headless modules headless: plain objects and controllers, no framework coupling, no UI chrome.
- Keep transport contracts narrow and explicit; one narrow data source per workflow area over one giant client interface.
- Composed surfaces consume the same public component catalog third parties use.
- Add reusable compositions before pattern-private shell logic whenever a UI slice could later serve explorer, picker, uploader, preview, or sidebar experiences.
- When introducing a new headless module, add its public subpath entrypoint if it should be directly consumable.
- Keep this document synchronized with the actual `src/patterns` tree and package exports.
