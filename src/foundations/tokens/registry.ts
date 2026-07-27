import type {
  ApplyDesignTokensOptions,
  DesignAssetRenderContext,
  DesignAssetRenderer,
  DesignSystemDefinition,
  DesignTokenInput,
  DesignTokenMap,
  RegisteredDesignSystemDefinition,
} from "./types.js";

export const DESIGN_SYSTEM_CHANGE_EVENT = "boe:design-system-change";

const DEFAULT_TOKEN_PREFIX = "--boe-token-";

const designSystems = new Map<string, RegisteredDesignSystemDefinition>();
let activeDesignSystemName: string | null = null;

export const SEMANTIC_TOKEN_ALIASES = {
  fontFamilyBase: "FontFamilyBase",
  surfacePrimary: "SurfaceSurface",
  surfacePrimaryHover: "SurfaceSurfaceHover",
  surfaceSecondary: "SurfaceSurfaceSecondary",
  surfaceTertiary: "SurfaceSurfaceTertiary",
  surfaceQuaternary: "SurfaceSurfaceQuaternary",
  surfaceBrand: "SurfaceSurfaceBrand",
  surfaceBrandHover: "SurfaceSurfaceBrandHover",
  surfaceBrandPressed: "SurfaceSurfaceBrandPressed",
  surfaceSearch: "SurfaceSearchSurface",
  surfaceItemSelected: "SurfaceItemSurfaceSelected",
  surfaceItemHover: "SurfaceItemSurfaceHover",
  surfaceTooltip: "SurfaceTooltipSurface",
  surfaceStatusSuccess: "SurfaceStatusSurfaceSuccess",
  surfaceStatusError: "SurfaceStatusSurfaceError",
  surfaceStatusInProgress: "SurfaceStatusSurfaceInprogress",
  surfaceStatusAccent: "SurfaceStatusSurfaceAccent",
  surfaceIllustrationBoxNeutral: "SurfaceIllustrationSurfaceBoxNeutral",
  surfaceBadgeFolderShared: "SurfaceBadgeFoldersharedSurface",
  surfaceBadgePdf: "SurfaceBadgePdfSurface",
  textPrimary: "TextText",
  textSecondary: "TextTextSecondary",
  textPlaceholder: "TextTextPlaceholder",
  textOnBrand: "TextTextOnBrand",
  textDanger: "TextTextDanger",
  borderDefault: "StrokeStroke",
  borderHover: "StrokeStrokeHover",
} as const;

export const normalizeDesignTokens = (
  tokens: DesignTokenInput,
): DesignTokenMap => {
  const normalized: DesignTokenMap = {};
  const sourceNames = new Map<string, string>();

  for (const [tokenName, tokenValue] of Object.entries(tokens)) {
    const canonicalName =
      SEMANTIC_TOKEN_ALIASES[tokenName as keyof typeof SEMANTIC_TOKEN_ALIASES] ??
      tokenName;
    const existingSourceName = sourceNames.get(canonicalName);

    if (existingSourceName && existingSourceName !== tokenName) {
      throw new Error(
        `Design token "${canonicalName}" was provided as both "${existingSourceName}" and "${tokenName}"`,
      );
    }

    normalized[canonicalName] = tokenValue;
    sourceNames.set(canonicalName, tokenName);
  }

  return normalized;
};

