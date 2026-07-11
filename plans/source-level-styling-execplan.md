# Source-Level Box Styling ExecPlan

## Purpose / Big Picture

After this change, every component and explorer adapter in the catalog carries the Box design language in its own shadow-root styles — token-driven (`--boe-token-*` with safe fallbacks), matching the vocabulary the styled compositions already use. The predecessor repo left 41 primitives structurally unopinionated and put the Box look in its demo shell CSS; its own backlog flagged "source-level tokenization" as unfinished. This repo closes that gap: components look Box-branded everywhere they're embedded, not just inside a styled shell.

## Progress

- [x] Identify the unstyled surface: 34 components + 5 explorer adapters (16 components already styled)
- [x] Style forms batch (16)
- [x] Style actions + pagination batch (8, including upgrading `box-button` to the full language)
- [x] Style feedback + app-shell batch (11)
- [x] Style explorer adapters batch (5)
- [x] `bun run verify` green (styling must not break structural test assertions)
- [x] Recapture the screenshot gallery and review
- [x] Docs updates (api-guidelines styling note, backlog), push, PR

## Surprises & Discoveries

- The reference repo's styling split was cleaner than the screenshots suggested: all 23 composites and ~20 primitives shipped shadow styles; the plain look was concentrated in the older Phase 1 controls and the explorer adapters.
- `box-explorer-items` extends `BoxExplorerListElement` and inherits its template, so styling the list covered items for free.

## Decision Log

- Decision: Per-component shadow `<style>` blocks (the existing in-repo convention), not a shared constructable stylesheet module.
  Rationale: Matches how the 16 already-styled components work; no new coupling; components stay self-contained and framework-free.
  Date/Author: 2026-07-11 / Claude

- Decision: Styling-only change — no DOM structure, parts, attributes, events, or behavior changes; all existing tests must pass unmodified.
  Rationale: Keeps the diff reviewable and the port fidelity guarantees intact.
  Date/Author: 2026-07-11 / Claude

- Decision: Tokens with hardcoded Box fallbacks (e.g. `var(--boe-token-surface-surface-brand, #0061d5)`).
  Rationale: Components render Box-branded with no design system registered, and restyle automatically when a custom bundle is active — same contract as `docs/foundations/tokens.md`.
  Date/Author: 2026-07-11 / Claude

## Outcomes & Retrospective

Shipped: all 34 previously-unstyled components, 4 explorer adapters (`items` inherits the list's template), and the composed `box-content-explorer` element now carry token-driven Box styling. Zero test modifications; `bun run verify` green (262 tests). Gallery recaptured — forms, actions, feedback, and both explorer sections now render the Box design language.

Known native-widget limits (documented by the styling pass): `combobox`'s `<datalist>` popup, native `select`/date/time picker popups, and bare `<input type="range">` tracks can only take `accent-color`/closed-control styling — full custom treatments would require structural changes, deferred to a future component-upgrade pass.

Lesson: the plain look was concentrated in the oldest Phase 1 controls; newer reference components already carried styles. Checking `grep -L '<style>'` beats assuming.

## Context and Orientation

- Style vocabulary references: `src/patterns/share/share-panel.ts`, `src/components/forms/radio-group.ts`, `src/patterns/content-explorer/adapters/action-menu.ts`, `src/components/overlays/dialog.ts`.
- Screenshot harness: `bun run preview:capture` → `docs/screenshots/gallery/*.png`.

## Plan of Work / Concrete Steps / Validation and Acceptance

Four parallel styling batches (forms; actions+pagination; feedback+app-shell; explorer adapters), each verified by its category tests, then `bun run verify` and a full gallery recapture. Acceptance: verify green with zero test modifications, and the gallery screenshots show the Box design language across all sections.

## Idempotence and Recovery

Styling edits are per-file and additive; re-styling a file replaces its `<style>` block only.

## Interfaces and Dependencies

- Token names/fallbacks per `src/foundations/tokens/box-defaults.ts`.
- Styling hooks (`part` attributes) unchanged — consumers' `::part()` overrides keep working.
