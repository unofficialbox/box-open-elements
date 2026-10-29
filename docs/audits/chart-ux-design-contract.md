# Chart UX design contract — October 29, 2026

This local implementation follows the user-approved desktop/mobile component
studies, including the revised bar default/selected states, family study and
distribution study. The original Content activity image is the color/theme
reference; its redundant dashboard/sidebar structure is excluded. All seven
Library images were materialized and visually inspected before implementation.

## Locked decisions

- White canvas, deep navy typography, cool gray context, vivid Box blue focal
  marks, pale blue/gray accents and thin rules. Semantic token overrides and
  explicit series tones continue to work in dark themes.
- Title/scope → optional inspection → evidence → optional controls and source.
  Reusable components do not hardcode domain narratives or require a giant KPI.
- Uploads: 42/51/48/64/71 on one zero baseline; latest 71 vs 64 (+7/10.9%).
  Selecting Oct 19 gives 64 vs 48 (+16/33.3%), retains scale/order and adds both
  outline and Selected text. Clear returns to latest. Focus is separate.
- Weekly users are distinct per week, not summed; latest 431 vs 402
  (+29/7.2%), illustrative domain 0–500, straight observed segments and gaps
  for missing intervals.
- Storage is 115/80/55 GB of 250 GB (46/32/22%), not capacity or ranking.
  Static ring and an exact-value table; incomplete classification keeps the
  full denominator and explicitly names the unclassified remainder.
- Stock metric: 1,284 as of Oct 29 vs 1,102 Sep 29 (+182/16.5%), with a visible
  definition. Increase alone remains neutral.
- Distribution: 0–150 ms; Q1–Q3 box, median line, P5–P95 whiskers, visible n.
  The 50 ms illustrative reference applies only to files.upload, not an SLO.
  Narrow layouts place labels over rows. Summary table prioritizes
  median/range/count, with other statistics in native row disclosure.
- Zero is measured zero; missing is not zero. Incomplete comparisons are hidden.
  Cached data has explicit timestamps, loading has blank geometry, and errors
  show no purported observations. No fake retry or drill-down actions.

## Production adaptations

Raster studies are proportions, not fixed component dimensions. Typography and
spacing are reduced to reusable card sizes. Domain copy lives in shared docs/
Workshop fixtures. The examples omit drill-down because no file source exists;
hosts may provide accurately scoped actions using the existing intent events.
The legacy interactive donut remains compatible; the new composition example
opts into readonly mode. Four-column distribution summaries replace the old
wide table while retaining optional numbers in disclosure.

## Separate design and engineering acceptance

The rendered bar default/selection was inspected at an actual 390 CSS px viewport.
A distribution review caught a tooltip covering row labels and a clipped count
column; both were corrected before review capture. A second rendered review caught
neutral metrics inheriting success color, clipped final line labels and
wrapping numeric table columns. Those were corrected too. Enlarged text
retains intact numeric values in keyboard-scrollable table regions. Method/source copy was
moved below the plot, preserving evidence priority. The browser verification matrix also
covers desktop/mobile light/dark, selection/reset, repeated interaction, missing,
partial, stale, empty/loading/error, long labels, dense data, tables, root text
scaling, reduced motion and automated accessibility.

Passing those checks does not constitute user approval of the implementation or
a manual screen-reader pass. Final screenshots and validation results accompany
the local design-review handoff. No publication is authorized in this phase.

## Local verification record

- Base: `84fa58e9ca8d9bdc6510aaff6181ab9cad2b39de`; branch
  `feat/insight-chart-ux`. Implementation remains uncommitted and local.
  The upstream distribution timeline and 0.44.0 release files are preserved.
- `bun run verify`: 318 files, 3,791 tests passed, including coverage,
  generated maps/types, adapter typechecks/builds and framework/SSR validation.
- `bun run site:build` and `bun run docs:typecheck`: passed; 166 Workshop
  stories, production docs and site-artifact checks passed.
- `bun run docs:snippets`: 530 compiled examples per framework; 506 catalog
  variants per framework passed rendered parity, data/slot/lesson-controller
  parity, independent instances and unmount/remount checks at desktop/mobile.
- Chromium and Firefox: 24 chart cases each (six components, two widths,
  two themes), native keyboard selection/reset, repeated interactions,
  data states, tables, missing observations, fixed denominator, reduced
  motion, automated WCAG 2 A/AA checks and 200% root-text reflow passed.
