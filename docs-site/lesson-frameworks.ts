/**
 * Per-step framework snippets for the build-along lessons.
 *
 * The lesson steps in `lessons.ts` teach an imperative vanilla-JS build that
 * grows one line at a time. Frameworks don't build up that way, so each step's
 * React / Angular / Vue / Svelte version is the *cumulative component* at that
 * point — hand-written to stay in lockstep with the vanilla step, since there
 * is no mechanical translation of "now add an event listener" into a framework.
 *
 * Each array is indexed to the lesson's `steps` (step 0 = Setup … step 5). The
 * step's own `code` field is the vanilla/plain path (the "HTML" tab); these are
 * the four framework tabs beside it. Kept out of `lessons.ts` so that file stays
 * readable and this content can be reviewed as three coherent progressions.
 *
 * Pure data, DOM-free.
 */

export type StepFrameworkId = "react" | "angular" | "vue" | "svelte";
export type StepFrameworks = Record<StepFrameworkId, string[]>;

// The one-time design-system registration each framework does in its entry file.
const setup = (define: string, entry: string): Record<StepFrameworkId, string> => {
  const body = `import {
  registerBoxDefaultDesignSystem,
  applyDesignTokens,
  ${define},
} from "@unofficialbox/box-open-elements";

// Register the Box design system once, before your app mounts.
registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");
${define}();`;
  return { react: `// ${entry}.tsx\n${body}`, angular: `// ${entry}.ts\n${body}`, vue: `// ${entry}.ts\n${body}`, svelte: `// ${entry}.ts\n${body}` };
};

const explorerSetup = setup("defineBoxContentExplorerElement", "main");
const shareSetup = setup("defineBoxSharePanelElement", "main");
const previewSetup = setup("defineBoxPreviewElement", "main");

// ── Explorer ─────────────────────────────────────────────────────────────────

