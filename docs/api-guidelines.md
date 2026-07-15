# Component API Guidelines

This document defines the low-opinionated API vocabulary to converge on across the component and pattern surface.

It is intentionally small. The goal is not to force every component into the same shape, but to make common concepts feel predictable. A human should be able to skim one component and guess another. An AI coding assistant should be able to infer the next likely property name, event name, and data shape without extra prompting.

## Taxonomy layers

The system has three tiers (see [taxonomy.md](./taxonomy.md)):

- `Foundations` — design decisions as data: tokens, iconography, theming
- `Components` — single controls or small focused surfaces
- `Patterns` — assembled task surfaces and orchestrated workflow shells

API guidance in this document applies to components and patterns; compositional freedom should increase as surfaces move up the stack.

## Design goals

The API should optimize for:

- predictable naming across components
- plain object schemas that are easy to generate and inspect
- event payloads that mirror component state closely
- compatibility aliases when migrating toward better names
- simple escape hatches over large config surfaces

## Import contract

The package import surface should stay predictable as the catalog grows:

- `box-open-elements`
  - root exports and common entrypoints
- `box-open-elements/core`
  - shared runtime (event emitter, controller base)
- `box-open-elements/foundations/<module>`
  - design-token registry, token bundles, iconography
- `box-open-elements/components/<category>/<name>`
  - single controls grouped by category
- `box-open-elements/patterns/<area>` and `box-open-elements/patterns/<area>/<module>`
  - workflow areas: headless controllers, contracts, and composed surfaces

Examples:

```ts
import { defineBoxButtonElement } from "box-open-elements/components/actions/button";
import { applyDesignTokens } from "box-open-elements/foundations/tokens";
import { ExplorerSelectionController } from "box-open-elements/patterns/content-explorer/selection";
```

Guidance:

- prefer wildcard-compatible file names and subpaths
- avoid adding one-off explicit `package.json` exports for every new component
- reserve explicit alias exports for compatibility cases where a public name intentionally differs from the file name
- keep the category structure synchronized with [components/catalog.md](./components/catalog.md) and [patterns/catalog.md](./patterns/catalog.md)

## Baseline attributes

Use these names when the concept applies:

- `label` — primary accessible/display label for controls and compact components
- `value` — current selected or entered value for stateful components
- `name` — form field name for form-associated controls (`FormAssociatedElement`)
- `disabled` — disables interaction when the component is interactive
- `invalid` — marks a form control as invalid (sets `aria-invalid` and error chrome)
- `error-message` — validation message shown in `part="error-message"` when `invalid`
- `open` — visibility state for overlays and transient UI
- `tone` — visual semantic variant such as `primary`, `warning`, or `success`
- `size` — visual size when the component has a non-content-based footprint
- `heading` — short headline for content or status surfaces (named `heading`, not
  `title`, to avoid colliding with the native `HTMLElement.title` tooltip property)
- `message` — supporting descriptive copy
- `description` — longer supporting copy when `message` would be ambiguous or too short
- `items` — structured collection data for rich hierarchical or menu-like inputs
- `options` — simpler choice data for flat selection controls

Form-associated controls extend `FormAssociatedElement` and submit through `ElementInternals`:

- Everyday string/boolean/number fields: `text-field`, `text-area`, `select`, `combobox`,
  `search-field`, `checkbox`, `switch`, `radio-group`, `number-input`, `spin-button`,
  `slider`, `date-field`, `time-field`, `dropdown`, `rating`, `color-picker`,
  `rich-text-input`
- Multi-value fields submit `FormData` via `formDataFromNamedValues` (one entry per selected
  value under `name`, or under `"value"` when `name` is empty): `checkbox-group`,
  `multi-select`, `dual-listbox`, `tag-input`, `pill-cloud`, `pill-selector-dropdown`
- Range pairs submit `FormData` via `formDataFromRange` (`${name}-start` / `${name}-end`,
  or `range-start` / `range-end` when `name` is empty): `range-slider`

Boolean controls also accept `value` (default `"on"`) as the submitted string when checked.
Empty multi-selections omit the control (`null`).

**Empty-name fallback keys.** When `name` is omitted, multi-value controls submit each
selected entry under `"value"`; range controls use `"range"` as the base for
`${base}-start` / `${base}-end` (that is, `range-start` and `range-end`).

## Naming preferences

- Prefer `label` for controls.
- Prefer `heading` plus `message` for status and empty-state surfaces.
- Prefer `description` for longer secondary copy.
- Prefer `items` for rich objects and `options` for flat choices.
- Prefer `value-changed` for selection/input updates.
- Prefer `open-changed` for overlay visibility changes.
- Prefer `ratio-changed` for resizable split panes (`detail: { ratio }` on `split-view`).
- Prefer adding compatibility aliases before hard renames when an existing component uses a less ideal term such as `heading`, `caption`, or `subtitle`.

