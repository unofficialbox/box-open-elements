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
  | "navigate" // + folder-changed listener updating a "you are here" line
  | "select" // + selection-changed / item-activated listeners
  | "multiselect"; // + multi-select production option

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
  /** The static entry HTML, shared across every step. */
  starterHtml: string;
  /** Install + run notes for the secondary local path. */
  install: string;
  steps: LessonStep[];
}

// ── Explorer lesson source, built up cumulatively ────────────────────────────

const STARTER_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Box Explorer — build along</title>
    <!-- Resolve the package name to the published library. An import map keeps
         the starter dependency-free and runnable from any static server; a
         bundler would do the same resolution in a real project. -->
    <script type="importmap">
      { "imports": { "box-open-elements": "https://esm.sh/box-open-elements@0.1.0" } }
    </script>
  </head>
  <body>
    <!-- The explorer mounts here. -->
    <div id="app"></div>
    <script type="module" src="./app.js"></script>
  </body>
</html>`;

// Lesson code is plain browser JavaScript (no build step) so the copied
// starter runs from a static server as-is.
const STEP0 = `import {
  registerBoxDefaultDesignSystem,
  applyDesignTokens,
  defineBoxContentExplorerElement,
} from "box-open-elements";

// Register the Box design system and paint its tokens onto the page.
registerBoxDefaultDesignSystem({ setActive: true });
applyDesignTokens(document.documentElement, "box-default");

// Teach the browser about the <box-content-explorer> element.
defineBoxContentExplorerElement();`;

const STEP1 = `${STEP0}

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

const STEP2 = `${STEP0}

// Create the explorer and add it to the page.
const explorer = document.createElement("box-content-explorer");

${MOCK_TRANSPORT}

// Give the explorer its data source and the session it should open.
explorer.transport = transport;
explorer.setAttribute("root-folder-id", "0");
explorer.setAttribute("token", "developer-token");

document.getElementById("app").append(explorer);`;

const STEP3 = `${STEP2}

// The explorer already navigates folders and breadcrumbs on its own. Listen
// to folder-loaded to mirror the current folder into your own UI once its
// data (and real name) has arrived.
const here = document.createElement("p");
document.getElementById("app").prepend(here);
explorer.addEventListener("folder-loaded", event => {
  here.textContent = "You are in: " + event.detail.folder.name;
});`;

const STEP4 = `${STEP3}

// React to what the user picks. selection-changed fires on highlight;
// item-activated fires on open (double-click / Enter).
explorer.addEventListener("selection-changed", event => {
  console.log("selected", event.detail.selectedItemIds);
});
explorer.addEventListener("item-activated", event => {
  console.log("opened", event.detail.item.name);
});`;

const STEP5 = `${STEP4}

// Production-leaning touch: allow multi-select and a larger page size.
explorer.setAttribute("selection-mode", "multiple");
explorer.setAttribute("page-size", "50");`;

export const explorerLesson: Lesson = {
  id: "explorer",
  title: "Explorer",
  area: "Build Alongs",
  outcome: "Embed a working Box content explorer — browse folders, follow breadcrumbs, and react to selection — in under 15 minutes.",
  why: "The content explorer is the front door of most Box experiences. Getting one embedded and reacting to user input is the fastest way to feel how the library's elements, transports, and events fit together — and everything you learn here carries into preview, share, and upload.",
  starterHtml: STARTER_HTML,
  install: "Save index.html and app.js together and serve the folder with any static server (e.g. `npx serve`), then open index.html. The import map pulls box-open-elements from a CDN, so there is nothing to install and no build step; no Box account is needed — the lesson uses the mock transport above.",
  steps: [
    {
      n: 0,
      title: "Setup",
      goal: "Get a blank, running app with the Box design system registered.",
      file: "app.js",
      anchor: "the whole starter — index.html plus app.js",
      code: STEP0,
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
      code: STEP1,
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
      code: STEP2,
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
      code: STEP3,
      why: "Folder clicks and breadcrumb jumps are built in; folder-loaded fires after each folder's data arrives with the resolved folder, so one listener keeps your own label in sync (folder-changed fires first with just the id, for optimistic UI).",
      result: "Open Marketing and a 'You are in: Marketing' line updates once it loads; the breadcrumb walks you back.",
      preview: "navigate",
    },
    {
      n: 4,
      title: "React to selection",
      goal: "Respond when the user highlights or opens an item.",
      file: "app.js",
      anchor: "after the folder-changed listener",
      code: STEP4,
      why: "selection-changed and item-activated are plain DOM CustomEvents carrying the selected ids and the activated item, so your app reacts without reaching inside the explorer.",
      result: "Selecting a row and opening a file log to the Events panel (and the console).",
      preview: "select",
    },
    {
      n: 5,
      title: "Make it production-leaning",
      goal: "Turn on multi-select and a larger page size.",
      file: "app.js",
      anchor: "at the end of app.js",
      code: STEP5,
      why: "selection-mode and page-size are observed attributes, so setting them reconfigures the live explorer in place — no re-creation needed.",
      result: "You can now select several items at once, and more load per page.",
      preview: "multiselect",
    },
  ],
};

export const lessons: Lesson[] = [explorerLesson];

export const lessonById = (id: string): Lesson | undefined => lessons.find(lesson => lesson.id === id);
