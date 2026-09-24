# Studio library completion

Scope: issues #255 and #257–266. Implement on `codex/studio-library-completion`.
Merged code, verified code, and published packages are separate milestones.

## Acceptance tracker

| Batch | Issue | Acceptance | Status |
| --- | --- | --- | --- |
| 1 | #255 | Sentence-case NumberInput label and shared hidden-label/required/help-text contract | Implemented and tested |
| 1 | #257 | SSR-safe persistent polite/assertive announcer; repeated messages; cleanup | Implemented and tested |
| 1 | #259 | Error announcement, theme-aware alert, no duplicate announcement | Implemented and tested |
| 1 | #260 | Remaining-duration pause on pointer/focus; dismiss source; persistent announcement | Implemented and tested |
| 1 | #261 | Shrinkable card header/body; narrow viewport wide-content proof | Implemented and browser-tested |
| 2 | #258 | Generated individual icon exports and measured tree-shaking proof | Implemented and measured |
| 2 | #262 | React wrapper subpaths; side-effect contract; bundle proof | Implemented and measured |
| 2 | #263 | NumberInput, Checkbox, Tabs, Card, Alert, Toast, Drawer, CodeBlock wrappers with typed refs/events | Implemented and tested |
| 3 | #264 | Accessible flow primitives/composition, insertion, branches, inspector, validation mapping | Implemented and browser-tested |
| 3 | #265 | Identity-preserving removal/restore; undo toast, shortcut, pause, announcement | Implemented and tested |
| 3 | #266 | Builder/editor principles, anti-patterns, checklist and examples | Implemented |

## Execution and verification

1. Repair existing contracts; add focused regression tests and rendered desktop/mobile checks.
2. Add packaging surfaces and wrappers; verify SSR, controlled/uncontrolled behavior and production bundles.
3. Add framework-free patterns and docs with keyboard/mobile functional coverage.
4. Run full repository verification, docs checks/build, and visual/conformance gates.
5. Coordinate core and all four adapter versions. Publish only verified merged release contents;
   confirm all five registry versions before claiming delivery to consumers.

## Evidence

- Starting point: main commit `6d652c54a3095882e7fee3152e69bb497e1c30cf`, containing PR #256.
- Published baseline: 0.20.0. No release from this work has been published.
- Source and four public adapters are prepared at 0.21.0; `bun.lock` and the installed registry copy remain at 0.20.0 until publication.
- Focused tests: 53 component/a11y, 32 React, 10 flow/undo, and 4 additional Toast lifecycle checks passed.
- Final full verification: 2,241 tests across 251 files passed, 86.87% statement coverage, all four adapter typechecks/builds, React/Angular/Vue/Svelte integration builds, React and Svelte SSR passed.
- Bundle proof: one generated glyph 783 B (480 B gzip), dynamic registry 802,501 B (231,814 B gzip); root and direct React Button bundles both 11,848 B. Core root and subpath registrations survive.
- Browser proof: docs flow insertion, keyboard End/Home, selection, name edit with focus retained, mobile bottom sheet, validation, remove/Undo and 390px no-page-overflow passed in light/dark; named SVG glyphs render. A wide table remains scrollable inside a 320px card without causing page overflow.
- Visual review: the new Flow Builder baseline and 20 existing docs baselines were refreshed for intentional sidebar scroll position, icon inventory order, and Toast guidance changes. Pinned pixel comparison passed: 14/14 gallery and 63/63 docs-site baselines healthy.
- Docs typecheck/build and production bundle check passed. Strict BUE geometry, webapp, and offline colour conformance passed with no new review items.
- Release and consumer registry proof remain pending until a merged PR and publish workflows succeed.
