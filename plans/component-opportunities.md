# Component Opportunities — Beyond the CLM Requirements List

Extends `plans/clm-horizontal-coverage.md`. That document maps the CLM
spec's explicit component list; this one captures the opportunities that
optimize for the best UX of this class of application — identified in
roadmap review rather than the spec. Five anchor opportunities (the first
four raised in review, the fifth confirmed as a pattern), then supporting
micro-components, then the resequenced build order.

## Anchor opportunities

### 1. AI agent chat experience

The largest missing surface and the most strategic. Shape it as a
workflow pattern, not a widget:

- **Headless `AgentChatController` + `AgentTransport` contract** —
  `sendMessage`, token streaming, and a typed *tool-event* channel (agent
  started extraction, agent proposes an action), following the repo's
  narrow-transport idiom so Box AI, Agentforce, or any backend is
  interchangeable.
- **Shell**: message thread (roles, streaming skeleton), composer with
  attachments (composes `box-content-picker` to attach content to the
  conversation), and two message-card types that matter more than the
  bubbles: **citation/evidence chips** (same contract as `box-timeline`
  evidence, deep-linking into `box-preview-element`) and **HITL action
  cards** — the agent proposes an action, the card renders
  Approve/Reject/Modify inline. The HITL card *is* the CLM
  "human-governed AI recommendations" requirement, delivered where the
  conversation happens.
- Composes: `persona`/`avatar`, `card`, `badge`, `button-group`,
  `skeleton`, `toast`. New machinery: streaming thread + transport.

### 2. Contract clause lineage

Pairs with the diff viewer. Two components over one data model:

- **`box-lineage-graph`** — a layered DAG (SVG): source clause →
  template versions → each executed contract containing it, edges
  annotated with deviation severity (tone-coloured). Click a node for
  detail; click an edge to open the **diff viewer** for exactly that
  pair — "show me every executed contract that deviates from clause 4.2,
  and what the deviation is."
- **`box-provenance-strip`** — the cheap, high-frequency sibling: linear
  ancestry (Library clause v5 → Template 2026 → MSA_Acme §4.2) for record
  headers and the sidebar.
- Accessibility: graphs need a list/table fallback (`tree-grid` fits);
  the graph is progressive enhancement, the tree-grid is the contract.

### 3. Timeline / audit aggregation views

`box-timeline` (round 4c) is the flat feed; the audit and managerial
layer is aggregation. **Built in round 4i** — see the Audit section of
`docs/patterns/catalog.md`:

- **`box-audit-log`** — group-by day / actor / action-type with
  collapsible sections and counts, faceted filters (composing
  `filter-bar` + the date-range gap), **correlation-ID drill-down**
  (reconstruct one workflow run end-to-end), and the one-click export
  toolbar the CLM spec requires.
- **Activity density strip** — a small calendar heatmap for managerial
  review (throughput by person by week); insights family.

### 4. Major/minor version tree (git-graph style)

The visual layer of the versions surface already tracked as CLM gap 5 —
depicted the way git networks render branches and merges
(GitHub/Sourcetree/Bitbucket):

- **The mapping**: trunk lane = canonical/executed lineage (v1.0 → v2.0 →
  v3.0); side lanes = negotiation branches (counterparty redline rounds,
  internal drafts) with minors as smaller nodes (v2.1, v2.2); a merge
  node = an accepted redline landing back on trunk as the next major.
  Major versions get emphasized markers + labels; status renders as tone
  (current / executed / superseded / abandoned).
- **Headless layout, SVG shell**: lane assignment and edge routing
  (topological order → lane allocation → branch/merge curves) is a pure,
  unit-testable `computeVersionGraphLayout(nodes)`; the element is a thin
  SVG renderer. Data model: `VersionNode { id, label, parents[], kind:
  major|minor|merge|draft, actor, timestamp, status }` — the `parents`
  array makes branch/merge topology expressible, exactly as in git.
- **Interactions**: click → `version-selected`; select two nodes →
  `compare-requested` → the diff viewer, the same pairing contract as
  clause lineage. Keyboard: roving focus in topological order. A **table
  fallback is non-negotiable** — and that fallback *is* the
  version-list/restore surface gap 5 called for. One pattern, two
  projections: `box-version-list` (accessible core contract) +
  `box-version-graph` (visualization layer).
