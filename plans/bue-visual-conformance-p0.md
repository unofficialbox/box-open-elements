# ExecPlan: BUE visual conformance P0 (geometry + everyday controls)

## Purpose / Big Picture

Bring box-open-elements everyday controls closer to [box-ui-elements](https://github.com/box/box-ui-elements) Box Design Language geometry: 4px grid, radii 4/6/8/12, 32px control height, flat fills, light shadows. Colors already align; this slice fixes the chrome that still reads “soft rem UI” instead of Box.

## Progress

- [x] Branch `cursor/bue-visual-p0-controls-7eb7`
- [x] `src/foundations/geometry` BDL constants + docs
- [x] Restyle `box-button`, `box-text-field`, `box-select`, `box-checkbox`, `box-switch`
- [ ] Tests + BACKLOG/HANDOFF + `bun run verify` + baselines + PR

## Decision Log

- **Source of truth:** BUE SCSS constants (`_layout`, `_buttons`, `_inputs`, `_typography`), not Blueprint React components.
- **API stability:** keep `tone` default `primary`; restyle primary to flat BUE `.btn-primary` and `neutral` to `.btn` secondary.
- **Units:** publish px-rooted CSS custom properties + TS constants (components may still use rem equivalents rooted at 16px: `32px` → `2rem`, `6px` → `0.375rem`).
- **Focus:** prefer BUE border/focus treatment; keep a visible `:focus-visible` ring for a11y but thinner where BUE uses border-only.
- **Checkbox:** size toward 14×14; full custom checkmark art deferred if native accent is enough for P0.

## Outcomes

- Geometry module importable from `box-open-elements/foundations/geometry`
- P0 controls match BUE height/radius/pad/shadow language in style assertions
- Pixel baselines updated; verify green

## Validation

| Check | Command |
| --- | --- |
| Geometry tests | `bunx vitest run test/foundations/geometry.test.ts` |
| Control tests | `bunx vitest run test/components/button.test.ts test/components/forms/` |
| Full | `bun run verify` |
| Pixels | `bun run baselines:regen` |
