export type DesignTokenMap = Record<string, string>;

export interface DesignAssetRenderContext {
  kind: "icon" | "illustration";
  name: string;
}

export type DesignAssetRenderer =
  | string
  | ((context: DesignAssetRenderContext) => string);

export interface DesignSystemDefinition {
  name: string;
  tokens?: DesignTokenMap;
  icons?: Record<string, DesignAssetRenderer>;
  illustrations?: Record<string, DesignAssetRenderer>;
}

export interface ApplyDesignTokensOptions {
  prefix?: string;
  selector?: string;
}
