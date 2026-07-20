# Documentation Index

Repo-owned documentation for `box-open-elements`, organized by the [taxonomy](./taxonomy.md): **Foundations → Components → Patterns**.

## Start here

- [Taxonomy](./taxonomy.md) — the canonical tier model and category map
- [Architecture](./architecture.md) — layers, headless-first design, transport boundary, `BaseElement` render contract
- [API Guidelines](./api-guidelines.md) — shared attribute/event/schema vocabulary
- [CHANGELOG.md](../CHANGELOG.md) — release history

## Foundations

- [Design Tokens](./foundations/tokens.md)
- [Theming](./foundations/theming.md) — register / activate / apply / observe
- [Geometry](./foundations/geometry.md) — BDL space / radius / control-height (BUE-aligned)
- [Motion](./foundations/motion.md) — shared durations, easing, reduced-motion
- [Iconography](./foundations/iconography.md)
- [Box Brand Reference](./foundations/brand.md)
- [Accessibility](./foundations/accessibility.md) — keyboard/ARIA contract + `foundations/a11y` helpers

## Components

- [Components Catalog](./components/catalog.md) — inventory by category

## Patterns

- [Patterns Catalog](./patterns/catalog.md) — inventory by workflow area
- [Content Explorer](./patterns/content-explorer.md) — the headless block model
- [Preview](./patterns/preview.md) — provider adapters and annotation-first priorities

## Integration

- [Using with React, Angular, Vue, and Svelte](./integration/frameworks.md) — setup + working examples per framework
- [Box Server Integration](./integration/box-server.md) — the server-side boundary
- [Framework Adapter Progress](./integration/framework-adapters.md) — React, Angular, Vue, and Svelte milestones
- [React Adapter](./integration/react.md) — optional `@box-open-elements/react` wrappers
- [Box Wire Examples](./integration/wire-examples.md) — language-neutral JSON contracts
- [Style Bridge](./integration/style-bridge.md) — third-party CSS/SCSS translation

## Conformance audits

Conformance against box-ui-elements is enforced in CI and regenerated on demand
(reports write to `docs/audits/`, which is git-ignored — the committed input is
the live-Box reference snapshot `audits/box-webapp-reference.data.json`):

- `bun run bue-conformance` — Layer 1 geometry, diffed against upstream SCSS (strict)
- `bun run bue-conformance:color` — Layer 2 colour/state, diffed against the compiled upstream Storybook CSS (conformant-count floor)
- `bun run bue-conformance:webapp` — colour + geometry + interaction states, diffed against the live Box web app (strict)
