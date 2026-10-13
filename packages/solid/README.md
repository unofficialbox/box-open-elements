# SolidJS adapter

`@unofficialbox/box-open-elements-solid` is published on npm and independently
reviewed. Its `0.42.2` human bootstrap was verified by integrity/content comparison
against merged commit `03fa63b33105dbcef9a6c1e6eed770db2e554cb4`, a normal isolated
registry install, public JSX types, SSR/hydration, and real browser acceptance.
That bootstrap has no OIDC provenance; publisher setup and first OIDC validation
are distinct release steps. See [RELEASING.md](../../RELEASING.md).

```sh
npm install @unofficialbox/box-open-elements-solid solid-js
```

Exports: `Button`, `TextField`, `Select`, `Dialog`, `Combobox`, `Drawer`, `createWebComponent`,
`ExplorerSelectionController`, and `useExplorerSelectionController`, with public
prop/event/ref declarations and per-component subpath exports.

Peers for this package version: core `^0.42.3` and solid-js `^1.9.17`.

```tsx
import { TextField, Select, Dialog } from "@unofficialbox/box-open-elements-solid";

// Render inside your framework component. Pass normal JSX props, including
// reactive signal reads in Solid. Structured values go through BOE setters.
<TextField name="title" label="Title" value="Example"
  ref={element => element?.focus()}
  onValueChanged={event => console.log(event.detail.value)} />;
<Select options={[{ label: "One", value: "1" }]} value="1" />;
<Dialog open={false} heading="Details"><span slot="footer">Footer</span></Dialog>;
```

Solid props remain getter-backed through `splitProps`; the host does not remount
when signals update. Call `useExplorerSelectionController` within a Solid owner;
it returns an accessor and owner disposal releases the subscription. Refs follow
Solid's element callback/JSX assignment contract; callbacks are not called with
null at disposal. Use `onCleanup` for external ref-owned resources.

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
Mapped listeners attach before initial property sync, including synchronous
`open-changed` notifications from initially-open Dialog and Drawer. Browser
fixtures cover closed-first and initially-open client/hydrated rendering.
Include `generateHydrationScript()` in the server HTML and compile both halves
with Solid's hydratable JSX compiler. SolidStart is not verified.

Validation: `bun run frameworks:solid`, `bun run frameworks:solid:ssr`,
`bun run test -- packages/solid`, `bun run frameworks:jsx:browser`, and
`bun run adapters:pack-check`. See [support status](../../docs/integration/framework-adapters.md)
and [release requirements](../../RELEASING.md).

Design references: [Solid dynamic hosts](https://docs.solidjs.com/reference/components/dynamic),
[exact native events](https://docs.solidjs.com/reference/jsx-attributes/on), and
[owner cleanup](https://docs.solidjs.com/reference/lifecycle/on-cleanup).
The installed 1.9.17 `solid-js/web` source confirms dynamic host hydration-key
reuse and separate server rendering. The factory uses those runtime APIs so the
published adapter itself needs no JSX compiler transform.
