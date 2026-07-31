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
controller as a scoped readonly ref. Version `0.1.0` is a release candidate;
Supported status follows the first public lockstep adapter release and clean
registry-install verification.
