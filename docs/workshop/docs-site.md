# Docs Site Direction

The primary documentation experience for `box-open-elements` is a component-documentation site: browse a catalog by tier and category, open a component, and see its preview states, code, API surface, accessibility notes, live events, and current property values side by side — Box-branded throughout.

The predecessor repo built this shell (through Phase 6 of its docs-site ExecPlan) and the decisions below were validated there.

**Status: v1 shipped** — `docs-site/` implements the rail (three taxonomy tabs, search, counts, version footer), tabbed component pages with live Events/Properties inspectors and runtime-derived API tables, and live tokens/iconography foundations pages (`bun run docs`; tracked by `plans/docs-site-v1-execplan.md`). The component page also has a device-size preview toolbar (Full/Tablet/Mobile) and a Related-links section, and the rail footer has a real dark-mode toggle backed by the `box-dark` token bundle. Landed since v1: the **variant dropdown** (real extracted variants from the storybook workshop `generated/workshop.json`, for the components with authored stories — the intended storybook→docs-site extraction path), **markdown foundation docs in-shell** (Accessibility + Brand pages, plus the token/iconography guides appended to their live pages), **containerized screenshot pixel-diff gating**, a **host-agnostic static build with GitHub Pages deployment** (`bun run site:build`; see Deployment below), and **Usage / Best-practices / Keyboard guidance cards** (see below).

## Deployment

The docs-site ships as a **host-agnostic static build** and deploys to a live URL.

- `bun run site:build` (→ `docs-site/build.ts`) emits `docs-site/dist/`: the bundled app (`main.js`), `styles.css`, `index.html`, and the built library tree under `lib/` (the importmap target — the package boundary is preserved; the deployed app still consumes `box-open-elements` externally). The Storybook **workshop is an internal authoring tool and is not deployed** to the public site; `build.ts` can still bundle it under `workshop/` behind an explicit `--include-workshop` flag if ever wanted.
- The artifact is **host-agnostic**: all asset paths are relative, routing is hash-based (no server rewrites), and the package version is inlined at build time (no `/api/status` endpoint). The same `docs-site/dist` works served from a sub-path (`unofficialbox.github.io/box-open-elements/`) or a domain root.
- **Host: GitHub Pages** via `.github/workflows/deploy.yml` (build → `upload-pages-artifact` → `deploy-pages`) on every push to `main`. One-time setup: enable Pages with **Source = GitHub Actions** in Settings → Pages.
- **Portable to Vercel**: point it at `bun run site:build` with output dir `docs-site/dist` and retire the workflow — no code changes (the only Pages-specific file is `deploy.yml`).

## Visual direction

- Reference points: Linear's website plus AI coding-tool sites (Bolt, Cursor, Lovable, Replit, v0) — calm, light, layered surfaces; compact editorial typography; product-grade density and restraint over marketing-style visual weight. Inspiration for tone and polish, not a mandate to copy branding or layout.
- Box identity inside the shell: Box blue as the primary accent, cool neutral surfaces, official Box wordmark, Box workflow language. No warm beige/orange fallback surfaces unless intentionally semantic.
- **Light is the default theme; dark mode is an explicit, user-selectable opt-in** — never the default.

## Information architecture

- Left rail with three top-level tabs matching the taxonomy: `Foundations`, `Components`, `Patterns`.
  - `Foundations` includes a live token page (swatch grid sourced from the real registered design-system tokens, grouped Surface/Text/Stroke, each swatch showing the CSS custom property and current value) plus brand, iconography, accessibility, theming, and motion guidance.
  - `Components` groups by catalog category with `(N)` item counts on category labels.
  - `Patterns` groups by workflow area, including guided build-along lessons.
- A search/filter box above the tabs; package version and theme toggle in the rail footer.
- Every published component must stay reachable in the sidebar — none may become unreachable as a side effect of any redesign.

## Component pages

