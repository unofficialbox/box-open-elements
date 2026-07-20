import * as lib from "@unofficialbox/box-open-elements";
import { catalog, titleOf, type CatalogEntry } from "./registry.js";
import { examples } from "./examples.js";
import {
  renderBulletList,
  renderGuidanceCards,
  resolvePreviewGuidance,
} from "./guidance.js";
import { inspectPreviewTree } from "./preview-inspect.js";
import { lessons, lessonById } from "./lessons.js";
import { renderLessonPage } from "./lesson-page.js";
import { applyRailVersion } from "./rail-version.js";
import workshop from "../storybook/generated/workshop.json" with { type: "json" };
import accessibilityMd from "../docs/foundations/accessibility.md";
import brandMd from "../docs/foundations/brand.md";
import tokensMd from "../docs/foundations/tokens.md";
import iconographyMd from "../docs/foundations/iconography.md";
import themingMd from "../docs/foundations/theming.md";
import motionMd from "../docs/foundations/motion.md";
import geometryMd from "../docs/foundations/geometry.md";
import { renderMarkdown } from "./markdown.js";
import { highlightCode, normalizeLang } from "./highlight.js";

// Real, extracted variant states per component (storybook workshop → docs site).
// Only the components with authored stories have these; everything else keeps
// its single curated example. No invented placeholder variants.
type Variant = { name: string; html: string };
const variantsById: Record<string, Variant[]> = Object.fromEntries(
  workshop.stories.map(story => [story.id, story.variants]),
);

// ── Bootstrap: tokens + every custom element ────────────────────────────────

lib.registerBoxDefaultDesignSystem();
lib.registerBoxDarkDesignSystem();

for (const [name, value] of Object.entries(lib)) {
  if (/^defineBox[A-Za-z]+Element$/.test(name) && typeof value === "function") {
    (value as () => void)();
  }
}

// ── Theme: swap the active design system + retheme the site chrome ──────────

const applyTheme = (theme: "light" | "dark"): void => {
  const system = theme === "dark" ? "box-dark" : "box-default";
  lib.setActiveDesignSystem(system);
  lib.applyDesignTokens(document.documentElement, system);
  document.documentElement.dataset.theme = theme;
  // Every theme toggle (rail footer + masthead) reflects the same state.
  document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach(button => {
    button.setAttribute("aria-pressed", String(theme === "dark"));
    const label = button.querySelector<HTMLElement>("[data-theme-label]") ?? button;
    label.textContent = theme === "dark" ? "Light" : "Dark";
  });
};

const storedTheme = localStorage.getItem("boe-docs-theme");
applyTheme(storedTheme === "dark" ? "dark" : "light");

document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach(button => {
  button.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("boe-docs-theme", next);
    applyTheme(next);
  });
});

// ── Shared event vocabulary the Events panel listens for ────────────────────

const SHARED_EVENTS = [
  "value-changed", "open-changed", "checked-changed", "selected-changed",
  "action", "confirm", "cancel", "dismiss", "search", "clear", "toggle",
  "item-selected", "item-invoked", "item-activated", "provider-action",
  "filter-changed", "page-changed", "navigate", "select", "ratio-changed",
  "tool-selected", "color-selected", "point-selected",
];

// ── Foundations entries ──────────────────────────────────────────────────────

const FOUNDATION_PAGES = [
  { id: "tokens", label: "Design Tokens" },
  { id: "theming", label: "Theming" },
  { id: "geometry", label: "Geometry" },
  { id: "motion", label: "Motion" },
  { id: "icons", label: "Iconography" },
  { id: "accessibility", label: "Accessibility" },
  { id: "brand", label: "Brand" },
];

