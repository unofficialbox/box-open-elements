import * as lib from "box-open-elements";
import { catalog, titleOf, type CatalogEntry } from "./registry.js";
import { examples } from "./examples.js";
import { lessons, lessonById } from "./lessons.js";
import { renderLessonPage } from "./lesson-page.js";
import { applyRailVersion } from "./rail-version.js";
import workshop from "../storybook/generated/workshop.json" with { type: "json" };
import accessibilityMd from "../docs/foundations/accessibility.md";
import brandMd from "../docs/foundations/brand.md";
import tokensMd from "../docs/foundations/tokens.md";
import iconographyMd from "../docs/foundations/iconography.md";

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
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(theme === "dark"));
    toggle.textContent = theme === "dark" ? "Light" : "Dark";
  }
};

const storedTheme = localStorage.getItem("boe-docs-theme");
applyTheme(storedTheme === "dark" ? "dark" : "light");

document.getElementById("theme-toggle")?.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("boe-docs-theme", next);
  applyTheme(next);
});

// ── Shared event vocabulary the Events panel listens for ────────────────────

const SHARED_EVENTS = [
  "value-changed", "open-changed", "checked-changed", "selected-changed",
  "action", "confirm", "cancel", "dismiss", "search", "clear",
  "item-selected", "item-invoked", "item-activated", "provider-action",
  "filter-changed", "page-changed", "navigate", "select",
];

// ── Foundations entries ──────────────────────────────────────────────────────

const FOUNDATION_PAGES = [
  { id: "tokens", label: "Design Tokens" },
  { id: "icons", label: "Iconography" },
  { id: "accessibility", label: "Accessibility" },
  { id: "brand", label: "Brand" },
];

// Foundation docs rendered from their real markdown source (no invented copy).
const FOUNDATION_MD: Record<string, { title: string; md: string }> = {
  accessibility: { title: "Accessibility", md: accessibilityMd },
  brand: { title: "Brand", md: brandMd },
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const toKebab = (value: string): string =>
  value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

// Minimal, dependency-free markdown → HTML for the foundation docs (trusted,
// repo-owned content). Handles headings, lists, code fences, inline code/bold/
// links, rules, and paragraphs; anything else degrades to a paragraph.
const renderMarkdown = (md: string): string => {
  const inline = (text: string): string =>
    escapeHtml(text)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) => `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${label}</a>`);

  const out: string[] = [];
  let inList = false;
  let inCode = false;
  let code: string[] = [];
  const closeList = (): void => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };
  for (const line of md.replace(/\r\n/g, "\n").split("\n")) {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        out.push(`<pre class="code-block"><code>${escapeHtml(code.join("\n"))}</code></pre>`);
        code = [];
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      code.push(line);
      continue;
    }
    if (!line.trim()) {
      closeList();
      continue;
    }
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      closeList();
      out.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
      continue;
    }
    if (line.trim() === "---") {
      closeList();
      out.push("<hr />");
      continue;
    }
    const item = line.match(/^\s*[-*]\s+(.*)$/);
    if (item) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${inline(item[1])}</li>`);
      continue;
    }
    closeList();
    out.push(`<p>${inline(line.trim())}</p>`);
  }
  closeList();
  if (inCode) out.push(`<pre class="code-block"><code>${escapeHtml(code.join("\n"))}</code></pre>`);
  return out.join("\n");
};

// ── State + routing ──────────────────────────────────────────────────────────

type Route = { tier: string; id: string };

const state: { tier: string; filter: string; route: Route } = {
  tier: "components",
  filter: "",
  route: { tier: "components", id: "button" },
};

const parseHash = (): Route => {
  const [tier, id] = location.hash.replace(/^#/, "").split("/");
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
    for (const item of visible) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "rail-item";
      button.textContent = item.label;
      if (state.route.tier === item.tier && state.route.id === item.id) {
        button.setAttribute("aria-current", "page");
      }
      button.addEventListener("click", () => {
        location.hash = `#${item.tier}/${item.id}`;
      });
      group.append(button);
    }
    section.append(heading, group);
    railTree.append(section);
  };

  if (state.tier === "foundations") {
    addGroup("Foundations", FOUNDATION_PAGES.map(page => ({ id: page.id, label: page.label, tier: "foundations" })));
    return;
  }

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
};

