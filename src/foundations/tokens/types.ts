export type DesignTokenMap = Record<string, string>;

/**
 * Preferred authoring names for the semantic tokens consumed by the component
 * catalog. The registry translates these names to Box-compatible token keys.
 */
export interface SemanticDesignTokenMap {
  fontFamilyBase?: string;
  surfacePrimary?: string;
  surfacePrimaryHover?: string;
  surfaceSecondary?: string;
  surfaceTertiary?: string;
  surfaceQuaternary?: string;
  surfaceBrand?: string;
  surfaceBrandHover?: string;
  surfaceBrandPressed?: string;
  surfaceSearch?: string;
  surfaceItemSelected?: string;
  surfaceItemHover?: string;
  surfaceTooltip?: string;
  surfaceStatusSuccess?: string;
  surfaceStatusError?: string;
  surfaceStatusInProgress?: string;
  surfaceStatusAccent?: string;
  surfaceIllustrationBoxNeutral?: string;
  surfaceBadgeFolderShared?: string;
  surfaceBadgePdf?: string;
  textPrimary?: string;
  textSecondary?: string;
  textPlaceholder?: string;
  textOnBrand?: string;
  textDanger?: string;
  borderDefault?: string;
  borderHover?: string;
}

export type DesignTokenInput = DesignTokenMap | SemanticDesignTokenMap;

export interface DesignAssetRenderContext {
  kind: "icon" | "illustration";
  name: string;
}

export type DesignAssetRenderer =
  | string
  | ((context: DesignAssetRenderContext) => string);

export interface DesignSystemDefinition {
  name: string;
  tokens?: DesignTokenInput;
  icons?: Record<string, DesignAssetRenderer>;
  illustrations?: Record<string, DesignAssetRenderer>;
}

export interface RegisteredDesignSystemDefinition
  extends Omit<DesignSystemDefinition, "tokens"> {
  tokens?: DesignTokenMap;
}

export interface ApplyDesignTokensOptions {
  prefix?: string;
  selector?: string;
}
