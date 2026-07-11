# Design System Taxonomy Comparison

This document compares how major public design systems name their tiers. It is the research that motivated this repo's **Foundations → Components → Patterns** taxonomy (replacing the previous repo's `Primitives / Composites / Elements`). It was originally produced in `box-open-web-components` while deciding whether upstream `box-ui-elements`' `features` folder deserved a fourth "Features" tier.

## Method and caveat

Research was done via web search and, where reachable, each system's own GitHub source repository — the original sandboxed session's outbound network policy blocked direct fetching of the public documentation domains themselves. That means:

- **Atlassian, Shopify Polaris, GitHub Primer, Microsoft Fluent 2, Google Material Design 3** — cross-checked against a reachable GitHub source repo in addition to search snippets. Treat as reliable.
- **IBM Carbon** — search snippets only. Only the foundation-tier name ("Elements") could be confirmed with confidence; re-verify the rest before relying on it.
- **Adobe Spectrum** — sparse, inconsistent results. Low-confidence sketch; re-check directly before citing.

## Tier-naming comparison

| System | Foundation tier | Component tier | Pattern/workflow tier | Notes |
| --- | --- | --- | --- | --- |
| **This repo** (`box-open-elements`) | `Foundations` (tokens, color, typography, iconography, accessibility, theming, motion) | `Components` | `Patterns` | adopts the majority convention directly |
| **Predecessor** (`box-open-web-components`) | *(none named — tokens lived under a `Tokens` rail tab)* | `Primitives` | `Composites` → `Elements` | the docs-site shell had already regrouped its rail into `Components` / `Patterns` / `Tokens` tabs, prefiguring this repo's taxonomy |
| **Upstream `box/box-ui-elements`** | *(none)* | `src/components` | `src/features` | a flat two-folder split, not a named tier system; `features` mixes real multi-step workflows with Box-internal tooling |
| **Atlassian Design System** | `Foundations` (color, typography, spacing, iconography) | `Components` | `Patterns` | clean three-tier shape, closest structural match |
| **Shopify Polaris** | `Foundations` | `Components` | `Patterns` | also splits `Tokens`, `Icons`, and `Content` into their own top-level nav sections, but the same core shape underneath |
| **GitHub Primer** | `Foundations` | `Components` (under a "Product UI" umbrella) | `Patterns` (same umbrella, plus a separate `Brand` tier for marketing surfaces) | patterns and components are sibling categories under one umbrella |
| **IBM Carbon** *(low confidence)* | called `Elements` (confirmed) | not confirmed | not confirmed | Carbon's foundation tier is itself named "Elements" — the same word the predecessor repo used for its top workflow tier, for an unrelated concept |
| **Adobe Spectrum** *(low confidence)* | unclear | `Components` (referenced, unverified scope) | unclear | insufficient reliable data; do not treat as settled |
| **Microsoft Fluent 2** | `Foundations` | `Components` (per-platform) | *(no distinct tier found)* | no dedicated Patterns section the way Atlassian/Primer have one |
| **Google Material Design 3** | `Foundations` (with a separate `Styles` tier) | `Components` | *(closest analog is `Foundations > Adaptive design > Canonical layouts`)* | only three named canonical layouts; not a general-purpose patterns library |

## Conclusions this repo acts on

- The **foundations → components → patterns** three-tier shape is the majority convention (Atlassian, Polaris, Primer). Fluent 2 and Material 3 are the outliers in *not* having a distinct top-level patterns tier.
- **No surveyed system uses a tier named "Features"** for product-facing, multi-step, orchestration-heavy components. Upstream `box-ui-elements`' `features` folder maps to what this repo calls `Patterns` — not a fourth tier.
- The predecessor repo lacked a first-class Foundations tier (tokens/branding/accessibility were split across a rail tab and scattered docs). This repo fixes that structural gap: `Foundations` is a named tier with its own `src/foundations/` code and `docs/foundations/` guidance.
- IBM Carbon's working definition of patterns — "combinations of components that address common user objectives with sequences and flows" — is adopted as this repo's `Patterns` definition (see [../taxonomy.md](../taxonomy.md)).
- Carbon and Spectrum data is too weak to draw further conclusions. If a future pass needs those systems, re-run the research with direct access to their documentation.

## Related

- [component-inventory-comparison.md](./component-inventory-comparison.md) — component/pattern name inventory across these same systems
- [upstream-gaps.md](./upstream-gaps.md) — the component-level gap analysis against upstream `box/box-ui-elements`
- [../api-guidelines.md](../api-guidelines.md) — this repo's tier model definition
