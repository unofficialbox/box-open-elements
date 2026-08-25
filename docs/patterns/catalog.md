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
  work-queue/
    types.ts          # built — WorkItem model, transport contract, due buckets, workload lanes
    controller.ts     # built — headless queue session (filters, mutations)
    work-queue.ts     # built — box-work-queue individual triage list
    workload-board.ts # built — box-workload-board supervisor swimlanes
  versions/
    types.ts          # built — VersionNode model (parents[] topology) + record validation
    graph-layout.ts   # built — pure git-network layout (lanes, branch/merge edges)
    version-list.ts   # built — box-version-list accessible history contract
    version-graph.ts  # built — box-version-graph git-style network shell
  lineage/
    types.ts          # built — LineageNode model with deviation-typed parent links
    lineage-graph.ts  # built — box-lineage-graph provenance DAG (reuses versions layout)
    provenance-strip.ts # built — box-provenance-strip linear ancestry chips
  agent-chat/
    types.ts          # built — message/citation/proposal model + streaming transport contract
    controller.ts     # built — headless streaming session (deltas, stop, HITL decisions)
    agent-chat.ts     # built — box-agent-chat thread, citation chips, HITL action cards
  notifications/
    types.ts          # built — notification model + grouping/unread engine
    notification-bell.ts  # built — box-notification-bell unread count trigger
    notification-inbox.ts # built — box-notification-inbox triage panel
  audit/
    types.ts          # built — aggregation engine over the timeline event contract
    audit-log.ts      # built — box-audit-log grouped/faceted/exportable audit surface
    activity-density.ts # built — box-activity-density calendar heatmap
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

### Work Queue (workflow)

Governed task queues in two projections over one session (opportunity 5 of
`plans/component-opportunities.md`; upgrades the task area beyond its
static shells):

