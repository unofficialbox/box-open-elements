# Handoff — design-fidelity reconciliation

## Current status

Work is on `codex/light-mode-state-reconciliation`. The exhaustive Box/BUE/local audit and Slice 0 reference/state harness are complete. Slice 1a typography is also complete: Inter Variable is the authoritative family, Lato is no longer a runtime fallback, and all 107 rendered component/pattern hosts consume the base font token.

The repository is still not at professional Box visual parity. Component-specific type roles and the remaining geometry, elevation, surface, icon, and interaction-state reconciliation are intentionally open.

## Read next

1. [ExecPlan](./plans/box-design-fidelity-reconciliation-execplan.md) — progress, decisions, and execution order.
2. [Exhaustive reconciliation audit](./docs/audits/box-design-fidelity-reconciliation.md) — every foundation, component, and rendered pattern.
3. [Visual reference](./docs/audits/box-visual-reference.md) — dated measurements and source differences.
4. [Typography contract](./docs/foundations/typography.md) — Inter loading boundary and semantic roles.
5. [Detailed repository handoff](./docs/HANDOFF.md) — broader project history and operating context.

## Verification at handoff

- `bun run verify` — 155 test files / 822 tests passed; coverage gates passed.
- `bun run test:regression:pixel` — 21 gallery and 17 docs-site captures passed strict pixel comparison.
- `bun run docs:typecheck` and `bun run docs:build` passed.
- `bun tools/migrate-typography-hosts.ts` verified 107 rendered hosts.
- JSON validation, Markdown local-link validation, and `git diff --check` passed.

## Next slice

Implement Slice 1b shared geometry, elevation, surface, icon, and interaction roles. Then reconcile the high-frequency action, field, navigation, and overlay families against the state matrix before moving into Content Explorer and workflow patterns.

Known separate defect: the docs shell measures 604px wide at a 390px viewport. Treat this as responsive-shell work, not a typography regression.
