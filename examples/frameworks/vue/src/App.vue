<script setup lang="ts">
import { onMounted, ref } from "vue";

const name = ref("Apollo");
const status = ref("draft");
const message = ref("Ready");
const saving = ref(false);
const options = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];
const selectElement = ref<(HTMLElement & { options?: typeof options }) | null>(null);

const detail = (event: Event): string =>
  (event as CustomEvent<{ value: string }>).detail.value;

onMounted(() => {
  if (selectElement.value?.options?.length !== options.length) {
    throw new Error("Vue did not assign structured options to box-select.");
  }
});
</script>

<template>
  <main>
    <h1>Vue direct interop</h1>
    <div class="fields">
      <box-text-field
        data-testid="project-name"
        label="Project name"
        :value="name"
        @value-changed="name = detail($event)"
      />
      <box-select
        ref="selectElement"
        data-testid="status"
        label="Status"
        :value="status"
        :options="options"
        :disabled="saving"
        @value-changed="status = detail($event)"
      />
    </div>
    <box-button
      data-testid="save"
      label="Save"
      tone="primary"
      @click="message = `Saved ${name} as ${status}`"
    />
    <p data-testid="state">{{ message }}</p>
  </main>
</template>
