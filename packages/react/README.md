# @box-open-elements/react

Optional React wrappers for [`box-open-elements`](../..) Web Components.

The core package stays framework-agnostic. This adapter is a thin layer that:

1. registers the custom element
2. syncs React props onto element **properties** (not fragile attribute stringification)
3. forwards refs and DOM events

See [`docs/integration/react.md`](../../docs/integration/react.md) for the React
boundary and the [framework adapter tracker](../../docs/integration/framework-adapters.md)
for cross-framework milestones.

## Install (workspace)

```bash
bun add react react-dom
# consume from the monorepo package
```

```ts
import { BoxButton, BoxSelect, BoxTextField } from "@box-open-elements/react";
import {
  applyDesignTokens,
  registerBoxDefaultDesignSystem,
} from "@unofficialbox/box-open-elements/foundations/tokens";

registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");

export function SaveAction() {
  return (
    <>
      <BoxTextField label="Project" value="Apollo" />
      <BoxSelect
        label="Status"
        value="draft"
        options={[{ label: "Draft", value: "draft" }]}
      />
      <BoxButton label="Save" tone="primary" onClick={() => console.log("saved")} />
    </>
  );
}
```

## Status

**Validated** — `BoxButton`, `BoxTextField`, and `BoxSelect` prove native and
composed events, value and structured property synchronization, latest callback
routing, and forwarded element refs. The next Beta proof is an overlay plus one
headless controller composition and explicit SSR/hydration guidance.
