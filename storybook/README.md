# Workshop (Storybook backend)

A **separately-deployable component website** for `box-open-elements`, and the
one-way extraction backend.

It is the secondary authoring/iteration surface — many small component *states*
in isolation — distinct from the guided docs site. Per the doc, it is **not** a
consumer runtime dependency and does not run a Storybook/Vite server: it's a
Bun-native pipeline of typed stories → extracted JSON → a static site.

## Architecture

```
stories/*.stories.ts   authored CSF-lite modules (literal title + typed meta + variants)
metadata.ts            the typed authoring contract
extract-core.ts        pure extraction + identity guard (tested)
extract.ts             CLI → storybook/generated/workshop.json (repo-owned)
app.ts / index.html    the workshop UI, renders the extracted JSON
build.ts               bundles app + library → storybook/dist (self-contained)
server.ts              dev server
```

The extractor **fails** if a story's literal `title`, `id`, or `tag` drifts from
the docs-site catalog identity — so the story set and the catalog cannot diverge
silently. A test also asserts the committed `generated/workshop.json` is fresh.

## Commands

```bash
bun run storybook:extract   # regenerate generated/workshop.json from the stories
bun run storybook:dev       # serve the workshop at http://localhost:4610
bun run storybook:build     # emit the self-contained static site to storybook/dist
```

## Deploying

`bun run storybook:build` produces `storybook/dist/` — an `index.html`, a
`styles.css`, and a single self-contained `app.js` (the component library is
bundled in). Deploy that folder to **any static host**: Netlify, Vercel, GitHub
Pages, S3/CloudFront, Cloudflare Pages, or `bunx serve storybook/dist`. No server,
import map, or Storybook runtime is required.

## Adding a story

1. Add `stories/<id>.stories.ts` exporting a `StoryModule` (literal `title`,
   `meta` with the matching catalog `id`/`tag`, and `variants`).
2. Register it in `registry.ts`.
3. `bun run storybook:extract` to refresh the JSON.

Keep variants attribute-only where possible — `setup()` is stripped from
`workshop.json` (docs-site extraction) but the workshop UI (`app.ts`) imports
live `storyModules` and runs `setup()` for controller-bound demos such as
explorer adapters.
