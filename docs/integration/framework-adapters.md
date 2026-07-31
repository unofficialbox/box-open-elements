# Framework Adapter Progress

This is the canonical progress tracker for consuming `box-open-elements` from
React, Angular, Vue, and Svelte. The core package remains framework-agnostic;
framework work lives in optional packages, examples, and integration tests.

> Looking for **how to use the components** in your framework? See
> [Using with React, Angular, Vue, and Svelte](./frameworks.md) for setup and
> working examples. This page tracks adapter *maturity*, not usage.

## Status model

| Status | Completion | Meaning |
| --- | ---: | --- |
| **Tracked** | **0%** | Framework is in the roadmap; no validated integration yet |
| **PoC** | **20%** | A reusable adapter decision or factory exists with one representative component |
| **Validated** | **40%** | A real app or focused test proves the shared custom-element interop checklist |
| **Beta** | **70%** | Representative controls, overlays, and one pattern/controller composition are covered |
| **Release candidate** | **90%** | Package, versions, SSR/hydration, examples, and CI are release-ready |
| **Supported** | **100%** | A clean install from the public registry is published and verified |

Do not mark a framework supported because its runtime can render an arbitrary
custom element. Each status requires the evidence described above.

Completion measures progress through these support milestones, not the
percentage of catalog components wrapped. This keeps the metric meaningful as
the component catalog changes.

## Current progress

| Framework | Completion | Direct custom-element interop | Typed adapter foundation | Representative components | Pattern/controller proof | SSR/hydration guidance | Overall |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| React 19 | **90%** | **Validated**: properties, native/composed events, latest handlers, refs | **Built**: `createWebComponent` | **4**: `Button`, `TextField`, `Select`, `Dialog` | `ExplorerSelectionController` via `useSyncExternalStore` | Next.js 16 prerender, hydration, upgrade, and events; adapter focus contract validated | **Release candidate** |
| Angular 20 | **40%** | **Validated**: strict templates, properties, custom events | Not needed | **3 direct**: button, text field, select | Not started | Client registration documented | **Validated** |
| Vue 3 | **40%** | **Validated**: compiler config, properties, custom events | Not needed | **3 direct**: button, text field, select | Not started | Client registration documented | **Validated** |
| Svelte 5 | **40%** | **Validated**: properties, custom events, element refs | Not needed | **3 direct**: button, text field, select | Not started | Client registration documented | **Validated** |

## Framework lanes

### React

Current implementation: [`packages/react`](../../packages/react) exposes
`@unofficialbox/box-open-elements-react`, `Button`, `TextField`, `Select`, `Dialog`,
`createWebComponent`, and `useExplorerSelectionController`.

Validation evidence:

- `TextField` proves value/boolean/form-property updates, typed composed
  `value-changed`, latest-handler routing, and forwarded element refs.
- `Select` proves structured option arrays are assigned as properties rather
  than passed through React's host-attribute spread.
- `Button` keeps native `onClick` forwarding covered.
- `Dialog` proves controlled `open` state, typed close events, slotted children,
  focus entry/restoration, and underlying element refs.
- `useExplorerSelectionController` proves React can subscribe to a headless
  controller without copying its state machine into a framework store.
- Node-environment server rendering proves adapter imports and inert custom
  element hosts do not require DOM globals.
- The Next.js 16 fixture proves server prerendering, browser hydration,
  custom-element upgrade, controller events, dialog focus entry, and Escape
  close without visible runtime errors. Focus restoration is covered by the
  focused adapter test above.

Next **Supported** proof set:

1. publish `@unofficialbox/box-open-elements-react` through the dedicated
   trusted-publishing workflow
2. verify a clean consumer install from npm

Do not wrap the whole catalog mechanically. Continue by interaction family so
the factory is proven against distinct property, event, focus, and lifecycle
shapes.

### Angular

Validated in [`examples/frameworks/angular`](../../examples/frameworks/angular)
with `CUSTOM_ELEMENTS_SCHEMA`, strict template compilation, structured property
binding, custom events, tokens, and a production build. No wrapper gap has been
demonstrated.

### Vue

Validated in [`examples/frameworks/vue`](../../examples/frameworks/vue) with
custom-element compiler configuration, structured property binding, custom
events, tokens, `vue-tsc`, and a production build. No wrapper gap has been
demonstrated.

### Svelte

Validated in [`examples/frameworks/svelte`](../../examples/frameworks/svelte)
with structured property assignment through an element ref, custom events,
tokens, `svelte-check`, and a production build. No wrapper gap has been
demonstrated. SSR framework hydration remains a separate milestone.

## Shared validation checklist

Every framework must prove the following before moving from **PoC** to
**Validated**:

- register an element idempotently
- assign booleans, arrays, and structured objects as properties
- receive native and composed custom events with typed payloads
- expose the underlying element ref for imperative pattern/controller wiring
- apply design-system tokens without framework-specific core code
- run a focused integration test in `bun run verify`

Before moving from **Validated** to **Beta**, also cover representative value and
overlay components, compose one headless controller without copying its state
machine, and document client rendering plus SSR/hydration behavior.

## Decision rules

- Keep React, Angular, Vue, and Svelte dependencies out of `src/`.
- Start with native custom-element consumption; introduce wrappers only for a
  demonstrated typing, event, ref, or lifecycle gap.
- Share behavior through headless controllers, not framework-specific stores.
- Prefer a small representative proof set over shallow full-catalog wrappers.
- Track framework versions once a runnable integration exists; do not claim a
  version from documentation-only examples.

## Updating this tracker

When a framework milestone lands, update:

1. the progress table and framework lane above
2. the owning package/example README
3. CI/typecheck commands if a new workspace package or example app is added

Related: [React Adapter](./react.md), [Architecture](../architecture.md), and
[API Guidelines](../api-guidelines.md).
