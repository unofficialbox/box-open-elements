# Framework Adapter Progress

This is the canonical progress tracker for consuming `box-open-elements` from
React, Angular, Vue, and Svelte. The core package remains framework-agnostic;
framework work lives in optional packages, examples, and integration tests.

## Status model

| Status | Meaning |
| --- | --- |
| **Tracked** | Framework is in the roadmap; no validated integration yet |
| **PoC** | A reusable adapter decision or factory exists with one representative component |
| **Validated** | A real app or focused test proves the shared custom-element interop checklist |
| **Beta** | Representative controls, overlays, and one pattern/controller composition are covered |
| **Supported** | Installation, versions, SSR/hydration guidance, examples, and CI are release-ready |

Do not mark a framework supported because its runtime can render an arbitrary
custom element. Each status requires the evidence described above.

## Current progress

| Framework | Direct custom-element interop | Typed adapter foundation | Representative components | Pattern/controller proof | SSR/hydration guidance | Overall |
| --- | --- | --- | --- | --- | --- | --- |
| React | Partial: property sync + native click via `BoxButton` tests | **Built**: `createWebComponent` | **1**: `BoxButton` | Not started | Partial: host hydration suppression only | **PoC** |
| Angular | Not started | Not decided | 0 | Not started | Not started | **Tracked** |
| Vue | Not started | Not decided | 0 | Not started | Not started | **Tracked** |
| Svelte | Not started | Not decided | 0 | Not started | Not started | **Tracked** |

## Framework lanes

### React

Current implementation: [`packages/react`](../../packages/react) exposes
`@box-open-elements/react`, `BoxButton`, and `createWebComponent`.

Next proof set:

1. a value control with property updates and a custom state-change event
2. an overlay with controlled `open` state and focus/ref behavior
3. one headless controller or workflow-pattern composition
4. explicit client-rendering and SSR/hydration guidance

Do not wrap the whole catalog mechanically. Expand by interaction family so the
factory is proven against distinct property, event, focus, and lifecycle shapes.

### Angular

First validate direct custom-element consumption in a minimal Angular host,
including the required custom-element schema/configuration, property binding,
custom events, and element refs. Add an adapter package only if real typing or
ergonomic gaps remain after that proof.

### Vue

First validate direct custom-element consumption in a minimal Vue host,
including custom-element compiler configuration, property binding, custom
events, and refs. Prefer documented native consumption over wrapper components
unless a concrete gap is demonstrated.

### Svelte

First validate direct custom-element consumption in a minimal Svelte host,
including property assignment, custom events, element refs, and SSR behavior.
Treat Svelte as a first-class tracked target; do not assume that native custom
element support alone satisfies the integration contract.

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
- Track framework versions when a lane becomes **Beta**, not before a runnable
  integration exists.

## Updating this tracker

When a framework milestone lands, update:

1. the progress table and framework lane above
2. the owning package/example README
3. [BACKLOG.md](../../BACKLOG.md) and [HANDOFF.md](../HANDOFF.md)
4. CI/typecheck commands if a new workspace package or example app is added

Related: [React Adapter](./react.md), [Architecture](../architecture.md), and
[API Guidelines](../api-guidelines.md).
