import type {
  ApplyDesignTokensOptions,
  DesignAssetRenderContext,
  DesignAssetRenderer,
  DesignSystemDefinition,
  DesignTokenMap,
} from "./types.js";

export const DESIGN_SYSTEM_CHANGE_EVENT = "boe:design-system-change";

const DEFAULT_TOKEN_PREFIX = "--boe-token-";

const designSystems = new Map<string, DesignSystemDefinition>();
let activeDesignSystemName: string | null = null;

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
): DesignSystemDefinition => {
  designSystems.set(definition.name, definition);

  if (options.setActive) {
    activeDesignSystemName = definition.name;
    emitDesignSystemChange();
  }

  return definition;
};

export const getDesignSystem = (name: string | null | undefined): DesignSystemDefinition | null => {
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

export const getActiveDesignSystem = (): DesignSystemDefinition | null =>
  activeDesignSystemName ? getDesignSystem(activeDesignSystemName) : null;

export const listDesignSystems = (): DesignSystemDefinition[] =>
  Array.from(designSystems.values());

export const resolveDesignSystemTokens = (name?: string | null): DesignTokenMap => {
  const system = name === undefined ? getActiveDesignSystem() : getDesignSystem(name);
  return system?.tokens ?? {};
};

export const applyDesignTokens = (
  target: HTMLElement,
  tokensOrSystemName?: DesignTokenMap | string | null,
  options: ApplyDesignTokensOptions = {},
): string[] => {
  const prefix = options.prefix ?? DEFAULT_TOKEN_PREFIX;
  const tokens =
    typeof tokensOrSystemName === "string" || tokensOrSystemName == null
      ? resolveDesignSystemTokens(tokensOrSystemName)
      : tokensOrSystemName;

  const appliedVariables: string[] = [];

  for (const [tokenName, tokenValue] of Object.entries(tokens)) {
    const variableName = resolveTokenVariableName(tokenName, prefix);
    target.style.setProperty(variableName, tokenValue);
    appliedVariables.push(variableName);
  }

  return appliedVariables;
};

export const createDesignTokenStyleText = (
  tokensOrSystemName?: DesignTokenMap | string | null,
  options: ApplyDesignTokensOptions = {},
): string => {
  const prefix = options.prefix ?? DEFAULT_TOKEN_PREFIX;
  const selector = options.selector ?? ":root";
  const tokens =
    typeof tokensOrSystemName === "string" || tokensOrSystemName == null
      ? resolveDesignSystemTokens(tokensOrSystemName)
      : tokensOrSystemName;

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