- **Shared machinery**: the SVG rail/node/edge renderer and layout module
  serve both this and `box-lineage-graph` — build versions first and
  lineage gets its graph engine for free.

### 5. Work queues — individual and team workload

The natural evolution of the `task` area (`review-queue-item`,
`task-assignment-panel`), which the catalog already flags as
static-shell depth. One work-item model, two projections:

- **Shared headless core**: `WorkQueueController` over a narrow
  `WorkQueueTransport` — `loadItems` (filters: assignee, status, risk,
  age) plus the mutations that matter (`claim`, `reassign`, `complete`,
  `escalate`). Work-item model: entity ref, type (review / approval /
  signature / intake), assignee, priority, `dueAt` + SLA state, risk,
  age. Reassignment and escalation emit intent events with
  confirm-before-apply.
- **`box-work-queue`** — the individual contract manager's projection: a
  prioritized "what should I do next" list. Rows compose
  `review-queue-item` + the due-badge, grouped by urgency bucket
  (Overdue / Today / This week), per-row quick actions, `filter-bar` +
  saved views, `bulk-action-bar` for multi-select triage, keyboard-first
  row navigation. This is the CLM approval queue (7.4) upgraded from a
  table to a triage surface.
- **`box-workload-board`** — the supervisor's projection: swimlanes with
  a configurable lane dimension. Lanes by **assignee** = team workload
  (lane headed by a `persona` with capacity signals — count, overdue,
  aging, over-WIP highlighting — plus a `metric-card` summary strip;
  drag between lanes via the `draggable-list` primitive emits reassign
  intent → confirm modal). Lanes by **stage** = the funnel/kanban chart
  the CLM spec asked for (7.2 / coverage gap 6). One board pattern
  closes two requirements.

## Supporting micro-components

- **`box-stage-path`** — *built*: horizontal chevron lifecycle tracker
  (Draft → In Review → Approved → Executed), Salesforce-Path-style; every
  record header wants it. (`box-progress-steps` is a vertical setup rail —
  a different affordance.)
- **Notification inbox** — *built*: `box-notification-bell` +
  `box-notification-inbox` (read/unread filtering, entity links, grouped
  by type, per-row and bulk intents) for approvals waiting / SLA breaches
  / mentions; toasts are the wrong UX for triage.
- **Wizard review-summary card** — auto summary of collected values with
  per-step Edit links for the final `form-wizard` step.
- **`box-due-badge`** — *built*: SLA/aging urgency with overdue tones,
  stating aging in days rather than a bare date. The work-queue already
  implements the affordance inline; both now share one `resolveDueBucket`
  engine, so the badge exists for the surfaces that do not (record headers,
  task cards, item panels) rather than to re-render what the queue already
  does.
- **Synchronized-scroll comparison shell** — extracted `split-view` +
  scroll-lock primitive for doc-vs-doc review beyond the diff table.
- **Signature ceremony status** — party-oriented signing progress
  (who signs, in what order, who is pending).
- **Virtualized table rows** — audit logs at production scale; the depth
  gap behind several sections.
- **Keyboard shortcuts overlay** — pairs with the command palette to make
  keyboard-first real.
- **Document-scoped presence** — "Avery is viewing/editing this
  contract" indicators over the existing `presence` pattern.

## Resequenced build order

1. **Diff viewer** (CLM gap 2, M1-critical) — round 4d; the compare
   target every graph interaction lands on.
2. **Work-queue family** (opportunity 5) — individual + supervisor
   projections; absorbs `box-due-badge` and the funnel/kanban gap.
3. **Versions surface + version graph** (CLM gap 5 + opportunity 4) —
   list contract, layout engine, SVG shell.
4. **Clause lineage** (opportunity 2) — reuses the graph engine.
5. **AI agent chat** (opportunity 1) — its own track; largest scope.
6. **Audit aggregation layer** (opportunity 3) — *built* (round 4i):
   `box-audit-log` (grouping, facets, correlation drill-down, CSV export)
   and `box-activity-density` over the timeline event contract. Remaining
   in this slot: the remaining micro-components above. The **command
   palette** (CLM gap 4) landed as `box-command-palette`, the **notification
   inbox** as `box-notification-bell` + `box-notification-inbox`, and
   `box-stage-path` + `box-due-badge` are built.

Docs-site integration (registry/examples/stories + one baseline regen)
and the CLM-flavoured composition Build Along ride alongside these in
batches, as with rounds 3 and 4.
