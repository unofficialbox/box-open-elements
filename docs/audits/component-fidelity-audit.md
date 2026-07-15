# Component Fidelity Audit

Multi-agent audit of the full catalog: one reviewer per component scoring five dimensions
(visual fidelity, states, accessibility, API, code quality) 1–5 with concrete, code-cited issues,
then a synthesis pass ranking worst-first and grouping the work into systemic batches.

**Coverage:** all **109 components** audited (108 unique scored records).

**Reproduce/extend:** the audit is a Claude Code multi-agent workflow,
`scripts/fidelity-audit.workflow.js` (run via the Workflow tool — one reviewer per
catalog component). It reads the component sources under `src/` and their examples in
`docs-site/examples.ts`; no build step or services are required. Each component's scored
result is written to the run journal, and the committed outputs are this report plus
`component-fidelity-audit.data.json` in this directory.

| Dimension | Avg (/5) |
|---|---|
| API surface | 3.19 |
| Visual fidelity | 3.16 |
| Code quality | 2.85 |
| Accessibility | 2.62 |
| States | 2.52 |
| **Overall** | **2.78** |

**51 components score below 3/5; 229 high-severity issues logged.**

> **Program status (live):** Batches **0, 1, 2, 3, 6 are DONE** (merged). Remaining in order:
> **4** (ARIA/keyboard + heading semantics) → **5** (form association) → **7** (polish).
> Session status: [HANDOFF.md](../HANDOFF.md). Scores and issue lists below are the **original
> audit snapshot** — they are not re-scored after each batch; track completion in the prioritized
> plan and HANDOFF.
>
> ✅ **Batch 0 (security) done:** the three injection holes called out at audit time
> (`link-button` href scheme check, `skeleton` CSSOM sizing, `content-explorer` error escaping)
> were fixed in #29.

## Executive summary

At audit time the library averaged **2.78/5** across 108 scored components (51 under 3.0), with
**states (2.52)** and **accessibility (2.62)** weakest. Two defects dominated: a **full
`shadowRoot.innerHTML` rebuild on every state change** and **hardcoded `white` inside
`color-mix()`**. Those systemic themes (plus focus/hover states, `title`→`heading`, and the
security holes) have since been swept — see the prioritized plan. Remaining work is primarily
**ARIA/keyboard behavior**, **form association**, and leftover polish.

## Systemic themes

Status markers reflect post-audit sweeps. The original findings stay listed so the audit trail is intact.

- **Full-innerHTML re-render → focus loss / dead transitions (~55+ components). — DONE (Batch 1).**
  Catalog and pattern custom elements now extend `BaseElement` (`renderTemplate` / `setupListeners` /
  `update`). See [architecture.md](../architecture.md#web-component-render-contract).
- **Hardcoded `white` in `color-mix()` → dark mode broken (~35 components). — DONE (Batch 2).**
  Replaced with surface tokens; added `SurfaceItemSurfaceHover` / `TextTextDanger`.
- **Missing focus-visible rings + hover/active/disabled (~25 components). — DONE (Batch 3).**
  Shared helpers in `src/foundations/tokens/interaction.ts`.
- **`title` overrides native `HTMLElement.title` (~20 components). — DONE (Batch 6).**
  Renamed to `heading`; docs examples repaired. Heading *semantics* (`<h*>` / `role="heading"`)
  remain for Batch 4.
- **ARIA role misuse (~15 components). — OPEN (Batch 4).** `role="listitem"` on `<button>` strips
  interactive semantics; tab/tablist used for non-tab widgets; `menu`/`toolbar`/`listbox` roles
  declared with no roving-tabindex keyboard nav.
- **Form fields incomplete (~13 components). — OPEN (Batch 5).** No error/invalid state and not
  form-associated (no `ElementInternals`/`name`), so values never submit. E.g. `select`,
  `text-field`, `date-field`, `number-input`, `checkbox`, `radio-group`.
- **Fabricated/nonexistent tokens fall back to hardcoded hex (~9 components). — DONE (Batch 2).**
  Tokens now exist / are repointed.
- **Broken docs examples (~11 components). — DONE (Batch 6).** Examples repaired as part of the
  docs pass.
- **Injection / XSS (3 components, high severity). — DONE (Batch 0).**

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

**Batch 0 — Security — DONE (#29).** Scheme-check `link-button` href, escape `skeleton`
`width`/`height` via CSSOM (not string `style`), `escapeHtml` the `content-explorer` error message.

**Batch 1 — Replace full-innerHTML render with in-place patching — DONE (#31/#32/#33).** Shared
`BaseElement` (`src/core/element.ts`) builds the shadow DOM once via `renderTemplate()`, attaches
listeners once via `setupListeners()`, and patches via `update()`. Applied across the full catalog
and pattern surfaces (components + patterns; ~107 elements). Dynamic lists rebuild only their list
container; focused inputs skip value overwrites while focused. Remaining medium/low polish stays in
Batch 7.

**Batch 2 — Tokenize color for dark-mode correctness — DONE (#29).** Replaced
`color-mix(…, white N%)` with mixes against surface tokens; replaced hardcoded status/accent hex
with `--boe-token-surface-status-*`; added missing tokens (`SurfaceItemSurfaceHover`,
`TextTextDanger`). **Folded in the user-reported dark-theme complaint.**

**Batch 3 — Focus-visible rings + hover/active/disabled states — DONE (#35).** Shared helpers in
`src/foundations/tokens/interaction.ts` (`boeNeutralInteractiveStyles` /
`boeBrandInteractiveStyles` / `boeFocusVisibleStyles`) applied across catalog components and
pattern interactive parts; style-presence tests cover acute surfaces. Remaining state gaps that
are ARIA/keyboard or form-association belong to Batches 4/5.

**Batch 4 — ARIA correctness & keyboard interaction for composite widgets (~18). — NEXT.**
Roving-tabindex + arrow/Home/End nav for `menu`/`toolbar`/`listbox`/`radiogroup`; remove
`role="listitem"` from buttons; fix tab/tablist misuse; focus trap/restore on modals. Also folds in
heading semantics: render `heading` as a real `<h*>` / `role="heading"` with `aria-level`, not a
`<div part="title">`. Several widgets announce a role they don't behaviorally fulfill — AT users
can open but not operate them.

**Batch 5 — Form-field completeness (~13). — OPEN.** Add `error`/`invalid` (attribute +
`aria-invalid` + `SurfaceStatusSurfaceError` + message region) and make controls form-associated via
`ElementInternals`/`name`; fix reflection drift and min/max clamping. Form components that can't show
validation or submit their value aren't usable in real forms.

**Batch 6 — `title` collision + docs repair — DONE (#29).** Renamed the `title` heading attribute
to `heading` across the offenders; fixed broken shipped examples; humanized Design-Tokens labels;
unlinked the Workshop from the public site.

**Batch 7 — Per-component polish. — OPEN.** Remaining medium/low issues not covered by the sweeps
(e.g. deferred `skeleton` update short-circuit; leftover audit nits after Batches 4–5).
