# ExecPlan: Box design-fidelity reconciliation

## Purpose / Big Picture

Raise the entire rendered catalog from a structurally complete prototype to a coherent, professional Box product surface. After this plan is complete, every foundation, component, and pattern will use one reference-backed visual grammar. A contributor will be able to compare deterministic state specimens and realistic workflow compositions against measured current Box behavior instead of judging isolated default examples by memory.

The implementation preserves the repository's framework-agnostic, headless-first architecture. It changes visual foundations, component CSS/anatomy, pattern composition, docs specimens, and visual tests. It does not move transport into components or replace controller contracts with framework-specific state.

## Progress

- [x] Audit the authenticated current Box folder, navigation, toolbar, search, rows, menu, Sharing/Details tabs, and Share dialog with rendered and computed-style evidence.
- [x] Audit BUE `src/` at commit `c5e0f55a948f3ff2532d8012b60506784ebdfa2b` and map local catalog entries to direct or nearest analogues.
- [x] Inventory all 8 documented foundations, 72 registered components, 36 registered rendered patterns, and nonvisual headless pattern families.
- [x] Record an exact per-entry comparison and remediation in `docs/audits/box-design-fidelity-reconciliation.md`.
- [x] Slice 0: lock the current-Box visual grammar and build reference/state specimens.
- [ ] Slice 1: implement semantic typography, geometry, elevation, surface, icon, and interaction recipes.
  - [x] Slice 1a: establish the Inter typography foundation, pin the docs/test font asset, and migrate all 107 rendered hosts to the base font token.
  - [ ] Slice 1b: reconcile geometry, elevation, surface, icon, and interaction roles.
- [ ] Slice 2: reconcile high-frequency actions, fields, option rows, navigation, and overlays.
- [ ] Slice 3: reconcile collections and the complete Content Explorer composition.
- [ ] Slice 4: reconcile Share, Item, Metadata, Preview, Search, and workflow patterns.
- [ ] Slice 5: reconcile remaining specialized forms, feedback, task, governance, file request, and insights surfaces.
- [ ] Run full behavioral, accessibility, coverage, build, density, and pixel verification for every slice.
- [ ] Update this plan, the audit, catalogs, backlog, handoff, and baselines after each merged slice.

## Surprises & Discoveries

- The problem is not primarily the color palette. The default brand, text, and selected colors already match current Box closely; geometry, typography, elevation, icon usage, anatomy, and composition do not.
- Foundations combine incompatible generations: current Box colors, legacy BUE overlay geometry, and locally invented soft-card recipes. Individual components then introduce additional raw values.
- Current Box uses a clear hierarchy of 32/40/48px controls, 12px item corners, 20px menus, and 24px dialogs. The local shared geometry has 8px menus and 12px dialogs while many components independently use 0.55–1rem.
- Current Box surfaces are mostly flat. Thirty local sources use gradients and 20 use literal-white mixes/highlights, which creates a glossy visual generation with no production reference.
- The generated icon inventory is strong, but rendered controls often bypass it with text glyphs or CSS shapes.
- The existing density audit reports zero high/medium findings while the catalog remains visibly inconsistent. It detects numeric outliers, not reference fidelity.
- The existing screenshot gate is strict but usually captures resting examples inside a custom gallery shell. A passing pixel test can preserve the wrong design indefinitely.
- Deterministic pseudo-state captures must wait for the known 140ms component transition to settle. The first strict run caught a focus capture at `0.106%` pixel drift against the `0.100%` threshold; a 250ms post-state settle made all 21 gallery baselines stable.
- Some high-risk defects are structural, not cosmetic: `tree-grid` does not consume its own column/depth variables, tooltip content reflows layout, and several animated components replace the DOM node that was meant to animate.
- The previous screenshot harness substituted DejaVu Sans for both Inter and Lato, so passing visual baselines did not validate the product typeface. The deterministic harness now embeds the same pinned Inter Variable asset used by the docs site.
- At a 390px viewport, the docs shell is 604px wide. This predates the typography work and is tracked separately so the Inter slice does not hide a responsive-shell repair.