const toKebabCase = (value: string): string =>
  value
    .replace(/^--/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();

const emitDesignSystemChange = (): void => {
  if (typeof globalThis.dispatchEvent === "function" && typeof CustomEvent !== "undefined") {
    globalThis.dispatchEvent(
      new CustomEvent(DESIGN_SYSTEM_CHANGE_EVENT, {
        detail: {
          activeDesignSystemName,
        },
      }),
    );
  }
};

const resolveTokenVariableName = (
  tokenName: string,
  prefix = DEFAULT_TOKEN_PREFIX,
): string => {
  if (tokenName.startsWith("--")) {
    return tokenName;
  }

  return `${prefix}${toKebabCase(tokenName)}`;
};

const renderAsset = (
  asset: DesignAssetRenderer | undefined,
  context: DesignAssetRenderContext,
): string | null => {
  if (!asset) {
    return null;
  }

  return typeof asset === "function" ? asset(context) : asset;
};

export const registerDesignSystem = (
  definition: DesignSystemDefinition,
  options: { setActive?: boolean } = {},
): RegisteredDesignSystemDefinition => {
  const normalizedDefinition: RegisteredDesignSystemDefinition = {
    ...definition,
    tokens: definition.tokens
      ? normalizeDesignTokens(definition.tokens)
      : undefined,
  };
  designSystems.set(definition.name, normalizedDefinition);

  if (options.setActive) {
    activeDesignSystemName = definition.name;
    emitDesignSystemChange();
  }

  return normalizedDefinition;
};

export const getDesignSystem = (
  name: string | null | undefined,
): RegisteredDesignSystemDefinition | null => {
  if (!name) {
    return null;
  }

  return designSystems.get(name) ?? null;
};

export const setActiveDesignSystem = (name: string | null): void => {
  if (name && !designSystems.has(name)) {
    throw new Error(`Unknown design system: ${name}`);
  }

  activeDesignSystemName = name;
  emitDesignSystemChange();
};

export const getActiveDesignSystem = (): RegisteredDesignSystemDefinition | null =>
  activeDesignSystemName ? getDesignSystem(activeDesignSystemName) : null;

export const listDesignSystems = (): RegisteredDesignSystemDefinition[] =>
  Array.from(designSystems.values());

export const resolveDesignSystemTokens = (name?: string | null): DesignTokenMap => {
  const system = name === undefined ? getActiveDesignSystem() : getDesignSystem(name);
  return system?.tokens ? normalizeDesignTokens(system.tokens) : {};
};

export const applyDesignTokens = (
  target: HTMLElement,
  tokensOrSystemName?: DesignTokenInput | string | null,
  options: ApplyDesignTokensOptions = {},
): string[] => {
  const prefix = options.prefix ?? DEFAULT_TOKEN_PREFIX;
  const tokens =
    typeof tokensOrSystemName === "string" || tokensOrSystemName == null
      ? resolveDesignSystemTokens(tokensOrSystemName)
      : normalizeDesignTokens(tokensOrSystemName);

  const appliedVariables: string[] = [];

  for (const [tokenName, tokenValue] of Object.entries(tokens)) {
    const variableName = resolveTokenVariableName(tokenName, prefix);
    target.style.setProperty(variableName, tokenValue);
    appliedVariables.push(variableName);
  }

  return appliedVariables;
};

export const createDesignTokenStyleText = (
  tokensOrSystemName?: DesignTokenInput | string | null,
  options: ApplyDesignTokensOptions = {},
): string => {
  const prefix = options.prefix ?? DEFAULT_TOKEN_PREFIX;
  const selector = options.selector ?? ":root";
  const tokens =
    typeof tokensOrSystemName === "string" || tokensOrSystemName == null
      ? resolveDesignSystemTokens(tokensOrSystemName)
      : normalizeDesignTokens(tokensOrSystemName);

  const declarations = Object.entries(tokens)
    .map(([tokenName, tokenValue]) => `  ${resolveTokenVariableName(tokenName, prefix)}: ${tokenValue};`)
    .join("\n");

  return `${selector} {\n${declarations}\n}`;
};

export const resolveDesignIcon = (
  iconName: string,
  systemName?: string | null,
): string | null => {
  const system = systemName === undefined ? getActiveDesignSystem() : getDesignSystem(systemName);
  return renderAsset(system?.icons?.[iconName], { kind: "icon", name: iconName });
};

export const resolveDesignIllustration = (
  illustrationName: string,
  systemName?: string | null,
): string | null => {
  const system = systemName === undefined ? getActiveDesignSystem() : getDesignSystem(systemName);
  return renderAsset(system?.illustrations?.[illustrationName], {
    kind: "illustration",
    name: illustrationName,
  });
};
