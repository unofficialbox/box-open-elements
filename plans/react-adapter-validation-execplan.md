# ExecPlan: React adapter validation

## Purpose / Big Picture

Advance `@box-open-elements/react` from a one-button proof of concept to the
**Validated** milestone in `docs/integration/framework-adapters.md`. A React
consumer should be able to render a value control and a structured-option
control, receive typed `value-changed` events, hold the underlying custom-element
ref, and update properties without React attribute-stringification behavior.

The finished behavior is visible in focused adapter tests and documented in the
React integration guide and framework tracker.

## Progress

- [x] Confirm current `main` is `3b1d4be` through PR #73 and the worktree is clean.
- [x] Inspect `createWebComponent`, `BoxButton`, `box-text-field`, and `box-select`.
- [x] Extend the factory with stable typed custom-event subscriptions and explicit property omission from React host props.
- [x] Add `BoxTextField` and `BoxSelect` wrappers and exports.
- [x] Add focused tests for values, booleans, structured options, custom events, latest handlers, and forwarded refs.
- [x] Update package and repository docs; mark React **Validated** only when the checklist is proved.
- [x] Run targeted tests, package typecheck, and `bun run verify`.
- [ ] Publish the PR and poll Verify, Visual regression, and CodeRabbit to green.

## Surprises & Discoveries

- The PoC factory spreads component-specific props onto the React host in
  addition to synchronizing them as properties. React 18 can stringify unknown
  values, so structured props need an explicit omission list.
- Callback refs are recreated on every render in the PoC; memoizing the merged
  ref callback avoids unnecessary detach/attach cycles.
- `box-select.options` is an array of `{ label, value }` objects and therefore a
  useful structured-property proof without introducing a synthetic test element.

## Decision Log

- Decision: validate with `BoxTextField` and `BoxSelect` rather than wrapping a
  large catalog batch.
  Rationale: together they prove value control, boolean state, structured data,
  custom events, property updates, and refs while keeping the public surface lean.
  Date/Author: 2026-07-17 / Codex
- Decision: make custom-event bindings declarative factory options whose
  listeners read the latest handler from a ref.
  Rationale: subscriptions stay stable across renders without invoking stale
  callbacks, matching the React best-practices guidance.
  Date/Author: 2026-07-17 / Codex
- Decision: explicitly list synchronized property names in each wrapper.
  Rationale: React should receive native host props such as `className`, `style`,
  and `onClick`, while component data is assigned only through element properties.
  Date/Author: 2026-07-17 / Codex

## Outcomes & Retrospective

The adapter now covers three interaction shapes without adding runtime
dependencies: native button events, value-bearing custom events, structured
option arrays, and forwarded refs. Explicit property omission closes the React
18 stringification gap; stable subscriptions route to the latest callback. The
remaining Beta work is intentionally different: overlay focus/open lifecycle,
one controller composition, and SSR/hydration guidance.

## Context and Orientation

The optional React adapter is under `packages/react/`. The shared factory is
`packages/react/src/create-web-component.ts`; `BoxButton` is the existing
representative wrapper. Tests use React DOM with jsdom under
`packages/react/test/`.

The new wrappers target `BoxTextFieldElement` in
`src/components/forms/text-field.ts` and `BoxSelectElement` in
`src/components/forms/select.ts`. Both emit the composed custom event
`value-changed` with `detail: { value: string }`; `box-select` also exposes the
structured `options` property.

The canonical progress contract is
`docs/integration/framework-adapters.md`. React-specific guidance is in
`docs/integration/react.md` and `packages/react/README.md`.

## Plan of Work

First, extend `createWebComponent` with two opt-in declarations: property names
that must be removed from the React host-prop spread, and custom-event mappings
from a React callback prop to a DOM event name. Keep event subscriptions stable
and route them to the latest callback through a ref. Memoize the combined local
and forwarded ref callback.

Next, add thin `BoxTextField` and `BoxSelect` modules. Synchronize their public
properties, bind `onValueChanged` to `value-changed`, and export the wrappers,
props, event-detail types, option type, and underlying element types.

Then add focused jsdom tests for initial and updated property values, structured
options, booleans, typed custom-event payloads, callback freshness, and object
refs. Finally, update the adapter docs, tracker, backlog, handoff, and takeover
status without changing the framework-neutral core.

## Concrete Steps

Run from `/Users/massnerder/Developer/Code/box-open-elements`:

1. Edit the factory, wrapper modules, index exports, and focused tests.
2. Run `bunx vitest run packages/react/test`.
3. Run `bunx tsc -p packages/react/tsconfig.json --noEmit`.
4. Update the owning docs and this plan's progress/outcome sections.
5. Run `bun run verify`.
6. Commit, push, open the PR ready for review, and poll Verify, Visual
   Regression, and CodeRabbit until green.

## Validation and Acceptance

- `BoxTextField` synchronizes string/boolean/form properties and emits a typed
  React `onValueChanged` callback from the composed DOM event.
- `BoxSelect` receives an array of structured options as a property, updates it
  on rerender, and forwards `value-changed`.
- A React object ref resolves to the real `BoxTextFieldElement` and clears on
  unmount.
- Changing an event callback does not resubscribe the DOM listener or invoke a
  stale handler.
- Native `onClick` forwarding for `BoxButton` remains green.
- Targeted tests, package typecheck, and `bun run verify` pass.

## Idempotence and Recovery

Custom-element definition remains idempotent through the existing
`defineBox*Element` helpers. Tests can be rerun safely because the registry
returns an existing definition. If a wrapper or factory change fails, revert
only the new adapter files/options and rerun the existing `BoxButton` test to
confirm the PoC contract remains intact.

## Artifacts and Notes

- Starting commit: `3b1d4be` (`main` through PR #73).
- Existing verification baseline: 152 test files / 814 tests / 84.06% lines.
- Targeted adapter result: 2 files / 7 tests pass; package typecheck passes.
- Full verification result: 153 files / 817 tests / 84.16% lines; typecheck and build pass.

## Interfaces and Dependencies

Public additions:

- `BoxTextField`, `BoxTextFieldProps`
- `BoxSelect`, `BoxSelectProps`, `BoxSelectOption`
- typed value-change detail/handler exports used by both wrappers
- optional `propertyNames` and `events` factory configuration

No new runtime dependencies. React 18 and 19 remain peer dependencies; `src/`
remains free of React imports.