export const explorerStepFrameworks: StepFrameworks = {
  react: [
    explorerSetup.react,
    // 1 — render the shell
    `// Explorer.tsx
import { useRef } from "react";
import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

defineBoxContentExplorerElement();

export function Explorer() {
  const ref = useRef(null);
  return <box-content-explorer ref={ref} />;
}`,
    // 2 — connect the session
    `// Explorer.tsx
import { useEffect, useRef } from "react";
import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

defineBoxContentExplorerElement();

export function Explorer({ transport }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // transport is an object, so set it as a property, not an attribute.
    el.transport = transport;
  }, [transport]);

  return <box-content-explorer ref={ref} root-folder-id="0" token="developer-token" />;
}`,
    // 3 — follow navigation
    `// Explorer.tsx
import { useEffect, useRef, useState } from "react";
import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

defineBoxContentExplorerElement();

export function Explorer({ transport }) {
  const ref = useRef(null);
  const [here, setHere] = useState("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.transport = transport;

    const onFolder = event => setHere(event.detail.folder.name);
    el.addEventListener("folder-loaded", onFolder);
    return () => el.removeEventListener("folder-loaded", onFolder);
  }, [transport]);

  return (
    <>
      {here && <p>You are in: {here}</p>}
      <box-content-explorer ref={ref} root-folder-id="0" token="developer-token" />
    </>
  );
}`,
    // 4 — react to selection
    `// Explorer.tsx
import { useEffect, useRef, useState } from "react";
import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

defineBoxContentExplorerElement();

export function Explorer({ transport }) {
  const ref = useRef(null);
  const [here, setHere] = useState("");
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.transport = transport;

    const onFolder = event => setHere(event.detail.folder.name);
    const onSelect = event => setSelected(event.detail.selectedItemIds);
    el.addEventListener("folder-loaded", onFolder);
    el.addEventListener("selection-changed", onSelect);
    return () => {
      el.removeEventListener("folder-loaded", onFolder);
      el.removeEventListener("selection-changed", onSelect);
    };
  }, [transport]);

  return (
    <>
      {here && <p>You are in: {here}</p>}
      <p>Selected: {selected.length}</p>
      <box-content-explorer ref={ref} root-folder-id="0" token="developer-token" />
    </>
  );
}`,
    // 5 — production-leaning (selection-mode + page-size)
    `// Explorer.tsx
import { useEffect, useRef, useState } from "react";
import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

defineBoxContentExplorerElement();

export function Explorer({ transport }) {
  const ref = useRef(null);
  const [here, setHere] = useState("");
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.transport = transport;

    const onFolder = event => setHere(event.detail.folder.name);
    const onSelect = event => setSelected(event.detail.selectedItemIds);
    el.addEventListener("folder-loaded", onFolder);
    el.addEventListener("selection-changed", onSelect);
    return () => {
      el.removeEventListener("folder-loaded", onFolder);
      el.removeEventListener("selection-changed", onSelect);
    };
  }, [transport]);

  return (
    <>
      {here && <p>You are in: {here}</p>}
      <p>Selected: {selected.length}</p>
      <box-content-explorer
        ref={ref}
        root-folder-id="0"
        token="developer-token"
        selection-mode="multiple"
        page-size="50"
      />
    </>
  );
}`,
  ],
  angular: [
    explorerSetup.angular,
    // 1
    `// explorer.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

defineBoxContentExplorerElement();

@Component({
  standalone: true,
  selector: "app-explorer",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`<box-content-explorer></box-content-explorer>\`,
})
export class ExplorerComponent {}`,
    // 2
    `// explorer.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from "@angular/core";
import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

defineBoxContentExplorerElement();

@Component({
  standalone: true,
  selector: "app-explorer",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <box-content-explorer
      [transport]="transport"
      root-folder-id="0"
      token="developer-token"
    ></box-content-explorer>
  \`,
})
export class ExplorerComponent {
  @Input() transport!: unknown;
}`,
    // 3
    `// explorer.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from "@angular/core";
import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

defineBoxContentExplorerElement();

@Component({
  standalone: true,
  selector: "app-explorer",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <p *ngIf="here">You are in: {{ here }}</p>
    <box-content-explorer
      [transport]="transport"
      root-folder-id="0"
      token="developer-token"
      (folder-loaded)="onFolderLoaded($event)"
    ></box-content-explorer>
  \`,
})
export class ExplorerComponent {
  @Input() transport!: unknown;
  here = "";

  onFolderLoaded(event: CustomEvent) {
    this.here = event.detail.folder.name;
  }
}`,
    // 4
    `// explorer.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from "@angular/core";
import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

defineBoxContentExplorerElement();

@Component({
  standalone: true,
  selector: "app-explorer",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <p *ngIf="here">You are in: {{ here }}</p>
    <p>Selected: {{ selected.length }}</p>
    <box-content-explorer
      [transport]="transport"
      root-folder-id="0"
      token="developer-token"
      (folder-loaded)="onFolderLoaded($event)"
      (selection-changed)="onSelectionChanged($event)"
    ></box-content-explorer>
  \`,
})
export class ExplorerComponent {
  @Input() transport!: unknown;
  here = "";
  selected: string[] = [];

  onFolderLoaded(event: CustomEvent) {
    this.here = event.detail.folder.name;
  }

  onSelectionChanged(event: CustomEvent) {
    this.selected = event.detail.selectedItemIds;
  }
}`,
    // 5
    `// explorer.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from "@angular/core";
import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

defineBoxContentExplorerElement();

@Component({
  standalone: true,
  selector: "app-explorer",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <p *ngIf="here">You are in: {{ here }}</p>
    <p>Selected: {{ selected.length }}</p>
    <box-content-explorer
      [transport]="transport"
      root-folder-id="0"
      token="developer-token"
      selection-mode="multiple"
      page-size="50"
      (folder-loaded)="onFolderLoaded($event)"
      (selection-changed)="onSelectionChanged($event)"
    ></box-content-explorer>
  \`,
})
export class ExplorerComponent {
  @Input() transport!: unknown;
  here = "";
  selected: string[] = [];

  onFolderLoaded(event: CustomEvent) {
    this.here = event.detail.folder.name;
  }

  onSelectionChanged(event: CustomEvent) {
    this.selected = event.detail.selectedItemIds;
  }
}`,
  ],
  vue: [
    explorerSetup.vue,
    // 1
    `<script setup lang="ts">
import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

defineBoxContentExplorerElement();
</script>

<template>
  <box-content-explorer></box-content-explorer>
</template>`,
    // 2
    `<script setup lang="ts">
import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

defineBoxContentExplorerElement();

const props = defineProps<{ transport: unknown }>();
</script>

<template>
  <box-content-explorer
    :transport="props.transport"
    root-folder-id="0"
    token="developer-token"
  ></box-content-explorer>
</template>`,
    // 3
    `<script setup lang="ts">
import { ref } from "vue";
import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

defineBoxContentExplorerElement();

const props = defineProps<{ transport: unknown }>();
const here = ref("");

const onFolderLoaded = (event: CustomEvent) => {
  here.value = event.detail.folder.name;
};
</script>

<template>
  <p v-if="here">You are in: {{ here }}</p>
  <box-content-explorer
    :transport="props.transport"
    root-folder-id="0"
    token="developer-token"
    @folder-loaded="onFolderLoaded"
  ></box-content-explorer>
</template>`,
    // 4
    `<script setup lang="ts">
import { ref } from "vue";
import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

defineBoxContentExplorerElement();

const props = defineProps<{ transport: unknown }>();
const here = ref("");
const selected = ref<string[]>([]);

const onFolderLoaded = (event: CustomEvent) => {
  here.value = event.detail.folder.name;
};
const onSelectionChanged = (event: CustomEvent) => {
  selected.value = event.detail.selectedItemIds;
};
</script>

<template>
  <p v-if="here">You are in: {{ here }}</p>
  <p>Selected: {{ selected.length }}</p>
  <box-content-explorer
    :transport="props.transport"
    root-folder-id="0"
    token="developer-token"
    @folder-loaded="onFolderLoaded"
    @selection-changed="onSelectionChanged"
  ></box-content-explorer>
</template>`,
    // 5
    `<script setup lang="ts">
import { ref } from "vue";
import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

defineBoxContentExplorerElement();

const props = defineProps<{ transport: unknown }>();
const here = ref("");
const selected = ref<string[]>([]);

const onFolderLoaded = (event: CustomEvent) => {
  here.value = event.detail.folder.name;
};
const onSelectionChanged = (event: CustomEvent) => {
  selected.value = event.detail.selectedItemIds;
};
</script>

<template>
  <p v-if="here">You are in: {{ here }}</p>
  <p>Selected: {{ selected.length }}</p>
  <box-content-explorer
    :transport="props.transport"
    root-folder-id="0"
    token="developer-token"
    selection-mode="multiple"
    page-size="50"
    @folder-loaded="onFolderLoaded"
    @selection-changed="onSelectionChanged"
  ></box-content-explorer>
</template>`,
  ],
  svelte: [
    explorerSetup.svelte,
    // 1
    `<script lang="ts">
  import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

  defineBoxContentExplorerElement();
</script>

<box-content-explorer></box-content-explorer>`,
    // 2
    `<script lang="ts">
  import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

  defineBoxContentExplorerElement();

  export let transport;

  let el;
  // Objects must be assigned as properties; attributes are strings only.
  $: if (el) el.transport = transport;
</script>

<box-content-explorer
  bind:this={el}
  root-folder-id="0"
  token="developer-token"
></box-content-explorer>`,
    // 3
    `<script lang="ts">
  import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

  defineBoxContentExplorerElement();

  export let transport;

  let el;
  let here = "";
  $: if (el) el.transport = transport;
</script>

{#if here}<p>You are in: {here}</p>{/if}
<box-content-explorer
  bind:this={el}
  root-folder-id="0"
  token="developer-token"
  on:folder-loaded={event => (here = event.detail.folder.name)}
></box-content-explorer>`,
    // 4
    `<script lang="ts">
  import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

  defineBoxContentExplorerElement();

  export let transport;

  let el;
  let here = "";
  let selected: string[] = [];
  $: if (el) el.transport = transport;
</script>

{#if here}<p>You are in: {here}</p>{/if}
<p>Selected: {selected.length}</p>
<box-content-explorer
  bind:this={el}
  root-folder-id="0"
  token="developer-token"
  on:folder-loaded={event => (here = event.detail.folder.name)}
  on:selection-changed={event => (selected = event.detail.selectedItemIds)}
></box-content-explorer>`,
    // 5
    `<script lang="ts">
  import { defineBoxContentExplorerElement } from "@unofficialbox/box-open-elements";

  defineBoxContentExplorerElement();

  export let transport;

  let el;
  let here = "";
  let selected: string[] = [];
  $: if (el) el.transport = transport;
</script>

{#if here}<p>You are in: {here}</p>{/if}
<p>Selected: {selected.length}</p>
<box-content-explorer
  bind:this={el}
  root-folder-id="0"
  token="developer-token"
  selection-mode="multiple"
  page-size="50"
  on:folder-loaded={event => (here = event.detail.folder.name)}
  on:selection-changed={event => (selected = event.detail.selectedItemIds)}
></box-content-explorer>`,
  ],
};

