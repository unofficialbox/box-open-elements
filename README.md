# box-open-elements

`box-open-elements` is an open, framework-agnostic design system and web component library for Box-style experiences.

It is a ground-up rebuild of [`box-open-web-components`](https://github.com/unofficialbox/box-open-web-components), carrying forward that repo's validated architecture, docs, and research — without its accumulated baggage — under a new industry-standard taxonomy:

- **Foundations** — design decisions as data: tokens, color, typography, iconography, accessibility, theming
- **Components** — accessible Web Components for single controls, organized by category
- **Patterns** — combinations of components that address user objectives with sequences and flows: headless controllers, transport contracts, and composed workflow surfaces, grouped by Box noun

See [docs/taxonomy.md](./docs/taxonomy.md) for the canonical model and [docs/migration-map.md](./docs/migration-map.md) for how the old repo maps onto this one.

The guiding idea is unchanged: predictable, extensible building blocks that are easy for both human developers and AI coding assistants to compose.

- plain TypeScript modules, no React requirement in the core package
- state and business logic separate from rendering: controllers and stores, not framework components
- standard DOM events where a UI layer needs them
- accessibility semantics and keyboard support as part of the component contract
- injected transport contracts instead of SDK coupling

## Setup

This package uses Bun as its package manager and task runner.

```bash
bun install
```

## Common commands

```bash
bun run typecheck
bun run test
bun run test:coverage
bun run build
bun run verify
```

`bun run verify` is the main safety check and runs typecheck, tests, and build in sequence.

## Current state

Phases 0–2 of the [roadmap](./docs/roadmap.md) are complete:

- `src/core` — typed event emitter and controller base class
- `src/foundations/tokens` — the design-system registry (tokens, icons, illustrations) and the Box default bundle
- `src/foundations/icons` — the generated Box iconography manifest and alias layer
- `src/components` — 39 components across actions, collections, feedback, files, forms, identity, navigation, overlays, and visuals
- `src/patterns/content-explorer` — the full headless explorer stack (collection, navigation, selection, actions, facade controller, data-source contracts, Box transport, wire schemas) plus the `box-explorer-*` presentation adapters
- `src/patterns/search` and `src/patterns/item` — the first pattern compositions (filter bar, search results header, saved view picker, item form, item details panel, bulk action bar, preview header)

Everything else in the [components catalog](./docs/components/catalog.md) and [patterns catalog](./docs/patterns/catalog.md) has a reference implementation in `box-open-web-components` and is ported deliberately, phase by phase.

## Example: foundations + components

```ts
import {
  applyDesignTokens,
  registerBoxDefaultDesignSystem,
} from "box-open-elements/foundations/tokens";
import { defineBoxButtonElement } from "box-open-elements/components/actions/button";

registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");
defineBoxButtonElement();
```

```html
<box-button label="Save" tone="primary"></box-button>
```

Components consume foundation tokens (`--boe-token-*`) with safe fallbacks, so they render sensibly with no design system registered and restyle automatically when one is active.

## Example: headless patterns

```ts
import { ExplorerSelectionController } from "box-open-elements/patterns/content-explorer/selection";

const selection = new ExplorerSelectionController({ selectionMode: "multiple" });

selection.subscribe("selectionChanged", ({ selectedItemIds }) => {
  console.log(selectedItemIds);
});

selection.setItems([{ id: "1" }, { id: "2" }]);
selection.toggleSelection("1");
```

Workflow patterns begin as headless behavior and gain presentation adapters, so custom React components, Vue SFCs, Angular templates, Web Components, and plain DOM can all consume the same state.

## Import contract

- root exports: `box-open-elements`
- shared runtime: `box-open-elements/core`
- foundations: `box-open-elements/foundations/<module>`
- components: `box-open-elements/components/<category>/<name>`
- patterns: `box-open-elements/patterns/<area>` and `box-open-elements/patterns/<area>/<module>`

New exports follow the wildcard contract by default instead of adding explicit `package.json` entries. See [docs/api-guidelines.md](./docs/api-guidelines.md).

## Documentation

The docs index is at [docs/README.md](./docs/README.md). The most important entries:

- [Taxonomy](./docs/taxonomy.md)
- [Architecture](./docs/architecture.md)
- [API Guidelines](./docs/api-guidelines.md)
- [Roadmap](./docs/roadmap.md)
- [Migration Map](./docs/migration-map.md)
- [Design Tokens](./docs/foundations/tokens.md)
- [Content Explorer](./docs/patterns/content-explorer.md)
- [Box Server Integration](./docs/integration/box-server.md)
