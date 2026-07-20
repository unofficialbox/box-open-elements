# Using box-open-elements in React, Angular, Vue, and Svelte

`box-open-elements` ships standard **Web Components** (custom elements), so it
works in any framework that can render custom elements — which is all of them.
This guide shows the minimal setup and a working example per framework.

The published package is **`@unofficialbox/box-open-elements`**; every example
below uses it directly. (A typed React wrapper exists in-repo at
[`packages/react`](../../packages/react) but is not published yet — see the
[React](#react) note.)

## Common setup (all frameworks)

Install the package and, once at app startup, register the Box design tokens and
define the elements you use:

```bash
npm i @unofficialbox/box-open-elements
```

```ts
// app entry (main.ts / index.tsx / main.js …)
import {
  defineBoxButtonElement,
  defineBoxTextFieldElement,
  defineBoxSelectElement,
} from "@unofficialbox/box-open-elements";
import {
  applyDesignTokens,
  registerBoxDefaultDesignSystem,
} from "@unofficialbox/box-open-elements/foundations/tokens";

registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");

defineBoxButtonElement();
defineBoxTextFieldElement();
defineBoxSelectElement();
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
import type { BoxTextFieldElement } from "@unofficialbox/box-open-elements/components/forms/text-field";

function Example() {
  const [name, setName] = useState("");
  const field = useRef<BoxTextFieldElement>(null);

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

> **Typed wrappers.** The repo also has `@box-open-elements/react`
> (`<BoxButton>`, `<BoxTextField onValueChanged={…}>`) that hides the ref/event
> plumbing — see [react.md](./react.md). It isn't published to npm yet; until it
> is, prefer the direct usage above.

---

## Angular

Add `CUSTOM_ELEMENTS_SCHEMA` so the template compiler allows custom tags. Then
property binding `[prop]` sets the DOM property (works for objects), and event
binding `(event)` subscribes to any event — including custom ones.

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

@Component({
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
stringification. Call the `defineBox*Element()` functions once in `main.ts`
(before `bootstrapApplication`).

---

## Vue 3

Tell Vue's compiler that `box-*` tags are custom elements (so it doesn't try to
resolve them as Vue components). In Vite:

```ts
// vite.config.ts
import vue from "@vitejs/plugin-vue";
export default {
  plugins: [
    vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("box-") } } }),
  ],
};
```

Then bind properties with `:prop` (Vue sets the DOM property when it exists) and
listen to custom events with `@event`; the payload is on `$event.detail`:

```vue
<script setup lang="ts">
import { ref } from "vue";
const name = ref("");
const status = ref("draft");
const options = [{ label: "Draft", value: "draft" }, { label: "Live", value: "live" }];
</script>

<template>
  <box-text-field label="Project name" :value="name"
                  @value-changed="name = $event.detail.value" />

  <box-select label="Status" :value="status" :options="options"
              @value-changed="status = $event.detail.value" />

  <box-button label="Save" tone="primary" @click="console.log(name, status)" />
</template>
```

For a stubborn primitive that must be a property rather than an attribute, use
the `.prop` modifier: `:label.prop="title"`.

---

## Svelte

Svelte renders custom elements natively. Primitive attributes and events work
inline; set **object properties** imperatively via `bind:this`, since attributes
can only hold strings.

```svelte
<script lang="ts">
  let name = "";
  let status = "draft";
  const options = [{ label: "Draft", value: "draft" }, { label: "Live", value: "live" }];

  let selectEl: HTMLElement & { options?: unknown };
  // Assign the array to the element property whenever it changes.
  $: if (selectEl) selectEl.options = options;
</script>

<box-text-field
  label="Project name"
  value={name}
  on:value-changed={(e) => (name = e.detail.value)} />

<box-select
  bind:this={selectEl}
  label="Status"
  value={status}
  on:value-changed={(e) => (status = e.detail.value)} />

<box-button label="Save" tone="primary" on:click={() => console.log(name, status)} />
```

---

## Notes

- **SSR / hydration.** These components render in a browser (shadow DOM). For
  SSR frameworks (Next, Nuxt, SvelteKit, Analog), define + register the elements
  on the **client** only, or guard the tokens/`define` calls behind a
  browser check to avoid running them during server render.
- **Theming.** Swap the whole catalog's look at runtime with
  `registerBoxDarkDesignSystem()` + `setActiveDesignSystem("box-dark")` — see
  [../foundations/tokens.md](../foundations/tokens.md).
- **Framework support status** (validated adapters vs. direct usage) is tracked
  in [framework-adapters.md](./framework-adapters.md).
