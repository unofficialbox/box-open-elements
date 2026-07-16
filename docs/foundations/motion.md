# Motion

Motion guidance is backed by a small shared vocabulary in `box-open-elements/foundations/motion`. Prefer that module over hard-coded `120ms` / `ease` literals in new or touched shadow styles.

## Vocabulary

```ts
import {
  boeMotionDuration,
  boeMotionEasing,
  boeReducedMotionStyles,
  boeTransition,
} from "box-open-elements/foundations/motion";
```

| Export | Role |
| --- | --- |
| `boeMotionDuration` | `fast` (120ms), `interactive` (140ms), `medium` (160ms), `slow` (240ms), `spin`, `shimmer` |
| `boeMotionEasing` | `standard`, `enter`, `exit`, `linear` |
| `boeTransition(property, duration?, easing?)` | CSS transition shorthand |
| `boeReducedMotionStyles(selector, declarations)` | `prefers-reduced-motion: reduce` block |

Use `interactive` for catalog control paint transitions (background / border / color / box-shadow). Use `fast` for quicker accent feedback; `medium` / `slow` for layout and panel motion.

## Policy

- **Purposeful only** — motion signals state (loading, expand/collapse, hover feedback), not decoration.
- **Short by default** — control paint transitions use `interactive` (or `fast` for accents); layout/panel motion uses `medium` / `slow`; longer cycles are for continuous indicators (spinner, skeleton).
- **Honor reduced motion** — continuous animations must degrade under `prefers-reduced-motion: reduce` (disable shimmer; slow or pause spin). Use `boeReducedMotionStyles` so the media query is consistent.

## Example (shadow styles)

```ts
import {
  boeMotionDuration,
  boeMotionEasing,
  boeReducedMotionStyles,
  boeTransition,
} from "box-open-elements/foundations/motion";

const styles = `
  [part="panel"] {
    transition: ${boeTransition("opacity", boeMotionDuration.medium)};
  }

  [part="indicator"] {
    animation: boe-spinner-rotate ${boeMotionDuration.spin} ${boeMotionEasing.linear} infinite;
  }

  ${boeReducedMotionStyles('[part="indicator"]', "animation-duration: 1.6s;")}
`;
```

`box-spinner` and `box-skeleton` already consume this vocabulary.

## Migration

Catalog shadow styles should consume `boeMotionDuration` / `boeMotionEasing` (or `boeTransition`) instead of hard-coded `120ms` / `140ms` / `160ms` literals. A maintainer sweep lives in `tools/migrate-motion-literals.ts`; re-run only when introducing new literal timings.

## Related

- [Accessibility](./accessibility.md) — reduced-motion is part of the a11y contract
- [Theming](./theming.md) — theme switches should not rely on long decorative transitions
