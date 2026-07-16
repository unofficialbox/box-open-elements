/**
 * Build-along lessons — pure, framework-free data.
 *
 * This module is intentionally DOM-free and does NOT import
 * `box-open-elements`, so it can be unit-tested in a node environment and
 * kept as the single source of truth for lesson content. The browser
 * renderer (`lesson-page.ts`) turns this data into a live, build-it-yourself
 * page; the delta highlight per step is derived by diffing each step's
 * cumulative source against the previous step, so there are no
 * hand-maintained line numbers to drift.
 *
 * Contract: see docs/workshop/build-alongs.md. Lessons are live-website-first
 * (each step runs in the browser against the already-deployed library) with a
 * copyable complete-source "build it in your own project" path.
 */

/** Which live preview state the renderer should build for a step. */
export type PreviewKey =
  | "empty" // setup done, nothing mounted yet
  | "shell" // explorer element mounted, not yet connected
  | "connected" // transport + session wired; data loads
  | "navigate" // + folder-loaded listener updating a "you are here" line
  | "select" // + selection-changed / item-activated listeners
  | "multiselect" // + multi-select production option
  | "share-shell" // share panel mounted with heading only
  | "share-link" // + shared link
  | "share-people" // + collaborators
  | "share-settings" // + message + settings
  | "share-actions" // + actions + event listeners
  | "preview-shell" // preview element mounted with heading only
  | "preview-meta" // + item label, status, message
  | "preview-provider" // + provider JSON
  | "preview-adapter" // + adapter state (page/zoom)
  | "preview-actions"; // + actions + event listeners

export interface LessonStep {
  /** 0 is the mandatory Setup step; 1..n are teaching steps. */
  n: number;
  title: string;
  /** One-sentence goal. */
  goal: string;
  /** The file this step edits. */
  file: string;
  /** Where in the file the change lands. */
  anchor: string;
  /** The FULL cumulative source of `file` at the end of this step. */
  code: string;
  /** One required sentence: what changed and why it works. */
  why: string;
  /** What the reader should see after this step. */
  result: string;
  /** Which live preview the renderer builds for this step. */
  preview: PreviewKey;
}

export interface Lesson {
  id: string;
  title: string;
  /** Workflow area shown as the rail group + breadcrumb. */
  area: string;
  /** One sentence describing the destination. */
  outcome: string;
  /** One short paragraph: why this matters. */
  why: string;
  /** Preview key for the early "what you're building" canvas. */
  outcomePreview: PreviewKey;
  /** Wrap-up copy after the teaching steps. */
  wrapup: string;
  /** The static entry HTML, shared across every step. */
  starterHtml: string;
  /** Install + run notes for the secondary local path. */
  install: string;
  steps: LessonStep[];
}

const importMapSnippet = `{ "imports": { "box-open-elements": "https://esm.sh/box-open-elements@0.1.0" } }`;

