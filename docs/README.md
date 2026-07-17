# Documentation Index

Repo-owned documentation for `box-open-elements`, organized by the [taxonomy](./taxonomy.md): **Foundations → Components → Patterns**.

## Start here

- [Handoff](./HANDOFF.md) — current fidelity-program status for the next agent
- [Agent takeover](./AGENT-TAKEOVER.md) — point-in-time handoff snapshot (see also [CHANGELOG.md](../CHANGELOG.md))
- [Taxonomy](./taxonomy.md) — the canonical tier model and category map
- [Architecture](./architecture.md) — layers, headless-first design, transport boundary, `BaseElement` render contract
- [API Guidelines](./api-guidelines.md) — shared attribute/event/schema vocabulary
- [Roadmap](./roadmap.md) — the phased build-out plan
- [Migration Map](./migration-map.md) — everything in `box-open-web-components` mapped onto this repo

## Audits

- [Component Fidelity Audit](./audits/component-fidelity-audit.md) — original scoring snapshot and completed systemic batch record
- [Audit data](./audits/component-fidelity-audit.data.json) — per-component scores and issues
- [box-ui-elements Conformance Audit](./audits/bue-conformance-audit.md) — geometry claims diffed against real upstream SCSS (`bun run bue-conformance`)

## Foundations

- [Design Tokens](./foundations/tokens.md)
- [Theming](./foundations/theming.md) — register / activate / apply / observe
- [Geometry](./foundations/geometry.md) — BDL space / radius / control-height (BUE-aligned)
- [Motion](./foundations/motion.md) — shared durations, easing, reduced-motion
- [Iconography](./foundations/iconography.md)
- [Box Brand Reference](./foundations/brand.md)
- [Accessibility](./foundations/accessibility.md) — keyboard/ARIA contract + `foundations/a11y` helpers

## Verification

- [Coverage baseline](./coverage-baseline.md) — measured totals + CI floors

## Components

- [Components Catalog](./components/catalog.md) — target inventory by category

## Patterns

- [Patterns Catalog](./patterns/catalog.md) — target inventory by workflow area
- [Content Explorer](./patterns/content-explorer.md) — the headless block model
- [Preview](./patterns/preview.md) — provider adapters and annotation-first priorities

## Integration

- [Box Server Integration](./integration/box-server.md) — the server-side boundary
- [Framework Adapter Progress](./integration/framework-adapters.md) — React, Angular, Vue, and Svelte milestones
- [React Adapter](./integration/react.md) — optional `@box-open-elements/react` wrappers
- [Box Wire Examples](./integration/wire-examples.md) — language-neutral JSON contracts
- [Style Bridge](./integration/style-bridge.md) — third-party CSS/SCSS translation

## Workshop

- [Docs Site Direction](./workshop/docs-site.md) — the component-docs-site shell
- [Storybook](./workshop/storybook.md) — extraction-backend policy
- [Build Alongs](./workshop/build-alongs.md) — microlearning lesson template

## Research

- [Taxonomy Comparison](./research/taxonomy-comparison.md) — tier naming across seven design systems
- [Component Inventory Comparison](./research/component-inventory-comparison.md) — cross-system catalog gaps
- [Upstream Gaps](./research/upstream-gaps.md) — box-ui-elements gap analysis

## Working agreements

- [AGENTS.md](../AGENTS.md) — durable repo rules for humans and AI agents
- [PLANS.md](../PLANS.md) — the ExecPlan standard for multi-session work
- [BACKLOG.md](../BACKLOG.md) — highest-signal open follow-ups
