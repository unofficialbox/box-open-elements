import type {
  ApplyDesignProfileOptions,
  DesignProfileDefinition,
} from "./types.js";

type ProfileSection = Exclude<
  keyof DesignProfileDefinition,
  "name" | "description" | "customProperties"
>;

type ProfileVariableMap = {
  [Section in ProfileSection]: Record<string, `--boe-profile-${string}`>;
};

export const DESIGN_PROFILE_VARIABLES = {
  spacing: {
    unit: "--boe-profile-space-unit",
    space1: "--boe-profile-space-1",
    space2: "--boe-profile-space-2",
    space3: "--boe-profile-space-3",
    space4: "--boe-profile-space-4",
    space5: "--boe-profile-space-5",
    space6: "--boe-profile-space-6",
    space8: "--boe-profile-space-8",
    space10: "--boe-profile-space-10",
    space12: "--boe-profile-space-12",
  },
  radius: {
    size: "--boe-profile-radius-size",
    medium: "--boe-profile-radius-medium",
    large: "--boe-profile-radius-large",
    xlarge: "--boe-profile-radius-xlarge",
    control: "--boe-profile-radius-control",
    field: "--boe-profile-radius-field",
    nav: "--boe-profile-radius-nav",
    pill: "--boe-profile-radius-pill",
  },
  density: {
    panelPadding: "--boe-profile-panel-padding",
    panelGap: "--boe-profile-panel-gap",
    overlayPadding: "--boe-profile-overlay-padding",
    overlayItemPadding: "--boe-profile-overlay-item-padding",
    overlayItemMinHeight: "--boe-profile-overlay-item-min-height",
    modalPadding: "--boe-profile-modal-padding",
    modalWidth: "--boe-profile-modal-width",
    drawerWidth: "--boe-profile-drawer-width",
    controlHeight: "--boe-profile-control-height",
    controlHeightLarge: "--boe-profile-control-height-large",
    controlPaddingInline: "--boe-profile-control-padding-inline",
    inputPadding: "--boe-profile-input-padding",
    selectHeight: "--boe-profile-select-height",
    disabledOpacity: "--boe-profile-disabled-opacity",
  },
  typography: {
    fontFamilyBase: "--boe-profile-font-family-base",
    controlFontSize: "--boe-profile-control-font-size",
    controlLetterSpacing: "--boe-profile-control-letter-spacing",
    modalTitleSize: "--boe-profile-modal-title-size",
  },
  elevation: {
    panel: "--boe-profile-shadow-panel",
    overlay: "--boe-profile-shadow-overlay",
    modal: "--boe-profile-shadow-modal",
    inputInset: "--boe-profile-shadow-input-inset",
    primaryFocus: "--boe-profile-shadow-primary-focus",
  },
  motion: {
    fast: "--boe-profile-motion-fast",
    interactive: "--boe-profile-motion-interactive",
    medium: "--boe-profile-motion-medium",
    slow: "--boe-profile-motion-slow",
    spin: "--boe-profile-motion-spin",
    shimmer: "--boe-profile-motion-shimmer",
    easingStandard: "--boe-profile-easing-standard",
    easingEnter: "--boe-profile-easing-enter",
    easingExit: "--boe-profile-easing-exit",
    easingLinear: "--boe-profile-easing-linear",
  },
} as const satisfies ProfileVariableMap;

const designProfiles = new Map<string, DesignProfileDefinition>();

export const resolveDesignProfileProperties = (
  definition: DesignProfileDefinition,
): Record<string, string> => {
  const properties: Record<string, string> = {};

  for (const [sectionName, variableMap] of Object.entries(DESIGN_PROFILE_VARIABLES)) {
    const section = definition[sectionName as ProfileSection] as
      | Record<string, string>
      | undefined;
    if (!section) {
      continue;
    }

    for (const [propertyName, value] of Object.entries(section)) {
      const variableName = variableMap[propertyName as keyof typeof variableMap];
      if (variableName && value !== undefined) {
        properties[variableName] = value;
      }
    }
  }

  for (const [variableName, value] of Object.entries(definition.customProperties ?? {})) {
    if (properties[variableName] !== undefined) {
      throw new Error(
        `Design profile property "${variableName}" was provided by both the typed schema and customProperties`,
      );
    }
    properties[variableName] = value;
  }

  return properties;
};

export const registerDesignProfile = (
  definition: DesignProfileDefinition,
): DesignProfileDefinition => {
  designProfiles.set(definition.name, definition);
  return definition;
};

export const getDesignProfile = (
  name: string | null | undefined,
): DesignProfileDefinition | null =>
  name ? designProfiles.get(name) ?? null : null;

export const listDesignProfiles = (): DesignProfileDefinition[] =>
  Array.from(designProfiles.values());

const resolveDefinition = (
  profileOrName: DesignProfileDefinition | string,
): DesignProfileDefinition => {
  if (typeof profileOrName !== "string") {
    return profileOrName;
  }

  const definition = getDesignProfile(profileOrName);
  if (!definition) {
    throw new Error(`Unknown design profile: ${profileOrName}`);
  }
  return definition;
};

export const applyDesignProfile = (
  target: HTMLElement,
  profileOrName: DesignProfileDefinition | string,
): string[] => {
  const properties = resolveDesignProfileProperties(resolveDefinition(profileOrName));

  for (const [name, value] of Object.entries(properties)) {
    target.style.setProperty(name, value);
  }

  return Object.keys(properties);
};

export const createDesignProfileStyleText = (
  profileOrName: DesignProfileDefinition | string,
  options: ApplyDesignProfileOptions = {},
): string => {
  const selector = options.selector ?? ":root";
  const properties = resolveDesignProfileProperties(resolveDefinition(profileOrName));
  const declarations = Object.entries(properties)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");

  return `${selector} {\n${declarations}\n}`;
};
