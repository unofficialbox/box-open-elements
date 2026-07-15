# Accessibility

Components expose accessible semantics as part of the default contract, not as optional follow-up polish. These conventions matter for both humans and AI assistants because they make component behavior easy to infer from names alone.

## General rules

- prefer native elements before recreating semantics with ARIA
- expose an accessible name with `label`, `title`, visible text, or an explicit `aria-label`
- keep keyboard interaction predictable across related components
- expose current state with the matching ARIA state rather than visually implied state only
- prefer structural roles that match the mental model of the component

## Recommended semantic patterns

- use `role="listbox"` and `role="option"` for single-focus selectable lists
- use `role="tree"` / `role="treeitem"` / `role="group"` for hierarchical navigation
- use `role="treegrid"` for hierarchical dense data with columns
- use `role="radiogroup"` / `role="radio"` for single-choice segmented or grouped controls
- use `role="tablist"` / `role="tab"` / `role="tabpanel"` for tabbed views and step-like controls when they behave as a tab set
- use `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-valuetext` for progress indicators
- use `role="status"` or `aria-live` for transient feedback that should be announced
- use `role="note"` for passive supporting guidance such as inline help text

## Keyboard guidance

- `Arrow` keys should move focus inside ordered composite widgets such as tabs, segmented controls, trees, and listbox-style collections
- `Home` and `End` should jump to the first and last item when that pattern is expected
- `Enter` and `Space` should activate the currently focused item when activation is expected
- `Escape` should dismiss transient surfaces such as dialogs, drawers, popovers, tooltips, and menus

Shared helpers live in `box-open-elements/foundations/a11y`:

| Helper | Use when |
|---|---|
| `nextRovingIndex` / `handleRovingKeydown` / `applyRovingTabindex` | menu, toolbar, listbox, radiogroup composites |
| `trapTabKey` / `FocusRestore` | modal dialogs and drawers (`aria-modal`) |
| `renderHeadingHtml` / `headingOpenTag` | rendering a `heading` attribute as a real `<h*>` |

Form controls that submit values extend `FormAssociatedElement` (`box-open-elements/core`): set
`name`, toggle `invalid` + `error-message` for validation UI (`aria-invalid` /
`aria-errormessage` + `part="error-message"`), and keep `syncFormAssociation()` in sync with the
control value. Multi-option fields apply invalid ARIA to every focusable control via
`applyInvalidStateToControls`; multi-value selections submit `FormData`.

Prefer native `<h2 part="title">` (with `margin: 0; font: inherit`) over `<div>` / `<strong>` for headline text. Keep `part="title"` for `::part` styling. Do **not** put `role="listitem"` on a native `<button>` — that strips interactive semantics. Use `role="tablist"` / `role="tab"` only when panels + `aria-selected` are also present.

## Focus visibility

- every interactive control shows a visible focus indicator on `:focus-visible`, driven by the design-system brand token (`--boe-token-surface-surface-brand`) rather than a hardcoded color, so the ring matches the active theme and adapts between light and dark
- interactive controls also expose `:hover` / `:active` / `:disabled` using `--boe-token-surface-*` hover and pressed tokens (see `boeNeutralInteractiveStyles` / `boeBrandInteractiveStyles` in [tokens.md](./tokens.md))
- status and other semantic colors resolve through design tokens (`--boe-token-surface-status-*`) and `color-mix` against the surface/text tokens, so contrast holds when the theme changes instead of leaving light-on-light or dark-on-dark patches

## State guidance

- prefer `aria-selected` for selection state in listbox, tab, tree, and similar composite widgets
- prefer `aria-checked` for boolean and radio-like selection state
- prefer `aria-expanded` for collapsible branches, disclosure controls, and menu triggers
- prefer `aria-busy` for collection or shell regions that are actively loading

## Labeling guidance

- action buttons inside repeated rows should expose the row context, such as `Open Spec` or `Preview Spec`
- dismissive or destructive controls should expose intent explicitly, such as `Dismiss alert` or `Close drawer`
- decorative art should be `aria-hidden` when the surrounding component already carries the useful accessible label

## Follow-ups

- consider a dedicated accessibility checklist per component family once the surface stabilizes
- deepen focus-management verification for overlays as they are rebuilt