## Decision Log

- **Decision:** Current authenticated Box is the appearance oracle; BUE supplies anatomy/behavior and fills unobserved gaps.
  **Rationale:** BUE contains multiple legacy visual generations, while the user explicitly wants parity with both BUE quality and the current Box product.
  **Date/Author:** 2026-07-17 / Codex

- **Decision:** Rebuild shared role recipes before performing a catalog-wide CSS cleanup.
  **Rationale:** Searching and replacing radii or colors would preserve the underlying inconsistency. Buttons, rows, fields, navigation, and overlays intentionally use different measured geometry.
  **Date/Author:** 2026-07-17 / Codex

- **Decision:** Treat light Box as the required fidelity target and dark as experimental until it has an authoritative reference.
  **Rationale:** The shipped dark palette is an invented analogue and cannot be claimed as Box parity. Token discipline should still prevent regressions.
  **Date/Author:** 2026-07-17 / Codex

- **Decision:** Use `InterVariable`/Inter as the authoritative repository typeface and remove Lato from runtime fallback stacks.
  **Rationale:** Box is moving from Lato to Inter. The inspected live enterprise surface still computed to Lato, so its measurements inform size, weight, and line-height, but Lato is recorded as legacy source evidence rather than a repository fallback. The package exposes tokens and does not force consumers to download a font; the docs site and deterministic visual harness pin the official Inter Variable asset.
  **Date/Author:** 2026-07-17 / Codex

- **Decision:** Preserve custom-element names, public attributes/events, controller contracts, package exports, and transport boundaries.
  **Rationale:** The audit identifies presentation and composition defects. Public API churn is neither necessary nor justified unless a structural accessibility defect requires a narrowly documented correction.
  **Date/Author:** 2026-07-17 / Codex

- **Decision:** Require both isolated state specimens and realistic workflow compositions.
  **Rationale:** Isolated examples reveal component states; workflow compositions reveal hierarchy, density, nesting, and whether patterns invent incompatible local design language.
  **Date/Author:** 2026-07-17 / Codex

- **Decision:** Stop using “catalog complete” or “fidelity complete” to describe visual readiness until every audit row is closed.
  **Rationale:** Presence in the registry and passing tests prove availability, not professional visual parity.
  **Date/Author:** 2026-07-17 / Codex

## Outcomes & Retrospective

The exhaustive comparison, implementation design, Slice 0 visual reference harness, and Slice 1a typography foundation are complete. All 107 rendered component/pattern hosts now consume the base font token; default and dark bundles use Inter without a Lato fallback; and docs plus visual tests use one pinned Inter Variable asset. Component-level type-role migration and the rest of the visual reconciliation remain open. Implementation should continue as reviewable family slices, each backed by the dated reference contract, deterministic states, and before/after images.

Update this section after each slice with surfaces closed, exact commands/checks, changed baselines, remaining rows, and any measured rule that replaced an initial assumption.

## Context and Orientation

The canonical rendered inventory is `docs-site/registry.ts`: 72 components and 36 patterns. Component source lives under `src/components/`; composed visual workflows live under `src/patterns/`; headless contracts/controllers remain alongside those patterns and in core. The complete row-by-row target is `docs/audits/box-design-fidelity-reconciliation.md`.

Start with:

- `src/foundations/tokens/{box-defaults,box-dark,registry,types,interaction}.ts` for colors, fonts, theme registration, and shared interaction CSS.
- `src/foundations/geometry/tokens.ts` for the current mixed legacy geometry.
- `src/foundations/motion/tokens.ts` and `src/foundations/icons/` for motion and generated Box assets.
- `docs/foundations/{tokens,theming,geometry,motion,iconography,brand,accessibility}.md` for the public foundation contracts.
- `src/components/actions/`, `forms/`, `collections/`, `navigation/`, and `overlays/` for the primitives that cause the widest downstream drift.
- `src/patterns/content-explorer/`, `share/`, `item/`, `metadata/`, and `preview/` for the highest-value product compositions.
- `docs-site/`, `tools/preview/`, `test/components/`, `test/patterns/`, and `test/foundations/` for specimens and verification.
- `docs/audits/component-fidelity-audit.data.json` for older code/state/a11y findings. It is evidence, not proof that visual work is complete.

The implementation tiers are Foundations → Components → Patterns → docs site/test tooling. Core/controller and server-integration tiers remain stable except where a semantic state is genuinely missing.

## Plan of Work

### Slice 0: reference lock and visual harness

Create a repo-owned reference manifest under `docs/audits/` or `tools/preview/` that records the measured Box roles used by implementation: typography, 32/40/48 controls, field/search/button anatomy, list rows, navigation, menus, dialogs, tabs, toggles, separators, and state combinations. Store source URL/context and date; do not embed credentials or proprietary page content.

Add deterministic catalog routes/specimens for rest, hover, focus-visible, active/pressed, selected/current, checked, expanded, disabled, loading, empty, error, and combinations such as selected+focus. Add realistic light-mode compositions for Files/Content Explorer, Sharing, Details/Metadata, Preview, and representative forms. Remove or neutralize gallery styling that changes component typography/surfaces.

Do this before broad restyling so every subsequent slice has visible acceptance evidence.

### Slice 1: foundations

Replace the untyped visual free-for-all with typed semantic roles while keeping existing color custom properties compatible. Add typography roles for page/overlay/section headings, body, label, metadata, and button/menu text. Add spacing and role geometry for controls, fields, rows, navigation, menus, dialogs, cards only where reference-backed, and focus rings. Add neutral border/elevation roles matching the shallow live shadows.

Define composition helpers for primary/secondary/quiet/icon buttons, fields, option rows, navigation rows, tabs, menu shells/items, dialogs, and side panels. Do not create a universal radius or universal selected style. Migrate literal-white mixes, raw rgba elevation, and gradients only through reviewed family slices.

Add lint/audit checks that detect unapproved gradients, literal theme colors, text glyph iconography, raw shadows, and geometry outside the role recipes. The checks should support explicit documented exceptions rather than encourage obfuscated CSS.

### Slice 2: high-frequency primitives

Reconcile actions (`button`, `button-group`, `icon-button`, `link-button`, `menu`, `menu-item`, `segmented-control`), canonical fields (`text-field`, `text-area`, `select`, `search-field`, `checkbox`, `checkbox-group`, `radio-group`, `switch`, `combobox`, `dropdown`, `multi-select`, `tag-input`), navigation (`tabs`, `nav-sidebar`), and overlays (`dialog`, `popover`, `tooltip`, `drawer`).

Use generated Box icons, exact role sizes/type, flat surfaces, and independent interaction states. Fix tooltip top-layer positioning and stable-node motion where necessary. Add focused semantic/accessibility tests plus screenshots for every state matrix before moving downstream.

### Slice 3: collections and Content Explorer

Reconcile `card`, `grid-view`, `datalist-item`, `contact-datalist-item`, `draggable-list`, `pagination`, `tree`, and `tree-grid`. Fix tree-grid layout structurally. Then rebuild the visual shell for all seven Content Explorer entries around the existing controllers/adapters: measured search/title/breadcrumb/toolbar, 56px list/table rows, hover elevation, selected surface/boundary, file icon/metadata/action anatomy, loading/empty/error states, grid/list/table variants, sidebar composition, and responsive behavior.

The underlying explorer navigation, selection, collection, and action contracts remain headless. Visual adapters may gain semantic slots/parts, but transport must not enter the component tier.

### Slice 4: core product workflows