- `types` (`WorkItem` model with an open `type` vocabulary, `WorkQueueTransport` — `loadItems` + optional `claim`/`reassign`/`complete`/`escalate` capabilities, pure `resolveDueBucket` urgency buckets and `summarizeWorkload` per-assignee lanes) — **built**
- `controller` (`WorkQueueController`: filtered loads with abort-superseded requests, mutation-with-reload, capability guards, full lifecycle events) — **built**
- composed surface: `box-work-queue` (individual triage list grouped Overdue → Due today → Due this week → Later, per-row Claim/Complete/Escalate wired to the controller, Reassign surfaced as `reassign-requested` intent for the host's confirm-before-apply modal, `item-selected` row activation, deterministic `reference-time`) — **built**
- composed surface: `box-workload-board` (supervisor swimlanes by `assignee` — roster-ordered with visible spare capacity, overdue counts, `wip-limit` over-capacity flagging — or by `status` for the pipeline/kanban view; summary strip; cards emit `item-selected` and `reassign-requested`) — **built**
- Both elements accept an external `queueController` so one session drives the queue and the board on the same page. Drag-and-drop lane moves are a tracked depth limitation (reassignment ships as intent events).

### Versions (workflow)

The versions surface (CLM gap 5) plus its git-graph visual layer
(opportunity 4 of `plans/component-opportunities.md`) — one model, two
projections; fills the sidebar's reserved `versions` tab slot:

- `types` (`VersionNode` — `parents[]` carries branch/merge topology exactly as git does, `kind` major/minor/merge/draft, `status` current/executed/superseded/abandoned rendered as tone; per-record validation for attribute payloads) — **built**
- `graph-layout` (pure `computeVersionGraphLayout`: topological order with input-order tie-breaks, first child continues its parent's lane, siblings branch to the lowest free lane, merges release the lanes they close for reuse; malformed topology — duplicates, unknown parents, cycles — degrades with warnings instead of throwing. `orderVersionsForDisplay` gives both projections the same newest-first order by construction) — **built**
- composed surface: `box-version-list` (the accessible core contract: newest-first rows with kind markers and status chips, `version-selected` activation, two-toggle compare pairing emitting `compare-requested` with the older side as `baseId` — the diff viewer's input contract — and `can-restore`/`can-promote` gated intent events for the host's confirm-before-apply flow) — **built**
- composed surface: `box-version-graph` (git-network rendering: SVG branch/merge curves under one HTML button per node, so activation/focus stay native; roving arrow-key focus in display order; click → `version-selected`, modified click or `toggleCompare` → the same compare pairing) — **built**
- The graph is progressive enhancement; the list is the accessible fallback. The layout engine is shared machinery for the future clause-lineage graph.

### Lineage (workflow)

Clause provenance across the template/contract estate (opportunity 2 of
`plans/component-opportunities.md`); pairs with the diff viewer:

- `types` (`LineageNode` with an open `kind` vocabulary — `clause`/`template`/`contract` conventional — and `parents` as typed `LineageParentLink`s carrying `deviation` severity none/minor/major plus a one-line note; per-record validation incl. nested links, entityRef, actor) — **built**
- composed surface: `box-lineage-graph` (provenance DAG over the versions pattern's `computeVersionGraphLayout` — the shared-machinery payoff; SVG edges tone-coloured by deviation; one HTML button per node emitting `node-selected` with roving arrow-key focus; every derivation edge is also a per-row chip button emitting `edge-selected` with the parent/child pair — the diff viewer's input contract — so edge activation needs no SVG hit targets; the row rail is the accessible contract, the SVG is presentation) — **built**
- composed surface: `box-provenance-strip` (the cheap, high-frequency sibling: linear ancestry chips oldest → newest for record headers and the sidebar, newest marked `aria-current`, `node-selected` on chip activation; branched input degrades to topological order) — **built**

### Agent Chat (workflow)

The AI agent conversation surface (opportunity 1 of
`plans/component-opportunities.md` — the largest and most strategic gap),
shaped as a workflow pattern rather than a widget:

- `types` (`AgentChatMessage` with roles and a `streaming`/`complete`/`error` status, `AgentCitation` reusing the timeline's evidence shape, `AgentActionProposal` for human-in-the-loop review; `AgentChatTransport` — `sendMessage` streaming typed `AgentStreamEvent`s (`delta`/`citation`/`proposal`) through an `onEvent` channel, plus an optional `resolveAction` capability) — **built**
- `controller` (`AgentChatController`: folds stream events into one growing agent message, `stop()` aborts a generation while keeping the partial reply — a stop is not a failure, transport failures mark the reply errored and emit `sendFailed`, and HITL decisions route through the `resolveAction` capability with a guard that throws when absent) — **built**
- composed surface: `box-agent-chat` (thread with role bubbles, per-message avatars and a streaming caret; **citation chips** emitting `citation-selected` with the timeline's unsafe-href downgrade; **HITL action cards** rendering Approve/Reject only when the transport can resolve them, with Modify surfaced as `proposal-modify-requested` intent for the host's own editor; Enter-to-send composer with a Stop affordance) — **built**
- The composer lives outside the patched thread region, so a streaming reply never disturbs what the reader is typing, and the thread only auto-scrolls when they are already at the bottom. Attachment composition with `box-content-picker` is a tracked depth limitation.

### Audit (workflow)

The aggregation, faceting, drill-down, and export layer over the timeline
event contract (opportunity 3 of `plans/component-opportunities.md`).
`AuditEvent` *is* `TimelineEvent`: one source feeds the flat feed and the
audit view without a second model:

- `types` (pure, DOM-free engine: `groupAuditEvents` — day sections newest-first with a trailing undated section, actor/action sections by count with label tie-breaks so order never depends on input order; `filterAuditEvents` — a date-only bound covers the whole UTC day, an empty facet means unselected, and a date bound excludes undated events rather than implying they fall in the window; `summarizeAuditFacets` — option counts derived from the *unfiltered* set so choosing one facet can never empty another's list; `toAuditCsv` — RFC 4180 with spreadsheet-formula values neutralized; `computeActivityDensity` — whole-week calendar window with levels scaled against the busiest day) — **built**
- composed surface: `box-audit-log` (collapsible sections with counts and actor tallies, region wired to its toggle; a stable toolbar — group-by, actor/action facets, date range — built once and patched in place, so a re-render below can never close an open dropdown or drop a half-typed date; correlation-id drill-down to one workflow run with a clear affordance; `export-requested` carrying CSV of exactly what the filters left on screen; collapsing is a state flip rather than a rebuild; unsafe evidence hrefs downgrade to buttons) — **built**
- composed surface: `box-activity-density` (managerial throughput heatmap: days with activity are labelled buttons in a roving-tabindex grid — arrows move by day and by week, Home/End jump to the window's ends — each emitting `day-selected` with that day's events; quiet days are inert cells, so tab stops stay proportional to real activity) — **built**
- Day keys, day labels, and row timestamps are all resolved in UTC, so a viewer's timezone can never split one audit day across two sections. Aggregation is client-side. `virtualize` windows the log over a cumulative offset index — a grouped log mixes short headings with tall event rows, which is the shape fixed-height windowing cannot describe. Server-side paging remains a tracked depth limitation.

### Notifications (composition)

The triage surface for approvals waiting, SLA breaches, and mentions —
toasts are transient and unordered, which is the wrong shape for work you
have to come back to:

- `types` (pure engine: `groupNotifications` — sections by `type` leading with the most unread, then the most items, then label, so what needs attention rises and order never depends on input order; inside a section unread lead read, then newest first, with undated records sinking; `countUnreadNotifications`; an open `type` vocabulary humanized into headings unless the host supplies `type-labels`) — **built**
- composed surface: `box-notification-bell` (unread count for the app chrome — the count is the *accessible name*, "Notifications, 3 unread", because a red dot alone tells a screen-reader user nothing; past `max` the badge abbreviates to `9+` while the label keeps the true number, since the abbreviation is a layout concession and the number is the fact; derives its count from records when given them, or takes a bare `unread-count` when the host keeps the list server-side) — **built**
- composed surface: `box-notification-inbox` (grouped triage panel with All/Unread filtering, per-row Mark read / Dismiss, and bulk Mark all read; unsafe entity hrefs downgrade to plain text; focus is sampled and restored across rebuilds so acting on a row does not drop the reader to the top) — **built**
- **Mutations are intents, never local state changes.** The element does not mark anything read on its own — the host owns the write and feeds back a new list, so the inbox can never disagree with the server about what has been seen. Server-side paging is a tracked depth limitation.

### Comments (composition)

- `comment-thread` — **built**

- **Comments are standalone, and annotations are the special case.** A comment
  hangs off a file, a folder, a task or a contract clause; only an *anchor* —
  a page, a region, or a run of quoted text — makes one an annotation.
  `box-annotation-thread` is this component plus that anchor, which is why the
  generic thread lives here rather than under Preview.
- **Selection doubles as the reply target.** `entry-submitted` carries
  `inReplyToId` — the selected entry or `null` — so one event serves both a new
  top-level comment and a reply, and the host decides which by reading it.
- **The model is its own module.** `CommentEntry` / `CommentAction` /
  `CommentSubmittedDetail` import without pulling a custom element along, so a
  controller, adapter or server route can transport comments without the DOM.

### Preview (workflow + compositions)

- provider-adapter contract (`PreviewProvider`, `PreviewAdapterState`, `PreviewProviderAdapter`) — **built**
- `content-preview-adapter` (Box Content Preview integration) — **built**
- `annotation-toolbar`, `annotation-inspector`, `annotation-thread` — **built**
  (`annotation-thread` is `box-comment-thread` plus a document anchor; see Comments)
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

- **Comments transport** — `box-comment-thread` (0.12.0) covers the surface:
  entries, selection, actions and a composer, with `entry-submitted` carrying
  `inReplyToId`. What is still future work is the *transport* contract behind
  it — create/edit/delete/mention against a real backend.
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
