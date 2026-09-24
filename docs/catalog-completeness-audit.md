# Catalog completeness audit

Audit date: 2026-09-24. Baseline: `bfd66b4`; includes the current call-console
and Agent Workspace completion changes. Scope: all **158 catalog surfaces (97 components, 61
patterns)** plus the eight rendered foundation pages.

## Verdict

### Implemented repair pass — September 24

These changes close the confirmed semantic-color and shared-behavior defects,
not the entire catalog audit.

| Repair | Result / evidence |
| --- | --- |
| Theme-aware Alert/Toast fills and status ink | Dark Alert text 1.00 → 13.52:1; success Toast 1.04 → 10.24:1; warning Toast 1.00 → 9.55:1. Light tint conformance retained. |
| Dark on-brand pairing | Primary button 2.97 → 6.40:1; normal/hover/pressed token pairs have contrast regression tests. |
| Annotation Inspector | Selected annotation body 1.66 → 15.49:1; Resolve 2.97 → 6.40:1. |
| Lineage / notification status ink | Minor deviation 2.37 → 10.74:1; unread count 2.99 → 6.29:1. Separate narrow-layout findings are addressed in the responsive pass below. |
| Persistent errors | Error Toasts survive explicit timeouts and tone changes; non-errors can expire. Declarative zero duration remains sticky through `show()`. |
| Honest decisions | Approved/rejected are distinct from done/skipped; all eight kinds now have a shared docs/workshop fixture. |
| Composed-tree focus | Open shadow roots and slots participate in modal tab loops; inert/hidden controls are excluded. Restore the actual inner trigger without scrolling. |
| Dialog reachability | Border-box viewport bounds, scrollable body, wrapping footer; all four sizes tested at both widths/themes. Slotted controls now reach Escape and reverse-Tab handlers. |

Browser evidence is under `/tmp/boe-semantic-repair`: `targeted.json`,
`behavior.log`, `overlay-*.png`, `behavior-dialog-*.png`, and `status-*.png`.
Original comparison evidence remains under `/tmp/boe-design-audit-QNnrM2`.
These are local review artifacts, not committed fixtures.

Verification: `bun run verify` passed (244 test files, 2,178 tests; 86.38%
statement coverage), including core/four-adapter builds and framework/SSR
validation. `bun run docs:typecheck` and `git diff --check` passed. Final dialog
refinement also passed its focused 21-test accessibility/overlay suite. Chrome
interaction runs reported no page/console errors or document overflow.
Firefox, WebKit, assistive-technology and live-provider checks were not run.

Three critical passes:

1. Purpose/state: preserve failed feedback and separate decision from outcome;
   timer and status-label regression tests added.
2. Theme consistency: browser measurements found additional hardcoded Resolve,
   lineage and unread-count colors; migrated these to the semantic pair.
3. Responsive/keyboard: actual slotted-button navigation exposed a missed event
   path; repaired it, bounded all dialog sizes and reran all four combinations.
   Reduced-motion status animation was checked in the rendered docs fixture.

The twelve demonstration gaps listed below were subsequently addressed. Other
responsive layout findings, integration snippets and broader visual consistency
remain open; they are not silently promoted to complete by these repair passes.

### Task-oriented examples — completed local demonstration pass

One shared [fixture module](../storybook/fixtures/purpose-demos.ts) drives docs and
the workshop. The workshop retains its existing isolated variants alongside the
new Interactive example. The docs use the authored interactive example rather
than silently substituting an extracted workshop shell. No live provider writes
or external downloads occur.

| Component / intended purpose | Demonstrated action → outcome | Scope / remaining boundary |
| --- | --- | --- |
| Menu Item — choose an option | Arrow keys/Enter select sort order; checked state and actual file order update; disabled option cannot activate | Host owns the composed menu navigation and selection. Public `focus(options)` avoids shadow-tree access. |
| Skeleton — explain a wait | Local loading state becomes three file rows; Load files again repeats; cleanup cancels timers | Simulated 450ms wait, not a measured provider latency. |
| Grid — organize responsive content | Main content/sidebar stack below 540px of available width; Review plan reveals details | Demonstrates host-owned responsive placement, not a change to the Grid contract. |
| Command Palette — execute a command | Open, search, no matches, disabled Delete, execute details/activity; Escape restores focus | Commands change the local view; platform-specific shortcuts are scoped to focus inside the preview, not the whole application. |
| Context Menu — act on an object | Right-click, Shift+F10 or explicit File actions trigger; View details reveals the selected file; Delete disabled | New `show()` method enables touch entry without synthetic events. |
| Popover — inspect contextual details | Edge-positioned trigger opens readable sharing details; Got it/Escape close and return focus | Both-axis viewport fallback now handles cases where neither preferred nor opposite side fits. |
| Shortcuts Overlay — discover keyboard commands | Keyboard activation opens the complete modal; platform-aware hints; Escape returns focus; the documented shortcut opens file details | Preview-scoped bindings ignore text-entry controls and are removed on teardown. |
| Explorer Breadcrumbs — change location | Marketing → All Files → Legal updates both breadcrumb and list using one controller | Local deterministic folder transport; controller disconnects on teardown. |
| Explorer Action Menu — permitted file actions | View details opens actual details; permission-denied Delete remains disabled and emits no action; selection restores trigger focus | Both controller and adapter reject denied actions; this is not server-side authorization. |
| Item Form — edit and save | Populated fields, dirty state, required-name validation, saving, simulated failure with preserved edits, retry and cancel | Save is local only. Host owns validation/persistence. |
| Preview — render provider content | Adapter mounts an actual local document; loading/error/unsupported states replace it; Show document retries; cleanup unmounts | Local HTML renderer, not PDF-engine or live Box-provider certification. |
| File Request Builder — configure a request | Title/notification edits, current-value preview, validation, local draft save; copy explains unpublished state | No public upload link is created. A provider must implement publication; keyboard focus survives checkbox updates. |

