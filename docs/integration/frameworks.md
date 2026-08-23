# Using box-open-elements in React, Angular, Vue, and Svelte

`box-open-elements` ships standard **Web Components** (custom elements), so it
works in any framework that can render custom elements — which is all of them.
This guide shows the minimal setup and a working example per framework.

Runnable compiler/build fixtures for all four frameworks live in
[`examples/frameworks`](../../examples/frameworks) and run as part of
`bun run verify`. React, Angular, Vue, and Svelte have published adapter packages
at `0.7.0` — the same version as the core, which they peer-depend on exactly.

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

---

## React

React 19 sets custom-element props as **properties** and supports native events
(`onClick`) out of the box. React does **not** auto-subscribe to custom events,
so use a ref for those.

```tsx
import { useEffect, useRef, useState } from "react";
import "@unofficialbox/box-open-elements/text-field";
import type { TextField } from "@unofficialbox/box-open-elements/text-field";

function Example() {
  const [name, setName] = useState("");
  const field = useRef<TextField>(null);

  useEffect(() => {
    const el = field.current;
    if (!el) return;
    const onChange = (e: Event) =>
      setName((e as CustomEvent<{ value: string }>).detail.value);
    el.addEventListener("value-changed", onChange);
    return () => el.removeEventListener("value-changed", onChange);
  }, []);

  return (
    <>
      <box-text-field ref={field} label="Project name" value={name} />
      <box-button label="Save" tone="primary" onClick={() => console.log(name)} />
    </>
  );
}
```

Add the JSX typings once so the tags are recognized:

```ts
// box-elements.d.ts
import type { DetailedHTMLProps, HTMLAttributes } from "react";
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "box-button": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { label?: string; tone?: string };
      "box-text-field": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { label?: string; value?: string };
    }
  }
}
```

The typed adapter hides the ref/event plumbing and adds `Dialog` plus
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
