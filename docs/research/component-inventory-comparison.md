# Design System Component Inventory Comparison

This document cross-references the component catalog against the actual component and pattern inventories of seven major public design systems, looking for catalog gaps that the box-ui-elements-only comparison ([upstream-gaps.md](./upstream-gaps.md)) wouldn't surface. The question: what do multiple independent, mature design systems converge on that the 86-component target catalog still has no analog for?

## Method and caveat — read before using this table

- The seven systems compared: Atlassian Design System, Shopify Polaris, GitHub Primer, IBM Carbon, Adobe Spectrum, Microsoft Fluent 2, Google Material Design 3.
- Data combines web search results, reachable GitHub source repos (Atlassian, Polaris, Primer, Fluent 2, Material 3), and general knowledge of these systems; direct documentation-domain access was blocked in the original research session.
- **This is a concept-level comparison, not a verified line-by-line audit.** Re-verify against each system's live documentation before treating any row as a build-queue item.
- **IBM Carbon and Adobe Spectrum rows are low confidence** (see [taxonomy-comparison.md](./taxonomy-comparison.md)).
- `Yes` = clearly named standalone component/pattern. `Partial` = related component exists but scope differs. `—` = not found.

## Concepts present in multiple external systems but not in the catalog

| Concept | This catalog | Atlassian | Polaris | Primer | Carbon *(low-conf.)* | Spectrum *(low-conf.)* | Fluent 2 | Material 3 | Suggested tier |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Chip / Tag** (compact, often removable/selectable token — distinct from the status-only `badge`) | — | Yes (`Tag`) | Yes (`Tag`) | Yes (`Token`, `Label`) | Yes (`Tag`) | Yes (`Tag`) | Yes (`Tag`, `Chip`) | Yes (`Chip` — Assist/Filter/Input/Suggestion variants) | `Component` — feedback or forms, alongside `badge` |
| **Divider / Separator** (a plain rule for grouping sections/list items) | — | Yes | Partial (content/spacing convention) | Yes | Yes | Yes | Yes | Yes | `Component` — small, single-purpose, layout category |
| **Standalone Calendar / date-grid** (full month-grid picker, not bundled inside a text-field trigger) | Partial (`date-field` bundles trigger + popup) | Yes | Yes | Partial | Yes | Yes | Yes | Yes | `Component` — sibling to `date-field` in forms |
| **Tag/token input field** (type-to-add chips inside a text field) | Partial (`combobox`, `multi-select` are adjacent) | Partial | Yes | Yes | Partial | Partial | Yes (`TagPicker`) | Partial | `Component` — forms; pairs with the Chip gap |
| **Coach mark / product tour** (sequenced, numbered onboarding across multiple anchors) | Partial (single-anchor `nudge`/`guide-tooltip` tracked in upstream-gaps) | Yes | Partial | — | Yes | Partial | Yes | Partial | `Pattern` — orchestrates a sequence across anchors |
| **Command palette / omnibox** (keyboard-invoked fuzzy global action launcher) | — | — | — | Yes | — | — | — | — | `Pattern` — weakest precedent (Primer only); deprioritize |
| **Timeline / activity feed** (chronological list of dated events — distinct from fixed `progress-steps`) | — | Partial | — | — | Yes (as a pattern) | — | Partial | Partial | `Pattern` — display-only if fed via props, like insights |
| **Generic comment/thread** (comment list with reply/resolve outside file preview) | Partial (`annotation-thread` is preview-scoped) | — | — | Yes (composed in product UI) | — | — | — | — | evaluate generalizing `annotation-thread` before building a parallel component |

## What this means

- **Chip/Tag and Divider are the strongest, most cross-validated gaps** — present in essentially all seven systems, small in scope, clearly component-tier.
- **Standalone calendar and tag-input field** are close seconds, pairing naturally with existing forms entries.
- **Coach mark/tour, timeline, and command palette** are real patterns elsewhere but with weaker or product-specific precedent; keep on the radar rather than prioritizing.
- These concepts are additive to the upstream box-ui-elements gap list — no overlap.

## Related

- [taxonomy-comparison.md](./taxonomy-comparison.md) — tier naming across the same systems
- [upstream-gaps.md](./upstream-gaps.md) — the box-ui-elements-specific gap analysis
