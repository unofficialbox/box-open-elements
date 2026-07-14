# Build Alongs (Microlearning)

Alongside catalog browsing, the docs site teaches through short "build-along" lessons: guided, hands-on paths from blank page to a working pattern-level result. The predecessor repo shipped the first one (`Explorer`) and validated the *microlearning shape* — short units, outcome-first, visible progress. It did **not** validate an experience a human could actually build alongside in their own editor; that gap is the reason this spec was revised. Nothing is implemented in this repo yet, so these requirements are the greenfield contract, not a description of existing code.

## Design goal

A build-along is a **build-it-yourself guide, not a watch-the-preview tour.** A developer must be able to start from an empty file and reach a working result by pasting real, runnable code into their own project — while a live in-page preview shows them the destination and mirrors each step. Every requirement below serves that goal. When a rule trades away "easy to skim" for "easy to actually build," it does so on purpose.

## Research grounding

- Short, single-skill units improve attention and retention, and work best consumed inside a normal workflow rather than as a long detached course (Learning Guild, 2025).
- Udemy-style structure: break a project into small sequential lessons with visible progress and immediate hands-on payoff.
- Coursera-style framing: front-load "what you will build" so the learner knows the destination first.
- Box positions UI Elements as pre-built embeddable workflows that get developers to working content fast — build-alongs should deliver that same time-to-working-result.

## Two run targets (both required)

Every lesson runs in two places that stay in lockstep:

1. **Docs-site preview** — the live result renders in the docs site's preview canvas and event log, so the reader sees the outcome early and watches each step take effect with zero setup.
2. **Standalone starter** — a tiny, linkable/downloadable runnable template (a single HTML entry plus one module) that reads like a real consumer app. The reader pastes each step's code into it and runs it locally.

Rules that keep the two honest:

- The code shown in a step is **identical** in both targets. The docs-site preview must mirror exactly what the starter produces — no docs-site-internal wiring (import-boundary shims, registry glue) may leak into lesson code.
- Lesson code imports through the **public package path** (`box-open-elements/...`), exactly what a third-party developer types. If a snippet only works because of docs-site internals, it is wrong.
- The starter is generic and reused across lessons, not re-invented per lesson.

## Fixed lesson anatomy

1. **Outcome** — one sentence plus a live preview of the final state, shown before any code.
2. **Why this matters** — one short paragraph.
3. **Setup (Step 0)** — the starter, install/run command, and how to open it. The reader has a blank-but-running app before Step 1. Setup is mandatory and does not count against the teaching-step budget.
4. **4–6 teaching steps**, each ~2–4 minutes.
5. **Wrap-up** — what works now, what to do next, links onward.

Total lesson time target: under 15 minutes for a new developer, setup included.

## Step-card contract

Every teaching step card carries all of:

- **Title + one-sentence goal.**
- **File + location anchor** — which file changes and where ("in `app.ts`, directly below the imports"). Never an unplaced fragment.
- **The change shown as the full current file with the delta highlighted**, plus a copy-the-whole-file button. The reader can always copy a complete, runnable file — the highlight tells them what's new, the full file tells them where it goes.
- **One visible result** — reproducible by the reader in the starter, and mirrored in the docs-site preview. If a step can't produce a visible result the reader can also get locally, it isn't a step.
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

- **Step 0 — Setup.** Create the starter: an HTML page plus a module that registers the Box design system and imports the explorer from `box-open-elements`; install the package; run it; see an empty shell render. (No Box account needed — the lesson uses the mock transport.)
- **Step 1** — render the shell.
- **Step 2** — connect the session (root folder, transport/mock data source).
- **Step 3** — navigate folders and breadcrumbs.
- **Step 4** — listen to events (`select`, `navigate`).
- **Step 5** — make it production-leaning (one or two options).

Deliberately scoped to folder browsing only; metadata query, preview, uploader, share, interceptors, and theming are follow-up lessons.

## Authoring boundary

- Build-alongs are hand-curated guided lessons and stay **outside** the Storybook extraction path (see [storybook.md](./storybook.md)) — they are workflows, not flat reference pages.
- They reuse the docs site's preview canvas and event log for the live mirror, and they **do** get the minimum learner-facing scaffolding the build-it-yourself contract requires: a setup step, full-source-with-copy per step, per-step checkpoints, and the shared standalone starter. Withholding that scaffolding — the old "don't invent lesson-only infrastructure" rule — is exactly what made the previous format hard to follow. Keep the scaffolding generic and reusable across lessons rather than one-off per lesson.
