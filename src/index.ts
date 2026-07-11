// Core runtime
export { Controller, TypedEventEmitter } from "./core/index.js";
export type { EventMap, Unsubscribe } from "./core/index.js";
export type { JsonSchema } from "./core/json-schema.js";

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
export { boxIconography, boxIconographyAliases } from "./foundations/icons/index.js";

// Components: actions
export * from "./components/actions/button.js";
export * from "./components/actions/button-group.js";
export * from "./components/actions/icon-button.js";
export * from "./components/actions/link-button.js";
export * from "./components/actions/menu.js";
export * from "./components/actions/menu-item.js";

// Components: collections
export * from "./components/collections/pagination.js";

// Components: feedback
export * from "./components/feedback/alert.js";
export * from "./components/feedback/badge.js";
export * from "./components/feedback/empty-state.js";
export * from "./components/feedback/skeleton.js";
export * from "./components/feedback/spinner.js";
export * from "./components/feedback/toast.js";

// Components: forms
export * from "./components/forms/checkbox.js";
export * from "./components/forms/checkbox-group.js";
export * from "./components/forms/combobox.js";
export * from "./components/forms/dropdown.js";
export * from "./components/forms/multi-select.js";
export * from "./components/forms/radio-group.js";
export * from "./components/forms/search-field.js";
export * from "./components/forms/select.js";
export * from "./components/forms/text-area.js";
export * from "./components/forms/text-field.js";

// Components: overlays
export * from "./components/overlays/dialog.js";
export * from "./components/overlays/popover.js";

// Patterns: content explorer (headless blocks, contracts, transport, adapters)
export * from "./patterns/content-explorer/index.js";