Verification: 48/48 Chrome cases (12 examples × 1440/390px × light/dark), with
reduced motion enabled, passed their actual task outcomes. Overlay captures use
the full viewport; no collected console/page errors or document overflow.
`bun run verify` passed 2,211 tests in 245 files; overall statement coverage is
86.53% and the new shared demo module is 93.98%. Focused tests cover denied actions,
focus preservation, viewport fallback, validation/retry, timers and teardown.
Local evidence: `/tmp/boe-purpose-qa/results-complete.log`, screenshots in the same
directory, and `verify-complete.log`. No Firefox/WebKit, screen-reader, or live-provider
certification is claimed.

Three review passes: (1) correct task outcomes and explicit provider boundaries;
(2) full-viewport and narrow-layout inspection, which found the Popover fallback
defect; (3) keyboard/permission/teardown review, which repaired disabled-action
emission and settings focus loss. Existing independent visual-refinement findings
remain open, including uppercase labels, dense card composition and other mobile
layouts elsewhere in the catalog.

### Responsive repair pass — completed for five affected surfaces

| Surface / purpose | Observed defect | Repair and verified outcome |
| --- | --- | --- |
| Lineage Graph — inspect derivation and compare nodes | Wrapped labels and chips overlapped adjacent fixed-height graph rows at 390px | Non-wrapping intrinsic-width rows preserve SVG/node alignment. A named, focusable scroll region and visible scroll guidance keep complete labels/comparisons reachable. Arrow-key node navigation and comparison events still work. Horizontal scrolling is intentional, contained within the graph. |
| Explorer Toolbar — search, refresh and clear selection | Search's minimum width prevented flexible embedding; its nested field overflowed even after the toolbar could shrink | Removed the fixed minimum. Search, clear and refresh remain reachable at 240px container width and search/clear update the real local controller. |
| Search Field — enter and submit a query | Intrinsic grid sizing pushed Search/Clear outside narrow parents | Bounded grid track; a container query places actions below the input below 22rem, including standalone reuse. |
| Notification Inbox — read and triage notices | Long unbroken titles/entity names clipped; actions squeezed the text column | Flexible text track, long-string wrapping and below-content actions below 32rem. Unread filtering and mark-read intent are verified; host demo updates unread state. |
| Fact List / Result Blocks — read label/value facts | Long identifiers exceeded the host; narrow side-by-side labels/values were difficult to scan | Wrapping equal-width columns at larger sizes; labels above values below 28rem, based on the component's container. Full values and empty-value rows remain in the semantic description list. |
| Docs shell — reach documentation controls | At 320px the Accessibility tab exceeded the page and masthead links crowded the logo | Tabs wrap; compact header spacing preserves the logo. No page-level overflow on the tested routes. |

Verification: **32/32 Chrome interaction cases**, covering four composed docs
surfaces at 1440/390/320px in light/dark themes plus 240px embedded panels on
desktop. Reduced motion enabled. Checks include nested-shadow-root overflow,
actual search/clear, unread filtering/read intent, keyboard graph scrolling,
node selection, comparison activation and stacked facts. Graph content is
intentionally excluded from overflow failures inside its scroll region; row
content is separately checked for vertical overlap. No collected console/page
errors. Screenshots were visually reviewed, not only measured.

`bun run verify`: **2,215 tests, 246 files, 86.53% statement coverage**, including
framework/SSR validation. Focused suite: 62 tests. Local evidence:
`/tmp/boe-responsive-FWRMjd/after-verified.json`, before/after screenshots and
`verify.log`. Browser skill unavailable; installed Playwright/Chrome fallback
used. These are temporary local artifacts, not committed screenshot baselines.
Firefox/WebKit, screen readers, live providers, arbitrary localization and all
158 catalog surfaces have **not** been certified by this targeted pass.

### Catalog-wide verdict

CI visual follow-up: the pinned-container comparison found eight changed
baselines. Seven reflect intentional demo/layout changes and were reviewed and
adopted from CI artifacts. The forms gallery exposed a genuine Search Field
regression: inline-size containment collapsed a content-sized flex child.
An intrinsic inline-size fallback repairs it without overriding parent sizing.
A permanent gallery assertion checks input width and inner control bounds;
the focused Search Field/responsive unit suite passes (12 tests). Eight flex-layout
search/clear browser cases and the existing 32 responsive cases also pass.
Corrected forms and explorer captures from pinned-container CI run 36029736982
were visually reviewed and adopted; the other 62 docs-site baselines already
passed that run. CI typecheck/tests/build and strict conformance checks passed.

Review follow-up: repaired the shared focus traversal's fieldset and negative-
tabindex shadow-host edge cases. Four new regression tests cover first versus
later/nested legends, retained links, negative shadow/slot scopes versus ordinary
light-DOM containers, trap boundaries and newly disabled restoration targets.
Chrome verified actual Tab/Shift+Tab traversal, wraparound and Escape in Dialog
at 1440/390px in light/dark themes (4/4 cases), without collected console errors.
Evidence: `/tmp/boe-focus-review-FqDaj5/browser.json` and dialog screenshots.
Final `bun run verify`: **2,219 tests in 246 files**, 86.53% overall statement
coverage and 94.02% for `focus.ts`; framework and SSR validation passed.

