# Process Modeler and Code Editor reconciliation — 2026-10-09

Compared library `f7f8c5d` plus this branch with Riptide `dd4e3b7` and the
reference `ui/studio/public/modeler/index.html`. The 1440px and 390px light
views used the same “Upload round trip” example. Unit coverage and focused
browser checks supplement, but do not replace, Riptide's four-view acceptance.

| Issue | Library state and exact difference from the reference | Remaining acceptance |
| --- | --- | --- |
| #322 Canvas, boxes, layout | 248/320 panes, 224px steps, 56px gateways, frame layout, 25–200% zoom, 208×136 minimap, guides and Tidy are implemented. The canvas dots were darker than the reference (`stroke-hover` solid versus 26% secondary text); this branch matches the reference mix. | Confirm authored layout and drag behavior side by side in dark and light at both widths, with the host's saved process. |
| #323 Lines and ports | Orthogonal routes, labels, ports, line insert, segment adjustment, endpoint reattachment and reset have component tests. | Riptide must accept connect/insert/reattach requests through its workflow bridge and compare pointer behavior to the reference. |
| #324 Building-block list | Grouped catalog, aliases, drag ghost, line/frame drop and focused mobile chooser exist. | Riptide must supply its exact catalog, glyphs and edit mapping; check all groups and three add paths in the host. |
| #325 Details panel | 320px panel, five tabs, grouped action picker, expression fields, variable chips, connections and last-run table exist. Specific Box actions and expression validation remain host-provided descriptors. | Verify each Riptide kind's field mapping and its controlled edit response, not just the generic fixture. |
| #326 Read-back, Checks, hold | `model.validate` gates readable versions, last-readable is retained, and hold/Checks link to problems. Empty Checks previously said “No checks to resolve”; this branch says the reference's “Ready to run.” | Riptide must provide `readWorkflow`/problem conversion and keep its last valid envelope while a graph is held. |
| #327 Views and last run | Business/technical descriptions, run metrics and traffic-share strokes exist. | Riptide must provide run label, per-step numbers and line shares and verify the view/menu behavior. |
| #328 Selection and arranging | Floating toolbar, line actions, Shift-click/marquee, copy/paste/duplicate, align/distribute and section creation have component tests. | Run all actions with Riptide's accepted edit/undo callbacks on a branching process. |
| #329 Keyboard and a11y | Box groups, `aria-current`, line names, skip link, keyboard moves, 24px targets and reduced motion exist. This branch closes View on Escape, avoids a false “Connecting cancelled” announcement, and gives problem messages a persistent assertive live region. | Run four-view axe and keyboard/screen-reader acceptance in the actual Riptide host. |
| #330 Narrow screens | Palette and details use named mobile drawers, View menu, hidden minimap and pinch/one-finger canvas behavior. This branch puts Add first and hides undo/redo buttons at phone width. The standalone component's bar is not Riptide's host bar (title, Steps/Diagram/Code, Save), so screenshots still differ above the canvas. | Replace the iframe with the component in Riptide, compose the host bar, and exercise Add/Details/keyboard at 390px. |
| #331 Host API | Path/fingerprint positions, readable/raw versions, selection without echo, connections, last run, embed mode and readback snapshot exist. | Riptide still embeds `/modeler/index.html?embed`; wire this API and verify persistence/versioning with real workflows. |
| #321 Umbrella | The library implementation is substantial, but the issue's “done” rule is side-by-side parity and Riptide adoption. | Close only after #322–331 pass the same-process matrix and Riptide removes the iframe. |
| #346 Code Editor older gaps | Border/none current line, hanging wrap, hidden component chrome and fill-height are in 0.28.2. | Riptide still imports local `ui/studio/src/code/editor.ts`; keep open until its Code view uses the library. |
| #374 Code Editor new gaps | This branch adds opt-in parsed bracket-depth colors/unmatched state, theme hooks, tabular line numbers and `pass-keys`. Strings/comments are skipped; a 270k-character local browser sample updated in 31ms. | Release, then Riptide migrates its Code view and checks both themes, shortcut routing and accessibility. |

## Reference checks performed

- At 1440px light, the library's palette/canvas/inspector proportions and the
  same process's card/frame positions closely follow the reference. The
  reference includes host-only title, view tabs, Save and ready state; the
  standalone component intentionally does not own those.
- At 390px light and dark, both hide side panes/minimap and present the same
  first two frames at 55% zoom. The reference's host header is 129px tall; the
  standalone component's toolbar is 56px, so the canvas begins higher until
  embedded in a host composition. The fixture's initial mobile pan is aligned
  to the reference's first-frame canvas offset.
- The Code Editor was browser-checked at 1440px light and 390px dark. Parsed
  bracket classes originally did not color the nested syntax spans; this
  branch corrects the rendered text colors. Both checks had no page errors;
  the workshop now avoids page overflow at 390px.
- A browser axe-core WCAG 2/2.1 A/AA scan found zero violations on the Code
  Editor and Process Modeler at 1440px light and 390px dark. The mobile
  Modeler Add drawer opened with search focused; Escape closed View, and
  empty Checks showed “Ready to run.” These component scans do not establish
  accessibility of Riptide's future host composition.

## Close-out rule

Do not close #321–331, #346 or #374 solely because APIs and unit tests exist.
The issue bodies require Riptide adoption and side-by-side behavior. Riptide's
current main still renders the Diagram iframe and imports its local CodeMirror
editor. That consumer work is Riptide-owned; the library release is a
prerequisite, not proof of completion.
