/**
 * Layer 2 conformance manifest: maps box-open-elements colour / shadow /
 * interaction-state values onto the concrete values box-ui-elements renders in
 * its compiled Storybook CSS.
 *
 * As in Layer 1, the box-open-elements side is **imported, never hand-copied**:
 * colours come from the registered `box-default` design-system tokens
 * (`src/foundations/tokens/box-defaults`) and shadows from control constants
 * (`src/foundations/geometry`). Each claim also carries a `boeAnchor` — a
 * substring that must exist in the named shipped component file — so a claim can
 * never silently drift from the CSS the component actually declares.
 *
 * The upstream side names a compiled rule: a selector, an interaction state
 * (`base` / `hover` / `active` / `focus`), and a property. The value is read
 * from the resolved, post-Sass Storybook CSS — the colour/shadow information
 * that Layer 1 could not resolve from source.
 */
import { boxDefaultDesignSystem } from "../../src/foundations/tokens/box-defaults.js";
import { boeControl } from "../../src/foundations/geometry/index.js";
import type { ColorKind, State } from "./css-extract.js";

const T = boxDefaultDesignSystem.tokens;

/**
 * Public box-ui-elements Storybook. Unlike Layer 1 (pinned to an immutable
 * `raw.githubusercontent` release tag), Layer 2 reads the live compiled CSS —
 * there is no versioned artifact URL for the built Storybook — so the exact
 * bundle hash is discovered at run time from `iframe.html`.
 */
export const STORYBOOK_BASE = "https://opensource.box.com/box-ui-elements";

/** Convert a token key (`SurfaceSurfaceBrandHover`) to its CSS var name body. */
export function tokenToVarName(tokenName: string): string {
  return tokenName
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/** Token map keyed by CSS custom-property name (no `--` prefix) for var() resolution. */
export function buildTokenMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const [key, value] of Object.entries(T)) {
    if (typeof value === "string") {
      map.set(`boe-token-${tokenToVarName(key)}`, value);
    }
  }
  return map;
}

export interface UpstreamRule {
  selector: string;
  state: State;
  property: string;
  /** Nth matching declaration; defaults to 0. */
  index?: number;
}

export interface ColorClaim {
  id: string;
  /** box-open-elements surface / component family. */
  surface: string;
  /** Human label for the box-open-elements source of the value. */
  boeConst: string;
  /** box-open-elements value — imported (a colour, a shadow, or a `var(...)`). */
  boeValue: string;
  kind: ColorKind;
  /** Shipped component file the claim is grounded in (repo-relative). */
  boeComponent: string;
  /** Substring that must exist in `boeComponent` — grounds the claim in source. */
  boeAnchor: string;
  /** Where to read the resolved upstream value in the compiled Storybook CSS. */
  upstream: UpstreamRule;
  /** Allowed per-channel colour delta (0 = exact). Ignored for shadows. */
  tolerance: number;
  /** What box-open-elements maps this onto upstream. */
  citation: string;
}

const BUTTON = "src/components/actions/button.ts";
const MENU_ITEM = "src/components/actions/menu-item.ts";
const BADGE = "src/components/feedback/badge.ts";

