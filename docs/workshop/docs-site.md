# Docs Site Direction

The primary documentation experience for `box-open-elements` is a component-documentation site: browse a catalog by tier and category, open a component, and see its preview states, code, API surface, accessibility notes, live events, and current property values side by side — Box-branded throughout.

The predecessor repo built this shell (through Phase 6 of its docs-site ExecPlan) and the decisions below were validated there.

**Status: v1 shipped** — `docs-site/` implements the rail (three taxonomy tabs, search, counts, version footer), tabbed component pages with live Events/Properties inspectors and runtime-derived API tables, and live tokens/iconography foundations pages (`bun run docs`; tracked by `plans/docs-site-v1-execplan.md`). The component page also has a device-size preview toolbar (Full/Tablet/Mobile) and a Related-links section, and the rail footer has a real dark-mode toggle backed by the `box-dark` token bundle. Still open from the full direction: variant dropdown (needs per-variant data), Usage/Best-practices guidance cards (need per-component keyboard docs), markdown foundation docs in-shell, Storybook extraction, screenshot-regression gating.

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
- Four real, mutually exclusive tabs: `Preview`, `Code`, `API` (attributes/events/styling hooks reference), `Accessibility` (keyboard interaction plus a link to the shared conventions).
- Preview toolbar: variant select, desktop/tablet/mobile device-size toggle, and a dark-mode toggle scoped to just the preview canvas (independent of the shell theme).
- On the Preview tab: a right-side `Events` panel showing the component's real logged events (bounded history, live badge count, clear action) and a `Properties` panel reflecting the component's actual current attributes live (driven by `observedAttributes` + a `MutationObserver` — the attribute-reflection convention every component follows).
- Below the preview: `Usage`, `Best practices`, and `Related` guidance cards, each populated from real catalog data.

## Content rules

- **No invented placeholder content.** Every card, link, token, and variant must point at real existing data or it is not built. (The predecessor's variant dropdown showed only `Default` because no component had real per-variant data — that was correct.)
- Source panel is usage-first: one canonical `HTMLElement` example answering "what do I place in the page?", with TypeScript wiring kept as supplemental detail, not a second live panel. No React/Angular/Vue framework tabs. (Validated by a built-then-removed side-by-side experiment, and consistent with Spectrum, Material Web, and Carbon keeping the simple runnable example on top.)
- Examples must demonstrate real component behavior traceable to implementation, not demo-only decoration.
- Keep the live demo runtime decoupled from the docs contract — the runtime DOM is not the canonical docs source of truth.

## Engineering guardrails

- The docs app imports the library through the package boundary (a single import-boundary module mapping the package name to the built `dist` output), so it reads like a consumer app.
- Screenshot checkpoints + regression comparison are the guardrail for visual drift: capture checkpoints, review diffs, update baselines only deliberately. **Built here**: `bun run preview:capture` / `bun run docs:shots` write the committed baselines under `docs/screenshots/`, and `bun run test:regression` re-captures and gates them. A `visual-regression` CI job runs it.
  - The capture pipeline is **font-deterministic**: it blocks all remote fonts (the InterVariable CDN) and pins the sans + monospace stacks to committed DejaVu faces (`tools/preview/fonts/`) injected as data URIs. Inter stays the runtime font for users; only the screenshot pipeline is pinned.
  - The CI gate is **render-health**, not pixel-perfect: for every baseline it fails if the page errored, rendered blank/near-blank, or changed dimensions. This is environment-independent — bundled fonts give identical text *metrics* everywhere, so layout and dimensions match across Chromium builds even though pixel anti-aliasing does not. It catches crashes, blank/broken renders, and layout collapse.
  - Strict **pixel diffing** (`bun tools/preview/regression.ts --pixel`, `pixelmatch`) exists for a matched rendering environment and is used locally, but it is not the CI gate: cross-Chromium sub-pixel AA (0.5–2.6% of pixels) overlaps the magnitude of real small changes, so a pixel gate needs baseline and check to share one environment. **Follow-up**: run capture + `--pixel` inside the pinned Playwright Docker container (`mcr.microsoft.com/playwright:v1.61.x`) for both baseline generation and CI so AA matches, then a tight pixel gate becomes reliable.
  - Regenerate baselines deliberately after an intended visual change and review the diff before committing.
- Shell state (active tab, selection, sidebar width, theme) persists across refreshes.

## Optional Box connection

The docs site uses mock data by default. An optional `.env` OAuth configuration (`BOX_OAUTH_CLIENT_ID`, `BOX_OAUTH_CLIENT_SECRET`, `BOX_OAUTH_REDIRECT_URI`, `BOX_API_BASE_URL`) lets the site connect to a real Box enterprise as the current user, powering the content-explorer path first and falling back to mock data automatically on failure.