// Foundation docs rendered from their real markdown source (no invented copy).
const FOUNDATION_MD: Record<string, { title: string; md: string }> = {
  accessibility: { title: "Accessibility", md: accessibilityMd },
  brand: { title: "Brand", md: brandMd },
  theming: { title: "Theming", md: themingMd },
  geometry: { title: "Geometry", md: geometryMd },
  motion: { title: "Motion", md: motionMd },
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const toKebab = (value: string): string =>
  value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

// ── Framework code snippets (docs "Code" tab) ────────────────────────────────

type Framework = "html" | "react" | "angular" | "vue" | "svelte";

const FRAMEWORKS: Array<{ id: Framework; label: string }> = [
  { id: "html", label: "HTML" },
  { id: "react", label: "React" },
  { id: "angular", label: "Angular" },
  { id: "vue", label: "Vue" },
  { id: "svelte", label: "Svelte" },
];

/** `defineBox…Element` for a catalog id — matches the package's export names. */
const defineName = (id: string): string =>
  `defineBox${id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join("")}Element`;

/** The demo's representative root element, in self-closing and full forms. */
const representativeTag = (html: string, tag: string): { selfClose: string; full: string } => {
  const open = new RegExp(`<${tag}(?:\\s[^>]*)?>`).exec(html)?.[0] ?? `<${tag}>`;
  return { selfClose: open.replace(/\s*>$/, " />"), full: `${open}</${tag}>` };
};

/** A minimal copy-pasteable per-framework usage snippet for one component. */
const frameworkSnippet = (framework: Framework, id: string, tag: string, html: string): string => {
  if (framework === "html") return html;
  const { selfClose, full } = representativeTag(html, tag);
  const def = defineName(id);
  const imp = `import { ${def} } from "@unofficialbox/box-open-elements";\n${def}();`;
  switch (framework) {
    case "react":
      return `${imp}\n\nexport function Example() {\n  return ${selfClose};\n}`;
    case "angular":
      return `import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";\n${imp}\n\n@Component({\n  standalone: true,\n  schemas: [CUSTOM_ELEMENTS_SCHEMA],\n  template: \`${full}\`,\n})\nexport class Example {}`;
    case "vue":
      return `<script setup lang="ts">\n${imp}\n</script>\n\n<template>\n  ${full}\n</template>`;
    case "svelte":
      return `<script lang="ts">\n  ${imp}\n</script>\n\n${full}`;
  }
};

// ── State + routing ──────────────────────────────────────────────────────────

type Route = { tier: string; id: string };

const state: { tier: string; filter: string; route: Route } = {
  tier: "components",
  filter: "",
  route: { tier: "components", id: "button" },
};

// Build-time boot globals injected per prerendered page (docs-site/build.ts).
type BootWindow = Window & { __ROUTE__?: Route; __REL__?: string; __BUILT__?: boolean };

const parseHash = (): Route => {
  const raw = location.hash.replace(/^#/, "");
  // A prerendered per-page file carries its route as a global instead of a hash.
  if (!raw) {
    const boot = (window as BootWindow).__ROUTE__;
    if (boot) return boot;
    return { tier: "home", id: "home" };
  }
  if (raw === "home") return { tier: "home", id: "home" };
  const [tier, id] = raw.split("/");
  if (tier === "foundations" && FOUNDATION_PAGES.some(page => page.id === id)) return { tier, id };
  if (tier === "lessons" && lessonById(id)) return { tier, id };
  if ((tier === "components" || tier === "patterns") && catalog.some(entry => entry.tier === tier && entry.id === id)) {
    return { tier, id };
  }
  return { tier: "components", id: "button" };
};

const railTree = document.getElementById("rail-tree")!;
const railFilter = document.getElementById("rail-filter") as HTMLInputElement;
const stageBody = document.getElementById("stage-body")!;
const breadcrumb = document.getElementById("stage-breadcrumb")!;
let teardown: (() => void) | null = null;

// Persisted rail scroll — survives both the hash-routed re-render and the
// static build's full page navigation (per-component HTML files) within a tab.
const RAIL_SCROLL_KEY = "boe-rail-scroll";
let railScroll = Number(sessionStorage.getItem(RAIL_SCROLL_KEY)) || 0;
railTree.addEventListener("scroll", () => {
  railScroll = railTree.scrollTop;
  sessionStorage.setItem(RAIL_SCROLL_KEY, String(railScroll));
}, { passive: true });

// ── Rail ─────────────────────────────────────────────────────────────────────

const renderRail = (): void => {
  document.querySelectorAll<HTMLButtonElement>(".rail-tabs button").forEach(button => {
    button.setAttribute("aria-selected", String(button.dataset.tier === state.tier));
  });

  const filter = state.filter.trim().toLowerCase();
  railTree.innerHTML = "";

  const addGroup = (label: string, items: Array<{ id: string; label: string; tier: string }>): void => {
    const visible = items.filter(item => !filter || item.label.toLowerCase().includes(filter) || item.id.includes(filter));
    if (!visible.length) return;
    const section = document.createElement("section");
    const heading = document.createElement("h2");
    heading.className = "rail-group-label";
    heading.textContent = `${label} (${visible.length})`;
    const group = document.createElement("div");
    group.className = "rail-group";
    const rel = (window as BootWindow).__REL__ ?? "";
    const built = (window as BootWindow).__BUILT__ === true;
    for (const item of visible) {
      // Real <a> so crawlers follow the link graph. Lessons have no static file,
      // so they stay hash-routed; in the dev bundle everything is hash-routed.
      const hasStaticPage = built && item.tier !== "lessons";
      const link = document.createElement("a");
      link.className = "rail-item";
      link.textContent = item.label;
      link.href = hasStaticPage ? `${rel}${item.tier}/${item.id}/` : `#${item.tier}/${item.id}`;
      if (state.route.tier === item.tier && state.route.id === item.id) {
        link.setAttribute("aria-current", "page");
      }
      link.addEventListener("click", event => {
        if (!hasStaticPage) {
          event.preventDefault();
          location.hash = `#${item.tier}/${item.id}`;
        }
        // Otherwise let the browser navigate to the prerendered static page.
      });
      group.append(link);
    }
    section.append(heading, group);
    railTree.append(section);
  };

  if (state.tier === "foundations") {
    addGroup("Foundations", FOUNDATION_PAGES.map(page => ({ id: page.id, label: page.label, tier: "foundations" })));
  } else {
    const entries = catalog.filter(entry => entry.tier === state.tier);
    const categories = [...new Set(entries.map(entry => entry.category))];
    for (const category of categories) {
      addGroup(
        category,
        entries
          .filter(entry => entry.category === category)
          .map(entry => ({ id: entry.id, label: titleOf(entry.id), tier: entry.tier })),
      );
    }

    // Guided build-along lessons live in the Patterns tier as their own group.
    if (state.tier === "patterns" && lessons.length) {
      addGroup("Build Alongs", lessons.map(lesson => ({ id: lesson.id, label: lesson.title, tier: "lessons" })));
    }
  }

  // Rebuilding the tree resets its scroll; restore the last position so clicking
  // a rail item (which re-renders, and on the static build reloads the page)
  // doesn't jump the menu back to the top.
  railTree.scrollTop = railScroll;
};

// ── Component page ───────────────────────────────────────────────────────────

const renderComponentPage = (entry: CatalogEntry): void => {
  const example = examples[entry.id] ?? { html: `<${entry.tag} label="${titleOf(entry.id)}"></${entry.tag}>` };
  const exampleVariants = example.variants ?? [];
  const workshopVariants = variantsById[entry.id] ?? [];
  // Prefer live example variants (with setup) over extracted workshop HTML shells.
  // For single-surface pages, prefer the richer of curated example vs workshop Default
  // (bare curated tags are shorter; slotted/JSON demos win on either side).
  const useExampleVariants = exampleVariants.length >= 2;
  const variants = useExampleVariants
    ? exampleVariants.map(variant => ({ name: variant.name, html: variant.html, note: variant.note }))
    : workshopVariants;
  const hasVariants = variants.length >= 2;
  const workshopDefaultHtml = workshopVariants[0]?.html;
  const initialHtml = hasVariants
    ? variants[0].html
    : example.setup || !workshopDefaultHtml || example.html.length >= workshopDefaultHtml.length
      ? example.html
      : workshopDefaultHtml;
  const constructor = customElements.get(entry.tag) as (CustomElementConstructor & { observedAttributes?: string[] }) | undefined;
  const observed = constructor?.observedAttributes ?? [];

  breadcrumb.innerHTML = `${entry.tier === "components" ? "Components" : "Patterns"} / ${escapeHtml(entry.category)} / <b>${escapeHtml(titleOf(entry.id))}</b>`;

  stageBody.innerHTML = `
    <h1 class="page-title">${escapeHtml(titleOf(entry.id))}</h1>
    <span class="page-tag">&lt;${entry.tag}&gt;</span>
    <div class="stage-tabs" role="tablist">
      <button type="button" data-tab="preview" role="tab" aria-selected="true">Preview</button>
      <button type="button" data-tab="code" role="tab" aria-selected="false">Code</button>
      <button type="button" data-tab="api" role="tab" aria-selected="false">API</button>
      <button type="button" data-tab="accessibility" role="tab" aria-selected="false">Accessibility</button>
    </div>
    <div data-panel="preview">
      <div class="preview-layout">
        <div>
          <div class="preview-toolbar">
            ${hasVariants
              ? `<label class="variant-picker">Variant
                  <select id="variant-select" aria-label="Preview variant">
                    ${variants.map((variant, index) => `<option value="${index}">${escapeHtml(variant.name)}</option>`).join("")}
                  </select>
                </label>`
              : ""}
            <div class="size-group" role="group" aria-label="Preview width">
              <button type="button" class="size-button" data-size="full" aria-pressed="true" title="Full width">Full</button>
              <button type="button" class="size-button" data-size="tablet" aria-pressed="false" title="Tablet width (768px)">Tablet</button>
              <button type="button" class="size-button" data-size="mobile" aria-pressed="false" title="Mobile width (380px)">Mobile</button>
            </div>
          </div>
          <div class="preview-canvas" id="preview-canvas" data-preview-size="full"></div>
          <div id="guidance-section"></div>
          <div id="related-section"></div>
        </div>
        <aside class="inspector">
          <div class="inspector-panel">
            <h3>Events <span class="count" id="event-count">0</span></h3>
            <div class="inspector-list" id="event-list"><span class="inspector-empty">Interact with the preview — shared events land here.</span></div>
          </div>
          <div class="inspector-panel">
            <h3>Properties</h3>
            <div class="inspector-list" id="prop-list"><span class="inspector-empty">No reflected attributes yet.</span></div>
          </div>
        </aside>
      </div>
    </div>
    <div data-panel="code" hidden>
      <div class="code-tabs" role="tablist" aria-label="Framework">
        ${FRAMEWORKS.map(
          (framework, index) =>
            `<button type="button" class="code-tab" data-code="${framework.id}" role="tab" aria-selected="${index === 0}">${framework.label}</button>`,
        ).join("")}
      </div>
      <pre class="code-block"><code id="code-block">${highlightCode(initialHtml, "html")}</code></pre>
      <p class="preview-note code-frameworks-note">Snippets show a minimal use; the one-time setup (design tokens, Vue <code>isCustomElement</code>, React custom events) is in the <a href="https://github.com/unofficialbox/box-open-elements/blob/main/docs/integration/frameworks.md" target="_blank" rel="noreferrer">Frameworks guide</a>.</p>
      ${(() => {
        const note = useExampleVariants ? exampleVariants[0]?.note : example.note;
        return note ? `<p class="preview-note">${escapeHtml(note)}</p>` : `<p class="preview-note" hidden></p>`;
      })()}
    </div>
    <div data-panel="api" hidden>
      <p class="section-label">Attributes (observed)</p>
      <div id="api-attributes"></div>
      <p class="section-label">Styling hooks (parts)</p>
      <div id="api-parts"></div>
      <p class="section-label">Design tokens used</p>
      <div id="api-tokens"></div>
      <p class="preview-note">Components consume <code>--boe-token-*</code> with fallbacks; shells register or override themes. See
      <a href="https://github.com/unofficialbox/box-open-elements/blob/main/docs/foundations/tokens.md#token-consumption-vs-shell--consumer-overrides" target="_blank" rel="noreferrer">token consumption vs shell</a>.</p>
    </div>
    <div data-panel="accessibility" hidden>
      <div class="prose">
        <p class="section-label">Roles detected in this preview</p>
        <div id="a11y-roles"></div>
        <p class="section-label">Keyboard for these roles</p>
        <div id="a11y-keyboard"></div>
        <p>Shared keyboard and ARIA conventions for the whole system live in
        <a href="https://github.com/unofficialbox/box-open-elements/blob/main/docs/foundations/accessibility.md" target="_blank" rel="noreferrer">docs/foundations/accessibility.md</a>.</p>
      </div>
    </div>
  `;

  // Tabs
  stageBody.querySelectorAll<HTMLButtonElement>(".stage-tabs button").forEach(button => {
    button.addEventListener("click", () => {
      stageBody.querySelectorAll<HTMLButtonElement>(".stage-tabs button").forEach(other => {
        other.setAttribute("aria-selected", String(other === button));
      });
      stageBody.querySelectorAll<HTMLElement>("[data-panel]").forEach(panel => {
        panel.hidden = panel.dataset.panel !== button.dataset.tab;
      });
    });
  });

  // Preview (mounted below, once the inspectors are wired)
  const canvas = stageBody.querySelector<HTMLElement>("#preview-canvas")!;

  // Events panel
  const eventList = stageBody.querySelector<HTMLElement>("#event-list")!;
  const eventCount = stageBody.querySelector<HTMLElement>("#event-count")!;
  let seenEvents = 0;
  const listeners: Array<[string, EventListener]> = [];
  for (const name of SHARED_EVENTS) {
    const listener: EventListener = event => {
      seenEvents += 1;
      eventCount.textContent = String(seenEvents);
      if (seenEvents === 1) eventList.innerHTML = "";
      const row = document.createElement("div");
      row.className = "event-row";
      const detail = (event as CustomEvent).detail;
      let detailText = "";
      if (detail !== undefined) {
        try {
          detailText = JSON.stringify(detail) ?? String(detail);
        } catch {
          detailText = String(detail);
        }
      }
      row.innerHTML = `<span class="event-name">${escapeHtml(name)}</span><span class="event-detail">${escapeHtml(detailText)}</span>`;
      eventList.prepend(row);
      while (eventList.children.length > 30) eventList.lastElementChild?.remove();
    };
    canvas.addEventListener(name, listener);
    listeners.push([name, listener]);
  }

  // Observed attributes are a component-level fact — set once.
  const attributesTarget = stageBody.querySelector<HTMLElement>("#api-attributes")!;
  attributesTarget.innerHTML = observed.length
    ? `<table class="api-table"><tr><th>Attribute</th></tr>${observed.map(name => `<tr><td><code>${escapeHtml(name)}</code></td></tr>`).join("")}</table>`
    : '<p class="inspector-empty">This element observes no attributes.</p>';

  // Live inspectors (props / parts / roles) — re-run whenever the variant changes.
  const propList = stageBody.querySelector<HTMLElement>("#prop-list")!;
  const partsTarget = stageBody.querySelector<HTMLElement>("#api-parts")!;
  const tokensTarget = stageBody.querySelector<HTMLElement>("#api-tokens")!;
  const rolesTarget = stageBody.querySelector<HTMLElement>("#a11y-roles")!;
  const keyboardTarget = stageBody.querySelector<HTMLElement>("#a11y-keyboard")!;
  const guidanceTarget = stageBody.querySelector<HTMLElement>("#guidance-section")!;
  let observer: MutationObserver | null = null;
  const renderProps = (primary: HTMLElement | null): void => {
    const rows = primary
      ? [...primary.attributes].map(
          attribute => `<div class="prop-row"><code>${escapeHtml(attribute.name)}</code><span class="prop-value">${escapeHtml(attribute.value || "—")}</span></div>`,
        )
      : [];
    propList.innerHTML = rows.length ? rows.join("") : '<span class="inspector-empty">No reflected attributes yet.</span>';
  };
  const refreshInspectors = (): void => {
    observer?.disconnect();
    const primary = canvas.querySelector<HTMLElement>(entry.tag);
    renderProps(primary);
    if (primary) {
      observer = new MutationObserver(() => renderProps(primary));
      observer.observe(primary, { attributes: true });
    }
    const inspection = inspectPreviewTree(canvas, { primaryTag: entry.tag });
    partsTarget.innerHTML = inspection.parts.length
      ? `<table class="api-table"><tr><th>Part</th><th>Selector</th></tr>${inspection.parts.map(part => `<tr><td><code>${escapeHtml(part)}</code></td><td><code>${entry.tag}::part(${escapeHtml(part)})</code></td></tr>`).join("")}</table>`
      : '<p class="inspector-empty">No parts exposed in this preview.</p>';
    tokensTarget.innerHTML = inspection.tokens.length
      ? `<table class="api-table"><tr><th>Token</th></tr>${inspection.tokens.map(token => `<tr><td><code>${escapeHtml(token)}</code></td></tr>`).join("")}</table>`
      : '<p class="inspector-empty">No design tokens referenced in this preview\'s shadow styles.</p>';
    rolesTarget.innerHTML = inspection.roles.length
      ? `<table class="api-table"><tr><th>Role</th></tr>${inspection.roles.map(role => `<tr><td><code>${escapeHtml(role)}</code></td></tr>`).join("")}</table>`
      : '<p class="inspector-empty">No explicit ARIA roles in this preview (native semantics).</p>';

    const guidance = resolvePreviewGuidance({
      catalogId: entry.id,
      roles: inspection.guidanceRoles,
      exampleNote: example.note,
    });
    guidanceTarget.innerHTML = renderGuidanceCards(guidance);
    keyboardTarget.innerHTML = guidance.keyboard.length
      ? renderBulletList(guidance.keyboard)
      : '<p class="inspector-empty">No role-mapped keyboard guidance for this preview — see the shared accessibility conventions.</p>';
  };
  type SetupFn = (root: HTMLElement) => void | (() => void);
  let setupCleanup: (() => void) | undefined;
  const mount = (html: string, runSetup: SetupFn | undefined): void => {
    setupCleanup?.();
    setupCleanup = undefined;
    canvas.innerHTML = html;
    if (runSetup) {
      const cleanup = runSetup(canvas);
      if (typeof cleanup === "function") {
        setupCleanup = cleanup;
      }
    }
    refreshInspectors();
  };
  const initialSetup: SetupFn | undefined = useExampleVariants
    ? exampleVariants[0]?.setup
    : hasVariants
      ? undefined
      : example.setup;
  mount(initialHtml, initialSetup);

  // Variant picker — live example setups when present; otherwise extracted HTML.
  const variantSelect = stageBody.querySelector<HTMLSelectElement>("#variant-select");
  const codeBlock = stageBody.querySelector<HTMLElement>("#code-block")!;

  // Framework code tabs — re-render the snippet for the current variant + framework.
  let currentHtml = initialHtml;
  let currentFramework: Framework = "html";
  const renderCode = (): void => {
    const snippet = frameworkSnippet(currentFramework, entry.id, entry.tag, currentHtml);
    codeBlock.innerHTML = highlightCode(snippet, normalizeLang(currentFramework));
  };
  stageBody.querySelectorAll<HTMLButtonElement>(".code-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      currentFramework = tab.dataset.code as Framework;
      stageBody
        .querySelectorAll<HTMLButtonElement>(".code-tab")
        .forEach(other => other.setAttribute("aria-selected", String(other === tab)));
      renderCode();
    });
  });

  variantSelect?.addEventListener("change", () => {
    const index = Number(variantSelect.value);
    const variant = variants[index];
    if (!variant) return;
    const setup = useExampleVariants ? exampleVariants[index]?.setup : undefined;
    mount(variant.html, setup);
    currentHtml = variant.html;
    renderCode();
    const note = useExampleVariants ? exampleVariants[index]?.note : example.note;
    const noteEl = stageBody.querySelector<HTMLElement>(".preview-note");
    if (noteEl) {
      noteEl.textContent = note ?? "";
      noteEl.hidden = !note;
    }
  });

  // Preview width toolbar
  const SIZES: Record<string, string> = { full: "100%", tablet: "768px", mobile: "380px" };
  stageBody.querySelectorAll<HTMLButtonElement>(".size-button").forEach(button => {
    button.addEventListener("click", () => {
      const size = button.dataset.size!;
      canvas.dataset.previewSize = size;
      canvas.style.maxWidth = SIZES[size];
      stageBody.querySelectorAll<HTMLButtonElement>(".size-button").forEach(other => {
        other.setAttribute("aria-pressed", String(other === button));
      });
    });
  });

  // Related: sibling surfaces in the same category (real catalog data)
  const related = catalog.filter(item => item.tier === entry.tier && item.category === entry.category && item.id !== entry.id).slice(0, 6);
  const relatedTarget = stageBody.querySelector<HTMLElement>("#related-section")!;
  if (related.length) {
    relatedTarget.innerHTML = `
      <p class="section-label">Related in ${escapeHtml(entry.category)}</p>
      <div class="related-grid">
        ${related
          .map(item => `<a class="related-card" href="#${item.tier}/${item.id}"><strong>${escapeHtml(titleOf(item.id))}</strong><code>&lt;${item.tag}&gt;</code></a>`)
          .join("")}
      </div>`;
  }

  teardown = () => {
    setupCleanup?.();
    setupCleanup = undefined;
    observer?.disconnect();
    for (const [name, listener] of listeners) canvas.removeEventListener(name, listener);
  };
};

