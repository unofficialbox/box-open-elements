<script lang="ts">
  import { onMount } from "svelte";

  let name = "Apollo";
  let status = "draft";
  let message = "Ready";
  let saving = false;
  const options = [
    { label: "Draft", value: "draft" },
    { label: "Published", value: "published" },
  ];
  let selectElement: HTMLElement & { options?: typeof options };
  let buttonElement: HTMLElement;

  $: if (selectElement) selectElement.options = options;

  const detail = (event: Event): string =>
    (event as CustomEvent<{ value: string }>).detail.value;

  onMount(() => {
    const save = () => (message = `Saved ${name} as ${status}`);
    buttonElement.addEventListener("click", save);
    return () => buttonElement.removeEventListener("click", save);
  });
</script>

<main>
  <h1>Svelte direct interop</h1>
  <div class="fields">
    <box-text-field
      data-testid="project-name"
      label="Project name"
      value={name}
      on:value-changed={(event: CustomEvent<{ value: string }>) => (name = detail(event))}
    ></box-text-field>
    <box-select
      bind:this={selectElement}
      data-testid="status"
      label="Status"
      value={status}
      disabled={saving}
      on:value-changed={(event: CustomEvent<{ value: string }>) => (status = detail(event))}
    ></box-select>
  </div>
  <box-button
    bind:this={buttonElement}
    data-testid="save"
    label="Save"
    tone="primary"
  ></box-button>
  <p data-testid="state">{message}</p>
</main>
