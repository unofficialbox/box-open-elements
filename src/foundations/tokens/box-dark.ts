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
  tokens: {
    SurfaceSurface: "#1a2028",
    SurfaceSurfaceHover: "#232b35",
    SurfaceSurfaceSecondary: "#141a21",
    SurfaceSurfaceTertiary: "#2a333e",
    SurfaceSurfaceQuaternary: "#38424f",
    SurfaceSurfaceBrand: "#4596ff",
    SurfaceSurfaceBrandHover: "#5aa4ff",
    SurfaceSurfaceBrandPressed: "#2f80ed",
    SurfaceSearchSurface: "#232b35",
    SurfaceItemSurfaceSelected: "#1b3a5c",
    SurfaceTooltipSurface: "#2f3a47",
    SurfaceStatusSurfaceSuccess: "#2ed58f",
    SurfaceStatusSurfaceError: "#ff5a75",
    SurfaceStatusSurfaceInprogress: "#ffc447",
    SurfaceIllustrationSurfaceBoxNeutral: "#4596ff",
    SurfaceBadgeFoldersharedSurface: "#2486fc",
    SurfaceBadgePdfSurface: "#ff4d5e",
    TextText: "#e6edf3",
    TextTextSecondary: "#9fb0c0",
    TextTextPlaceholder: "#6b7a8a",
    TextTextOnBrand: "#ffffff",
    StrokeStroke: "#2c3742",
    StrokeStrokeHover: "#3d4a58",
  },
  icons: boxDefaultDesignSystem.icons,
  illustrations: boxDefaultDesignSystem.illustrations,
};

export const registerBoxDarkDesignSystem = (
  options: { setActive?: boolean } = {},
): DesignSystemDefinition =>
  registerDesignSystem(boxDarkDesignSystem, options);
