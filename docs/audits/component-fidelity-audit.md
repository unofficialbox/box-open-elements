# Component Fidelity Audit

Multi-agent audit of the catalog: one reviewer per component scoring five dimensions
(visual fidelity, states, accessibility, API, code quality) 1–5 with concrete issues.

**Coverage:** 77 of 109 components audited. The run hit a session usage limit before the
final 32 (the Search / Item / Metadata / Share / Preview / File-Request / Task / Governance /
Insights pattern groups) and the auto-synthesis step — this report is synthesized from the
77 completed audits. The remaining 32 should be audited in a follow-up run.

Reproduce/extend: `scripts/fidelity-audit.workflow.js`.

## Executive summary

Average overall fidelity is **2.83 / 5** across the 77 audited components; **30 score below
3/5**, and reviewers logged **153 high-severity issues**. The library is broad and the visual
layer is decent (avg visual-fidelity 3.25), but the **interactive layer is weak**: the two
lowest dimensions are accessibility (2.71) and states (2.73), and a single architectural
choice — re-rendering the whole shadow DOM on every attribute change — is the root cause of a
large share of the high-severity correctness bugs. This is fixable with a handful of *systemic
sweeps* rather than 77 one-off rewrites.

| Dimension | Avg (/5) |
|---|---|
| Visual fidelity | 3.25 |
| API surface | 3.16 |
| Code quality | 2.82 |
| States | 2.73 |
| Accessibility | 2.71 |
| **Overall** | **2.83** |

## Systemic themes

1. **Wholesale re-render on every attribute change (the dominant bug).** Most components
   implement `attributeChangedCallback → render()` where `render()` replaces
   `shadowRoot.innerHTML` entirely. For interactive controls this **destroys focus, drops
   in-progress input, and breaks drag**: e.g. `checkbox` and `radio-group` lose keyboard focus
   on toggle, `combobox`/`search`-style inputs tear down the `<input>` on every keystroke, and
   `split-view` re-renders mid-drag so the drag dies. Acute in `checkbox`, `combobox`,
   `radio-group`, `split-view`, `tree-grid`, `carousel`; the pattern itself pervades the
   interactive set. **Fix once**: reflect attribute changes by patching the existing DOM (or
   guard `render()` against self-triggered attribute writes) in a shared base helper.

2. **Accessibility gaps (55 high-severity).** Missing/incorrect ARIA (`aria-*` cited 77×),
   missing keyboard interaction (55×), wrong roles (36×). Overlays are the worst: `popover`,
   `tooltip`, `dialog`, `drawer`, `menu` variously lack accessible names, focus management
   (move-in / restore-on-close), robust `Escape`, and light-dismiss. Role misuse: `menu-item`
   hardcodes `menuitemradio`, `carousel` uses `tab`/`tablist` with no `tabpanel`/`aria-controls`.

3. **Missing disabled + interaction states (~49 components).** `disabled` is frequently absent
   from `observedAttributes`, unstyled, or accepted but visually indistinguishable; `:active`
   is often unstyled and the brand `focus-visible` ring is inconsistently applied.

4. **Hardcoded visuals instead of tokens (~72 components).** Hardcoded `rgba`/hex shadows and
   colors and off-grid spacing/radii (e.g. `0.78rem`, `1.1rem`) instead of `--boe-token-*` and
   Blueprint 4/8px rhythm. Some skeuomorphic gradients/insets read as un-Box.

5. **Docs example ↔ API contract mismatches that throw or no-op.** Several documented examples
   don't match the component's real API: `tree-grid` and `dropdown` examples pass an
   incompatible data shape (throws / renders nothing), `tooltip` has no `<slot>` so its slotted
   trigger never renders, `persona`'s `tone` attribute is dead (no CSS consumes it), `card` and
   `app-shell` override the native `HTMLElement.title` property, and `explorer-toolbar` has no
   attribute reflection at all.

## Worst offenders (lowest 15)

| Component | Overall | Most important fix |
|---|---|---|
| popover | 2 | Not actually floating — renders in flow instead of anchored/overlaid; no focus mgmt, name, or light-dismiss |
| tree-grid | 2 | Grid body is unstyled; grid-column/depth custom props are dead; example data shape throws |
| checkbox | 2 | Toggling loses keyboard focus (full re-render on `checked`) |
| combobox | 2 | Re-creates `<input>` on every keystroke (re-render on `value`) |
| persona | 2 | `tone` attribute is dead — no CSS selects `[data-tone]` |
| split-view | 2 | Full re-render mid-drag destroys the drag interaction |
| card | 2 | Overrides native `HTMLElement.title`, breaking the browser tooltip / example |
| app-shell | 2 | Same native-`title` override collision |
| tooltip | 2 | No `<slot>` — slotted trigger content never renders |
| explorer-list | 2.4 | Stale `focusItemId` after folder navigation → keyboard trap |
| dropdown | 2.5 | Docs `options`/`value` API doesn't exist on the component (`items` only) |
| explorer-toolbar | 2.5 | No `observedAttributes`/reflection — HTML-attribute contract violated |
| menu-item | 2.5 | Hardcoded `menuitemradio`/`aria-checked` for action items |
| carousel | 2.5 | `tab`/`tablist` without `tabpanel`/`aria-controls`; `aria-current` misused |
| radio-group | 2.5 | Full re-render on select destroys focus |

## Prioritized fix plan

Ordered by impact; each is a **systemic sweep**, not per-component rework.

- **Batch 1 — Kill the re-render-on-attribute bug (correctness).** Introduce a shared update
  pattern so attribute changes patch state without blowing away the shadow tree (or guard
  self-triggered writes). Land it first on the acute controls: `checkbox`, `radio-group`,
  `combobox`, `split-view`, `tree-grid`, `carousel`, then roll across the interactive set.
- **Batch 2 — Overlay accessibility (dialog/drawer/popover/tooltip/menu).** Focus move-in +
  restore-on-close, accessible names, `Escape` from anywhere inside, light-dismiss, and correct
  `aria-haspopup`/`aria-controls`. Fix `popover` to actually float/anchor and `tooltip` to slot
  its trigger.
- **Batch 3 — Disabled + interaction states sweep.** Add `disabled` to `observedAttributes` +
  styling + `:active`, and standardize the brand `focus-visible` ring across all interactive
  components (~49).
- **Batch 4 — Tokenize visuals.** Replace hardcoded colors/shadows and off-grid spacing/radii
  with `--boe-token-*` + Blueprint 4/8px rhythm across the flagged ~72; also improves dark mode.
- **Batch 5 — Fix broken docs examples / API contracts.** `tree-grid`, `dropdown`, `tooltip`,
  `persona` tone, `menu-item` role, `card`/`app-shell` `title` override, `explorer-toolbar`
  reflection — plus roll in the three site-level items already identified: humanize the
  **token-name labels** in the docs, a **dark-theme polish** pass, and **unlink the Workshop**
  from the public site.
- **Batch 6 — Finish the audit.** Run the remaining 32 pattern components and fold their
  findings into these batches.
