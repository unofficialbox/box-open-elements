# Changelog

Work merged to `main` and notable in-flight changes for **2026-07-14 through 2026-07-17** (past 3 days from 2026-07-17).

Generated from git: `git log main --since="2026-07-14" --until="2026-07-18"`.

**Summary:** 55 commits on `main`; **52 PRs merged** (#20–#71 in this window). Component fidelity program completed; docs-site/workshop expanded to **108 stories**; density + BUE visual conformance landed; React adapter PoC, agent workflow rules, and the first real style-bridge library config shipped.

---

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
