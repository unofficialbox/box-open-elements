# Batch 1: In-Place Render Helper ExecPlan

## Purpose / Big Picture

After this change, the core library will include a shared base element helper (`BaseElement`) to support efficient in-place updates. A first set of critical interactive components (such as `box-button`, `box-checkbox`, and `box-radio-group`) will be refactored to inherit from this base. 

Currently, state mutations trigger a complete rewrite of `shadowRoot.innerHTML`, destroying all DOM nodes, breaking browser-native focus, dropping active inputs, and resetting CSS transitions. Rebuilding them to perform in-place mutations preserves the DOM nodes, maintaining natural browser focus and smooth transitions without manual focus restoration hacks.

## Progress

**Status: complete** (merged as fidelity Batch 1 — PRs #31, #32, #33). The pilot below
expanded into a full catalog + patterns migration onto `BaseElement`; see
[docs/HANDOFF.md](../docs/HANDOFF.md) and
[docs/architecture.md](../docs/architecture.md#web-component-render-contract).

- [x] Define the `BaseElement` class in `src/core/element.ts` and export it from `src/core/index.ts`
- [x] Refactor `box-button` (`src/components/actions/button.ts`) to use `BaseElement` and add/update Vitest component tests
- [x] Refactor `box-checkbox` (`src/components/forms/checkbox.ts`) to use `BaseElement` and add/update Vitest component tests
- [x] Refactor `box-radio-group` (`src/components/forms/radio-group.ts`) to use `BaseElement` and add/update Vitest component tests
- [x] Verify focus persistence and keyboard interaction behavior with automated Vitest assertions
- [x] Ensure `bun run verify` is green (typecheck, tests, build)
- [x] Recapture screenshot gallery and ensure no visual regression in light/dark themes

## Surprises & Discoveries

- The pilot of three components became a systemic sweep: essentially every catalog and pattern
  custom element now extends `BaseElement`. Focus/input/drag fidelity tests cover the acute
  surfaces (forms, split-view, carousel, accordion/tabs, metadata-filter-builder, drop-zone).

## Decision Log

- **Decision:** Introduce a lightweight `BaseElement` class in `src/core/element.ts` extending `HTMLElement`.
  **Rationale:** Standardizing elements on a shared lifecycle (`connectedCallback` -> render template once -> set up listeners once -> update in-place) keeps component code concise and eliminates repetitive boilerplates.
  **Date/Author:** 2026-07-14 / Claude

- **Decision:** Start with a pilot batch of three key components (`button`, `checkbox`, `radio-group`) before fanning out to all ~55 components.
  **Rationale:** Allows confirming the `BaseElement` architecture and refining API details before executing a repository-wide sweep.
  **Date/Author:** 2026-07-14 / Claude

## Outcomes & Retrospective

Shipped via PRs #31/#32/#33: `BaseElement` is the shared render contract for catalog and
pattern custom elements. Attribute/property changes patch in place; listeners attach once;
focused inputs are not overwritten while focused. Gallery baselines regenerated for
intentional visual deltas. Remaining fidelity work (ARIA/keyboard, form association, polish)
is tracked in [docs/HANDOFF.md](../docs/HANDOFF.md), not this plan.

## Context and Orientation

*   Base class location: `src/core/element.ts` (new file)
*   Pilot components:
    *   [button.ts](file:///Users/massnerder/Developer/Code/box-open-elements/src/components/actions/button.ts)
    *   [checkbox.ts](file:///Users/massnerder/Developer/Code/box-open-elements/src/components/forms/checkbox.ts)
    *   [radio-group.ts](file:///Users/massnerder/Developer/Code/box-open-elements/src/components/forms/radio-group.ts)
*   Pilot test suites:
    *   `test/components/actions/button.test.ts`
    *   `test/components/forms/checkbox.test.ts`
    *   `test/components/forms/radio-group.test.ts`

## Plan of Work

1.  **Implement `BaseElement`:** Create `src/core/element.ts` containing the lifecycle scaffold.
2.  **Refactor Button:** Update `BoxButtonElement` to inherit from `BaseElement`. Build DOM template and style once in `renderTemplate()`, then patch the dataset attributes (`data-tone`, `data-size`), text content (`label`), and `disabled` status in `update()`.
3.  **Refactor Checkbox:** Update `BoxCheckboxElement`. Set up input change listeners in `setupListeners()`, and update `checked`, `disabled`, and label attributes/text in `update()`.
4.  **Refactor Radio Group:** Update `BoxRadioGroupElement`. Construct the fieldset/legend shell. Update the inputs list dynamically or patch their checked/disabled/data attributes in-place.
5.  **Write Focus Persistence Tests:** Add Vitest assertions ensuring focus does not jump to the body when properties or attributes (like `label`, `disabled`, or `value`) change.
6.  **Verify & Visual Check:** Run typechecks and tests, and recapture gallery screenshots.

## Concrete Steps

1.  Create `src/core/element.ts`.
2.  Add export in `src/core/index.ts`.
3.  Refactor target files.
4.  Run `bun run test` to execute test suites.
5.  Run `bun run verify` for full validation.

## Validation and Acceptance

-   All Vitest suites pass.
-   Specific component tests are added showing that calling property setters or modifying attributes does **not** change `document.activeElement` if the control is focused.
-   `bun run verify` finishes successfully.

## Idempotence and Recovery

Edits are localized. Reverting changes to pilot files resets the state.

## Interfaces and Dependencies

-   `BaseElement` depends only on native browser APIs (`HTMLElement`, `ShadowRoot`).
-   Subclasses import `BaseElement` from `../../core/index.js` or `../core/index.js`.