Reconcile Search, Item, Metadata, Share, and Preview patterns. Build Share dialog/sidebar from measured current Box geometry. Build Details/Metadata on the reconciled drawer/tabs/section/field primitives. Make Preview a real provider-backed canvas/chrome composition instead of a placeholder shell; include loading, rendered, unsupported, error, annotation, sidebar, and fullscreen states.

Do not let patterns invent new buttons, pills, cards, menus, headings, fields, or overlay shadows. If a missing primitive is discovered, add it to the owning component/foundation family with a reference and tests.

### Slice 5: remaining catalog

Complete Feedback, Files, specialized Forms, Identity, Layout, remaining Navigation/Visuals, File Request, Task, Governance, and Insights. For surfaces without a direct BUE/live analogue, derive them from the approved shared grammar and inspect the nearest current Box workflow before implementation. Analytics must establish an approved data-visualization palette and accessible table alternative; it must not retain generic starter-dashboard shadows/colors.

Update the audit row as each surface is accepted. “No direct analogue” rows still require visual review and regression coverage.

### Slice 6: convergence and documentation

Remove obsolete CSS recipes after all consumers migrate. Update foundation docs, component/pattern catalogs, migration map only if classification/public surface changes, `BACKLOG.md`, `docs/HANDOFF.md`, and this plan. Regenerate reviewed baselines in the pinned container and run the full repository contract. Record any intentional divergence from current Box with rationale.

## Concrete Steps

Run from `/Users/massnerder/Developer/Code/box-open-elements`.

1. Confirm the slice and inventory:

   ```sh
   git status --short --branch
   bun tools/density-audit.ts
   rg -n "linear-gradient|color-mix\([^;]*white|rgba\(|border-radius: 999px|font-size: 0\." src/components src/patterns
   ```

   Expected: only the active family is edited; the scan establishes intentional remaining debt, not an automatic replacement list.

2. Run the narrow tests for the family while editing:

   ```sh
   bunx vitest run <matching test files under test/foundations, test/components, or test/patterns>
   bun run docs:typecheck
   bun run typecheck
   ```

   Expected: semantic behavior remains green and docs examples compile.

3. Capture and inspect the active family in the docs site:

   ```sh
   bun run docs
   bun run baselines:regen
   bun run test:regression:pixel
   ```

   Expected: isolated state matrices and realistic compositions exist; changed pixels are intentional and reviewed; strict regression passes.

4. Run the broad contract before every PR/merge slice:

   ```sh
   bun run test
   bun run test:coverage
   bun run build
   bun run verify
   git diff --check
   ```

   Expected: all checks pass and coverage stays above repository floors.

5. Update reconciliation status and monitor CI:

   ```sh
   gh pr checks <number>
   ```

   Expected: Verify, Visual regression, and CodeRabbit are green. Follow `AGENTS.md` polling/cancel/rerun rules rather than leaving a pending or failed PR.

## Validation and Acceptance

The program is accepted only when:

- The exhaustive audit still resolves to exactly 72 component rows and 36 rendered-pattern rows, and every row is marked reconciled with evidence.
- Every visual component consumes approved role recipes or records a narrow reference-backed exception.
- Current Box measurements are reproduced for the inspected high-signal roles: 32/40/48 controls, 40px menu items, 56px file rows, 20px menu shells, 24px dialogs, flat buttons, underline tabs, and canonical row states.
- No product control uses text glyphs in place of generated Box icons.
- Unapproved gradients, literal-white theme mixes, raw colored elevation, arbitrary micro-type, and pattern-invented primitives are removed.
- Each interactive surface has deterministic rest/hover/focus/active/selected-or-checked/disabled coverage as applicable.
- Files/Content Explorer, Share, Details/Metadata, Preview, and forms are manually compared in-browser to the reference workflow at supported viewports.
- Headless contracts, events, ARIA, form association, controller boundaries, package exports, and framework-neutral behavior remain stable or have an explicitly reviewed change.
- `bun run verify` and the pinned-container pixel gate pass; required CI checks are green.

