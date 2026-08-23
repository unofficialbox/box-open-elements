# @unofficialbox/box-open-elements-react

Optional React wrappers for [`box-open-elements`](../..) Web Components.

The core package stays framework-agnostic. This adapter is a thin layer that:

1. imports the automatically registered custom element
2. syncs React props onto element **properties** (not fragile attribute stringification)
3. forwards refs and DOM events

See [`docs/integration/react.md`](../../docs/integration/react.md) for the React
boundary and the [framework adapter tracker](../../docs/integration/framework-adapters.md)
for cross-framework milestones.

## Install

```bash
npm install @unofficialbox/box-open-elements @unofficialbox/box-open-elements-react react react-dom
```

```ts
import { Button, Dialog, Select, TextField } from "@unofficialbox/box-open-elements-react";
import {
  applyDesignTokens,
  registerBoxDefaultDesignSystem,
} from "@unofficialbox/box-open-elements/foundations/tokens";

registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");

export function SaveAction() {
  return (
    <>
      <TextField label="Project" value="Apollo" />
      <Select
        label="Status"
        value="draft"
        options={[{ label: "Draft", value: "draft" }]}
      />
      <Button label="Save" tone="primary" onClick={() => console.log("saved")} />
    </>
  );
}
```

The supported surface also includes a controlled `Dialog` wrapper and
`useExplorerSelectionController`, which subscribes React to the existing
headless selection controller without duplicating its state.

## Status

**Supported** as of `0.7.0` — `Button`, `TextField`, `Select`, and `Dialog` prove
native and composed events, value and structured property synchronization, latest
callback routing, forwarded refs, controlled overlay focus behavior, and
server-safe host rendering. `useExplorerSelectionController` proves headless
controller composition. The two conditions this section used to defer on are met:
the first public npm publication happened at `0.7.0`, and a clean registry install
resolves the package and loads its exports. React releases in lockstep with the
Angular, Vue, and Svelte adapters under `adapters-vX.Y.Z`, at the core's version.

## Supported versions

| Dependency | Contract |
| --- | --- |
| React / React DOM | `^19.0.0` |
| `@unofficialbox/box-open-elements` | `^0.7.0` |
| Node.js for SSR | `>=20.9.0` |
| Next.js validation host | `16.2.12` |

The package ships ESM JavaScript and declarations from `dist/`. The Next.js
fixture in `examples/frameworks/react-ssr` proves server prerendering, browser
upgrade, hydration, events, controller subscriptions, and overlay focus.
