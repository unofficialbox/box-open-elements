# Theming

Use the framework-neutral theme controller for normal application switching. It coordinates design-system activation, CSS token application, persistence, system preference, host metadata, and change events.

The lower-level registry remains available for custom design-system authoring and direct token control; see [Design Tokens](./tokens.md).

## Quick start

```ts
import {
  createThemeController,
} from "@unofficialbox/box-open-elements/foundations/theming";

const theme = createThemeController();
theme.start();

theme.toggle();
theme.setPreference("system");
```

The default controller:

- registers `box-default` and `box-dark`
- reads and writes the `boe-theme` local-storage key
- resolves `light`, `dark`, or `system`
- observes `(prefers-color-scheme: dark)` in system mode
- applies `--boe-token-*` properties to `document.documentElement`
- sets `data-theme` and the CSS `color-scheme`
- dispatches `boe:theme-change`

Call `stop()` when the owning application or scoped preview is disposed.

## Controller API

```ts
type ThemePreference = "light" | "dark" | "system";

interface ThemeController {
  start(): void;
  stop(): void;
  toggle(): void;
  setPreference(value: ThemePreference): void;
  getPreference(): ThemePreference;
  getResolvedTheme(): "light" | "dark";
}
```

`toggle()` moves from the currently resolved theme to the opposite explicit preference. For example, toggling while `system` resolves dark stores `light`.

## Bind controls

Keep control rendering in the host application and listen for the framework-neutral event:

```ts
import {
  THEME_CHANGE_EVENT,
  createThemeController,
  type ThemeChangeDetail,
} from "@unofficialbox/box-open-elements/foundations/theming";

const theme = createThemeController();

document.documentElement.addEventListener(THEME_CHANGE_EVENT, event => {
  const { preference, resolvedTheme } =
    (event as CustomEvent<ThemeChangeDetail>).detail;

  themeButton.ariaPressed = String(resolvedTheme === "dark");
  systemOption.checked = preference === "system";
});

themeButton.addEventListener("click", () => theme.toggle());
theme.start();
```

The event bubbles and is composed. Its detail contains:

| Field | Meaning |
| --- | --- |
| `preference` | Stored `light`, `dark`, or `system` choice |
| `resolvedTheme` | Effective `light` or `dark` appearance |
| `designSystemName` | Active bundle, such as `box-default` |

The existing `boe:design-system-change` event still serves asset resolvers and lower-level registry consumers.

## Scoped and custom themes

Custom-property inheritance allows a controller to theme an application root, embedded panel, preview, or side-by-side specimen:

```ts
const previewTheme = createThemeController({
  root: previewElement,
  preference: "dark",
  storageKey: null,
});

previewTheme.start();
```

Token scoping is local, but icon and illustration resolution still follows the registry’s single active design system. Side-by-side custom bundles with different asset sets therefore require explicit asset rendering rather than two globally active controllers.

Map custom registered bundles without registering the built-ins:

```ts
registerDesignSystem({
  name: "acme-dark",
  tokens: {
    fontFamilyBase: "InterVariable, Inter, sans-serif",
    surfacePrimary: "#0f1011",
    surfaceSecondary: "#17181a",
    surfaceBrand: "#5e6ad2",
    textPrimary: "#f7f8f8",
    textSecondary: "#8a8f98",
    borderDefault: "#2a2b2e",
  },
});

const brandTheme = createThemeController({
  lightDesignSystem: "acme-light",
  darkDesignSystem: "acme-dark",
  registerBuiltIns: false,
});
```

When the next bundle omits tokens applied by the controller’s previous bundle, those stale variables are removed. Consumer-owned properties that the controller did not apply are preserved.

## Prevent the initial theme flash

Render the initialization script in the document `<head>` before theme-sensitive CSS:

```ts
import {
  createThemeInitializationScript,
} from "@unofficialbox/box-open-elements/foundations/theming";

const script = createThemeInitializationScript({
  storageKey: "boe-theme",
  preference: "system",
});
```

The script resolves the saved/system preference and sets `data-theme` plus `color-scheme` before the application bundle runs. Apply a suitable CSP nonce when the host security policy requires one.

For server-rendered token declarations, the low-level `createDesignTokenStyleText()` API remains available.

## Options

| Option | Default | Use |
| --- | --- | --- |
| `root` | `document.documentElement` | Scope inherited tokens |
| `preference` | `system` | Initial choice when storage has no valid value |
| `storageKey` | `boe-theme` | Persistence key; `null` disables persistence |
| `storage` | `localStorage` | Inject another `Storage`; `null` disables storage |
| `mediaQueryList` | dark-mode media query | Inject/disable system observation |
| `lightDesignSystem` | `box-default` | Light bundle mapping |
| `darkDesignSystem` | `box-dark` | Dark bundle mapping |
| `registerBuiltIns` | `true` | Register built-in bundles on `start()` |
| `themeAttribute` | `data-theme` | Host attribute; `null` disables it |
| `applyColorScheme` | `true` | Synchronize native-control color scheme |

## Low-level lifecycle

Use the token registry directly only when a controller is unnecessary:

```ts
registerDesignSystem(definition);
setActiveDesignSystem(definition.name);
applyDesignTokens(root, definition.name);
```

| API | Effect |
| --- | --- |
| `registerDesignSystem` | Stores tokens and optional icon/illustration renderers |
| `setActiveDesignSystem` | Changes the global asset-resolution bundle |
| `applyDesignTokens` | Writes a bundle’s CSS custom properties to a root |
| `createDesignTokenStyleText` | Produces CSS declarations for SSR/injection |

## Dark-mode status

Theme-switching infrastructure is stable. `box-dark` remains a project-owned analogue because Box does not publish an authoritative dark token set; light mode remains the fidelity reference.