// ── Foundations pages ────────────────────────────────────────────────────────

// Token keys are Box's canonical taxonomy (e.g. "SurfaceSurfaceHover"). For the
// swatch label, drop the redundant leading group word and space out the rest so
// it reads "Surface Hover" under the Surface group — the exact --boe-token-* name
// is still shown verbatim on the line below for accuracy.
const humanizeToken = (name: string, group: string): string => {
  const withoutGroup = name.startsWith(group) ? name.slice(group.length) || group : name;
  return withoutGroup.replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim();
};

const renderTokensPage = (): void => {
  breadcrumb.innerHTML = `Foundations / <b>Design Tokens</b>`;
  const tokens = lib.boxDefaultDesignSystem.tokens ?? {};
  const groups: Record<string, Array<[string, string]>> = { Surface: [], Text: [], Stroke: [] };
  for (const [name, value] of Object.entries(tokens)) {
    const group = name.startsWith("Text") ? "Text" : name.startsWith("Stroke") ? "Stroke" : "Surface";
    groups[group].push([name, value]);
  }
  stageBody.innerHTML = `
    <h1 class="page-title">Design Tokens</h1>
    <span class="page-tag">--boe-token-*</span>
    <div class="prose"><p>The <code>box-default</code> bundle, applied live to this page via <code>applyDesignTokens()</code>. Register your own bundle to retheme every component.</p></div>
    ${Object.entries(groups)
      .map(
        ([group, entries]) => `
          <p class="section-label">${group} (${entries.length})</p>
          <div class="token-grid">
            ${entries
              .map(([name, value]) => `
                <div class="token-card">
                  <div class="token-swatch" style="background:${escapeHtml(value)}"></div>
                  <div class="token-meta">
                    <strong>${escapeHtml(humanizeToken(name, group))}</strong>
                    <code>--boe-token-${escapeHtml(toKebab(name))}</code>
                    <span class="token-value">${escapeHtml(value)}</span>
                  </div>
                </div>`)
              .join("")}
          </div>`,
      )
      .join("")}
    <hr class="md-sep" />
    <div class="prose md-doc">${renderMarkdown(tokensMd.replace(/^#[^\n]*\n/, ""))}</div>
  `;
};

