# Typography

Box mode uses Inter Variable as its primary product typeface. Lato is not part of the default stack; it belongs only in an explicitly legacy BUE context.

## Font contract

```css
font-family: var(
  --boe-token-font-family-base,
  InterVariable,
  Inter,
  "Helvetica Neue",
  Helvetica,
  Arial,
  sans-serif
);
```

The package does not silently fetch fonts from a remote origin. Consumers either load Inter themselves or use their existing Inter asset pipeline. The docs site and visual-regression harness share the pinned OFL asset in `docs-site/fonts/InterVariable.woff2`.

Every component and visual pattern applies the font-family token at its `:host` boundary. Consumers can override the family by setting `--boe-token-font-family-base`; internal controls continue to inherit from the host.

## Semantic roles

Import roles from `box-open-elements/foundations/typography`.

| Role | Size / line height | Weight | Use |
| --- | --- | --- | --- |
| `pageHeading` | `21/32` | 700 | Page and folder titles |
| `dialogHeading` | `19/24` | 700 | Modal and drawer titles |
| `sectionHeading` | `16/24` | 700 | Product section headings |
| `button` | `16/24` | 700 | Default 40px actions |
| `menuItem` | `15/20` | 400 | Menu and option rows |
| `body` | `14/20` | 400 | Product content and collection rows |
| `bodyStrong` | `14/20` | 600 | Emphasized product content |
| `label` | `13/20` | 600 | Form labels |
| `metadata` | `12/16` | 400 | Secondary metadata |
| `caption` | `11/16` | 600 | Compact captions only |

```ts
import { boeType, boeTypeStyles } from "box-open-elements/foundations/typography";

const styles = boeTypeStyles('[part="title"]', boeType.dialogHeading);
```

## Rules

- Use sentence case. Do not uppercase routine field labels or navigation text.
- Do not add letter spacing to body, label, button, menu, or metadata roles.
- Do not invent intermediate rem sizes. Add a role only when a measured product need is not covered.
- Typography screenshots must use the pinned Inter asset. Metric-compatible substitutes are not fidelity evidence.
- Monospace remains reserved for code, schemas, tokens, and developer tooling.
