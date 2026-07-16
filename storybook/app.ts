import * as lib from "box-open-elements";
import type { ExtractedStory, StoryModule } from "./metadata.js";
import workshopData from "./generated/workshop.json" with { type: "json" };
import { storyModules } from "./registry.js";

// ── Bootstrap: Box design systems + every custom element ────────────────────
lib.registerBoxDefaultDesignSystem();
lib.registerBoxDarkDesignSystem();
for (const [name, value] of Object.entries(lib)) {
  if (/^defineBox[A-Za-z]+Element$/.test(name) && typeof value === "function") {
    (value as () => void)();
  }
}

const stories = (workshopData as { stories: ExtractedStory[] }).stories;
const liveById = new Map<string, StoryModule>(storyModules.map(module => [module.meta.id, module]));

const applyTheme = (theme: "light" | "dark"): void => {
  const system = theme === "dark" ? "box-dark" : "box-default";
  lib.setActiveDesignSystem(system);
  lib.applyDesignTokens(document.documentElement, system);
  document.documentElement.dataset.theme = theme;
  const toggle = document.getElementById("theme-toggle");
  toggle?.setAttribute("aria-pressed", String(theme === "dark"));
  if (toggle) toggle.textContent = theme === "dark" ? "Light" : "Dark";
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

let activeId = stories[0]?.id ?? "";
const variantCleanups: Array<() => void> = [];

const renderNav = (): void => {
  const nav = document.getElementById("nav");
  if (!nav) return;
  const groups = new Map<string, ExtractedStory[]>();
  for (const story of stories) {
    const list = groups.get(story.category) ?? [];
    list.push(story);
    groups.set(story.category, list);
  }
  nav.innerHTML = Array.from(groups.entries())
    .map(
      ([category, group]) => `
        <div class="nav-group">
          <p class="nav-label">${escapeHtml(category)}</p>
          ${group
            .map(
              story => `<button type="button" class="nav-item" data-id="${escapeHtml(story.id)}" aria-current="${story.id === activeId}">${escapeHtml(story.title.split("/").pop() ?? story.id)}</button>`,
            )
            .join("")}
        </div>`,
    )
    .join("");
  nav.querySelectorAll<HTMLButtonElement>(".nav-item").forEach(button => {
    button.addEventListener("click", () => {
      activeId = button.dataset.id ?? activeId;
      renderNav();
      renderStage();
      // renderNav() rebuilds the buttons, so restore focus to the active one
      // to keep keyboard navigation from falling back to <body>.
      nav.querySelector<HTMLButtonElement>(`.nav-item[data-id="${activeId}"]`)?.focus();
    });
  });
};

const renderStage = (): void => {
  const stage = document.getElementById("stage");
  const story = stories.find(entry => entry.id === activeId);
  if (!stage || !story) return;

  while (variantCleanups.length) {
    variantCleanups.pop()?.();
  }

  const live = liveById.get(story.id);
  const variants = story.variants
    .map(
      variant => `
        <figure class="variant">
          <div class="variant-canvas">${variant.html}</div>
          <figcaption>${escapeHtml(variant.name)}${variant.note ? ` — <span class="variant-note">${escapeHtml(variant.note)}</span>` : ""}</figcaption>
        </figure>`,
    )
    .join("");

  const rows = story.referenceRows
    .map(
      row => `
        <tr>
          <td><code>${escapeHtml(row.name)}</code></td>
          <td>${escapeHtml(row.kind)}</td>
          <td>${row.type ? `<code>${escapeHtml(row.type)}</code>` : "—"}</td>
          <td>${escapeHtml(row.description)}</td>
        </tr>`,
    )
    .join("");

  stage.innerHTML = `
    <header class="stage-head">
      <h1>${escapeHtml(story.title.split("/").pop() ?? story.id)}</h1>
      <code class="tag">&lt;${escapeHtml(story.tag)}&gt;</code>
    </header>
    <p class="lead">${escapeHtml(story.docsDescription)}</p>
    <pre class="snippet"><code>${escapeHtml(story.sourceSnippet)}</code></pre>
    <h2>States</h2>
    <div class="variant-grid">${variants}</div>
    <h2>Reference</h2>
    <table class="ref"><thead><tr><th>Name</th><th>Kind</th><th>Type</th><th>Description</th></tr></thead><tbody>${rows}</tbody></table>
  `;

  // Run live setup() from authored story modules when present (not extracted).
  if (live) {
    const canvases = stage.querySelectorAll<HTMLElement>(".variant-canvas");
    live.variants.forEach((variant, index) => {
      const canvas = canvases[index];
      if (!canvas || !variant.setup) return;
      const cleanup = variant.setup(canvas);
      if (typeof cleanup === "function") {
        variantCleanups.push(cleanup);
      }
    });
  }
};

const storedTheme = (localStorage.getItem("boe-workshop-theme") as "light" | "dark" | null) ?? "light";
applyTheme(storedTheme);
document.getElementById("theme-toggle")?.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("boe-workshop-theme", next);
  applyTheme(next);
});

renderNav();
renderStage();