const renderIconsPage = (): void => {
  breadcrumb.innerHTML = `Foundations / <b>Iconography</b>`;
  const aliasEntries = Object.entries(lib.boxIconographyAliases as Record<string, string>);
  const iconEntries = Object.entries(lib.boxIconography as Record<string, string>);
  stageBody.innerHTML = `
    <h1 class="page-title">Iconography</h1>
    <span class="page-tag">${iconEntries.length} icons · ${aliasEntries.length} aliases</span>
    <div class="prose"><p>The generated Box icon manifest, normalized to <code>currentColor</code>. Aliases give package-friendly names; resolve any key with <code>resolveDesignIcon(name)</code>.</p></div>
    <p class="section-label">Aliases (${aliasEntries.length})</p>
    <div class="icon-grid">
      ${aliasEntries
        .map(([alias]) => {
          const svg = lib.resolveDesignIcon(alias) ?? "";
          return `<div class="icon-card"><span class="glyph">${svg}</span><code>${escapeHtml(alias)}</code></div>`;
        })
        .join("")}
    </div>
    <p class="section-label">Full inventory (${iconEntries.length})</p>
    <div class="icon-grid">
      ${iconEntries
        .slice(0, 400)
        .map(([name, svg]) => `<div class="icon-card"><span class="glyph">${svg}</span><code>${escapeHtml(name)}</code></div>`)
        .join("")}
    </div>
    <hr class="md-sep" />
    <div class="prose md-doc">${renderMarkdown(iconographyMd.replace(/^#[^\n]*\n/, ""))}</div>
  `;
};

