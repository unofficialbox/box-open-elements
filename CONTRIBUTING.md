# Contributing to box-open-elements

Thanks for your interest in contributing! `box-open-elements` is a
framework-agnostic design system and web component library for Box-style
experiences. This guide covers how to set up, develop, test, and submit changes.

## Prerequisites

- [Bun](https://bun.sh) **1.3.11** (the version is pinned in `package.json` via
  `packageManager`). Bun runs the toolchain, tests, and the docs site — no
  Node-based bundler step is required.
- [Docker](https://www.docker.com) — only needed to regenerate visual-regression
  baselines (see below). Day-to-day development does not require it.

## Setup

```bash
git clone https://github.com/unofficialbox/box-open-elements.git
cd box-open-elements
bun install --frozen-lockfile
```

## Everyday commands

| Command | What it does |
| --- | --- |
| `bun run docs` | Build the library and serve the component docs site at `http://localhost:4600` — the fastest way to browse components with live previews. |
| `bun run test` | Run the unit test suite (Vitest). |
| `bun run test:watch` | Watch mode while developing. |
| `bun run typecheck` | Type-check the library and every workspace/tsconfig. |
| `bun run build` | Emit `dist/` (`tsc`). |
| `bun run verify` | **The main safety check** — typecheck + coverage-gated tests + build, in sequence. Run this before opening a PR; CI runs it too. |

## Project structure

The codebase follows the **Foundations → Components → Patterns** taxonomy (see
[`docs/taxonomy.md`](./docs/taxonomy.md)):

- `src/foundations/` — tokens, geometry, motion, iconography, a11y helpers
- `src/components/` — single-purpose custom elements (`<box-button>`, …)
- `src/patterns/` — composed, controller-backed workflow surfaces (content
  explorer, metadata, insights, …)
- `src/core/` — `BaseElement`, `FormAssociatedElement`, the typed event emitter
- `tools/` — conformance audits, the style bridge, iconography generator, preview/regression harness
- `docs-site/` — the component docs site (deployed to https://unofficialbox.github.io/box-open-elements)
- `storybook/` — a Bun-native workshop that extracts typed stories to static JSON

Start with [`docs/architecture.md`](./docs/architecture.md) for the layering and
render contract, and [`docs/api-guidelines.md`](./docs/api-guidelines.md) for the
shared attribute/event/schema vocabulary.

## Component conventions

- **Web components, shadow DOM.** Each element renders into its own shadow root
  and registers via an explicit `defineBoxXElement()` function (no side-effecting
  auto-registration on import).
- **Paint with tokens.** Style shadow trees with `--boe-token-*` custom properties
  and safe hex fallbacks (e.g. `background: var(--boe-token-surface-surface-brand, #0061d5)`).
  Components must render sensibly with no design system registered. See
  [`docs/foundations/tokens.md`](./docs/foundations/tokens.md).
- **Expose structure via `part`s** so consumers can theme with `::part()` instead
  of forking.
- **Accessibility is required** — keyboard and ARIA behavior per
  [`docs/foundations/accessibility.md`](./docs/foundations/accessibility.md).
- **Ship tests.** New components/patterns land with dedicated unit tests. Tests
  are coverage-gated, so `bun run verify` will fail if coverage floors regress.

## box-ui-elements conformance

box-open-elements tracks Box's design language. Three CI-gated audits guard it —
run them if you touch tokens, geometry, or component colour/state:

```bash
bun run bue-conformance          # Layer 1: geometry vs upstream SCSS (strict)
bun run bue-conformance:color    # Layer 2: colour/state vs compiled Storybook CSS (conformant-count floor)
bun run bue-conformance:webapp   # colour + geometry + interaction states vs the live Box web app (strict)
```

The reports write to `docs/audits/` (git-ignored); the committed inputs are the
live-Box reference snapshot and the Storybook-CSS snapshot. If you legitimately
broaden coverage, refresh the relevant snapshot (each audit's `--refresh` flag)
and, for Layer 2, bump the CI floor if the conformant count rose.

## Visual regression

Component previews are pixel-diffed against committed baselines in
`docs/screenshots/` using a pinned Playwright container (so antialiasing matches
CI):

```bash
bun run test:regression:pixel    # strict pixel diff in the pinned container
```

If a change intentionally alters a component's appearance, regenerate the
affected baselines in the **same** container (amd64, matching CI):

```bash
DOCKER_DEFAULT_PLATFORM=linux/amd64 bun run baselines:regen
```

Commit only the baselines your change actually affects — the harness can produce
sub-threshold nondeterministic noise on unrelated screenshots (revert those).

## Submitting changes

1. **Branch** from `main` (`fix/…`, `feat/…`, `chore/…`, `docs/…`).
2. Make your change with tests and run **`bun run verify`** locally.
3. Use clear, [Conventional Commits](https://www.conventionalcommits.org)-style
   messages (`feat(components): …`, `fix(patterns): …`, `docs: …`).
4. Open a pull request. CI must be green — `verify`, `box-ui-elements
   conformance`, and `visual-regression` all run on every PR.
5. PRs are squash-merged, so the PR title becomes the commit message — keep it
   descriptive.

## Releasing

Maintainers: cutting and publishing a release (to npm, as
`@unofficialbox/box-open-elements`) is documented in
[RELEASING.md](./RELEASING.md).

## Reporting issues

Open an issue at
[github.com/unofficialbox/box-open-elements/issues](https://github.com/unofficialbox/box-open-elements/issues)
with steps to reproduce, the expected vs actual behavior, and your environment.

## License

By contributing, you agree that your contributions are licensed under the
project's [MIT License](./LICENSE).
