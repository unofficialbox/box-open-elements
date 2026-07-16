# Coverage baseline

Measured before hard-gating so CI thresholds are justified, not aspirational.

## Measurement

| Field | Value |
| --- | --- |
| Command | `bun run test:coverage` |
| Commit | `13b4592` (`main` after #53) |
| Date | 2026-07-16 |
| Tooling | Vitest + `@vitest/coverage-v8` |

### Totals

| Metric | Covered | Total | % |
| --- | --- | --- | --- |
| Statements | 9625 | 11499 | **83.70** |
| Branches | 5059 | 7194 | **70.32** |
| Functions | 2753 | 3046 | **90.38** |
| Lines | 9472 | 11331 | **83.59** |

Scope follows the repository-configured `test.include` in `vitest.config.ts` (`test/**/*.test.ts`, `packages/*/test/**/*.test.ts`) over the instrumented sources those tests exercise (`src/`, `tools/`, `docs-site/`, `storybook/`, `packages/`).

## Enforced floors

Thresholds live in `vitest.config.ts` and run on every `bun run verify` (via `test:coverage`):

| Metric | Floor | Rationale |
| --- | --- | --- |
| Lines | 80% | ~3.5pt below measured 83.59 — room for additive code without false reds |
| Statements | 80% | same buffer vs 83.70 |
| Functions | 85% | ~5pt below measured 90.38 |
| Branches | 65% | ~5pt below measured 70.32 (branch coverage is the noisiest) |

These are **regression floors**, not the quality target for new logic. For substantial new or changed behavior, aim for **85%+** on the touched paths (see `AGENTS.md`).

## Raising the floor

Re-measure with `bun run test:coverage`, update this table, then tighten `vitest.config.ts` thresholds only when the new totals are stable across a green CI run. Do not raise floors in the same commit that adds large untested surface area.