**Do not mark the whole library complete.** Every catalog surface has a source
implementation, authored metadata and direct test references, but demonstration,
integration documentation and state coverage are uneven. Source presence and
green tests are not visual/product completeness.

This audit distinguishes confirmed gaps from inventory signals and untested
behavior. It is not a Box parity audit or a certification of every interaction.

## Confirmed findings and priorities

| Priority | Surface / area | Exact finding | Remediation / status |
| --- | --- | --- | --- |
| Addressed | Call console | Single failed fixture, generic controls, duplicate copy actions, missing explicit empty states, skeletal integration example | Completed themed request/inspector panes, shared buttons/code blocks, search/filter/keyboard selection, copy/clear/reconnect feedback, five demo variants and a simulated stream. |
| Addressed | Docs API | Metadata had JavaScript properties/events, but the API page rendered only observed attributes/parts/tokens | Properties/events now displayed; metadata-defined events appear in the event inspector. No-attribute surfaces explain property configuration. |
| Addressed | Docs mobile layout | Preview and event-inspector grids used intrinsic minimums; filtering then resizing call-console overflowed to 442px at a 390px viewport | Constrained grid tracks/children; populated-event mobile overflow assertion added to permanent screenshot capture. |
| P1 | Shared status theme colors | `foundations/status/index.ts` references `TextStatusTextSuccess`, `TextStatusTextWarning` and `TextStatusTextError` CSS tokens that neither bundled theme defines; glyph colors therefore remain hard-coded fallback values in dark mode | Define accessible semantic status text tokens in both themes or reconcile with existing status tokens; verify contrast and theme overrides across all consumers. Current call-console glyphs inherit this shared foundation limitation. |
| Addressed | Agent workspace demo | Previous setup omitted controller teardown and the workshop used a bare tag | Shared realistic fixtures now detach the host and destroy all sessions, cancelling timers/streams on navigation or variant changes. |
| Addressed | Agent workspace responsive proof | Normal docs column is narrower than the desktop breakpoint | Expand workspace uses native fullscreen without remounting sessions; three-pane desktop and exclusive mobile drawers have browser evidence and screenshot fixtures. |
| Addressed | Agent workspace scenario coverage | Previously an immediate facts-only response | Five scenarios demonstrate independent chats, delayed streaming, context/sources, follow-up options, approval with failed execution, rejection, empty and access-failure states. Hidden-stream continuation and teardown tested. |
| Addressed | Chat follow-up / retry controls | New option and failed-action retry buttons had browser-default styling | Reused the chat action token styles, including hover and keyboard focus; follow-up routing has a regression test. |
| P1 | Copyable rich-data demos | 83 surfaces have setup functions but no explicit runnable setup snippet detected | Review each row below; publish minimum property/controller setup and teardown where markup cannot reproduce the preview. These are candidates, not 83 proven broken examples. |
| P2 | Workshop defaults | Seven surfaces use only bare-tag variants without setup: status-icon, fact-list, check-list, document-list, result-blocks, run-summary, provenance-strip | Bind representative data and author states. A bare status-icon is a valid default, but does not demonstrate its family. |
| P2 | Documented states | 82 surfaces have fewer than two selectable documented variants | Apply relevant state contracts, not a universal quota: interactive surfaces need disabled/loading/error/empty/selected cases; static formatters may legitimately need only a small value matrix. |
| P2 | Guide tooltip | No separate curated docs example; the site falls back to its authored workshop | Not a missing implementation. Validate the effective workshop example and make the source-of-truth choice explicit. |
| P2 | Content Explorer inspection | Default example composes explorer adapters instead of mounting box-content-explorer | Label composition versus standalone modes clearly. Primary-tag inspectors cannot describe the absent standalone host; verify both modes independently. |
| P2 | Guidance | Keyboard/best-practice cards are inferred from rendered roles rather than per-pattern interaction specifications | Retain shared guidance, but add authored specifics for orchestration, recovery, keyboard flows and integration boundaries. |

## Deeper review of the other recent agent surfaces

| Surface | Existing evidence | Missing evidence / recommendation |
| --- | --- | --- |
| Status icon | Eight distinct kinds, including approval/rejection separate from execution; docs/workshop now show all with visible words | Browser verification of the decision labels is complete at both widths/themes; no screen-reader certification claimed. |
| Fact list | Semantic label/value renderer, escaped content, unit tests, populated docs fixture | Copyable rows assignment; long labels/values, empty rows, missing values and narrow layout examples. |
| Check list | Word-plus-glyph verdicts, shared status mapping and safe content rendering | Demo currently emphasizes pass/warn; add fail/info, long reasons, explicit verdict values and full property setup. |
| Document list | Safe links, selection event, IDs for deduplication and tests | Demo link points to the Box landing page, not a representative file route. Show link versus selection-only behavior, long names, empty data and event wiring. |
| Result blocks | Four serializable shapes, semantic tables and safe renderers, keyed stream updates | Current docs fixture omits document blocks. Add all four shapes, wide/empty tables, late updates, unknown values and full setup snippets. |
| Run summary | Pure progress helpers, collapsed disclosure, elapsed timer and tests | Static completed docs turn cannot prove a live label, 2s clock threshold, failure, warnings, cut-short stream or teardown. Add controlled timed/error variants and explicit turn/open/failed/threshold documentation. |
| Agent workspace | Controller/session logic, shared five-scenario demo, runnable setup/teardown, persistent hidden streams, desktop/fullscreen and mobile drawer checks | No real-provider, screen-reader or cross-browser certification; persisted-pane/scroll behavior remains covered by existing targeted tests rather than exhaustive visual certification. |
| Agent chat / run trace | Existing authored examples and tests; newly added contracts integrate with them | Add explicit scenario fixtures for sequence gaps, missing done, approved-but-failed, IME composition, scroll unpin/repin, option suppression and quiet elapsed announcements. Unit tests alone do not prove these visual flows. |

