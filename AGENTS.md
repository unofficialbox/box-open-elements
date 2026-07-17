# box-open-elements AGENTS.md

This file applies to this repository. It adds repo-specific guidance for AI coding agents and human contributors.

## Working style

- Be succinct. Keep cognitive load low. Prefer short bullets, tables, and direct status updates.
- Start with `README.md`, `docs/README.md`, `BACKLOG.md`, and the most relevant doc for the subsystem you are changing.
- Preserve the repo's core direction: framework-agnostic headless contracts, optional adapter layers, accessible Web Components, and the Foundations → Components → Patterns taxonomy.

## Where to orient

| Need | Read |
|---|---|
| development workflow | `README.md` |
| docs map | `docs/README.md` |
| open follow-up work | `BACKLOG.md` |
| taxonomy and tier rules | `docs/taxonomy.md` |
| build-out sequence | `docs/roadmap.md` |
| architecture | `docs/architecture.md` |
| component API rules | `docs/api-guidelines.md` |
| accessibility contract | `docs/foundations/accessibility.md` |
| old-repo → new-repo mapping | `docs/migration-map.md` |
| explorer composition | `docs/patterns/content-explorer.md` |
| server integration boundary | `docs/integration/box-server.md` |
| React adapter package | `docs/integration/react.md` |

## Repo conventions

- Keep foundations, components, patterns, and core cleanly separated per `docs/taxonomy.md`.
- Components never own transport; pattern workflows own controllers and contracts.
- Treat accessibility semantics and keyboard behavior as part of the component contract, not optional polish.
- Components consume `--boe-token-*` custom properties with safe fallbacks and must work with no design system registered.
- Preserve the package boundary and wildcard subpath export model unless the task explicitly changes public API shape.
- When porting from `box-open-web-components`, port deliberately: apply `docs/api-guidelines.md` naming at port time instead of carrying compatibility aliases forward, and update `docs/migration-map.md` status as surfaces land.
- Prefer additive examples and tests over broad rewrites.

## Verification

- Every behavior change must include automated verification.
- For headless controller, contract, transport, and foundations changes, add or update focused unit tests.
- For Web Component changes, add or update component tests (jsdom-based via Vitest).
- Run targeted tests first, then `bun run verify` before finishing.
- Aim for strong coverage on changed behavior; treat `85%+` as the target for substantial new or changed logic. Repo-wide CI floors (regression guards) are documented in `docs/coverage-baseline.md` and enforced via Vitest thresholds in `verify`.

## CI and PR monitoring

Do **not** leave an open PR sitting on pending/failed checks while moving on to unrelated work. After each push that should go green:

1. **Poll** — check `gh pr checks <n>` (or the `ci-watcher` subagent) within ~1–2 minutes of push, then again until Verify, Visual regression, and CodeRabbit settle.
2. **Act on red immediately** — read failed job logs (`gh run view <id> --log-failed`), fix, push, and re-poll. Pixel failures after intentional docs/UI changes usually need `bun run baselines:regen` (or targeted docs-site/gallery shots) in the Playwright container.
3. **Stuck / long-running jobs** — if a check is still `pending`/`queued` with no progress for **~10 minutes**, or a run is clearly hung (no new log output for several minutes past its normal duration):
   - Cancel the run: `gh run cancel <run-id>`
   - Re-run failed jobs: `gh run rerun <run-id> --failed` (or full `gh run rerun <run-id>` if needed)
   - If GitHub still will not start checks, push an empty commit (`git commit --allow-empty -m "ci: retry checks"` + push) and poll again
4. **Local long commands** — same idea: if `bun run verify`, container pixel runs, or installs hang far past their usual runtime with no output, kill that process and retry once; report flake evidence if it fails twice the same way.
5. **Done means green** — do not call a PR ready for merge (or hand off as finished) until required checks are green, or you have stated exactly which check is blocked and why.

Normal durations here (rough): Verify ~3 minutes; Visual regression ~1–2 minutes once the Playwright image is warm (first pull can add a few minutes). Treat anything much longer without log progress as stuck.

## Standard commands

Run from the repository root:

| Task | Command |
|---|---|
| typecheck | `bun run typecheck` |
| full test run | `bun run test` |
| coverage report | `bun run test:coverage` |
| build package | `bun run build` |
| broad repo verification | `bun run verify` (typecheck + **coverage-gated** tests + build) |
| style bridge | `bun run style-bridge -- --config … --input …` (BUE explorer: `bun run style-bridge:bue-explorer`) |
| PR checks | `gh pr checks <n>` |
| cancel stuck Actions run | `gh run cancel <run-id>` |
| retry failed Actions jobs | `gh run rerun <run-id> --failed` |

## Documentation

- Keep `README.md` and the owning docs in `docs/` aligned with behavior changes.
- When public APIs, component contracts, composition guidance, or taxonomy placement change, update the docs that describe those rules — including the catalogs (`docs/components/catalog.md`, `docs/patterns/catalog.md`) and `docs/migration-map.md`.
- For architecture, interaction patterns, integration seams, or data-flow changes, update the relevant Mermaid diagrams in the owning docs.
- Write docs for fast scanning: explicit commands, examples, expected outcomes, and minimal click depth.

## ExecPlans

- For complex features, multi-package work, substantial component-family ports, design-system migrations, or tasks expected to span multiple sessions, use an ExecPlan as defined in `PLANS.md`.
- Store ExecPlans under `plans/`.
- Typical triggers: changes spanning `src/`, `docs/`, and `test/` together; public API or export-surface changes; porting a whole component category; accessibility work affecting many surfaces; server-integration changes affecting contracts, examples, and docs together.
- Keep ExecPlan `Progress` sections honest — the predecessor repo accumulated stale checklists, and top-of-file status notes had to override them.

## Delivery

- In the final handoff, state what changed, which commands were run, what passed, and what remains.
- If a command could not be run, say exactly why.
- Always end substantive handoffs with a **concrete next step** and a one-line **why** (see `.cursor/rules/recommend-next-step.mdc`).
- For PR work: include check status (Verify / Pixel / CodeRabbit). If anything is still pending or red, keep looping per **CI and PR monitoring** instead of stopping.
