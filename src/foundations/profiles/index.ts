export {
  boxDefaultDesignProfile,
  compactNeutralDesignProfile,
  registerBuiltInDesignProfiles,
} from "./built-ins.js";
export {
  DEFAULT_DESIGN_PROFILE_STORAGE_KEY,
  DESIGN_PROFILE_CHANGE_EVENT,
  createDesignProfileController,
} from "./controller.js";
export {
  DESIGN_PROFILE_VARIABLES,
  applyDesignProfile,
  createDesignProfileStyleText,
  getDesignProfile,
  listDesignProfiles,
  registerDesignProfile,
  resolveDesignProfileProperties,
} from "./registry.js";
export type {
  ApplyDesignProfileOptions,
  DesignProfileChangeDetail,
  DesignProfileController,
  DesignProfileControllerOptions,
  DesignProfileDefinition,
  DesignProfileDensity,
  DesignProfileElevation,
  DesignProfileMotion,
  DesignProfileRadius,
  DesignProfileSpacing,
  DesignProfileTypography,
} from "./types.js";
