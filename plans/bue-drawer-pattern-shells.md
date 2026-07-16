# ExecPlan: BUE drawer + denser pattern shells

## Purpose / Big Picture

Close the last called-out BUE visual conformance leftovers: restyle `box-drawer` to sidebar/modal chrome, and move pattern card shells off the soft `0.7rem` rem camp onto `boePanel` (12 / 8 / 12).

## Progress

- [x] Branch `cursor/bue-drawer-pattern-shells-7eb7`
- [x] Add `boePanel` geometry token
- [x] Restyle `box-drawer`
- [x] Migrate pattern shell pad/radius/gap (+ flat panel fills where the soft 94/6 mix was used)
- [ ] Tests + docs + verify + baselines + PR

## Decision Log

- **Drawer width:** 340px (content-sidebar / annotation-thread class of widths), not the old ~420px rem band.
- **Drawer scrim:** reuse `boeOverlay.modalBackdrop` (75%, no blur).
- **Pattern shells:** `boePanel.padding/radius/gap` = 12/8/12; prefer flat `surface` fill over muted color-mix shells.

## Validation

| Check | Command |
| --- | --- |
| Targeted | `bunx vitest run test/foundations/geometry.test.ts test/components/overlays/drawer.test.ts test/patterns/` |
| Full | `bun run verify` |
| Pixels | `bun run baselines:regen` |
