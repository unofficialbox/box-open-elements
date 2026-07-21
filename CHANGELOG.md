# Changelog

Work merged to `main` and notable in-flight changes for **2026-07-14 through 2026-07-17** (past 3 days from 2026-07-17).

Generated from git: `git log main --since="2026-07-14" --until="2026-07-18"`.

**Summary:** 55 commits on `main`; **52 PRs merged** (#20–#71 in this window). Component fidelity program completed; docs-site/workshop expanded to **108 stories**; density + BUE visual conformance landed; React adapter PoC, agent workflow rules, and the first real style-bridge library config shipped.

---

## 0.4.0 — 2026-07-21

Feature release working through the **remaining box-ui-elements audit items** —
the Medium/Low-severity behavioural gaps and the last net-new component left
after the 0.3.0 program. Additive — no breaking changes. 13 PRs
([#128](https://github.com/unofficialbox/box-open-elements/pull/128)–[#140](https://github.com/unofficialbox/box-open-elements/pull/140)),
now **78 components** and **1096 tests**; conformance 0 drift; pixel gate clean.

**Overlay primitive**

- **Fixed a latent `trackAnchor` bug** in `foundations/overlay`: an optional-call
  short-circuited its argument, so `anchorFloating` never ran without an
  `onReposition` callback — silently breaking fixed-coordinate positioning for
  both tooltip and popover. Split into compute-then-notify, with DOM regression
  coverage ([#128](https://github.com/unofficialbox/box-open-elements/pull/128)).

**New component**

- **`box-guide-tooltip`** — a guided-tour callout that points at a target (`for`
  id or slotted `anchor`), positioned on the overlay primitive; `heading`, body
  slot, `step`/`total` indicator, and Back/Next/Close controls emitting
  `next`/`back`/`close` with `detail.step`
  ([#140](https://github.com/unofficialbox/box-open-elements/pull/140)).

**Overlays**

- **`tooltip`** — moved onto the overlay primitive (escapes overflow, flips);
  `placement`, `theme` (default/error/callout), and a rich-content slot
  ([#128](https://github.com/unofficialbox/box-open-elements/pull/128)).
- **`dropdown`** — menu positioned on the overlay primitive with `placement`
  ([#129](https://github.com/unofficialbox/box-open-elements/pull/129)).

**Forms**

- **`select`** — `multiple` (native multi-select + `values` array, form-mirrored),
  option `group` (optgroup dividers), and per-option `disabled`
  ([#134](https://github.com/unofficialbox/box-open-elements/pull/134)).
- **`combobox`** — real ARIA listbox replacing the native datalist: type-to-filter,
  `aria-activedescendant` keyboard nav, group dividers, per-option descriptions,
  overlay-positioned popup (free-text still commits)
  ([#135](https://github.com/unofficialbox/box-open-elements/pull/135)).
- **`text-field`** — `type` passthrough, leading `icon` slot, trailing
  `loading`/`valid` status ([#132](https://github.com/unofficialbox/box-open-elements/pull/132)).
- **`search-field`** — `loading` spinner + form submission on Enter/submit
  ([#132](https://github.com/unofficialbox/box-open-elements/pull/132)).
- **`checkbox`** — `description` subsection ([#132](https://github.com/unofficialbox/box-open-elements/pull/132)).
- **`date-field`** — `clearable` + `clear()`; **`time-field`** — 12h/24h
  `setTimeString()` parsing + `parse-error`; **`radio-group`** — per-option
  `description`/`disabled` ([#133](https://github.com/unofficialbox/box-open-elements/pull/133)).
- **`category-selector`** — `max-links` overflow "More" menu (overlay-positioned)
  ([#137](https://github.com/unofficialbox/box-open-elements/pull/137)).

**Feedback**

- **`spinner`** `size`; **`chip`** status palette / `size` / `icon` slot;
  **`badge`** count semantics (`max`, `hide-when-zero`, `animate`)
  ([#130](https://github.com/unofficialbox/box-open-elements/pull/130)).
- **`alert`** & **`error-mask`** rich-content slots; **`help-text`** error role
  (`role="alert"`); **`toast`** declarative `duration`, `action` slot, wrapping
  ([#131](https://github.com/unofficialbox/box-open-elements/pull/131)).

**Collections & identity**

- **`avatar`** `badge` (online / external); **`carousel`** slotted slides;
  **`grid-view`** per-tile `tile-<value>` slot (slotRenderer parity)
  ([#136](https://github.com/unofficialbox/box-open-elements/pull/136)).
- **`datalist-item`** content slot + `active`; **`contact-datalist-item`**
  `external` marker + `subtitle`; **`draggable-list`** per-item `row-<value>`
  slot ([#138](https://github.com/unofficialbox/box-open-elements/pull/138)).

**Navigation & layout**

- **`link-button`** `target`/`rel` (auto-`noopener` for `_blank`) + rich children;
  **`accordion`** `borderless` + per-item `panel-<value>` slots
  ([#137](https://github.com/unofficialbox/box-open-elements/pull/137)).
- **`sidebar-toggle-button`** `direction` + action-aware tooltip; **`nav-sidebar`**
  grouped-nav styling hooks (`[data-nav-group]`, `<hr>`)
  ([#139](https://github.com/unofficialbox/box-open-elements/pull/139)).

---

## 0.3.0 — 2026-07-21

Feature release closing the **box-ui-elements coverage audit** (Steps 1–4): a
behavioural gap analysis of our catalog against `box/box-ui-elements`, then the
build-out. Additive — no breaking changes.

**Foundations (two force-multipliers)**

- **Viewport-aware overlay positioning** (`foundations/overlay`) — a shared
  `resolvePosition` / `anchorFloating` / `trackAnchor` primitive with flip,
  shift, and collision handling, exported for consumers building their own
  overlays. `popover` moved onto it (12 placements, no more edge-clipping)
  ([#116](https://github.com/unofficialbox/box-open-elements/pull/116)).
- **Shared form-field features** — `FormAssociatedElement` gains `required`
  (indicator + `aria-required`), `description` (help text + `aria-describedby`),
  and `hideLabel`; applied to text-field, date-field, search-field, and select
  ([#117](https://github.com/unofficialbox/box-open-elements/pull/117)).

**New components (5)**

- **`box-thumbnail-card`** — rich file/grid card with thumbnail + details slots;
  optional interactive (keyboard-activated) mode.
- **`box-badgeable`** — corner-badge wrapper (also closes the avatar badge gap).
- **`box-breadcrumb`** — file-path trail with overflow-collapse into an ellipsis.
- **`box-context-menu`** — right-click / Shift+F10 menu, cursor-anchored on the
  overlay primitive, full keyboard menu.
- **`box-table`** — semantic, selectable data table: single / Ctrl-click /
  Shift-range selection, keyboard model, and host-owned sortable headers
  ([#118](https://github.com/unofficialbox/box-open-elements/pull/118),
  [#119](https://github.com/unofficialbox/box-open-elements/pull/119),
  [#120](https://github.com/unofficialbox/box-open-elements/pull/120),
  [#121](https://github.com/unofficialbox/box-open-elements/pull/121)).

**Component upgrades (5, all backward-compatible)**

- **`box-tabs`** — real tab **panels** (`role=tabpanel`, slotted per option); it
  was previously only a tab strip.
- **`box-button`** — `is-loading` spinner, `icon` slot, and `type="submit"|"reset"`
  (form-associated).
- **`box-dialog`** — `size` (small/medium/large/fullscreen) + background
  scroll-lock.
- **`box-menu`** — item composition: section headers, separators, link items,
  and checkable items (`menuitemcheckbox`).
- **`box-pill-selector-dropdown`** — `allow-custom` turns it into a
  collaborator/email **token input**: type + Enter/comma to add, paste-to-create,
  and `pattern` validation with `invalid-entry`
  ([#122](https://github.com/unofficialbox/box-open-elements/pull/122)–[#126](https://github.com/unofficialbox/box-open-elements/pull/126)).

## 0.2.1 — 2026-07-20

Patch release: responsiveness fixes to two content-explorer pattern components.
The rest of the work in this window is docs-site only and does not ship in the
package.

- **`box-explorer-table` shrinks instead of overflowing its host.** Its nowrap
  header row gave it a wide min-content width, so it pushed out of grid/flex
  containers at narrow widths. `:host { min-width: 0 }` lets it shrink and the
  table scrolls within its own frame
  ([#110](https://github.com/unofficialbox/box-open-elements/pull/110)).
- **`box-filter-bar` reflows to one column when constrained.** Its media-query
  fallback measured the viewport, not the host (a shadow-DOM gotcha), so a narrow
  bar on a wide screen kept three columns and overflowed. Now uses zero grid
  track floors plus `min-width: 0`, keeping the three-up layout at natural width
  while compressing under constraint
  ([#110](https://github.com/unofficialbox/box-open-elements/pull/110)).

Docs site (not published): Community-brand restyle with a landing page
([#108](https://github.com/unofficialbox/box-open-elements/pull/108)); rail,
canvas-containment, VS Code code colours, and a masthead theme toggle
([#109](https://github.com/unofficialbox/box-open-elements/pull/109)); official
framework icons, beautified snippets, and per-lesson framework sections
([#111](https://github.com/unofficialbox/box-open-elements/pull/111),
[#112](https://github.com/unofficialbox/box-open-elements/pull/112)).

## 0.2.0 — 2026-07-19

First release cut through the automated OIDC release workflow (`0.1.0` was the
bootstrap publish that created the package; no functional code changed between
them). Notable work landed since the last changelog window:

- **box-ui-elements conformance program** — CI-gated on three axes: Layer 1
  geometry vs upstream SCSS, Layer 2 colour/state vs the compiled Storybook CSS
  (45 grounded claims, with a conformant-count floor), and a live-Box **webapp
  reference** covering colour, geometry, and interaction states.
- **Gallery-review component polish** — flat Box tree/tree-grid disclosure
  chevrons ([#92](https://github.com/unofficialbox/box-open-elements/pull/92)),
  grid-view/dual-listbox fill-width
  ([#93](https://github.com/unofficialbox/box-open-elements/pull/93)),
  item-details empty-avatar fix + chart-panel bar scaling
  ([#94](https://github.com/unofficialbox/box-open-elements/pull/94)), and real
  Box iconography in grid-view/nav-sidebar
  ([#95](https://github.com/unofficialbox/box-open-elements/pull/95)).
- **npm packaging** — scoped as `@unofficialbox/box-open-elements`, published
  via a provenance-attested **OIDC trusted-publishing** workflow (no token);
  planning docs purged and contributor + maintainer guides added
  ([#98](https://github.com/unofficialbox/box-open-elements/pull/98)–[#102](https://github.com/unofficialbox/box-open-elements/pull/102)).

---

## 2026-07-17 — React adapter, agent rules, and BUE style bridge

| PR | Summary |
| --- | --- |
| [#70](https://github.com/unofficialbox/box-open-elements/pull/70) | First real **style-bridge** library config: BUE Content Explorer SCSS → `box-content-explorer` / `::part(…)` + token hooks; engine hardening; `bun run style-bridge:bue-explorer`; 14 focused tests. |
| [#71](https://github.com/unofficialbox/box-open-elements/pull/71) | Git-derived three-day changelog and agent-takeover snapshot. |

Both PRs are merged on `main`; #70 passed Verify, Visual regression, and CodeRabbit before merge.

---

## 2026-07-16 — BUE visual conformance, density, motion, React, agent rules

### Merged PRs

| PR | Title |
| --- | --- |
| [#69](https://github.com/unofficialbox/box-open-elements/pull/69) | Always-on rule: recommend next step with why (`.cursor/rules/recommend-next-step.mdc`, `AGENTS.md`) |
| [#68](https://github.com/unofficialbox/box-open-elements/pull/68) | React adapter PoC: `@box-open-elements/react` + `BoxButton` + `createWebComponent` |
| [#67](https://github.com/unofficialbox/box-open-elements/pull/67) | BUE drawer + denser pattern shells via `boePanel` |
| [#66](https://github.com/unofficialbox/box-open-elements/pull/66) | BUE overlays/tabs/toast/alert/badge/avatar/error-mask via `boeOverlay` |
| [#65](https://github.com/unofficialbox/box-open-elements/pull/65) | BUE visual conformance P0: geometry tokens + everyday controls |
| [#64](https://github.com/unofficialbox/box-open-elements/pull/64) | Full density peer-consistency pass + Foundations markdown tables |
| [#63](https://github.com/unofficialbox/box-open-elements/pull/63) | Motion vocabulary migration + explorer list/table presentation |
| [#62](https://github.com/unofficialbox/box-open-elements/pull/62) | Full catalog density audit — segmented-control chrome bands |
| [#61](https://github.com/unofficialbox/box-open-elements/pull/61) | Density + demo fidelity pass for docs-site surfaces |
| [#60](https://github.com/unofficialbox/box-open-elements/pull/60) | Explorer metadata-query host chrome + workshop adapter stories |
| [#59](https://github.com/unofficialbox/box-open-elements/pull/59) | Workshop batch 5: stories **64 → 101** |
| [#58](https://github.com/unofficialbox/box-open-elements/pull/58) | Docs-site Preview build-along lesson |
| [#57](https://github.com/unofficialbox/box-open-elements/pull/57) | Docs-site Share build-along lesson |
| [#56](https://github.com/unofficialbox/box-open-elements/pull/56) | Workshop batch 4: stories **49 → 64** |
| [#55](https://github.com/unofficialbox/box-open-elements/pull/55) | Explorer host chrome demo (filter-bar, saved views, list/table swap) |
| [#54](https://github.com/unofficialbox/box-open-elements/pull/54) | Coverage baseline gate + reactivate deferred foundations work |

### Highlights

- **Geometry foundations:** `boeOverlay`, `boePanel`, control sizing aligned to box-ui-elements BDL (`docs/foundations/geometry.md`).
- **Motion:** shared `boeMotionDuration` / `interactive` (140ms); maintainer script `tools/migrate-motion-literals.ts`.
- **Density:** `tools/density-audit.ts`, `tools/apply-density-consistency.ts`, report in `tmp/density-audit-report.json`.
- **Coverage gate:** `bun run verify` now runs coverage with floors — see `docs/coverage-baseline.md`.
- **Workshop:** extracted story count **108** (catalog parity including explorer adapters).
- **Build-alongs:** Explorer, Share, and Preview lessons in `docs-site/lessons.ts`.

---

## 2026-07-15 — Fidelity batches finish, explorer, docs-site, workshop, tooling

### Merged PRs

| PR | Title |
| --- | --- |
| [#53](https://github.com/unofficialbox/box-open-elements/pull/53) | Docs sync after workshop batch 3 |
| [#52](https://github.com/unofficialbox/box-open-elements/pull/52) | Workshop batch 3: JSON options/items (**34 → 49** stories) |
| [#51](https://github.com/unofficialbox/box-open-elements/pull/51) | Docs sync after #49 and #50 |
| [#50](https://github.com/unofficialbox/box-open-elements/pull/50) | Agent CI polling + stuck-run cancel/retry guidance |
| [#49](https://github.com/unofficialbox/box-open-elements/pull/49) | Workshop status sync + expand to **34** stories |
| [#48](https://github.com/unofficialbox/box-open-elements/pull/48) | Workshop guidance stories for docs-site Usage cards |
| [#47](https://github.com/unofficialbox/box-open-elements/pull/47) | Brand imagery closed (Blueprint + box-ui-elements vectors) |
| [#46](https://github.com/unofficialbox/box-open-elements/pull/46) | Token consumption vs shell guidance + API-tab inventory |
| [#45](https://github.com/unofficialbox/box-open-elements/pull/45) | Iconography generator (`bun run icons:generate`) |
| [#44](https://github.com/unofficialbox/box-open-elements/pull/44) | Docs-site Usage / Best practices / Keyboard guidance cards |
| [#43](https://github.com/unofficialbox/box-open-elements/pull/43) | Explorer search + enriched item columns + UI chrome |
| [#42](https://github.com/unofficialbox/box-open-elements/pull/42) | Design-heavy fidelity leftovers (popover, tooltip, gestures, layout) |
| [#41](https://github.com/unofficialbox/box-open-elements/pull/41) | Medium/low fidelity audit nits |
| [#40](https://github.com/unofficialbox/box-open-elements/pull/40) | Batch 7: multi-value form association + skeleton short-circuit |
| [#39](https://github.com/unofficialbox/box-open-elements/pull/39) | Batch 5: form association + invalid state |
| [#38](https://github.com/unofficialbox/box-open-elements/pull/38) | Batch 4: ARIA keyboard nav + heading semantics |
| [#37](https://github.com/unofficialbox/box-open-elements/pull/37) | Docs sync after Batches 0–3/6 |
| [#35](https://github.com/unofficialbox/box-open-elements/pull/35) | Batch 3: focus-visible + hover/active/disabled helpers |
| [#33](https://github.com/unofficialbox/box-open-elements/pull/33) | Batch 1 complete: all catalog/pattern elements on `BaseElement` |
| [#32](https://github.com/unofficialbox/box-open-elements/pull/32) | Form/action components → `BaseElement` architecture |
| [#31](https://github.com/unofficialbox/box-open-elements/pull/31) | Batch 1: render helper + focus/input fidelity (button, checkbox, radio-group) |

### Fidelity program (completed)

| Batch | Scope |
| --- | --- |
| 0 | Security: 3 injection/XSS fixes (link-button, skeleton, content-explorer) |
| 1 | `BaseElement` render contract across full catalog |
| 2 | Dark-mode `color-mix(…, white)` → token surfaces (94 files) |
| 3 | Shared interaction-state CSS helpers |
| 4 | ARIA/keyboard + native heading semantics |
| 5 | `FormAssociatedElement` on 13 everyday controls |
| 6 | `title` → `heading`, broken examples, token labels |
| 7 | Multi-value form association polish |
| + | Medium/low nits (#41), design-heavy leftovers (#42) |

Audit driver scored 109 components against the reference.

---

## 2026-07-14 — CI, deploy, fidelity audit kickoff, build-alongs

### Merged PRs (#21–#30)

Infrastructure and early fidelity work shipped via the design-system rebuild series:

| PR | Theme |
| --- | --- |
| #21–#28 | Storybook workshop, docs-site shell, build-along scaffolding, theming QA |
| [#29](https://github.com/unofficialbox/box-open-elements/pull/29) | Fidelity Batches 0, 2, 6 + audit follow-ups |
| [#30](https://github.com/unofficialbox/box-open-elements/pull/30) | GitHub Pages deploy (`bun run site:build` → `docs-site/dist`) |

### Highlights

- **Component fidelity audit** harness + report (all 109 components).
- **CI visual regression:** pinned Playwright container, pixel-diff gate (`bun run test:regression:pixel`).
- **Docs-site:** deployable static site, variant dropdown, in-shell foundation markdown, Explorer build-along lesson.
- **Design QA:** token-driven focus rings and status pills.

---

## Contributors (git shortlog, 2026-07-14 – 2026-07-17)

| Commits | Author |
| ---: | --- |
| 34 | Kyle @ Unofficial Box |
| 16 | Cursor Agent |
| 5 | cursor[bot] |

---

## Verification commands (unchanged)

```bash
bun run verify          # typecheck + coverage-gated tests + build
bun run test:regression:pixel   # CI pixel gate locally (Docker)
bun run style-bridge:bue-explorer   # BUE Content Explorer bridge
```

See `AGENTS.md`, `BACKLOG.md`, and `docs/HANDOFF.md` for ongoing orientation.