// ── Share ────────────────────────────────────────────────────────────────────

export const shareStepFrameworks: StepFrameworks = {
  react: [
    shareSetup.react,
    // 1 — shell + heading
    `// SharePanel.tsx
import { useRef } from "react";
import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

defineBoxSharePanelElement();

export function SharePanel() {
  const ref = useRef(null);
  return <box-share-panel ref={ref} heading="Share Quarterly Plan.pdf" />;
}`,
    // 2 — shared link
    `// SharePanel.tsx
import { useEffect, useRef } from "react";
import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

defineBoxSharePanelElement();

export function SharePanel() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // sharedLink is an object, so set it as a property.
    el.sharedLink = { url: "https://box.com/s/example", access: "company" };
  }, []);

  return <box-share-panel ref={ref} heading="Share Quarterly Plan.pdf" />;
}`,
    // 3 — collaborators
    `// SharePanel.tsx
import { useEffect, useRef } from "react";
import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

defineBoxSharePanelElement();

export function SharePanel() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.sharedLink = { url: "https://box.com/s/example", access: "company" };
    el.collaborators = [
      { name: "Morgan Lee", role: "Editor" },
      { name: "Alex Kim", role: "Viewer" },
    ];
  }, []);

  return <box-share-panel ref={ref} heading="Share Quarterly Plan.pdf" />;
}`,
    // 4 — message + settings
    `// SharePanel.tsx
import { useEffect, useRef } from "react";
import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

defineBoxSharePanelElement();

export function SharePanel() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.sharedLink = { url: "https://box.com/s/example", access: "company" };
    el.collaborators = [
      { name: "Morgan Lee", role: "Editor" },
      { name: "Alex Kim", role: "Viewer" },
    ];
    el.settings = [
      { label: "Downloads", value: "Allowed" },
      { label: "Expiration", value: "Jun 1, 2027" },
    ];
  }, []);

  return (
    <box-share-panel
      ref={ref}
      heading="Share Quarterly Plan.pdf"
      message="Anyone in the company with the link can view."
    />
  );
}`,
    // 5 — actions + events
    `// SharePanel.tsx
import { useEffect, useRef } from "react";
import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

defineBoxSharePanelElement();

export function SharePanel() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.sharedLink = { url: "https://box.com/s/example", access: "company" };
    el.collaborators = [
      { name: "Morgan Lee", role: "Editor" },
      { name: "Alex Kim", role: "Viewer" },
    ];
    el.settings = [
      { label: "Downloads", value: "Allowed" },
      { label: "Expiration", value: "Jun 1, 2027" },
    ];
    el.actions = [
      { id: "copy", label: "Copy link" },
      { id: "invite", label: "Invite people", tone: "primary" },
    ];

    const onAction = event => console.log("action", event.detail.action);
    const onCollaborator = event => console.log("collaborator", event.detail.name);
    el.addEventListener("action", onAction);
    el.addEventListener("collaborator-selected", onCollaborator);
    return () => {
      el.removeEventListener("action", onAction);
      el.removeEventListener("collaborator-selected", onCollaborator);
    };
  }, []);

  return (
    <box-share-panel
      ref={ref}
      heading="Share Quarterly Plan.pdf"
      message="Anyone in the company with the link can view."
    />
  );
}`,
  ],
  angular: [
    shareSetup.angular,
    // 1
    `// share.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

defineBoxSharePanelElement();

@Component({
  standalone: true,
  selector: "app-share",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`<box-share-panel heading="Share Quarterly Plan.pdf"></box-share-panel>\`,
})
export class ShareComponent {}`,
    // 2
    `// share.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

defineBoxSharePanelElement();

@Component({
  standalone: true,
  selector: "app-share",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <box-share-panel
      heading="Share Quarterly Plan.pdf"
      [sharedLink]="sharedLink"
    ></box-share-panel>
  \`,
})
export class ShareComponent {
  sharedLink = { url: "https://box.com/s/example", access: "company" };
}`,
    // 3
    `// share.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

defineBoxSharePanelElement();

@Component({
  standalone: true,
  selector: "app-share",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <box-share-panel
      heading="Share Quarterly Plan.pdf"
      [sharedLink]="sharedLink"
      [collaborators]="collaborators"
    ></box-share-panel>
  \`,
})
export class ShareComponent {
  sharedLink = { url: "https://box.com/s/example", access: "company" };
  collaborators = [
    { name: "Morgan Lee", role: "Editor" },
    { name: "Alex Kim", role: "Viewer" },
  ];
}`,
    // 4
    `// share.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

defineBoxSharePanelElement();

@Component({
  standalone: true,
  selector: "app-share",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <box-share-panel
      heading="Share Quarterly Plan.pdf"
      message="Anyone in the company with the link can view."
      [sharedLink]="sharedLink"
      [collaborators]="collaborators"
      [settings]="settings"
    ></box-share-panel>
  \`,
})
export class ShareComponent {
  sharedLink = { url: "https://box.com/s/example", access: "company" };
  collaborators = [
    { name: "Morgan Lee", role: "Editor" },
    { name: "Alex Kim", role: "Viewer" },
  ];
  settings = [
    { label: "Downloads", value: "Allowed" },
    { label: "Expiration", value: "Jun 1, 2027" },
  ];
}`,
    // 5
    `// share.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

defineBoxSharePanelElement();

@Component({
  standalone: true,
  selector: "app-share",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <box-share-panel
      heading="Share Quarterly Plan.pdf"
      message="Anyone in the company with the link can view."
      [sharedLink]="sharedLink"
      [collaborators]="collaborators"
      [settings]="settings"
      [actions]="actions"
      (action)="onAction($event)"
      (collaborator-selected)="onCollaborator($event)"
    ></box-share-panel>
  \`,
})
export class ShareComponent {
  sharedLink = { url: "https://box.com/s/example", access: "company" };
  collaborators = [
    { name: "Morgan Lee", role: "Editor" },
    { name: "Alex Kim", role: "Viewer" },
  ];
  settings = [
    { label: "Downloads", value: "Allowed" },
    { label: "Expiration", value: "Jun 1, 2027" },
  ];
  actions = [
    { id: "copy", label: "Copy link" },
    { id: "invite", label: "Invite people", tone: "primary" },
  ];

  onAction(event: CustomEvent) {
    console.log("action", event.detail.action);
  }

  onCollaborator(event: CustomEvent) {
    console.log("collaborator", event.detail.name);
  }
}`,
  ],
  vue: [
    shareSetup.vue,
    // 1
    `<script setup lang="ts">
import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

defineBoxSharePanelElement();
</script>

<template>
  <box-share-panel heading="Share Quarterly Plan.pdf"></box-share-panel>
</template>`,
    // 2
    `<script setup lang="ts">
import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

defineBoxSharePanelElement();

const sharedLink = { url: "https://box.com/s/example", access: "company" };
</script>

<template>
  <box-share-panel
    heading="Share Quarterly Plan.pdf"
    :sharedLink="sharedLink"
  ></box-share-panel>
</template>`,
    // 3
    `<script setup lang="ts">
import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

defineBoxSharePanelElement();

const sharedLink = { url: "https://box.com/s/example", access: "company" };
const collaborators = [
  { name: "Morgan Lee", role: "Editor" },
  { name: "Alex Kim", role: "Viewer" },
];
</script>

<template>
  <box-share-panel
    heading="Share Quarterly Plan.pdf"
    :sharedLink="sharedLink"
    :collaborators="collaborators"
  ></box-share-panel>
</template>`,
    // 4
    `<script setup lang="ts">
import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

defineBoxSharePanelElement();

const sharedLink = { url: "https://box.com/s/example", access: "company" };
const collaborators = [
  { name: "Morgan Lee", role: "Editor" },
  { name: "Alex Kim", role: "Viewer" },
];
const settings = [
  { label: "Downloads", value: "Allowed" },
  { label: "Expiration", value: "Jun 1, 2027" },
];
</script>

<template>
  <box-share-panel
    heading="Share Quarterly Plan.pdf"
    message="Anyone in the company with the link can view."
    :sharedLink="sharedLink"
    :collaborators="collaborators"
    :settings="settings"
  ></box-share-panel>
</template>`,
    // 5
    `<script setup lang="ts">
import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

defineBoxSharePanelElement();

const sharedLink = { url: "https://box.com/s/example", access: "company" };
const collaborators = [
  { name: "Morgan Lee", role: "Editor" },
  { name: "Alex Kim", role: "Viewer" },
];
const settings = [
  { label: "Downloads", value: "Allowed" },
  { label: "Expiration", value: "Jun 1, 2027" },
];
const actions = [
  { id: "copy", label: "Copy link" },
  { id: "invite", label: "Invite people", tone: "primary" },
];

const onAction = (event: CustomEvent) => console.log("action", event.detail.action);
const onCollaborator = (event: CustomEvent) => console.log("collaborator", event.detail.name);
</script>

<template>
  <box-share-panel
    heading="Share Quarterly Plan.pdf"
    message="Anyone in the company with the link can view."
    :sharedLink="sharedLink"
    :collaborators="collaborators"
    :settings="settings"
    :actions="actions"
    @action="onAction"
    @collaborator-selected="onCollaborator"
  ></box-share-panel>
</template>`,
  ],
  svelte: [
    shareSetup.svelte,
    // 1
    `<script lang="ts">
  import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

  defineBoxSharePanelElement();
</script>

<box-share-panel heading="Share Quarterly Plan.pdf"></box-share-panel>`,
    // 2
    `<script lang="ts">
  import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

  defineBoxSharePanelElement();

  let el;
  // Object props are assigned, not passed as attributes.
  $: if (el) el.sharedLink = { url: "https://box.com/s/example", access: "company" };
</script>

<box-share-panel bind:this={el} heading="Share Quarterly Plan.pdf"></box-share-panel>`,
    // 3
    `<script lang="ts">
  import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

  defineBoxSharePanelElement();

  let el;
  $: if (el) {
    el.sharedLink = { url: "https://box.com/s/example", access: "company" };
    el.collaborators = [
      { name: "Morgan Lee", role: "Editor" },
      { name: "Alex Kim", role: "Viewer" },
    ];
  }
</script>

<box-share-panel bind:this={el} heading="Share Quarterly Plan.pdf"></box-share-panel>`,
    // 4
    `<script lang="ts">
  import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

  defineBoxSharePanelElement();

  let el;
  $: if (el) {
    el.sharedLink = { url: "https://box.com/s/example", access: "company" };
    el.collaborators = [
      { name: "Morgan Lee", role: "Editor" },
      { name: "Alex Kim", role: "Viewer" },
    ];
    el.settings = [
      { label: "Downloads", value: "Allowed" },
      { label: "Expiration", value: "Jun 1, 2027" },
    ];
  }
</script>

<box-share-panel
  bind:this={el}
  heading="Share Quarterly Plan.pdf"
  message="Anyone in the company with the link can view."
></box-share-panel>`,
    // 5
    `<script lang="ts">
  import { defineBoxSharePanelElement } from "@unofficialbox/box-open-elements";

  defineBoxSharePanelElement();

  let el;
  $: if (el) {
    el.sharedLink = { url: "https://box.com/s/example", access: "company" };
    el.collaborators = [
      { name: "Morgan Lee", role: "Editor" },
      { name: "Alex Kim", role: "Viewer" },
    ];
    el.settings = [
      { label: "Downloads", value: "Allowed" },
      { label: "Expiration", value: "Jun 1, 2027" },
    ];
    el.actions = [
      { id: "copy", label: "Copy link" },
      { id: "invite", label: "Invite people", tone: "primary" },
    ];
  }
</script>

<box-share-panel
  bind:this={el}
  heading="Share Quarterly Plan.pdf"
  message="Anyone in the company with the link can view."
  on:action={event => console.log("action", event.detail.action)}
  on:collaborator-selected={event => console.log("collaborator", event.detail.name)}
></box-share-panel>`,
  ],
};

