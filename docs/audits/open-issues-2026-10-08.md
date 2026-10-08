# Open-issue reconciliation — 2026-10-08

This audit compares the 30 open issues in `unofficialbox/box-open-elements`
with `origin/main` at `e7254e9` and this branch. “Implemented here” means
code and focused tests exist on this branch; it does **not** mean released or
that an issue should be closed before visual/consumer acceptance.

| Issues | Disposition | Verification target |
| --- | --- | --- |
| #346 | Implemented here: border/none current-line modes, viewport-scoped hanging wrap indentation, hideable help/problem chrome, fill-height | Code-editor test and Riptide fixed-height embed |
| #347–349 | Implemented here: textarea focus forwarding, button accessible label, field-specific reveal label | Component tests |
| #350–353 | Implemented here: compact progress rail, stacked summary, wizard heading/error/focus, 24px reveal target | Component/pattern tests and 320px UI |
| #354–358 | Implemented here: resource row, drawer close control, clamped number status, dialog busy/disabled confirm, tile metadata/status | Component tests and keyboard UI |
| #359–360 | Implemented here: collapsed sidebar toggle and a single AppShell navigation landmark | Layout tests |
| #361–363 | Implemented here: verdict banner, in-place flow-node figure, dry/live mode indicator | Component/pattern tests and narrow UI |
| #320 | Already implemented on main: `model.validate` replaces `graphChecks` when provided; host vocabulary no longer gets generic branch false positives | Riptide `if`/`switch`/`try` integration acceptance |
| #321–331 | Main has the rebuilt modeler API, canvas, palette, inspector, read-back, responsive behavior and tests documented in `docs/patterns/process-modeler.md`; original issues remain open because their acceptance requires a side-by-side comparison with Riptide’s reference Diagram at 1440/390, light/dark, plus host adoption. This branch does not claim that parity. | Riptide-owned visual/behavior acceptance and integration |

## Product choices retained

- Resource rows use a normal list of distinct selection buttons and action
  controls, not `role=option` with interactive descendants.
- `box-code-editor` keeps its existing visual defaults; hosts opt in to
  border-only current lines and hidden embedded chrome.
- `box-mode-indicator` emits `activate` instead of selecting a URL or changing
  mode itself. The host owns the destination and confirmation policy.
- The modeler’s host schema, read-back conversion and persistence remain host
  responsibilities. Closing #321–331 should follow reference comparison and
  Riptide adoption, not the presence of matching API names alone.
