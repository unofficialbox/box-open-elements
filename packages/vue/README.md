# @unofficialbox/box-open-elements-vue

Typed Vue 3 wrappers for `box-open-elements`, including structured property
sync, custom-event emits, exposed element refs, and a selection-controller
composable.

```bash
npm install @unofficialbox/box-open-elements @unofficialbox/box-open-elements-vue vue
```

```vue
<script setup lang="ts">
import { Select, TextField } from "@unofficialbox/box-open-elements-vue";
const options = [{ label: "Draft", value: "draft" }];
</script>

<template>
  <TextField value="Apollo" @value-changed="event => console.log(event.detail.value)" />
  <Select :options="options" />
</template>
```

`useExplorerSelectionController(controller)` exposes the shared selection
controller as a scoped readonly ref. **Supported** as of `0.7.0`:
the first public lockstep adapter release, verified by a clean registry install.
