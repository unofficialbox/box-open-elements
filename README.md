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
bun run docs
```

`bun run docs` builds the library and serves the component-documentation site at `http://localhost:4600` — browse the full catalog with live previews, events/properties inspectors, and foundations pages.

`bun run verify` is the main safety check and runs typecheck, **coverage-gated** tests (`test:coverage`), and build in sequence. Floors and the measured baseline live in [docs/coverage-baseline.md](./docs/coverage-baseline.md).

## Current state

Phases 0–5 of the [roadmap](./docs/roadmap.md) are complete — full catalog parity with the reference repo, plus every scoped gap the research surfaced:

- `src/core` — typed event emitter, controller base class, `BaseElement` (in-place shadow DOM render contract), and `FormAssociatedElement` (native form participation + invalid state)
- `src/foundations/tokens` — the design-system registry (tokens, icons, illustrations), the Box default bundle, and the Box dark bundle, retoned to Box's modernized Blueprint palette with an Inter typography baseline; shared interaction helpers (`interaction.ts`) for focus/hover/active/disabled
- `src/foundations/motion` — shared duration/easing vocabulary and reduced-motion CSS helper
- `src/foundations/icons` — the generated Box iconography manifest and alias layer
- `tools/style-bridge` — CSS/SCSS → BOE token/selector bridge (`bun run style-bridge`; BUE explorer: `bun run style-bridge:bue-explorer`)
- `src/components` — 72 components across all ten categories, including the Phase 5 gap fills (`box-chip`, `box-divider`, `box-calendar`, `box-tag-input`, `box-nav-sidebar`, `box-sidebar-toggle-button`, `box-grid-view`, `box-fieldset`, `box-section`, `box-error-mask`, `box-draggable-list`, `box-nudge`, `box-pill-cloud`, `box-pill-selector-dropdown`, `box-datalist-item`, `box-contact-datalist-item`, `box-category-selector`)
- `src/patterns/content-explorer` — the full headless explorer stack (collection, navigation, selection, actions, facade controller, data-source contracts, Box transport, wire schemas) plus the `box-explorer-*` presentation adapters and the composed `box-content-explorer` surface
- `src/patterns/{search,item,metadata,share,preview,file-request,task,governance,insights}` — all nine composition/workflow areas, including contracts and wire schemas for metadata and share, the provider-neutral preview adapter stack, the pluggable `box-preview-element`, and the share workflows (`box-presence`, `box-invite-collaborators-modal`, `box-unified-share-modal`, `box-access-stats`, `box-collaborator-avatars`)
- `packages/box-server` — a dependency-free server-side adapter: CCG auth + REST client, Box-backed explorer/share/metadata data sources, DTO mappers, and framework-neutral route handlers (see [docs/integration/box-server.md](./docs/integration/box-server.md))
- `packages/react` — optional React wrappers (`@box-open-elements/react`); PoC ships `BoxButton` (see [docs/integration/react.md](./docs/integration/react.md))
- `storybook/` — a Bun-native workshop: typed stories → identity-guarded extracted JSON → a self-contained, separately-deployable static site, with no Storybook/Vite runtime or consumer dependency (see [storybook/README.md](./storybook/README.md))
- Docs site + CI — live GitHub Pages deploy, Storybook-backed variant dropdown, and a strict pixel-diff visual-regression gate in CI

**Fidelity program** (see [docs/HANDOFF.md](./docs/HANDOFF.md)): complete — Batches 0–7, the medium/low audit nits, and the design-heavy leftovers have shipped.

Everything in the [components catalog](./docs/components/catalog.md) and [patterns catalog](./docs/patterns/catalog.md) that carries a **built** marker is implemented here with dedicated tests. Remaining catalog entries are intentional generic-component gaps whose current implementations are explorer-bound; future additions are gap-driven rather than phase-gated ports.

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

- [Handoff](./docs/HANDOFF.md) — live fidelity-program status
- [Component Fidelity Audit](./docs/audits/component-fidelity-audit.md)
- [Taxonomy](./docs/taxonomy.md)
- [Architecture](./docs/architecture.md)
- [API Guidelines](./docs/api-guidelines.md)
- [Roadmap](./docs/roadmap.md)
- [Migration Map](./docs/migration-map.md)
- [Design Tokens](./docs/foundations/tokens.md)
- [Content Explorer](./docs/patterns/content-explorer.md)
- [Box Server Integration](./docs/integration/box-server.md)
