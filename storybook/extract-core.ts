import type { ExtractedStory, StoryModule } from "./metadata.js";
import { titleCategory, titleLeaf } from "./metadata.js";

/** Minimal catalog shape the extractor validates story identity against. */
export interface CatalogLike {
  id: string;
  tag: string;
  tier: string;
}

export interface ExtractOptions {
  catalog: CatalogLike[];
  /** Human title for a catalog id (docs-site `titleOf`). */
  titleOf: (id: string) => string;
}

export interface ExtractResult {
  stories: ExtractedStory[];
  errors: string[];
}

/**
 * Turn authored story modules into the serializable extracted set, enforcing
 * that each story stays identity-consistent with the docs-site catalog:
 *
 * - the story's `meta.id` must exist in the catalog,
 * - `meta.tag` must equal the catalog tag (`box-<id>`),
 * - the story's literal `title` leaf must equal the catalog's human title,
 * - every variant's HTML must reference the component tag,
 * - there must be at least one variant.
 *
 * Any violation is collected as an error so the extraction CLI can fail — the
 * two surfaces cannot silently drift (see docs/workshop/storybook.md).
 */
export const extractStories = (
  modules: StoryModule[],
  options: ExtractOptions,
): ExtractResult => {
  const errors: string[] = [];
  const stories: ExtractedStory[] = [];
  const seen = new Set<string>();
  const byId = new Map(options.catalog.map(entry => [entry.id, entry]));

  for (const module of modules) {
    const { meta, title, variants } = module;
    const label = `"${title}"`;

    if (seen.has(meta.id)) {
      errors.push(`Duplicate story for id "${meta.id}".`);
      continue;
    }
    seen.add(meta.id);

    const entry = byId.get(meta.id);
    if (!entry) {
      errors.push(`${label}: id "${meta.id}" is not in the docs-site catalog.`);
      continue;
    }
    if (meta.tag !== entry.tag) {
      errors.push(`${label}: tag "${meta.tag}" does not match catalog tag "${entry.tag}".`);
    }
    const expectedLeaf = options.titleOf(meta.id);
    if (titleLeaf(title) !== expectedLeaf) {
      errors.push(
        `${label}: title leaf "${titleLeaf(title)}" does not match catalog title "${expectedLeaf}".`,
      );
    }
    if (variants.length === 0) {
      errors.push(`${label}: needs at least one variant.`);
    }
    for (const variant of variants) {
      if (!variant.html.includes(`<${meta.tag}`)) {
        errors.push(`${label}: variant "${variant.name}" does not render <${meta.tag}>.`);
      }
    }

    stories.push({
      id: meta.id,
      tag: meta.tag,
      title,
      category: titleCategory(title),
      shortDescription: meta.shortDescription,
      docsDescription: meta.docsDescription,
      sourceSnippet: meta.sourceSnippet,
      referenceRows: meta.referenceRows,
      variants: variants.map(variant => ({
        name: variant.name,
        html: variant.html,
        ...(variant.note ? { note: variant.note } : {}),
      })),
    });
  }

  return { stories, errors };
};
