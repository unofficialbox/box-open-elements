# Open Issues 287-299

## Purpose

Resolve the thirteen open issues in unofficialbox/box-open-elements, verified
against GitHub on 2026-09-29. Work belongs in this repository, not its predecessor
box-open-web-components. Preserve SSR-safe registration, token-based styling,
host-owned document models and optional framework adapters.

## Progress

- [x] Inventory all thirteen issues and confirm a clean checkout.
- [x] #287: visible button focus, sentence-case labels and progress update order.
- [x] #288: separate glyph constants from the lazy registry and measure bundles.
- [x] #289: optional CodeMirror code editor with diagnostics and host completions.
- [x] #290: preserve segmented-control focus during controlled updates.
- [x] #291: synchronize shared form props in React wrappers.
- [x] #292: host-model process canvas, layout, editing, history and accessibility.
- [x] #293: keep field descriptions out of accessible names.
- [x] #294: model-selected catalog kinds for flow cards.
- [x] #295: ensure isolated flow-builder imports register its drawer.
- [x] #296: configurable sticky inspector sizing.
- [x] #297: number input fits narrow hosts.
- [x] #298: named regions instead of nested complementary landmarks.
- [x] #299: alert dismiss contrast in all tones and themes.
- [x] Focused regressions, full verification, bundle checks and browser validation.

## Discoveries

The checkout is version 0.23.0. Several requests are partially present: NumberInput
already exposes shared React field props, and flow-builder imports Drawer but
uses it only as a type, allowing TypeScript to erase the registration import.

Rendered checks found defects not apparent from DOM-only tests: CodeMirror's
theme specificity left light gutters in dark mode; receiver-dot completions
filtered against `.st` rather than `st`; and a comma-separated focus selector
painted every modeler toolbar button. Those were corrected and checked again.
Host-controlled layout echoes must not clear history, and accepted catalog drops
must restore document and layout together as one undoable operation.

## Decisions

Fix regressions before adding new surfaces. Do not close GitHub issues, publish,
or change downstream applications until the local implementation is verified.
CodeMirror must remain an optional import so existing component consumers do not
pay for an editor. Process edits must be requests the host may refuse.

The legacy color audit expected the weaker button focus treatment. Record the
two stronger focus claims as explicit, issue-linked accessibility exceptions,
not silent baseline changes. The strict audit still rejects missing anchors and
unexpected review claims; its conformant floor is 54 plus 10 accepted claims.

## Work Sequence

First update existing components, shared form support, React wrappers, flow model
and icon generator with focused tests. Then build the editor and modeler using
existing BaseElement, tokens, undo and accessibility contracts. Add owning docs,
exports and workshop examples. Run `bun run verify`, `bun run bundles:check` and
`bun run docs:typecheck`; inspect affected components in the local docs site.

## Acceptance

Each issue needs regression coverage and documentation where its API changes.
New surfaces must meet the complete issue contract rather than being labeled
complete because a minimal placeholder renders. Track any remaining gaps here.

## Recovery

Changes are isolated on codex/open-issues-287-299. Regenerate icon outputs from
the generator; do not manually patch generated registry data. Tests/builds are
repeatable. Preserve existing visual baselines unless browser evidence shows
the intentional change.

## Outcomes

All thirteen issues have local implementations and regression coverage on
`codex/open-issues-287-299`. No commits, publication, downstream dependency edits,
or GitHub issue closures were performed.

Verification on 2026-09-29:

- `bun run verify`: passed all typechecks, 254 test files / 2,282 tests, package
  builds, and React/Next SSR, Angular, Vue, Svelte and Svelte SSR examples.
  Coverage: 87.29% statements, 87.83% lines, 89.83% functions, 77.02% branches.
- Focused editor/modeler/flow-builder regression run: 28 tests passed.
- `bun run docs:typecheck`, `bun run bundles:check` and strict offline color
  conformance passed. Themed named-glyph fixture is about 27.7 KB, without the
  roughly 805 KB registry; the root does not import the optional code editor.
- Storybook workshop extraction regenerated both new component examples.
- Browser plugin was unavailable. Existing Playwright tooling and local Chrome
  checked editor completion, keyboard escape and diagnostics; modeler selection,
  movement, undo, connections and palette additions; field names and narrow
  number inputs; light/dark themes and 390px mobile layout. No page errors.
- `git diff --check` passed.

The docs site runs at `http://localhost:4600`, with the editor under Forms and
process modeler under Builders. Physical touch, Safari and a real screen-reader
session remain release follow-up checks, not claimed verified by DOM automation.
Review and commit this batch before closing the GitHub issues.

## Pull Request Verification

On 2026-09-30, PR #300 passed CI verification and strict conformance. The first
pixel gate reported 18 changed baselines. All diff images were reviewed: new
catalog entries shift navigation and related links, sentence-case progress and
metric labels alter text widths, and alert dismissal contrast becomes darker.
Only those 18 baselines were adopted from CI run 36706050758's fresh-captures
artifact, rendered in the gate's pinned Playwright container. Thresholds and
capture tooling were not changed. A second CI run must pass before merge.
