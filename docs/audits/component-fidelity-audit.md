# Component Fidelity Audit

Multi-agent audit of the full catalog: one reviewer per component scoring five dimensions
(visual fidelity, states, accessibility, API, code quality) 1–5 with concrete, code-cited issues,
then a synthesis pass ranking worst-first and grouping the work into systemic batches.

**Coverage:** all **109 components** audited (108 unique scored records). Reproduce/extend:
`scripts/fidelity-audit.workflow.js`.

| Dimension | Avg (/5) |
|---|---|
| API surface | 3.19 |
| Visual fidelity | 3.16 |
| Code quality | 2.85 |
| Accessibility | 2.62 |
| States | 2.52 |
| **Overall** | **2.78** |

**51 components score below 3/5; 229 high-severity issues logged.**

> ⚠️ **Security first:** three components have genuine injection holes and should be fixed
> ahead of everything else — `link-button` renders `href="javascript:…"` unfiltered,
> `skeleton` interpolates unescaped `width`/`height` into an inline `style`, and
> `content-explorer` injects `error.message` unescaped.

## Executive summary

The library is broadly **below production bar**: 108 components average **2.78/5**, 51 under 3.0,
and only `calendar` reaches 4.0+ on visual fidelity. The weakest dimensions are **states (2.52)**
and **accessibility (2.62)** — API (3.19) and visual fidelity (3.16) are comparatively healthy,
so the problems are **behavioral and semantic, not structural**. Two defects dominate almost every
file: a **full `shadowRoot.innerHTML` rebuild on every state change** (destroys keyboard focus,
kills declared CSS transitions, causes double-renders) and **hardcoded `white` inside `color-mix()`**
(silently breaks the shipped dark theme). Because the same handful of anti-patterns repeat across
dozens of components, most of the 229 high-severity findings are addressable through a **small
number of systemic sweeps** rather than per-component rewrites.

## Systemic themes

- **Full-innerHTML re-render → focus loss / dead transitions (~55+ components).** The dominant
  defect. `attributeChangedCallback`/setters call `render()` which reassigns `shadowRoot.innerHTML`,
  destroying the focused node and re-binding all listeners. Breaks keyboard flow on every
  toggle/keystroke and makes declared transitions dead code. E.g. `popover`, `checkbox`, `combobox`,
  `metadata-filter-builder`, `select`, `button`, `nav-sidebar` (dead collapse), `progress-*`.
- **Hardcoded `white` in `color-mix()` → dark mode broken (~35 components).** Surfaces mix a token
  toward literal `white`, so tiles/pills/avatars stay light on `box-dark`. E.g. `metric-card`,
  `persona`, `card`, `radio-group`, `checkbox-group`, `pill-cloud`, `segmented-control`, `badge`.
- **Missing focus-visible rings + hover/active/disabled (~25 components).** Interactive controls
  style at most `:focus-visible` (often nothing) despite hover/pressed tokens existing.
- **`title` overrides native `HTMLElement.title` (~20 components).** Using `title` as a heading
  attribute produces a stray OS tooltip and shadows the DOM API. E.g. `card`, `app-shell`,
  `metric-card`, `preview-header`, `section`, `nudge`, chart components.
- **ARIA role misuse (~15 components).** `role="listitem"` on `<button>` strips interactive
  semantics; tab/tablist used for non-tab widgets; `menu`/`toolbar`/`listbox` roles declared with
  no roving-tabindex keyboard nav.
- **Form fields incomplete (~13 components).** No error/invalid state and not form-associated (no
  `ElementInternals`/`name`), so values never submit. E.g. `select`, `text-field`, `date-field`,
  `number-input`, `checkbox`, `radio-group`.
- **Fabricated/nonexistent tokens fall back to hardcoded hex (~9 components).**
  `--boe-token-surface-item-surface-hover` and `--boe-token-text-text-danger` don't exist, so they
  never theme.
- **Broken docs examples (~11 components).** The shipped example passes attributes the component
  doesn't read or a data shape that throws (`tree-grid` crashes, `permission-matrix` blank,
  `metadata-filter-builder`, `dropdown`, `dialog`, `toast`, `item-form`, `tooltip`).
- **Injection / XSS (3 components, high severity).** `link-button`, `skeleton`, `content-explorer`.

## Worst offenders

