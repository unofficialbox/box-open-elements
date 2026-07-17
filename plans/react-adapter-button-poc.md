# ExecPlan: React adapter PoC (`BoxButton`)

## Purpose / Big Picture

Ship an optional `@box-open-elements/react` package with a thin `BoxButton` wrapper so React apps can consume `box-button` without pulling React into core.

## Progress

- [x] Branch `cursor/react-adapter-button-poc-7eb7`
- [x] `packages/react` + `createWebComponent` + `BoxButton`
- [x] Docs (`docs/integration/react.md`) + BACKLOG/HANDOFF/README wiring
- [ ] Tests + `bun run verify` + PR

## Decision Log

- Sibling package (like `box-server`), not inlined under `src/`.
- Sync props as **properties** via `useLayoutEffect`.
- Factory first so more wrappers stay cheap.

## Validation

| Check | Command |
| --- | --- |
| Package typecheck | `bunx tsc -p packages/react/tsconfig.json --noEmit` |
| Adapter tests | `bunx vitest run packages/react/test` |
| Full | `bun run verify` |
