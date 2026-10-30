# Optional animation verification

Local work on `feat/chart-family-coverage`, based on `6971b9d0912851309f542b1f94af824e1ad2f7d2`. This supplements the earlier [chart family checkpoint](chart-family-verification.md); its historical counts precede animation. No package version, commit, push or publication is part of this checkpoint.

## Coverage

All 17 insight elements expose the [same optional animation contract](chart-animation.md), with static defaults retained. Docs and Workshop provide named entrance, delay, drop and active-mark loop variants, plus progressive/eased line variants and a deterministic dense-line fixture. Every framework derives its example from the same fixture.

The implementation uses browser Web Animations with bounded renderer targets. It preserves exact source values and accessible tables; it does not generate intermediate observations. Direct values fade in as marks settle. Bubble attention uses opacity rather than changing the quantitative area. Layout replacements retain the current clock; rapid or paused source updates settle to the latest snapshot. Reduced motion, hidden documents, native pause/replay controls, disconnect/reconnect and unsupported animation environments have explicit behavior.

The nine user-supplied Chart.js examples were reviewed through their official documentation and the corresponding source. The implementation provides BOE-native motion equivalents. It does not port Chart.js's full per-property engine or add a concentric multi-ring pie data model.

## Checks

- Repository `verify` passed on the final runtime source: **3,943 tests across 322 files**, generated maps/types, typechecks, core and all six adapter builds, framework consumers and SSR. V8 coverage: statements 90.20%, branches 83.24%, functions 89.94%, lines 90.33%. The host uses npm to execute the unchanged scripts through a local Bun shim because Bun subprocess PATH behavior on this checkout failed.
- Focused motion, presentation, ownership and line compatibility checks passed: **116 tests across four files**, including the final direct-label correction.
- Docs/Workshop production artifacts, docs typecheck, **688 compiled snippets per framework across seven frameworks**, and bundle budgets passed in the pinned Linux environment.
- Actual packed artifacts passed public export/type checks, clean consumer install, production builds and native Node SSR on both Linux and macOS. The first native attempt could not write the default npm cache; a writable temporary cache resolved that. The sandboxed install then lacked registry DNS; the bounded network-enabled run passed.
- **68 actual Chromium animation cases passed**: all 17 charts at 1440px/390px, light/dark, plus named presets, native pause/replay, keyboard/pointer active loops, reduced-motion preference changes, interrupted/repeated flows, reconnect and 200%/400% root-text scaling. Automated WCAG A/AA checks found no violations; no page errors or document overflow were recorded.
- The dense stress fixture retained 100,000 source observations while bounding rendering to 369 marks and 369 animation timelines. The local setup-to-first-paint observation was about 773ms under concurrent validation load; this is not a general performance guarantee or a claim to display every source point.
- Reviewed actual first/middle/final mobile dark screenshots for grouped bars, line, pie and radar, plus the drop middle frame. Fixed moving points being stretched, direct labels floating at final coordinates, layout replacement losing timelines, active-loop targeting/replay and repeated live updates restarting entrances. Exact values, denominators and tables remain available throughout.

Earlier completed checks for this implementation include 212 strict screenshot comparisons and all geometry/color/webapp conformance audits. The final animation pass recaptured and accessibility-checked all **116 insight views** in the pinned browser: all were pixel-identical to their retained static baselines (pixelmatch threshold 0.1, zero differing pixels). No motion baseline was refreshed and no comparison threshold changed.

## Artifacts and limits

- Browser harness: `tools/preview/chart-animation.ts`. It exercises actual browser timelines rather than mocked callbacks, across 17 charts, two widths and two themes, plus named presets, dense rendering, keyboard/pointer looping, repeat flows, reduced motion and text scaling.
- Local phase screenshots and machine-readable results: `.regression-tmp/chart-animation/` (ignored). The interactive docs preview is served on `http://127.0.0.1:4600/` while the owned server runs. Choose a named animated preview variant; defaults remain static.
- Native Chrome observation of the Chart.js reference and earlier representative static-chart zoom checks were completed. Further native motion review is blocked by the locked Mac. Isolated Chromium testing is a separate, supported automated browser path.
- Manual screen-reader and physical-device testing were not performed. Automated accessibility checks do not establish spoken announcements.
- Library upload was unavailable in this environment; screenshots are retained locally. User aesthetic acceptance remains separate from automated pass results.

## Final logs

- `/tmp/boe-chart-animation-verify.log` — final aggregate, exit 0.
- `/tmp/boe-chart-animation-compatibility.log` — 116 focused tests, exit 0.
- `/tmp/boe-chart-animation-browser.log` — 68 browser cases and additional flows, exit 0.
- `/tmp/boe-chart-animation-final-pinned.log` — docs, snippets, types, budgets and packed Linux consumer passed; its final capture invocation used an incorrect script filename and exited before capture. The corrected invocation below completed the gate.
- `/tmp/boe-chart-animation-final-shots.log` — corrected repository screenshot command, exit 0.
- `/tmp/boe-chart-animation-final-pixels.json` — 116 images, no differences.
- `/tmp/boe-chart-animation-final-pack.log` — final native packed consumer, exit 0.