export const COLOR_CLAIMS: readonly ColorClaim[] = [
  // === Primary button (box-button, default tone) ↔ upstream `.btn-primary` ===
  {
    id: "button.primary.background",
    surface: "button/primary",
    boeConst: "SurfaceSurfaceBrand",
    boeValue: T.SurfaceSurfaceBrand,
    kind: "color",
    boeComponent: BUTTON,
    boeAnchor: "background: var(--boe-token-surface-surface-brand, #0061d5)",
    upstream: { selector: ".btn-primary", state: "base", property: "background-color" },
    tolerance: 0,
    citation: ".btn-primary background-color",
  },
  {
    id: "button.primary.text",
    surface: "button/primary",
    boeConst: "TextTextOnBrand",
    boeValue: T.TextTextOnBrand,
    kind: "color",
    boeComponent: BUTTON,
    boeAnchor: "color: var(--boe-token-text-text-on-brand, #ffffff)",
    upstream: { selector: ".btn-primary", state: "base", property: "color" },
    tolerance: 0,
    citation: ".btn-primary color",
  },
  {
    id: "button.primary.border",
    surface: "button/primary",
    boeConst: "SurfaceSurfaceBrand",
    boeValue: T.SurfaceSurfaceBrand,
    kind: "color",
    boeComponent: BUTTON,
    boeAnchor: "border: 1px solid var(--boe-token-surface-surface-brand, #0061d5)",
    upstream: { selector: ".btn-primary", state: "base", property: "border-color" },
    tolerance: 0,
    citation: ".btn-primary border-color",
  },
  {
    id: "button.primary.hover.background",
    surface: "button/primary",
    boeConst: "SurfaceSurfaceBrandHover",
    boeValue: T.SurfaceSurfaceBrandHover,
    kind: "color",
    boeComponent: BUTTON,
    boeAnchor: "background: var(--boe-token-surface-surface-brand-hover, #0057c0)",
    upstream: { selector: ".btn-primary", state: "hover", property: "background-color" },
    tolerance: 0,
    citation: ".btn-primary:hover background-color",
  },
  {
    id: "button.primary.active.background",
    surface: "button/primary",
    boeConst: "SurfaceSurfaceBrandPressed",
    boeValue: T.SurfaceSurfaceBrandPressed,
    kind: "color",
    boeComponent: BUTTON,
    boeAnchor: "background: var(--boe-token-surface-surface-brand-pressed, #004eaa)",
    upstream: { selector: ".btn-primary", state: "active", property: "background-color" },
    tolerance: 0,
    citation: ".btn-primary:active background-color",
  },
  {
    id: "button.primary.focus.shadow",
    surface: "button/primary",
    boeConst: "boeControl.primaryFocusShadow",
    boeValue: boeControl.primaryFocusShadow,
    kind: "shadow",
    boeComponent: BUTTON,
    boeAnchor: "box-shadow: ${boeControl.primaryFocusShadow}",
    upstream: { selector: ".btn-primary", state: "focus", property: "box-shadow" },
    tolerance: 0,
    citation: ".btn-primary:focus box-shadow",
  },

  // === Neutral button (box-button[data-tone="neutral"]) ↔ upstream `.btn` ===
  {
    id: "button.neutral.background",
    surface: "button/neutral",
    boeConst: "SurfaceSurface",
    boeValue: T.SurfaceSurface,
    kind: "color",
    boeComponent: BUTTON,
    boeAnchor: "background: var(--boe-token-surface-surface, #ffffff)",
    upstream: { selector: ".btn", state: "base", property: "background-color" },
    tolerance: 0,
    citation: ".btn background-color",
  },
  {
    id: "button.neutral.text",
    surface: "button/neutral",
    boeConst: "TextTextSecondary",
    boeValue: T.TextTextSecondary,
    kind: "color",
    boeComponent: BUTTON,
    boeAnchor: "color: var(--boe-token-text-text-secondary, #6f6f6f)",
    upstream: { selector: ".btn", state: "base", property: "color" },
    tolerance: 0,
    citation: ".btn color",
  },
  {
    id: "button.neutral.border",
    surface: "button/neutral",
    boeConst: "boeControl.buttonBorder",
    boeValue: boeControl.buttonBorder,
    kind: "color",
    boeComponent: BUTTON,
    boeAnchor: "border-color: ${boeControl.buttonBorder}",
    upstream: { selector: ".btn", state: "base", property: "border-color" },
    tolerance: 0,
    citation: ".btn border-color",
  },
  {
    id: "button.neutral.focus.border",
    surface: "button/neutral",
    boeConst: "TextText",
    boeValue: T.TextText,
    kind: "color",
    boeComponent: BUTTON,
    boeAnchor: "border-color: var(--boe-token-text-text, #222222)",
    upstream: { selector: ".btn", state: "focus", property: "border-color" },
    tolerance: 0,
    citation: ".btn:focus border-color",
  },
  {
    id: "button.neutral.hover.background",
    surface: "button/neutral",
    boeConst: "surface-surface 97% + black 3% (color-mix)",
    boeValue: "color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 97%, black 3%)",
    kind: "color",
    boeComponent: BUTTON,
    boeAnchor:
      "background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 97%, black 3%)",
    upstream: { selector: ".btn", state: "hover", property: "background-color" },
    tolerance: 0,
    citation: ".btn:hover background-color",
  },
  {
    id: "button.neutral.active.background",
    surface: "button/neutral",
    boeConst: "surface-surface 92% + black 8% (color-mix)",
    boeValue: "color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, black 8%)",
    kind: "color",
    boeComponent: BUTTON,
    boeAnchor:
      "background: color-mix(in srgb, var(--boe-token-surface-surface, #ffffff) 92%, black 8%)",
    upstream: { selector: ".btn", state: "active", property: "background-color" },
    tolerance: 0,
    citation: ".btn:active background-color",
  },
  {
    id: "button.neutral.focus.shadow",
    surface: "button/neutral",
    boeConst: "button.ts neutral :focus-visible box-shadow",
    boeValue: "0 1px 2px rgb(0 0 0 / 10%)",
    kind: "shadow",
    boeComponent: BUTTON,
    boeAnchor: "box-shadow: 0 1px 2px rgb(0 0 0 / 10%)",
    upstream: { selector: ".btn", state: "focus", property: "box-shadow" },
    tolerance: 0,
    citation: ".btn:focus box-shadow",
  },

  // === Menu item (box-menu-item) ↔ upstream `.menu-item` ===
  {
    id: "menu.item.text",
    surface: "menu/item",
    boeConst: "TextText",
    boeValue: T.TextText,
    kind: "color",
    boeComponent: MENU_ITEM,
    boeAnchor: "color: var(--boe-token-text-text, #222222)",
    upstream: { selector: ".menu-item", state: "base", property: "color" },
    tolerance: 0,
    citation: ".menu-item color",
  },
  {
    id: "menu.item.hover.background",
    surface: "menu/item",
    boeConst: "SurfaceSurfaceHover",
    boeValue: T.SurfaceSurfaceHover,
    kind: "color",
    boeComponent: MENU_ITEM,
    boeAnchor: "background: var(--boe-token-surface-surface-hover, #f4f4f4)",
    upstream: { selector: ".menu-item", state: "hover", property: "background-color" },
    tolerance: 0,
    citation: ".menu-item:hover background-color",
  },

  // === Badge (box-badge) ↔ upstream `.badge` family ===
  {
    id: "badge.text",
    surface: "badge",
    boeConst: "TextText",
    boeValue: T.TextText,
    kind: "color",
    boeComponent: BADGE,
    boeAnchor: "color: var(--boe-token-text-text, #222222)",
    upstream: { selector: ".badge", state: "base", property: "color" },
    tolerance: 0,
    citation: ".badge color",
  },
  {
    id: "badge.neutral.background",
    surface: "badge",
    boeConst: "SurfaceSurfaceSecondary",
    boeValue: T.SurfaceSurfaceSecondary,
    kind: "color",
    boeComponent: BADGE,
    boeAnchor: "background: var(--boe-token-surface-surface-secondary, #f4f4f4)",
    upstream: { selector: ".badge", state: "base", property: "background" },
    tolerance: 0,
    citation: ".badge background",
  },
  {
    id: "badge.success.background",
    surface: "badge/status",
    boeConst: "SurfaceStatusSurfaceSuccess",
    boeValue: T.SurfaceStatusSurfaceSuccess,
    kind: "color",
    boeComponent: BADGE,
    boeAnchor: "background: var(--boe-token-surface-status-surface-success, #26c281)",
    upstream: { selector: ".badge-success", state: "base", property: "background" },
    tolerance: 0,
    citation: ".badge-success background",
  },
  {
    id: "badge.error.background",
    surface: "badge/status",
    boeConst: "SurfaceStatusSurfaceError",
    boeValue: T.SurfaceStatusSurfaceError,
    kind: "color",
    boeComponent: BADGE,
    boeAnchor: "background: var(--boe-token-surface-status-surface-error, #ed3757)",
    upstream: { selector: ".badge-error", state: "base", property: "background" },
    tolerance: 0,
    citation: ".badge-error background",
  },
  {
    id: "badge.inprogress.background",
    surface: "badge/status",
    boeConst: "SurfaceStatusSurfaceInprogress",
    boeValue: T.SurfaceStatusSurfaceInprogress,
    kind: "color",
    boeComponent: BADGE,
    boeAnchor: "background: var(--boe-token-surface-status-surface-inprogress, #f5b31b)",
    upstream: { selector: ".badge-warning", state: "base", property: "background" },
    tolerance: 0,
    citation: ".badge-warning background (box-open-elements inprogress/warning tone)",
  },
  {
    id: "badge.info.background",
    surface: "badge/status",
    boeConst: "surface-surface-brand 50% + #fff (color-mix)",
    boeValue: "color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 50%, #fff)",
    kind: "color",
    boeComponent: BADGE,
    boeAnchor:
      "background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 50%, #fff)",
    // ±1 per channel: the 50/50 sRGB mix lands on #80b0ea (127.5 → 128); upstream
    // authored #7fb0ea (127). Same design intent, sub-perceptual rounding.
    upstream: { selector: ".badge-info", state: "base", property: "background" },
    tolerance: 1,
    citation: ".badge-info background",
  },
] as const;
