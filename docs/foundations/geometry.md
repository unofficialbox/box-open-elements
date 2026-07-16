# Geometry

Everyday control chrome should track [box-ui-elements](https://github.com/box/box-ui-elements) Box Design Language geometry (`src/styles/constants/_layout.scss`, `_buttons.scss`, `_inputs.scss`, and overlay/modal SCSS), not ad-hoc rem bands.

Shared constants live in `box-open-elements/foundations/geometry`.

## Vocabulary

```ts
import {
  boeSpace,
  boeRadius,
  boeControl,
  boeOverlay,
  boeInputControlStyles,
} from "box-open-elements/foundations/geometry";
```

| Export | Role |
| --- | --- |
| `boeSpace` | 4px grid multiples (`unit`, `1`…`12`) |
| `boeRadius` | `size` 4 / `med` 6 / `large` 8 / `xlarge` 12 / `pill` |
| `boeControl` | 32px height, 16px inline pad, input inset shadow, disabled opacity `0.4` |
| `boeOverlay` | Menu/flyout pad 12 / radius 8 / shadow; menu item 30×`8 48 8 8`; modal 460×30 pad / radius 12 / 75% scrim |
| `boeInputControlStyles(selector)` | `@mixin box-inputs` chrome for text fields |

## Policy

- **Controls** use `boeRadius.med` (6px) and `boeControl.height` (32px).
- **Menus / overlays / popovers** use `boeOverlay` (`padding` 12, `radius` 8, `shadow` `0 4px 12px`).
- **Modals / dialogs** use `boeOverlay.modal*` (pad 30, width 460, radius 12, dark 75% scrim, no blur).
- **Tabs** use underline chrome (40px line-height, 13px type, 2px brand underline) — not segmented chips.
- **Toast / notification** use light surfaces, 2px border, min-height 48, radius 8.
- **Badge** use `boeRadius.size` (4px) and 10px type — not pills.
- **Avatar** default size **32px**, solid initials fill, no soft gradient/shadow.
- **Error-mask** use dashed gray border, pad 40, radius 6.
- **Pills** (`boeRadius.pill`) only for true pill shapes (chips), not buttons or badges.
- Prefer flat fills + light shadows over gradients and large ambient shadows.

## Related

- [Design Tokens](./tokens.md) — color/theme registry
- [Upstream Gaps](../research/upstream-gaps.md) — catalog inventory vs BUE
- [Motion](./motion.md) — transition timing
