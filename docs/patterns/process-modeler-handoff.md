# Process Modeler handoff — 2026-10-09

## Closeout branch update

- Kyle approved matching the pinned Riptide reference for line/port dragging
  and connection behavior. This supersedes the earlier hold recorded below.
  All changes remain in Box Open Elements; Riptide source is untouched.
- Selection actions now distinguish **Add next** from **If it fails**, include
  the reference's plus affordance, and omit invalid Start/End actions.
- A port dragged to empty canvas opens an anchored chooser at the drop position; choosing
  a kind emits one host-owned connected `add` request. Clicking the east port,
  or **Add next**, requests `insert` when exactly one successor exists. Cancel
  remains edit-free. Focused interaction tests cover these paths.
- An accepted new-step insert on a simple horizontal root connection makes
  room between source and target, shifts later root columns, and records the
  layout with the edit for undo/redo. Nested/branched insertions still need
  explicit same-process verification before changing their placement.
- A geometry regression test confirms a clear, equal-height row routes as one
  straight segment between centered ports. The older 0.26 report of elbows is
  not sufficient to claim a current routing defect; compare its exact fixture.
- The docs preview reproduced #322's Tidy regression: the opening 70% view
  dropped to 25%. Tidy now applies the pinned design's readable floor (70%
  desktop, 55% narrow) while the explicit Fit command can still show the
  entire process at 25%.
- This is library-side progress, not proof that #321–331 are done. The same-
  workflow four-view comparison and Riptide adoption are still outstanding.
  Manual screen-reader tasks are deferred by Kyle's direction; do not silently
  treat that deferral as a passed screen-reader check.

## 2026-10-10 canvas layout follow-up

- The docs preview exposed a regression in the separate hold row: with the
  hold hidden, CSS grid auto-placed the canvas in its zero-height first row.
  The modeler had a full-height layout and populated graph, but no visible
  canvas. Explicit row placement now reserves row 1 for the hold and row 2 for
  the flexible canvas.
- The docs browser-capture gate checks canvas height restoration at desktop
  and a 340px host width, in light and dark, through valid → held → valid
  transitions, plus hold/canvas adjacency. This is a Box Open Elements repair,
  not Riptide adoption proof;
  #326 and the host acceptance work remain open.

## Current state