| id | overall | Single most important fix |
|---|---|---|
| `popover` | 2.0 | Make it actually float — absolute/anchored positioning + z-index; add dialog name, focus mgmt, light-dismiss |
| `metadata-filter-builder` | 2.0 | Stop full re-render on every keystroke (destroys the input mid-typing) |
| `tree-grid` | 2.0 | Add the missing grid CSS (rows/cells/indentation unstyled; layout props dead); fix throwing example |
| `checkbox` | 2.0 | Make form-associated (`ElementInternals`) + indeterminate; stop focus-losing re-render |
| `combobox` | 2.0 | Map selected label back to option `value`; stop keystroke re-render |
| `persona` | 2.0 | Wire the dead `tone` attribute; map `status` to semantic tokens; fix NaN size guard |
| `split-view` | 2.0 | Fix drag (re-render destroys pointer-capture after first move); keyboard-operable separator |
| `permission-matrix` | 2.0 | Define the missing `.sr-only` rule (labels duplicated as visible text); stop per-change re-render |
| `donut-chart` | 2.0 | Distinct token-driven segment colors (all render identical blue); fix single-segment arc |
| `card` | 2.0 | Add interactive states; drop native `title` override |
| `app-shell` | 2.0 | Responsive reflow + conditional landmarks; stop rendering empty nav/aside |
| `tooltip` | 2.0 | Add a `<slot>` for the trigger (docs slot a button that never renders); position the panel |
| `explorer-list` | 2.4 | Reset stale `focusItemId` on navigation (keyboard trap); render error state |
| `dropdown` | 2.5 | Align API with docs (`options`/`{label,value}` vs `items`/`{id,label}`); menu keyboard nav |
| `explorer-toolbar` | 2.5 | Add attribute API/reflection; render the subscribed-but-dropped error state |

## Prioritized fix plan

**Batch 0 — Security (do first).** Scheme-check `link-button` href, escape `skeleton`
`width`/`height` before injecting into `style`, `escapeHtml` the `content-explorer` error message.

**Batch 1 — Replace full-innerHTML render with in-place patching (highest impact, ~55).** Build the
shadow DOM once in `connectedCallback`; on state change, mutate text/classes/`aria-*` instead of
reassigning `innerHTML`; preserve/restore focus where a rebuild is unavoidable. Root cause of the
states + much of the accessibility shortfall; fixing it also revives every dead CSS transition.
Introduce a shared base helper so it's one pattern, applied across the interactive set.

**Batch 2 — Tokenize color for dark-mode correctness (~35).** Replace `color-mix(…, white N%)` with
mixes against surface tokens; replace hardcoded status/accent hex with `--boe-token-surface-status-*`;
add the missing real tokens behind the fabricated names (or repoint). Mostly mechanical, high payoff —
`box-dark` currently renders a third of the library light-on-dark. **Folds in the user-reported
dark-theme complaint.**

**Batch 3 — Focus-visible rings + hover/active/disabled states (~25).** Shared `:focus-visible`
brand ring + `:hover`/`:active`/`:disabled` on all interactive parts using existing hover/pressed
tokens; add `disabled` where missing. Targets the lowest dimension (states); fixes WCAG 2.4.7 gaps.

**Batch 4 — ARIA correctness & keyboard interaction for composite widgets (~18).** Roving-tabindex +
arrow/Home/End nav for `menu`/`toolbar`/`listbox`/`radiogroup`; remove `role="listitem"` from
buttons; fix tab/tablist misuse; focus trap/restore on modals. Several widgets announce a role they
don't behaviorally fulfill — AT users can open but not operate them.

**Batch 5 — Form-field completeness (~13).** Add `error`/`invalid` (attribute + `aria-invalid` +
`SurfaceStatusSurfaceError` + message region) and make controls form-associated via
`ElementInternals`/`name`; fix reflection drift and min/max clamping. Form components that can't show
validation or submit their value aren't usable in real forms.

**Batch 6 — `title` collision + docs repair (~20 + ~11).** Rename the `title` heading attribute to
`heading` across the offenders (stop the native-tooltip collision); fix the broken shipped examples so
demos render. Cheap, high-visibility credibility fixes. **Folds in the user-reported token-label
humanization and Workshop unlink as part of the docs pass.**

**Batch 7 — Per-component polish.** Remaining medium/low issues not covered by the sweeps.
