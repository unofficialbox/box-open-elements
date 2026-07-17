# Style Bridge

The style bridge translates third-party CSS/SCSS subsets into a `box-open-elements`-facing format without coupling the core package to any one design language.

Engine + CLI live under `tools/style-bridge/`.

## Intended workflow

- keep web components structurally unopinionated
- express visual-language mappings in bridge config files
- generate auditable CSS output and reports
- let downstream developers add their own design language without forking component implementations

## Design

Two bridge modes:

| Mode | Source shape | Output strategy |
| --- | --- | --- |
| `selector-bridge` | SCSS or CSS with nested selectors and legacy class names | flatten selectors, substitute simple SCSS variables, then remap selectors and literal declarations to component selectors and custom properties |
| `token-bridge` | token/custom-property CSS | inline imports, remap custom property prefixes and `token()` references, then append an optional alias block for semantic tokens |

The modes are config-driven: a Box-flavored stylesheet and another vendor token file should only require new configs that declare the mappings, never changes to the bridge engine or component source.

## Proven example: Box UI Elements Content Explorer

First real library config (selector-bridge):

| Piece | Path |
| --- | --- |
| Library snapshot | `tools/style-bridge/libraries/box-ui-elements/` |
| Config | `tools/style-bridge/configs/box-ui-elements/content-explorer.config.json` |
| Golden CSS + report | `tools/style-bridge/out/box-ui-elements/` |

What the run does:

- resolves `@import '../common/variables'` (Sass partial / extensionless)
- substitutes simple `$variables` via `variableMap` (definitions stripped)
- flattens `.be { &.bce { … } }` without nesting sibling rules under a closed parent
- maps legacy selectors (`.be.bce`, `.bce-Footer`, …) → `box-content-explorer` / `::part(…)`
- rewrites literal values to custom-property hooks (exact value match after `:`)

Regenerate:

```bash
bun run style-bridge:bue-explorer
```

Or the generic CLI:

```bash
bun run style-bridge -- \
  --config tools/style-bridge/configs/box-ui-elements/content-explorer.config.json \
  --input tools/style-bridge/libraries/box-ui-elements/content-explorer/index.scss \
  --out tools/style-bridge/out/box-ui-elements/content-explorer.css \
  --report tools/style-bridge/out/box-ui-elements/content-explorer.report.json
```

The variables file under `libraries/box-ui-elements/common/_variables.scss` is a **shim**: only simple `$name: value` bindings. Upstream `elements/common/_variables.scss` also pulls mixin-heavy imports outside the supported subset — see the library README.

## Why this beats a one-off conversion

| One-off import | Style bridge |
| --- | --- |
| fast once, hard to repeat | repeatable for future libraries |
| hidden assumptions | mapping is explicit in config |
| hard to audit | report shows what happened |
| tightly coupled to one source | works for multiple source styles without changing components |

## Known limits

Supported: `@import`, simple `$variables`, simple nested selectors, `&` replacement, Sass partial resolution.

Not supported: mixin expansion, loops, interpolation, advanced Sass module syntax.

`declarationMap` matches the **entire** value after `:` (before `;` / `}`). Compound values such as `1px solid var(--border-divider-border)` must be mapped in full.

## Tooling

```bash
bun run style-bridge -- \
  --config test/fixtures/style-bridge/selector-bridge.config.json \
  --input test/fixtures/style-bridge/content-explorer.scss \
  --out /tmp/bridged.css \
  --report /tmp/bridge-report.json
```

| Piece | Path |
| --- | --- |
| Engine | `tools/style-bridge/bridge.ts` (`bridgeStylesheet`, both modes) |
| CLI | `tools/style-bridge/cli.ts` |
| Fixtures / tests | `test/fixtures/style-bridge/`, `test/tools/style-bridge.test.ts` |
| BUE explorer config | `tools/style-bridge/configs/box-ui-elements/` |

Default prefix remap for token-bridge configs should use `--obp-` → `--boe-`. Add further library configs only when restyling a concrete stylesheet.

## Follow-ups

- Semantic-token recommendation pass for unmatched third-party tokens.
- More library configs only once real mappings exist (do not generalize prematurely).
