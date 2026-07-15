# ExecPlan: Iconography generator port

## Outcome

Ship `tools/iconography/generate-box-iconography.ts` so contributors with the external Box icon pack can regenerate `src/foundations/icons/box-iconography.generated.ts`. Fixture tests prove transforms without vendoring the proprietary pack.

## Tier

Foundations (icons) + tooling.

## Scope

1. Generator CLI (`--source` / `BOX_ICONOGRAPHY_SOURCE`, `--out`, `--dry-run`)
2. Transforms: `currentColor`, id prefixing, blue-then-white key allocation
3. Fixture pack + unit tests (incl. key parity vs committed metadata)
4. `bun run icons:generate` script + docs/BACKLOG/HANDOFF

## Explicit deferrals

- Checking the proprietary source pack into the repo
- Regenerating/replacing the 472-icon committed manifest in this PR
- Moving aliases or bespoke icons into the generator

## Progress

- [x] Generator + fixture tests
- [x] Docs + verify + PR