// ── Preview ──────────────────────────────────────────────────────────────────

export const previewStepFrameworks: StepFrameworks = {
  react: [
    previewSetup.react,
    // 1 — shell + heading
    `// Preview.tsx
import { useRef } from "react";
import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

defineBoxPreviewElement();

export function Preview() {
  const ref = useRef(null);
  return <box-preview-element ref={ref} heading="Quarterly Plan.pdf" />;
}`,
    // 2 — item chrome
    `// Preview.tsx
import { useRef } from "react";
import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

defineBoxPreviewElement();

export function Preview() {
  const ref = useRef(null);
  return (
    <box-preview-element
      ref={ref}
      heading="Quarterly Plan.pdf"
      item-label="PDF · 2.4 MB"
      status="Ready"
      message="Rendered by the active preview provider."
    />
  );
}`,
    // 3 — provider
    `// Preview.tsx
import { useEffect, useRef } from "react";
import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

defineBoxPreviewElement();

export function Preview() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // provider is an object, so set it as a property.
    el.provider = { id: "content-preview", label: "Box Content Preview", engine: "pdf.js" };
  }, []);

  return (
    <box-preview-element
      ref={ref}
      heading="Quarterly Plan.pdf"
      item-label="PDF · 2.4 MB"
      status="Ready"
      message="Rendered by the active preview provider."
    />
  );
}`,
    // 4 — adapter state
    `// Preview.tsx
import { useEffect, useRef } from "react";
import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

defineBoxPreviewElement();

export function Preview() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.provider = { id: "content-preview", label: "Box Content Preview", engine: "pdf.js" };
    el.adapterState = { ready: true, pageLabel: "Page 2 of 34", zoomLabel: "100%" };
  }, []);

  return (
    <box-preview-element
      ref={ref}
      heading="Quarterly Plan.pdf"
      item-label="PDF · 2.4 MB"
      status="Ready"
      message="Rendered by the active preview provider."
    />
  );
}`,
    // 5 — actions + events
    `// Preview.tsx
import { useEffect, useRef } from "react";
import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

defineBoxPreviewElement();

export function Preview() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.provider = { id: "content-preview", label: "Box Content Preview", engine: "pdf.js" };
    el.adapterState = { ready: true, pageLabel: "Page 2 of 34", zoomLabel: "100%" };
    el.actions = [
      { id: "open-provider", label: "Open provider", tone: "primary" },
      { id: "download", label: "Download" },
    ];

    const onAction = event => console.log("action", event.detail.action);
    const onProviderAction = event =>
      console.log("provider-action", event.detail.action, event.detail.providerId);
    el.addEventListener("action", onAction);
    el.addEventListener("provider-action", onProviderAction);
    return () => {
      el.removeEventListener("action", onAction);
      el.removeEventListener("provider-action", onProviderAction);
    };
  }, []);

  return (
    <box-preview-element
      ref={ref}
      heading="Quarterly Plan.pdf"
      item-label="PDF · 2.4 MB"
      status="Ready"
      message="Rendered by the active preview provider."
    />
  );
}`,
  ],
  angular: [
    previewSetup.angular,
    // 1
    `// preview.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

defineBoxPreviewElement();

@Component({
  standalone: true,
  selector: "app-preview",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`<box-preview-element heading="Quarterly Plan.pdf"></box-preview-element>\`,
})
export class PreviewComponent {}`,
    // 2
    `// preview.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

defineBoxPreviewElement();

@Component({
  standalone: true,
  selector: "app-preview",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <box-preview-element
      heading="Quarterly Plan.pdf"
      item-label="PDF · 2.4 MB"
      status="Ready"
      message="Rendered by the active preview provider."
    ></box-preview-element>
  \`,
})
export class PreviewComponent {}`,
    // 3
    `// preview.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

defineBoxPreviewElement();

@Component({
  standalone: true,
  selector: "app-preview",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <box-preview-element
      heading="Quarterly Plan.pdf"
      item-label="PDF · 2.4 MB"
      status="Ready"
      message="Rendered by the active preview provider."
      [provider]="provider"
    ></box-preview-element>
  \`,
})
export class PreviewComponent {
  provider = { id: "content-preview", label: "Box Content Preview", engine: "pdf.js" };
}`,
    // 4
    `// preview.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

defineBoxPreviewElement();

@Component({
  standalone: true,
  selector: "app-preview",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <box-preview-element
      heading="Quarterly Plan.pdf"
      item-label="PDF · 2.4 MB"
      status="Ready"
      message="Rendered by the active preview provider."
      [provider]="provider"
      [adapterState]="adapterState"
    ></box-preview-element>
  \`,
})
export class PreviewComponent {
  provider = { id: "content-preview", label: "Box Content Preview", engine: "pdf.js" };
  adapterState = { ready: true, pageLabel: "Page 2 of 34", zoomLabel: "100%" };
}`,
    // 5
    `// preview.component.ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

defineBoxPreviewElement();

@Component({
  standalone: true,
  selector: "app-preview",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <box-preview-element
      heading="Quarterly Plan.pdf"
      item-label="PDF · 2.4 MB"
      status="Ready"
      message="Rendered by the active preview provider."
      [provider]="provider"
      [adapterState]="adapterState"
      [actions]="actions"
      (action)="onAction($event)"
      (provider-action)="onProviderAction($event)"
    ></box-preview-element>
  \`,
})
export class PreviewComponent {
  provider = { id: "content-preview", label: "Box Content Preview", engine: "pdf.js" };
  adapterState = { ready: true, pageLabel: "Page 2 of 34", zoomLabel: "100%" };
  actions = [
    { id: "open-provider", label: "Open provider", tone: "primary" },
    { id: "download", label: "Download" },
  ];

  onAction(event: CustomEvent) {
    console.log("action", event.detail.action);
  }

  onProviderAction(event: CustomEvent) {
    console.log("provider-action", event.detail.action, event.detail.providerId);
  }
}`,
  ],
  vue: [
    previewSetup.vue,
    // 1
    `<script setup lang="ts">
import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

defineBoxPreviewElement();
</script>

<template>
  <box-preview-element heading="Quarterly Plan.pdf"></box-preview-element>
</template>`,
    // 2
    `<script setup lang="ts">
import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

defineBoxPreviewElement();
</script>

<template>
  <box-preview-element
    heading="Quarterly Plan.pdf"
    item-label="PDF · 2.4 MB"
    status="Ready"
    message="Rendered by the active preview provider."
  ></box-preview-element>
</template>`,
    // 3
    `<script setup lang="ts">
import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

defineBoxPreviewElement();

const provider = { id: "content-preview", label: "Box Content Preview", engine: "pdf.js" };
</script>

<template>
  <box-preview-element
    heading="Quarterly Plan.pdf"
    item-label="PDF · 2.4 MB"
    status="Ready"
    message="Rendered by the active preview provider."
    :provider="provider"
  ></box-preview-element>
</template>`,
    // 4
    `<script setup lang="ts">
import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

defineBoxPreviewElement();

const provider = { id: "content-preview", label: "Box Content Preview", engine: "pdf.js" };
const adapterState = { ready: true, pageLabel: "Page 2 of 34", zoomLabel: "100%" };
</script>

<template>
  <box-preview-element
    heading="Quarterly Plan.pdf"
    item-label="PDF · 2.4 MB"
    status="Ready"
    message="Rendered by the active preview provider."
    :provider="provider"
    :adapterState="adapterState"
  ></box-preview-element>
</template>`,
    // 5
    `<script setup lang="ts">
import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

defineBoxPreviewElement();

const provider = { id: "content-preview", label: "Box Content Preview", engine: "pdf.js" };
const adapterState = { ready: true, pageLabel: "Page 2 of 34", zoomLabel: "100%" };
const actions = [
  { id: "open-provider", label: "Open provider", tone: "primary" },
  { id: "download", label: "Download" },
];

const onAction = (event: CustomEvent) => console.log("action", event.detail.action);
const onProviderAction = (event: CustomEvent) =>
  console.log("provider-action", event.detail.action, event.detail.providerId);
</script>

<template>
  <box-preview-element
    heading="Quarterly Plan.pdf"
    item-label="PDF · 2.4 MB"
    status="Ready"
    message="Rendered by the active preview provider."
    :provider="provider"
    :adapterState="adapterState"
    :actions="actions"
    @action="onAction"
    @provider-action="onProviderAction"
  ></box-preview-element>
</template>`,
  ],
  svelte: [
    previewSetup.svelte,
    // 1
    `<script lang="ts">
  import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

  defineBoxPreviewElement();
</script>

<box-preview-element heading="Quarterly Plan.pdf"></box-preview-element>`,
    // 2
    `<script lang="ts">
  import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

  defineBoxPreviewElement();
</script>

<box-preview-element
  heading="Quarterly Plan.pdf"
  item-label="PDF · 2.4 MB"
  status="Ready"
  message="Rendered by the active preview provider."
></box-preview-element>`,
    // 3
    `<script lang="ts">
  import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

  defineBoxPreviewElement();

  let el;
  // Object props are assigned, not passed as attributes.
  $: if (el) el.provider = { id: "content-preview", label: "Box Content Preview", engine: "pdf.js" };
</script>

<box-preview-element
  bind:this={el}
  heading="Quarterly Plan.pdf"
  item-label="PDF · 2.4 MB"
  status="Ready"
  message="Rendered by the active preview provider."
></box-preview-element>`,
    // 4
    `<script lang="ts">
  import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

  defineBoxPreviewElement();

  let el;
  $: if (el) {
    el.provider = { id: "content-preview", label: "Box Content Preview", engine: "pdf.js" };
    el.adapterState = { ready: true, pageLabel: "Page 2 of 34", zoomLabel: "100%" };
  }
</script>

<box-preview-element
  bind:this={el}
  heading="Quarterly Plan.pdf"
  item-label="PDF · 2.4 MB"
  status="Ready"
  message="Rendered by the active preview provider."
></box-preview-element>`,
    // 5
    `<script lang="ts">
  import { defineBoxPreviewElement } from "@unofficialbox/box-open-elements";

  defineBoxPreviewElement();

  let el;
  $: if (el) {
    el.provider = { id: "content-preview", label: "Box Content Preview", engine: "pdf.js" };
    el.adapterState = { ready: true, pageLabel: "Page 2 of 34", zoomLabel: "100%" };
    el.actions = [
      { id: "open-provider", label: "Open provider", tone: "primary" },
      { id: "download", label: "Download" },
    ];
  }
</script>

<box-preview-element
  bind:this={el}
  heading="Quarterly Plan.pdf"
  item-label="PDF · 2.4 MB"
  status="Ready"
  message="Rendered by the active preview provider."
  on:action={event => console.log("action", event.detail.action)}
  on:provider-action={event =>
    console.log("provider-action", event.detail.action, event.detail.providerId)}
></box-preview-element>`,
  ],
};
