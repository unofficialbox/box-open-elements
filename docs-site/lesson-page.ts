/**
 * Browser renderer for build-along lessons.
 *
 * Turns the pure data in `lessons.ts` into a live, build-it-yourself page:
 * an outcome preview visible early, a Setup step, teaching-step cards (file
 * anchor + full-source-with-highlighted-delta + copy-whole-file + a live
 * result + "why it works" + checkpoint), a shared Events panel fed by the
 * real pattern events, and a "build it in your own project" section with
 * the complete runnable source. The live previews run against the already-
 * loaded library, exactly what the shown code produces in a consumer app.
 */
import { addedLines } from "./diff.js";
import { lessonMockTransport } from "./lesson-mock-transport.js";
import type { Lesson, LessonStep, PreviewKey } from "./lessons.js";

type ExplorerElement = HTMLElement & { transport: unknown };
type SharePanelElement = HTMLElement & {
  actions: Array<{ id: string; label: string; tone?: string }>;
  collaborators: Array<{ name: string; role: string }>;
  settings: Array<{ label: string; value: string }>;
  sharedLink: {
    url: string;
    access: string;
    label?: string;
    status?: string;
  } | null;
};
type ContentPreviewElement = HTMLElement & {
  actions: Array<{ id: string; label: string; tone?: string }>;
  adapterState: {
    ready?: boolean;
    pageLabel?: string;
    zoomLabel?: string;
  } | null;
  provider: {
    id: string;
    label: string;
    engine?: string;
    status?: string;
  } | null;
};
type LogFn = (name: string, detail: unknown) => void;

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

/** A code block: full source, delta lines highlighted, with a copy button. */
const codeBlock = (code: string, highlight: Set<number>, copyLabel: string): string => {
  const lines = code
    .split("\n")
    .map((line, index) => {
      const cls = highlight.has(index) ? "code-line is-added" : "code-line";
      return `<span class="${cls}">${escapeHtml(line) || "&nbsp;"}</span>`;
    })
    .join("");
  return `
    <div class="code-wrap">
      <button type="button" class="code-copy" data-copy="${escapeHtml(code)}">${escapeHtml(copyLabel)}</button>
      <pre class="code-block"><code>${lines}</code></pre>
    </div>`;
};

// ── Live previews ────────────────────────────────────────────────────────────

const mountExplorer = (canvas: HTMLElement, options: { multiple?: boolean; pageSize?: string } = {}): ExplorerElement => {
  const explorer = document.createElement("box-content-explorer") as ExplorerElement;
  explorer.transport = lessonMockTransport();
  explorer.setAttribute("root-folder-id", "0");
  explorer.setAttribute("token", "developer-token");
  if (options.multiple) explorer.setAttribute("selection-mode", "multiple");
  if (options.pageSize) explorer.setAttribute("page-size", options.pageSize);
  canvas.append(explorer);
  return explorer;
};

const mountSharePanel = (
  canvas: HTMLElement,
  options: {
    link?: boolean;
    people?: boolean;
    settings?: boolean;
    actions?: boolean;
  } = {},
): SharePanelElement => {
  const panel = document.createElement("box-share-panel") as SharePanelElement;
  panel.setAttribute("heading", "Share Quarterly Plan.pdf");
  if (options.link || options.people || options.settings || options.actions) {
    panel.sharedLink = {
      url: "https://box.com/s/example",
      access: "company",
      label: "Company link",
      status: "Active",
    };
  }
  if (options.people || options.settings || options.actions) {
    panel.collaborators = [
      { name: "Morgan Lee", role: "Editor" },
      { name: "Alex Kim", role: "Viewer" },
    ];
  }
  if (options.settings || options.actions) {
    panel.setAttribute("message", "Anyone in the company with the link can view.");
    panel.settings = [
      { label: "Downloads", value: "Allowed" },
      { label: "Expiration", value: "Jun 1, 2027" },
    ];
  }
  if (options.actions) {
    panel.actions = [
      { id: "copy", label: "Copy link" },
      { id: "invite", label: "Invite people", tone: "primary" },
    ];
  }
  canvas.append(panel);
  return panel;
};