- Box Open Elements `0.28.7` is the library baseline for this branch; its Code Editor was adopted in Riptide
  through merged [Riptide PR #274](https://github.com/unofficialbox/box-riptide/pull/274).
  That work does **not** complete the Process Modeler.
- The library has a substantial `box-process-modeler` implementation and a
  documented host-neutral projection, validation, layout, edit-request, and
  selection API. See [the contract](process-modeler.md),
  [the rebuild plan](../../plans/process-modeler-design-rebuild.md), and
  [the latest reconciliation](../audits/modeler-code-editor-2026-10-09.md).
- Riptide still serves its reference Diagram in an iframe at
  `ui/studio/public/modeler/index.html?embed` from `DiagramView.tsx`. It has
  **not** migrated to the library component. Riptide owns workflow conversion,
  persistence, save policy, and the decision to adopt.
- [Umbrella #321](https://github.com/unofficialbox/box-open-elements/issues/321)
  and #322–331 remain open. Their completion rule is side-by-side visual and
  behavioral parity with the Riptide Diagram on the same process at 1440px and
  390px, in light and dark, followed by host adoption. Unit tests and a library
  release alone are insufficient. Do not close them early.

## Issue-by-issue handoff

| Issue | Library surface already present | Proof still required |
| --- | --- | --- |
| #322 Canvas, boxes, layout | Reference-sized shapes, 16px grid, pan/zoom, minimap, Tidy, guides, frames. This branch scales and offsets the visible dot grid with zoom/pan, including four-cell spacing below 50% zoom. | Same-process visual and drag/layout comparison in four views; saved-position round trip |
| #323 Lines and ports | Orthogonal routes, labels, connect/insert/reattach, hand routing | Host accepts every request; pointer and keyboard route comparison |
| #324 Building-block list | Grouped searchable catalog, drag ghost, line/frame insert, mobile drawer. This branch restores the visible desktop "Add to the process" heading without duplicating its mobile drawer title. | Host catalog, icons, aliases, and all three add paths |
| #325 Details panel | Tabs, controlled fields, actions, expressions, connections, run metrics. This branch restores the process/selection heading in `embed-mode` to match the reference inspector. | Every Riptide kind and field mapped, validated, and read back |
| #326 Read-back, Checks, hold | Host validation gate, Checks and hold banner. PR #385 detaches the last-readable graph and emits a readable event for every new document version, even when visible labels are unchanged. The follow-up branch places the hold in its own row above the canvas so it cannot cover repair targets. | Host conversion and last-valid-envelope behavior on invalid graphs |
| #327 Views and last run | Business/technical display and optional metrics. This branch matches the pinned toolbar's visual Last run switch, Checks status, and Undo/Redo/Tidy order. | Real run label, step numbers, line shares, and responsive View behavior |
| #328 Selection and arranging | Toolbar, multi-select, copy/duplicate, align/distribute. This branch makes "Tidy these" arrange the selected graph, including selected frames, rather than merely distributing boxes horizontally. | Accepted host edits, undo/redo, and branching-process interaction |
| #329 Keyboard and accessibility | Focusable boxes, named lines, shortcuts, announcements, reduced motion. This branch makes N open a contextual non-modal chooser beside the selected box, with search focus, insertion-on-line semantics, and focus return on Escape. | Four-view axe, keyboard, screen-reader, contrast, and focus acceptance in Riptide; compare other chooser entry points |
| #330 Narrow screens | Named palette/details drawers, touch pan/zoom, compact bar. This branch keeps the duplicate View menu hidden in embedded phone layouts and bounds both drawers and their scrim to the component instead of the page viewport. | Host composition at 390px, drawer inertness and focus, no clipping |
| #331 Host API | Path/fingerprint positions, raw/readable versions, connections and embed mode. Host-controlled `selectedPath` no longer echoes `selection-changed`, and an unloaded component no longer emits an empty readable workflow. | Host bridge and persistence acceptance; no duplicate events in the real integration |

## Next execution sequence

1. Finish a Box-only, interaction-by-interaction comparison against the
   [pinned Diagram source](https://github.com/unofficialbox/box-riptide/blob/8cbbe799569b75fe346abac81dfad7628ede824d/ui/studio/public/modeler/index.html).
   Use the same workflow and actions at 1440/390 in light/dark; record each
   remaining defect. Passing unit or screenshot tests does not establish parity.
2. Fix confirmed library defects with interaction tests and rendered checks.
   Kyle has approved matching the pinned Riptide reference for canvas drags
   and lines. Do not use a different Diagram design as a shortcut.
3. Once the Box-side defect list is empty, report parity to the Riptide owner.
   Riptide will check it on a throwaway branch against the #331 bridge
   contract. Kyle decides whether to adopt. Riptide owns the title, Save,
   Steps/Diagram/Code switch, catalog content, workflow conversion, and
   persistence; no Riptide source is changed in this branch.
4. Close #331 and then #321 only after host adoption and same-workflow
   acceptance. Human screen-reader tasks are deferred for now, not passed.

## Owner update and current defect ledger

[Riptide's 2026-10-09 owner comment](https://github.com/unofficialbox/box-open-elements/issues/321#issuecomment-6087070433)
supersedes the earlier assumption that host adoption should start immediately.
Riptide main uses 0.28.4 and has adopted `box-code-editor`; its Diagram remains
the pinned reference until library parity is reported and accepted. Older
issue comments comparing **0.26.0** are leads, not proof of current defects.

The following are confirmed by inspecting the current Box source against the
pinned source. They still need same-process rendered reproduction before a
parity claim. This is **not** the complete interaction-by-interaction audit.

| Issue | Current Box behavior / exact remaining gap | Next action |
| --- | --- | --- |
| #329 Chooser | N, port clicks, empty-canvas drops, Add next, directional keyboard add, If it fails, line insert buttons, and selected-line toolbar actions use an anchored non-modal chooser with contextual titles. The line chooser anchors at the route midpoint and returns focus on Escape. Eastward keyboard add inserts on a sole outgoing line. A rendered #404 review found unlabelled connection midpoints were zero-sized and could not reveal pointer actions; they now retain a 24px screen-space hit area while zoomed. | Compare placement and focus for every entry point with the pinned source; the old modal remains only as a fallback when popovers are unavailable. |
| #330 Narrow drawers | Before this branch, Box used viewport-fixed modal dialogs; a 390px docs reproduction placed the palette at page y=0 while its component began at y=744. The branch now uses component-relative drawers and a local scrim; a 342×600 simulated embed placed both palette and scrim exactly between host y=120–720, with details y=348–720. Light/dark preview checks exercised internal scrolling, inert closed content, Escape, and focus return. The user manually tested narrow screens and accepted the library behavior. | Validate the same behavior with real Riptide host chrome and assistive technology; the library preview and manual narrow-screen acceptance alone cannot close #330. |
| #327 Last run and toolbar | Before this branch, Box rendered the Last run checkbox without switch styling, omitted the toolbar Checks state, and placed Tidy before Undo/Redo. The pinned design renders a visual switch, Checks status, then Undo/Redo/Tidy. | Repaired in this branch. Retest switch appearance and status in all four rendered views, including a finished-run fixture; metrics and line shares remain unproved. |
| #322 Event captions | Box CSS renders an event's secondary description below Start/Finish (`[data-shape=event] > small`). The old 0.26 comparison reported a collision, but the pinned source conditionally renders Start's purpose below its caption too. This is **not yet a confirmed parity defect**. | Compare the same Start data and viewport side by side before changing visibility, spacing, or accessible detail. |
| #323 Canvas drags and lines | Empty-canvas port drops now open a connected-step chooser. Accepted simple horizontal root-row inserts now make room atomically. Clear equal-height rows route straight in a regression test; the older elbow report needs exact-fixture reproduction. | Retest insertion and routing in the browser; reproduce more complex insertions on the current build and fix confirmed defects. |
| #326 Hold placement | Reproduced the absolute banner inside the canvas: at 390px its warning card was 205.5px tall and could intercept canvas hit targets. The follow-up branch moves it to a row above the canvas, preserving total component height; at 390px the row is 96px and the canvas begins at its bottom edge. | Retest in light/dark and verify host read-back behavior; do not close before Riptide acceptance. |

Already-repaired items must be retested, not reimplemented from old comments:
the grid follows pan/zoom, Checks has a “Ready to run” empty state, the
selection toolbar can appear above the selection, mobile palette has a title
and close affordance, and the live status is visually hidden. The complete
same-process matrix remains open for every #322–331 issue, including kinds,
read-back, positions, line insertion, run numbers, keyboard, axe, and mobile.

## Evidence from this branch

- Compared the same “Upload round trip” fixture and Riptide reference in
  Chromium at 1440×900 and 390×900 in light mode, then verified the repaired
  library embed at both widths in light and dark. The library's 248px palette,
  320px inspector, first-frame positions, and zoom are close to the reference;
  the Riptide-specific header and Steps/Diagram/Code tabs are not part of the
  library component. Do not treat those host-chrome differences as library bugs.
- The reference retains its inspector title in embed mode. The library hid it;
  the CSS now retains it, including in the mobile Details drawer. On a 390px
  embed, the library View menu also reappeared due to a later narrow-screen CSS
  rule; it now stays hidden so the host owns View exactly once. Browser checks
  confirmed visible heading, hidden duplicate View/last-run controls, visible
  bottom canvas controls, Details open/close with Escape, no horizontal overflow,
  and no page errors. Four-view axe-core WCAG 2/2.1 A/AA scans reported zero
  violations on the library component. These scans do not cover the future
  Riptide host composition or a human screen-reader pass.
- The reference's dots are drawn at `16 × zoom` screen pixels and offset by
  canvas pan; below 50% zoom it draws every fourth point. The library used a
  fixed 12px background, visibly too sparse at 55% phone zoom and unrelated
  to pan. The library now follows the reference formula. Browser checks found
  11.2px at 70%, 8.8px at 55%, and 25.6px at 40%, with the pan offset applied.
- The browser comparison uses `--boe-process-height: calc(100dvh - 56px)` for a
  full-viewport component. Setting this to `100vh` while also rendering the
  56px component toolbar puts the bottom controls below the viewport; that is
  host sizing, not missing controls. Riptide must subtract its own host chrome
  from the available component height when it adopts the modeler.
- The four focused Process Modeler test files pass (123 tests). The final
  `bun run verify` passed 261 test files, 2444 tests, 88.61% statement coverage,
  typecheck,
  core/adapters build, and React, Angular, Vue, and Svelte framework/SSR
  validation. Vite emitted only existing large-chunk advisory warnings for the
  Angular/Vue/Svelte examples.
- Two "Tidy these" tests exercise flow-order layout, untouched neighbors,
  selected frame descendants, and undo.
- Library-only API tests cover silent host selection, no unloaded empty event,
  new readable document versions with unchanged labels, and last-readable
  snapshot isolation. The pinned visual regression passed 14/14 gallery and
  68/68 docs baselines. BUE geometry conformance found 0 drift. The visual
  baseline set does not contain a Process Modeler page, so the standalone
  1440px/390px light/dark Chromium screenshots and interaction checks are
  separate evidence, not a claim of pixel-baseline coverage.
- The rendered Box-only check at 1440×900 and 390×900 verified a nonblank page,
  no overlay or console errors, no page overflow, box selection and inspector
  title, and the phone palette opening and closing with Escape. Browser plugin
  was unavailable, so this used Playwright. It did not verify a real host or
  perform a human screen-reader pass.
- After the Riptide owner update, a focused toolbar test passed (49/49 in its
  file). A rendered Box-only check at 1440×900 and 390×900 confirmed the
  desktop visual switch size (32×18px), Checks opening its tab, the reference
  Checks/Undo/Redo/Tidy order, mobile Last run through View, no horizontal
  overflow, and no page or console errors. The pinned pixel suite passed
  14/14 gallery and 68/68 docs baselines; those baselines still do not include
  the Process Modeler. BUE conformance reported 0 drift.
- A further focused keyboard-chooser run passed (51/51 in its file). In
  Chromium at 1440×900 and 390×900, N opened the non-modal popover beside
  “Sign in to Box,” named “Insert between Sign in to Box and Upload a file,”
  focused search, fit within the viewport, and returned focus to the selected
  step on Escape. Filtering for “web request” and picking it emitted an
  `insert` request on `sign-in-upload`; no page errors or overflow occurred.
  The same chooser opened in dark mode at both widths, used the dark surface
  token, kept search focused, and stayed within the viewport.
  This validates the N path only, not port-click or drag/line chooser parity.
- A 390px docs reproduction showed the old palette at page y=0 while the
  component began at y=744. After the contained-drawer change, a 342×600
  simulated embed at x=24/y=120 rendered palette and scrim from y=120–720,
  and details from y=348–720, in both light and dark. The palette scrolled
  internally (1634px content in a 600px pane). Search focused on open;
  Escape closed, made the pane inert, hid the scrim, and returned focus to
  Add. Scrim click closed Details. Desktop palette and inspector stayed
  visible. These are library preview checks, not Riptide host acceptance.
- After the contained-drawer change, the strict pixel suite passed 14/14
  gallery and 68/68 docs baselines. BUE conformance reported 0 drift, and
  `git diff --check` found no whitespace errors. These baselines still do not
  include a Process Modeler fixture.
- After #385 merged, the #326 follow-up moved the hold banner out of the
  canvas. In a 390px Chromium preview its bottom and the canvas top were both
  y=151.5; at 1440px they were both y=104.7. A step remained clickable while
  validation held, and no page errors occurred. The focused interaction suite
  passed 52 tests. Full `bun run verify` passed 261 files and 2444 tests with
  88.62% statement coverage; pinned pixel baselines passed 14/14 gallery and
  68/68 docs, and BUE conformance reported 0 drift. The pixel baselines do not
  include the Process Modeler. This is library preview evidence, not host
  read-back proof.

## Safety and provenance

The primary library checkout has unrelated uncommitted Process Modeler changes
on `codex/safari-modeler-focus`; leave them untouched. This handoff was begun
from current `origin/main` in a separate worktree. The reference and acceptance
details are in the linked issue bodies, not inferred from a passing build.
No Riptide source was changed in this branch.