const starterHtml = (title: string, mountComment: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <!-- Resolve the package name to the published library. An import map keeps
         the starter dependency-free and runnable from any static server; a
         bundler would do the same resolution in a real project. -->
    <script type="importmap">
      ${importMapSnippet}
    </script>
  </head>
  <body>
    <!-- ${mountComment} -->
    <div id="app"></div>
    <script type="module" src="./app.js"></script>
  </body>
</html>`;

// ── Explorer lesson source, built up cumulatively ────────────────────────────

// Lesson code is plain browser JavaScript (no build step) so the copied
// starter runs from a static server as-is.
const EXPLORER_STEP0 = `import {
  registerBoxDefaultDesignSystem,
  applyDesignTokens,
  defineBoxContentExplorerElement,
} from "box-open-elements";

// Register the Box design system and paint its tokens onto the page.
registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");

// Teach the browser about the <box-content-explorer> element.
defineBoxContentExplorerElement();`;

const EXPLORER_STEP1 = `${EXPLORER_STEP0}

// Create the explorer and add it to the page.
const explorer = document.createElement("box-content-explorer");
document.getElementById("app").append(explorer);`;

const MOCK_TRANSPORT = `// A transport answers the explorer's data requests. This mock returns fixed
// folders so the lesson runs with no backend; swap it for a real Box-backed
// transport (see packages/box-server) in production.
const folderNames = { "0": "All Files", "42": "Marketing", "77": "Legal" };
const transport = {
  async loadFolderItems({ folderId }) {
    const atRoot = folderId === "0";
    const name = folderNames[folderId] || "Folder";
    return {
      folderId,
      folder: { id: folderId, name, type: "folder" },
      breadcrumbs: atRoot
        ? [{ id: "0", name: "All Files", type: "folder" }]
        : [
            { id: "0", name: "All Files", type: "folder" },
            { id: folderId, name, type: "folder" },
          ],
      items: atRoot
        ? [
            { id: "42", name: "Marketing", type: "folder" },
            { id: "77", name: "Legal", type: "folder" },
            { id: "123", name: "Quarterly Plan.pdf", type: "file" },
            { id: "124", name: "Brand Guidelines.pdf", type: "file" },
            { id: "125", name: "box.com/launch", type: "web_link" },
          ]
        : [
            { id: folderId + "-plan", name: name + " plan.docx", type: "file" },
            { id: folderId + "-brief", name: name + " brief.pdf", type: "file" },
          ],
      pagination: { hasMoreItems: false, limit: 25, offset: 0, totalCount: atRoot ? 5 : 2 },
    };
  },
};`;

const EXPLORER_STEP2 = `${EXPLORER_STEP0}

// Create the explorer and add it to the page.
const explorer = document.createElement("box-content-explorer");

${MOCK_TRANSPORT}

// Give the explorer its data source and the session it should open.
explorer.transport = transport;
explorer.setAttribute("root-folder-id", "0");
explorer.setAttribute("token", "developer-token");

document.getElementById("app").append(explorer);`;

const EXPLORER_STEP3 = `${EXPLORER_STEP2}

// The explorer already navigates folders and breadcrumbs on its own. Listen
// to folder-loaded to mirror the current folder into your own UI once its
// data (and real name) has arrived.
const here = document.createElement("p");
document.getElementById("app").prepend(here);
explorer.addEventListener("folder-loaded", event => {
  here.textContent = "You are in: " + event.detail.folder.name;
});`;

const EXPLORER_STEP4 = `${EXPLORER_STEP3}

// React to what the user picks. selection-changed fires on highlight;
// item-activated fires on open (double-click / Enter). Mirror both into
// a visible status line so your host UI stays in sync.
const status = document.createElement("p");
document.getElementById("app").prepend(status);
status.textContent = "Selected: none";
explorer.addEventListener("selection-changed", event => {
  const ids = event.detail.selectedItemIds;
  status.textContent = ids.length
    ? "Selected: " + ids.length + " item" + (ids.length === 1 ? "" : "s")
    : "Selected: none";
});
explorer.addEventListener("item-activated", event => {
  status.textContent = "Opened: " + event.detail.item.name;
});`;

const EXPLORER_STEP5 = `${EXPLORER_STEP4}

// Production-leaning touch: allow multi-select and a larger page size.
explorer.setAttribute("selection-mode", "multiple");
explorer.setAttribute("page-size", "50");`;

export const explorerLesson: Lesson = {
  id: "explorer",
  title: "Explorer",
  area: "Build Alongs",
  outcome:
    "Embed a working Box content explorer — browse folders, follow breadcrumbs, and react to selection — in under 15 minutes.",
  why: "The content explorer is the front door of most Box experiences. Getting one embedded and reacting to user input is the fastest way to feel how the library's elements, transports, and events fit together — and everything you learn here carries into preview, share, and upload.",
  outcomePreview: "multiselect",
  wrapup:
    "You have an embedded content explorer that browses folders, follows breadcrumbs, and reports selection and activation to your app. Next: wire the same events into a preview surface, continue with the Share build-along, or point the transport at a real Box enterprise with packages/box-server.",
  starterHtml: starterHtml("Box Explorer — build along", "The explorer mounts here."),
  install:
    "Save index.html and app.js together and serve the folder with any static server (e.g. `npx serve`), then open index.html. The import map pulls box-open-elements from a CDN, so there is nothing to install and no build step; no Box account is needed — the lesson uses the mock transport above.",
  steps: [
    {
      n: 0,
      title: "Setup",
      goal: "Get a blank, running app with the Box design system registered.",
      file: "app.js",
      anchor: "the whole starter — index.html plus app.js",
      code: EXPLORER_STEP0,
      why: "Registering the design system applies the token custom properties every element reads, and defining the element teaches the browser the <box-content-explorer> tag before you use it.",
      result: "On the live site the lesson is already running — nothing to install. Locally: an empty page with the Box tokens applied.",
      preview: "empty",
    },
    {
      n: 1,
      title: "Render the shell",
      goal: "Put the explorer element on the page.",
      file: "app.js",
      anchor: "after defineBoxContentExplorerElement()",
      code: EXPLORER_STEP1,
      why: "The element renders its own shell immediately; with no transport or session yet it shows an empty, un-connected state — proof the custom element is alive.",
      result: "The explorer chrome appears, empty — no data loaded yet.",
      preview: "shell",
    },
    {
      n: 2,
      title: "Connect the session",
      goal: "Give the explorer a data source and a folder to open.",
      file: "app.js",
      anchor: "between creating the element and appending it",
      code: EXPLORER_STEP2,
      why: "The explorer stays inert until it has all three of transport, root-folder-id, and token; supply them and it calls loadFolderItems and renders the returned folder.",
      result: "Folders and files load: Marketing, Legal, Quarterly Plan.pdf, and more.",
      preview: "connected",
    },
    {
      n: 3,
      title: "Follow navigation",
      goal: "Mirror the current folder into your own UI as the user navigates.",
      file: "app.js",
      anchor: "after appending the explorer",
      code: EXPLORER_STEP3,
      why: "Folder clicks and breadcrumb jumps are built in; folder-loaded fires after each folder's data arrives with the resolved folder, so one listener keeps your own label in sync (folder-changed fires first with just the id, for optimistic UI).",
      result: "Open Marketing and a 'You are in: Marketing' line updates once it loads; the breadcrumb walks you back.",
      preview: "navigate",
    },
    {
      n: 4,
      title: "React to selection",
      goal: "Respond when the user highlights or opens an item.",
      file: "app.js",
      anchor: "after the folder-loaded listener",
      code: EXPLORER_STEP4,
      why: "selection-changed and item-activated are plain DOM CustomEvents carrying the selected ids and the activated item, so your app reacts without reaching inside the explorer.",
      result: "Selecting a row updates 'Selected: N items'; opening a file shows 'Opened: …' and both events land in the Events panel.",
      preview: "select",
    },
    {
      n: 5,
      title: "Make it production-leaning",
      goal: "Turn on multi-select and a larger page size.",
      file: "app.js",
      anchor: "at the end of app.js",
      code: EXPLORER_STEP5,
      why: "selection-mode and page-size are observed attributes, so setting them reconfigures the live explorer in place — no re-creation needed.",
      result: "Shift/Cmd-click several rows — the status line counts the selection, and page-size allows more items per load.",
      preview: "multiselect",
    },
  ],
};

// ── Share lesson source, built up cumulatively ───────────────────────────────

const SHARE_STEP0 = `import {
  registerBoxDefaultDesignSystem,
  applyDesignTokens,
  defineBoxSharePanelElement,
} from "box-open-elements";

// Register the Box design system and paint its tokens onto the page.
registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");

// Teach the browser about the <box-share-panel> element.
defineBoxSharePanelElement();`;

const SHARE_STEP1 = `${SHARE_STEP0}

// Create the share panel and add it to the page.
const panel = document.createElement("box-share-panel");
panel.setAttribute("heading", "Share Quarterly Plan.pdf");
document.getElementById("app").append(panel);`;

const SHARE_STEP2 = `${SHARE_STEP0}

// Create the share panel and add it to the page.
const panel = document.createElement("box-share-panel");
panel.setAttribute("heading", "Share Quarterly Plan.pdf");

// Shared-link is a JSON property: url + access, plus optional label/status.
panel.sharedLink = {
  url: "https://box.com/s/example",
  access: "company",
  label: "Company link",
  status: "Active",
};

document.getElementById("app").append(panel);`;

const SHARE_STEP3 = `${SHARE_STEP2}

// People with access render from a collaborators array (name + role required).
panel.collaborators = [
  { name: "Morgan Lee", role: "Editor" },
  { name: "Alex Kim", role: "Viewer" },
];`;

const SHARE_STEP4 = `${SHARE_STEP3}

// Message is plain text; settings are label/value rows under the link.
panel.setAttribute("message", "Anyone in the company with the link can view.");
panel.settings = [
  { label: "Downloads", value: "Allowed" },
  { label: "Expiration", value: "Jun 1, 2027" },
];`;

const SHARE_STEP5 = `${SHARE_STEP4}

// Actions are buttons the host owns; listen for action + collaborator-selected.
panel.actions = [
  { id: "copy", label: "Copy link" },
  { id: "invite", label: "Invite people", tone: "primary" },
];
panel.addEventListener("action", event => {
  console.log("action", event.detail.action);
});
panel.addEventListener("collaborator-selected", event => {
  console.log("collaborator", event.detail.name);
});`;

export const shareLesson: Lesson = {
  id: "share",
  title: "Share",
  area: "Build Alongs",
  outcome:
    "Embed a working share panel — shared link, people with access, settings, and actions — in under 15 minutes.",
  why: "Share is the workflow users hit right after they find a file. Wiring the panel with real JSON props and listening for action events is the fastest way to see how pattern surfaces stay host-driven — no transport required for this lesson.",
  outcomePreview: "share-actions",
  wrapup:
    "You have a share panel that shows the shared link, people with access, link settings, and actions — and reports action and collaborator-selected events to your app. Next: continue with the Preview build-along, open invite from the invite action, or feed this panel from explorer selection events.",
  starterHtml: starterHtml("Box Share — build along", "The share panel mounts here."),
  install:
    "Save index.html and app.js together and serve the folder with any static server (e.g. `npx serve`), then open index.html. The import map pulls box-open-elements from a CDN, so there is nothing to install and no build step; no Box account is needed — the lesson wires properties and events only.",
  steps: [
    {
      n: 0,
      title: "Setup",
      goal: "Get a blank, running app with the Box design system registered.",
      file: "app.js",
      anchor: "the whole starter — index.html plus app.js",
      code: SHARE_STEP0,
      why: "Registering the design system applies the token custom properties every element reads, and defining the element teaches the browser the <box-share-panel> tag before you use it.",
      result: "On the live site the lesson is already running — nothing to install. Locally: an empty page with the Box tokens applied.",
      preview: "empty",
    },
    {
      n: 1,
      title: "Render the shell",
      goal: "Put the share panel on the page with a heading.",
      file: "app.js",
      anchor: "after defineBoxSharePanelElement()",
      code: SHARE_STEP1,
      why: "The element renders its panel chrome from observed attributes; with only a heading it shows an empty share shell — proof the custom element is alive.",
      result: "The share panel heading appears; no link, people, or actions yet.",
      preview: "share-shell",
    },
    {
      n: 2,
      title: "Add the shared link",
      goal: "Show the company link the user can copy.",
      file: "app.js",
      anchor: "between creating the panel and appending it",
      code: SHARE_STEP2,
      why: "sharedLink is a JSON-backed property (also the shared-link attribute); the panel paints url, access, label, and status without a host template.",
      result: "A company shared link appears with its access badge and status.",
      preview: "share-link",
    },
    {
      n: 3,
      title: "List people with access",
      goal: "Render collaborators already on the item.",
      file: "app.js",
      anchor: "after setting sharedLink",
      code: SHARE_STEP3,
      why: "collaborators is a JSON array of name/role objects; the panel lists them and emits collaborator-selected when one is chosen.",
      result: "Morgan Lee (Editor) and Alex Kim (Viewer) appear under people with access.",
      preview: "share-people",
    },
    {
      n: 4,
      title: "Explain the link settings",
      goal: "Add a message and the download / expiration rows.",
      file: "app.js",
      anchor: "after setting collaborators",
      code: SHARE_STEP4,
      why: "message is a plain attribute; settings is a JSON array of label/value rows the panel renders under the shared link.",
      result: "Supporting copy appears, plus Downloads and Expiration rows.",
      preview: "share-settings",
    },
    {
      n: 5,
      title: "Wire actions and events",
      goal: "Add host-owned buttons and listen for what the user chooses.",
      file: "app.js",
      anchor: "at the end of app.js",
      code: SHARE_STEP5,
      why: "actions are host-defined buttons; action and collaborator-selected are plain DOM CustomEvents, so your app reacts without reaching inside the panel.",
      result: "Copy link and Invite people appear; clicks log to the Events panel (and the console).",
      preview: "share-actions",
    },
  ],
};

// ── Preview lesson source, built up cumulatively ─────────────────────────────

const PREVIEW_STEP0 = `import {
  registerBoxDefaultDesignSystem,
  applyDesignTokens,
  defineBoxPreviewElement,
} from "box-open-elements";

// Register the Box design system and paint its tokens onto the page.
registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");

// Teach the browser about the <box-preview-element> element.
defineBoxPreviewElement();`;

const PREVIEW_STEP1 = `${PREVIEW_STEP0}

// Create the preview shell and add it to the page.
const preview = document.createElement("box-preview-element");
preview.setAttribute("heading", "Quarterly Plan.pdf");
document.getElementById("app").append(preview);`;

const PREVIEW_STEP2 = `${PREVIEW_STEP0}

// Create the preview shell and add it to the page.
const preview = document.createElement("box-preview-element");
preview.setAttribute("heading", "Quarterly Plan.pdf");

// Item chrome: label, status, and a short host message.
preview.setAttribute("item-label", "PDF · 2.4 MB");
preview.setAttribute("status", "Ready");
preview.setAttribute("message", "Rendered by the active preview provider.");

document.getElementById("app").append(preview);`;

const PREVIEW_STEP3 = `${PREVIEW_STEP2}

// Provider metadata is JSON — id/label plus optional engine/status.
preview.provider = {
  id: "content-preview",
  label: "Box Content Preview",
  engine: "pdf.js",
  status: "ready",
};`;

const PREVIEW_STEP4 = `${PREVIEW_STEP3}

// Adapter state mirrors what a real provider adapter would publish.
preview.adapterState = {
  ready: true,
  pageLabel: "Page 2 of 34",
  zoomLabel: "100%",
};`;

const PREVIEW_STEP5 = `${PREVIEW_STEP4}

// Host-owned actions; listen for action (and provider-action with context).
preview.actions = [
  { id: "open-provider", label: "Open provider", tone: "primary" },
  { id: "download", label: "Download" },
];
preview.addEventListener("action", event => {
  console.log("action", event.detail.action);
});
preview.addEventListener("provider-action", event => {
  console.log("provider-action", event.detail.action, event.detail.providerId);
});`;

export const previewLesson: Lesson = {
  id: "preview",
  title: "Preview",
  area: "Build Alongs",
  outcome:
    "Embed a working content preview shell — item chrome, provider metadata, adapter state, and actions — in under 15 minutes.",
  why: "Preview is where users open a file after they find it. Wiring the preview element with provider JSON and adapter state shows how the pattern stays provider-neutral — the host owns chrome and events; a real adapter can replace the static props later.",
  outcomePreview: "preview-actions",
  wrapup:
    "You have a preview shell that shows item chrome, provider metadata, adapter page/zoom state, and host actions — and reports action and provider-action events to your app. Next: slot a real toolbar/stage, or wire selection from the Explorer build-along into this heading.",
  starterHtml: starterHtml("Box Preview — build along", "The preview element mounts here."),
  install:
    "Save index.html and app.js together and serve the folder with any static server (e.g. `npx serve`), then open index.html. The import map pulls box-open-elements from a CDN, so there is nothing to install and no build step; no Box account is needed — the lesson wires properties and events only.",
  steps: [
    {
      n: 0,
      title: "Setup",
      goal: "Get a blank, running app with the Box design system registered.",
      file: "app.js",
      anchor: "the whole starter — index.html plus app.js",
      code: PREVIEW_STEP0,
      why: "Registering the design system applies the token custom properties every element reads, and defining the element teaches the browser the <box-preview-element> tag before you use it.",
      result: "On the live site the lesson is already running — nothing to install. Locally: an empty page with the Box tokens applied.",
      preview: "empty",
    },
    {
      n: 1,
      title: "Render the shell",
      goal: "Put the preview element on the page with a heading.",
      file: "app.js",
      anchor: "after defineBoxPreviewElement()",
      code: PREVIEW_STEP1,
      why: "The element renders its workspace chrome from observed attributes; with only a heading it shows an empty preview shell — proof the custom element is alive.",
      result: "The preview heading appears; no provider, page state, or actions yet.",
      preview: "preview-shell",
    },
    {
      n: 2,
      title: "Describe the item",
      goal: "Add the file label, status, and host message.",
      file: "app.js",
      anchor: "between creating the preview and appending it",
      code: PREVIEW_STEP2,
      why: "item-label, status, and message are plain attributes the shell paints into its header — no provider required yet.",
      result: "PDF · 2.4 MB, Ready, and the host message appear under the heading.",
      preview: "preview-meta",
    },
    {
      n: 3,
      title: "Name the provider",
      goal: "Show which preview engine is active.",
      file: "app.js",
      anchor: "after setting message",
      code: PREVIEW_STEP3,
      why: "provider is a JSON-backed property (also the provider attribute); the shell paints label/engine/status without importing a concrete viewer.",
      result: "Box Content Preview / pdf.js appears as the active provider.",
      preview: "preview-provider",
    },
    {
      n: 4,
      title: "Mirror adapter state",
      goal: "Show page and zoom labels from the adapter.",
      file: "app.js",
      anchor: "after setting provider",
      code: PREVIEW_STEP4,
      why: "adapterState is JSON the host (or a providerAdapter) publishes; the shell stays provider-neutral while still showing live page/zoom chrome.",
      result: "Page 2 of 34 and 100% appear in the preview chrome.",
      preview: "preview-adapter",
    },
    {
      n: 5,
      title: "Wire actions and events",
      goal: "Add host-owned buttons and listen for what the user chooses.",
      file: "app.js",
      anchor: "at the end of app.js",
      code: PREVIEW_STEP5,
      why: "actions are host-defined buttons; action and provider-action are plain DOM CustomEvents (provider-action includes provider context), so your app reacts without reaching inside the shell.",
      result: "Open provider and Download appear; clicks log to the Events panel (and the console).",
      preview: "preview-actions",
    },
  ],
};

export const lessons: Lesson[] = [explorerLesson, shareLesson, previewLesson];

export const lessonById = (id: string): Lesson | undefined => lessons.find(lesson => lesson.id === id);
