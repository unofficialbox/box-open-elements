/**
 * The typed metadata layer — the authoring contract shared by the workshop
 * stories and the extraction backend (see docs/workshop/storybook.md).
 *
 * Per the validated architecture: stories carry a *literal* `title` string (CSF
 * requires it), and a repo-owned metadata object supplies the rest. Extraction
 * fails if a story's literal title no longer matches the docs-site catalog
 * identity, so the two surfaces cannot silently drift apart.
 */

/** A single isolated component state rendered on the workshop canvas. */
export interface StoryVariant {
  /** Short label for the state, e.g. "Primary", "Disabled", "Loading". */
  name: string;
  /** The canonical HTML for this variant (custom-element markup). */
  html: string;
  /** Bind rich properties that can't be expressed as attributes (workshop runtime only; stripped on extract). */
  setup?: (root: HTMLElement) => void | (() => void);
  /** Optional one-line note shown under the variant. */
  note?: string;
}

/** The metadata minimum the doc requires for an extractable reference surface. */
export interface ComponentMeta {
  /** Catalog id, e.g. "button" — must match the docs-site registry entry. */
  id: string;
  /** Custom element tag, e.g. "box-button". */
  tag: string;
  /** One-line summary. */
  shortDescription: string;
  /** Longer docs description. */
  docsDescription: string;
  /** Canonical usage snippet (shown verbatim). */
  sourceSnippet: string;
  /** Structured reference rows (attributes / properties / events / slots). */
  referenceRows: ReferenceRow[];
}

export type ReferenceKind = "attribute" | "property" | "event" | "slot" | "part";

export interface ReferenceRow {
  kind: ReferenceKind;
  name: string;
  description: string;
  type?: string;
}

/**
 * A story module. `title` is a literal (CSF-style) so the built index can be
 * checked against it; `meta` + `variants` are the repo-owned authoring data.
 */
export interface StoryModule {
  /** Literal CSF title, e.g. "Components/Actions/Button". */
  title: string;
  meta: ComponentMeta;
  variants: StoryVariant[];
}

/** The extracted, serializable shape the docs surfaces render from. */
export interface ExtractedStory {
  id: string;
  tag: string;
  title: string;
  category: string;
  shortDescription: string;
  docsDescription: string;
  sourceSnippet: string;
  referenceRows: ReferenceRow[];
  variants: Array<{ name: string; html: string; note?: string }>;
}

/** Helper: assert a story's title tail equals the human title of its id. */
export const titleLeaf = (title: string): string => {
  const parts = title.split("/");
  return parts[parts.length - 1] ?? title;
};

/** Helper: the category segment of a CSF title (the part before the leaf). */
export const titleCategory = (title: string): string => {
  const parts = title.split("/");
  return parts.length > 1 ? parts[parts.length - 2] : "Components";
};
