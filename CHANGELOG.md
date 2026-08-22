# Changelog

Work merged to `main` and notable in-flight changes for **2026-07-14 through 2026-07-17** (past 3 days from 2026-07-17).

Generated from git: `git log main --since="2026-07-14" --until="2026-07-18"`.

**Summary:** 55 commits on `main`; **52 PRs merged** (#20–#71 in this window). Component fidelity program completed; docs-site/workshop expanded to **108 stories**; density + BUE visual conformance landed; React adapter PoC, agent workflow rules, and the first real style-bridge library config shipped.

---

## Unreleased

- Visual baselines are now deterministic. Three separate sources of churn
  meant a screenshot could change without the UI changing, so every regen
  needed forensic work to tell a real change from noise — the last batch
  needed a shift-scoring script to clear two images it had never touched.

  **Animations were caught mid-flight.** The spinner landed on a different
  rotation phase every run, drifting `feedback.png` for three rounds
  running. Both capture scripts now screenshot with `animations: "disabled"`,
  which rewinds animations to their first frame.

  **Section clips moved with the page.** Gallery sections were photographed
  from one tall page, and glyphs rasterise against their position in the
  viewport — so adding a row to any section shifted every section below it
  by a pixel. That is how `explorer-element.png` (12,601 pixels) and
  `specialized.png` entered the last diff untouched. Each section is now
  photographed alone, with its siblings hidden and the scrollbar gutter
  pinned, so its capture cannot depend on anything else on the page.

  **Streamed demos were captured mid-stream.** A route's ready marker says
  it rendered, not that it stopped moving: the agent-chat demo streams on a
  timer, and two runs of the same commit produced baselines 43,000 pixels
  apart — one caught mid-sentence with the caret showing. Docs-site shots
  now wait for two consecutive frames to be byte-identical before capturing.
  The gate is route-agnostic, so it also covers whatever asynchronous demo
  comes next.

  Verified empirically rather than by inspection: two full capture runs of
  an unchanged tree are byte-identical, and adding a row to one gallery
  section now changes that section's baseline **and nothing else** — where
  before the same edit moved two unrelated images.

- Docs-site, workshop, and gallery coverage for the three elements that
  landed since the last docs batch: `box-shortcuts-overlay`,
  `box-stage-path`, and `box-due-badge`. Registry entries, live examples with
  per-variant setups, Storybook stories (135 extracted workshop stories), a
  gallery row, and three docs-site shot routes.

  The shortcuts sheet is fed the **same** `clmCommands` array the command
  palette gets, which is the demonstration the component exists for — so
  `clmCommands` gained more shortcuts, written with `+` separators since that
  is what the sheet splits on to render each key as its own `<kbd>`. The
  palette's hints change with it, which is the point: one catalogue, two
  surfaces, no way to document a shortcut the palette does not offer.

  `box-shortcuts-overlay` is deliberately absent from the pixel-diff gallery.
  Like the palette it is a fixed full-viewport overlay, so mounting it there
  would cover the sheet rather than add a row to it.

- Keyboard shortcuts overlay: `box-shortcuts-overlay`, the pair to
  `box-command-palette` that makes keyboard-first real.
  It reads the **same** `CommandDescriptor[]` the palette does and lists only
  the commands that declare a `shortcut`. One catalogue driving both surfaces
  is the point: a shortcut cannot end up documented but unreachable, or
  reachable but undocumented, because there is only one place to add it.
  `groupShortcutCommands` and `splitShortcutKeys` are pure, so a host can
  render its own sheet from the same data. Keys render as `<kbd>` elements
  with the full combination as the accessible name and the `+` separators
  hidden from assistive tech.
  The `?` hotkey never fires while someone is typing — it is an ordinary
  character in every text field on the page — and never with a modifier held.
  Modal with focus trap and restore; Escape, the close button, and a backdrop
  press all dismiss.

  Three follow-up fixes from review. The typing guard read `event.target` on a
  document listener, which is retargeted to the shadow host once an event
  crosses a shadow boundary — and seventeen components here wrap a native
  input in shadow DOM, so `?` typed into a `box-text-field` saw the wrapper
  and the sheet stole the character; it reads `event.composedPath()[0]` now.
  `splitShortcutKeys` dropped a literal `+` key, so `mod++` rendered as just
  `mod` while the accessible name still announced the full combination. And
  Escape only closed the sheet while focus was still inside it, which makes a
  modal a trap the moment focus leaves.

- Two supporting micro-components from build-order slot 6.

  **`box-stage-path`** — the horizontal chevron lifecycle tracker every
  record header wants (Draft → In Review → Approved → Executed). Distinct
  from `box-progress-steps`, which is a vertical setup rail for a task the
  reader is working through: this states where a *record* sits, is read-only,
  and lives in a header. Rendered as an ordered list with the current stage
  marked `aria-current="step"` and completed stages carrying a ✓, so sequence
  and position both survive without the chevron geometry — which is
  decoration, and collapses on narrow viewports. An unknown `current` id
  leaves every stage upcoming rather than silently marking the path done.

  **`box-due-badge`** — SLA/aging urgency, stating the answer to the question
  a due badge exists for: *how late is this?* "Overdue by 3 days" rather than
  a bare date. The label always carries the urgency in words, so colour is
  never the only signal, and a supplied `label` overrides the wording but not
  the derived tone — an override must not make a breach look calm. Day counts
  are measured between UTC day boundaries, so "tomorrow" is 1 whether it is
  23 hours away or 25.

  The due-bucket engine moved to `components/feedback/due-types` and is
  re-exported from `patterns/work-queue/types`, so that public import path is
  unchanged. Patterns compose components, not the reverse. The work-queue
  keeps rendering its due column inline — it already had the affordance, and
  the duplication worth removing was the *bucketing logic*, not five lines of
  CSS; the badge exists for the surfaces that have no such column.

- Docs site + workshop pages for the three elements that landed since the
  last batch: **Command Palette**, **Notification Bell**, and **Notification
  Inbox**. Registry entries, live examples, Storybook stories (132 extracted
  workshop stories), gallery rows, and docs-site shot routes.
  The notification-inbox example ships two variants, each carrying the setup
  — the docs-site keeps live setups only when the *example* supplies the
  variants, so a page whose story has multiple variants and whose example has
  one renders an empty panel. The inbox demo also plays the *host*: because
  the element emits intents rather than mutating its own list, Mark read and
  Dismiss only take effect when something writes back, and the demo does.
  The palette example opens on load for the screenshot but deliberately does
  not reopen itself on dismiss: it is a fixed full-viewport overlay, and
  re-arming it would leave a reader unable to reach the page behind it.
  All three pages were smoke-tested headless end to end — the recency boost
  putting Review first, `cv` finding *Compare versions* by initials with two
  highlighted runs, the bell's count reaching its accessible name, and the
  inbox's host write-back dropping the unread pill from 3 to 2.

- Notification inbox: `box-notification-bell` + `box-notification-inbox`,
  the triage surface for approvals waiting, SLA breaches, and mentions.
  Toasts are transient and unordered, which is the wrong shape for work you
  have to come back to.
  The engine is pure: `groupNotifications` sections by `type`, leading with
  the most unread, then the most items, then label — so what needs attention
  rises and order never depends on input order — while inside a section
  unread lead read and then run newest first, with undated records sinking.
  `type` is an open vocabulary, humanized into headings unless the host
  supplies `type-labels`.
  The bell puts the unread count in its **accessible name** ("Notifications,
  3 unread"), not only in a badge, because a red dot alone tells a
  screen-reader user nothing; past `max` the badge abbreviates to `9+` while
  the label keeps the true number, since the abbreviation is a layout
  concession and the number is the fact. It derives the count from records
  when given them, or accepts a bare `unread-count` when the host keeps the
  list server-side.
  The inbox filters All/Unread, offers per-row Mark read / Dismiss and bulk
  Mark all read, downgrades unsafe entity hrefs to plain text, and samples
  and restores focus across rebuilds so acting on a row does not drop the
  reader to the top of the panel.
  **Mutations are intents, never local state changes**: the element never
  marks anything read on its own — the host owns the write and feeds back a
  new list, so the inbox can never disagree with the server about what has
  been seen. Server-side paging is a tracked depth limitation.

- Command palette (CLM gap 4 — the last unbuilt numbered gap in
  `plans/clm-horizontal-coverage.md`): `box-command-palette`, a
  keyboard-first action launcher over the existing overlay and listbox
  machinery. The match/rank/group engine is pure and DOM-free, so a host can
  drive its own launcher from the same functions: `matchCommands` scores an
  exact label above a prefix above a substring above a subsequence, rewards
  word starts and consecutive runs (so `cv` finds "**C**ompare **v**ersions"),
  matches hidden `keywords` without highlighting them, ranks disabled
  commands last, and breaks ties by input order rather than object identity;
  `groupCommandMatches` buckets into sections with the ungrouped section
  trailing; `splitCommandLabel` yields the highlight runs.
  The shell follows the ARIA combobox-with-listbox pattern: focus stays in
  the search input and the active option is named through
  `aria-activedescendant`, which is what lets Up/Down browse while the query
  stays editable. Arrow keys cross section headings in one flat index space
  and wrap at both ends; Home/End jump; Escape and backdrop press dismiss;
  focus returns to whatever opened it. An optional `hotkey` (`mod+k`, where
  `mod` is Cmd or Ctrl per platform) opens it globally, and the listener is
  removed on disconnect.

- Docs site + workshop pages for the two patterns that landed after the
  earlier six-pattern batch: **Agent Chat**, **Audit Log**, and **Activity
  Density**. Registry entries, live examples, Storybook stories (extracted to
  129 workshop stories), gallery rows, and docs-site shot routes.
  The examples are live rather than static: agent-chat streams a real reply
  on a timer so the preview shows the caret and a composer that stays usable
  mid-stream, then lands two citation chips and a human-in-the-loop action
  card whose Approve/Reject exist only because the demo transport implements
  `resolveAction`. The audit log ships three variants — by day, by actor, and
  drilled down to one workflow run — each with its own setup, because the
  docs-site keeps live setups only when the *example* supplies the variants;
  a page with workshop variants and a single example silently renders an
  empty surface. The gallery's agent-chat demo uses a synchronous transport
  and awaits the send before the ready flag, since that page is a pixel-diff
  baseline and a timer-driven stream would not be reproducible.
  All three pages were smoke-tested headless end to end (streamed reply with
  its cards, six day sections narrowing to three on correlation drill-down,
  and the density grid's tab stop landing on the most recent active day).

- Audit (patterns round 4i — opportunity 3 of the component roadmap): the
  aggregation, faceting, and export layer over the `box-timeline` event
  contract. `AuditEvent` *is* `TimelineEvent`, so one source feeds the flat
  feed and the audit view without a second model. The engine is pure and
  DOM-free: `groupAuditEvents` builds collapsible day/actor/action sections
  (days newest-first with a trailing undated section; actor and action
  sections by count with label tie-breaks, so order never depends on input
  order), `filterAuditEvents` applies the facets — a date-only bound covers
  the whole UTC day, and a date bound excludes undated events rather than
  implying they fall inside the window — `summarizeAuditFacets` derives
  option counts from the unfiltered set so choosing one facet can never
  empty another's list, `toAuditCsv` renders RFC 4180 output with
  spreadsheet-formula values neutralized, and `computeActivityDensity`
  builds the calendar-heatmap window.
  `box-audit-log` renders the sections with counts and actor tallies, a
  stable toolbar (group-by, actor/action facets, date range) that survives
  every content rebuild, correlation-id drill-down to one workflow run, and
  an Export CSV button that exports exactly what the filters left on screen.
  `box-activity-density` is the managerial heatmap: days with activity are
  labelled buttons in a roving-tabindex grid (arrows move by day and week),
  each emitting `day-selected` with that day's events. Day keys, day labels,
  and row timestamps are all UTC, so a viewer's timezone can never split one
  audit day across two sections. Server-side paging and row virtualization
  for production-scale logs are tracked depth limitations.

- **Security fix — protocol-relative evidence/citation hrefs.** The
  unsafe-href downgrade that guards evidence and citation chips accepted any
  value starting with `/`, which includes the protocol-relative form
  `//evil.example/x` that a browser resolves to an *external* origin (and
  `/\evil.example`, which some parsers normalize to it). An author-supplied
  record could therefore still render as an anchor to an attacker's host.
  The path branch now requires a single leading slash. The check had been
  copied into three patterns and drifted; it now lives in one internal
  module that `box-timeline`, `box-agent-chat`, and `box-audit-log` all
  import, with regression tests in each.

- Agent Chat (patterns round 4h — opportunity 1 of the component roadmap,
  the largest and most strategic gap): new `agent-chat` workflow pattern,
  shaped as a workflow rather than a widget. `AgentChatController` runs a
  streaming session over a narrow `AgentChatTransport` whose `sendMessage`
  emits typed events (`delta` / `citation` / `proposal`) through an
  `onEvent` channel, folding them into one growing agent message; `stop()`
  aborts a generation and keeps the partial reply (a stop is not a
  failure), transport failures mark the reply errored, and human-in-the-loop
  decisions route through an optional `resolveAction` capability.
  `box-agent-chat` renders the thread with role bubbles, avatars, and a
  streaming caret, plus the two card types that matter more than the
  bubbles: **citation chips** (the timeline's evidence contract, including
  its unsafe-href downgrade) emitting `citation-selected`, and **HITL
  action cards** where a proposed action is approved or rejected inline —
  the CLM "human-governed AI recommendations" requirement delivered where
  the conversation happens — with Modify surfaced as intent for the host's
  own editor. The composer sits outside the patched thread region so a
  streaming reply never disturbs what the reader is typing, and the thread
  only follows the stream when they are already scrolled to the bottom.
- Build Along: Intake Workspace — the composition lesson. Five steps
  assemble a contract-intake workspace from three independent patterns:
  the form wizard captures and validates the request, its `submitted`
  event files a work item into a work-queue transport, and the queue's
  `item-mutated` events write the timeline — none of the three patterns
  knows the others exist. Ships the full build-along treatment: cumulative
  vanilla steps with delta highlighting, live per-step previews (the
  outcome preview is fully interactive end-to-end), per-step React /
  Angular / Vue / Svelte components, and flat package entries
  (`form-wizard`, `timeline`, `diff-viewer`, `work-queue`,
  `workload-board`, `version-list`, `version-graph`, `lineage-graph`,
  `provenance-strip`) so framework imports load one element at a time.

- Lineage (patterns round 4g — opportunity 2 of the component roadmap):
  new `lineage` workflow pattern for clause provenance, pairing with the
  diff viewer. `LineageNode` reuses the git-style `parents[]` topology but
  types each link (`LineageParentLink`) with a deviation severity
  (none/minor/major) and note — the "show me every executed contract that
  deviates from clause 4.2, and what the deviation is" contract.
  `box-lineage-graph` renders the provenance DAG over the versions
  pattern's `computeVersionGraphLayout` (the shared-machinery payoff from
  round 4f) with deviation-toned SVG edges; every node is an HTML button
  emitting `node-selected` with roving arrow-key focus, and every
  derivation edge is also a per-row chip button emitting `edge-selected`
  with the parent/child pair — the diff viewer's input — so edge
  activation is keyboard-accessible without SVG hit targets.
  `box-provenance-strip` is the linear ancestry sibling for record
  headers (oldest → newest chips, newest marked current).

- Versions (patterns round 4f — CLM gap 5 + opportunity 4 of the component
  roadmap): new `versions` workflow pattern — one branch/merge history
  model, two projections. `VersionNode` carries topology through a
  `parents[]` array exactly as git does; the pure `computeVersionGraphLayout`
  assigns lanes git-network style (first child continues its parent's lane,
  siblings branch to the lowest free lane, merges release lanes for reuse)
  and degrades with warnings on malformed topology instead of throwing.
  `box-version-list` is the accessible core contract: topological
  newest-first rows with kind markers and status tones, `version-selected`,
  two-toggle compare pairing emitting `compare-requested` with the older
  side as `baseId` (feeding `box-diff-viewer` directly), and
  `can-restore`/`can-promote` gated intent events for confirm-before-apply
  hosts. `box-version-graph` renders the same model as a git network — SVG
  branch/merge curves under one HTML button per node with roving arrow-key
  focus — as progressive enhancement over the list. The layout engine is
  shared machinery for the future clause-lineage graph.

- Work Queue (patterns round 4e — opportunity 5 of the component roadmap):
  new `work-queue` workflow pattern with two projections over one headless
  session. `WorkQueueController` runs filtered, abort-superseded loads over
  a narrow `WorkQueueTransport` (`loadItems` plus optional
  claim/reassign/complete/escalate capabilities) with mutation-then-reload
  and full lifecycle events. `box-work-queue` is the individual triage
  list — rows grouped by pure due buckets (Overdue → Due today → Due this
  week → Later; deterministic via `reference-time`), risk/priority badges,
  per-row Claim/Complete/Escalate, and Reassign surfaced as a
  `reassign-requested` intent event for the host's confirm-before-apply
  flow. `box-workload-board` is the supervisor view — swimlanes by
  assignee (roster-ordered with visible spare capacity, overdue counts,
  `wip-limit` over-capacity flags) or by status (the pipeline/kanban
  projection), with a summary strip. Both elements accept an external
  `queueController` to share one session on the same page. Drag-and-drop
  lane moves are a tracked depth limitation.

- Diff viewer (patterns round 4d — CLM gap 2, the M1-critical clause
  comparison surface): new `diff` pattern with a pure, DOM-free engine —
  line-level LCS (prefix/suffix trim; a DP-size cap degrades to
  whole-replacement instead of blowing up on hostile input), similar
  removed/added lines paired into `changed` rows, word-level segments
  with whitespace coalescing, and stats plus navigable change ranges.
  `box-diff-viewer` renders `split` (side-by-side) and `inline` (unified)
  modes from one table — synchronized scrolling by construction —
  with per-document line-number gutters, `del`/`ins` word-level
  semantics, a stats chip, and prev/next change navigation emitting
  `change-focused`. Also adds `plans/component-opportunities.md`: the
  five roadmap-review opportunity areas (AI agent chat, clause lineage,
  audit aggregation, git-style version graph, work-queue family) with
  designs and the resequenced build order.

- Timeline (patterns round 4c — CLM gap 3): new `timeline` composition
  pattern, the append-only activity feed the approvals history, audit
  trail, and sidebar `activity` tab all need. `box-timeline` renders a
  tone-marked event spine from a validated `events` payload — actor,
  action, badge, summary, `<time>` timestamps, monospace correlation ids —
  with evidence chips emitting `evidence-selected` (unsafe hrefs downgrade
  from links to buttons), a `has-more` → `load-more` paging contract, and
  an optional composer gated on `composable` emitting `entry-submitted`.
  Closes the known-gaps activity-feed entry at display level; a full
  comment create/edit/delete transport contract remains future work.

- Form Wizard (patterns round 4b — first gap from the CLM horizontal
  coverage plan): new `form-wizard` workflow pattern for multi-step forms
  such as contract-intake flows. `FormWizardController` owns the step
  sequence, a value store, and per-step validation gating: Next and
  forward jumps run the step's `WizardStepValidator` (message +
  field-error contract), backward navigation and visited-step jumps never
  re-validate, optional steps skip gates, `saveDraft` emits unvalidated
  values for the host to persist, and `submit` validates every required
  step — navigating to the first failure — before emitting `submitted`.
  The `box-form-wizard` element composes `box-progress-steps` as a gated
  step rail with slot-per-step panels (a step's id doubles as its slot
  name), a `role="alert"` step-error line, and a Back/Next/Submit footer
  with an opt-in Save-draft button.

- Content Sidebar (patterns round 3d): new `content-sidebar` composition
  pattern closing the ContentSidebar entry of the catalog's known-gaps list. The
  `box-content-sidebar` element composes the catalog's `box-tabs` into the
  upstream tabbed details/activity/metadata/versions shell: hosts supply
  panels through named slots (`slot="details"` etc.), and
  `resolveSidebarTabs` shows the default tabs that actually have slotted
  content — or an explicit `tabs` configuration verbatim, including custom
  tab ids with matching slot names. `active-tab` reflects and falls back to
  the first tab when invalid, tab clicks emit `tab-changed`, a `collapsible`
  sidebar collapses its body with `collapsed-changed`, and the region is a
  labelled `complementary` landmark. The `versions` tab slot reserves space
  for the still-missing versions surface.

- Content Uploader (patterns round 3c): new `content-uploader` workflow
  pattern closing the next entry of the catalog's known-gaps list.
  `ContentUploaderController` is a headless upload queue over a narrow
  `UploadTransport` contract: constraint-validated enqueue (extension
  allowlist + max file size, `itemRejected` reasons), a concurrency-limited
  pump (default 2), per-item AbortController cancellation, retry/remove/
  clear-completed, and full lifecycle events ending in `queueDrained`.
  `createBoxUploadTransport` implements the contract with multipart
  `POST /files/content` against the Box upload host (chunked upload sessions
  are a future transport behind the same contract). The
  `box-content-uploader` element composes the existing `box-drop-zone` and
  `box-progress-bar` primitives into a drop-zone + queue surface: rows are
  rebuilt only on structural changes while progress bars are patched in
  place, with per-row cancel/retry/remove and a live summary footer.

- Content Picker (patterns round 3b): new `content-picker` workflow pattern
  closing the top entry of the catalog's known-gaps list.
  `ContentPickerController` composes the explorer headless blocks (same
  transport contract, navigation, search, pagination) with a cross-folder pick
  roster: type / extension / `maxSelectable` constraints (`isItemPickable`),
  `togglePick` with `selectionRejected` reasons (`not-selectable`,
  `limit-reached`; `maxSelectable: 1` replaces instead), and a
  `choose`/`cancel` contract emitting `chosen`/`cancelled`. The
  `box-content-picker` element renders the browse surface with a
  choose/cancel footer, live selection count, disabled non-eligible rows
  (folders stay navigable), and configurable button labels.

- Annotation lifecycle (patterns round 3): the three annotation components
  gain write paths and fixes from the patterns review. `box-annotation-thread`
  and `box-annotation-inspector` get composers (gated on a `composable`
  attribute) emitting `entry-submitted` / `reply-submitted`; replies can carry
  `id`/`createdAt`; all payload types are exported. Fixes: valid ARIA list
  semantics in the thread (ul/li/listitem), tool/color selection in the
  toolbar no longer destroys focus (in-place aria-pressed/tabindex patching),
  composer drafts and focus survive attribute updates, and annotation colors
  are validated before being interpolated into inline styles (CSS-injection
  guard).

- Preview rework (patterns round 2): the provider-adapter contract can now
  actually drive a preview engine — `mount`/`unmount` with a stable stage node
  the shell owns (`createViewer(container)` boots the real engine and returns
  a teardown), a typed `sendCommand` channel with numeric `page`/`pageCount`/
  `zoomPercent` state rendered as paging/zoom controls, and a
  `status`/`errorMessage` lifecycle rendered as a busy stage, error alert, and
  status chip. Fixes: detach + reattach no longer kills live adapter sync,
  unmount resets stale readiness, rejected provider actions surface as
  `action-error` instead of vanishing, the sidebar column collapses when
  empty, and the duplicate `provider-action` event was removed (listen to
  `action`).

- Content Explorer rework (patterns round 1 of the deep patterns review):
  headless sorting (`setSort` + transport sort params, mapped to the Box API),
  a mutation layer (`createFolder` / `renameItem` / `deleteItem` transport
  capabilities, controller methods with post-mutation refresh, and
  `itemMutated` / `mutationFailed` events), permission-gated item actions
  (`requiresPermission` on `ExplorerItemAction`, rendered disabled), abortable
  in-flight loads, and real-Box folder-metadata resolution (a metadata-less
  first page now fetches `GET /folders/:id` for the name and breadcrumb path).
  Fixes: ancestor breadcrumb clicks truncate the trail instead of reordering
  it, `disconnect()` resets to the root consistently, the composed shell no
  longer steals focus on unrelated state updates, hostile item ids are escaped,
  and the shell exposes its live controller for adapter pairing. The patterns
  catalog now carries an honest gap list vs upstream box-ui-elements
  (ContentPicker, ContentUploader, ContentSidebar, versions, comments).

- Docs-site design pass on the coral accent: the active rail item is now a
  haloed coral dot with a uniform item indent (was a coral edge bar), and
  guidance-card titles (Usage / Best practices / Keyboard) render in coral
  with the card edge bar removed. Added an opt-in `[regen-baselines]` CI
  workflow that adopts container-rendered visual baselines from the runner,
  for environments that can't run the pinned container locally.
- Added the committed conformance-program home (`docs/audits/README.md`): the
  three audits, the verdict model, current coverage, the surveyed-and-skipped
  list, and the quarterly snapshot refresh runbook (next due ≈ 2026-10-18);
  updated stale "conformant-count floor" wording now that the colour audit is
  strict-gated.
- Broadened the Layer 2 colour conformance audit to alert, breadcrumb, and chip
  (12 new claims, 60 → 72 total; CI conformant floor 55 → 63). Upstream's
  inline-alert tone palette resolves to the same tint math `alert.ts` ships as
  `color-mix()`. Surveyed but skipped for lack of a usable upstream anchor:
  datalist-item, pagination, icon-button, and the alert brand-info tone.
- Broadened the Layer 2 colour conformance audit to 4 more component families —
  select, dialog, toast, and progress-bar (15 new claims, 45 → 60 total; the
  CI conformant floor rises 41 → 55). Tabs was surveyed but box-ui-elements
  ships no tabs styling in its Storybook CSS, so it has no upstream anchor.
- Cross-referenced the Layer 2 colour conformance audit's `review` verdicts
  against the live-Box-app capture (`docs/audits/box-webapp-reference.data.json`):
  4 previously-ambiguous Storybook-vs-live-Box differences now auto-resolve to a
  confirmed `accepted-divergence`, and a genuine tooltip-text drift got fixed —
  0 `review` rows remain, so CI now gates the audit with `--strict`.
- Promoted React, Angular, Vue, and Svelte adapters to lockstep `0.1.0` release
  candidates with production package exports and one trusted-publishing train.
- Added typed `Dialog` and `useExplorerSelectionController` integrations plus
  server-rendering and hydration coverage.
- Added runnable React, Angular, Vue, and Svelte validation apps to the full CI
  gate, including Next.js and Svelte SSR hosts.
- Added Angular standalone directives and selection signal, Vue typed wrappers
  and composable, and Svelte typed wrappers and readable store.

---

## 0.5.0 — 2026-07-31

Breaking pre-1.0 feature release introducing a concise, auto-registering public
API plus runtime themes and design profiles. The release contains
[#143](https://github.com/unofficialbox/box-open-elements/pull/143) and
[#144](https://github.com/unofficialbox/box-open-elements/pull/144), with 1,114
tests and clean conformance and visual-regression gates.

**Breaking public API**

- Replaced public `Box*Element` classes and `defineBox*Element()` helpers with
  concise PascalCase exports such as `Accordion`, `Avatar`, `Button`, and
  `Switch`.
- Importing from the package root now automatically registers the complete
  `box-*` catalog. Tree-shakable component entrypoints such as
  `@unofficialbox/box-open-elements/accordion` register only their component.
- Added an idempotent static `register()` escape hatch for custom registries and
  isolated test realms.
- Removed the old Box-prefixed React adapter exports in favor of `Button`,
  `Select`, `TextField`, and concise supporting types.
- Made package imports safe during server-side rendering when `HTMLElement` and
  `customElements` are unavailable.

**Themes and design profiles**

- Added preferred typed semantic design-token names (for example,
  `surfacePrimary`, `textPrimary`, and `borderDefault`) while preserving Box's
  repetitive upstream keys as compatibility aliases.
- Added typed, persistent design profiles for runtime density, geometry,
  typography, elevation, and motion switching, with `box-default` and
  `compact-neutral` built-ins.

**Foundations**

- Added a framework-neutral theme controller with persistent `light`, `dark`,
  and `system` preferences; OS color-scheme observation; atomic design-system
  activation and token application; stale-token cleanup for custom bundles;
  scoped roots; `data-theme` / `color-scheme` synchronization; and the
  `boe:theme-change` event.
- Added `createThemeInitializationScript()` for pre-paint theme metadata in SSR
  and static shells. The docs site now uses the controller for both theme
  toggles and applies its initial theme before CSS loads.

**Documentation and tooling**

- Updated the documentation site, framework examples, Storybook, gallery,
  package guidance, and Markdown references to the concise API.
- Added the text-based `B/` favicon and refreshed the project banner and package
  presentation.
- Added public API, optimized-entrypoint, SSR, and auto-registration contract
  coverage, plus updated pinned-container visual baselines.

---

## 0.4.0 — 2026-07-21

Feature release working through the **remaining box-ui-elements audit items** —
the Medium/Low-severity behavioural gaps and the last net-new component left
after the 0.3.0 program. Additive — no breaking changes. 13 PRs
([#128](https://github.com/unofficialbox/box-open-elements/pull/128)–[#140](https://github.com/unofficialbox/box-open-elements/pull/140)),
now **78 components** and **1096 tests**; conformance 0 drift; pixel gate clean.

**Overlay primitive**

- **Fixed a latent `trackAnchor` bug** in `foundations/overlay`: an optional-call
  short-circuited its argument, so `anchorFloating` never ran without an
  `onReposition` callback — silently breaking fixed-coordinate positioning for
  both tooltip and popover. Split into compute-then-notify, with DOM regression
  coverage ([#128](https://github.com/unofficialbox/box-open-elements/pull/128)).

**New component**

- **`box-guide-tooltip`** — a guided-tour callout that points at a target (`for`
  id or slotted `anchor`), positioned on the overlay primitive; `heading`, body
  slot, `step`/`total` indicator, and Back/Next/Close controls emitting
  `next`/`back`/`close` with `detail.step`
  ([#140](https://github.com/unofficialbox/box-open-elements/pull/140)).

**Overlays**

- **`tooltip`** — moved onto the overlay primitive (escapes overflow, flips);
  `placement`, `theme` (default/error/callout), and a rich-content slot
  ([#128](https://github.com/unofficialbox/box-open-elements/pull/128)).
- **`dropdown`** — menu positioned on the overlay primitive with `placement`
  ([#129](https://github.com/unofficialbox/box-open-elements/pull/129)).

**Forms**

- **`select`** — `multiple` (native multi-select + `values` array, form-mirrored),
  option `group` (optgroup dividers), and per-option `disabled`
  ([#134](https://github.com/unofficialbox/box-open-elements/pull/134)).
- **`combobox`** — real ARIA listbox replacing the native datalist: type-to-filter,
  `aria-activedescendant` keyboard nav, group dividers, per-option descriptions,
  overlay-positioned popup (free-text still commits)
  ([#135](https://github.com/unofficialbox/box-open-elements/pull/135)).
- **`text-field`** — `type` passthrough, leading `icon` slot, trailing
  `loading`/`valid` status ([#132](https://github.com/unofficialbox/box-open-elements/pull/132)).
- **`search-field`** — `loading` spinner + form submission on Enter/submit
  ([#132](https://github.com/unofficialbox/box-open-elements/pull/132)).
- **`checkbox`** — `description` subsection ([#132](https://github.com/unofficialbox/box-open-elements/pull/132)).
- **`date-field`** — `clearable` + `clear()`; **`time-field`** — 12h/24h
  `setTimeString()` parsing + `parse-error`; **`radio-group`** — per-option
  `description`/`disabled` ([#133](https://github.com/unofficialbox/box-open-elements/pull/133)).
- **`category-selector`** — `max-links` overflow "More" menu (overlay-positioned)
  ([#137](https://github.com/unofficialbox/box-open-elements/pull/137)).

**Feedback**

- **`spinner`** `size`; **`chip`** status palette / `size` / `icon` slot;
  **`badge`** count semantics (`max`, `hide-when-zero`, `animate`)
  ([#130](https://github.com/unofficialbox/box-open-elements/pull/130)).
- **`alert`** & **`error-mask`** rich-content slots; **`help-text`** error role
  (`role="alert"`); **`toast`** declarative `duration`, `action` slot, wrapping
  ([#131](https://github.com/unofficialbox/box-open-elements/pull/131)).

**Collections & identity**

- **`avatar`** `badge` (online / external); **`carousel`** slotted slides;
  **`grid-view`** per-tile `tile-<value>` slot (slotRenderer parity)
  ([#136](https://github.com/unofficialbox/box-open-elements/pull/136)).
- **`datalist-item`** content slot + `active`; **`contact-datalist-item`**
  `external` marker + `subtitle`; **`draggable-list`** per-item `row-<value>`
  slot ([#138](https://github.com/unofficialbox/box-open-elements/pull/138)).

**Navigation & layout**

- **`link-button`** `target`/`rel` (auto-`noopener` for `_blank`) + rich children;
  **`accordion`** `borderless` + per-item `panel-<value>` slots
  ([#137](https://github.com/unofficialbox/box-open-elements/pull/137)).
- **`sidebar-toggle-button`** `direction` + action-aware tooltip; **`nav-sidebar`**
  grouped-nav styling hooks (`[data-nav-group]`, `<hr>`)
  ([#139](https://github.com/unofficialbox/box-open-elements/pull/139)).

---

## 0.3.0 — 2026-07-21

Feature release closing the **box-ui-elements coverage audit** (Steps 1–4): a
behavioural gap analysis of our catalog against `box/box-ui-elements`, then the
build-out. Additive — no breaking changes.

**Foundations (two force-multipliers)**

- **Viewport-aware overlay positioning** (`foundations/overlay`) — a shared
  `resolvePosition` / `anchorFloating` / `trackAnchor` primitive with flip,
  shift, and collision handling, exported for consumers building their own
  overlays. `popover` moved onto it (12 placements, no more edge-clipping)
  ([#116](https://github.com/unofficialbox/box-open-elements/pull/116)).
- **Shared form-field features** — `FormAssociatedElement` gains `required`
  (indicator + `aria-required`), `description` (help text + `aria-describedby`),
  and `hideLabel`; applied to text-field, date-field, search-field, and select
  ([#117](https://github.com/unofficialbox/box-open-elements/pull/117)).

**New components (5)**

- **`box-thumbnail-card`** — rich file/grid card with thumbnail + details slots;
  optional interactive (keyboard-activated) mode.
- **`box-badgeable`** — corner-badge wrapper (also closes the avatar badge gap).
- **`box-breadcrumb`** — file-path trail with overflow-collapse into an ellipsis.
- **`box-context-menu`** — right-click / Shift+F10 menu, cursor-anchored on the
  overlay primitive, full keyboard menu.
- **`box-table`** — semantic, selectable data table: single / Ctrl-click /
  Shift-range selection, keyboard model, and host-owned sortable headers
  ([#118](https://github.com/unofficialbox/box-open-elements/pull/118),
  [#119](https://github.com/unofficialbox/box-open-elements/pull/119),
  [#120](https://github.com/unofficialbox/box-open-elements/pull/120),
  [#121](https://github.com/unofficialbox/box-open-elements/pull/121)).

**Component upgrades (5, all backward-compatible)**

- **`box-tabs`** — real tab **panels** (`role=tabpanel`, slotted per option); it
  was previously only a tab strip.
- **`box-button`** — `is-loading` spinner, `icon` slot, and `type="submit"|"reset"`
  (form-associated).
- **`box-dialog`** — `size` (small/medium/large/fullscreen) + background
  scroll-lock.
- **`box-menu`** — item composition: section headers, separators, link items,
  and checkable items (`menuitemcheckbox`).
- **`box-pill-selector-dropdown`** — `allow-custom` turns it into a
  collaborator/email **token input**: type + Enter/comma to add, paste-to-create,
  and `pattern` validation with `invalid-entry`
  ([#122](https://github.com/unofficialbox/box-open-elements/pull/122)–[#126](https://github.com/unofficialbox/box-open-elements/pull/126)).

## 0.2.1 — 2026-07-20

Patch release: responsiveness fixes to two content-explorer pattern components.
The rest of the work in this window is docs-site only and does not ship in the
package.

- **`box-explorer-table` shrinks instead of overflowing its host.** Its nowrap
  header row gave it a wide min-content width, so it pushed out of grid/flex
  containers at narrow widths. `:host { min-width: 0 }` lets it shrink and the
  table scrolls within its own frame
  ([#110](https://github.com/unofficialbox/box-open-elements/pull/110)).
- **`box-filter-bar` reflows to one column when constrained.** Its media-query
  fallback measured the viewport, not the host (a shadow-DOM gotcha), so a narrow
  bar on a wide screen kept three columns and overflowed. Now uses zero grid
  track floors plus `min-width: 0`, keeping the three-up layout at natural width
  while compressing under constraint
  ([#110](https://github.com/unofficialbox/box-open-elements/pull/110)).

Docs site (not published): Community-brand restyle with a landing page
([#108](https://github.com/unofficialbox/box-open-elements/pull/108)); rail,
canvas-containment, VS Code code colours, and a masthead theme toggle
([#109](https://github.com/unofficialbox/box-open-elements/pull/109)); official
framework icons, beautified snippets, and per-lesson framework sections
([#111](https://github.com/unofficialbox/box-open-elements/pull/111),
[#112](https://github.com/unofficialbox/box-open-elements/pull/112)).

## 0.2.0 — 2026-07-19

First release cut through the automated OIDC release workflow (`0.1.0` was the
bootstrap publish that created the package; no functional code changed between
them). Notable work landed since the last changelog window:

- **box-ui-elements conformance program** — CI-gated on three axes: Layer 1
  geometry vs upstream SCSS, Layer 2 colour/state vs the compiled Storybook CSS
  (45 grounded claims, with a conformant-count floor), and a live-Box **webapp
  reference** covering colour, geometry, and interaction states.
- **Gallery-review component polish** — flat Box tree/tree-grid disclosure
  chevrons ([#92](https://github.com/unofficialbox/box-open-elements/pull/92)),
  grid-view/dual-listbox fill-width
  ([#93](https://github.com/unofficialbox/box-open-elements/pull/93)),
  item-details empty-avatar fix + chart-panel bar scaling
  ([#94](https://github.com/unofficialbox/box-open-elements/pull/94)), and real
  Box iconography in grid-view/nav-sidebar
  ([#95](https://github.com/unofficialbox/box-open-elements/pull/95)).
- **npm packaging** — scoped as `@unofficialbox/box-open-elements`, published
  via a provenance-attested **OIDC trusted-publishing** workflow (no token);
  planning docs purged and contributor + maintainer guides added
  ([#98](https://github.com/unofficialbox/box-open-elements/pull/98)–[#102](https://github.com/unofficialbox/box-open-elements/pull/102)).

---

## 2026-07-17 — React adapter, agent rules, and BUE style bridge

| PR | Summary |
| --- | --- |
| [#70](https://github.com/unofficialbox/box-open-elements/pull/70) | First real **style-bridge** library config: BUE Content Explorer SCSS → `box-content-explorer` / `::part(…)` + token hooks; engine hardening; `bun run style-bridge:bue-explorer`; 14 focused tests. |
| [#71](https://github.com/unofficialbox/box-open-elements/pull/71) | Git-derived three-day changelog and agent-takeover snapshot. |

Both PRs are merged on `main`; #70 passed Verify, Visual regression, and CodeRabbit before merge.

---

## 2026-07-16 — BUE visual conformance, density, motion, React, agent rules

### Merged PRs

| PR | Title |
| --- | --- |
| [#69](https://github.com/unofficialbox/box-open-elements/pull/69) | Always-on rule: recommend next step with why (`.cursor/rules/recommend-next-step.mdc`, `AGENTS.md`) |
| [#68](https://github.com/unofficialbox/box-open-elements/pull/68) | React adapter PoC: `@box-open-elements/react` + `Button` + `createWebComponent` |
| [#67](https://github.com/unofficialbox/box-open-elements/pull/67) | BUE drawer + denser pattern shells via `boePanel` |
| [#66](https://github.com/unofficialbox/box-open-elements/pull/66) | BUE overlays/tabs/toast/alert/badge/avatar/error-mask via `boeOverlay` |
| [#65](https://github.com/unofficialbox/box-open-elements/pull/65) | BUE visual conformance P0: geometry tokens + everyday controls |
| [#64](https://github.com/unofficialbox/box-open-elements/pull/64) | Full density peer-consistency pass + Foundations markdown tables |
| [#63](https://github.com/unofficialbox/box-open-elements/pull/63) | Motion vocabulary migration + explorer list/table presentation |
| [#62](https://github.com/unofficialbox/box-open-elements/pull/62) | Full catalog density audit — segmented-control chrome bands |
| [#61](https://github.com/unofficialbox/box-open-elements/pull/61) | Density + demo fidelity pass for docs-site surfaces |
| [#60](https://github.com/unofficialbox/box-open-elements/pull/60) | Explorer metadata-query host chrome + workshop adapter stories |
| [#59](https://github.com/unofficialbox/box-open-elements/pull/59) | Workshop batch 5: stories **64 → 101** |
| [#58](https://github.com/unofficialbox/box-open-elements/pull/58) | Docs-site Preview build-along lesson |
| [#57](https://github.com/unofficialbox/box-open-elements/pull/57) | Docs-site Share build-along lesson |
| [#56](https://github.com/unofficialbox/box-open-elements/pull/56) | Workshop batch 4: stories **49 → 64** |
| [#55](https://github.com/unofficialbox/box-open-elements/pull/55) | Explorer host chrome demo (filter-bar, saved views, list/table swap) |
| [#54](https://github.com/unofficialbox/box-open-elements/pull/54) | Coverage baseline gate + reactivate deferred foundations work |

### Highlights

- **Geometry foundations:** `boeOverlay`, `boePanel`, control sizing aligned to box-ui-elements BDL (`docs/foundations/geometry.md`).
- **Motion:** shared `boeMotionDuration` / `interactive` (140ms); maintainer script `tools/migrate-motion-literals.ts`.
- **Density:** `tools/density-audit.ts`, `tools/apply-density-consistency.ts`, report in `tmp/density-audit-report.json`.
- **Coverage gate:** `bun run verify` now runs coverage with floors — see `docs/coverage-baseline.md`.
- **Workshop:** extracted story count **108** (catalog parity including explorer adapters).
- **Build-alongs:** Explorer, Share, and Preview lessons in `docs-site/lessons.ts`.

---

## 2026-07-15 — Fidelity batches finish, explorer, docs-site, workshop, tooling

### Merged PRs

| PR | Title |
| --- | --- |
| [#53](https://github.com/unofficialbox/box-open-elements/pull/53) | Docs sync after workshop batch 3 |
| [#52](https://github.com/unofficialbox/box-open-elements/pull/52) | Workshop batch 3: JSON options/items (**34 → 49** stories) |
| [#51](https://github.com/unofficialbox/box-open-elements/pull/51) | Docs sync after #49 and #50 |
| [#50](https://github.com/unofficialbox/box-open-elements/pull/50) | Agent CI polling + stuck-run cancel/retry guidance |
| [#49](https://github.com/unofficialbox/box-open-elements/pull/49) | Workshop status sync + expand to **34** stories |
| [#48](https://github.com/unofficialbox/box-open-elements/pull/48) | Workshop guidance stories for docs-site Usage cards |
| [#47](https://github.com/unofficialbox/box-open-elements/pull/47) | Brand imagery closed (Blueprint + box-ui-elements vectors) |
| [#46](https://github.com/unofficialbox/box-open-elements/pull/46) | Token consumption vs shell guidance + API-tab inventory |
| [#45](https://github.com/unofficialbox/box-open-elements/pull/45) | Iconography generator (`bun run icons:generate`) |
| [#44](https://github.com/unofficialbox/box-open-elements/pull/44) | Docs-site Usage / Best practices / Keyboard guidance cards |
| [#43](https://github.com/unofficialbox/box-open-elements/pull/43) | Explorer search + enriched item columns + UI chrome |
| [#42](https://github.com/unofficialbox/box-open-elements/pull/42) | Design-heavy fidelity leftovers (popover, tooltip, gestures, layout) |
| [#41](https://github.com/unofficialbox/box-open-elements/pull/41) | Medium/low fidelity audit nits |
| [#40](https://github.com/unofficialbox/box-open-elements/pull/40) | Batch 7: multi-value form association + skeleton short-circuit |
| [#39](https://github.com/unofficialbox/box-open-elements/pull/39) | Batch 5: form association + invalid state |
| [#38](https://github.com/unofficialbox/box-open-elements/pull/38) | Batch 4: ARIA keyboard nav + heading semantics |
| [#37](https://github.com/unofficialbox/box-open-elements/pull/37) | Docs sync after Batches 0–3/6 |
| [#35](https://github.com/unofficialbox/box-open-elements/pull/35) | Batch 3: focus-visible + hover/active/disabled helpers |
| [#33](https://github.com/unofficialbox/box-open-elements/pull/33) | Batch 1 complete: all catalog/pattern elements on `BaseElement` |
| [#32](https://github.com/unofficialbox/box-open-elements/pull/32) | Form/action components → `BaseElement` architecture |
| [#31](https://github.com/unofficialbox/box-open-elements/pull/31) | Batch 1: render helper + focus/input fidelity (button, checkbox, radio-group) |

### Fidelity program (completed)

| Batch | Scope |
| --- | --- |
| 0 | Security: 3 injection/XSS fixes (link-button, skeleton, content-explorer) |
| 1 | `BaseElement` render contract across full catalog |
| 2 | Dark-mode `color-mix(…, white)` → token surfaces (94 files) |
| 3 | Shared interaction-state CSS helpers |
| 4 | ARIA/keyboard + native heading semantics |
| 5 | `FormAssociatedElement` on 13 everyday controls |
| 6 | `title` → `heading`, broken examples, token labels |
| 7 | Multi-value form association polish |
| + | Medium/low nits (#41), design-heavy leftovers (#42) |

Audit driver scored 109 components against the reference.

---

## 2026-07-14 — CI, deploy, fidelity audit kickoff, build-alongs

### Merged PRs (#21–#30)

Infrastructure and early fidelity work shipped via the design-system rebuild series:

| PR | Theme |
| --- | --- |
| #21–#28 | Storybook workshop, docs-site shell, build-along scaffolding, theming QA |
| [#29](https://github.com/unofficialbox/box-open-elements/pull/29) | Fidelity Batches 0, 2, 6 + audit follow-ups |
| [#30](https://github.com/unofficialbox/box-open-elements/pull/30) | GitHub Pages deploy (`bun run site:build` → `docs-site/dist`) |

### Highlights

- **Component fidelity audit** harness + report (all 109 components).
- **CI visual regression:** pinned Playwright container, pixel-diff gate (`bun run test:regression:pixel`).
- **Docs-site:** deployable static site, variant dropdown, in-shell foundation markdown, Explorer build-along lesson.
- **Design QA:** token-driven focus rings and status pills.

---

## Contributors (git shortlog, 2026-07-14 – 2026-07-17)

| Commits | Author |
| ---: | --- |
| 34 | Kyle @ Unofficial Box |
| 16 | Cursor Agent |
| 5 | cursor[bot] |

---

## Verification commands (unchanged)

```bash
bun run verify          # typecheck + coverage-gated tests + build
bun run test:regression:pixel   # CI pixel gate locally (Docker)
bun run style-bridge:bue-explorer   # BUE Content Explorer bridge
```

See `AGENTS.md`, `BACKLOG.md`, and `docs/HANDOFF.md` for ongoing orientation.
