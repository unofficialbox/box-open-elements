# Iconography

The Box design system adapts an external icon inventory (the `2023-Icon-collection-{blue,white}-svg` source pack). That pack is not vendored into this repo — a contributor with the source pack runs a generator that emits a repo-local manifest.

## Adaptation rules

- Source SVGs are treated as the system of record.
- Icons are generated into a repo-local manifest rather than copied by hand.
- All icon color fills and strokes are normalized to `currentColor`, so the same markup works on light or dark surfaces without maintaining separate blue/white sets.
- SVG ids are prefixed per icon key so repeated usage does not collide in the DOM.
- The generated manifest exposes raw inventory keys plus a small alias layer for package-friendly names such as `search`, `plus`, `gear`, and `folder`.

## Current status in this repo

The Box default bundle (`src/foundations/tokens/box-defaults.ts`) currently ships a small hand-curated icon set (`info`, `alert`, `folder-shared`, `file-pdf`) and two illustrations. The bespoke `folder-shared` and `file-pdf` assets exist because they are not clean one-to-one matches in the source icon pack.

The full generator (`tools/iconography/generate-box-iconography.mjs` in `box-open-web-components`, output ~4,000 lines of generated manifest) has not been ported yet. Port it when the component catalog grows enough to need the full inventory:

- Command shape: `bun tools/iconography/generate-box-iconography.mjs`
- Output: a generated manifest under `src/foundations/icons/` plus an alias layer
- Wire the generated manifest into `boxDefaultDesignSystem.icons`

## Usage

Icons are resolved through the design-system registry:

```ts
import { resolveDesignIcon } from "box-open-elements/foundations/tokens";

const svg = resolveDesignIcon("info");
```

Components treat icon attributes as asset keys into the active design system and fall back to text or built-in rendering when the key is absent.
