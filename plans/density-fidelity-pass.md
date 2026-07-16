# ExecPlan: Density + demo fidelity pass

## Outcome
Bring listed components/patterns closer to `segmented-control` density (compact padding/radius/gaps), fix broken/empty docs demos, and address toast overlap, radio/rating fidelity, nav-sidebar hash redirects, and explorer lesson chrome bulk.

## Reference density (`segmented-control`)
- control: `gap: 0.25rem`, `padding: 0.25rem`, `border-radius: 0.75rem`
- segment: `padding: 0.45em 1em`, `border-radius: 0.55rem`

## Target bands
| Token | Fat today | Target |
| --- | --- | --- |
| Shell padding | 1–1.1rem | 0.65–0.75rem |
| Shell radius | 0.95–1.05rem | 0.65–0.75rem |
| Gaps | 0.85–1rem | 0.5–0.6rem |
| Titles | 1.35rem | 1.1–1.15rem |
| Option cards | 0.82×0.9 / 0.95r | 0.45×0.6 / 0.55–0.65r |
| Action buttons | 0.72×1 / 2.9rem | 0.45×0.75 / ~2rem |

## Workstreams
1. Functional/demo: app-shell, divider, nav-sidebar, sidebar-toggle, split-view, chart-panel, annotation-toolbar, preview-element, toast stacking
2. Form density: checkbox-group, radio-group (+ part selector), dual-listbox, rating, rich-text, select
3. Layout/nav density: persona, section, accordion, tabs
4. Pattern density: file-request, task-assignment, review-queue, governance, bar-chart, chart-panel, annotation-toolbar, preview
5. Lesson chrome: docs-site lesson CSS + explorer lesson content polish (no fake content)

## Verification
- Targeted component tests for changed behavior
- `bun run verify`
- Pixel baselines regen only for intentionally changed shots
