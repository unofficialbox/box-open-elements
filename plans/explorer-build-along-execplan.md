# ExecPlan: Explorer build-along lesson

Implements the first build-along lesson (`Explorer`) against the revised
[`docs/workshop/build-alongs.md`](../docs/workshop/build-alongs.md) contract:
a **live-website-first, build-it-yourself** guided lesson that runs in the
browser on the deployed docs site against the already-deployed component
library, with a copyable complete-source "take it to your own project" path.

## Where it lives

Build-alongs are a Patterns-tier workflow area (per
[`docs/workshop/docs-site.md`](../docs/workshop/docs-site.md)). The lesson
surfaces as a **Build Alongs** group in the Patterns rail and routes to a
dedicated lesson page — not a component page.

## Data / rendering split

- **`docs-site/lessons.ts`** — pure, node-testable lesson data. No DOM, no
  `box-open-elements` import. Each lesson: `id`, `title`, `outcome`,
  `why`, and an ordered list of steps. Each step:
  `n` (0 = setup), `title`, `goal`, `file`, `anchor`, `code` (the **full
  cumulative source** of `file` at the end of the step), `highlight`
  (1-based line ranges changed this step), `why` (one required sentence),
  and `preview` (a string key telling the renderer which live state to
  build — keeps this module DOM-free).
- **`docs-site/lesson-page.ts`** — the browser renderer. Imports lesson
  data + `box-open-elements` + `createMockTransport` (from `examples.ts`).
  Owns `runPreview(key, canvas, log)` that builds the live
  `box-content-explorer` state for a step, and renders: outcome preview
  (final state, visible early), Step 0 setup, teaching-step cards
  (anchor + full-source-with-highlight + copy-whole-file + live result +
  "why it works" + checkpoint), wrap-up, a shared Events panel fed by the
  real explorer events, and a "Build it in your own project" section with
  the complete runnable `index.html` + `app.ts` and install/run notes.

## Router + rail wiring (`docs-site/main.ts`)

- `parseHash` recognizes `#lessons/<id>` → `{ tier: "lessons", id }` when
  the lesson exists.
- `render()`: for a `lessons` route, set `state.tier = "patterns"` (so the
  Patterns tab + rail stay active), `renderRail()`, then
  `renderLessonPage(lesson)`; set the `data-route-ready` marker as today.
- `renderRail()` (patterns tab) appends a **Build Alongs** group listing
  lessons, routing to `#lessons/<id>`, with `aria-current` when active.

## The Explorer lesson (steps)

Real, consumer-shaped code (`import ... from "box-open-elements"`, public
paths only), mock transport so it runs with no backend:

- **Step 0 — Setup.** `index.html` (import map + module) + `app.ts` that
  registers the Box design system and defines the explorer element; live
  result: the empty shell. On the site nothing is installed; the local
  aside gives `npm i` + run.
- **Step 1 — Render the shell.** Add `<box-content-explorer>`; result: the
  unconnected shell.
- **Step 2 — Connect the session.** Add the mock transport + `root-folder-id`
  / `token`; result: folders and files load.
- **Step 3 — Navigate.** Same element; result: clicking folders + the
  breadcrumb trail moves between folders.
- **Step 4 — Listen to events.** Wire `selection-changed`, `folder-changed`,
  `item-activated`; result: interactions log to the Events panel.
- **Step 5 — Production-leaning.** One option (`selection-mode="multiple"`
  or `page-size`); result: multi-select works.

Scoped to folder browsing only; preview/share/upload/metadata are later
lessons.

## Styles (`docs-site/styles.css`)

Lesson layout: outcome banner, step cards, code block with highlighted
delta lines, copy buttons, the "your own project" section. Reuse existing
inspector/event-row and code-block styles; theme-aware via existing tokens.

## Tests (`test/docs-site/lessons.test.ts`, node env)

Structure + lockstep guards on the pure data:
- exactly one lesson (`explorer`), steps numbered `0..5` contiguous.
- every step: non-empty `code`, `why`, `file`, `anchor`; `highlight` ranges
  within the code's line count.
- code is **cumulative** — each teaching step's code contains the prior
  step's key lines (monotonic growth; no wholesale replacement).
- the final step's code is the complete runnable source used by the
  "your own project" section (single source of truth).
- lesson id resolves and does not collide with any `catalog` pattern id.

## Verify + ship

`bun run verify` (typecheck + 488+ tests + build). Manually drive the
lesson in the built docs site with a screenshot to confirm the live
previews render and events log. Commit, push to the branch, open a draft
PR.
