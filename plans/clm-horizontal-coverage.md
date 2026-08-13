# CLM Horizontal — Catalog Coverage Analysis

**Benchmark question:** can a developer build the production CLM custom UI
(intake → extraction/clause review → approvals → Salesforce lifecycle →
audit → operations) from this library's foundations + components + patterns?
This maps every Section-7 component requirement of the CLM spec to the
catalog, names the gaps, and orders the build plan. It is the concrete test
of the patterns program's goal: *patterns teach developers how to compose
larger reusable surfaces into their own webapp.*

**Verdict up front:** roughly **85% of the CLM UI is composition of what
exists today** — the intake, workbench, approvals, Salesforce view, config,
and monitoring sections all assemble from shipped components and patterns.
The genuinely missing capabilities cluster into **six buildable gaps**, two
of which were already on the patterns known-gaps list. Nothing in the spec
requires re-architecting; every gap fits the existing layering (headless
controller + narrow contract + composed shell).

## Coverage by CLM section

Legend: ✅ ships today · 🧩 composition of existing pieces (no new
component needed) · 🔶 partial (works, with a named limitation) ·
❌ gap (build required).

### 7.1 Intake & contract creation

| Requirement | Coverage |
|---|---|
| Multi-step form shell | ❌ **Gap 1 — wizard shell.** `box-progress-steps` renders the step rail but nothing owns step state, validation gating, or draft persistence. |
| Text / select / date / currency inputs | ✅ `text-field`, `select`, `combobox`, `date-field`; 🔶 currency = `number-input` without locale/currency formatting affordance. |
| Drag-and-drop uploader | ✅ `box-content-uploader` (constraints, queue, retry — built in patterns round 3c). |
| Inline validation + required-field banners | ✅ form controls carry `invalid`/`error-message` (`aria-invalid`/`aria-errormessage`); `help-text`, `alert`. |
| Submit/save/draft buttons, confirmation + discard modals, toast | ✅ `button`, `dialog`, `toast`. |

### 7.2 Workbench & dashboard

| Requirement | Coverage |
|---|---|
| Sticky sidebar + two-column shell | ✅ `app-shell`, `nav-sidebar`, `split-view`. |
| KPI cards | ✅ `metric-card` (+ trend). |
| Bar / line / status-distribution charts | ✅ `bar-chart`, `line-chart`, `donut-chart`, `chart-panel`. |
| Funnel / kanban chart | ❌ **Gap 6 — funnel/kanban visualization** (insights family has no stage-flow chart). |
| Search + chip filters + saved views | ✅ `search-field`, `filter-bar`, `chip`, `saved-view-picker` (persistent filters). |
| Date-range filter | 🔶 `date-field` + `calendar` exist; no range-picker composition. |
| Sortable/paginated table with row actions | 🔶 `table` + `pagination` + `context-menu`; sortable headers are a tracked depth limitation. |
| Quick-action tiles, detail drawer, alert banner | 🧩 `card`/`button` grid, `drawer`, `alert`. |

### 7.3 Extraction & clause lifecycle

| Requirement | Coverage |
|---|---|
| Docs / extract / review tabs | ✅ `tabs`, `box-content-sidebar`. |
| **Side-by-side diff viewer** | ❌ **Gap 2 — diff viewer.** Nothing renders redline/clause differences. This is the M1-critical gap. |
| Expandable clause cards | 🧩 `accordion` + `card` + `badge`. |
| Risk badges, reviewer chips | ✅ `badge`, `chip`, `collaborator-avatars`. |
| Collapsible AI summary | 🧩 `accordion`/`section`; evidence links via `link-button`. |
| Assign-reviewer modal | 🔶 `task-assignment-panel` + `dialog` cover assignment; a generic assign-user modal is a thin composition. |
| Exception table | ✅ `table`. |

### 7.4 Approvals & routing

| Requirement | Coverage |
|---|---|
| Queue table with SLA timers | 🔶 `review-queue-item` + `table`; no SLA countdown/aging affordance. |
| Decision button group + decision modal (reason code + comment) | 🧩 `button-group`, `dialog` + `select` + `text-area`. |
| Policy status panel | ✅ `governance-panel` (policies, signals, actions). |
| **Event timeline** | ❌ **Gap 3 — timeline / activity feed.** Already on the patterns known-gaps list ("comments / activity feed"). Approvals and audit both need it. |
| Filters, status/priority badges | ✅ `filter-bar`, `badge`. |

### 7.5 Salesforce integration view

