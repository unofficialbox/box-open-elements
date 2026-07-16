# ExecPlan: BUE visual slices — overlays, tabs, feedback

## Purpose / Big Picture

Finish the remaining BUE visual conformance slices after P0 everyday controls: overlay chrome, underline tabs, light notifications/alerts, and compact badge/avatar/error-mask — all keyed off `boeOverlay` + existing geometry tokens.

## Progress

- [x] Branch `cursor/bue-visual-slices-overlays-tabs-feedback-7eb7`
- [x] Extend `boeOverlay` (menu + modal metrics)
- [x] Restyle menu / dropdown / popover / dialog
- [x] Restyle tabs (underline), toast, alert
- [x] Restyle badge, avatar (32px solid), error-mask
- [x] Tests + docs + `bun run verify` + baselines + PR

## Decision Log

- **Source of truth:** BUE SCSS (`Menu`, `Modal`, `Tabs`, `Notification`, `Badge`, `Avatar`, `ErrorMask`, `_inline-notifications`).
- **Tabs:** drop segmented-chip look; keep `layout` attribute but both layouts are underline variants.
- **Toast:** map to BUE `.notification` (light surface + 2px border), not dark tooltip chrome.
- **Avatar:** default size 32; solid `$avatar-colors` fill; white initials.
- **Drawer:** out of this slice (still rem-density shell); follow-up if needed.

## Validation

| Check | Command |
| --- | --- |
| Targeted | `bunx vitest run test/foundations/geometry.test.ts test/components/overlays/ test/components/navigation/tabs.test.ts test/components/feedback/ test/components/identity/avatar.test.ts test/components/actions/menu.test.ts test/components/forms/dropdown.ts` |
| Full | `bun run verify` |
| Pixels | `bun run baselines:regen` |
