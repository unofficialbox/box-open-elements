# Docs site design

The docs site is styled as an extension of the [Unofficial Box Developer
Community](https://unofficialbox.dev) — warm paper stage, a deep-navy rail and
masthead, editorial condensed display type, and a blue/coral accent pair. This
note records the design language so future changes stay coherent. All behaviour
(catalog, previews, inspectors, prerender, dark mode, deploy) is unchanged; this
is a visual layer.

## Tokens

Defined once at the top of `styles.css` as `--community-*` raw values mapped to
semantic aliases, so the palette shifts in one place and dark mode is a token
override rather than a per-rule sprawl.

| Raw token | Value | Role |
|---|---|---|
| `--community-ink` | `#0b172a` | Deep navy — rail, masthead, inspectors, code, hard borders |
| `--community-blue` | `#0866d9` | Primary accent — links, active states, CTAs |
| `--community-blue-dark` | `#004fb2` | Accent on light surfaces (≥ 4.5:1 text, focus ring) |
| `--community-sky` / `-strong` | `#e9f3ff` / `#d8eaff` | Pale-blue fills — pills, table heads, install chip |
| `--community-paper` | `#f7f2e8` | Warm stage background |
| `--community-white` | `#fffefa` | Card surface |
| `--community-coral` | `#ff6658` | Punk accent — counters, active tab underline, event names |
| `--community-muted` | `#55667c` | Secondary ink |
| `--community-line` | `#172235` | Strong hairline |

Semantic aliases (`--surface-stage/card/rail/sky`, `--ink`, `--ink-soft`,
`--accent`, `--accent-dark`, `--accent-coral`, `--line`, `--line-strong`,
`--edge`, `--focus-ring`, `--card-shadow`, `--card-shadow-ink`) are what the
rules consume. The `:root[data-theme="dark"]` block re-points every alias, so
chrome, cards, tables and prose retheme automatically.

## Layout

- **Masthead** (`.masthead`) — sticky navy bar: `B/` mark + "Box Open Elements",
  Community / npm / GitHub links with `↗` external cues, and the theme toggle.
  56px tall; the rail and stage sit beneath it (`top: 56px`).
- **Rail** (`.rail`) — 272px deep-navy sidebar, always navy in both themes.
  Active item gets a coral inset marker; the active tier tab fills blue. The
  tier tabs use sentence case and content widths — uppercase or equal thirds
  overflow the rail and truncate. Rail scroll is persisted in `sessionStorage`
  so clicking an item (a full page load on the static build) doesn't jump the
  menu back to the top.
- **Stage** (`.stage`) — warm paper. Condensed uppercase `.page-title`, monospace
  `.page-tag` pill, coral-underlined `.stage-tabs`.
- **Landing** (`.home`) — monospace eyebrow, huge condensed hero (ink + blue
  accent), serif lede, offset-shadow CTAs, sky install chip, four numbered cards
  (Foundations / Components / Patterns / Build Alongs) with live counts, and the
  "Community-built. Open source. Punk Rock. 🤘" footer.

## Signature treatments

- **Preview canvas** — white card with a dotted grid background, a hard `--edge`
  border and an offset blue shadow. Content is **centred horizontally** so
  flyout components (tooltip, popover, menu) that anchor a wider surface under
  their trigger stay inside the canvas instead of spilling over the rail.
  Children are width-capped and the canvas contains its own overflow, so a demo
  can never escape the frame. Components should still shrink on their own —
  see "Component responsiveness" below.
- **Inspector panels** — intentionally deep-navy "console" cards in both themes;
  coral event names, sky/blue count chips.
- **Code blocks** — VS Code default dark (Dark+) editor colours on `#1e1e1e`,
  tokenized by `docs-site/highlight.ts` (a small dependency-free lexer covering
  html / ts / css / bash / json, plus a `mixed` mode for Vue and Svelte
  single-file components). Long lines **wrap** (`white-space: pre-wrap`) rather
  than scrolling horizontally. Token classes are `.tok-*`; the palette lives
  next to `pre.code-block` in `styles.css`.
- **Cards** (related / guidance / token / icon) — soft-bordered with small offset
  shadows; guidance cards carry a coral left border.
- **Hard editorial borders** use `--edge` (navy in light, a lighter navy in dark)
  so they stay visible against the dark stage.

## Accessibility

- The spec's coral focus ring fails 3:1 non-text contrast on the paper/sky
  surfaces, so the focus ring is `--focus-ring` (accent-dark `#004fb2`, ≥ 8:1 on
  paper) instead. Coral is used only where it clears contrast (on navy, or as a
  decorative marker paired with text).
- A `.skip-link` jumps to `#stage-body`; the masthead is a real `<header>`/`<nav>`.
- Theme switching is available from the masthead (primary) and the rail footer.
  Both carry `data-theme-toggle`, expose `aria-pressed`, and are kept in sync by
  `applyTheme()` — add `data-theme-toggle` to any new toggle and it just works.
- Focus-visible outlines on every interactive control (rail, tabs, buttons,
  cards, links).

## Responsive

- **≥ 1100px** — full three-region layout.
- **700–1099px** — narrowed rail, single-column preview/inspector and lesson
  layouts.
- **< 700px** — single column; the rail collapses to a scrollable top strip and
  the masthead title is hidden (mark + nav remain).

## Component responsiveness

The canvas contains overflow, but a component that refuses to shrink still
renders badly at narrow widths. Two constraints learned from fixing the content
explorer, worth knowing before adding a pattern:

- **Media queries inside a shadow root measure the viewport, not the host.** A
  narrow component on a wide screen never triggers them, so they can't make a
  component responsive to its own width.
- **`container-type` is not a drop-in replacement.** It makes the host's inline
  size independent of its content, which collapses any component that is
  shrink-to-fit rather than stretched — for example in the preview gallery.
  Likewise `repeat(auto-fit, …)` collapses to one column in those contexts.

What works without a query: give grid tracks **zero floors**
(`minmax(0, 1.4fr)` rather than `minmax(14rem, 1.4fr)`) so columns still size to
their content when the host is free, but compress when it is constrained; add
`min-width: 0` to `:host` so the element may shrink below its content's
min-content width; and let intrinsically wide content (a data table) scroll
inside its own frame rather than pushing its host wider.

## Regenerating screenshots

The restyle changes every docs-site baseline. Regenerate them in the pinned
Playwright container so they stay pixel-comparable with CI:

```
bash tools/preview/container-run.sh 'bun run build && bun tools/preview/docs-site-shots.ts'
```

A `home` baseline was added alongside the existing component/foundation shots.
