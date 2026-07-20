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

/** Every crawlable page: components, patterns, and foundations. */
export const prerenderPages = (): PrerenderPage[] => [
  ...catalog.map(componentPage),
  ...FOUNDATIONS.map(foundationPage),
];
