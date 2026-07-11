# Storybook

The predecessor repo ran a deliberate Storybook pilot, a follow-up extraction pilot, and a partial rollout. The conclusions are settled and carry over as policy here.

## Role

- Storybook is a **secondary workshop and authoring surface**, never the primary docs shell and never a consumer runtime dependency.
- The docs site remains the Box-flavored presentation layer and guided documentation experience.
- Use Storybook for: isolated component iteration, many small story states, faster maintenance of example permutations, and future story-level accessibility/interaction/visual testing.

## Extraction architecture (validated)

Storybook can act as a one-way authoring/generation backend for docs-site reference pages:

1. Stories plus a repo-owned **typed metadata layer** are the authoring contract.
2. An extraction script emits repo-owned generated JSON.
3. The docs site renders from that JSON. It never needs a running Storybook server, an iframe, or Storybook manager HTML at runtime.

Metadata contract minimum per component: title, short description, docs description, canonical source snippet, structured reference rows, and at least one story variant. If a page needs more than this to be correct, it is a poor extraction candidate.

## Stability findings (durable)

- Storybook's `index.json` is stable enough to use for story indexing/identity.
- Storybook's manifests (`/manifests/components.json`, `/manifests/docs.json`) are **not stable** — treat them as extraction implementation details, never a runtime contract. Do not scrape HTML.
- Storybook CSF requires literal `title` strings, so shared metadata cannot own that field. Keep literal titles in stories and make extraction **fail** if the built index no longer matches the declared title.
- Storybook's Web Components path assumes Vite; with a Bun-based repo it is parallel infrastructure, not a drop-in. Budget for that when reintroducing it.

## Inclusion rule

The distinction for whether a page uses extracted docs versus hand-curation is **not** "workflow vs. non-workflow tier." It is:

- **Extract** when the page is primarily a reusable component reference surface: stable canonical example, clear contract, structured reference rows, limited demo-only prose. (The preview shell qualified.)
- **Hand-curate** when the page is primarily a product/workflow teaching surface: bespoke guided structure, editorial storytelling, workflow explanation more important than the contract. (The content explorer and all build-along lessons qualify.)

## Failure signals

Stop expansion or narrow the rollout if:

- Storybook starts pulling docs-site-only concepts into its configuration
- contributors have to edit Storybook and docs-site content separately for the same extracted surface
- metadata becomes too thin or too ad hoc to drive both surfaces cleanly
- workflow stories become more expensive to maintain than the pages they were meant to simplify
