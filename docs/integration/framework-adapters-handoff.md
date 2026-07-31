# Framework adapters handoff

Updated: 2026-07-31

## Current state

| Framework | Completion | Status | Evidence |
| --- | ---: | --- | --- |
| React 19 | **90%** | Release candidate | Publishable package; typed wrappers; controller hook; Next.js SSR/hydration fixture; release workflow |
| Angular 20 | **40%** | Validated direct | Strict template compilation and production app build |
| Vue 3 | **40%** | Validated direct | `vue-tsc` and production app build |
| Svelte 5 | **40%** | Validated direct | `svelte-check` and production app build |

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
  tested framework gap justifies a wrapper.

## Browser QA findings resolved

- React wrapper imports were previously erased when element classes were used
  only as TypeScript types. Each wrapper now calls the element's idempotent
  `register()` method at runtime, so optimized production bundles upgrade the
  host elements.
- The Angular fixture had the same type-only-import failure for `Select`; its
  runtime registration is now explicit and tested through the rendered app.

## Remaining work

1. Publish `@unofficialbox/box-open-elements-react` after merge and verify a
   clean install from npm before marking React Supported.
2. Add overlay and controller composition proofs for another framework only if
   product support requires Beta status there.
