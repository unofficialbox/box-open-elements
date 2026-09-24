# React Adapter

Optional React wrappers for `box-open-elements` Web Components live in
[`packages/react`](../../packages/react) as
`@unofficialbox/box-open-elements-react`.
Cross-framework status and acceptance milestones live in the
[Framework Adapter Progress tracker](./framework-adapters.md).

## Goal

Keep `src/` free of React (or any UI framework). Consumers who want JSX ergonomics
can depend on the adapter package without pulling React into the core design system.

```mermaid
flowchart LR
    A["box-open-elements Web Components"] --> B["@unofficialbox/box-open-elements-react"]
    B --> C["App React tree"]
    A --> D["Plain HTML / other frameworks"]
```

## Boundary

| Layer | Owns |
| --- | --- |
| Core (`src/`) | Custom elements, foundations, patterns — no React |
| `@unofficialbox/box-open-elements-react` | Thin wrappers: import registered elements, sync props as properties, forward refs/events |
| App | Tokens registration, composition, data fetching |

## Validated surface

| Export | Wraps |
| --- | --- |
| `Button` | `<box-button>` |
| `TextField` | `<box-text-field>` value control + typed `onValueChanged` |
| `Select` | `<box-select>` + structured `options` property + typed `onValueChanged` |
| `Dialog` | `<box-dialog>` + controlled `open`, typed close events, focus/ref behavior |
| `NumberInput`, `Checkbox`, `Tabs`, `Card`, `Alert`, `Toast`, `Drawer`, `CodeBlock` | Studio controls, feedback, composition and editing surfaces |
| `createWebComponent` | Shared property/event/ref adapter factory |
| `useExplorerSelectionController` | React subscription to the framework-neutral selection controller |

## Usage

The root import remains convenient and tree shakes unused wrappers. Direct subpaths are also available when a host wants explicit imports:

```ts
import { Button, NumberInput, Toast } from "@unofficialbox/box-open-elements-react";
import { NumberInput as DirectNumberInput } from "@unofficialbox/box-open-elements-react/number-input";
```

An omitted `open`, `value`, or other property leaves the underlying element's imperative state alone. Supply a prop to control it from React. NumberInput emits a numeric `event.detail.value`; refs use the underlying custom element type. `Toast` reports `dismiss` with `detail.source` as `timeout` or `close-button`.

The adapter package marks its modules tree shakable. Core custom elements keep their registration side effects. `bun run bundles:check` verifies a root Button import includes only Button, and that its registration survives optimization.

```ts
import { Button, Dialog, Select, TextField } from "@unofficialbox/box-open-elements-react";
import {
  applyDesignTokens,
  registerBoxDefaultDesignSystem,
} from "@unofficialbox/box-open-elements/foundations/tokens";

registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");

<Button label="Save" tone="primary" onClick={handleSave} />

<TextField
  label="Project name"
  value={projectName}
  onValueChanged={event => setProjectName(event.detail.value)}
/>

<Select
  label="Status"
  value={status}
  options={[{ label: "Draft", value: "draft" }]}
  onValueChanged={event => setStatus(event.detail.value)}
/>

<Dialog
  open={dialogOpen}
  heading="Delete item"
  onOpenChanged={event => setDialogOpen(event.detail.open)}
>
  This cannot be undone.
</Dialog>
```

Component props map only to element **properties**, so booleans and structured
arrays do not depend on React attribute stringification. Declared event props
use stable DOM subscriptions that call the latest handler. Forwarded refs
resolve to the underlying custom element.

### Event callbacks receive native events

Every callback prop an adapter **declares** — `onClick` on `Button`,
`onValueChanged`, `onOpenChanged`, `onConfirm`, `onCancel` — is registered with
`addEventListener` on the custom element and receives the **native** DOM event.
It is not a React `SyntheticEvent`: there is no `.nativeEvent`, and
`stopPropagation` acts on the real tree.

The reason is portability of the listener rather than purity. React delegates
from its root container, so an element that has been relocated outside that
container stops receiving delegated events, while a listener bound to the
element travels with it.

This was found through `box-drawer`, which used to move its whole subtree to
`document.body` when it opened — a `Button` inside an open drawer with React's
own `onClick` looked wired up and did nothing. **The drawer no longer moves
anything**; it uses the top layer instead. But the hazard is not specific to
that component: any host that relocates a subtree — a third-party portal, an app
moving nodes by hand — reproduces it.

```tsx
<Button
  label="Save"
  onClick={event => {
    // event is a MouseEvent; event.currentTarget is the <box-button>
    save();
  }}
/>
```

### Delegated props still behave like React's

Anything an adapter does *not* declare is forwarded to the host element as an
ordinary React prop, including React's own `onClick` on `Select`, `TextField`
and `Dialog`. Those receive a `SyntheticEvent` and are delegated from the root
container as usual.

Inside a `box-drawer` that is now fine — the drawer keeps its subtree where React
put it. It stops being fine the moment something *else* relocates the node out
of the React root, and that is React's delegation model rather than anything
these components do: a plain `<div onClick>` in a relocated subtree is dead in
exactly the same way. If a handler has to survive that, put it on a `Button`, or
bind it yourself with `addEventListener` via a ref.


`useExplorerSelectionController(controller)` uses React's external-store
contract to render the controller snapshot. Selection rules and mutations stay
inside `ExplorerSelectionController`; the hook does not create a second state
machine.

## SSR and hydration

The adapter and component modules are safe to import without `HTMLElement` or
`customElements`. Server rendering emits inert `box-*` hosts and slotted
content. Property synchronization, event subscriptions, and custom-element
upgrade happen in the browser; `suppressHydrationWarning` is scoped to each
adapter host for expected custom-element differences.

In SSR frameworks, import or initialize design tokens in client code because
token application requires a document.

The production Next.js fixture at
[`examples/frameworks/react-ssr`](../../examples/frameworks/react-ssr)
prerenders the adapter hosts, then proves browser upgrade and hydration without
console errors. It also exercises events, controller state, dialog focus, and
focus restoration after Escape.

## Supported versions

| Dependency | Supported contract |
| --- | --- |
| React / React DOM | `^19.0.0` |
| `@unofficialbox/box-open-elements` | Same release line as the adapter |
| Node.js for SSR | `>=20.9.0` |
| Next.js validated host | `16.2.12` |

## Scope

The adapter covers the validated interaction families above. Other catalog items remain usable as custom elements in React; add wrappers when typed props or event handling bring a practical benefit.
- Replacing headless controllers with React state libraries

## Related

- [Framework Adapter Progress](./framework-adapters.md) — canonical React, Angular, Vue, and Svelte tracker
- [Architecture](../architecture.md) — adapter packages as an optional outer layer
- [Box Server Integration](./box-server.md) — sibling optional package pattern
- Package README: [`packages/react/README.md`](../../packages/react/README.md)
