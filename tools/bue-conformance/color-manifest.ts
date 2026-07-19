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

/** Match a rule by selector + interaction state (`partMatches` semantics). */
export interface CompiledUpstreamRule {
  selector: string;
  state: State;
  property: string;
  /** Nth matching declaration; defaults to 0. */
  index?: number;
  rawSelector?: never;
}

/**
 * Match a rule by a verbatim compound selector — for upstream rules with child
 * combinators / pseudo-elements that `partMatches` rejects (e.g. the custom
 * checkbox/radio marks `.checkbox-label>input[type=checkbox]+span::after`).
 */
export interface RawUpstreamRule {
  rawSelector: string;
  property: string;
  index?: number;
  selector?: never;
  state?: never;
}

/** Either a selector+state rule or a verbatim compound-selector rule. */
export type UpstreamRule = CompiledUpstreamRule | RawUpstreamRule;

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
const CHECKBOX = "src/components/forms/checkbox.ts";
const RADIO = "src/components/forms/radio-group.ts";
const TOOLTIP = "src/components/overlays/tooltip.ts";
const AVATAR = "src/components/identity/avatar.ts";
const PILL_CLOUD = "src/components/forms/pill-cloud.ts";
const TAG_INPUT = "src/components/forms/tag-input.ts";
const SPINNER = "src/components/feedback/spinner.ts";
const FIELDSET = "src/components/forms/fieldset.ts";
const SEARCH_FIELD = "src/components/forms/search-field.ts";
const TEXT_AREA = "src/components/forms/text-area.ts";
const SWITCH = "src/components/forms/switch.ts";
const DATE_FIELD = "src/components/forms/date-field.ts";
const CALENDAR = "src/components/forms/calendar.ts";
const DROPDOWN = "src/components/forms/dropdown.ts";
const MENU = "src/components/actions/menu.ts";

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
    boeAnchor: "background: var(--boe-token-surface-surface-brand-hover, #006ae9)",
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
    boeAnchor: "background: var(--boe-token-surface-surface-brand-pressed, #004eac)",
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
  {
    id: "badge.status.text",
    surface: "badge/status",
    boeConst: "badge.ts status tone text",
    boeValue: "#ffffff",
    kind: "color",
    boeComponent: BADGE,
    boeAnchor: "color: #ffffff",
    upstream: { selector: ".badge-success", state: "base", property: "color" },
    tolerance: 0,
    citation: ".badge-success color",
  },

  // === Menu item selected (box-menu-item[data-selected]) ↔ `.menu-item.is-active` ===
  {
    id: "menu.item.selected.background",
    surface: "menu/item",
    boeConst: "SurfaceItemSurfaceSelected",
    boeValue: T.SurfaceItemSurfaceSelected,
    kind: "color",
    boeComponent: MENU_ITEM,
    boeAnchor: "background: var(--boe-token-surface-item-surface-selected, #f2f7fd)",
    upstream: { selector: ".menu-item.is-active", state: "base", property: "background-color" },
    tolerance: 0,
    citation: ".menu-item.is-active background-color",
  },

  // === Checkbox / radio checked mark (box-checkbox / box-radio-group) ===
  {
    id: "checkbox.checked.accent",
    surface: "checkbox",
    boeConst: "SurfaceSurfaceBrand",
    boeValue: T.SurfaceSurfaceBrand,
    kind: "color",
    boeComponent: CHECKBOX,
    boeAnchor: "accent-color: var(--boe-token-surface-surface-brand, #0061d5)",
    // Upstream draws the check with a brand-coloured border on a pseudo-element.
    upstream: {
      rawSelector: ".checkbox-label>input[type=checkbox]+span::after",
      property: "border-right",
    },
    tolerance: 0,
    citation: ".checkbox-label>input[type=checkbox]+span::after border (checked mark)",
  },
  {
    id: "radio.checked.fill",
    surface: "radio",
    boeConst: "SurfaceSurfaceBrand",
    boeValue: T.SurfaceSurfaceBrand,
    kind: "color",
    boeComponent: RADIO,
    boeAnchor: "border-color: var(--boe-token-surface-surface-brand, #0061d5)",
    upstream: {
      rawSelector: ".radio-label>input[type=radio]:checked+span::before",
      property: "background-color",
    },
    tolerance: 0,
    citation: ".radio-label>input[type=radio]:checked+span::before background-color",
  },

  // === Tooltip text (box-tooltip) ↔ `.bdl-Tooltip` ===
  {
    id: "tooltip.text",
    surface: "tooltip",
    boeConst: "tooltip.ts label colour",
    boeValue: "rgba(255, 255, 255, 0.94)",
    kind: "color",
    boeComponent: TOOLTIP,
    boeAnchor: "color: rgba(255, 255, 255, 0.94)",
    upstream: { selector: ".bdl-Tooltip", state: "base", property: "color" },
    tolerance: 0,
    citation: ".bdl-Tooltip color",
  },

  // === Avatar (box-avatar) ↔ upstream `.avatar .avatar-initials` ===
  // box-open-elements' AVATAR_COLORS palette is an exact ordered match to
  // upstream's `data-bg-idx` generated-colour set; the default (index 0) and the
  // initials text are the two values declared as CSS in the component.
  {
    id: "avatar.background",
    surface: "avatar",
    boeConst: "avatar.ts AVATAR_COLORS[0] (= surface-surface-brand #0061d5)",
    boeValue: "#0061d5",
    kind: "color",
    boeComponent: AVATAR,
    boeAnchor: "background: var(--avatar-bg, #0061d5)",
    upstream: { rawSelector: '.avatar .avatar-initials[data-bg-idx="0"]', property: "background-color" },
    tolerance: 0,
    citation: '.avatar .avatar-initials[data-bg-idx="0"] background-color (default generated avatar fill)',
  },
  {
    id: "avatar.initials.text",
    surface: "avatar",
    boeConst: "avatar.ts initials text colour",
    boeValue: "#ffffff",
    kind: "color",
    boeComponent: AVATAR,
    boeAnchor: "color: #ffffff",
    upstream: { rawSelector: ".avatar .avatar-initials", property: "color" },
    tolerance: 0,
    citation: ".avatar .avatar-initials color (initials over the generated avatar background)",
  },

  // === Pill cloud (box-pill-cloud) ↔ upstream `.bdl-Pill.bdl-PillCloud-button` ===
  {
    id: "pillcloud.pill.background",
    surface: "pill-cloud",
    boeConst: "SurfaceSurface",
    boeValue: T.SurfaceSurface,
    kind: "color",
    boeComponent: PILL_CLOUD,
    boeAnchor: "background: var(--boe-token-surface-surface, #ffffff)",
    upstream: { selector: ".bdl-Pill.bdl-PillCloud-button", state: "base", property: "background-color" },
    tolerance: 0,
    citation: ".bdl-Pill.bdl-PillCloud-button background-color (resting pill fill)",
  },
  {
    id: "pillcloud.pill.brand.border",
    surface: "pill-cloud",
    boeConst: "SurfaceSurfaceBrand",
    boeValue: T.SurfaceSurfaceBrand,
    kind: "color",
    boeComponent: PILL_CLOUD,
    boeAnchor: "border-color: var(--boe-token-surface-surface-brand, #0061d5)",
    // Same brand-blue outline; box-open-elements applies it on selection, upstream
    // renders it on the resting pill — the colour value is what conformance checks.
    upstream: { selector: ".bdl-Pill.bdl-PillCloud-button", state: "base", property: "border" },
    tolerance: 0,
    citation: ".bdl-Pill.bdl-PillCloud-button border (brand outline; box-open-elements on selection, upstream at rest)",
  },

  // === Tag input (box-tag-input) ↔ upstream `.bdl-PillSelector.is-focused` ===
  {
    id: "taginput.control.focus.border",
    surface: "tag-input",
    boeConst: "SurfaceSurfaceBrand",
    boeValue: T.SurfaceSurfaceBrand,
    kind: "color",
    boeComponent: TAG_INPUT,
    boeAnchor: "border-color: var(--boe-token-surface-surface-brand, #0061d5)",
    upstream: {
      rawSelector: ".bdl-PillSelectorDropdown .bdl-PillSelector.is-focused",
      property: "border-color",
    },
    tolerance: 0,
    citation: ".bdl-PillSelectorDropdown .bdl-PillSelector.is-focused border-color (focused pill-entry field)",
  },

  // === Spinner (box-spinner) ↔ upstream `.crawler div` (BUIK loading indicator) ===
  {
    id: "spinner.indicator.brand",
    surface: "spinner/loading",
    boeConst: "SurfaceSurfaceBrand",
    boeValue: T.SurfaceSurfaceBrand,
    kind: "color",
    boeComponent: SPINNER,
    boeAnchor: "border-top-color: var(--boe-token-surface-surface-brand, #0061d5)",
    upstream: { rawSelector: ".crawler div", property: "background-color" },
    tolerance: 0,
    citation: ".crawler div background-color (BUIK loading-indicator bar) ↔ box-open-elements spinner brand arc",
  },

  // === Form label (box-fieldset legend) ↔ upstream `.bdl-Label` ===
  {
    id: "label.text",
    surface: "form/label",
    boeConst: "TextTextSecondary",
    boeValue: T.TextTextSecondary,
    kind: "color",
    boeComponent: FIELDSET,
    boeAnchor: "color: var(--boe-token-text-text-secondary, #6f6f6f)",
    upstream: { selector: ".bdl-Label", state: "base", property: "color" },
    tolerance: 0,
    citation: ".bdl-Label color (BDL form field label) ↔ box-open-elements fieldset label text",
  },

  // === Text inputs (box-search-field / box-text-area) ↔ upstream box-inputs base ===
  {
    id: "text-field.input.text",
    surface: "text-field/input",
    boeConst: "TextText",
    boeValue: T.TextText,
    kind: "color",
    boeComponent: SEARCH_FIELD,
    boeAnchor: "color: var(--boe-token-text-text, #222222)",
    upstream: { rawSelector: "input[type=text]", property: "color" },
    tolerance: 0,
    citation: "input[type=text] (box-inputs base mixin) color — text/search input text colour",
  },
  {
    id: "text-area.textarea.text",
    surface: "text-area",
    boeConst: "TextText",
    boeValue: T.TextText,
    kind: "color",
    boeComponent: TEXT_AREA,
    boeAnchor: "color: var(--boe-token-text-text, #222222)",
    upstream: { rawSelector: "textarea", property: "color" },
    tolerance: 0,
    citation: "textarea (box-inputs base mixin) color — text-area text colour",
  },
  {
    id: "text-area.textarea.focus.border",
    surface: "text-area",
    boeConst: "SurfaceSurfaceBrand",
    boeValue: T.SurfaceSurfaceBrand,
    kind: "color",
    boeComponent: TEXT_AREA,
    boeAnchor: "border-color: var(--boe-token-surface-surface-brand, #0061d5)",
    upstream: { selector: "textarea", state: "focus", property: "border" },
    tolerance: 0,
    citation: "textarea:focus border (box-inputs base mixin) — focus border tracks brand blue",
  },

  // === Switch (box-switch) ↔ upstream `.toggle-simple-switch` pseudo-elements ===
  {
    id: "switch.track.off.background",
    surface: "switch",
    boeConst: "StrokeStrokeHover",
    boeValue: T.StrokeStrokeHover,
    kind: "color",
    boeComponent: SWITCH,
    boeAnchor: "background: var(--boe-token-stroke-stroke-hover, #bcbcbc)",
    upstream: { rawSelector: ".toggle-simple-switch::before", property: "background-color" },
    tolerance: 0,
    citation: ".toggle-simple-switch::before background-color (off/unchecked track fill)",
  },
  {
    id: "switch.track.on.background",
    surface: "switch",
    boeConst: "SurfaceSurfaceBrand",
    boeValue: T.SurfaceSurfaceBrand,
    kind: "color",
    boeComponent: SWITCH,
    boeAnchor: "background: var(--boe-token-surface-surface-brand, #0061d5)",
    upstream: {
      rawSelector: ".toggle-simple-input:checked~.toggle-simple-switch::before",
      property: "background-color",
    },
    tolerance: 0,
    citation:
      ".toggle-simple-input:checked~.toggle-simple-switch::before background-color (on/checked track brand fill)",
  },
  {
    id: "switch.thumb.background",
    surface: "switch",
    boeConst: "SurfaceSurface",
    boeValue: T.SurfaceSurface,
    kind: "color",
    boeComponent: SWITCH,
    boeAnchor: "background: var(--boe-token-surface-surface, #ffffff)",
    upstream: { rawSelector: ".toggle-simple-switch::after", property: "background-color" },
    tolerance: 0,
    citation: ".toggle-simple-switch::after background-color (switch thumb fill)",
  },

  // === Date field / calendar (box-date-field / box-calendar) ↔ upstream date-picker + Pikaday ===
  {
    id: "date-field.description.text",
    surface: "date-field",
    boeConst: "TextTextSecondary",
    boeValue: T.TextTextSecondary,
    kind: "color",
    boeComponent: DATE_FIELD,
    boeAnchor: "color: var(--boe-token-text-text-secondary, #6f6f6f)",
    upstream: { rawSelector: ".date-picker-wrapper .date-picker-description", property: "color" },
    tolerance: 0,
    citation: ".date-picker-wrapper .date-picker-description color (date-picker secondary/help text)",
  },
  {
    id: "calendar.day.selected.background",
    surface: "calendar/day",
    boeConst: "SurfaceSurfaceBrand",
    boeValue: T.SurfaceSurfaceBrand,
    kind: "color",
    boeComponent: CALENDAR,
    boeAnchor: "background: var(--boe-token-surface-surface-brand, #0061d5)",
    upstream: { rawSelector: ".is-selected .pika-button", property: "background-color" },
    tolerance: 0,
    citation: ".is-selected .pika-button background-color (Pikaday selected day) ↔ box-open-elements selected-day brand fill",
  },
  {
    id: "calendar.day.selected.text",
    surface: "calendar/day",
    boeConst: "TextTextOnBrand",
    boeValue: T.TextTextOnBrand,
    kind: "color",
    boeComponent: CALENDAR,
    boeAnchor: "color: var(--boe-token-text-text-on-brand, #ffffff)",
    upstream: { rawSelector: ".is-selected .pika-button", property: "color" },
    tolerance: 0,
    citation: ".is-selected .pika-button color (Pikaday selected day text) ↔ box-open-elements text-on-brand",
  },

  // === Dropdown menu / menu surface (box-dropdown / box-menu) ↔ upstream `.dropdown-menu-element` / `.aria-menu` ===
  {
    id: "dropdown.item.text",
    surface: "dropdown/item",
    boeConst: "TextText",
    boeValue: T.TextText,
    kind: "color",
    boeComponent: DROPDOWN,
    boeAnchor: "color: var(--boe-token-text-text, #222222)",
    upstream: { selector: ".dropdown-menu-element", state: "base", property: "color" },
    tolerance: 0,
    citation: ".dropdown-menu-element color (BUIK DropdownMenu text)",
  },
  {
    id: "menu.surface.background",
    surface: "menu/surface",
    boeConst: "SurfaceSurface",
    boeValue: T.SurfaceSurface,
    kind: "color",
    boeComponent: MENU,
    boeAnchor: "background: var(--boe-token-surface-surface, #ffffff)",
    upstream: { selector: ".aria-menu", state: "base", property: "background-color" },
    tolerance: 0,
    citation: ".aria-menu background-color (BUIK Menu surface fill)",
  },
  {
    id: "menu.surface.border",
    surface: "menu/surface",
    boeConst: "boeOverlay.border (= stroke-stroke)",
    boeValue: T.StrokeStroke,
    kind: "color",
    boeComponent: MENU,
    boeAnchor: "border: ${boeOverlay.border}",
    upstream: { selector: ".aria-menu", state: "base", property: "border" },
    tolerance: 0,
    citation: ".aria-menu border (BUIK Menu surface stroke; boeOverlay.border = stroke-stroke)",
  },
] as const;
