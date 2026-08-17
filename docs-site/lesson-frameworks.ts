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
const setup = (componentPath: string, entry: string): Record<StepFrameworkId, string> => {
  const body = `import {
  registerBoxDefaultDesignSystem,
  applyDesignTokens,
} from "@unofficialbox/box-open-elements";
import "@unofficialbox/box-open-elements/${componentPath}";

// Register the Box design system once, before your app mounts.
registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");`;
  return { react: `// ${entry}.tsx\n${body}`, angular: `// ${entry}.ts\n${body}`, vue: `// ${entry}.ts\n${body}`, svelte: `// ${entry}.ts\n${body}` };
};

const explorerSetup = setup("content-explorer", "main");
const shareSetup = setup("share-panel", "main");
const previewSetup = setup("preview", "main");
const intakeSetup = setup("form-wizard", "main");

// ── Explorer ─────────────────────────────────────────────────────────────────

export const explorerStepFrameworks: StepFrameworks = {
  react: [
    explorerSetup.react,
    // 1 — render the shell
    `// Explorer.tsx
import { useRef } from "react";
import "@unofficialbox/box-open-elements/content-explorer";


export function Explorer() {
  const ref = useRef(null);
  return <box-content-explorer ref={ref} />;
}`,
    // 2 — connect the session
    `// Explorer.tsx
import { useEffect, useRef } from "react";
import "@unofficialbox/box-open-elements/content-explorer";


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
import "@unofficialbox/box-open-elements/content-explorer";


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
import "@unofficialbox/box-open-elements/content-explorer";


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
import "@unofficialbox/box-open-elements/content-explorer";


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
import "@unofficialbox/box-open-elements/content-explorer";


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
import "@unofficialbox/box-open-elements/content-explorer";


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
import "@unofficialbox/box-open-elements/content-explorer";


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
import "@unofficialbox/box-open-elements/content-explorer";


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
import "@unofficialbox/box-open-elements/content-explorer";


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
import "@unofficialbox/box-open-elements/content-explorer";

</script>

<template>
  <box-content-explorer></box-content-explorer>
</template>`,
    // 2
    `<script setup lang="ts">
import "@unofficialbox/box-open-elements/content-explorer";


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
import "@unofficialbox/box-open-elements/content-explorer";


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
import "@unofficialbox/box-open-elements/content-explorer";


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
import "@unofficialbox/box-open-elements/content-explorer";


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
  import "@unofficialbox/box-open-elements/content-explorer";

</script>

<box-content-explorer></box-content-explorer>`,
    // 2
    `<script lang="ts">
  import "@unofficialbox/box-open-elements/content-explorer";


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
  import "@unofficialbox/box-open-elements/content-explorer";


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
  import "@unofficialbox/box-open-elements/content-explorer";


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
  import "@unofficialbox/box-open-elements/content-explorer";


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
import "@unofficialbox/box-open-elements/share-panel";


export function SharePanel() {
  const ref = useRef(null);
  return <box-share-panel ref={ref} heading="Share Quarterly Plan.pdf" />;
}`,
    // 2 — shared link
    `// SharePanel.tsx
import { useEffect, useRef } from "react";
import "@unofficialbox/box-open-elements/share-panel";


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
import "@unofficialbox/box-open-elements/share-panel";


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
import "@unofficialbox/box-open-elements/share-panel";


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
import "@unofficialbox/box-open-elements/share-panel";


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
import "@unofficialbox/box-open-elements/share-panel";


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
import "@unofficialbox/box-open-elements/share-panel";


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
import "@unofficialbox/box-open-elements/share-panel";


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
import "@unofficialbox/box-open-elements/share-panel";


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
import "@unofficialbox/box-open-elements/share-panel";


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
import "@unofficialbox/box-open-elements/share-panel";

</script>

<template>
  <box-share-panel heading="Share Quarterly Plan.pdf"></box-share-panel>
</template>`,
    // 2
    `<script setup lang="ts">
import "@unofficialbox/box-open-elements/share-panel";


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
import "@unofficialbox/box-open-elements/share-panel";


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
import "@unofficialbox/box-open-elements/share-panel";


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
import "@unofficialbox/box-open-elements/share-panel";


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
  import "@unofficialbox/box-open-elements/share-panel";

</script>

<box-share-panel heading="Share Quarterly Plan.pdf"></box-share-panel>`,
    // 2
    `<script lang="ts">
  import "@unofficialbox/box-open-elements/share-panel";


  let el;
  // Object props are assigned, not passed as attributes.
  $: if (el) el.sharedLink = { url: "https://box.com/s/example", access: "company" };
</script>

<box-share-panel bind:this={el} heading="Share Quarterly Plan.pdf"></box-share-panel>`,
    // 3
    `<script lang="ts">
  import "@unofficialbox/box-open-elements/share-panel";


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
  import "@unofficialbox/box-open-elements/share-panel";


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
  import "@unofficialbox/box-open-elements/share-panel";


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
import "@unofficialbox/box-open-elements/preview";


export function Preview() {
  const ref = useRef(null);
  return <box-preview-element ref={ref} heading="Quarterly Plan.pdf" />;
}`,
    // 2 — item chrome
    `// Preview.tsx
import { useRef } from "react";
import "@unofficialbox/box-open-elements/preview";


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
import "@unofficialbox/box-open-elements/preview";


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
import "@unofficialbox/box-open-elements/preview";


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
import "@unofficialbox/box-open-elements/preview";


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

    const onAction = event =>
      console.log("action", event.detail.action, event.detail.providerId);
    el.addEventListener("action", onAction);
    return () => {
      el.removeEventListener("action", onAction);
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
import "@unofficialbox/box-open-elements/preview";


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
import "@unofficialbox/box-open-elements/preview";


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
import "@unofficialbox/box-open-elements/preview";


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
import "@unofficialbox/box-open-elements/preview";


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
import "@unofficialbox/box-open-elements/preview";


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
    console.log("action", event.detail.action, event.detail.providerId);
  }
}`,
  ],
  vue: [
    previewSetup.vue,
    // 1
    `<script setup lang="ts">
import "@unofficialbox/box-open-elements/preview";

</script>

<template>
  <box-preview-element heading="Quarterly Plan.pdf"></box-preview-element>
</template>`,
    // 2
    `<script setup lang="ts">
import "@unofficialbox/box-open-elements/preview";

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
import "@unofficialbox/box-open-elements/preview";


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
import "@unofficialbox/box-open-elements/preview";


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
import "@unofficialbox/box-open-elements/preview";


const provider = { id: "content-preview", label: "Box Content Preview", engine: "pdf.js" };
const adapterState = { ready: true, pageLabel: "Page 2 of 34", zoomLabel: "100%" };
const actions = [
  { id: "open-provider", label: "Open provider", tone: "primary" },
  { id: "download", label: "Download" },
];

const onAction = (event: CustomEvent) =>
  console.log("action", event.detail.action, event.detail.providerId);
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
  ></box-preview-element>
</template>`,
  ],
  svelte: [
    previewSetup.svelte,
    // 1
    `<script lang="ts">
  import "@unofficialbox/box-open-elements/preview";

</script>

<box-preview-element heading="Quarterly Plan.pdf"></box-preview-element>`,
    // 2
    `<script lang="ts">
  import "@unofficialbox/box-open-elements/preview";

</script>

<box-preview-element
  heading="Quarterly Plan.pdf"
  item-label="PDF · 2.4 MB"
  status="Ready"
  message="Rendered by the active preview provider."
></box-preview-element>`,
    // 3
    `<script lang="ts">
  import "@unofficialbox/box-open-elements/preview";


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
  import "@unofficialbox/box-open-elements/preview";


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
  import "@unofficialbox/box-open-elements/preview";


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
  on:action={event =>
    console.log("action", event.detail.action, event.detail.providerId)}
></box-preview-element>`,
  ],
};