## Docs default and centered range follow-up

The docs site now initially selects **Animated entrance**, including the corresponding initial markup, setup and variant note. The static Default variant remains selectable; consumer and Workshop defaults are unchanged.

Range Chart grows horizontally from the midpoint of its bounds. Box Plot grows from the screen-space Q1–Q3 center, using the horizontal or vertical axis as appropriate. Its grid, reference marks, labels and interaction surface remain still. Configured whisker semantics remain unchanged.

- Final runtime `verify`: **3,945 tests / 322 files**, generated maps/types, adapter typechecks/builds and all framework consumer/SSR checks passed. Coverage: 90.20% statements, 83.25% branches, 89.94% functions, 90.33% lines.
- Focused motion/range/box-plot checks: **101 tests** passed, including midpoint keyframes, orientation, origin and stationary-guide assertions.
- Actual browser run: **68 cases**, all named presets and repeated/interrupted flows passed. Each chart's initial docs selection and code were checked. Six additional geometry cases measured collapsed and halfway bounds for range, horizontal box and vertical box at 1440px/390px; both ends moved outward from the same box center. Actual horizontal and vertical phase screenshots were reviewed.
- Docs/Workshop build, docs types and **688 snippets per framework** passed.
- A test-harness route reset was corrected between the new geometry cases and existing line preset cases. No corresponding runtime defect was found.
- Element-capture setup keeps the docs masthead in normal flow, preventing it from covering tall chart screenshots. Application header behavior is unchanged.

Follow-up logs: `/tmp/boe-center-animation-verify.log`, `/tmp/boe-center-animation-focused.log`, `/tmp/boe-center-animation-browser.log`, `/tmp/boe-center-animation-pinned.log`, `/tmp/boe-center-animation-shots.log` and `/tmp/boe-center-animation-box-page.log`. Local/uncommitted status and manual coverage limitations above remain applicable.

The final affected snapshot pass completed **120 captures** (116 insight views plus four Box Plot page/mobile fixtures), with no accessibility violations, page errors or overflow. Reviewed and refreshed **80 intentional baseline changes** for the newly selected animated default and its controls; 40 captures remained unchanged. The statistical meanings, scale and supplied observations were preserved. Contrast checks explicitly finish entrances before measuring the settled result, while the dedicated motion harness verifies intermediate frames. No pixel threshold was relaxed.

## Draft PR integration checkpoint

Implementation is published for review in [draft PR #613](https://github.com/unofficialbox/box-open-elements/pull/613); the earlier local-only statements describe their historical checkpoints. Main commit `193793163db662706f474991893144b0d9bdc14a` (PR #612) is incorporated, preserving the distribution timeline's selection, states, scope and table. Package versions remain unchanged.

Integration adds regression coverage for visual interval-loop targeting, End-key roving focus, disconnect during a queued pulse, and property-only source snapshots in Box Plot/Distribution Timeline. A property data revision avoids serializing large snapshots on every metadata render. The full local integration suite first passed 3,952 tests; final loop-order/lifecycle verification is recorded in the PR.

Docs/Workshop, docs types, **691 snippets per framework** and budgets passed on the integrated source. The complete pinned capture rendered and accessibility-checked all 212 images. Its only strict comparison failure was the Box Plot full-page sidebar's scroll position (11,579 pixels), confined to navigation; chart content was unchanged. The reviewed full-suite image replaces the earlier page-only capture baseline. No thresholds were relaxed. CodeRabbit skipped automatic review because the PR is a draft; a skipped review is not a review pass.

Final integration source passed **3,953 tests / 322 files** and all local aggregate build/type/framework/SSR checks. Roving-key handling now reads the resulting active control after propagation, and deferred inspection callbacks check connection state. The dev server external now uses the current scoped package name, ensuring subsequent compiled-library updates are served rather than retaining a startup-time inlined copy.

## Review remediation before merge

CodeRabbit subsequently reviewed PR #613 and identified three confirmed defects: categorical grouped-bar ticks could use numeric/calendar tick candidates, blank timing strings disabled animation instead of using defaults, and numeric-line paging replaced the focused button. Five regression cases failed before the corrections and passed afterward; the focused chart-family/motion suites passed 107 tests. The duplicate Cartesian reference rows now share one typed descriptor array, without changing generated catalog output. Fresh aggregate and CI outcomes are recorded on the PR before merge; no manual screen-reader pass is implied.

Actual-browser review acceptance passed 20 cases at 1440px/390px in light/dark: unlabelled/conflicting/calendar grouped-bar categories, blank timing with explicit-zero preservation, and repeated table pagination through both boundaries. Pagination focus is retained by the shared redraw path as well as the initiating click, including resize or metadata redraws. Screenshots/results are in the local validation checkout's `.regression-tmp/pr613-review/`; logs are `/tmp/boe-pr613-review-browser.log`, `/tmp/boe-pr613-review-focused.log` and `/tmp/boe-pr613-review-verify.log`. PR CI records the final source's aggregate outcome.