All 🧩 — record summary cards (`card`/`item-details-panel`), read-only
record tabs (`tabs`/`content-sidebar`), sync badges (`badge`), retry/open
actions (`button`), failure modal (`dialog`), sync-attempt list
(`table`/`datalist-item`). Sync-state vocabulary (`pending`/`synced`/
`retrying`/`failed`) maps onto badge tones. No new components required.

### 7.6 Evidence & audit

| Requirement | Coverage |
|---|---|
| Append-only activity timeline | ❌ **Gap 3** (same timeline pattern as approvals). |
| Evidence cards/links, event table, export toolbar | 🧩 `card`, `table`, `button-group`. |
| Evidence preview modal | ✅ `preview-element` (+ annotations) in `dialog`. |
| Version chips / version history | 🔶 `chip` renders the badge; ❌ the **versions surface** itself is a tracked known gap (**Gap 5**) — `content-sidebar` already reserves its `versions` tab slot. |
| Audit search + filters | ✅ `search-field`, `filter-bar`, `metadata-filter-builder` for structured queries. |

### 7.7 Operator configuration

All 🧩/🔶 — sectioned config forms (`item-form`, `fieldset`, full form
family), config tabs (`tabs`), toggles (`switch`), verify/apply/rollback
with confirm-before-apply (`button` + `dialog`), logs table (`table`),
read-only config viewer (`rich-text-input` read pattern or `table`).
🔶 masked-secret display and a policy rule-builder are thin extensions —
`metadata-filter-builder` is already a structured condition builder and is
the right base for policy rules.

### 7.8 Monitoring & operations

All ✅/🧩 — `metric-card` health cards, `line-chart`/`bar-chart` trends and
failure categories, `table` incident feed, `alert`/`toast`/`nudge`
notifications, control actions via `button` + confirm `dialog`.

### 7.9 Global navigation & UX

| Requirement | Coverage |
|---|---|
| Scenario mode switcher | ✅ `segmented-control`. |
| Role-aware sidebar | ✅ `nav-sidebar` (host filters items by role). |
| Global search with suggestions | 🧩 `search-field` + `combobox`/`datalist-item`. |
| **Command bar / quick actions** | ❌ **Gap 4 — command palette** (keyboard-first global actions). |
| Version footer, empty states, skeletons, error fallbacks | ✅ `empty-state`, `skeleton`, `spinner`, `error-mask`, `illustration`. |

Cross-cutting Section-5 requirements are already foundation-level
commitments: WCAG 2.1 AA + keyboard-first is the accessibility contract
every composite follows (roving tabindex, ARIA composites, focus
preservation); tokens/theming keep the UI brandable; transports are
narrow injected contracts, so correlation IDs, idempotency, and retries
live in the host's transport implementation — no secrets ever enter
element state.

## The gap list (build order)

1. **Wizard form shell** (`patterns/form-wizard`) — step state controller
   (validation gating, draft persistence hooks) + shell composing
   `progress-steps` + slotted step panels. Unblocks CLM intake (MVP).
2. **Diff viewer** (`components/diff-viewer` or `patterns/clause-diff`) —
   side-by-side and inline text diff with change navigation; clause-card
   composition on top. Unblocks clause lifecycle (M1). The docs-site
   already has an internal diff renderer to seed from.
3. **Timeline / activity feed** (`patterns/timeline`) — append-only event
   list with actor/action/timestamp/evidence slots; feeds approvals
   history, audit trail, and the sidebar `activity` tab. Closes an
   existing known-gaps entry (MVP audit baseline).
4. **Command palette** (`components/command-bar`) — keyboard-first action
   launcher over the existing overlay + listbox machinery.
5. **Versions surface** (`patterns/versions`) — version list + restore/
   promote contract; lands in the sidebar's reserved `versions` slot.
   Closes the second existing known-gaps entry.
6. **Funnel / kanban visualization** (insights family) — stage-flow chart
   for the workbench.

Thin extensions to fold into adjacent work: currency formatting on
`number-input`, date-range composition, SLA/aging badge, masked-secret
field, sortable table headers (already tracked).

## How this feeds the composition story

The CLM workbench is the right subject for the planned composition Build
Along: it exercises picker/uploader/sidebar (round 3), the approval and
governance patterns, and at least Gap 1 and Gap 3 — proving the thesis
that a production custom webapp is events-glued composition of this
catalog. The lesson should be authored against the CLM intake → approval
slice once Gaps 1 and 3 land.
