# Box Brand Reference

This document summarizes the Box brand-style-guide signals used for the Box design-system pass in the docs site and component library.

## Source frames

Reviewed in the original brand pass (file URL not recorded in-repo):

- Introduction: Figma node `152:203`
- Typography: Figma node `294:1087`
- Color: Figma node `294:1838`
- Logos: Figma node `294:440`

Not reviewed (session hit a Figma tool-call limit; imagery node id never captured):

- Imagery — still needs a direct Figma review once a file URL + access are available

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

### Product illustrations (shipped library contract)

Until the brand-style-guide Imagery frame is reviewed, product UI must follow the
**illustration contract already in this repo** — not invented photography or
marketing art direction:

| Rule | Detail |
| --- | --- |
| Registry keys | Prefer `resolveDesignIllustration(name)` / `box-illustration` `asset` over one-off SVGs inside feature components |
| Built-in keys | Box default bundle ships `empty-state-folder` and `files-information` (see `src/foundations/tokens/box-defaults.ts`) |
| Paint | Illustration fills use `--boe-token-surface-illustration-*` (Box default neutral illustration surface is brand blue `#0061d5`) |
| Composition | Empty / educational states pair illustration art with `heading` + `message` (see `box-empty-state`, `box-illustration`) |
| Icons vs art | Compact chrome uses iconography (`docs/foundations/iconography.md`); larger empty/education moments use illustrations |

```ts
import { resolveDesignIllustration } from "box-open-elements/foundations/tokens";

const markup = resolveDesignIllustration("empty-state-folder");
```

```html
<box-illustration asset="empty-state-folder" heading="Nothing here yet" message="Upload a file to get started."></box-illustration>
```

### Marketing / photography (Figma Imagery frame — open)

- Do **not** invent a distinct photography, lifestyle, or marketing-illustration style for this library.
- Closing that gap requires reviewing the Box brand-style-guide **Imagery** frame in Figma (file URL + access). Capture the node id next to the frames above when that happens.
- Public Box partner / trademark pages cover logo and naming only — they are not a substitute for the Imagery frame.

## Implementation rules

- Box mode should use the `Inter`-style sans stack.
- Box mode should use cool neutral surfaces and Box-blue emphasis.
- Insights components should default to blue-first data-viz semantics.
- The docs-site catalog should display the official Box wordmark rather than an approximation.
- Selected states use Box blue, not black or warm accent fills.
- Product empty states and education moments use registered illustrations + tokens above; do not hardcode alternate illustration palettes in components.