- Geometry/color/webapp conformance audits: zero unresolved drift, review or
  missing anchors. Geometry 11 conformant plus six intentional divergences;
  color 52 conformant plus 12 accepted; webapp 24 conformant plus one accepted.
- Explicit Chromium touch emulation: bar, line, chart-panel and box-plot
  selection/reset/table-toggle flows passed at 390 px.
- `bun tools/preview/regression.ts --pixel`: 124/124 passed at the existing
  0.1% threshold (102 docs, 14 gallery, eight trace captures). Twenty-nine
  intended chart baselines were refreshed. One initial mismatch was solely
  sidebar scroll state from a filtered Box Plot capture; the canonical full-run
  baseline was reviewed and corrected, then the entire strict gate passed.
  No thresholds were relaxed and unrelated baselines were retained.

The review images are actual production-build browser captures. Eighteen selected
light-theme images, the complete Chromium/Firefox capture sets and an HTML review
index are saved beside the repository in `chart-ux-review-2026-10-29/`.
Library upload stopped before preparation with `Library prepare_uploads is not
available`; no files were created in Library and no alternate route was attempted.
All seven input Library references were successfully materialized and visually
inspected. The upload failure does not affect that input coverage.

Manual screen-reader testing is not claimed. Root-text scaling and accessibility
assertions are automated checks. Native browser zoom was subsequently verified
separately as recorded below. Desktop computer-use
review covered bar selection and the mobile distribution issue; the final pixels
were reviewed from actual browser captures after the desktop connection became
unreliable. User design acceptance, committing and publication remain pending.

## Independent design review and native browser zoom follow-up

An independent reviewer inspected actual pixels for all 18 rendered images and
all seven supplied studies. Two P2 findings were confirmed and corrected:

- Mobile line focus/selection targets crowded adjacent dates. The plot now
  reserves each target's width, narrow dates wrap consistently, and selection
  and keyboard focus have separate treatments inside that target.
- Distribution table disclosures were squeezed into the label column, while
  selected statistics repeated below. Disclosures now span all four columns;
  priority values align at the top and table mode has one detailed presentation.

The reviewer re-inspected five fresh desktop/mobile selected-line and table
captures and confirmed both fixes, with no further actionable defect. Generous
chart gutters and mixed one-/two-line mobile bar dates remain non-blocking
spacing/typography preferences for user review. All labels remain readable. This
independent agent review does not constitute user aesthetic acceptance.

Native Google Chrome View → Zoom In and keyboard zoom were exercised through
computer use without new permissions. Chrome's toolbar confirmed 200% and 400%.
All six default charts were checked at 200% dark (756 CSS px viewport) and 400%
light (378 CSS px viewport), with no page overflow. The root font remained 16px;
devicePixelRatio changed from 2 at 100% to 4/8, distinguishing actual browser zoom
from the earlier text-only fixture. Native screenshots and DOM measurements were
used to inspect content and controls. At 400%, line selection/reset was repeated
three times; the default 431-user summary returned. The distribution table's
expanded detail occupied all 270px of table width, priority values stayed intact,
and its selected footer contained only Clear selection. Zoom was restored to
100%, the original local dark theme restored and the isolated QA tab closed.
No VoiceOver, OS setting, security setting or upload-route changes were made.

The line-target correction also constrains its internal grid track, so long
category names wrap within the target rather than enlarging an implicit column.
A targeted rendered regression verifies containment; the normal default/selected
mobile date PNGs remain byte-identical to the reviewer's cleared captures.
Clearing a distribution selection in table mode now restores keyboard focus to
Show chart; the focused BoxPlot tests and browser matrix include that regression.

An extra native 400% long-label/table follow-up after the containment correction
was blocked because the Mac locked. No unlock or security-setting changes were
attempted. Earlier native 200%/400% default-chart coverage completed; the final
containment and keyboard fixes are covered by the Chromium/Firefox harness;
terminal results are recorded in the final handoff.
Manual screen-reader acceptance and user aesthetic acceptance remain pending.

### Final terminal result

The frozen source, including the grid-containment and table-focus corrections,
passed 3,791 tests in 318 files, framework/SSR builds, docs/Workshop builds,
docs typecheck, all seven frameworks' 530 compiled snippets and 506 rendered
catalog variants, both 24-case Chromium/Firefox chart matrices, four Chromium
touch flows, and all 124 strict pixel baselines (102 docs + 14 gallery + eight
trace). The pixel threshold remains 0.1%. Clearing table selection now restores
focus to Show chart. The final 18 review images are unchanged from the cleared
corrective review captures. All work remains local and uncommitted.
