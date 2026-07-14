# ExecPlan: screenshot-regression gating in CI

Closes the last open cross-cutting track ([roadmap](../docs/roadmap.md),
[workshop/docs-site.md](../docs/workshop/docs-site.md)): wire the existing
screenshot capture tooling into CI so unintended visual/theming drift fails a
check.

## The determinism problem (why this needs care)

A pixel-diff gate only works if the committed baselines render **identically**
in CI. Two sources of nondeterminism today:

1. `docs-site/styles.css` loads `InterVariable` from `cdn01.boxcdn.net`. In
   this sandbox the CDN is blocked, so baselines fall back to the system sans;
   in CI the CDN is reachable, so text would render in real Inter → mismatch.
2. `tools/preview/gallery.html` names `"Inter"` with no `@font-face`, so it
   uses whatever sans the environment has.

Fix: make the **capture pipeline** font-deterministic and network-free —
independent of the CDN and of any environment's system fonts. Inter stays the
runtime font for real users; only screenshot rendering is pinned.

## Deterministic fonts (`tools/preview/fonts/`)

- Bundle DejaVu Sans / Sans-Bold / Sans-Mono (permissive Bitstream-derived
  license, redistributable) + the license file, copied from the system.
- `tools/preview/deterministic-fonts.ts` — shared helper exporting:
  - `blockRemoteFonts(page)` — a Playwright route that aborts requests to font
    CDNs so `InterVariable` never loads.
  - `deterministicFontCss()` — `@font-face` rules that map the sans stack
    (`InterVariable`, `Lato`, `Inter`, `Helvetica Neue`, `Helvetica`, `Arial`)
    and a forced monospace family to the bundled DejaVu files as base64 `data:`
    URIs, plus a `pre, code, [class*="mono"]` monospace override. Injected via
    `addStyleTag` after navigation; wait on `document.fonts.ready`.
- Both capture scripts (`capture.ts`, `docs-site-shots.ts`) call these before
  screenshotting, so baselines are CDN-independent and reproducible anywhere.

## Regression runner (`tools/preview/regression.ts`)

- Re-captures both galleries into a temp dir using the same deterministic
  pipeline, then pixel-diffs each PNG against `docs/screenshots/**` with
  `pixelmatch` (per-pixel threshold ~0.1) + `pngjs`.
- Fails if any image is missing, differs in dimensions, or exceeds a max
  changed-pixel ratio (start ~0.5% to absorb cross-Chromium AA; tune down once
  CI parity is confirmed). Writes diff PNGs + a summary to a temp/artifact dir.
- `bun run test:regression` script; add `pixelmatch` + `pngjs` devDeps.

## CI job (`.github/workflows/ci.yml`)

- New `visual-regression` job (parallel to `verify`): checkout → setup-bun →
  `bun install` → `bunx playwright@<pinned> install --with-deps chromium` →
  `PLAYWRIGHT_CHROMIUM_PATH` set to the installed binary → `bun run build` →
  `bun run test:regression` → on failure `actions/upload-artifact` the diff
  images.

## Baselines

Regenerate all committed screenshots through the deterministic pipeline so the
baseline == what CI produces. (Current baselines already use a fallback sans;
this pins that fallback to the committed DejaVu so it's stable everywhere.)

## Residual risk

Cross-Chromium subpixel/AA differences between this sandbox's browser and CI's
installed Chromium are absorbed by the tolerance. The exact cross-environment
match can only be confirmed by the first CI run; if the tolerance proves too
tight, refresh baselines from the CI artifact once. Documented in the workshop
doc.

## Verify + ship

Local: `bun run docs:shots`/`preview:capture` (regenerate) → `bun run
test:regression` passes against fresh baselines → `bun run verify`. Update
docs-site.md + roadmap to mark the track done. Commit, push, open draft PR.