“Looks better,” registry presence, density-audit success, or default-state screenshots alone are not acceptance criteria.

## Idempotence and Recovery

Tests, typecheck, build, verify, source scans, and pixel comparison are safe to rerun. `bun tools/density-audit.ts` rewrites `plans/density-audit-report.json`; retain it only when it describes the intended tree. `bun run baselines:regen` rewrites committed images; run it after a family is stable, inspect every changed image, then run the strict gate.

Migrate one role family at a time. Keep old exports as compatibility aliases until all consumers are moved. If a shared recipe causes broad regressions, restore the prior recipe through a reviewable patch and resume with a narrower opt-in role; do not reset the dirty worktree or hand-edit generated screenshots.

If current Box changes during the program, remeasure the affected role, update the dated reference manifest and decision log, then deliberately regenerate only dependent baselines.

## Artifacts and Notes

Audit snapshot on 2026-07-17:

- BUE source: commit `c5e0f55a948f3ff2532d8012b60506784ebdfa2b`; 5,143 files under `src/`, including 379 CSS/SCSS files.
- Local rendered inventory: 108 entries = 72 components + 36 patterns.
- Local source signals: 105/108 use raw rem geometry; 30 gradients; 20 literal-white mixes/highlights; 33 raw rgba users; 47 pill-radius users; only 48 geometry imports.
- Live Box: search `520×48/r24`; primary/secondary buttons `40px/r20`; compact button `32px/r20`; file row `56px/r12`; menu `251px/r20`, items `225×40/r12`; Share dialog `480px/r24`; toggle `44×24`.
- Current local geometry: controls 32/40px, but legacy overlay radius 8px and modal radius 12px. This mismatch is deliberate evidence for role-token replacement.
- Density scan: 117 element files, zero high/medium flags, eight low flags, 11 peer-variance camps. It is retained as a secondary consistency tool, not the fidelity oracle.
- Slice 0 artifacts: `tools/preview/box-visual-reference.json`, `docs/audits/box-visual-reference.md`, and `tools/preview/state-matrix.html`.
- State baselines: nine pinned-container PNGs cover action rest/hover/focus, row rest/hover/focus, persisted selection, fields, and a 390px mobile composition.
- Browser QA: desktop and `390×844` mobile passed page identity, meaningful DOM, console health, no horizontal overflow, and a Details-tab selection interaction (`aria-selected="true"`).
- Verification: `test/tools/visual-reference.test.ts` passes and the pinned strict pixel gate reports gallery `21/21` plus docs-site `17/17` healthy.

## Interfaces and Dependencies

Keep stable unless this plan is explicitly amended:

- Existing design-system registration/activation APIs and current `--boe-token-*` color/font properties.
- Custom-element names, observed attributes, properties, slots/parts where public, events, ARIA roles/states, and form association.
- Headless Content Explorer, Share, Preview, Metadata, Item, Search, Task, Governance, File Request, and Insights controllers/contracts.
- Foundations → Components → Patterns taxonomy, wildcard package exports, and transport-free component boundary.
- Generated Box icon/illustration manifest and its generator workflow.
- Vitest coverage floors, docs-site typecheck, Playwright/pixelmatch tooling, pinned visual-regression container, and CI monitoring contract.

New foundation roles should be typed exports and CSS custom properties with compatibility aliases. Avoid a new runtime dependency unless the implementation proves that existing platform and repository tooling cannot satisfy overlay positioning or another specific requirement.

Plan update note (2026-07-17): replaced the narrow light-mode state plan after user review clarified that the target is exhaustive professional parity across every foundation, component, and pattern, not a bounded selected-state cleanup. Slice 0 then added the dated machine-readable reference contract, deterministic state matrix, responsive browser QA, and pinned pixel baselines.
