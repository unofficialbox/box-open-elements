# Build Alongs (Microlearning)

Alongside catalog browsing, the docs site teaches through short "build-along" lessons: guided, hands-on paths from blank page to a working pattern-level result. The predecessor repo shipped the first one (`Explorer`) and validated the *microlearning shape* — short units, outcome-first, visible progress. It did **not** validate an experience a human could actually build alongside in their own editor; that gap is the reason this spec was revised. These requirements began as a greenfield contract rather than a description of prior code; the first lesson (`Explorer`) is implemented against them in the docs site.

## Design goal

A build-along is a **build-it-yourself guide, not a watch-the-preview tour** — but the place a learner builds it is the **live, deployed docs website first**, not a local checkout. A learner must be able to complete the entire lesson in the browser on the deployed site: read each step, copy real runnable code, and watch it execute in the live preview, with nothing to install. Taking the same code into their own local project is a fully supported **second** path, never a prerequisite. Every requirement below serves that goal. When a rule trades away "easy to skim" for "easy to actually build," it does so on purpose.

## Research grounding

- Short, single-skill units improve attention and retention, and work best consumed inside a normal workflow rather than as a long detached course (Learning Guild, 2025).
- Udemy-style structure: break a project into small sequential lessons with visible progress and immediate hands-on payoff.
- Coursera-style framing: front-load "what you will build" so the learner knows the destination first.
- Box positions UI Elements as pre-built embeddable workflows that get developers to working content fast — build-alongs should deliver that same time-to-working-result.

## Two run targets — live website first

Every lesson runs in two places that stay in lockstep. **The live deployed website is the primary target; the local project is a supported second path, never a prerequisite.**

1. **Live docs-site lesson (primary)** — the whole lesson is completable in the browser on the deployed site. The component library ships to that **same** site, so each step's live result renders against the already-deployed library in the docs-site preview canvas and event log with **nothing to install**. This must work as a **statically deployed site**: no local dev server and no backend on the primary path (mock transport, like the rest of the docs site). The deployed site is the source of truth for whether a lesson works.
2. **Local starter (secondary)** — a tiny, linkable/downloadable runnable template (a single HTML entry plus one module) that reads like a real consumer app, for a learner who then wants to build the lesson into their own project. Same code, run locally against the published package.

Rules that keep the two honest:

- The **learner-owned code** shown in a step is **identical** in both targets: the same source, imports, and component behavior must render the same result whether run in the live preview or the local starter. The docs-site-only chrome *around* that result — the preview wrapper, the Events/inspection panels, the copy affordances — is not part of the lesson code and may differ; but no docs-site-internal wiring (import-boundary shims, registry glue) may ever leak into the lesson code itself.
- Lesson code imports through the **public package path** (`box-open-elements/...`), exactly what a third-party developer types. If a snippet only works because of docs-site internals, it is wrong.
- The starter is generic and reused across lessons, not re-invented per lesson.

## Fixed lesson anatomy

1. **Outcome** — one sentence plus a live preview of the final state, shown before any code.
2. **Why this matters** — one short paragraph.
3. **Setup (Step 0)** — a blank, running host with the design system applied and no pattern element mounted yet (Step 1 introduces that). On the live site it is already running, nothing to install; for the secondary local path it also lists the starter + install/run command. Either way the reader has a blank-but-running app before Step 1. Mandatory; does not count against the teaching-step budget.
4. **4–6 teaching steps**, each ~2–4 minutes.
5. **Wrap-up** — what works now, what to do next, links onward.

Total lesson time target: under 15 minutes for a new developer, setup included.

## Step-card contract

Every teaching step card carries all of:

- **Title + one-sentence goal.**
- **File + location anchor** — which file changes and where ("in `app.ts`, directly below the imports"). Never an unplaced fragment.
- **The change shown as the full current file with the delta highlighted**, plus a copy-the-whole-file button. The reader can always copy a complete, runnable file — the highlight tells them what's new, the full file tells them where it goes.
- **One visible result** — rendered live in the deployed site's preview for every reader, and reproducible from the same code in the local starter. If a step can't produce a visible result on the live site, it isn't a step.
- **What changed and why it works** — one required sentence of mechanism. Not optional; the "why" is usually the point.
- **Checkpoint** — the complete known-good source at the end of the step. A reader who fell out of sync copies it and continues. The lesson also ends with one final complete source.

