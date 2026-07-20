/**
 * Build-time, DOM-free prerender of each route's crawlable content.
 *
 * build.ts uses this to emit a static HTML file per catalog/foundation page so
 * search engines and AI answer engines get real content (name, tag, purpose,
 * usage, rendered foundation docs) instead of an empty SPA shell. The app
 * replaces `#stage-body` on boot, so the interactive render is unchanged and
 * visual output is identical.
 *
 * Runs under plain `bun` (not the docs-site bundle), so foundation markdown is
 * read from disk rather than imported via the `.md` text loader.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { catalog, titleOf, type CatalogEntry } from "./registry.js";
import { renderGuidanceCards, resolvePreviewGuidance, usageById } from "./guidance.js";
import { renderMarkdown } from "./markdown.js";
import { lessons } from "./lessons.js";

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const foundationMd = (id: string): string =>
  readFileSync(join(REPO_ROOT, "docs/foundations", `${id}.md`), "utf8");

const FOUNDATIONS: Array<{ id: string; title: string }> = [
  { id: "tokens", title: "Design Tokens" },
  { id: "theming", title: "Theming" },
  { id: "geometry", title: "Geometry" },
  { id: "motion", title: "Motion" },
  { id: "iconography", title: "Iconography" },
  { id: "accessibility", title: "Accessibility" },
  { id: "brand", title: "Brand" },
];

// Route ids differ from the markdown filename only for iconography (route "icons").
const foundationRouteId = (id: string): string => (id === "iconography" ? "icons" : id);

const escapeHtml = (v: string): string =>
  v.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const clampDesc = (s: string): string => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > 300 ? `${t.slice(0, 297)}…` : t;
};

/** First real prose line of a markdown doc (skip the H1, tables, code, blanks). */
const firstProse = (md: string): string => {
  for (const raw of md.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || line.startsWith("|") || line.startsWith("```")) continue;
    return clampDesc(line.replace(/[*_`>]/g, ""));
  }
  return "";
};

export interface PrerenderPage {
  /** Deployed path, e.g. "components/button" (no leading/trailing slash). */
  path: string;
  route: { tier: string; id: string };
  title: string;
  description: string;
  breadcrumbHtml: string;
  bodyHtml: string;
}

const componentPage = (entry: CatalogEntry): PrerenderPage => {
  const title = titleOf(entry.id);
  const usage = usageById[entry.id];
  const kind = entry.tier === "components" ? "component" : "pattern";
  const description = usage?.docsDescription
    ? clampDesc(usage.docsDescription)
    : usage?.shortDescription
      ? clampDesc(usage.shortDescription)
      : `${title} — a ${entry.category} ${kind} in Box Open Elements, a framework-agnostic Web Components design system for Box-style experiences.`;
  const cards = renderGuidanceCards(resolvePreviewGuidance({ catalogId: entry.id, roles: [] }));
  const bodyHtml = `
    <h1 class="page-title">${escapeHtml(title)}</h1>
    <span class="page-tag">&lt;${escapeHtml(entry.tag)}&gt;</span>
    ${usage ? `<p class="prerender-summary">${escapeHtml(usage.shortDescription)}</p>` : ""}
    ${cards}
  `.trim();
  return {
    path: `${entry.tier}/${entry.id}`,
    route: { tier: entry.tier, id: entry.id },
    title: `${title} — Box Open Elements`,
    description,
    breadcrumbHtml: `${entry.tier === "components" ? "Components" : "Patterns"} / ${escapeHtml(entry.category)} / <b>${escapeHtml(title)}</b>`,
    bodyHtml,
  };
};

const foundationPage = (f: { id: string; title: string }): PrerenderPage => {
  const md = foundationMd(f.id);
  const routeId = foundationRouteId(f.id);
  return {
    path: `foundations/${routeId}`,
    route: { tier: "foundations", id: routeId },
    title: `${f.title} — Box Open Elements`,
    description: firstProse(md) || `${f.title} — a foundation of the Box Open Elements design system.`,
    breadcrumbHtml: `Foundations / <b>${escapeHtml(f.title)}</b>`,
    bodyHtml: `<div class="prose md-doc">${renderMarkdown(md)}</div>`,
  };
};

/**
 * The landing page's crawlable content. Mirrors main.ts `renderHomePage()`;
 * the client replaces it on boot, so it exists for search/AI engines and the
 * no-JS view. Built at the site root, so internal links use `${tier}/${id}/`
 * (lessons have no static file and stay hash-routed).
 */
export const homePage = (): PrerenderPage => {
  const componentCount = catalog.filter(entry => entry.tier === "components").length;
  const patternCount = catalog.filter(entry => entry.tier === "patterns").length;
  const firstComponent = catalog.find(entry => entry.tier === "components")!.id;
  const firstPattern = catalog.find(entry => entry.tier === "patterns")!.id;
  const cards = [
    { num: "01", title: "Foundations", blurb: "Tokens, theming, geometry, motion, icons, accessibility, and brand.", count: `${FOUNDATIONS.length} pages`, href: "foundations/tokens/" },
    { num: "02", title: "Components", blurb: "Framework-agnostic custom elements that track Box's design language.", count: `${componentCount} components`, href: `components/${firstComponent}/` },
    { num: "03", title: "Patterns", blurb: "Composed views — explorers, sidebars, metadata, and data displays.", count: `${patternCount} patterns`, href: `patterns/${firstPattern}/` },
    { num: "04", title: "Build Alongs", blurb: "Step-by-step lessons assembling real interfaces from the elements.", count: `${lessons.length} lessons`, href: `#lessons/${lessons[0].id}` },
  ];
  const bodyHtml = `
    <section class="home" aria-labelledby="home-hero">
      <p class="home-eyebrow">Box Open Elements · Edition 01</p>
      <h1 class="home-hero" id="home-hero">Build the interface.<br><span class="accent">Keep the freedom.</span></h1>
      <p class="home-lede">Framework-agnostic Web Components that track Box's design language — drop them into React, Angular, Vue, Svelte, or plain HTML. No lock-in, no wrapper tax.</p>
      <div class="home-actions">
        <a class="home-cta primary" href="components/${firstComponent}/">Explore the catalog →</a>
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
    </section>`.trim();
  return {
    path: "",
    route: { tier: "home", id: "home" },
    title: "Box Open Elements — Web Components design system for Box",
    description: "Framework-agnostic Web Components that track Box's design language — for React, Angular, Vue, Svelte, or plain HTML.",
    breadcrumbHtml: "<b>Home</b>",
    bodyHtml,
  };
};

/** Every crawlable page: components, patterns, and foundations. */
export const prerenderPages = (): PrerenderPage[] => [
  ...catalog.map(componentPage),
  ...FOUNDATIONS.map(foundationPage),
];