// ── Intake workspace (form wizard + work queue + timeline) ───────────────────

const INTAKE_STEPS_SNIPPET = `[
    { id: "parties", label: "Parties" },
    { id: "terms", label: "Key terms" },
    { id: "review", label: "Review & submit" },
  ]`;

export const intakeStepFrameworks: StepFrameworks = {
  react: [
    intakeSetup.react,
    // 1 — wizard shell with steps + slotted panels
    `// IntakeWorkspace.tsx
import { useEffect, useRef } from "react";
import "@unofficialbox/box-open-elements/form-wizard";


export function IntakeWorkspace() {
  const wizard = useRef(null);

  useEffect(() => {
    if (!wizard.current) return;
    // steps is an array, so set it as a property, not an attribute.
    wizard.current.steps = ${INTAKE_STEPS_SNIPPET};
  }, []);

  return (
    <box-form-wizard ref={wizard} heading="Contract intake" submit-label="Submit request">
      <div slot="parties"><label>Counterparty <input id="counterparty" /></label></div>
      <div slot="terms"><label>Contract value <input id="value" /></label></div>
      <div slot="review"><p>Review the request, then submit for triage.</p></div>
    </box-form-wizard>
  );
}`,
    // 2 — value store + validator gating
    `// IntakeWorkspace.tsx
import { useEffect, useRef } from "react";
import "@unofficialbox/box-open-elements/form-wizard";


export function IntakeWorkspace() {
  const wizard = useRef(null);

  useEffect(() => {
    const el = wizard.current;
    if (!el) return;
    el.steps = ${INTAKE_STEPS_SNIPPET};
    el.validators = {
      parties: values =>
        values.counterparty
          ? { valid: true }
          : { valid: false, message: "Name the counterparty before continuing." },
    };
  }, []);

  const setValue = (field) => (event) =>
    wizard.current?.wizardController?.setValue(field, event.target.value);

  return (
    <box-form-wizard ref={wizard} heading="Contract intake" submit-label="Submit request">
      <div slot="parties"><label>Counterparty <input onInput={setValue("counterparty")} /></label></div>
      <div slot="terms"><label>Contract value <input onInput={setValue("value")} /></label></div>
      <div slot="review"><p>Review the request, then submit for triage.</p></div>
    </box-form-wizard>
  );
}`,
    // 3 — queue + transport; submitted files a work item
    `// IntakeWorkspace.tsx
import { useEffect, useRef } from "react";
import "@unofficialbox/box-open-elements/form-wizard";
import "@unofficialbox/box-open-elements/work-queue";


export function IntakeWorkspace() {
  const wizard = useRef(null);
  const queue = useRef(null);
  const requests = useRef([]);

  useEffect(() => {
    const el = wizard.current;
    const queueEl = queue.current;
    if (!el || !queueEl) return;
    el.steps = ${INTAKE_STEPS_SNIPPET};
    el.validators = {
      parties: values =>
        values.counterparty
          ? { valid: true }
          : { valid: false, message: "Name the counterparty before continuing." },
    };
    queueEl.transport = {
      loadItems: () => Promise.resolve({ items: requests.current.map(item => ({ ...item })) }),
      completeItem: ({ itemId }) => {
        const item = requests.current.find(entry => entry.id === itemId);
        item.status = "completed";
        return Promise.resolve({ ...item });
      },
    };
    const onSubmitted = (event) => {
      requests.current.push({
        id: "req-" + (requests.current.length + 1),
        title: "Intake: " + (event.detail.values.counterparty || "New request"),
        type: "intake",
        status: "open",
      });
      queueEl.refresh();
    };
    el.addEventListener("submitted", onSubmitted);
    return () => el.removeEventListener("submitted", onSubmitted);
  }, []);

  const setValue = (field) => (event) =>
    wizard.current?.wizardController?.setValue(field, event.target.value);

  return (
    <>
      <box-form-wizard ref={wizard} heading="Contract intake" submit-label="Submit request">
        <div slot="parties"><label>Counterparty <input onInput={setValue("counterparty")} /></label></div>
        <div slot="terms"><label>Contract value <input onInput={setValue("value")} /></label></div>
        <div slot="review"><p>Review the request, then submit for triage.</p></div>
      </box-form-wizard>
      <box-work-queue ref={queue} heading="Intake queue" token="developer-token" />
    </>
  );
}`,
    // 4 — timeline records submissions
    `// IntakeWorkspace.tsx
import { useEffect, useRef } from "react";
import "@unofficialbox/box-open-elements/form-wizard";
import "@unofficialbox/box-open-elements/work-queue";
import "@unofficialbox/box-open-elements/timeline";


export function IntakeWorkspace() {
  const wizard = useRef(null);
  const queue = useRef(null);
  const timeline = useRef(null);
  const requests = useRef([]);
  const activity = useRef([]);

  useEffect(() => {
    const el = wizard.current;
    const queueEl = queue.current;
    if (!el || !queueEl) return;
    el.steps = ${INTAKE_STEPS_SNIPPET};
    el.validators = {
      parties: values =>
        values.counterparty
          ? { valid: true }
          : { valid: false, message: "Name the counterparty before continuing." },
    };
    queueEl.transport = {
      loadItems: () => Promise.resolve({ items: requests.current.map(item => ({ ...item })) }),
      completeItem: ({ itemId }) => {
        const item = requests.current.find(entry => entry.id === itemId);
        item.status = "completed";
        return Promise.resolve({ ...item });
      },
    };
    const record = (action, summary) => {
      activity.current = [
        { id: "a-" + (activity.current.length + 1), action, summary, timestamp: new Date().toISOString() },
        ...activity.current,
      ];
      if (timeline.current) timeline.current.events = activity.current;
    };
    const onSubmitted = (event) => {
      requests.current.push({
        id: "req-" + (requests.current.length + 1),
        title: "Intake: " + (event.detail.values.counterparty || "New request"),
        type: "intake",
        status: "open",
      });
      queueEl.refresh();
      record("Intake submitted", "Request entered triage.");
    };
    el.addEventListener("submitted", onSubmitted);
    return () => el.removeEventListener("submitted", onSubmitted);
  }, []);

  const setValue = (field) => (event) =>
    wizard.current?.wizardController?.setValue(field, event.target.value);

  return (
    <>
      <box-form-wizard ref={wizard} heading="Contract intake" submit-label="Submit request">
        <div slot="parties"><label>Counterparty <input onInput={setValue("counterparty")} /></label></div>
        <div slot="terms"><label>Contract value <input onInput={setValue("value")} /></label></div>
        <div slot="review"><p>Review the request, then submit for triage.</p></div>
      </box-form-wizard>
      <box-work-queue ref={queue} heading="Intake queue" token="developer-token" />
      <box-timeline ref={timeline} heading="Activity" />
    </>
  );
}`,
    // 5 — claim/complete flow onto the timeline
    `// IntakeWorkspace.tsx
import { useEffect, useRef } from "react";
import "@unofficialbox/box-open-elements/form-wizard";
import "@unofficialbox/box-open-elements/work-queue";
import "@unofficialbox/box-open-elements/timeline";


export function IntakeWorkspace() {
  const wizard = useRef(null);
  const queue = useRef(null);
  const timeline = useRef(null);
  const requests = useRef([]);
  const activity = useRef([]);

  useEffect(() => {
    const el = wizard.current;
    const queueEl = queue.current;
    if (!el || !queueEl) return;
    el.steps = ${INTAKE_STEPS_SNIPPET};
    el.validators = {
      parties: values =>
        values.counterparty
          ? { valid: true }
          : { valid: false, message: "Name the counterparty before continuing." },
    };
    queueEl.transport = {
      loadItems: () => Promise.resolve({ items: requests.current.map(item => ({ ...item })) }),
      claimItem: ({ itemId, assigneeId }) => {
        const item = requests.current.find(entry => entry.id === itemId);
        item.assignee = { id: assigneeId, name: "You" };
        return Promise.resolve({ ...item });
      },
      completeItem: ({ itemId }) => {
        const item = requests.current.find(entry => entry.id === itemId);
        item.status = "completed";
        return Promise.resolve({ ...item });
      },
    };
    const record = (action, summary) => {
      activity.current = [
        { id: "a-" + (activity.current.length + 1), action, summary, timestamp: new Date().toISOString() },
        ...activity.current,
      ];
      if (timeline.current) timeline.current.events = activity.current;
    };
    const onSubmitted = (event) => {
      requests.current.push({
        id: "req-" + (requests.current.length + 1),
        title: "Intake: " + (event.detail.values.counterparty || "New request"),
        type: "intake",
        status: "open",
      });
      queueEl.refresh();
      record("Intake submitted", "Request entered triage.");
    };
    const actionLabels = { claim: "Work item claimed", complete: "Work item completed" };
    const onMutated = (event) =>
      record(actionLabels[event.detail.kind] || "Work item updated", event.detail.item.title);
    el.addEventListener("submitted", onSubmitted);
    queueEl.addEventListener("item-mutated", onMutated);
    return () => {
      el.removeEventListener("submitted", onSubmitted);
      queueEl.removeEventListener("item-mutated", onMutated);
    };
  }, []);

  const setValue = (field) => (event) =>
    wizard.current?.wizardController?.setValue(field, event.target.value);

  return (
    <>
      <box-form-wizard ref={wizard} heading="Contract intake" submit-label="Submit request">
        <div slot="parties"><label>Counterparty <input onInput={setValue("counterparty")} /></label></div>
        <div slot="terms"><label>Contract value <input onInput={setValue("value")} /></label></div>
        <div slot="review"><p>Review the request, then submit for triage.</p></div>
      </box-form-wizard>
      <box-work-queue ref={queue} heading="Intake queue" token="developer-token" assignee-id="you" />
      <box-timeline ref={timeline} heading="Activity" />
    </>
  );
}`,
  ],
  angular: [
    intakeSetup.angular,
    // 1
    `// intake.component.ts
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild } from "@angular/core";
import "@unofficialbox/box-open-elements/form-wizard";


@Component({
  standalone: true,
  selector: "app-intake",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <box-form-wizard #wizard heading="Contract intake" submit-label="Submit request">
      <div slot="parties"><label>Counterparty <input id="counterparty" /></label></div>
      <div slot="terms"><label>Contract value <input id="value" /></label></div>
      <div slot="review"><p>Review the request, then submit for triage.</p></div>
    </box-form-wizard>
  \`,
})
export class IntakeComponent implements AfterViewInit {
  @ViewChild("wizard") wizard!: ElementRef;

  ngAfterViewInit() {
    // steps is an array, so it is set as a property, not an attribute.
    this.wizard.nativeElement.steps = ${INTAKE_STEPS_SNIPPET};
  }
}`,
    // 2
    `// intake.component.ts
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild } from "@angular/core";
import "@unofficialbox/box-open-elements/form-wizard";


@Component({
  standalone: true,
  selector: "app-intake",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <box-form-wizard #wizard heading="Contract intake" submit-label="Submit request">
      <div slot="parties">
        <label>Counterparty <input (input)="setValue('counterparty', $event)" /></label>
      </div>
      <div slot="terms">
        <label>Contract value <input (input)="setValue('value', $event)" /></label>
      </div>
      <div slot="review"><p>Review the request, then submit for triage.</p></div>
    </box-form-wizard>
  \`,
})
export class IntakeComponent implements AfterViewInit {
  @ViewChild("wizard") wizard!: ElementRef;

  ngAfterViewInit() {
    this.wizard.nativeElement.steps = ${INTAKE_STEPS_SNIPPET};
    this.wizard.nativeElement.validators = {
      parties: (values: Record<string, unknown>) =>
        values["counterparty"]
          ? { valid: true }
          : { valid: false, message: "Name the counterparty before continuing." },
    };
  }

  setValue(field: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.wizard.nativeElement.wizardController?.setValue(field, input.value);
  }
}`,
    // 3
    `// intake.component.ts
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild } from "@angular/core";
import "@unofficialbox/box-open-elements/form-wizard";
import "@unofficialbox/box-open-elements/work-queue";


@Component({
  standalone: true,
  selector: "app-intake",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <box-form-wizard
      #wizard
      heading="Contract intake"
      submit-label="Submit request"
      (submitted)="onSubmitted($event)"
    >
      <div slot="parties">
        <label>Counterparty <input (input)="setValue('counterparty', $event)" /></label>
      </div>
      <div slot="terms">
        <label>Contract value <input (input)="setValue('value', $event)" /></label>
      </div>
      <div slot="review"><p>Review the request, then submit for triage.</p></div>
    </box-form-wizard>
    <box-work-queue #queue heading="Intake queue" token="developer-token"></box-work-queue>
  \`,
})
export class IntakeComponent implements AfterViewInit {
  @ViewChild("wizard") wizard!: ElementRef;
  @ViewChild("queue") queue!: ElementRef;
  requests: Array<Record<string, unknown>> = [];

  ngAfterViewInit() {
    this.wizard.nativeElement.steps = ${INTAKE_STEPS_SNIPPET};
    this.wizard.nativeElement.validators = {
      parties: (values: Record<string, unknown>) =>
        values["counterparty"]
          ? { valid: true }
          : { valid: false, message: "Name the counterparty before continuing." },
    };
    this.queue.nativeElement.transport = {
      loadItems: () => Promise.resolve({ items: this.requests.map(item => ({ ...item })) }),
      completeItem: ({ itemId }: { itemId: string }) => {
        const item = this.requests.find(entry => entry["id"] === itemId)!;
        item["status"] = "completed";
        return Promise.resolve({ ...item });
      },
    };
  }

  setValue(field: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.wizard.nativeElement.wizardController?.setValue(field, input.value);
  }

  onSubmitted(event: Event) {
    const values = (event as CustomEvent).detail.values;
    this.requests.push({
      id: "req-" + (this.requests.length + 1),
      title: "Intake: " + (values.counterparty || "New request"),
      type: "intake",
      status: "open",
    });
    this.queue.nativeElement.refresh();
  }
}`,
    // 4
    `// intake.component.ts
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild } from "@angular/core";
import "@unofficialbox/box-open-elements/form-wizard";
import "@unofficialbox/box-open-elements/work-queue";
import "@unofficialbox/box-open-elements/timeline";


@Component({
  standalone: true,
  selector: "app-intake",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <box-form-wizard
      #wizard
      heading="Contract intake"
      submit-label="Submit request"
      (submitted)="onSubmitted($event)"
    >
      <div slot="parties">
        <label>Counterparty <input (input)="setValue('counterparty', $event)" /></label>
      </div>
      <div slot="terms">
        <label>Contract value <input (input)="setValue('value', $event)" /></label>
      </div>
      <div slot="review"><p>Review the request, then submit for triage.</p></div>
    </box-form-wizard>
    <box-work-queue #queue heading="Intake queue" token="developer-token"></box-work-queue>
    <box-timeline #timeline heading="Activity"></box-timeline>
  \`,
})
export class IntakeComponent implements AfterViewInit {
  @ViewChild("wizard") wizard!: ElementRef;
  @ViewChild("queue") queue!: ElementRef;
  @ViewChild("timeline") timeline!: ElementRef;
  requests: Array<Record<string, unknown>> = [];
  activity: Array<Record<string, unknown>> = [];

  ngAfterViewInit() {
    this.wizard.nativeElement.steps = ${INTAKE_STEPS_SNIPPET};
    this.wizard.nativeElement.validators = {
      parties: (values: Record<string, unknown>) =>
        values["counterparty"]
          ? { valid: true }
          : { valid: false, message: "Name the counterparty before continuing." },
    };
    this.queue.nativeElement.transport = {
      loadItems: () => Promise.resolve({ items: this.requests.map(item => ({ ...item })) }),
      completeItem: ({ itemId }: { itemId: string }) => {
        const item = this.requests.find(entry => entry["id"] === itemId)!;
        item["status"] = "completed";
        return Promise.resolve({ ...item });
      },
    };
  }

  record(action: string, summary: string) {
    this.activity = [
      { id: "a-" + (this.activity.length + 1), action, summary, timestamp: new Date().toISOString() },
      ...this.activity,
    ];
    this.timeline.nativeElement.events = this.activity;
  }

  setValue(field: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.wizard.nativeElement.wizardController?.setValue(field, input.value);
  }

  onSubmitted(event: Event) {
    const values = (event as CustomEvent).detail.values;
    this.requests.push({
      id: "req-" + (this.requests.length + 1),
      title: "Intake: " + (values.counterparty || "New request"),
      type: "intake",
      status: "open",
    });
    this.queue.nativeElement.refresh();
    this.record("Intake submitted", "Request entered triage.");
  }
}`,
    // 5
    `// intake.component.ts
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, ViewChild } from "@angular/core";
import "@unofficialbox/box-open-elements/form-wizard";
import "@unofficialbox/box-open-elements/work-queue";
import "@unofficialbox/box-open-elements/timeline";


@Component({
  standalone: true,
  selector: "app-intake",
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: \`
    <box-form-wizard
      #wizard
      heading="Contract intake"
      submit-label="Submit request"
      (submitted)="onSubmitted($event)"
    >
      <div slot="parties">
        <label>Counterparty <input (input)="setValue('counterparty', $event)" /></label>
      </div>
      <div slot="terms">
        <label>Contract value <input (input)="setValue('value', $event)" /></label>
      </div>
      <div slot="review"><p>Review the request, then submit for triage.</p></div>
    </box-form-wizard>
    <box-work-queue
      #queue
      heading="Intake queue"
      token="developer-token"
      assignee-id="you"
      (item-mutated)="onMutated($event)"
    ></box-work-queue>
    <box-timeline #timeline heading="Activity"></box-timeline>
  \`,
})
export class IntakeComponent implements AfterViewInit {
  @ViewChild("wizard") wizard!: ElementRef;
  @ViewChild("queue") queue!: ElementRef;
  @ViewChild("timeline") timeline!: ElementRef;
  requests: Array<Record<string, unknown>> = [];
  activity: Array<Record<string, unknown>> = [];

  ngAfterViewInit() {
    this.wizard.nativeElement.steps = ${INTAKE_STEPS_SNIPPET};
    this.wizard.nativeElement.validators = {
      parties: (values: Record<string, unknown>) =>
        values["counterparty"]
          ? { valid: true }
          : { valid: false, message: "Name the counterparty before continuing." },
    };
    this.queue.nativeElement.transport = {
      loadItems: () => Promise.resolve({ items: this.requests.map(item => ({ ...item })) }),
      claimItem: ({ itemId, assigneeId }: { itemId: string; assigneeId: string }) => {
        const item = this.requests.find(entry => entry["id"] === itemId)!;
        item["assignee"] = { id: assigneeId, name: "You" };
        return Promise.resolve({ ...item });
      },
      completeItem: ({ itemId }: { itemId: string }) => {
        const item = this.requests.find(entry => entry["id"] === itemId)!;
        item["status"] = "completed";
        return Promise.resolve({ ...item });
      },
    };
  }

  record(action: string, summary: string) {
    this.activity = [
      { id: "a-" + (this.activity.length + 1), action, summary, timestamp: new Date().toISOString() },
      ...this.activity,
    ];
    this.timeline.nativeElement.events = this.activity;
  }

  setValue(field: string, event: Event) {
    const input = event.target as HTMLInputElement;
    this.wizard.nativeElement.wizardController?.setValue(field, input.value);
  }

  onSubmitted(event: Event) {
    const values = (event as CustomEvent).detail.values;
    this.requests.push({
      id: "req-" + (this.requests.length + 1),
      title: "Intake: " + (values.counterparty || "New request"),
      type: "intake",
      status: "open",
    });
    this.queue.nativeElement.refresh();
    this.record("Intake submitted", "Request entered triage.");
  }

  onMutated(event: Event) {
    const detail = (event as CustomEvent).detail;
    const actionLabels: Record<string, string> = { claim: "Work item claimed", complete: "Work item completed" };
    this.record(actionLabels[detail.kind] ?? "Work item updated", detail.item.title);
  }
}`,
  ],
  vue: [
    intakeSetup.vue,
    // 1
    `<script setup lang="ts">
import { onMounted, ref } from "vue";
import "@unofficialbox/box-open-elements/form-wizard";


const wizard = ref();

onMounted(() => {
  // steps is an array, so it is set as a property, not an attribute.
  wizard.value.steps = ${INTAKE_STEPS_SNIPPET};
});
</script>

<template>
  <box-form-wizard ref="wizard" heading="Contract intake" submit-label="Submit request">
    <div slot="parties"><label>Counterparty <input /></label></div>
    <div slot="terms"><label>Contract value <input /></label></div>
    <div slot="review"><p>Review the request, then submit for triage.</p></div>
  </box-form-wizard>
</template>`,
    // 2
    `<script setup lang="ts">
import { onMounted, ref } from "vue";
import "@unofficialbox/box-open-elements/form-wizard";


const wizard = ref();

onMounted(() => {
  wizard.value.steps = ${INTAKE_STEPS_SNIPPET};
  wizard.value.validators = {
    parties: (values: Record<string, unknown>) =>
      values.counterparty
        ? { valid: true }
        : { valid: false, message: "Name the counterparty before continuing." },
  };
});

const setValue = (field: string, event: Event) => {
  const input = event.target as HTMLInputElement;
  wizard.value.wizardController?.setValue(field, input.value);
};
</script>

<template>
  <box-form-wizard ref="wizard" heading="Contract intake" submit-label="Submit request">
    <div slot="parties">
      <label>Counterparty <input @input="setValue('counterparty', $event)" /></label>
    </div>
    <div slot="terms">
      <label>Contract value <input @input="setValue('value', $event)" /></label>
    </div>
    <div slot="review"><p>Review the request, then submit for triage.</p></div>
  </box-form-wizard>
</template>`,
    // 3
    `<script setup lang="ts">
import { onMounted, ref } from "vue";
import "@unofficialbox/box-open-elements/form-wizard";
import "@unofficialbox/box-open-elements/work-queue";


const wizard = ref();
const queue = ref();
const requests: Array<Record<string, unknown>> = [];

onMounted(() => {
  wizard.value.steps = ${INTAKE_STEPS_SNIPPET};
  wizard.value.validators = {
    parties: (values: Record<string, unknown>) =>
      values.counterparty
        ? { valid: true }
        : { valid: false, message: "Name the counterparty before continuing." },
  };
  queue.value.transport = {
    loadItems: () => Promise.resolve({ items: requests.map(item => ({ ...item })) }),
    completeItem: ({ itemId }: { itemId: string }) => {
      const item = requests.find(entry => entry.id === itemId)!;
      item.status = "completed";
      return Promise.resolve({ ...item });
    },
  };
});

const setValue = (field: string, event: Event) => {
  const input = event.target as HTMLInputElement;
  wizard.value.wizardController?.setValue(field, input.value);
};

const onSubmitted = (event: CustomEvent) => {
  requests.push({
    id: "req-" + (requests.length + 1),
    title: "Intake: " + (event.detail.values.counterparty || "New request"),
    type: "intake",
    status: "open",
  });
  queue.value.refresh();
};
</script>

<template>
  <box-form-wizard
    ref="wizard"
    heading="Contract intake"
    submit-label="Submit request"
    @submitted="onSubmitted"
  >
    <div slot="parties">
      <label>Counterparty <input @input="setValue('counterparty', $event)" /></label>
    </div>
    <div slot="terms">
      <label>Contract value <input @input="setValue('value', $event)" /></label>
    </div>
    <div slot="review"><p>Review the request, then submit for triage.</p></div>
  </box-form-wizard>
  <box-work-queue ref="queue" heading="Intake queue" token="developer-token"></box-work-queue>
</template>`,
    // 4
    `<script setup lang="ts">
import { onMounted, ref } from "vue";
import "@unofficialbox/box-open-elements/form-wizard";
import "@unofficialbox/box-open-elements/work-queue";
import "@unofficialbox/box-open-elements/timeline";


const wizard = ref();
const queue = ref();
const timeline = ref();
const requests: Array<Record<string, unknown>> = [];
let activity: Array<Record<string, unknown>> = [];

onMounted(() => {
  wizard.value.steps = ${INTAKE_STEPS_SNIPPET};
  wizard.value.validators = {
    parties: (values: Record<string, unknown>) =>
      values.counterparty
        ? { valid: true }
        : { valid: false, message: "Name the counterparty before continuing." },
  };
  queue.value.transport = {
    loadItems: () => Promise.resolve({ items: requests.map(item => ({ ...item })) }),
    completeItem: ({ itemId }: { itemId: string }) => {
      const item = requests.find(entry => entry.id === itemId)!;
      item.status = "completed";
      return Promise.resolve({ ...item });
    },
  };
});

const record = (action: string, summary: string) => {
  activity = [
    { id: "a-" + (activity.length + 1), action, summary, timestamp: new Date().toISOString() },
    ...activity,
  ];
  timeline.value.events = activity;
};

const setValue = (field: string, event: Event) => {
  const input = event.target as HTMLInputElement;
  wizard.value.wizardController?.setValue(field, input.value);
};

const onSubmitted = (event: CustomEvent) => {
  requests.push({
    id: "req-" + (requests.length + 1),
    title: "Intake: " + (event.detail.values.counterparty || "New request"),
    type: "intake",
    status: "open",
  });
  queue.value.refresh();
  record("Intake submitted", "Request entered triage.");
};
</script>

<template>
  <box-form-wizard
    ref="wizard"
    heading="Contract intake"
    submit-label="Submit request"
    @submitted="onSubmitted"
  >
    <div slot="parties">
      <label>Counterparty <input @input="setValue('counterparty', $event)" /></label>
    </div>
    <div slot="terms">
      <label>Contract value <input @input="setValue('value', $event)" /></label>
    </div>
    <div slot="review"><p>Review the request, then submit for triage.</p></div>
  </box-form-wizard>
  <box-work-queue ref="queue" heading="Intake queue" token="developer-token"></box-work-queue>
  <box-timeline ref="timeline" heading="Activity"></box-timeline>
</template>`,
    // 5
    `<script setup lang="ts">
import { onMounted, ref } from "vue";
import "@unofficialbox/box-open-elements/form-wizard";
import "@unofficialbox/box-open-elements/work-queue";
import "@unofficialbox/box-open-elements/timeline";


const wizard = ref();
const queue = ref();
const timeline = ref();
const requests: Array<Record<string, unknown>> = [];
let activity: Array<Record<string, unknown>> = [];

onMounted(() => {
  wizard.value.steps = ${INTAKE_STEPS_SNIPPET};
  wizard.value.validators = {
    parties: (values: Record<string, unknown>) =>
      values.counterparty
        ? { valid: true }
        : { valid: false, message: "Name the counterparty before continuing." },
  };
  queue.value.transport = {
    loadItems: () => Promise.resolve({ items: requests.map(item => ({ ...item })) }),
    claimItem: ({ itemId, assigneeId }: { itemId: string; assigneeId: string }) => {
      const item = requests.find(entry => entry.id === itemId)!;
      item.assignee = { id: assigneeId, name: "You" };
      return Promise.resolve({ ...item });
    },
    completeItem: ({ itemId }: { itemId: string }) => {
      const item = requests.find(entry => entry.id === itemId)!;
      item.status = "completed";
      return Promise.resolve({ ...item });
    },
  };
});

const record = (action: string, summary: string) => {
  activity = [
    { id: "a-" + (activity.length + 1), action, summary, timestamp: new Date().toISOString() },
    ...activity,
  ];
  timeline.value.events = activity;
};

const setValue = (field: string, event: Event) => {
  const input = event.target as HTMLInputElement;
  wizard.value.wizardController?.setValue(field, input.value);
};

const onSubmitted = (event: CustomEvent) => {
  requests.push({
    id: "req-" + (requests.length + 1),
    title: "Intake: " + (event.detail.values.counterparty || "New request"),
    type: "intake",
    status: "open",
  });
  queue.value.refresh();
  record("Intake submitted", "Request entered triage.");
};

const actionLabels: Record<string, string> = { claim: "Work item claimed", complete: "Work item completed" };
const onMutated = (event: CustomEvent) => {
  record(actionLabels[event.detail.kind] ?? "Work item updated", event.detail.item.title);
};
</script>

<template>
  <box-form-wizard
    ref="wizard"
    heading="Contract intake"
    submit-label="Submit request"
    @submitted="onSubmitted"
  >
    <div slot="parties">
      <label>Counterparty <input @input="setValue('counterparty', $event)" /></label>
    </div>
    <div slot="terms">
      <label>Contract value <input @input="setValue('value', $event)" /></label>
    </div>
    <div slot="review"><p>Review the request, then submit for triage.</p></div>
  </box-form-wizard>
  <box-work-queue
    ref="queue"
    heading="Intake queue"
    token="developer-token"
    assignee-id="you"
    @item-mutated="onMutated"
  ></box-work-queue>
  <box-timeline ref="timeline" heading="Activity"></box-timeline>
</template>`,
  ],
  // Svelte snippets target Svelte 5's default legacy mode — `$:` reactivity
  // and `on:` event syntax do not compile under runes mode.
  svelte: [
    intakeSetup.svelte,
    // 1
    `<script lang="ts">
  import "@unofficialbox/box-open-elements/form-wizard";


  let wizard;
  // steps is an array, so it is assigned as a property, not an attribute.
  $: if (wizard)
    wizard.steps = ${INTAKE_STEPS_SNIPPET};
</script>

<box-form-wizard bind:this={wizard} heading="Contract intake" submit-label="Submit request">
  <div slot="parties"><label>Counterparty <input /></label></div>
  <div slot="terms"><label>Contract value <input /></label></div>
  <div slot="review"><p>Review the request, then submit for triage.</p></div>
</box-form-wizard>`,
    // 2
    `<script lang="ts">
  import "@unofficialbox/box-open-elements/form-wizard";


  let wizard;
  $: if (wizard) {
    wizard.steps = ${INTAKE_STEPS_SNIPPET};
    wizard.validators = {
      parties: values =>
        values.counterparty
          ? { valid: true }
          : { valid: false, message: "Name the counterparty before continuing." },
    };
  }

  const setValue = (field) => (event) =>
    wizard?.wizardController?.setValue(field, event.target.value);
</script>

<box-form-wizard bind:this={wizard} heading="Contract intake" submit-label="Submit request">
  <div slot="parties">
    <label>Counterparty <input on:input={setValue("counterparty")} /></label>
  </div>
  <div slot="terms">
    <label>Contract value <input on:input={setValue("value")} /></label>
  </div>
  <div slot="review"><p>Review the request, then submit for triage.</p></div>
</box-form-wizard>`,
    // 3
    `<script lang="ts">
  import "@unofficialbox/box-open-elements/form-wizard";
  import "@unofficialbox/box-open-elements/work-queue";


  let wizard;
  let queue;
  const requests = [];

  $: if (wizard) {
    wizard.steps = ${INTAKE_STEPS_SNIPPET};
    wizard.validators = {
      parties: values =>
        values.counterparty
          ? { valid: true }
          : { valid: false, message: "Name the counterparty before continuing." },
    };
  }
  $: if (queue)
    queue.transport = {
      loadItems: () => Promise.resolve({ items: requests.map(item => ({ ...item })) }),
      completeItem: ({ itemId }) => {
        const item = requests.find(entry => entry.id === itemId);
        item.status = "completed";
        return Promise.resolve({ ...item });
      },
    };

  const setValue = (field) => (event) =>
    wizard?.wizardController?.setValue(field, event.target.value);

  const onSubmitted = (event) => {
    requests.push({
      id: "req-" + (requests.length + 1),
      title: "Intake: " + (event.detail.values.counterparty || "New request"),
      type: "intake",
      status: "open",
    });
    queue.refresh();
  };
</script>

<box-form-wizard
  bind:this={wizard}
  heading="Contract intake"
  submit-label="Submit request"
  on:submitted={onSubmitted}
>
  <div slot="parties">
    <label>Counterparty <input on:input={setValue("counterparty")} /></label>
  </div>
  <div slot="terms">
    <label>Contract value <input on:input={setValue("value")} /></label>
  </div>
  <div slot="review"><p>Review the request, then submit for triage.</p></div>
</box-form-wizard>
<box-work-queue bind:this={queue} heading="Intake queue" token="developer-token"></box-work-queue>`,
    // 4
    `<script lang="ts">
  import "@unofficialbox/box-open-elements/form-wizard";
  import "@unofficialbox/box-open-elements/work-queue";
  import "@unofficialbox/box-open-elements/timeline";


  let wizard;
  let queue;
  let timeline;
  const requests = [];
  let activity = [];

  $: if (wizard) {
    wizard.steps = ${INTAKE_STEPS_SNIPPET};
    wizard.validators = {
      parties: values =>
        values.counterparty
          ? { valid: true }
          : { valid: false, message: "Name the counterparty before continuing." },
    };
  }
  $: if (queue)
    queue.transport = {
      loadItems: () => Promise.resolve({ items: requests.map(item => ({ ...item })) }),
      completeItem: ({ itemId }) => {
        const item = requests.find(entry => entry.id === itemId);
        item.status = "completed";
        return Promise.resolve({ ...item });
      },
    };

  const record = (action, summary) => {
    activity = [
      { id: "a-" + (activity.length + 1), action, summary, timestamp: new Date().toISOString() },
      ...activity,
    ];
    timeline.events = activity;
  };

  const setValue = (field) => (event) =>
    wizard?.wizardController?.setValue(field, event.target.value);

  const onSubmitted = (event) => {
    requests.push({
      id: "req-" + (requests.length + 1),
      title: "Intake: " + (event.detail.values.counterparty || "New request"),
      type: "intake",
      status: "open",
    });
    queue.refresh();
    record("Intake submitted", "Request entered triage.");
  };
</script>

<box-form-wizard
  bind:this={wizard}
  heading="Contract intake"
  submit-label="Submit request"
  on:submitted={onSubmitted}
>
  <div slot="parties">
    <label>Counterparty <input on:input={setValue("counterparty")} /></label>
  </div>
  <div slot="terms">
    <label>Contract value <input on:input={setValue("value")} /></label>
  </div>
  <div slot="review"><p>Review the request, then submit for triage.</p></div>
</box-form-wizard>
<box-work-queue bind:this={queue} heading="Intake queue" token="developer-token"></box-work-queue>
<box-timeline bind:this={timeline} heading="Activity"></box-timeline>`,
    // 5
    `<script lang="ts">
  import "@unofficialbox/box-open-elements/form-wizard";
  import "@unofficialbox/box-open-elements/work-queue";
  import "@unofficialbox/box-open-elements/timeline";


  let wizard;
  let queue;
  let timeline;
  const requests = [];
  let activity = [];

  $: if (wizard) {
    wizard.steps = ${INTAKE_STEPS_SNIPPET};
    wizard.validators = {
      parties: values =>
        values.counterparty
          ? { valid: true }
          : { valid: false, message: "Name the counterparty before continuing." },
    };
  }
  $: if (queue)
    queue.transport = {
      loadItems: () => Promise.resolve({ items: requests.map(item => ({ ...item })) }),
      claimItem: ({ itemId, assigneeId }) => {
        const item = requests.find(entry => entry.id === itemId);
        item.assignee = { id: assigneeId, name: "You" };
        return Promise.resolve({ ...item });
      },
      completeItem: ({ itemId }) => {
        const item = requests.find(entry => entry.id === itemId);
        item.status = "completed";
        return Promise.resolve({ ...item });
      },
    };

  const record = (action, summary) => {
    activity = [
      { id: "a-" + (activity.length + 1), action, summary, timestamp: new Date().toISOString() },
      ...activity,
    ];
    timeline.events = activity;
  };

  const setValue = (field) => (event) =>
    wizard?.wizardController?.setValue(field, event.target.value);

  const onSubmitted = (event) => {
    requests.push({
      id: "req-" + (requests.length + 1),
      title: "Intake: " + (event.detail.values.counterparty || "New request"),
      type: "intake",
      status: "open",
    });
    queue.refresh();
    record("Intake submitted", "Request entered triage.");
  };

  const actionLabels = { claim: "Work item claimed", complete: "Work item completed" };
  const onMutated = (event) =>
    record(actionLabels[event.detail.kind] || "Work item updated", event.detail.item.title);
</script>

<box-form-wizard
  bind:this={wizard}
  heading="Contract intake"
  submit-label="Submit request"
  on:submitted={onSubmitted}
>
  <div slot="parties">
    <label>Counterparty <input on:input={setValue("counterparty")} /></label>
  </div>
  <div slot="terms">
    <label>Contract value <input on:input={setValue("value")} /></label>
  </div>
  <div slot="review"><p>Review the request, then submit for triage.</p></div>
</box-form-wizard>
<box-work-queue
  bind:this={queue}
  heading="Intake queue"
  token="developer-token"
  assignee-id="you"
  on:item-mutated={onMutated}
></box-work-queue>
<box-timeline bind:this={timeline} heading="Activity"></box-timeline>`,
  ],
};
