# box-open-elements ExecPlans

This document defines the standard for an execution plan, called an `ExecPlan`, in `box-open-elements`.

Use an ExecPlan for complex features, significant refactors, multi-session work, cross-cutting design-system changes, component-category ports from the reference repo, server-integration work, or any task that spans contracts, components, docs, and tests together.

An ExecPlan is a living, self-contained document that should let a new contributor complete the work from the plan alone.

## When to use an ExecPlan

Create an ExecPlan when the work:

- changes the public package surface or subpath exports
- spans headless logic, Web Components, docs, and tests together
- ports or changes a component family or design-system rule across many files
- affects server-integration contracts and examples
- requires coordinated accessibility or visual review work
- is likely to take more than one focused coding session

Small, local fixes usually do not need an ExecPlan.

## Required standards

Every ExecPlan must be:

- self-contained
- outcome-focused
- specific about files, commands, and expected results
- written for a contributor who knows nothing beyond the current working tree
- updated as work progresses

Do not assume the reader remembers prior conversations, earlier plans, or undocumented decisions.

## Repo-specific expectations

Each ExecPlan must explicitly describe:

- which tier or tiers are changing: core, foundations, components, patterns, docs site, or server integration
- which public APIs, custom elements, docs, or examples define current behavior
- how the change preserves or intentionally adjusts package boundaries
- which tests will prove the behavior
- which docs in `docs/` must be updated (including the catalogs and `docs/migration-map.md` when porting)
- whether the work should be reflected in `BACKLOG.md`

If the work changes UI or public behavior, the plan must say how these commands apply:

- `bun run typecheck`
- `bun run test`
- `bun run test:coverage`
- `bun run build`
- `bun run verify`

## File location

Store each ExecPlan under `plans/`. Use a specific, stable filename such as:

- `phase-1-explorer-foundation-execplan.md`
- `docs-site-shell-execplan.md`

Prefer one ExecPlan per major task.

## Required sections

Every ExecPlan must contain these sections, in this order:

### Purpose / Big Picture

Explain what someone can do after the change that they could not do before. State how to see the new behavior working in tests or the docs site.

### Progress

Use checkboxes. This section is mandatory and must always reflect reality. (The predecessor repo accumulated stale checklists that had to be overridden by status notes — do not repeat that.)

### Surprises & Discoveries

Record unexpected component behavior, accessibility findings, design-system constraints, or tooling limitations discovered during implementation.

### Decision Log

Record important decisions with rationale:

- Decision: ...
  Rationale: ...
  Date/Author: ...

### Outcomes & Retrospective

Summarize what shipped, what remains, and any lessons or follow-up work.

### Context and Orientation

Describe the current relevant system in plain language. Name the exact files and subsystems a novice must inspect — usually from `src/`, `test/`, and `docs/`.

### Plan of Work

Describe the intended sequence of edits in prose. Name the files, tests, and docs to change.

### Concrete Steps

Give exact commands with working directory and expected outputs where practical. All commands assume the repository root unless noted otherwise.

### Validation and Acceptance

Describe how to prove the change works. Acceptance must be behavior-based, for example:

- `bun run test` passes and the new regression test fails before the change and passes after it
- `bun run verify` passes

### Idempotence and Recovery

Explain which steps are safe to repeat and how to recover if a build or generated asset partially fails.

### Artifacts and Notes

Include short command transcripts or observations that prove success.

### Interfaces and Dependencies

Name the key types, exports, custom elements, contracts, design tokens, or docs that must exist or remain aligned after the change.

## Writing rules

- Write plainly and concretely.
- Prefer prose-first explanations over giant checklists.
- Do not use unexplained jargon.
- Do not defer critical design choices to the next contributor.
- Do not describe only code edits; explain the resulting behavior.
- Keep the plan consistent across all sections when details change.

## Maintenance rules

When updating an ExecPlan:

- keep `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` current
- update validation steps if the implementation path changes
- update doc and backlog expectations if the scope changes
- add a short note at the bottom describing what changed in the plan and why

An ExecPlan is only complete when a contributor can follow it, run the listed commands, and observe the promised behavior without needing outside context.