## Shared event contract

Custom events should:

- bubble
- be composed
- use kebab-case names
- include a small `detail` payload
- keep the payload shape close to the component state shape

Recommended shared state-change events:

- `value-changed`
- `open-changed`
- `ratio-changed` (`detail: { ratio }` for `split-view`)
- `checked-changed`
- `selected-changed`

Recommended semantic intent events:

- `action`
- `confirm`
- `cancel`
- `dismiss`
- `search`
- `clear`
- `item-selected`
- `item-invoked`

Event payload guidance:

- `value-changed` should usually emit `{ value }`
- `open-changed` should usually emit `{ open }`
- `checked-changed` should usually emit `{ checked }`
- semantic events should include only the minimum context needed to act

Use native browser events such as `click`, `focus`, `blur`, `input`, and `change` when a custom wrapper would not add clarity.

## Shared schema contract

Prefer plain serializable objects with stable keys. Avoid clever builder APIs or multiple parallel shapes for the same concept.

Recommended `option` shape for flat choices:

```ts
type Option = {
  id: string;
  label: string;
  value?: string;
  disabled?: boolean;
  description?: string;
  icon?: string;
};
```

Recommended `item` shape for richer collections:

```ts
type Item = {
  id: string;
  label?: string;
  name?: string;
  type?: string;
  disabled?: boolean;
  description?: string;
  children?: Item[];
};
```

Recommended event detail examples:

```ts
type ValueChangedDetail = { value: string | string[] };
type OpenChangedDetail = { open: boolean };
type CheckedChangedDetail = { checked: boolean };
type ItemSelectedDetail = { id: string; value?: string; label?: string };
```

These shapes are intentionally boring. That is a feature. They are easy to author by hand and easy for AI coding assistants to infer and transform.

## Collection rendering strategies

Collection components should stay strategy-agnostic when the underlying data can grow large.

Prefer exposing stable collection state such as:

- `items`
- `loading`
- `pagination`
- selection state
- commands such as `reload()` and `loadNextPage()`

Then let consumers choose the rendering strategy that fits their scale:

- `pagination` — best default when the backend is already page-oriented and users need stable positions, shareable states, or explicit counts
- `infinite scroll` — best when continuous browsing matters more than explicit page boundaries
- `windowing` — best when the DOM cost of rendering all visible items would become too high, even if the data is already loaded

Guidance:

- Do not hard-wire collection components to only one of these strategies unless the component is explicitly specialized.
- Prefer headless controller state that can power all three.
- Treat windowing as a rendering concern, not a transport concern.
- Treat pagination metadata as stable shared state, even if the UI ultimately renders via infinite scroll.

## Accessibility

Accessibility semantics and keyboard behavior are part of the component contract, not optional polish. The full conventions live in [foundations/accessibility.md](./foundations/accessibility.md).

## Render lifecycle

Web Components in this package extend `BaseElement` (`box-open-elements/core`):

- build the shadow tree once in `renderTemplate()`
- attach listeners once in `setupListeners()`
- patch state in `update()` — never reassign `shadowRoot.innerHTML` on attribute/property changes

See [architecture.md](./architecture.md#web-component-render-contract) for the full contract
(list-container rebuilds, focused-input value guarding).

## Styling hooks

Shadow DOM components expose named internal styling targets with the `part` attribute. In docs and the docs site, refer to these as `Styling Hooks`: they let consumers style internal surfaces from outside the component without breaking encapsulation.

```html
<box-button></box-button>
```

```css
box-button::part(button) {
  border-radius: 999px;
}
```

Recommended styling hook names stay structural and reusable:

- `label`
- `message`
- `title`
- `description`
- `trigger`
- `content`
- `item`
- `marker`
- `header-row`
- `cell`
- `empty`

Avoid overly presentational names unless the structure is unique to the component.

Components should also consume foundation tokens (`--boe-token-*`) with safe fallbacks, so they work with no design system registered and restyle automatically when one is active. See [foundations/tokens.md](./foundations/tokens.md).

## AI-friendly authoring rules

To keep the system easy for AI coding assistants and human developers alike:

- prefer one obvious property name for each concept
- prefer one obvious event name for each state transition
- keep data shapes serializable and easy to inspect in logs
- document compatibility aliases when they exist
- show small copy-pasteable examples in docs and demos
- avoid requiring imperative setup when property binding is enough

## Preview stack direction

Preview-related work stays layered:

- **Compositions** (patterns/preview) — preview headers, toolbars, sidebars, metadata panels, annotation surfaces around the rendering engine
- **Workflow shell** (patterns/preview) — a pluggable preview element that hosts the actual preview provider and orchestrates preview state

See [patterns/preview.md](./patterns/preview.md) for the provider-adapter contract and annotation-first priorities.
