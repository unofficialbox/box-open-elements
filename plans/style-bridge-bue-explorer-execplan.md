# ExecPlan: Style-bridge BUE Content Explorer config

### Purpose / Big Picture

Ship the first real third-party stylesheet mapping: bridge a vendored subset of
`box-ui-elements` Content Explorer SCSS into `box-content-explorer` host/part
selectors and `--boe-*` token hooks. Downstream can regenerate with
`bun run style-bridge:bue-explorer` without changing component source.

### Progress

- [x] Vendor bridgeable SCSS snapshot + variables shim under `tools/style-bridge/libraries/box-ui-elements/`
- [x] Selector-bridge config under `tools/style-bridge/configs/box-ui-elements/`
- [x] Engine fixes: Sass partial resolver, `.be` boundary, nest-flatten siblings, declaration key length sort
- [x] Regeneratable CSS + report via `bun run style-bridge:bue-explorer` (`tools/style-bridge/out/` is gitignored)
- [x] Tests: flatten sibling regression, partial resolver, full BUE library bridge
- [x] Docs: `docs/integration/style-bridge.md`, `BACKLOG.md`, `docs/HANDOFF.md`
- [x] Package script `style-bridge:bue-explorer`

### Surprises & Discoveries

- Nest flattener previously kept parsing siblings as nested children after a
  rule closed — produced `box-content-explorer box-content-explorer::part(...)`.
- `declarationMap` is exact value match; `var(--border-divider-border)` does not
  match inside `1px solid var(--border-divider-border)` — map the full value.
- Upstream `common/_variables.scss` is mixin-heavy; bridge uses a simple `$var` shim.

### Decision Log

- Shim variables instead of pulling full upstream common styles (outside supported Sass subset).
- Do not commit `out/` (repo-wide `out` gitignore); the library bridge test is the regression gate.

### Outcomes & Acceptance

- `bun run style-bridge:bue-explorer` writes CSS that targets `box-content-explorer` / `::part(...)` with tokenized literals.
- `bun test test/tools/style-bridge.test.ts` and `bun run verify` pass.

### Validation & QA

- Targeted: `bun test test/tools/style-bridge.test.ts`
- Broad: `bun run verify`
