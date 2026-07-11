// Core runtime
export { Controller, TypedEventEmitter } from "./core/index.js";
export type { EventMap, Unsubscribe } from "./core/index.js";
export type { JsonSchema } from "./core/json-schema.js";

// Foundations
export {
  DESIGN_SYSTEM_CHANGE_EVENT,
  applyDesignTokens,
  boxDarkDesignSystem,
  boxDefaultDesignSystem,
  createDesignTokenStyleText,
  getActiveDesignSystem,
  getDesignSystem,
  listDesignSystems,
  registerBoxDarkDesignSystem,
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
export * from "./components/actions/segmented-control.js";
export * from "./components/actions/menu-item.js";

// Components: collections
export * from "./components/collections/card.js";
export * from "./components/collections/carousel.js";
export * from "./components/collections/pagination.js";
export * from "./components/collections/tree.js";
export * from "./components/collections/tree-grid.js";

// Components: feedback
export * from "./components/feedback/alert.js";
export * from "./components/feedback/badge.js";
export * from "./components/feedback/empty-state.js";
export * from "./components/feedback/help-text.js";
export * from "./components/feedback/progress-bar.js";
export * from "./components/feedback/progress-ring.js";
export * from "./components/feedback/progress-steps.js";
export * from "./components/feedback/skeleton.js";
export * from "./components/feedback/spinner.js";
export * from "./components/feedback/toast.js";

// Components: files
export * from "./components/files/drop-zone.js";

// Components: identity
export * from "./components/identity/avatar.js";
export * from "./components/identity/persona.js";

// Components: navigation
export * from "./components/navigation/accordion.js";
export * from "./components/navigation/tabs.js";

// Components: visuals
export * from "./components/visuals/illustration.js";

// Components: forms
export * from "./components/forms/checkbox.js";
export * from "./components/forms/color-picker.js";
export * from "./components/forms/dual-listbox.js";
export * from "./components/forms/rating.js";
export * from "./components/forms/rich-text-input.js";
export * from "./components/forms/date-field.js";
export * from "./components/forms/number-input.js";
export * from "./components/forms/range-slider.js";
export * from "./components/forms/slider.js";
export * from "./components/forms/spin-button.js";
export * from "./components/forms/switch.js";
export * from "./components/forms/time-field.js";
export * from "./components/forms/checkbox-group.js";
export * from "./components/forms/combobox.js";
export * from "./components/forms/dropdown.js";
export * from "./components/forms/multi-select.js";
export * from "./components/forms/radio-group.js";
export * from "./components/forms/search-field.js";
export * from "./components/forms/select.js";
export * from "./components/forms/text-area.js";
export * from "./components/forms/text-field.js";

// Components: layout
export * from "./components/layout/app-shell.js";
export * from "./components/layout/split-view.js";

// Components: overlays
export * from "./components/overlays/dialog.js";
export * from "./components/overlays/drawer.js";
export * from "./components/overlays/popover.js";
export * from "./components/overlays/tooltip.js";

// Patterns: content explorer (headless blocks, contracts, transport, adapters)
export * from "./patterns/content-explorer/index.js";

// Patterns: compositions and workflow areas
export * from "./patterns/search/index.js";
export * from "./patterns/item/index.js";
export * from "./patterns/metadata/index.js";
export * from "./patterns/share/index.js";
export * from "./patterns/preview/index.js";
export * from "./patterns/file-request/index.js";
export * from "./patterns/task/index.js";
export * from "./patterns/governance/index.js";
export * from "./patterns/insights/index.js";