// ── Component page ───────────────────────────────────────────────────────────

const renderComponentPage = (entry: CatalogEntry): void => {
  const example = examples[entry.id] ?? { html: `<${entry.tag} label="${titleOf(entry.id)}"></${entry.tag}>` };
  const variants = variantsById[entry.id] ?? [];
  const hasVariants = variants.length >= 2;
  const initialHtml = hasVariants ? variants[0].html : example.html;
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
          ${example.note ? `<p class="preview-note">${escapeHtml(example.note)}</p>` : ""}
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
      <pre class="code-block"><code id="code-block">${escapeHtml(initialHtml)}</code></pre>
      ${example.note ? `<p class="preview-note">${escapeHtml(example.note)}</p>` : ""}
    </div>
    <div data-panel="api" hidden>
      <p class="section-label">Attributes (observed)</p>
      <div id="api-attributes"></div>
      <p class="section-label">Styling hooks (parts)</p>
      <div id="api-parts"></div>
    </div>
    <div data-panel="accessibility" hidden>
      <div class="prose">
        <p class="section-label">Roles detected in this preview</p>
        <div id="a11y-roles"></div>
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
  const rolesTarget = stageBody.querySelector<HTMLElement>("#a11y-roles")!;
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
    const parts = new Set<string>();
    const roles = new Set<string>();
    canvas.querySelectorAll<HTMLElement>("*").forEach(node => {
      node.shadowRoot?.querySelectorAll<HTMLElement>("[part]").forEach(inner => {
        inner.getAttribute("part")!.split(/\s+/).forEach(part => parts.add(part));
      });
      node.shadowRoot?.querySelectorAll<HTMLElement>("[role]").forEach(inner => {
        roles.add(inner.getAttribute("role")!);
      });
    });
    partsTarget.innerHTML = parts.size
      ? `<table class="api-table"><tr><th>Part</th><th>Selector</th></tr>${[...parts].sort().map(part => `<tr><td><code>${escapeHtml(part)}</code></td><td><code>${entry.tag}::part(${escapeHtml(part)})</code></td></tr>`).join("")}</table>`
      : '<p class="inspector-empty">No parts exposed in this preview.</p>';
    rolesTarget.innerHTML = roles.size
      ? `<table class="api-table"><tr><th>Role</th></tr>${[...roles].sort().map(role => `<tr><td><code>${escapeHtml(role)}</code></td></tr>`).join("")}</table>`
      : '<p class="inspector-empty">No explicit ARIA roles in this preview (native semantics).</p>';
  };
  const mount = (html: string, runSetup: boolean): void => {
    canvas.innerHTML = html;
    if (runSetup) example.setup?.(canvas);
    refreshInspectors();
  };
  mount(initialHtml, !hasVariants);

  // Variant picker — swaps the preview between real extracted variant states.
  const variantSelect = stageBody.querySelector<HTMLSelectElement>("#variant-select");
  const codeBlock = stageBody.querySelector<HTMLElement>("#code-block")!;
  variantSelect?.addEventListener("change", () => {
    const variant = variants[Number(variantSelect.value)];
    if (!variant) return;
    mount(variant.html, false);
    codeBlock.textContent = variant.html;
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

// ── Router ───────────────────────────────────────────────────────────────────

const render = (): void => {
  delete document.body.dataset.routeReady;
  teardown?.();
  teardown = null;
  state.route = parseHash();
  // A lessons route keeps the Patterns tab + rail active.
  state.tier = state.route.tier === "lessons" ? "patterns" : state.route.tier;
  renderRail();
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

if (!location.hash) location.hash = "#components/button";
render();
markRouteReady();
