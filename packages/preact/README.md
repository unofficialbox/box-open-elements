# Preact adapter

`@unofficialbox/box-open-elements-preact` is implemented, awaiting independent review,
and **not published**. Use the workspace or a locally packed tarball for now.
The package version follows core lockstep; it does not indicate npm availability.

Exports: `Button`, `TextField`, `Select`, `Dialog`, `Combobox`, `Drawer`, `createWebComponent`,
`ExplorerSelectionController`, and `useExplorerSelectionController`, with public
prop/event/ref declarations and per-component subpath exports.

Peers: core `^0.42.2` and preact `^11.0.1`.

```tsx
import { TextField, Select, Dialog } from "@unofficialbox/box-open-elements-preact";

// Render inside your framework component. Pass normal JSX props, including
// reactive signal reads in Solid. Structured values go through BOE setters.
<TextField name="title" label="Title" value="Example"
  ref={element => element?.focus()}
  onValueChanged={event => console.log(event.detail.value)} />;
<Select options={[{ label: "One", value: "1" }]} value="1" />;
<Dialog open={false} heading="Details"><span slot="footer">Footer</span></Dialog>;
```

This package uses Preact 11's native ref-as-prop contract and native hooks, with
no `preact/compat` dependency. Object refs and callback refs are forwarded to the
host; Preact callback-ref cleanup functions are preserved. The controller hook
subscribes after commit and releases on controller change/unmount. Preact 10 is
not in the supported peer range.

Mapped BOE event callbacks receive the actual DOM event; `preventDefault` and
`stopPropagation` act on it. Cancellation works when the underlying event is
cancelable; BOE Dialog's `cancel` notification itself is not cancelable. Factory
`events` maps preserve exact spelling/case, and listeners are removed when the
framework owner unmounts. Temporary DOM disconnect/reconnect retains the owner.
The wrappers retain BOE's optional-property semantics: omitted scalar props leave
the element value alone; disabled/invalid default to false. Use explicit false,
empty string, or empty array to clear controlled values. BOE Select intentionally
reflects its assigned options array as JSON. Host attributes, children, and slots
remain framework-native; use Solid's `attr:*`/`bool:*` for explicit attribute mode.

SSR imports require no DOM globals. Server rendering emits inert custom-element
hosts and light-DOM children; controlled properties and arrays are assigned on
client hydration, so do not expect populated shadow DOM before JavaScript runs.
Hydrate with native `preact.hydrate` and use `preact-render-to-string` for server
rendering. Deduplicate Preact in bundlers to keep renderer/hooks on one runtime.

Validation: `bun run frameworks:preact`, `bun run frameworks:preact:ssr`,
`bun run test -- packages/preact`, `bun run frameworks:jsx:browser`, and
`bun run adapters:pack-check`. See [support status](../../docs/integration/framework-adapters.md)
and [release requirements](../../RELEASING.md).

Design references: [Preact 11 custom elements](https://preactjs.com/guide/v11/web-components/) and
[native SSR](https://preactjs.com/guide/v11/server-side-rendering/).
The installed 11.0.1 `create-element` source preserves refs in function-component
props, and native callback refs support cleanup functions. A dedicated native
adapter avoids React peer/type/event contracts and does not depend on compat.
