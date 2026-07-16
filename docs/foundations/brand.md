# Box Brand Reference

This document summarizes the Box brand signals used for the docs site and
component library. Sources are **shipped product assets**, not a Figma file:

| Source | What we take from it |
| --- | --- |
| `@box/blueprint-web-assets` | Design tokens (incl. illustration surfaces) and Blueprint illustration SVGs (Small / Medium / Large / Animated) |
| `box-ui-elements` | Product illustration set (`es/illustration/*`, sized **56** / **140**) and empty-state icons (`src/icons/states/*`) |
| This package | Token registry (`--boe-token-*`), curated illustration keys, and `box-illustration` / `box-empty-state` composition |

## Typography

- Use a clean sans-serif system centered on `Inter` and `Inter Display`.
- Keep hierarchy crisp and product-oriented.
- Avoid warmer editorial/serif baselines when Box mode is active.
- Reserve large type for clear hierarchy, not decorative effect.

## Color

- Use Box blue as the primary interactive and selected-state color.
- Default surfaces should be white and cool neutral, not beige or parchment.
- Support colors can be broader, but they should not replace Box blue as the primary UI signal.
- Gradients belong on intentional brand surfaces, not routine component chrome.

## Logos

- Use the official Box wordmark.
- Do not recolor or distort the logo.
- Preserve simple, high-contrast placement with adequate whitespace.

## Imagery

Box product UI does **not** use lifestyle photography or multi-hue marketing art
in empty/education moments. Upstream illustrations are **monochrome vector art**
painted with the illustration surface token (Box blue), layered with opacity for
depth.

### Visual rules (from Blueprint + UI Elements)

| Rule | Evidence |
| --- | --- |
| Paint with the illustration token | Blueprint SVGs use `var(--surface-illustration-surface-box-neutral)` (resolves to Box blue `#0061d5`); UI Elements design tokens describe it as the color for illustrations |
| Layer opacity, not extra hues | Typical fills use full / `0.25` / `0.1` opacity of that single surface — not a rainbow palette |
| Size for the moment | UI Elements illustrations are named with **56** (compact) or **140** (hero empty/education); Blueprint groups Small / Medium / Large / Animated |
| Use for empty / education / error interstitials | UI Elements `illustration/*` and `icons/states/*` (e.g. `FolderEmptyState`, `SearchEmptyState`, `ErrorEmptyState`, `UploadEmptyState`) |
| Prefer icons for chrome | Dense toolbars and list rows use iconography; illustrations are for larger empty or onboarding surfaces (see [iconography.md](./iconography.md)) |
| Do not invent photography | No partner/trademark page or UI Elements package ships a photo style for product chrome — stay on vector illustrations |

### Library contract in this repo

| Rule | Detail |
| --- | --- |
| Registry keys | Prefer `resolveDesignIllustration(name)` / `box-illustration` `asset` over one-off SVGs inside feature components |
| Built-in keys | Box default bundle ships `empty-state-folder` and `files-information` (adapted from the UI Elements / Blueprint empty-folder and files motifs) |
| Paint | Illustration fills use `--boe-token-surface-illustration-*` with Box-blue fallbacks |
| Composition | Empty / educational states pair art with `heading` + `message` (`box-illustration`, `box-empty-state`) |

```ts
import { resolveDesignIllustration } from "box-open-elements/foundations/tokens";

const markup = resolveDesignIllustration("empty-state-folder");
```

```html
<box-illustration asset="empty-state-folder" heading="Nothing here yet" message="Upload a file to get started."></box-illustration>
```

Expanding the illustration inventory means porting more Blueprint / UI Elements
assets into the design-system registry — not inventing a new art direction.

## Implementation rules

- Box mode should use the `Inter`-style sans stack.
- Box mode should use cool neutral surfaces and Box-blue emphasis.
- Insights components should default to blue-first data-viz semantics.
- The docs-site catalog should display the official Box wordmark rather than an approximation.
- Selected states use Box blue, not black or warm accent fills.
- Product empty states and education moments use registered illustrations + tokens above; do not hardcode alternate illustration palettes in components.
