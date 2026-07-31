# Framework validation apps

These minimal apps prove that the same `box-*` custom elements work through
React, Angular, Vue, and Svelte without framework-specific code in the core
package.

| App | Validation target |
| --- | --- |
| React 19 | Published-package shape, controlled dialog focus/close behavior, controller subscription |
| React 19 + Next 16 | Server prerendering, browser upgrade, and hydration |
| Angular 20 | `CUSTOM_ELEMENTS_SCHEMA`, property binding, custom events |
| Vue 3 | `isCustomElement`, property binding, custom events |
| Svelte 5 | element refs, structured-property assignment, custom events |

Run every compiler, type checker, and production build:

```bash
bun run build
bun run frameworks:validate
```

The generated apps are written to `.framework-validation/`. They are fixtures
for package integration and browser QA, not alternate component implementations.
