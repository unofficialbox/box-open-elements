# ExecPlan: `box-nav-sidebar` + `box-sidebar-toggle-button`

## Purpose / Big Picture

After this change the catalog ships a collapsible navigation rail for the
explorer/workspace shell and a disclosure control that expands and collapses it.
Before, `app-shell` had a static `nav` slot with no first-class collapse
behavior and no reusable toggle. Now a host can compose:

```html
<box-nav-sidebar label="Workspace" id="primary-sidebar">
  <box-sidebar-toggle-button slot="header" controls="primary-sidebar"></box-sidebar-toggle-button>
  <a href="#">All Files</a>
  ...
</box-nav-sidebar>
```

and wire the button's `toggle` event to the sidebar's `collapsed` property to get
an expand/collapse rail with correct ARIA.

See it working: `bun run test` (the two new layout test files), and in the docs
site (`bun run docs`) under **Components → Layout → Nav Sidebar**, whose live
example wires the toggle to the sidebar.

## Progress

- [x] `box-nav-sidebar` component (`src/components/layout/nav-sidebar.ts`)
- [x] `box-sidebar-toggle-button` component (`src/components/layout/sidebar-toggle-button.ts`)
- [x] Barrel exports in `src/index.ts` (Layout section)
- [x] Tests: `test/components/layout/nav-sidebar.test.ts`, `test/components/layout/sidebar-toggle-button.test.ts`
- [x] Docs catalog (`docs/components/catalog.md`) + roadmap (`docs/roadmap.md`) updated
- [x] Docs-site registry (`docs-site/registry.ts`) + example (`docs-site/examples.ts`)
- [x] `bun run verify` green, PR opened

## Surprises & Discoveries

- The repo's own gap analysis (`docs/research/upstream-gaps.md`) classifies
  `nav-sidebar`/`sidebar-toggle-button` as **layout tier** (same as `app-shell`
  and `split-view`), even though the sidebar renders a `<nav>`. Placed both in
  `src/components/layout/` and the catalog's Layout section to match that intent.
- No prescriptive ARIA/keyboard spec exists for a nav sidebar in the repo. Used
  in-repo exemplars: `app-shell.ts` (slot structure, `<nav aria-label>`) and
  `chip.ts` (focus restoration across re-render, event dispatch).
- The reference repo `box-open-web-components` is not available in this working
  environment, so the roadmap's "re-verify against upstream behavior" step was
  satisfied by following established in-repo conventions and standard disclosure
  (`aria-expanded`/`aria-controls`) + landmark (`<nav aria-label>`) patterns
  rather than a line-by-line upstream port. These are net-new components, not
  1:1 ports, so `docs/migration-map.md` is intentionally left unchanged.

## Decision Log

- Decision: Keep the two components decoupled — the button emits a `toggle`
  event with `detail.expanded`; it does not reach across the DOM to mutate the
  sidebar.
  Rationale: Matches the repo rule "data in via props, interaction out via
  events" and keeps the button reusable for any collapsible region. `controls`
  still reflects to `aria-controls` for assistive tech.
  Date/Author: 2026-07-12 / Claude

- Decision: `box-sidebar-toggle-button` defaults `expanded` to true.
  Rationale: A sidebar renders open until the user collapses it; the button's
  initial state should match.
  Date/Author: 2026-07-12 / Claude

- Decision: Collapsing hides the `header` and `footer` parts and narrows the
  rail to an icon strip, keeping the `body` (default slot) visible.
  Rationale: Header/footer typically hold branding and labels; the body holds
  the icon nav that should survive collapse.
  Date/Author: 2026-07-12 / Claude

## Outcomes & Retrospective

Shipped both layout components with tests, exports, docs catalog/roadmap
updates, and a paired docs-site example. Remaining Phase 5 component gaps
(`grid-view`, `fieldset`/`section`, `error-mask`, `draggable-list`, picker list
items, `nudge`, `pill-cloud`, `pill-selector-dropdown`) are unchanged and still
open. A generic keyboard roving-focus treatment for slotted nav items was left
to the consumer, since item markup is host-provided.

## Context and Orientation

- `src/components/layout/app-shell.ts`, `split-view.ts` — exact-tier exemplars
  for structure, `part=` styling, `--boe-token-*` fallbacks, and the
  `defineBox<Name>Element` idempotent factory.
- `src/components/feedback/chip.ts` — exemplar for interactive behavior: event
  dispatch and focus restoration across re-render.
- `src/index.ts` — single flat barrel; layout exports use `.js` extensions.
- `test/components/layout/app-shell.test.ts` — test template (jsdom pragma,
  `defineBox*` in `beforeEach`, `part=` assertions).
- `docs/components/catalog.md`, `docs/roadmap.md` — catalog and build-out status.
- `docs-site/registry.ts`, `docs-site/examples.ts` — docs-site auto-derives
  categories from the registry; examples are keyed by catalog id.

## Plan of Work

1. Add the two components in `src/components/layout/` following the exemplars.
2. Export both from `src/index.ts` (Layout section, alphabetical).
3. Add jsdom tests mirroring the src paths under `test/components/layout/`.
4. Mark both **built** in `docs/components/catalog.md` (Layout), drop them from
   the gap-candidate list, and update `docs/roadmap.md`.
5. Register both ids in `docs-site/registry.ts` (Layout) and add a paired live
   example in `docs-site/examples.ts`.

## Concrete Steps

From the repository root:

```
bun run typecheck
npx vitest run test/components/layout/nav-sidebar.test.ts test/components/layout/sidebar-toggle-button.test.ts
bun run verify
```

Expected: typecheck clean; the two test files pass; `bun run verify`
(typecheck + full test + build) green.

## Validation and Acceptance

- New tests fail before the components exist and pass after (behavior-based:
  toggle flips `expanded` and emits `toggle`; disabled suppresses both; sidebar
  reflects `collapsed` to `data-collapsed`; nav exposes `aria-label`).
- `bun run verify` passes.
- Docs site lists **Nav Sidebar** and **Sidebar Toggle Button** under Layout
  with a working collapse demo.

## Idempotence and Recovery

- The `defineBox*Element` factories guard on `customElements.get`, so repeated
  definition (e.g. per-test `beforeEach`) is safe.
- All edits are additive; re-running the steps is safe. If the build fails
  partway, re-run `bun run verify` after fixing — no generated assets are
  committed.

## Artifacts and Notes

```
$ npx vitest run test/components/layout/nav-sidebar.test.ts test/components/layout/sidebar-toggle-button.test.ts
 Test Files  2 passed (2)
      Tests  9 passed (9)
```

## Interfaces and Dependencies

- Custom elements: `box-nav-sidebar`, `box-sidebar-toggle-button`.
- Exports: `BoxNavSidebarElement`, `defineBoxNavSidebarElement`,
  `BoxSidebarToggleButtonElement`, `defineBoxSidebarToggleButtonElement`.
- Event: `toggle` (`CustomEvent<{ expanded: boolean }>`, bubbles + composed).
- Attributes: sidebar `collapsed` (bool, reflected), `label`; button `expanded`
  (reflected), `disabled`, `label`, `controls` (→ `aria-controls`).
- Design tokens: `--boe-token-surface-*`, `--boe-token-stroke-*`,
  `--boe-token-text-*` with hex fallbacks; works with no design system
  registered.