const renderMarkdownPage = (title: string, md: string): void => {
  breadcrumb.innerHTML = `Foundations / <b>${escapeHtml(title)}</b>`;
  stageBody.innerHTML = `<div class="prose md-doc">${renderMarkdown(md)}</div>`;
};

// ── Landing page ─────────────────────────────────────────────────────────────

// Rel-aware internal link: the static build emits per-page files (crawlable),
// the dev bundle stays hash-routed. Mirrors the rail's link logic.
const pageHref = (tier: string, id: string): string => {
  const rel = (window as BootWindow).__REL__ ?? "";
  const built = (window as BootWindow).__BUILT__ === true;
  return built && tier !== "lessons" ? `${rel}${tier}/${id}/` : `#${tier}/${id}`;
};

const renderHomePage = (): void => {
  breadcrumb.innerHTML = "<b>Home</b>";
  const componentCount = catalog.filter(entry => entry.tier === "components").length;
  const patternCount = catalog.filter(entry => entry.tier === "patterns").length;
  const firstComponent = catalog.find(entry => entry.tier === "components")!.id;
  const firstPattern = catalog.find(entry => entry.tier === "patterns")!.id;
  const cards: Array<{ num: string; title: string; blurb: string; count: string; href: string }> = [
    { num: "01", title: "Foundations", blurb: "Tokens, theming, geometry, motion, icons, accessibility, and brand.", count: `${FOUNDATION_PAGES.length} pages`, href: pageHref("foundations", "tokens") },
    { num: "02", title: "Components", blurb: "Framework-agnostic custom elements that track Box's design language.", count: `${componentCount} components`, href: pageHref("components", firstComponent) },
    { num: "03", title: "Patterns", blurb: "Composed views — explorers, sidebars, metadata, and data displays.", count: `${patternCount} patterns`, href: pageHref("patterns", firstPattern) },
    { num: "04", title: "Build Alongs", blurb: "Step-by-step lessons assembling real interfaces from the elements.", count: `${lessons.length} lessons`, href: pageHref("lessons", lessons[0].id) },
  ];
  stageBody.innerHTML = `
    <section class="home" aria-labelledby="home-hero">
      <p class="home-eyebrow">Box Open Elements · Edition 01</p>
      <h1 class="home-hero" id="home-hero">Build the interface.<br><span class="accent">Keep the freedom.</span></h1>
      <p class="home-lede">Framework-agnostic Web Components that track Box's design language — drop them into React, Angular, Vue, Svelte, or plain HTML. No lock-in, no wrapper tax.</p>
      <div class="home-actions">
        <a class="home-cta primary" href="${pageHref("components", firstComponent)}">Explore the catalog →</a>
        <a class="home-cta ghost" href="https://github.com/unofficialbox/box-open-elements" target="_blank" rel="noreferrer">View on GitHub <span aria-hidden="true">↗</span></a>
      </div>
      <div class="home-install">
        <span class="home-install-label">Install</span>
        <code>npm install @unofficialbox/box-open-elements</code>
      </div>
      <div class="home-cards">
        ${cards.map(card => `
          <a class="home-card" href="${card.href}">
            <span class="home-card-num">${card.num}</span>
            <h2 class="home-card-title">${card.title}</h2>
            <p class="home-card-blurb">${card.blurb}</p>
            <span class="home-card-count">${card.count}</span>
          </a>`).join("")}
      </div>
      <p class="home-foot">Community-built. Open source. Punk Rock. <span aria-hidden="true">🤘</span></p>
    </section>`;
};

