// Core runtime
export { Controller, TypedEventEmitter } from "./core/index.js";
export type { EventMap, Unsubscribe } from "./core/index.js";

// Foundations
export {
  DESIGN_SYSTEM_CHANGE_EVENT,
  applyDesignTokens,
  boxDefaultDesignSystem,
  createDesignTokenStyleText,
  getActiveDesignSystem,
  getDesignSystem,
  listDesignSystems,
  registerBoxDefaultDesignSystem,
  registerDesignSystem,
  resolveDesignIcon,
  resolveDesignIllustration,
  resolveDesignSystemTokens,
  setActiveDesignSystem,
} from "./foundations/tokens/index.js";
export type {
  ApplyDesignTokensOptions,
  DesignAssetRenderContext,
  DesignAssetRenderer,
  DesignSystemDefinition,
  DesignTokenMap,
} from "./foundations/tokens/index.js";

// Components
export { BoxButtonElement, defineBoxButtonElement } from "./components/actions/button.js";

// Patterns
export { ExplorerSelectionController } from "./patterns/content-explorer/index.js";
export type {
  ExplorerItem,
  ExplorerItemType,
  ExplorerSelectableItem,
  ExplorerSelectionControllerOptions,
  ExplorerSelectionEvents,
  ExplorerSelectionMode,
  ExplorerSelectionState,
} from "./patterns/content-explorer/index.js";
