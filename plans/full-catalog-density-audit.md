# ExecPlan: Full catalog density audit

## Purpose / Big Picture

Bring every catalog component and pattern shell to **segmented-control density** so the docs site no longer reads as inconsistently oversized. After this, padding/radius/gaps/titles sit in shared bands, verified by the density audit script + style tests + pixel baselines.

See live: docs-site previews across the rail; `bun tools/density-audit.ts` should drop high/med chrome hits sharply.

## Progress

- [x] Branch `cursor/full-catalog-density-audit-7eb7` from `main`
- [x] Inventory script `tools/density-audit.ts` + report `plans/density-audit-report.json`
- [x] Apply chrome density pass (components + patterns), excluding intentional content geometry
- [x] Update BACKLOG / HANDOFF; chrome-aware audit thresholds
- [ ] `bun run verify` + `bun run baselines:regen` + PR

## Surprises & Discoveries

- Prior #61 pass fixed the user-reported list; **70/118** element files still trip fat thresholds (mostly pattern shells + overlays + collections).
- Many “high” hits are **content geometry** (chart bar heights, illustration glyph boxes, carousel stage min-size) — exclude those from chrome rewrites.
- Metric/chart summary font sizes are data display, not chrome titles — tighten toward ~1.35rem, not 1.05rem.

## Decision Log

- **Reference:** `box-segmented-control` — control `gap/padding 0.25rem`, radius `0.75rem`; segment `padding 0.45em 1em`, radius `0.55rem`.
- **Chrome bands:** shell pad `0.6–0.75rem`, radius `0.65–0.75rem`, gaps `0.45–0.6rem`, section titles `1.05–1.15rem`.
- **Exclude:** `min-block-size`/`block-size` used for charts, illustrations, list panes, drop-zone drop targets (trim chrome only).
- **Pills (`border-radius: 999px`)** stay; not scored as fat radius.
- **Do not invent** new demos/content — density only.

## Outcomes & Acceptance Tests

- Re-run `bun tools/density-audit.ts`: high chrome hits on shell pad/radius/gap/title sharply reduced; remaining highs are documented content geometry.
- Targeted style tests updated where they assert old fat values.
- `bun run verify` green.
- Pixel baselines regenerated for intentional visual change.

## Concrete Steps

1. Map report → rewrite rules (pad/radius/gap/title).
2. Batch-edit pattern shells (share, item, insights, search, metadata, preview, explorer, file-request/task/governance already partly done).
3. Batch-edit components (overlays, collections, feedback empty/error, calendar, drop-zone chrome, app-shell).
4. Re-audit; fix leftovers.
5. Verify + baselines + PR; update `BACKLOG.md` / `docs/HANDOFF.md` one-liners.

## Idempotence & Recovery

- Density audit script is read-only; rewrites are CSS value swaps — re-run audit to detect leftovers.
- If pixel noise is too broad, regen all baselines in container (`bun run baselines:regen`).

## Interfaces & Data Structures

- No public API / export changes.
- Optional: keep `tools/density-audit.ts` as a maintainer check (not CI-gated this PR unless cheap).

## Validation & Observability

| Check | Command |
| --- | --- |
| Audit | `bun tools/density-audit.ts` |
| Targeted tests | `bun run test -- test/components test/patterns` (or verify) |
| Full gate | `bun run verify` |
| Pixels | `bun run baselines:regen` |

## Docs to update

- `BACKLOG.md` — note density audit pass
- `docs/HANDOFF.md` — current state tip
- This ExecPlan Progress checkboxes

## Plan of Work

1. Codemod-style passes for common fat chrome literals across `src/components` + `src/patterns`.
2. Hand-fix outliers (dialog/drawer/illustration/carousel) where values are structural.
3. Re-audit → tests → verify → baselines → PR.

## Milestone Roadmap

1. **Audit frozen** — report committed under `plans/`.
2. **Chrome pass landed** — fat shell tokens within bands.
3. **CI green** — verify + pixel + merge-ready PR.

## Revision & Escalation Notes

- If a surface needs intentional airy layout (empty-state, dialog), keep slightly above band but below previous fat values (e.g. empty-state pad `1.1rem` not `2rem`).
