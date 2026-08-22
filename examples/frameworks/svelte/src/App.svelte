<script lang="ts">
  import { onMount } from "svelte";
  import {
    Button,
    Dialog,
    Select,
    TextField,
    createExplorerSelectionStore,
  } from "@unofficialbox/box-open-elements-svelte";
  import type { Select as SelectElement } from "@unofficialbox/box-open-elements/select";
  import { ExplorerSelectionController } from "@unofficialbox/box-open-elements-svelte";

  let name = "Apollo";
  let status = "draft";
  let message = "Ready";
  let saving = false;
  let dialogOpen = false;
  const options = [
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
  ];
  let selectElement: SelectElement | undefined;
  const selectionController = new ExplorerSelectionController();
  selectionController.setItems([{ id: "alpha" }, { id: "beta" }]);
  const selection = createExplorerSelectionStore(selectionController);

  onMount(() => {
    if (selectElement?.options.length !== options.length) {
      throw new Error("Svelte adapter did not assign structured options to box-select.");
    }
  });
</script>

<main>
  <h1>Svelte adapter interop</h1>
  <p data-testid="selection">
    Selected: {$selection.selectedItemIds.join(", ") || "None"}
  </p>
  <div class="fields">
    <TextField
      data-testid="project-name"
      label="Project name"
      value={name}
      onValueChanged={(event) => (name = event.detail.value)}
    />
    <Select
      bind:element={selectElement}
      data-testid="status"
      label="Status"
      value={status}
      {options}
      disabled={saving}
      onValueChanged={(event) => (status = event.detail.value)}
    />
  </div>
  <div class="actions">
    <Button
      data-testid="toggle-alpha"
      label="Toggle Alpha"
      tone="neutral"
      onClick={() => selectionController.toggleSelection("alpha")}
    />
    <Button
      data-testid="open-dialog"
      label="Open dialog"
      tone="primary"
      onClick={() => (dialogOpen = true)}
    />
    <Button
      data-testid="save"
      label="Save"
      tone="primary"
      onClick={() => (message = `Saved ${name} as ${status}`)}
    />
  </div>
  <p data-testid="state">{message}</p>
  <Dialog
    data-testid="dialog"
    open={dialogOpen}
    heading="Svelte controlled dialog"
    description="The custom element owns focus; Svelte owns open state."
    onOpenChanged={(event) => (dialogOpen = event.detail.open)}
  >
    Escape closes this overlay and restores focus.
  </Dialog>
</main>
