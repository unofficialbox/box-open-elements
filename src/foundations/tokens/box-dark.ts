import { registerDesignSystem } from "./registry.js";
import { boxDefaultDesignSystem } from "./box-defaults.js";
import type { DesignSystemDefinition } from "./types.js";

/**
 * Box dark theme. Same token keys, icons, and illustrations as
 * `boxDefaultDesignSystem` — only the surface / text / stroke / status values
 * change, so every component that consumes `--boe-token-*` re-themes with no
 * markup change when this bundle is made active.
 */
export const boxDarkDesignSystem: DesignSystemDefinition = {
  name: "box-dark",
  // Neutral-grey dark surfaces (no blue tint), consistent with the modernized
  // Blueprint neutral palette used by the light default. Box publishes no
  // canonical dark token set, so these are the neutral-dark analogue of it.
  tokens: {
    FontFamilyBase: "InterVariable, Lato, 'Helvetica Neue', Helvetica, Arial, sans-serif",
    SurfaceSurface: "#1c1c1c",
    SurfaceSurfaceHover: "#2a2a2a",
    SurfaceSurfaceSecondary: "#161616",
    SurfaceSurfaceTertiary: "#333333",
    SurfaceSurfaceQuaternary: "#444444",
    SurfaceSurfaceBrand: "#4596ff",
    SurfaceSurfaceBrandHover: "#5aa4ff",
    SurfaceSurfaceBrandPressed: "#2f80ed",
    SurfaceSearchSurface: "#2a2a2a",
    SurfaceItemSurfaceSelected: "#14335a",
    SurfaceTooltipSurface: "#3a3a3a",
    SurfaceStatusSurfaceSuccess: "#2ed58f",
    SurfaceStatusSurfaceError: "#ff5a75",
    SurfaceStatusSurfaceInprogress: "#ffc447",
    SurfaceIllustrationSurfaceBoxNeutral: "#4596ff",
    SurfaceBadgeFoldersharedSurface: "#2486fc",
    SurfaceBadgePdfSurface: "#ff4d5e",
    TextText: "#f4f4f4",
    TextTextSecondary: "#bcbcbc",
    TextTextPlaceholder: "#909090",
    TextTextOnBrand: "#ffffff",
    StrokeStroke: "#3a3a3a",
    StrokeStrokeHover: "#4e4e4e",
  },
  icons: boxDefaultDesignSystem.icons,
  illustrations: boxDefaultDesignSystem.illustrations,
};

export const registerBoxDarkDesignSystem = (
  options: { setActive?: boolean } = {},
): DesignSystemDefinition =>
  registerDesignSystem(boxDarkDesignSystem, options);