// ── Router ───────────────────────────────────────────────────────────────────

const render = (): void => {
  delete document.body.dataset.routeReady;
  teardown?.();
  teardown = null;
  state.route = parseHash();
  // A lessons route keeps the Patterns tab + rail active; home has no tier.
  state.tier = state.route.tier === "lessons" ? "patterns"
    : state.route.tier === "home" ? state.tier
    : state.route.tier;
  renderRail();
  if (state.route.tier === "home") {
    renderHomePage();
    return;
  }
  if (state.route.tier === "foundations") {
    if (state.route.id === "tokens") renderTokensPage();
    else if (state.route.id === "icons") renderIconsPage();
    else {
      const doc = FOUNDATION_MD[state.route.id];
      renderMarkdownPage(doc.title, doc.md);
    }
    return;
  }
  if (state.route.tier === "lessons") {
    teardown = renderLessonPage(lessonById(state.route.id)!, stageBody, breadcrumb);
    return;
  }
  const entry = catalog.find(item => item.tier === state.route.tier && item.id === state.route.id)!;
  renderComponentPage(entry);
};

// Deterministic ready marker for screenshot tooling: set after two frames so
// synchronous rendering and microtask-based example setup have settled.
const markRouteReady = (): void => {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.body.dataset.routeReady = `${state.route.tier}/${state.route.id}`;
    });
  });
};