- Breadcrumb (e.g. `Components / Forms / Text Field`) plus a copy-link button; navigation writes a `#<tier>/<id>` URL hash so links deep-link back to the same page.
- Four real, mutually exclusive tabs: `Preview`, `Code`, `API` (observed attributes, styling hooks / parts, and `--boe-token-*` references scanned from the primary host shadow styles), `Accessibility` (keyboard interaction plus a link to the shared conventions).
- Preview toolbar: variant select, desktop/tablet/mobile device-size toggle, and a dark-mode toggle scoped to just the preview canvas (independent of the shell theme).
- On the Preview tab: a right-side `Events` panel showing the component's real logged events (bounded history, live badge count, clear action) and a `Properties` panel reflecting the component's actual current attributes live (driven by `observedAttributes` + a `MutationObserver` — the attribute-reflection convention every component follows).
- Below the preview: `Usage`, `Best practices`, `Keyboard`, and `Related` guidance cards, each populated from real data and **omitted when empty**:
  - **Usage** — workshop `shortDescription` / `docsDescription` (storybook surfaces) and/or the curated `examples.ts` `note`
  - **Best practices** / **Keyboard** — bullets from `docs/foundations/accessibility.md` filtered by roles detected in the live preview (plus native interactive semantics when no explicit `role` is set)
  - **Related** — sibling catalog entries in the same category
- The Accessibility tab lists detected roles and the same role-mapped keyboard bullets, with a link to the shared conventions.

## Content rules

- **No invented placeholder content.** Every card, link, token, and variant must point at real existing data or it is not built. (The predecessor's variant dropdown showed only `Default` because no component had real per-variant data — that was correct.)
- Source panel is usage-first: one canonical `HTMLElement` example answering "what do I place in the page?", with TypeScript wiring kept as supplemental detail, not a second live panel. No React/Angular/Vue framework tabs. (Validated by a built-then-removed side-by-side experiment, and consistent with Spectrum, Material Web, and Carbon keeping the simple runnable example on top.)
- Examples must demonstrate real component behavior traceable to implementation, not demo-only decoration.
- Keep the live demo runtime decoupled from the docs contract — the runtime DOM is not the canonical docs source of truth.

## Engineering guardrails

- The docs app imports the library through the package boundary (a single import-boundary module mapping the package name to the built `dist` output), so it reads like a consumer app.
- Screenshot checkpoints + regression comparison are the guardrail for visual drift: capture checkpoints, review diffs, update baselines only deliberately. **Built here**: `bun run preview:capture` / `bun run docs:shots` write the committed baselines under `docs/screenshots/`, and `bun run test:regression` re-captures and gates them. A `visual-regression` CI job runs it.
  - The capture pipeline is **font-deterministic**: it blocks all remote fonts (the InterVariable CDN) and pins the sans + monospace stacks to committed DejaVu faces (`tools/preview/fonts/`) injected as data URIs. Inter stays the runtime font for users; only the screenshot pipeline is pinned.
  - The CI gate is a **strict pixel diff run inside the pinned Playwright container** (`mcr.microsoft.com/playwright:v1.61.1-noble`). Both the committed baselines and the CI check are captured in that one image, so Chromium + FreeType anti-aliasing matches exactly and a tight pixel gate is reliable. `tools/preview/container-run.sh` is the shared entry point — it mounts the repo, installs Bun inside (browsers are pre-baked), and runs the capture/diff; the `visual-regression` CI job invokes the same script. Measured matched-environment run-to-run noise is ~0.007% (a handful of sub-pixel edge pixels), so `MAX_DIFF_RATIO` is set to **0.1%** — ~14× above the noise floor and well below a real visual change (a blue→magenta swap is ~0.5%+). The pixel pass still runs the render-health checks first (capture succeeded, non-blank, dimensions match), so crashes and layout collapse fail fast too.
  - Regenerate baselines with `bun run baselines:regen` (wraps `container-run.sh`) after an intended visual change, review the diff, and commit. Locally you can reproduce the exact CI gate with `bun run test:regression:pixel`.
  - **Render-health mode** (`bun run test:regression`, no `--pixel`) stays available as an environment-independent fallback for machines without Docker: bundled fonts give identical text *metrics* everywhere, so it still catches crashes, blank/broken renders, and layout collapse without needing a matched rendering environment.
- Shell state (active tab, selection, sidebar width, theme) persists across refreshes.

## Real Box connection boundary

The docs site uses mock data by default and currently contains no browser OAuth
flow. A real Box connection must call an app-owned BFF backed by
`packages/box-server` and the stable pattern wire contracts; tokens, CCG
credentials, OAuth client secrets, and impersonation remain server-side. Never
place `BOX_OAUTH_CLIENT_SECRET` or another Box credential in docs-site code,
client-visible environment variables, static build output, or browser storage.
See [Box Server Integration](../integration/box-server.md).
