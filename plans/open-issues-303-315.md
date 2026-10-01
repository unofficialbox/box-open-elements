# Open issues 303-315

## Purpose / Big Picture

Make the 0.24 controls and editors safe for real host applications, then close
the integration gaps reported by Riptide Studio. The canonical checkout is
`/Users/massnerder/Developer/Code/box-open-elements`, not its predecessor demo.

## Progress

- [x] Read all 13 live issue bodies and verify the clean main checkout.
- [x] Accessibility/control batch: #303, #305, #306, #308, #310, #311, #312, #314.
- [x] Action/disclosure APIs: #313.
- [x] Real Vite and Rollup single-glyph splitting regression: #304.
- [x] Code editor host integrations: #307.
- [x] Process modeler host API improvements: #309 (host arrange hook, not a new default layout).
- [x] Prototype mechanics and host bridge: #315 (supersedes most of #309).
- [x] Focused tests, full verification, documentation for #303-#314.
- [x] Final Chrome browser recheck after restarting the bundled docs server.

## Surprises & Discoveries

The canonical repo has no PLANS.md, BACKLOG.md or local AGENTS.md. The supplied
predecessor plan format applies, but its demo commands do not: use `bun run docs`
and `bun run docs:typecheck`. Memory files are unavailable on this host.

Vite 8 uses Rolldown, so Vite alone cannot guard the reported Rollup regression.
The bundle fixture now runs both Vite and Rollup. The named-glyph consumer
retains one requested glyph and two existing immediate status glyphs, not the
472-icon registry. Glyph source assets are in the predecessor iconography folder.

Browser inspection found that display:grid overrides the palette's hidden
attribute; an explicit hidden rule is required. The docs server bundles modules
on startup, so restart it before validating rebuilt component CSS.

## Decision Log

- Decision: Keep #315 separate from #309's incremental fixes.
  Rationale: layered routing, port interactions, multi-selection, host projection
  events and responsive panes form a substantial feature, not a cosmetic fix.
  Date/Author: 2026-09-30 / Codex.
- Decision: Preserve existing defaults and optional editor subpath boundaries.
  Rationale: new public APIs must remain additive and SSR-safe.
  Date/Author: 2026-09-30 / Codex.

## Outcomes & Retrospective

Implemented #303-#315 locally on codex/open-issues-303-315. The final pass adds
left-to-right geometry, obstacle-aware routing, four-sided ports, directional
insertion, line/frame drops, marquee and group selection, alignment/spacing,
responsive panes, generic and host Checks, and the path/fingerprint/version
bridge. Riptide was read only as a reference; no files there were changed.
Publication is authorized and is the final step after verification and CI.

Latest broad verification: 258 test files, 2,375 tests passed. Typechecks, package
build, and framework/SSR fixtures passed. The previous complete run reported
88.04% statement coverage; geometry and bridge have dedicated high-coverage tests.
docs:typecheck passed. Offline strict color conformance passed: 53 conformant,
11 documented accepted divergences, zero missing or review-needed claims.
The CI floor changed only for the explicitly documented accessible control edge.
Bundle checks passed: named glyph 783 bytes with Bun, Vite entry 26,428 bytes,
Rollup entry 27,148 bytes. No visual baselines were accepted or replaced.

Chrome desktop and 390px checks passed for hidden-drawer recovery, preserved
selection, public focus, both-theme 3:1 control edges and 4.5:1 selected-card
text, code scroll focus, editor highlights/wrap, insert choices, hidden palette,
heading level, and component width. No page errors. Safari and human
screen-reader verification remain unperformed.

The final prototype browser pass also verified mouse and touch movement,
directional port creation, real Shift-click selection, functional alignment,
host Connections, desktop detail panes, mobile drawers and dismissal. A
touch-capture-transfer regression was fixed and covered by both browser and
component tests. Browser plugin was unavailable, so local Playwright/Chrome
was used against the separate docs server at localhost:4602.

## Context and Orientation

Controls live in src/components; BaseElement and form association in src/core.
Flow and process editors live under src/patterns. Glyph generation is owned by
tools/iconography/generate-box-iconography.ts; edit generator inputs, not output
alone. Tests mirror these paths. docs-site is the live demonstration surface.

## Plan of Work

First correct control behavior and add regressions. Then add independent
accordion state and text buttons. Fix glyph output and verify with Vite, not
only Bun. Extend the optional CodeMirror editor's host-owned APIs. Finally
implement modeler API and prototype interaction work with focused layout tests
and real browser checks. Update owning docs for every new public behavior.

## Concrete Steps

Run from the canonical repo: `bun run test -- <focused test paths>`, then
`bun run typecheck`, `bun run docs:typecheck`, `bun run bundles:check`,
`bun run verify`. Use `bun run docs` for browser checks. Server and adapter
typechecks are included in typecheck; predecessor demo commands do not exist.

## Validation and Acceptance

Keyboard focus reaches internal controls. Hidden builders never make the page
inert. Empty diagram history lets undo reach the host. Fields meet 3:1 and card
text 4.5:1 in both themes. Code regions are keyboard scrollable. Vite's entry
chunk excludes unused glyphs. New editor/accordion APIs have regression tests.
Modeler feature completion requires actual interaction proof, not just API
presence. Full verification must pass; report any remaining items explicitly.

## Prototype Implementation (#315)

1. Introduce the left-to-right layered layout and obstacle-aware orthogonal
   routing, preserving host positions and testing branching and nested frames.
2. Implement port dragging, directional click-to-connect choices, palette/drop
   insertion, frame reparenting, and draggable line segments with branch labels.
3. Add marquee/multi-selection, alignment guides, spacing controls and a floating
   selection toolbar with keyboard equivalents.
4. Build the left palette and right Outline/Checks/Variables/Connections/Shortcuts
   panes, including narrow-screen drawers and plain-language host checks.
5. Add load-path/fingerprint/version host APIs and projection/selection/path/
   connection events without transferring document ownership to the component.
6. Verify group aria-current semantics, named toolbars, 24px outline targets,
   keyboard-only editing, real browser interactions, and the full verify gate.

Geometry and bridge helpers have focused tests. Component tests cover loading,
cyclic host node references, controlled-selection echoes, stale selection,
multi-pointer safety, canceled host moves, frame descendants, directional
insertion, route adjustment, line/frame drops, and undo. Real Chrome exercises
port clicks and drags against the reversible host fixture, Shift-click selection,
alignment, desktop details, and narrow-screen drawer dismissal. No changes were
made to Riptide's prototype, bridge, repository state, or running app.

Review caught and fixed swallowed click events caused by early pointer capture,
unowned pointer gestures, serialization of opaque host nodes, and selection echo
loops. Panes reobserve their width after reconnection. Human screen-reader and
Safari validation remain separate follow-ups, not claimed automated coverage.

## Idempotence and Recovery

Repeat build/tests freely. Regenerate glyphs from their generator. Do not accept
visual baselines without inspecting the changes. Preserve unrelated edits.

## Artifacts and Notes

Issue source: https://github.com/unofficialbox/box-open-elements/issues (303-315).

## Interfaces and Dependencies

Preserve parts and current attributes. Add focus forwarding, FlowBuilder narrow
state/focusNode, accessible control-edge styling, and editor host APIs without
pulling CodeMirror into the root runtime. Host documents remain authoritative.