window.addEventListener("hashchange", () => {
  render();
  markRouteReady();
});

document.querySelectorAll<HTMLButtonElement>(".rail-tabs button").forEach(button => {
  button.addEventListener("click", () => {
    state.tier = button.dataset.tier!;
    if (state.tier === "foundations") location.hash = "#foundations/tokens";
    else {
      const first = catalog.find(entry => entry.tier === state.tier)!;
      location.hash = `#${state.tier}/${first.id}`;
    }
  });
});

railFilter.addEventListener("input", () => {
  state.filter = railFilter.value;
  // A new filter should show results from the top.
  railScroll = 0;
  sessionStorage.setItem(RAIL_SCROLL_KEY, "0");
  renderRail();
});

document.getElementById("copy-link")!.addEventListener("click", () => {
  void navigator.clipboard.writeText(location.href);
});

// The static build (docs-site/build.ts) inlines the package version via a
// `define`; the dev server (server.ts) leaves it undefined and serves the
// version from /api/status instead. The `typeof` guard avoids a ReferenceError
// in the dev bundle where the token is never substituted.
const inlinedVersion = typeof __BOE_VERSION__ !== "undefined" ? __BOE_VERSION__ : null;
applyRailVersion(
  document.getElementById("rail-version"),
  inlinedVersion,
  () => fetch("/api/status").then(response => response.json() as Promise<{ version: string }>),
);

// Home links (masthead brand + rail wordmark) resolve to the site root in the
// static build and to the home hash in the dev bundle.
for (const id of ["mast-home", "rail-home"]) {
  const home = document.getElementById(id) as HTMLAnchorElement | null;
  if (!home) continue;
  const rel = (window as BootWindow).__REL__ ?? "";
  home.setAttribute("href", (window as BootWindow).__BUILT__ === true ? (rel || "./") : "#home");
}

render();
markRouteReady();
