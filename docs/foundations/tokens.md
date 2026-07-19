# Design Tokens

Foundations express design decisions as data. The token layer is a framework-neutral registry that lets any design language — Box's own or a downstream team's — restyle the component catalog without forking component implementations.

Runtime theme switching, `boe:design-system-change`, and when to use theming vs token authoring are documented in [theming.md](./theming.md).

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

## Token consumption vs shell / consumer overrides

Source-level Box styling is the default: every catalog surface carries its look in its own shadow styles via `--boe-token-*`. Demo, docs, and host “shell” CSS must **not** be treated as the source of the Box look.

| Actor | Responsibility |
| --- | --- |
| Component author | Paint with `--boe-token-*` + safe fallbacks inside the shadow tree; expose structural `part`s for overrides |
| Host / docs shell | Register and `applyDesignTokens()` on a root; keep layout chrome separate from component paint |
| App consumer | Theme by swapping design-system bundles; customize structure with `::part()`; use rare host custom properties only when the component documents them |

### When to use which lever

| Need | Use | Do not |
| --- | --- | --- |
| Brand / theme colors, text, strokes, status | `--boe-token-*` inside the component (or a registered custom bundle) | Hardcode hex in shadow styles without a token + fallback |
| One-off visual tweak for a single embedding | `tag::part(name) { … }` from outside | Fork the component or restyle via brittle deep selectors |
| Documented structural host knobs (e.g. collapsed nav label visibility) | Component-owned custom properties such as `--boe-nav-label-display` | Invent undocumented `--boe-*` vars on the host |
| Whole-app light/dark or white-label theme | `registerDesignSystem` / `setActiveDesignSystem` + `applyDesignTokens` | Per-page shell CSS that paints over every control |
| Third-party SCSS → token vocabulary | Style bridge (`bun run style-bridge` — [../integration/style-bridge.md](../integration/style-bridge.md)) | Hand-copy third-party rules into shadow trees |

`:host { color: inherit; font: inherit; }` is intentional so typography can follow the embedding page while **paint** (background, border, status, brand) still comes from tokens.

### Native closed-widget limits

Some native controls only accept limited styling (`accent-color`, closed UA popups). Prefer tokens for what the platform allows; do not fake a full custom chrome unless the component is upgraded structurally:

- `<datalist>` popups (`combobox`)
- Native `<select>` / date / time picker popups
- Bare `<input type="range">` tracks (beyond `accent-color`)

### Docs-site API tab

The component docs API tab lists **design tokens used** by scanning the primary host’s shadow styles for `--boe-token-*` references. That inventory is derived from the live preview — empty when a surface truly uses no tokens.

## Why this boundary works

| Decision | Reason |
| --- | --- |
| keep asset package out of core runtime deps | preserves framework neutrality |
| use a registry instead of hard-coded imports | makes design-language swaps explicit and testable |
| keep fallback rendering in components | components still work with no design system registered |
| apply tokens via CSS custom properties | works for both Box defaults and downstream custom themes |

## Interactive state helpers

Batch 3 fidelity work ships shared CSS snippets from
`box-open-elements/foundations/tokens` so interactive parts share one
focus/hover/active/disabled language:

```ts
import {
  boeBrandInteractiveStyles,
  boeNeutralInteractiveStyles,
  boeFocusVisibleStyles,
} from "box-open-elements/foundations/tokens";

const styles = `
  ${boeNeutralInteractiveStyles('[part="trigger"]')}
  ${boeBrandInteractiveStyles('[part="confirm"]')}
`;
```

| Helper | Use when |
| --- | --- |
| `boeNeutralInteractiveStyles(selector)` | surface buttons, chips, triggers, rows |
| `boeBrandInteractiveStyles(selector)` | primary/confirm actions |
| `boeFocusVisibleStyles(selector)` | controls that already own hover (native inputs) |
| `boeFocusRingShadow` | raw box-shadow value for custom rules |

The focus ring always resolves through `--boe-token-surface-surface-brand` (opaque brand fallback `#0061d5`) so it adapts between `box-default` and `box-dark` and stays high-contrast when no design system is registered.

## Follow-ups

- Expand the Box default bundle only with tokens and assets actually used by components or the docs site.
- Add a build-time extraction script if we want to mirror more of `@box/blueprint-web-assets` automatically.
