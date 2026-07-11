# Design Tokens and Theming

Foundations express design decisions as data. The token layer is a framework-neutral registry that lets any design language — Box's own or a downstream team's — restyle the component catalog without forking component implementations.

## Model

| Layer | Responsibility |
| --- | --- |
| `@box/blueprint-web-assets` (upstream, not a dependency) | source of Box tokens, icons, and illustrations |
| `src/foundations/tokens/registry.ts` | framework-neutral token + asset registry |
| `src/foundations/tokens/box-defaults.ts` | the Box default design system bundle |
| components | consume registered assets by name and fall back safely when no design system is active |

Important constraint carried over from the original review: the upstream asset package ships React-oriented JS modules. `box-open-elements` stays framework-agnostic, so the core library must not hard-depend on those React exports at runtime. Treat `@box/blueprint-web-assets` as an upstream asset source and register the pieces you want into the registry.

## API surface

```ts
import {
  applyDesignTokens,
  boxDefaultDesignSystem,
  createDesignTokenStyleText,
  registerBoxDefaultDesignSystem,
  registerDesignSystem,
  setActiveDesignSystem,
} from "box-open-elements/foundations/tokens";
```

| API | Purpose |
| --- | --- |
| `registerDesignSystem()` | register any custom token/icon/illustration bundle |
| `registerBoxDefaultDesignSystem()` | register the built-in Box light bundle |
| `registerBoxDarkDesignSystem()` | register the built-in Box dark bundle (`box-dark`) |
| `setActiveDesignSystem()` | switch the active bundle at runtime |
| `applyDesignTokens()` | write token values onto an element as CSS custom properties |
| `createDesignTokenStyleText()` | generate a CSS block for SSR or stylesheet injection |
| `resolveDesignIcon()` / `resolveDesignIllustration()` | look up a registered asset by name |

Token names are written in the bundle as PascalCase keys (matching Box's `tokens.json` inventory) and applied as kebab-cased CSS custom properties with the `--boe-token-` prefix:

```
SurfaceSurfaceBrand  →  --boe-token-surface-surface-brand
```

## Box default example

```ts
import {
  applyDesignTokens,
  registerBoxDefaultDesignSystem,
} from "box-open-elements/foundations/tokens";

registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");
```

## Dark theme

`box-dark` is a built-in bundle with the same token keys, icons, and illustrations as `box-default` — only the surface / text / stroke / status values change. Because every component reads `--boe-token-*`, switching the active bundle re-themes the whole catalog with no markup change:

```ts
import {
  applyDesignTokens,
  registerBoxDefaultDesignSystem,
  registerBoxDarkDesignSystem,
  setActiveDesignSystem,
} from "box-open-elements/foundations/tokens";

registerBoxDefaultDesignSystem();
registerBoxDarkDesignSystem();

// switch at runtime
setActiveDesignSystem("box-dark");
applyDesignTokens(document.documentElement, "box-dark");
```

The docs site's footer theme toggle uses exactly this mechanism.

## Custom design system example

```ts
import {
  applyDesignTokens,
  registerDesignSystem,
} from "box-open-elements/foundations/tokens";

registerDesignSystem(
  {
    name: "acme",
    tokens: {
      BrandPrimary: "#5b4bff",
      SurfaceSurface: "#ffffff",
      TextText: "#111111",
    },
    icons: {
      search: '<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="4"></circle></svg>',
    },
  },
  { setActive: true },
);

applyDesignTokens(document.documentElement, "acme");
```

## Component consumption rules

- Components consume tokens as CSS custom properties with safe fallbacks:
  `background: var(--boe-token-surface-surface-brand, #0061d5);`
- Components must render sensibly with no design system registered.
- Components that render assets treat asset names as keys into the active design system and fall back to built-in rendering when the key is absent.
- Add explicit guidance per component for when it should consume tokens directly versus rely on shell styling (open follow-up carried from the original backlog).

## Why this boundary works

| Decision | Reason |
| --- | --- |
| keep asset package out of core runtime deps | preserves framework neutrality |
| use a registry instead of hard-coded imports | makes design-language swaps explicit and testable |
| keep fallback rendering in components | components still work with no design system registered |
| apply tokens via CSS custom properties | works for both Box defaults and downstream custom themes |

## Follow-ups

- Expand the Box default bundle only with tokens and assets actually used by components or the docs site.
- Add a build-time extraction script if we want to mirror more of `@box/blueprint-web-assets` automatically.
- Port the style-bridge tool for translating third-party CSS/SCSS into token-driven output — see [../integration/style-bridge.md](../integration/style-bridge.md).
