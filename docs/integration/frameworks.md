# Using box-open-elements in React, Angular, Vue, and Svelte

`box-open-elements` ships standard **Web Components** (custom elements), so it
works in any framework that can render custom elements — which is all of them.
This guide shows the minimal setup and a working example per framework.

Runnable compiler/build fixtures for all four frameworks live in
[`examples/frameworks`](../../examples/frameworks) and run as part of
`bun run verify`. React, Angular, Vue, and Svelte have published adapter packages
at the same version as the core, which they peer-depend on exactly.

The core package is **`@unofficialbox/box-open-elements`**; every direct example
below uses it. Framework adapters remain thin optional layers and publish as:

- `@unofficialbox/box-open-elements-react`
- `@unofficialbox/box-open-elements-angular`
- `@unofficialbox/box-open-elements-vue`
- `@unofficialbox/box-open-elements-svelte`

All four adapters share one version and `adapters-vX.Y.Z` release train.

## Common setup (all frameworks)

Install the package and, once at app startup, register the Box design tokens and
define the elements you use:

```bash
npm i @unofficialbox/box-open-elements
```

```ts
// app entry (main.ts / index.tsx / main.js …)
import {
  Button,
  TextField,
  Select,
} from "@unofficialbox/box-open-elements";
import {
  applyDesignTokens,
  registerBoxDefaultDesignSystem,
} from "@unofficialbox/box-open-elements/foundations/tokens";

registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");

```

The one thing to know across every framework: **primitive props** (strings,
booleans) pass fine as attributes, but **structured props** (objects/arrays like
a `<box-select>`'s `options`) must be set as a DOM **property**, and
**custom events** (e.g. `value-changed`) carry their payload on `event.detail`.
Each section below shows the framework-idiomatic way to do both.

### Native TypeScript types

Import the opt-in type entry once to get the generated tag-name map, writable
properties, and element-specific `CustomEvent` details without local casts:

```ts
import "@unofficialbox/box-open-elements/table";
import type {} from "@unofficialbox/box-open-elements/native-types";

const table = document.createElement("box-table");
table.rows = [{ id: "one", cells: { name: "Contract" } }];
table.addEventListener("selection-changed", event => {
  console.log(event.detail.selectedIds); // string[]
});
```

The type entry has no registration side effect. Its map and the React JSX entry
include writable properties and dispatched events inherited from library bases,
while retaining subclass property overrides and element-specific event details.
They are generated from the element classes and their dispatched events; `bun run
maps:check` and `bun run types:check` catch drift in `bun run verify`.
Events without an inferable detail and generic node payloads use `unknown`, so
consumers narrow those explicitly instead of receiving an unsafe `any`.

---

## React

React 19 sets recognized custom-element properties directly and listens to
custom events with an `on` prefix. Keep the exact event spelling and dashes,
as [React's custom-element guidance](https://react.dev/reference/react-dom/components#custom-html-elements)
requires. Import the generated JSX types once in your app's TypeScript scope:

```tsx
import { useState } from "react";
import "@unofficialbox/box-open-elements/button";
import "@unofficialbox/box-open-elements/text-field";
import type {} from "@unofficialbox/box-open-elements/react-jsx";

function Example() {
  const [name, setName] = useState("");

  return (
    <>
      <box-text-field label="Project name" value={name}
        onvalue-changed={event => setName(event.detail.value)} />
      <box-button label="Save" tone="primary" onClick={() => console.log(name)} />
    </>
  );
}
```

The generated JSX types cover all registered tags, structured properties such
as `rows`, `stages`, and `items`, reflected booleans, and dashed native event names.
The JSX entry also supplies the native event and tag types; no separate root or
`native-types` import is needed for type checking. `types:validate` compiles that
single-import contract in isolation from the other consumer fixture.
React's server render omits object-valued props; hydrate on the client when a
custom element needs them. The optional adapter adds `Dialog` plus
`useExplorerSelectionController`; see [react.md](./react.md).

---

## Angular

Import the standalone directives into the consuming component. They register
their custom elements and give strict templates typed property inputs and
custom-event outputs without `CUSTOM_ELEMENTS_SCHEMA`.

```ts
import { Component } from "@angular/core";
import {
  Button,
  Select,
  TextField,
} from "@unofficialbox/box-open-elements-angular";

@Component({
  standalone: true,
  imports: [Button, Select, TextField],
  template: `
    <box-text-field label="Project name" [value]="name"
                    (value-changed)="name = $event.detail.value"></box-text-field>

    <box-select label="Status" [value]="status" [options]="options"
                (value-changed)="status = $event.detail.value"></box-select>

    <box-button label="Save" tone="primary" (click)="save()"></box-button>
  `,
})
export class ExampleComponent {
  name = "";
  status = "draft";
  options = [{ label: "Draft", value: "draft" }, { label: "Live", value: "live" }];
  save() { console.log(this.name, this.status); }
}
```

`[options]="options"` binds the array to the element **property** directly — no
stringification. `createExplorerSelectionSignal(controller)` adds a scoped,
readonly Angular signal for headless selection composition.

---

## Vue 3

Import the typed Vue components. They synchronize properties after mount,
re-emit typed custom events, expose the underlying element ref, and remain safe
to render on the server.

```vue
<script setup lang="ts">
import { ref } from "vue";
import { Button, Select, TextField } from "@unofficialbox/box-open-elements-vue";
const name = ref("");
const status = ref("draft");
const options = [{ label: "Draft", value: "draft" }, { label: "Live", value: "live" }];
</script>

<template>
  <TextField label="Project name" :value="name"
             @value-changed="name = $event.detail.value" />

  <Select label="Status" :value="status" :options="options"
          @value-changed="status = $event.detail.value" />

  <Button label="Save" tone="primary" @click="console.log(name, status)" />
</template>
```

`useExplorerSelectionController(controller)` returns a scoped readonly ref and
disposes its subscription with the consuming Vue scope.

---

## Svelte

The Svelte package handles the framework's structured-property gap explicitly,
uses callback props for typed custom events, and exposes a bindable `element`
reference.

```svelte
<script lang="ts">
  import { Button, Select, TextField } from "@unofficialbox/box-open-elements-svelte";
  let name = "";
  let status = "draft";
  const options = [{ label: "Draft", value: "draft" }, { label: "Live", value: "live" }];

</script>

<TextField
  label="Project name"
  value={name}
  onValueChanged={(e) => (name = e.detail.value)} />

<Select
  label="Status"
  value={status}
  {options}
  onValueChanged={(e) => (status = e.detail.value)} />

<Button label="Save" tone="primary" onClick={() => console.log(name, status)} />
```

---

## Notes

- **SSR / hydration.** Adapter imports and host rendering are server-safe.
  Shadow DOM, property synchronization, tokens, and custom-element upgrade run
  in the browser. Apply design tokens only when `document` is available.
- **Theming.** Use `createThemeController()` for persistent
  light/dark/system switching in every framework — see
  [../foundations/theming.md](../foundations/theming.md).
- **Framework support status** (validated adapters vs. direct usage) is tracked
  in [framework-adapters.md](./framework-adapters.md).
