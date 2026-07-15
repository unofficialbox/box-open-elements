# Docs Site v1 ExecPlan

## Purpose / Big Picture

After this change, the repo has a runnable component-documentation site (`bun run docs` → http://localhost:4600) implementing the validated IA from `docs/workshop/docs-site.md`: a three-tab rail (Foundations / Components / Patterns) with search and category counts, per-component pages with Preview / Code / API / Accessibility tabs, live Events and Properties inspector panels, and live Foundations pages for design tokens and iconography. Every one of the 86 catalog surfaces is reachable in the sidebar.

## Progress

- [x] Catalog registry (`docs-site/registry.ts`) — all 55 components + 31 pattern surfaces with tier/category/tag
- [x] Curated example map (`docs-site/examples.ts`) — usage-first HTML snippets plus property setup, including mock-transport explorer wiring
- [x] Shell (`index.html`, `styles.css`, `main.ts`) — rail tabs, search, counts, hash routing, copy-link, version footer
- [x] Component pages — Preview/Code/API/Accessibility tabs; Events panel (shared event vocabulary listener); Properties panel (attribute reflection via MutationObserver); API tables from runtime `observedAttributes` and shadow-DOM `part` scan; roles detected for the Accessibility tab
- [x] Foundations pages — live token swatch grid (Surface/Text/Stroke) from the registered bundle; icon gallery from the generated manifest + aliases
- [x] Bun server (`docs-site/server.ts`) — bundles the app with the library external, served from `/dist` via an import map (the site consumes the package like a consumer)
- [x] `docs`, `docs:typecheck`, `docs:shots` scripts; screenshots under `docs/screenshots/docs-site/`
- [x] `bun run verify` and `bun run docs:typecheck` green
- [x] Preview device-size toolbar (Full / Tablet / Mobile) and a Related-links section from real catalog data (follow-up increment)
- [x] Real dark theme: `box-dark` foundations token bundle + rail-footer toggle that swaps the active design system and re-applies tokens (follow-up increment)

## Surprises & Discoveries

- Runtime introspection covers most reference-page needs without authored metadata: `observedAttributes` gives the attribute table, a shadow-DOM scan gives styling hooks (`part`) and ARIA roles, and a MutationObserver gives the live Properties panel. Only examples need curation.

## Decision Log

- Decision: Light theme only in v1; dark mode deferred until dark token values exist.
  Rationale: The "no invented placeholder content" rule — a dark toggle without dark tokens would fake it.
  Date/Author: 2026-07-11 / Claude
  Superseded: a genuine `box-dark` token bundle was added to foundations, so the docs-site dark toggle now swaps real tokens rather than faking it. This also gives the library a real dark theme (the reference repo only faked dark at the demo-CSS tier).

- Decision: The Events panel listens for the shared event vocabulary from `docs/api-guidelines.md` on the preview canvas rather than per-example wiring.
  Rationale: One mechanism covers every page honestly; events that fire are real.
  Date/Author: 2026-07-11 / Claude

- Decision: The app imports the library via an import map (`box-open-elements` → `/dist/index.js`) with the bundle treating it as external.
  Rationale: The docs app must consume the package boundary like a real consumer (carried rule from the predecessor's demo).
  Date/Author: 2026-07-11 / Claude

## Outcomes & Retrospective

Shipped: working docs site v1 with 88 reachable pages (86 catalog surfaces + 2 foundations pages), live inspectors, and runtime-derived API reference. Follow-on increments since v1 (also shipped): device-size preview toolbar, Related-links cards, real `box-dark` toggle, Storybook-backed variant dropdown, markdown foundation docs in-shell, GitHub Pages deploy, containerized screenshot pixel-diff CI, and Usage/Best-practices/Keyboard guidance cards (workshop meta + role-mapped a11y bullets; empty cards omitted — see `plans/docs-site-guidance-cards.md`).

## Context and Orientation

- App root: `docs-site/` (registry, examples, shell, server, own tsconfig with a `box-open-elements` path map)
- Screenshots: `bun run docs:shots` → `docs/screenshots/docs-site/`
- Direction doc: `docs/workshop/docs-site.md`

## Validation and Acceptance

- `bun run docs` serves the site; all rail entries navigate; previews render; inspectors update live
- `bun run verify` (unchanged library) and `bun run docs:typecheck` pass
- Screenshots captured with zero page errors

## Idempotence and Recovery

The app is self-contained under `docs-site/`; rebuild any time with `bun run docs`.

## Interfaces and Dependencies

- Depends on root exports (`defineBox*Element` naming convention drives auto-definition), `boxDefaultDesignSystem`, `boxIconography(Aliases)`, `resolveDesignIcon`, `applyDesignTokens`, `ContentExplorerController`.
- `docs-site/registry.ts` must stay synchronized with the catalogs when new surfaces land.
