# @box-open-elements/react

Optional React wrappers for [`box-open-elements`](../..) Web Components.

The core package stays framework-agnostic. This adapter is a thin layer that:

1. registers the custom element
2. syncs React props onto element **properties** (not fragile attribute stringification)
3. forwards refs and DOM events

See [`docs/integration/react.md`](../../docs/integration/react.md) for the boundary and roadmap.

## Install (workspace)

```bash
bun add react react-dom
# consume from the monorepo package
```

```ts
import { BoxButton } from "@box-open-elements/react";
import {
  applyDesignTokens,
  registerBoxDefaultDesignSystem,
} from "box-open-elements/foundations/tokens";

registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");

export function SaveAction() {
  return <BoxButton label="Save" tone="primary" onClick={() => console.log("saved")} />;
}
```

## Status

PoC — `BoxButton` only. More wrappers can share `createWebComponent` as needed.