const runExplorerPreview = (key: PreviewKey, canvas: HTMLElement, log: LogFn): (() => void) => {
  const cleanups: Array<() => void> = [];

  if (key === "shell") {
    const explorer = document.createElement("box-content-explorer");
    canvas.append(explorer);
    return () => explorer.remove();
  }

  const explorer = mountExplorer(canvas, {
    multiple: key === "multiselect",
    pageSize: key === "multiselect" ? "50" : undefined,
  });
  cleanups.push(() => explorer.remove());

  if (key === "navigate") {
    const here = document.createElement("p");
    here.className = "lesson-here";
    here.textContent = "You are in: All Files";
    canvas.prepend(here);
    const onFolder = (event: Event): void => {
      const folder = (event as CustomEvent).detail?.folder;
      if (folder) here.textContent = `You are in: ${folder.name}`;
      log("folder-loaded", (event as CustomEvent).detail);
    };
    explorer.addEventListener("folder-loaded", onFolder);
    cleanups.push(() => explorer.removeEventListener("folder-loaded", onFolder));
  }

  if (key === "select" || key === "multiselect") {
    const onSelect = (event: Event): void => log("selection-changed", (event as CustomEvent).detail);
    const onActivate = (event: Event): void => log("item-activated", (event as CustomEvent).detail);
    explorer.addEventListener("selection-changed", onSelect);
    explorer.addEventListener("item-activated", onActivate);
    cleanups.push(() => {
      explorer.removeEventListener("selection-changed", onSelect);
      explorer.removeEventListener("item-activated", onActivate);
    });
  }

  return () => cleanups.forEach(fn => fn());
};

const runSharePreview = (key: PreviewKey, canvas: HTMLElement, log: LogFn): (() => void) => {
  const cleanups: Array<() => void> = [];

  if (key === "share-shell") {
    const panel = mountSharePanel(canvas);
    cleanups.push(() => panel.remove());
    return () => cleanups.forEach(fn => fn());
  }

  const panel = mountSharePanel(canvas, {
    link: key === "share-link" || key === "share-people" || key === "share-settings" || key === "share-actions",
    people: key === "share-people" || key === "share-settings" || key === "share-actions",
    settings: key === "share-settings" || key === "share-actions",
    actions: key === "share-actions",
  });
  cleanups.push(() => panel.remove());

  if (key === "share-actions") {
    const onAction = (event: Event): void => log("action", (event as CustomEvent).detail);
    const onCollaborator = (event: Event): void => log("collaborator-selected", (event as CustomEvent).detail);
    panel.addEventListener("action", onAction);
    panel.addEventListener("collaborator-selected", onCollaborator);
    cleanups.push(() => {
      panel.removeEventListener("action", onAction);
      panel.removeEventListener("collaborator-selected", onCollaborator);
    });
  }

  return () => cleanups.forEach(fn => fn());
};

const mountContentPreview = (
  canvas: HTMLElement,
  options: {
    meta?: boolean;
    provider?: boolean;
    adapter?: boolean;
    actions?: boolean;
  } = {},
): ContentPreviewElement => {
  const preview = document.createElement("box-preview-element") as ContentPreviewElement;
  preview.setAttribute("heading", "Quarterly Plan.pdf");
  if (options.meta || options.provider || options.adapter || options.actions) {
    preview.setAttribute("item-label", "PDF · 2.4 MB");
    preview.setAttribute("status", "Ready");
    preview.setAttribute("message", "Rendered by the active preview provider.");
  }
  if (options.provider || options.adapter || options.actions) {
    preview.provider = {
      id: "content-preview",
      label: "Box Content Preview",
      engine: "pdf.js",
      status: "ready",
    };
  }
  if (options.adapter || options.actions) {
    preview.adapterState = {
      ready: true,
      pageLabel: "Page 2 of 34",
      zoomLabel: "100%",
    };
  }
  if (options.actions) {
    preview.actions = [
      { id: "open-provider", label: "Open provider", tone: "primary" },
      { id: "download", label: "Download" },
    ];
  }
  canvas.append(preview);
  return preview;
};

