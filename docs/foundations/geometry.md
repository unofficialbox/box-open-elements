# Geometry

Everyday control chrome should track [box-ui-elements](https://github.com/box/box-ui-elements) Box Design Language geometry (`src/styles/constants/_layout.scss`, `_buttons.scss`, and `_inputs.scss`), not ad-hoc rem bands.

Shared constants live in `box-open-elements/foundations/geometry`.

## Vocabulary

```ts
import {
  boeSpace,
  boeRadius,
  boeControl,
  boeInputControlStyles,
} from "box-open-elements/foundations/geometry";
```

| Export | Role |
| --- | --- |
| `boeSpace` | 4px grid multiples (`unit`, `1`…`8`) |
| `boeRadius` | `size` 4 / `med` 6 / `large` 8 / `xlarge` 12 / `pill` |
| `boeControl` | 32px height, 16px inline pad, input inset shadow, disabled opacity `0.4` |
| `boeInputControlStyles(selector)` | `@mixin box-inputs` chrome for text fields |

## Policy

- **Controls** use `boeRadius.med` (6px) and `boeControl.height` (32px).
- **Menus / overlays** use `boeRadius.large` (8px) and `boeControl.overlayShadow`.
- **Modals** use `boeRadius.xlarge` (12px).
- **Pills** (`boeRadius.pill`) only for true pill shapes (chips), not buttons.
- Prefer flat fills + light shadows over gradients and large ambient shadows.

## Related

- [Design Tokens](./tokens.md) — color/theme registry
- [Upstream Gaps](../research/upstream-gaps.md) — catalog inventory vs BUE
- [Motion](./motion.md) — transition timing
