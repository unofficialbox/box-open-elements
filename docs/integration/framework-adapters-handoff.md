# Framework adapters handoff

Updated: 2026-07-31

## Current state

| Framework | Completion | Status | Evidence |
| --- | ---: | --- | --- |
| React 19 | **90%** | Release candidate | Publishable package; typed wrappers; controller hook; Next.js SSR/hydration fixture; release workflow |
| Angular 20 | **90%** | Release candidate | Standalone typed directives; signal bridge; strict app; server-safe import |
| Vue 3 | **90%** | Release candidate | Typed wrappers; composable; SSR test; production app |
| Svelte 5 | **90%** | Release candidate | Typed wrappers; readable store; SSR fixture; production app |

Percentages represent support-milestone completion: Tracked 0%, PoC 20%,
Validated 40%, Beta 70%, Release candidate 90%, and Supported 100%. They do not
measure catalog wrapper coverage.

`bun run verify` now compiles and builds all four validation apps after the
core typecheck, coverage suite, and library build. Generated output is isolated
under `.framework-validation/`.

## Architecture decisions

- Core remains framework-free.
- React wrappers cover demonstrated JSX event/property/ref gaps.
- React controller integration uses `useSyncExternalStore`; controller state
  and mutations remain in `ExplorerSelectionController`.
- Angular, Vue, and Svelte stay on direct custom-element consumption until a
  typed adapter is imported; all runtime behavior remains in the custom
  elements and shared controllers.
- All four adapters use the same version and release tag. `adapters:version`
  blocks drift before build or publication.

## Browser QA findings resolved

- React wrapper imports were previously erased when element classes were used
  only as TypeScript types. Each wrapper now calls the element's idempotent
  `register()` method at runtime, so optimized production bundles upgrade the
  host elements.
- The Angular fixture had the same type-only-import failure for `Select`; its
  runtime registration is now explicit and tested through the rendered app.
- Angular custom events now use explicit DOM subscriptions with teardown;
  combining a same-name `@HostListener` and `@Output` caused recursive routing.
- Vue wrappers expose the actual custom-element instance through a stable
  getter after mount, while property synchronization remains reactive.
- Svelte wrappers use Svelte 5 runes, bindable element refs, direct custom-
  element property binding, and effect-scoped custom-event subscriptions. This
  replaced legacy reactive assignments that compiled but did not synchronize
  reliably in the packaged consumer.

## Remaining work

1. Bootstrap-publish all four adapter packages after merge and configure their
   npm Trusted Publishers for `release-adapters.yml`.
2. Verify clean registry installs, then mark all four adapters Supported.
