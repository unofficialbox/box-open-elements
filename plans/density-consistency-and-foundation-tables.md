# ExecPlan: Density consistency + foundation markdown tables

## Purpose / Big Picture

Users still see density inconsistencies across the catalog after the absolute “fat” pass (#62). Absolute highs are already 0; remaining problems are **same-role variance** (dialog vs share-modal, camp-A vs camp-B shells, menu-item vs button hit targets, list-row peers). Separately, Foundations docs tables render as pipe-text paragraphs because docs-site `renderMarkdown` has no GFM table support.

## Progress

- [x] Branch `cursor/density-audit-and-foundation-tables-7eb7`
- [x] Add GFM table support to docs-site markdown + prose table CSS + tests
- [x] Upgrade `tools/density-audit.ts` with peer-variance / role bands reporting
- [x] Apply P0–P1 density consistency rewrites (overlays, feedback, forms, actions, pattern shells, list rows)
- [ ] Update style assertions; re-audit; `bun run verify`; regen baselines; PR

## Surprises & Discoveries

- Current audit: `high=0 med=5 low=14` — leftover meds are intentional-airy dialog/drawer/empty/error.
- Foundation `.md` tables are valid GFM; docs-site mini-parser emits each pipe row as `<p>`.
- Peer variance (not absolute fat) is what still reads as inconsistent.

## Decision Log

- **Canonical bands**
  - Overlay/modal shell pad: `0.75rem`, radius `0.7–0.75`
  - Feedback empty/error: pad `0.75rem`, radius `0.7` (match alert/card band)
  - Form text controls: pad `0.45rem 0.7rem`, radius `0.7`
  - Pattern shells: pad `0.7rem`, radius `0.7` (fold camp B up)
  - List rows: pad `0.5rem 0.65rem`, radius `0.6`, font `0.9rem`
  - Icon hit target: `2rem` square
  - Panel titles: `1.1rem`; card/metric titles: `1.05rem`; display values stay `1.35rem`
- **Keep:** pill `999px`, chart stage geometry, chevron trailing gutters, badge/chip size hierarchy.
- **Tables:** dependency-free GFM tables in `renderMarkdown`; style via `.prose table` (reuse api-table look lightly).

## Outcomes & Acceptance Tests

- Foundations pages render real `<table>` elements (tokens/theming/brand/a11y/motion).
- Density audit: high=0; med chrome leftovers only if documented; peer-variance report shows fewer distinct pad/radius camps for same roles.
- Style tests updated; `bun run verify` green; pixel baselines regen’d.

## Concrete Steps

1. Extract/extend markdown renderer with tables; CSS; unit tests.
2. Extend density audit (role tags + variance summary) and refresh report JSON.
3. Batch CSS rewrites for P0/P1 files; update tests asserting old values.
4. Re-audit → verify → baselines → docs/BACKLOG/HANDOFF → PR.

## Validation & Observability

| Check | Command |
| --- | --- |
| Markdown tables | `bunx vitest run test/docs-site/markdown.test.ts` |
| Density | `bun tools/density-audit.ts` |
| Full gate | `bun run verify` |
| Pixels | `bun run baselines:regen` |

## Docs to update

- `BACKLOG.md` density section
- `docs/HANDOFF.md` tip
- This ExecPlan Progress
