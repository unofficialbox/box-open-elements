# @unofficialbox/box-open-elements-svelte

Typed Svelte 5 wrappers for `box-open-elements`, including explicit structured
property sync, callback props for custom events, bindable element refs, and a
selection-controller readable store.

```bash
npm install @unofficialbox/box-open-elements @unofficialbox/box-open-elements-svelte svelte
```

```svelte
<script lang="ts">
  import { Select, TextField } from "@unofficialbox/box-open-elements-svelte";
  const options = [{ label: "Draft", value: "draft" }];
</script>

<TextField value="Apollo" onValueChanged={(event) => console.log(event.detail.value)} />
<Select {options} />
```

`createExplorerSelectionStore(controller)` exposes the shared selection
controller as a standard readable store. Version `0.1.0` is a release candidate;
Supported status follows the first public lockstep adapter release and clean
registry-install verification.
