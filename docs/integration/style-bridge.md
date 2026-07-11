# Style Bridge

The style bridge is a small utility (built in `box-open-web-components` under `tools/style-bridge/`, not yet ported here) for importing third-party CSS or SCSS and translating it into a `box-open-elements`-facing format without coupling the core package to any one design language.

The intended workflow:

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

The original repo bridged `ContentExplorer.scss` from the external `box-ui-elements` repo:

- resolves `@import '../common/variables'`
- substitutes simple `$variables`
- flattens `.be { &.bce { ... } }`
- maps legacy selectors like `.be.bce .bcpr`
- rewrites literal values to custom-property hooks, e.g. `300px` becomes `var(--boe-content-explorer-min-width, 300px)` (prefix updated for this repo)

Each run writes a bridged CSS file plus a JSON (or markdown) report listing inlined imports, missing variables, unresolved imports, and applied mappings.

## Why this beats a one-off conversion

| One-off import | Style bridge |
| --- | --- |
| fast once, hard to repeat | repeatable for future libraries |
| hidden assumptions | mapping is explicit in config |
| hard to audit | report shows what happened |
| tightly coupled to one source | works for multiple source styles without changing components |

## Known limits (first version)

Supported: `@import`, simple `$variables`, simple nested selectors, `&` replacement.
Not supported: mixin expansion, loops, interpolation, advanced Sass module syntax.

That subset was sufficient for the Box content-explorer SCSS.

## Porting plan

- Port `tools/style-bridge/{bridge.mjs,cli.mjs}` when the first real re-styling scenario appears here.
- Update output prefixes from `--obp-*` to `--boe-*` and selectors to the new data attributes.
- Add a semantic-token recommendation pass for unmatched third-party tokens.
- Add more library configs only once real mappings exist rather than prematurely generalizing.