## Evidence and limits

- Structural scan reads every catalog source, story module, curated example and
  direct test reference. Reproduce with `bun tools/completeness/audit.ts`;
  `--json` includes matched test filenames.
- **158/158 desktop routes loaded without page exceptions.** 157 mounted the
  advertised host; Content Explorer intentionally uses an adapter composition.
  Zero-sized overlay/display-contents hosts were not mislabeled as blank failures.
- **158/158 mobile routes loaded at 390 × 844 without page exceptions or
  document-level horizontal overflow.** This is a default-state smoke test,
  not a test of every overlay, long value or interaction.
- **8/8 foundation routes contained meaningful documentation**, with no page
  exceptions: tokens, theming, design profiles, geometry, motion, icons,
  accessibility and brand.
- Call-console interaction flow passed at 1440 × 1100 and 390 × 844 in Chrome:
  semantic HTTP-200 failure, service/error/search filters, copy feedback,
  keyboard splitter resize, clear/reset, pending-to-completed simulation,
  light/dark switching, responsive stacking, code/API contracts and all five
  demo variants. Zero browser console warnings/errors in the full sweep.
- Full `bun run verify` passed after the workspace follow-up: **242 files / 2,162 tests**, **86.35% statement
  coverage**, package builds and framework validation. Docs typecheck/build
  and all three existing BUE conformance commands passed. Those conformance
  checks cover their existing manifests, not every new call-console state.
- Workspace browser checks passed in Chrome at 1440 × 1100 (expanded desktop)
  and 390 × 844 (dark mobile): independent chats, continued hidden streaming,
  approval with failed execution, failure/empty variants, drawer dismissal,
  no page overflow, and route teardown disconnecting every owned session.
  No page exceptions or console warnings/errors. Six fixture unit tests cover
  setup, follow-up routing, approval/rejection and timer/controller cleanup.
- Pinned Playwright-container strict pixel regression passed after baseline
  refresh: **14 gallery + 62 docs captures**, including three new call-console
  captures (light, dark and mobile) and two workspace captures (wide and mobile).
  Existing affected captures reflect newly visible metadata events/property
  guidance; unrelated sub-threshold recapture noise was discarded.
- Direct test file counts below are **reference counts, not coverage percentages**.
  Variant counts are authored selectable examples, not complete state coverage.
- No live Box/Salesforce/agent credentials or endpoints were exercised.
- No blanket accessibility, full keyboard-flow, screen-reader, cross-browser,
  or real-provider sign-off is claimed for the other 157 surfaces.
- Foundation pages are audited for availability/content only in this pass;
  a token-by-token/style-state fidelity audit remains a separate task.

## Full surface matrix

Every catalog surface is listed, including the call console for comparison.
For every flagged row, the recommendation is to supply the missing integration
or state evidence before marking it complete. Unflagged rows still need
state-specific behavioral and visual sign-off.