## Experience rules

- The final outcome is visible early.
- Steps are **incremental in what they teach** — one small part changes per step — but every step still hands over the complete runnable file. "Incremental" describes the teaching rhythm, never a reason to withhold full source.
- Every step shows a visible result the reader can reproduce, not just watch.
- One new idea per step, plus its one-sentence "why it works."
- Lessons move upward through the taxonomy: start with a foundation or component, end with a working pattern.

## Stop conditions

Split a lesson when:

- it exceeds 6 teaching steps
- a step needs more than one concept
- an adjacent mode (e.g. metadata query) sneaks in
- completing the lesson starts requiring other workflows (preview, share, upload)

## First lesson: Explorer

The content-explorer build-along, revised to the build-it-yourself contract:

- **Step 0 — Setup.** A blank, running app: the Box design system is registered and its tokens are applied, but no explorer is mounted yet. On the live site it is already running — nothing to install (the library is deployed alongside the lesson). To build locally instead: create the starter (an HTML page plus a module that registers the Box design system and defines the explorer element from `box-open-elements`) and serve it. Either way, no Box account needed — the lesson uses the mock transport.
- **Step 1 — render the shell.** Create and mount `<box-content-explorer>`; it renders its empty, un-connected shell.
- **Step 2** — connect the session (root folder, transport/mock data source).
- **Step 3** — navigate folders and breadcrumbs.
- **Step 4** — listen to events (`select`, `navigate`).
- **Step 5** — make it production-leaning (one or two options).

Deliberately scoped to folder browsing only; metadata query, preview, uploader, share, interceptors, and theming are follow-up lessons.

## Second lesson: Share

The share-panel build-along, on the same lesson infra:

- **Step 0 — Setup.** Blank running app: Box design system registered, `<box-share-panel>` defined, nothing mounted.
- **Step 1 — render the shell.** Mount the panel with a heading.
- **Step 2 — shared link.** Wire the `sharedLink` JSON property (url, access, label, status).
- **Step 3 — people with access.** Set `collaborators`.
- **Step 4 — message + settings.** Add supporting copy and download/expiration rows.
- **Step 5 — actions + events.** Host-owned action buttons; listen for `action` and `collaborator-selected`.

Deliberately scoped to the attribute/JSON-driven panel — no invite modal, no explorer selection wiring, no transport.

## Third lesson: Preview

The preview-element build-along, on the same lesson infra:

- **Step 0 — Setup.** Blank running app: Box design system registered, `<box-preview-element>` defined, nothing mounted.
- **Step 1 — render the shell.** Mount the preview with a heading.
- **Step 2 — item chrome.** Wire `item-label`, `status`, and `message`.
- **Step 3 — provider.** Set the `provider` JSON property.
- **Step 4 — adapter state.** Publish page/zoom via `adapterState`.
- **Step 5 — actions + events.** Host-owned actions; listen for `action` and `provider-action`.

Deliberately scoped to the attribute/JSON-driven shell — no slotted toolbar/stage, no live providerAdapter, no annotation surfaces.

## Authoring boundary

- Build-alongs are hand-curated guided lessons and stay **outside** the Storybook extraction path (see [storybook.md](./storybook.md)) — they are workflows, not flat reference pages.
- They reuse the docs site's preview canvas and event log for the primary in-browser result, and they **do** get the minimum learner-facing scaffolding the build-it-yourself contract requires: a setup step, full-source-with-copy per step, per-step checkpoints, and the shared local starter for the secondary path. Withholding that scaffolding — the old "don't invent lesson-only infrastructure" rule — is exactly what made the previous format hard to follow. Keep the scaffolding generic and reusable across lessons rather than one-off per lesson.
