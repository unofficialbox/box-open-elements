# ExecPlan: Docs-site Usage / Best-practices guidance cards

## Outcome

Ship Preview-tab guidance cards (Usage, Best practices, Keyboard) populated only from real sources — workshop metadata, curated example notes, and role-mapped bullets from `docs/foundations/accessibility.md`. Omit empty cards.

## Tier

Docs site (`docs-site/`) + workshop metadata consumption.

## Scope

1. `docs-site/guidance.ts` — resolve usage / keyboard / best-practices from workshop + roles.
2. Render conditional cards under the preview; deepen Accessibility tab keyboard section.
3. Styles (light + dark) + unit tests.
4. Update `docs/workshop/docs-site.md`, BACKLOG, HANDOFF, v1 ExecPlan outcomes.

## Explicit deferrals

- Hand-authored Usage/Best-practices for the full catalog (grow via workshop stories / notes)
- Invented placeholder card shells when no data exists

## Progress

- [x] Guidance module + role maps
- [x] Preview cards + Accessibility keyboard section
- [x] Styles + tests
- [x] Docs/BACKLOG + verify + PR
