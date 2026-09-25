<p align="center">
  <a href="https://unofficialbox.github.io/box-open-elements">
    <img src="https://raw.githubusercontent.com/unofficialbox/box-open-elements/main/assets/banner.svg" alt="Box Open Elements — framework-agnostic Web Components that track Box's design language" width="100%">
  </a>
</p>

# box-open-elements

`box-open-elements` is an open, framework-agnostic design system and web component library for Box-style experiences.

> **Community project — not affiliated with, authorized, or endorsed by Box, Inc.** “Box” is a trademark of Box, Inc. This library tracks Box’s public design language for interoperability; it ships no Box code.

Browse the full catalog on the **[live docs site](https://unofficialbox.github.io/box-open-elements)** — live previews, an events/properties inspector, per-framework code snippets (React / Angular / Vue / Svelte / HTML), and the foundations pages.

The library is organized around three layers (see [taxonomy](https://github.com/unofficialbox/box-open-elements/blob/v0.22.0/docs/taxonomy.md) for the canonical model):

- **Foundations** — design decisions as data: tokens, color, typography, iconography, accessibility, theming
- **Components** — accessible Web Components for single controls, organized by category
- **Patterns** — combinations of components that address user objectives with sequences and flows: headless controllers, transport contracts, and composed workflow surfaces, grouped by Box noun

Core implementation principles:

- plain TypeScript modules, no React requirement in the core package — zero runtime dependencies
- state and business logic separate from rendering: controllers and stores, not framework components
- standard DOM events where a UI layer needs them
- accessibility semantics and keyboard support as part of the component contract
- injected transport contracts instead of SDK coupling

## Install

```bash
npm install @unofficialbox/box-open-elements
```

Importing the root registers the full `box-*` catalog; flat entrypoints register only the imported component:

```ts
import { Accordion, Avatar, Button, Switch } from "@unofficialbox/box-open-elements";
import { TextField } from "@unofficialbox/box-open-elements/text-field";
```

```html
<box-button label="Save" tone="primary"></box-button>
```

Components consume foundation tokens (`--boe-token-*`) with safe fallbacks, so they render sensibly with no design system registered and restyle automatically when one is active:

```ts
import { createThemeController } from "@unofficialbox/box-open-elements/foundations/theming";

const theme = createThemeController();
theme.start();
```

Workflow patterns begin as headless behavior and gain presentation adapters, so custom React components, Angular templates, Vue SFCs, Svelte components, Web Components, and plain DOM can all consume the same state:

```ts
import { ExplorerSelectionController } from "@unofficialbox/box-open-elements/patterns/content-explorer/selection";

const selection = new ExplorerSelectionController({ selectionMode: "multiple" });

selection.subscribe("selectionChanged", ({ selectedItemIds }) => {
  console.log(selectedItemIds);
});

selection.setItems([{ id: "1" }, { id: "2" }]);
selection.toggleSelection("1");
```

## Import contract

- root exports: `@unofficialbox/box-open-elements`
- shared runtime: `@unofficialbox/box-open-elements/core`
- foundations: `@unofficialbox/box-open-elements/foundations/<module>`
- optimized component entrypoints: `@unofficialbox/box-open-elements/<name>`
- patterns: `@unofficialbox/box-open-elements/patterns/<area>` and `@unofficialbox/box-open-elements/patterns/<area>/<module>`

See the versioned [API guidelines](https://github.com/unofficialbox/box-open-elements/blob/v0.22.0/docs/api-guidelines.md).

## Developing

This repo uses Bun as its package manager and task runner.

```bash
bun install
bun run verify   # the main safety gate: typecheck, coverage-gated tests, build
bun run docs     # build + serve the docs site at http://localhost:4600
```

## Documentation

The versioned docs index is at [docs/README.md](https://github.com/unofficialbox/box-open-elements/blob/v0.22.0/docs/README.md). The most important entries:

- [Taxonomy](https://github.com/unofficialbox/box-open-elements/blob/v0.22.0/docs/taxonomy.md)
- [Architecture](https://github.com/unofficialbox/box-open-elements/blob/v0.22.0/docs/architecture.md)
- [API Guidelines](https://github.com/unofficialbox/box-open-elements/blob/v0.22.0/docs/api-guidelines.md)
- [Components catalog](https://github.com/unofficialbox/box-open-elements/blob/v0.22.0/docs/components/catalog.md) and [patterns catalog](https://github.com/unofficialbox/box-open-elements/blob/v0.22.0/docs/patterns/catalog.md)
- [Using with React, Angular, Vue, and Svelte](https://github.com/unofficialbox/box-open-elements/blob/v0.22.0/docs/integration/frameworks.md)
- [Design Tokens](https://github.com/unofficialbox/box-open-elements/blob/v0.22.0/docs/foundations/tokens.md)
- [Content Explorer](https://github.com/unofficialbox/box-open-elements/blob/v0.22.0/docs/patterns/content-explorer.md)
- [Box Server Integration](https://github.com/unofficialbox/box-open-elements/blob/v0.22.0/docs/integration/box-server.md)
- [Agent UI guidelines](https://github.com/unofficialbox/box-open-elements/blob/v0.22.0/docs/patterns/agent-ui-guidelines.md), [building blocks](https://github.com/unofficialbox/box-open-elements/blob/v0.22.0/docs/patterns/agent-ui.md), and [motion](https://github.com/unofficialbox/box-open-elements/blob/v0.22.0/docs/foundations/motion.md)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup, the `bun run verify` gate, component conventions, the conformance audits, and the PR workflow. Maintainers: see [RELEASING.md](./RELEASING.md) for publishing to npm.
