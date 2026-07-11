import * as lib from "box-open-elements";
import { catalog, titleOf, type CatalogEntry } from "./registry.js";
import { examples } from "./examples.js";

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
];

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const toKebab = (value: string): string =>
  value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

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
};

// ── Component page ───────────────────────────────────────────────────────────

const renderComponentPage = (entry: CatalogEntry): void => {
  const example = examples[entry.id] ?? { html: `<${entry.tag} label="${titleOf(entry.id)}"></${entry.tag}>` };
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
          <div class="preview-toolbar" role="group" aria-label="Preview width">
            <button type="button" class="size-button" data-size="full" aria-pressed="true" title="Full width">Full</button>
            <button type="button" class="size-button" data-size="tablet" aria-pressed="false" title="Tablet width (768px)">Tablet</button>
            <button type="button" class="size-button" data-size="mobile" aria-pressed="false" title="Mobile width (380px)">Mobile</button>
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
      <pre class="code-block"><code>${escapeHtml(example.html)}</code></pre>
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

  // Preview
  const canvas = stageBody.querySelector<HTMLElement>("#preview-canvas")!;
  canvas.innerHTML = example.html;
  example.setup?.(canvas);

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

  // Properties panel: reflect the primary element's attributes live
  const propList = stageBody.querySelector<HTMLElement>("#prop-list")!;
  const primary = canvas.querySelector<HTMLElement>(entry.tag);
  let observer: MutationObserver | null = null;
  const renderProps = (): void => {
    if (!primary) return;
    const rows = [...primary.attributes].map(
      attribute => `<div class="prop-row"><code>${escapeHtml(attribute.name)}</code><span class="prop-value">${escapeHtml(attribute.value || "—")}</span></div>`,
    );
    propList.innerHTML = rows.length ? rows.join("") : '<span class="inspector-empty">No reflected attributes yet.</span>';
  };
  if (primary) {
    renderProps();
    observer = new MutationObserver(renderProps);
    observer.observe(primary, { attributes: true });
  }

  // API tab from live runtime data
  const attributesTarget = stageBody.querySelector<HTMLElement>("#api-attributes")!;
  attributesTarget.innerHTML = observed.length
    ? `<table class="api-table"><tr><th>Attribute</th></tr>${observed.map(name => `<tr><td><code>${escapeHtml(name)}</code></td></tr>`).join("")}</table>`
    : '<p class="inspector-empty">This element observes no attributes.</p>';

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
  const partsTarget = stageBody.querySelector<HTMLElement>("#api-parts")!;
  partsTarget.innerHTML = parts.size
    ? `<table class="api-table"><tr><th>Part</th><th>Selector</th></tr>${[...parts].sort().map(part => `<tr><td><code>${escapeHtml(part)}</code></td><td><code>${entry.tag}::part(${escapeHtml(part)})</code></td></tr>`).join("")}</table>`
    : '<p class="inspector-empty">No parts exposed in this preview.</p>';
  const rolesTarget = stageBody.querySelector<HTMLElement>("#a11y-roles")!;
  rolesTarget.innerHTML = roles.size
    ? `<table class="api-table"><tr><th>Role</th></tr>${[...roles].sort().map(role => `<tr><td><code>${escapeHtml(role)}</code></td></tr>`).join("")}</table>`
    : '<p class="inspector-empty">No explicit ARIA roles in this preview (native semantics).</p>';

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
                    <strong>${escapeHtml(name)}</strong>
                    <code>--boe-token-${escapeHtml(toKebab(name))}</code>
                    <span class="token-value">${escapeHtml(value)}</span>
                  </div>
                </div>`)
              .join("")}
          </div>`,
      )
      .join("")}
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
  `;
};

// ── Router ───────────────────────────────────────────────────────────────────

const render = (): void => {
  delete document.body.dataset.routeReady;
  teardown?.();
  teardown = null;
  state.route = parseHash();
  state.tier = state.route.tier;
  renderRail();
  if (state.route.tier === "foundations") {
    if (state.route.id === "tokens") renderTokensPage();
    else renderIconsPage();
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

void fetch("/api/status")
  .then(response => response.json())
  .then((status: { version: string }) => {
    document.getElementById("rail-version")!.textContent = `v${status.version}`;
  })
  .catch(() => {});

if (!location.hash) location.hash = "#components/button";
render();
markRouteReady();
