# Build Alongs (Microlearning)

Alongside catalog browsing, the docs site teaches through short "build-along" lessons: guided, hands-on paths from blank page to a working pattern-level result. The predecessor repo shipped the first one (`Explorer`) and validated the format; the lesson anatomy below is the reusable template.

## Research grounding

- Short, single-skill units improve attention and retention, and work best consumed inside a normal workflow rather than as a long detached course (Learning Guild, 2025).
- Udemy-style structure: break a project into small sequential lessons with visible progress and immediate hands-on payoff.
- Coursera-style framing: front-load "what you will build" so the learner knows the destination first.
- Box positions UI Elements as pre-built embeddable workflows that get developers to working content fast — build-alongs should deliver that same time-to-working-result.

## Fixed lesson anatomy

1. **Outcome** — one sentence plus a preview of the final state.
2. **Why this matters** — one short paragraph.
3. **4–6 steps**, each ~2–4 minutes.
4. **Step card** = title + one-sentence goal + one code delta + one visible result + one "what changed".
5. **Wrap-up** — what works now, what to do next, links onward.

Total lesson time target: under 15 minutes for a new developer.

## Experience rules

- The final outcome is visible early.
- Code is incremental — never wholesale replacement each step.
- Every step shows a visible result.
- One new idea per step; architecture explanation is optional.
- Lessons move upward through the taxonomy: start with a foundation or component, end with a working pattern.

## Stop conditions

Split a lesson when:

- it exceeds 6 steps
- a step needs more than one concept
- an adjacent mode (e.g. metadata query) sneaks in
- completing the lesson starts requiring other workflows (preview, share, upload)

## First lesson: Explorer

The validated outline for the content-explorer build-along:

- Step 0 — what you're building (working embedded explorer)
- Step 1 — render the shell
- Step 2 — connect the session (root folder, transport)
- Step 3 — navigate folders and breadcrumbs
- Step 4 — listen to events (`select`, `navigate`)
- Step 5 — make it production-leaning (one or two options)

Deliberately scoped to folder browsing only; metadata query, preview, uploader, share, interceptors, and theming are follow-up lessons.

## Authoring boundary

Build-alongs are hand-curated guided lessons and stay **outside** the Storybook extraction path (see [storybook.md](./storybook.md)) — they are workflows, not flat reference pages. They reuse the docs site's preview panel, source panel, and event log rather than inventing lesson-only infrastructure.
