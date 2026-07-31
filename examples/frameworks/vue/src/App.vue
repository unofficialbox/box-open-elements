<script setup lang="ts">
import { nextTick, onMounted, ref } from "vue";
import {
  Button,
  Dialog,
  Select,
  TextField,
  useExplorerSelectionController,
} from "@unofficialbox/box-open-elements-vue";
import { ExplorerSelectionController } from "@unofficialbox/box-open-elements/patterns/content-explorer/selection";

const name = ref("Apollo");
const status = ref("draft");
const message = ref("Ready");
const saving = ref(false);
const dialogOpen = ref(false);
const options = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];
const selectAdapter = ref<{ element?: HTMLElement & { options?: typeof options } } | null>(null);
const selectionController = new ExplorerSelectionController();
selectionController.setItems([{ id: "alpha" }, { id: "beta" }]);
const selection = useExplorerSelectionController(selectionController);

onMounted(async () => {
  await nextTick();
  if (selectAdapter.value?.element?.options?.length !== options.length) {
    throw new Error("Vue adapter did not assign structured options to box-select.");
  }
});
</script>

<template>
  <main>
    <h1>Vue adapter interop</h1>
    <p data-testid="selection">
      Selected: {{ selection.selectedItemIds.join(", ") || "None" }}
    </p>
    <div class="fields">
      <TextField
        data-testid="project-name"
        label="Project name"
        :value="name"
        @value-changed="name = $event.detail.value"
      />
      <Select
        ref="selectAdapter"
        data-testid="status"
        label="Status"
        :value="status"
        :options="options"
        :disabled="saving"
        @value-changed="status = $event.detail.value"
      />
    </div>
    <div class="actions">
      <Button
        data-testid="toggle-alpha"
        label="Toggle Alpha"
        tone="neutral"
        @click="selectionController.toggleSelection('alpha')"
      />
      <Button
        data-testid="open-dialog"
        label="Open dialog"
        tone="primary"
        @click="dialogOpen = true"
      />
      <Button
        data-testid="save"
        label="Save"
        tone="primary"
        @click="message = `Saved ${name} as ${status}`"
      />
    </div>
    <p data-testid="state">{{ message }}</p>
    <Dialog
      data-testid="dialog"
      :open="dialogOpen"
      heading="Vue controlled dialog"
      description="The custom element owns focus; Vue owns open state."
      @open-changed="dialogOpen = $event.detail.open"
    >
      Escape closes this overlay and restores focus.
    </Dialog>
  </main>
</template>