const runContentPreview = (key: PreviewKey, canvas: HTMLElement, log: LogFn): (() => void) => {
  const cleanups: Array<() => void> = [];

  if (key === "preview-shell") {
    const preview = mountContentPreview(canvas);
    cleanups.push(() => preview.remove());
    return () => cleanups.forEach(fn => fn());
  }

  const preview = mountContentPreview(canvas, {
    meta: key === "preview-meta" || key === "preview-provider" || key === "preview-adapter" || key === "preview-actions",
    provider: key === "preview-provider" || key === "preview-adapter" || key === "preview-actions",
    adapter: key === "preview-adapter" || key === "preview-actions",
    actions: key === "preview-actions",
  });
  cleanups.push(() => preview.remove());

  if (key === "preview-actions") {
    const onAction = (event: Event): void => log("action", (event as CustomEvent).detail);
    const onProviderAction = (event: Event): void => log("provider-action", (event as CustomEvent).detail);
    preview.addEventListener("action", onAction);
    preview.addEventListener("provider-action", onProviderAction);
    cleanups.push(() => {
      preview.removeEventListener("action", onAction);
      preview.removeEventListener("provider-action", onProviderAction);
    });
  }

  return () => cleanups.forEach(fn => fn());
};

/** Build the live result for a step. Returns a teardown. */
const runPreview = (key: PreviewKey, canvas: HTMLElement, log: LogFn): (() => void) => {
  canvas.innerHTML = "";

  if (key === "empty") {
    const note = document.createElement("p");
    note.className = "preview-note";
    note.textContent = "Empty app — Box tokens applied, nothing mounted yet.";
    canvas.append(note);
    return () => {};
  }

  if (key.startsWith("share-")) {
    return runSharePreview(key, canvas, log);
  }

  if (key.startsWith("preview-")) {
    return runContentPreview(key, canvas, log);
  }

  return runExplorerPreview(key, canvas, log);
};

// ── Page ─────────────────────────────────────────────────────────────────────

