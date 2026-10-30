# Chart family verification

Local implementation on `feat/chart-family-coverage`, based on main commit `6971b9d0912851309f542b1f94af824e1ad2f7d2`. No commit, push, PR, package version change or publication was performed for this work.

## Scope

Eight new elements: grouped bar, scatter, bubble, area, mixed, pie, radar and polar area. Grouped bars support signed grouped stacks; area supports aligned additive stacks. The existing line chart gains opt-in stepped/monotone interpolation, calendar time axes and separate y axes. Existing categorical line and donut defaults are preserved.

Shared foundations cover finite typed snapshots, axis validation, missingness, bounded rendering, exact paginated tables, inspection distinct from controlled selection, focus continuity and host-owned state. All seven framework examples derive from the same canonical fixtures and controller setup. See [the API and semantic contracts](chart-family.md) and [the Chart.js review](chartjs-design-review.md).

## Completed checks

- Repository `verify`: exit 0 on macOS Node 22.22.0, using npm to execute the unchanged package scripts because this host's Bun subprocess PATH handling failed. All 321 test files and **3,899 tests** passed, including the subsequent separator correction. V8 coverage: statements 90.15%, branches 83.08%, functions 89.91%, lines 90.27%. Generated maps/types, core/adapters, framework builds and SSR checks passed.
- Focused regressions: 52 chart-family tests, plus existing chart and public-entrypoint tests. Cases include signed stacks, overflow, null gaps, interpolation, DST day lengths, leap-month arithmetic, extreme numeric domains, actual-x keyboard matching, controlled selection, focus removal/refresh, exact paging, clipping and malformed radial snapshots.
- Docs/Workshop build, docs typecheck, **603 snippets per framework across all seven frameworks**, bundle budgets and packed consumer checks passed. Packed tests use actual npm archives, DOM-free selective imports, public JSX/types, production consumer builds and native Node SSR. The last subsequent production change was a fifth-series contrast correction; final aggregate builds and rendered checks include it.
- Rendered acceptance: **33 result records** comprising all eight families at 1440px/390px in light/dark plus a dense-data case. Automated WCAG A/AA checks, keyboard selection/reset, host updates, hidden-table laziness, five availability variants, long labels, six-series plot height and mark contrast passed. No page errors or document overflow were recorded.
- Dense source: 100,000 observations, bounded SVG view (369 marks in the measured fixture), 50 exact rows per page. Selection updates were measured separately from source replacement. These are local observations, not a general performance guarantee.
- **56 framework tab and actual clipboard checks** passed: every new family in HTML, React, Angular, Vue, Svelte, Solid and Preact.
- **16 mobile root-text scaling checks** passed: each new family at 390px with root text doubled and quadrupled, without document overflow. This is text-size testing, not native browser zoom.
- After the Mac was unlocked, native Chrome checks at **200% and 400% browser zoom** covered grouped bars, radar, pie and the calendar-time line variant. Actual screenshots showed the enlarged chart/legend/table layouts; keyboard checks covered grouped-bar inspection, Home/End, repeated Enter selection, Escape clearing, exact-table activation with retained focus, and radar legend selection via Tab/Enter. Pie category/value/share rows and the calendar line's UTC scope remained readable using normal vertical scrolling. No additional defect was found in this representative native pass. The original localhost zoom (90%), dark theme and grouped-bar preview were restored. This was representative native coverage, not an all-family/all-state zoom matrix.
- Visual review used actual rendered screenshots, including mobile/wide, light/dark, grouped stacks, calendar line and stacked area. Corrected clipped mixed-chart endpoint bars, wrapping endpoint tick labels, floating-point tick noise and low fifth-series dark-theme contrast. Existing 56 insight baselines remained pixel-identical; 60 new baselines cover the added families and variants.
- Pinned strict screenshot comparison: **212/212 passed** (8 waterfall, 14 gallery, 190 docs). The initial full capture reported five existing-page differences, each 5,515 pixels confined to the same sidebar rectangle (x19–193, y237–504) containing the expanded chart navigation. After reviewing and refreshing those five baselines, the repository's unchanged health/dimension/pixel comparison logic passed against the retained completed captures. No pixel threshold was relaxed and no chart-content baseline was refreshed to hide a failure.
- All three conformance audits passed: geometry 11 conformant with no drift; color 52 conformant/12 accepted with no review items; webapp 24 conformant/1 accepted, geometry 6/6, states 3 conformant/1 accepted, with no missing/review items.

## Limits

- Native Chrome zoom verification was initially blocked by the locked Mac, then completed for the representative cases recorded above after the user unlocked it. Automated 390px rendering and desktop zoom are not physical-phone tests.
- Manual screen-reader verification was not performed. Automated accessibility and keyboard results do not establish spoken announcements.
- Screenshot review establishes the implementation's observed hierarchy, legibility and layout; aesthetic acceptance remains the user's review decision.
- No new chart-specific runtime dependency was introduced. No npm release is required to review this local implementation.

## Pie/donut separator follow-up

The user identified tapered gaps caused by angular padding. Both forms now retain their full sector angles and draw 1.5 CSS-pixel non-scaling dividers, clipped to the outer circle and donut cutout. Six added regressions cover adjacent half-circle boundaries, fixed divider width, complete circles without false seams, unclassified remainders and independent clip references for multiple instances.

The 93 focused chart tests and typecheck passed, followed by the full 3,899-test aggregate and framework/SSR validation. Eight additional rendered checks covered both forms at 1440px/390px in light/dark, verifying computed divider width and no document overflow. Native Chrome screenshots confirmed the geometry. The pinned capture/accessibility/interaction run completed all 116 insight images: only the eight expected pie/donut images changed, with the other 108 pixel-identical. Those eight reviewed baselines were refreshed without changing screenshot thresholds. Follow-up logs are `/tmp/boe-separators-verify.log` and `/tmp/boe-separators-shots.log`; review screenshots are in `.regression-tmp/separators/`.

## Review artifacts

Repository baseline candidates are in `docs/screenshots/docs-site/insights-*.png`; new names identify the chart family or variant. The local interactive preview is `http://localhost:4605/#patterns/grouped-bar-chart` while the owned preview server is running. Acceptance screenshots and machine-readable results are retained at `/tmp/boe-chart-family-validation/.regression-tmp/chart-family/`.

Validation logs: `/tmp/boe-chart-family-final-verify.log`, `/tmp/boe-chart-family-final-build.log`, `/tmp/boe-chart-family-browser.log`, `/tmp/boe-chart-family-pixel-final.log` (initial capture and five sidebar differences), and `/tmp/boe-chart-family-pixel-comparison.log` (reviewed final comparison and conformance).

## Publication for review

The previously local implementation is now in [draft PR #613](https://github.com/unofficialbox/box-open-elements/pull/613), with current main's distribution-timeline presentation and interaction changes retained. Counts above record their original checkpoints; post-integration results are in [the animation verification follow-up](chart-animation-verification.md) and the PR. No package version, release or merge was performed.