| Surface | Tier | Implementation | Direct test files¹ | Demo states² | Contract rows | Desktop render | Gaps / recommendation |
| --- | --- | --- | ---: | ---: | ---: | --- | --- |
| status-icon | components | [source](../src/components/feedback/status-icon.ts) | 1 | 1 | 1 | Host mounted | bare-tag workshop defaults; only one documented state |
| fact-list | components | [source](../src/components/collections/fact-list.ts) | 1 | 1 | 1 | Host mounted | bare-tag workshop defaults; rich setup lacks runnable setup snippet; only one documented state |
| check-list | components | [source](../src/components/collections/check-list.ts) | 1 | 1 | 1 | Host mounted | bare-tag workshop defaults; rich setup lacks runnable setup snippet; only one documented state |
| document-list | components | [source](../src/components/collections/document-list.ts) | 1 | 1 | 1 | Host mounted | bare-tag workshop defaults; rich setup lacks runnable setup snippet; only one documented state |
| result-blocks | components | [source](../src/components/collections/result-blocks.ts) | 1 | 1 | 1 | Host mounted | bare-tag workshop defaults; rich setup lacks runnable setup snippet; only one documented state |
| run-summary | patterns | [source](../src/patterns/run/run-summary.ts) | 1 | 1 | 1 | Host mounted | bare-tag workshop defaults; rich setup lacks runnable setup snippet; only one documented state |
| agent-workspace | patterns | [source](../src/patterns/agent-workspace/agent-workspace.ts) | 2 | 5 | 7 | Host mounted | Simulated scenarios and lifecycle verified; live-provider and cross-browser sign-off separate |
| call-console | patterns | [source](../src/patterns/call-console/call-console.ts) | 2 | 5 | 7 | Host mounted | Structural evidence present; behavioral sign-off separate |
| button | components | [source](../src/components/actions/button.ts) | 8 | 7 | 8 | Host mounted | Structural evidence present; behavioral sign-off separate |
| button-group | components | [source](../src/components/actions/button-group.ts) | 1 | 1 | 3 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| icon-button | components | [source](../src/components/actions/icon-button.ts) | 1 | 3 | 3 | Host mounted | Structural evidence present; behavioral sign-off separate |
| link-button | components | [source](../src/components/actions/link-button.ts) | 1 | 3 | 6 | Host mounted | Structural evidence present; behavioral sign-off separate |
| menu | components | [source](../src/components/actions/menu.ts) | 2 | 2 | 4 | Host mounted | rich setup lacks runnable setup snippet |
| menu-item | components | [source](../src/components/actions/menu-item.ts) | 1 | 2 | 2 | Host mounted | Structural evidence present; behavioral sign-off separate |
| segmented-control | components | [source](../src/components/actions/segmented-control.ts) | 1 | 2 | 3 | Host mounted | rich setup lacks runnable setup snippet |
| toolbar | components | [source](../src/components/actions/toolbar.ts) | 1 | 4 | 5 | Host mounted | Structural evidence present; behavioral sign-off separate |
| card | components | [source](../src/components/collections/card.ts) | 2 | 1 | 3 | Host mounted | only one documented state |
| carousel | components | [source](../src/components/collections/carousel.ts) | 1 | 1 | 4 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| datalist-item | components | [source](../src/components/collections/datalist-item.ts) | 1 | 2 | 7 | Host mounted | Structural evidence present; behavioral sign-off separate |
| draggable-list | components | [source](../src/components/collections/draggable-list.ts) | 1 | 1 | 3 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| grid-view | components | [source](../src/components/collections/grid-view.ts) | 1 | 1 | 5 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| pagination | components | [source](../src/components/collections/pagination.ts) | 1 | 2 | 3 | Host mounted | Structural evidence present; behavioral sign-off separate |
| table | components | [source](../src/components/collections/table.ts) | 1 | 5 | 14 | Host mounted | rich setup lacks runnable setup snippet |
| thumbnail-card | components | [source](../src/components/collections/thumbnail-card.ts) | 1 | 2 | 8 | Host mounted | Structural evidence present; behavioral sign-off separate |
| tree | components | [source](../src/components/collections/tree.ts) | 2 | 1 | 3 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| tree-grid | components | [source](../src/components/collections/tree-grid.ts) | 1 | 1 | 6 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| alert | components | [source](../src/components/feedback/alert.ts) | 2 | 5 | 5 | Host mounted | Structural evidence present; behavioral sign-off separate |
| badge | components | [source](../src/components/feedback/badge.ts) | 2 | 5 | 5 | Host mounted | Structural evidence present; behavioral sign-off separate |
| badgeable | components | [source](../src/components/feedback/badgeable.ts) | 1 | 2 | 5 | Host mounted | Structural evidence present; behavioral sign-off separate |
| chip | components | [source](../src/components/feedback/chip.ts) | 1 | 7 | 7 | Host mounted | Structural evidence present; behavioral sign-off separate |
| due-badge | components | [source](../src/components/feedback/due-badge.ts) | 2 | 2 | 6 | Host mounted | rich setup lacks runnable setup snippet |
| empty-state | components | [source](../src/components/feedback/empty-state.ts) | 1 | 2 | 3 | Host mounted | Structural evidence present; behavioral sign-off separate |
| error-mask | components | [source](../src/components/feedback/error-mask.ts) | 1 | 1 | 5 | Host mounted | only one documented state |
| help-text | components | [source](../src/components/feedback/help-text.ts) | 1 | 3 | 3 | Host mounted | Structural evidence present; behavioral sign-off separate |
| indicator | components | [source](../src/components/feedback/indicator.ts) | 1 | 3 | 4 | Host mounted | Structural evidence present; behavioral sign-off separate |
| nudge | components | [source](../src/components/feedback/nudge.ts) | 1 | 2 | 4 | Host mounted | Structural evidence present; behavioral sign-off separate |
| path | components | [source](../src/components/feedback/path.ts) | 1 | 5 | 6 | Host mounted | rich setup lacks runnable setup snippet |
| progress-bar | components | [source](../src/components/feedback/progress-bar.ts) | 2 | 3 | 2 | Host mounted | Structural evidence present; behavioral sign-off separate |
| progress-ring | components | [source](../src/components/feedback/progress-ring.ts) | 1 | 3 | 4 | Host mounted | Structural evidence present; behavioral sign-off separate |
| progress-steps | components | [source](../src/components/feedback/progress-steps.ts) | 1 | 2 | 5 | Host mounted | rich setup lacks runnable setup snippet |
| skeleton | components | [source](../src/components/feedback/skeleton.ts) | 2 | 5 | 9 | Host mounted | Structural evidence present; behavioral sign-off separate |
| spinner | components | [source](../src/components/feedback/spinner.ts) | 1 | 4 | 2 | Host mounted | Structural evidence present; behavioral sign-off separate |
| toast | components | [source](../src/components/feedback/toast.ts) | 1 | 6 | 9 | Host mounted | Structural evidence present; behavioral sign-off separate |
| drop-zone | components | [source](../src/components/files/drop-zone.ts) | 2 | 2 | 7 | Host mounted | Structural evidence present; behavioral sign-off separate |
| formatted-date | components | [source](../src/components/output/formatted-date.ts) | 1 | 4 | 7 | Host mounted | Structural evidence present; behavioral sign-off separate |
| formatted-duration | components | [source](../src/components/output/formatted-duration.ts) | 1 | 8 | 6 | Host mounted | Structural evidence present; behavioral sign-off separate |
| relative-time | components | [source](../src/components/output/relative-time.ts) | 2 | 4 | 5 | Host mounted | Structural evidence present; behavioral sign-off separate |
| formatted-number | components | [source](../src/components/output/formatted-number.ts) | 1 | 8 | 10 | Host mounted | Structural evidence present; behavioral sign-off separate |
| formatted-file-size | components | [source](../src/components/output/formatted-file-size.ts) | 1 | 4 | 6 | Host mounted | Structural evidence present; behavioral sign-off separate |
| code-block | components | [source](../src/components/output/code-block.ts) | 2 | 4 | 8 | Host mounted | Structural evidence present; behavioral sign-off separate |
| calendar | components | [source](../src/components/forms/calendar.ts) | 2 | 1 | 4 | Host mounted | only one documented state |
| category-selector | components | [source](../src/components/forms/category-selector.ts) | 1 | 2 | 4 | Host mounted | rich setup lacks runnable setup snippet |
| checkbox | components | [source](../src/components/forms/checkbox.ts) | 2 | 4 | 4 | Host mounted | Structural evidence present; behavioral sign-off separate |
| checkbox-group | components | [source](../src/components/forms/checkbox-group.ts) | 1 | 1 | 3 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| color-picker | components | [source](../src/components/forms/color-picker.ts) | 1 | 1 | 5 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| combobox | components | [source](../src/components/forms/combobox.ts) | 1 | 2 | 5 | Host mounted | rich setup lacks runnable setup snippet |
| date-field | components | [source](../src/components/forms/date-field.ts) | 1 | 3 | 6 | Host mounted | Structural evidence present; behavioral sign-off separate |
| dropdown | components | [source](../src/components/forms/dropdown.ts) | 1 | 1 | 5 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| dual-listbox | components | [source](../src/components/forms/dual-listbox.ts) | 1 | 1 | 3 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| multi-select | components | [source](../src/components/forms/multi-select.ts) | 1 | 1 | 3 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| number-input | components | [source](../src/components/forms/number-input.ts) | 1 | 2 | 5 | Host mounted | Structural evidence present; behavioral sign-off separate |
| radio-group | components | [source](../src/components/forms/radio-group.ts) | 1 | 2 | 3 | Host mounted | rich setup lacks runnable setup snippet |
| range-slider | components | [source](../src/components/forms/range-slider.ts) | 1 | 1 | 5 | Host mounted | only one documented state |
| rating | components | [source](../src/components/forms/rating.ts) | 1 | 2 | 4 | Host mounted | Structural evidence present; behavioral sign-off separate |
| fieldset | components | [source](../src/components/forms/fieldset.ts) | 1 | 1 | 4 | Host mounted | only one documented state |
| pill-cloud | components | [source](../src/components/forms/pill-cloud.ts) | 1 | 1 | 4 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| pill-selector-dropdown | components | [source](../src/components/forms/pill-selector-dropdown.ts) | 1 | 2 | 8 | Host mounted | rich setup lacks runnable setup snippet |
| rich-text-input | components | [source](../src/components/forms/rich-text-input.ts) | 1 | 1 | 5 | Host mounted | only one documented state |
| search-field | components | [source](../src/components/forms/search-field.ts) | 2 | 3 | 7 | Host mounted | Structural evidence present; behavioral sign-off separate |
| select | components | [source](../src/components/forms/select.ts) | 2 | 6 | 11 | Host mounted | rich setup lacks runnable setup snippet |
| slider | components | [source](../src/components/forms/slider.ts) | 1 | 2 | 5 | Host mounted | Structural evidence present; behavioral sign-off separate |
| spin-button | components | [source](../src/components/forms/spin-button.ts) | 1 | 1 | 4 | Host mounted | only one documented state |
| switch | components | [source](../src/components/forms/switch.ts) | 2 | 4 | 4 | Host mounted | Structural evidence present; behavioral sign-off separate |
| tag-input | components | [source](../src/components/forms/tag-input.ts) | 1 | 1 | 3 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| text-area | components | [source](../src/components/forms/text-area.ts) | 1 | 2 | 5 | Host mounted | Structural evidence present; behavioral sign-off separate |
| text-field | components | [source](../src/components/forms/text-field.ts) | 4 | 8 | 16 | Host mounted | Structural evidence present; behavioral sign-off separate |
| tile-group | components | [source](../src/components/forms/tile-group.ts) | 1 | 3 | 8 | Host mounted | Structural evidence present; behavioral sign-off separate |
| time-field | components | [source](../src/components/forms/time-field.ts) | 1 | 1 | 4 | Host mounted | only one documented state |
| avatar | components | [source](../src/components/identity/avatar.ts) | 2 | 4 | 6 | Host mounted | Structural evidence present; behavioral sign-off separate |
| contact-datalist-item | components | [source](../src/components/identity/contact-datalist-item.ts) | 2 | 3 | 6 | Host mounted | Structural evidence present; behavioral sign-off separate |
| persona | components | [source](../src/components/identity/persona.ts) | 1 | 2 | 4 | Host mounted | Structural evidence present; behavioral sign-off separate |
| app-shell | components | [source](../src/components/layout/app-shell.ts) | 1 | 1 | 7 | Host mounted | only one documented state |
| divider | components | [source](../src/components/layout/divider.ts) | 1 | 3 | 2 | Host mounted | Structural evidence present; behavioral sign-off separate |
| grid | components | [source](../src/components/layout/grid.ts) | 3 | 2 | 4 | Host mounted | Structural evidence present; behavioral sign-off separate |
| nav-sidebar | components | [source](../src/components/layout/nav-sidebar.ts) | 2 | 1 | 5 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| section | components | [source](../src/components/layout/section.ts) | 1 | 1 | 5 | Host mounted | only one documented state |
| sidebar-toggle-button | components | [source](../src/components/layout/sidebar-toggle-button.ts) | 1 | 1 | 6 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| split-view | components | [source](../src/components/layout/split-view.ts) | 1 | 1 | 9 | Host mounted | only one documented state |
| accordion | components | [source](../src/components/navigation/accordion.ts) | 2 | 2 | 5 | Host mounted | rich setup lacks runnable setup snippet |
| breadcrumb | components | [source](../src/components/navigation/breadcrumb.ts) | 1 | 2 | 4 | Host mounted | rich setup lacks runnable setup snippet |
| tabs | components | [source](../src/components/navigation/tabs.ts) | 1 | 2 | 5 | Host mounted | Structural evidence present; behavioral sign-off separate |
| command-palette | components | [source](../src/components/overlays/command-palette.ts) | 1 | 1 | 9 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| context-menu | components | [source](../src/components/overlays/context-menu.ts) | 1 | 1 | 4 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| dialog | components | [source](../src/components/overlays/dialog.ts) | 1 | 2 | 5 | Host mounted | Structural evidence present; behavioral sign-off separate |
| drawer | components | [source](../src/components/overlays/drawer.ts) | 1 | 2 | 10 | Host mounted | Structural evidence present; behavioral sign-off separate |
| guide-tooltip | components | [source](../src/components/overlays/guide-tooltip.ts) | 1 | 2 | 13 | Host mounted | workshop-only example |
| popover | components | [source](../src/components/overlays/popover.ts) | 1 | 2 | 5 | Host mounted | Structural evidence present; behavioral sign-off separate |
| shortcuts-overlay | components | [source](../src/components/overlays/shortcuts-overlay.ts) | 1 | 2 | 6 | Host mounted | rich setup lacks runnable setup snippet |
| tooltip | components | [source](../src/components/overlays/tooltip.ts) | 1 | 5 | 7 | Host mounted | Structural evidence present; behavioral sign-off separate |
| illustration | components | [source](../src/components/visuals/illustration.ts) | 1 | 2 | 3 | Host mounted | Structural evidence present; behavioral sign-off separate |
| content-explorer | patterns | [source](../src/patterns/content-explorer/content-explorer.ts) | 5 | 2 | 8 | Composed preview | rich setup lacks runnable setup snippet |
| explorer-breadcrumbs | patterns | [source](../src/patterns/content-explorer/adapters/breadcrumbs.ts) | 4 | 1 | 1 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| explorer-toolbar | patterns | [source](../src/patterns/content-explorer/adapters/toolbar.ts) | 3 | 1 | 1 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| explorer-list | patterns | [source](../src/patterns/content-explorer/adapters/list.ts) | 3 | 1 | 2 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| explorer-table | patterns | [source](../src/patterns/content-explorer/adapters/table.ts) | 4 | 1 | 2 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| explorer-items | patterns | [source](../src/patterns/content-explorer/adapters/items.ts) | 2 | 1 | 2 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| explorer-action-menu | patterns | [source](../src/patterns/content-explorer/adapters/action-menu.ts) | 4 | 1 | 2 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| content-picker | patterns | [source](../src/patterns/content-picker/content-picker.ts) | 1 | 1 | 10 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| content-uploader | patterns | [source](../src/patterns/content-uploader/content-uploader.ts) | 1 | 2 | 16 | Host mounted | rich setup lacks runnable setup snippet |
| content-sidebar | patterns | [source](../src/patterns/content-sidebar/content-sidebar.ts) | 1 | 1 | 11 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| form-wizard | patterns | [source](../src/patterns/form-wizard/form-wizard.ts) | 2 | 1 | 10 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| wizard-summary | patterns | [source](../src/patterns/form-wizard/wizard-summary.ts) | 1 | 2 | 8 | Host mounted | rich setup lacks runnable setup snippet |
| timeline | patterns | [source](../src/patterns/timeline/timeline.ts) | 3 | 1 | 8 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| diff-viewer | patterns | [source](../src/patterns/diff/diff-viewer.ts) | 1 | 1 | 9 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| compare-view | patterns | [source](../src/patterns/diff/compare-view.ts) | 1 | 2 | 8 | Host mounted | Structural evidence present; behavioral sign-off separate |
| work-queue | patterns | [source](../src/patterns/work-queue/work-queue.ts) | 2 | 1 | 10 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| workload-board | patterns | [source](../src/patterns/work-queue/workload-board.ts) | 1 | 1 | 10 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| version-list | patterns | [source](../src/patterns/versions/version-list.ts) | 1 | 1 | 9 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| version-graph | patterns | [source](../src/patterns/versions/version-graph.ts) | 2 | 1 | 6 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| lineage-graph | patterns | [source](../src/patterns/lineage/lineage-graph.ts) | 2 | 1 | 6 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| provenance-strip | patterns | [source](../src/patterns/lineage/provenance-strip.ts) | 1 | 1 | 3 | Host mounted | bare-tag workshop defaults; rich setup lacks runnable setup snippet; only one documented state |
| signature-ceremony | patterns | [source](../src/patterns/signature/signature-ceremony.ts) | 1 | 3 | 4 | Host mounted | rich setup lacks runnable setup snippet |
| run-trace | patterns | [source](../src/patterns/run/run-trace.ts) | 1 | 2 | 6 | Host mounted | rich setup lacks runnable setup snippet |
| agent-chat | patterns | [source](../src/patterns/agent-chat/agent-chat.ts) | 2 | 1 | 9 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| audit-log | patterns | [source](../src/patterns/audit/audit-log.ts) | 1 | 3 | 15 | Host mounted | rich setup lacks runnable setup snippet |
| activity-density | patterns | [source](../src/patterns/audit/activity-density.ts) | 1 | 1 | 7 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| notification-bell | patterns | [source](../src/patterns/notifications/notification-bell.ts) | 1 | 1 | 6 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| notification-inbox | patterns | [source](../src/patterns/notifications/notification-inbox.ts) | 1 | 2 | 11 | Host mounted | rich setup lacks runnable setup snippet |
| filter-bar | patterns | [source](../src/patterns/search/filter-bar.ts) | 2 | 1 | 10 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| search-results-header | patterns | [source](../src/patterns/search/search-results-header.ts) | 2 | 1 | 10 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| saved-view-picker | patterns | [source](../src/patterns/search/saved-view-picker.ts) | 2 | 1 | 4 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| item-form | patterns | [source](../src/patterns/item/item-form.ts) | 1 | 1 | 9 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| item-details-panel | patterns | [source](../src/patterns/item/item-details-panel.ts) | 1 | 1 | 8 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| bulk-action-bar | patterns | [source](../src/patterns/item/bulk-action-bar.ts) | 1 | 1 | 8 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| preview-header | patterns | [source](../src/patterns/item/preview-header.ts) | 1 | 1 | 7 | Host mounted | only one documented state |
| metadata-filter-builder | patterns | [source](../src/patterns/metadata/metadata-filter-builder.ts) | 2 | 1 | 6 | Host mounted | only one documented state |
| metadata-inspector | patterns | [source](../src/patterns/metadata/metadata-inspector.ts) | 2 | 1 | 5 | Host mounted | only one documented state |
| share-panel | patterns | [source](../src/patterns/share/share-panel.ts) | 3 | 1 | 6 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| permission-matrix | patterns | [source](../src/patterns/share/permission-matrix.ts) | 1 | 1 | 6 | Host mounted | only one documented state |
| access-stats | patterns | [source](../src/patterns/share/access-stats.ts) | 1 | 1 | 2 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| collaborator-avatars | patterns | [source](../src/patterns/share/collaborator-avatars.ts) | 1 | 1 | 5 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| presence | patterns | [source](../src/patterns/share/presence.ts) | 1 | 1 | 4 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| invite-collaborators-modal | patterns | [source](../src/patterns/share/invite-collaborators-modal.ts) | 1 | 1 | 8 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| unified-share-modal | patterns | [source](../src/patterns/share/unified-share-modal.ts) | 1 | 1 | 8 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| comment-thread | patterns | [source](../src/patterns/comments/comment-thread.ts) | 1 | 4 | 14 | Host mounted | Structural evidence present; behavioral sign-off separate |
| annotation-toolbar | patterns | [source](../src/patterns/preview/annotation-toolbar.ts) | 1 | 1 | 9 | Host mounted | only one documented state |
| annotation-inspector | patterns | [source](../src/patterns/preview/annotation-inspector.ts) | 1 | 1 | 6 | Host mounted | only one documented state |
| annotation-thread | patterns | [source](../src/patterns/preview/annotation-thread.ts) | 2 | 3 | 12 | Host mounted | Structural evidence present; behavioral sign-off separate |
| preview-element | patterns | [source](../src/patterns/preview/preview-element.ts) | 4 | 1 | 13 | Host mounted | only one documented state |
| file-request-builder | patterns | [source](../src/patterns/file-request/file-request-builder.ts) | 1 | 1 | 4 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| task-assignment-panel | patterns | [source](../src/patterns/task/task-assignment-panel.ts) | 1 | 1 | 12 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| review-queue-item | patterns | [source](../src/patterns/task/review-queue-item.ts) | 1 | 1 | 8 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| governance-panel | patterns | [source](../src/patterns/governance/governance-panel.ts) | 1 | 1 | 8 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| metric-card | patterns | [source](../src/patterns/insights/metric-card.ts) | 1 | 1 | 6 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| chart-panel | patterns | [source](../src/patterns/insights/chart-panel.ts) | 2 | 1 | 9 | Host mounted | only one documented state |
| bar-chart | patterns | [source](../src/patterns/insights/bar-chart.ts) | 1 | 1 | 9 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| line-chart | patterns | [source](../src/patterns/insights/line-chart.ts) | 1 | 1 | 9 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |
| donut-chart | patterns | [source](../src/patterns/insights/donut-chart.ts) | 1 | 1 | 8 | Host mounted | rich setup lacks runnable setup snippet; only one documented state |

## Completion gate for subsequent fixes

1. Realistic default content and copyable setup, with controller teardown.
2. Applicable empty/loading/success/error/disabled/selected states.
3. Observable selection/actions, cancellation and failure recovery.
4. Keyboard and focus behavior; visible words alongside status/color.
5. Light/dark and narrow/wide rendering with no page overflow.
6. Meaningful unit/functional tests and reviewed screenshots.
7. Separate simulated, live-provider and production-readiness claims.