export const renderLessonPage = (lesson: Lesson, stageBody: HTMLElement, breadcrumb: HTMLElement): (() => void) => {
  breadcrumb.innerHTML = `Patterns / ${escapeHtml(lesson.area)} / <b>${escapeHtml(lesson.title)}</b>`;

  const finalCode = lesson.steps[lesson.steps.length - 1].code;

  const stepCard = (step: LessonStep, prevCode: string): string => {
    const highlight = addedLines(prevCode, step.code);
    const isSetup = step.n === 0;
    return `
      <section class="lesson-step" aria-labelledby="step-${step.n}">
        <header class="lesson-step-head">
          <span class="lesson-step-n">${isSetup ? "Setup" : `Step ${step.n}`}</span>
          <h2 id="step-${step.n}">${escapeHtml(step.title)}</h2>
        </header>
        <p class="lesson-goal">${escapeHtml(step.goal)}</p>
        <p class="lesson-anchor"><span class="lesson-file">${escapeHtml(step.file)}</span> — ${escapeHtml(step.anchor)}</p>
        ${codeBlock(step.code, highlight, isSetup ? "Copy app.js" : "Copy full file (checkpoint)")}
        <div class="lesson-result">
          <p class="section-label">Result</p>
          <div class="preview-canvas lesson-canvas" data-preview="${step.preview}"></div>
          <p class="lesson-result-text">${escapeHtml(step.result)}</p>
        </div>
        <p class="lesson-why"><strong>Why it works:</strong> ${escapeHtml(step.why)}</p>
      </section>`;
  };

  let prev = "";
  const stepsHtml = lesson.steps
    .map(step => {
      const html = stepCard(step, prev);
      prev = step.code;
      return html;
    })
    .join("");

  stageBody.innerHTML = `
    <div class="lesson">
      <span class="page-tag">Build Along</span>
      <h1 class="page-title">${escapeHtml(lesson.title)}</h1>
      <p class="lesson-outcome">${escapeHtml(lesson.outcome)}</p>

      <div class="lesson-outcome-preview">
        <p class="section-label">What you're building</p>
        <div class="preview-canvas lesson-canvas" data-preview="${escapeHtml(lesson.outcomePreview)}" id="lesson-outcome-canvas"></div>
      </div>

      <p class="lesson-lead prose">${escapeHtml(lesson.why)}</p>

      <div class="lesson-layout">
        <div class="lesson-steps">
          ${stepsHtml}

          <section class="lesson-step lesson-wrapup">
            <header class="lesson-step-head">
              <span class="lesson-step-n">Wrap-up</span>
              <h2>What works now</h2>
            </header>
            <p>${escapeHtml(lesson.wrapup)}</p>
          </section>

          <section class="lesson-own">
            <p class="section-label">Build it in your own project</p>
            <p>The live lesson above needs nothing installed. To build it locally, drop these two files together and run them — same code, run against the published package.</p>
            <p class="lesson-anchor"><span class="lesson-file">index.html</span></p>
            ${codeBlock(lesson.starterHtml, new Set<number>(), "Copy index.html")}
            <p class="lesson-anchor"><span class="lesson-file">app.js</span> — the complete lesson</p>
            ${codeBlock(finalCode, new Set<number>(), "Copy app.js")}
            <p class="prose"><strong>Run it:</strong> ${escapeHtml(lesson.install)}</p>
          </section>
        </div>

        <aside class="inspector lesson-inspector">
          <div class="inspector-panel">
            <h3>Events <span class="count" id="lesson-event-count">0</span></h3>
            <div class="inspector-list" id="lesson-event-list"><span class="inspector-empty">Interact with a Result above — selection, navigation, and share events land here.</span></div>
          </div>
        </aside>
      </div>
    </div>`;

  // Shared Events panel.
  const eventList = stageBody.querySelector<HTMLElement>("#lesson-event-list")!;
  const eventCount = stageBody.querySelector<HTMLElement>("#lesson-event-count")!;
  let seen = 0;
  const log: LogFn = (name, detail) => {
    seen += 1;
    eventCount.textContent = String(seen);
    if (seen === 1) eventList.innerHTML = "";
    let detailText = "";
    try {
      detailText = JSON.stringify(detail) ?? "";
    } catch {
      detailText = String(detail);
    }
    const row = document.createElement("div");
    row.className = "event-row";
    row.innerHTML = `<span class="event-name">${escapeHtml(name)}</span><span class="event-detail">${escapeHtml(detailText.slice(0, 160))}</span>`;
    eventList.prepend(row);
    while (eventList.children.length > 30) eventList.lastElementChild?.remove();
  };

  // Live previews (outcome + every step).
  const teardowns: Array<() => void> = [];
  stageBody.querySelectorAll<HTMLElement>(".lesson-canvas").forEach(canvas => {
    const key = (canvas.dataset.preview ?? "empty") as PreviewKey;
    teardowns.push(runPreview(key, canvas, log));
  });

  // Copy buttons.
  const onCopy = (event: Event): void => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".code-copy");
    if (!button) return;
    void navigator.clipboard?.writeText(button.dataset.copy ?? "");
    const original = button.textContent;
    button.textContent = "Copied ✓";
    window.setTimeout(() => {
      button.textContent = original;
    }, 1200);
  };
  stageBody.addEventListener("click", onCopy);

  return () => {
    teardowns.forEach(fn => fn());
    stageBody.removeEventListener("click", onCopy);
  };
};
