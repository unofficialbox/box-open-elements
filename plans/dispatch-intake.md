# Dispatch Intake — Gap Closure Plan

Response to the box-dispatch roadmap-input document ("Box Open Elements
component gaps and enhancements"). Every claim was verified against
source before acceptance; several requests describe behaviour that
already ships, three name a component where they mean a composition, and
verification surfaced two accessibility defects in shipped components
that the document filed as (or near) cosmetic requests. This plan takes
priority over the remaining slot-6 opportunities in
`component-opportunities.md` (document-scoped presence, virtualized
rows) until closed.

## Round 1 — accessibility defects (found during verification)

Defects in shipped components come before requested features.

- **`box-table` keyboard sorting.** Sortable headers are
  `<th part="sortable">` with a click listener and no tabindex, keydown,
  or inner button — sorting is unreachable by keyboard (WCAG 2.1.1).
  Fix: render a real `<button>` inside the `<th>` so focus, Enter and
  Space come free; keep `aria-sort` on the `<th>`.
- **`box-nav-sidebar` collapsed accessible name.** Collapsing sets
  `--boe-nav-label-display: none`, hiding the label span that is the
  slotted link's only accessible name — collapsed nav rows are unnamed
  to screen readers. Fix: drive the custom property to a visually-hidden
  rule instead of `display: none`, so the name survives while the pixels
  collapse; document `title` on rows as the hover affordance.

## Round 2 — `box-progress-steps` per-step status model

The controlled half (value, `value-changed`, arrows/Home/End,
`aria-current="step"`) already ships. Missing is the state model: state
is derived positionally (complete/current/upcoming, duplicated at two
sites), so pending / blocked / failed / disabled cannot be expressed;
state reaches users only through colour; there is no live region.

- Optional `status` on the item record: `"blocked" | "failed" |
  "disabled"` (plus the derived complete/current/upcoming when absent).
  Absent status ⇒ exactly today's behaviour; no host breaks.
- Pure `resolveStepStates(items, value)` engine (the `resolveCeremony`
  precedent) replacing both duplicated derivations.
- Status stated in words (visually-hidden where the design has no room),
  not only via `data-state` colour.
- Polite live region announcing step changes.
- Blocked/disabled steps are real `disabled` buttons: not clickable, out
  of the roving tabindex.
- Drop the invalid `aria-selected` from the patch path (buttons in
  `role="group"`; the initial render never set it).

## Round 3 — form field parity + typed event maps

- **`box-select`**: `loading`, `empty`, and error presentation matching
  `box-text-field`'s status vocabulary (`data-status`, words + spinner).
- **`box-text-field`**: `autocomplete` passthrough to the inner input;
  password visibility toggle (`reveal` opt-in) for `type="password"`.
- **Typed maps**: `HTMLElementTagNameMap` entries and typed
  `CustomEvent` detail interfaces for the library's events, so
  `addEventListener("value-changed", …)` is typed at the call site in
  any framework. This is the answer to "typed value-change callbacks"
  and the React-wrapper request: React ≥19 assigns custom-element
  properties directly; a framework wrapper contradicts the library's
  zero-dependency premise and is declined.

## Round 4 — `box-run-timeline` (the accepted gap)

`box-timeline` is an append-only *human* activity feed (newest-first,
actors, comment composer, correlation IDs) and is fully JSON-driven with
no slots. A run timeline is a forward-chronological *machine* execution
trace. Different component, shared visual language.

- Pure `resolveRunStates` engine: per-step
  `succeeded | failed | warning | running | pending | skipped`, with the
  failure rule (steps behind a failure are skipped, mirroring
  `resolveCeremony`'s decline rule) and derived overall run status.
- Marker/spine/tone chrome consistent with `box-timeline`; timestamps
  plus durations; expandable per-step detail; nested child progress rows
  composing `box-progress-bar`.
- Live announcement when the running step changes state.
- Docs-site + workshop + gallery + shot route in the same round.

## Round 5 — `box-table` features

- Declarative cell descriptors (`{ kind: "text" | "badge" | "link" |
  "actions", … }`) rendered by the table itself. Never an HTML-string
  renderer: cells are escaped because row data is server-supplied, and a
  string renderer reintroduces injection.
- Row expansion: `aria-expanded` toggle plus a full-width detail row.
- `loading` / `empty` / `error` table states, stated in words.
- Responsive stacked rows that keep table semantics for AT.

## Round 6 — drawer upgrades + responsive collapse

- **`box-drawer`**: named `header`/`footer` slots (sticky footer), size
  presets, full-screen under a mobile breakpoint, `busy` state, and a
  *cancelable* `dismiss` event — the host calls `preventDefault()` to
  hold the drawer open, which is the whole unsaved-changes guard; the
  drawer learns nothing about forms.
- **Responsive rail→drawer collapse**, built once: container-driven
  collapse of the secondary pane (`box-split-view` master-detail on
  narrow widths) and of the nav rail (`box-nav-sidebar`) into drawer
  presentation.

## Round 7 — docs for what Dispatch missed or misassigned

Requests that described already-shipped behaviour, or asked a layout
component for list behaviour, are documentation failures on our side:

- The shared field contract (`required`, `description`, `invalid`,
  `error-message`, `hide-label` via `FormAssociatedElement`) stated on
  every form-field page, not only in core docs.
- Controlled sorting/selection called out on the table page with a
  host-wiring example.
- The drawer open/dismiss contract as an explicit reference table.
- `box-progress-steps` vs `box-stage-path`: setup rail vs record
  lifecycle, on both pages.
- A master-detail composition recipe: `box-split-view` +
  `box-table` (controlled selection) + detail pane with
  `box-empty-state` / `box-skeleton`.
- `box-nav-sidebar` recipes: active item via host-owned
  `aria-current="page"`, badges via `box-badge` in light DOM,
  accessible icon-only mode.

## Declined

- **Official React wrapper** — adds a framework dependency to a library
  whose premise is having none. Typed maps (round 3) plus a consumption
  recipe serve every consumer; if Dispatch needs a wrapper package, it
  should own it.
- **Selection API on `box-split-view`** — selection belongs to the list
  in the pane, which already has it; fusing it to the layout would break
  every non-list use, including `box-compare-view`.
