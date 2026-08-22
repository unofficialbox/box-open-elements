// Core runtime
export { Controller, TypedEventEmitter } from "./core/index.js";
export type { EventMap, Unsubscribe } from "./core/index.js";
export type { JsonSchema } from "./core/json-schema.js";

// Foundations
export {
  DESIGN_SYSTEM_CHANGE_EVENT,
  SEMANTIC_TOKEN_ALIASES,
  applyDesignTokens,
  boxDarkDesignSystem,
  boxDefaultDesignSystem,
  createDesignTokenStyleText,
  getActiveDesignSystem,
  getDesignSystem,
  listDesignSystems,
  normalizeDesignTokens,
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
  DesignTokenInput,
  DesignTokenMap,
  RegisteredDesignSystemDefinition,
  SemanticDesignTokenMap,
} from "./foundations/tokens/index.js";
export {
  DARK_MODE_MEDIA_QUERY,
  DEFAULT_THEME_STORAGE_KEY,
  THEME_CHANGE_EVENT,
  createThemeController,
  createThemeInitializationScript,
} from "./foundations/theming/index.js";
export type {
  ResolvedTheme,
  ThemeChangeDetail,
  ThemeController,
  ThemeControllerOptions,
  ThemeInitializationScriptOptions,
  ThemePreference,
} from "./foundations/theming/index.js";
export {
  DESIGN_PROFILE_CHANGE_EVENT,
  DESIGN_PROFILE_VARIABLES,
  DEFAULT_DESIGN_PROFILE_STORAGE_KEY,
  applyDesignProfile,
  boxDefaultDesignProfile,
  compactNeutralDesignProfile,
  createDesignProfileController,
  createDesignProfileStyleText,
  getDesignProfile,
  listDesignProfiles,
  registerBuiltInDesignProfiles,
  registerDesignProfile,
  resolveDesignProfileProperties,
} from "./foundations/profiles/index.js";
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
} from "./foundations/profiles/index.js";
export { boxIconography, boxIconographyAliases } from "./foundations/icons/index.js";

// Foundations: viewport-aware overlay positioning (for building custom overlays)
export {
  anchorFloating,
  parsePlacement,
  resolvePosition,
  trackAnchor,
} from "./foundations/overlay/index.js";
export type {
  OverlayAlign,
  OverlayPlacement,
  OverlaySide,
  PositionOptions,
  PositionResult,
} from "./foundations/overlay/index.js";

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
export * from "./components/collections/datalist-item.js";
export * from "./components/collections/draggable-list.js";
export * from "./components/collections/grid-view.js";
export * from "./components/collections/pagination.js";
export * from "./components/collections/table.js";
export * from "./components/collections/thumbnail-card.js";
export * from "./components/collections/tree.js";
export * from "./components/collections/tree-grid.js";

// Components: feedback
export * from "./components/feedback/alert.js";
export * from "./components/feedback/badge.js";
export * from "./components/feedback/badgeable.js";
export * from "./components/feedback/chip.js";
export * from "./components/feedback/due-badge.js";
export * from "./components/feedback/due-types.js";
export * from "./components/feedback/empty-state.js";
export * from "./components/feedback/error-mask.js";
export * from "./components/feedback/help-text.js";
export * from "./components/feedback/nudge.js";
export * from "./components/feedback/progress-bar.js";
export * from "./components/feedback/progress-ring.js";
export * from "./components/feedback/progress-steps.js";
export * from "./components/feedback/skeleton.js";
export * from "./components/feedback/spinner.js";
export * from "./components/feedback/stage-path.js";
export * from "./components/feedback/toast.js";

// Components: files
export * from "./components/files/drop-zone.js";

// Components: identity
export * from "./components/identity/avatar.js";
export * from "./components/identity/persona.js";

// Components: navigation
export * from "./components/navigation/accordion.js";
export * from "./components/navigation/breadcrumb.js";
export * from "./components/navigation/tabs.js";

// Components: visuals
export * from "./components/visuals/illustration.js";

// Components: forms
export * from "./components/forms/checkbox.js";
export * from "./components/forms/color-picker.js";
export * from "./components/forms/dual-listbox.js";
export * from "./components/forms/rating.js";
export * from "./components/forms/rich-text-input.js";
export * from "./components/forms/calendar.js";
export * from "./components/forms/date-field.js";
export * from "./components/forms/number-input.js";
export * from "./components/forms/range-slider.js";
export * from "./components/forms/slider.js";
export * from "./components/forms/spin-button.js";
export * from "./components/forms/switch.js";
export * from "./components/forms/tag-input.js";
export * from "./components/forms/time-field.js";
export * from "./components/forms/category-selector.js";
export * from "./components/forms/checkbox-group.js";
export * from "./components/forms/combobox.js";
export * from "./components/forms/fieldset.js";
export * from "./components/forms/pill-cloud.js";
export * from "./components/forms/pill-selector-dropdown.js";
export * from "./components/forms/dropdown.js";
export * from "./components/forms/multi-select.js";
export * from "./components/forms/radio-group.js";
export * from "./components/forms/search-field.js";
export * from "./components/forms/select.js";
export * from "./components/forms/text-area.js";
export * from "./components/forms/text-field.js";

// Components: layout
export * from "./components/layout/app-shell.js";
export * from "./components/layout/divider.js";
export * from "./components/layout/nav-sidebar.js";
export * from "./components/layout/section.js";
export * from "./components/layout/sidebar-toggle-button.js";
export * from "./components/layout/split-view.js";

// Components: overlays
export * from "./components/overlays/command-palette.js";
export * from "./components/overlays/command-types.js";
export * from "./components/overlays/context-menu.js";
export * from "./components/overlays/shortcuts-overlay.js";
export * from "./components/overlays/dialog.js";
export * from "./components/overlays/drawer.js";
export * from "./components/overlays/guide-tooltip.js";
export * from "./components/overlays/popover.js";
export * from "./components/overlays/tooltip.js";

// Patterns: content explorer (headless blocks, contracts, transport, adapters)
export * from "./patterns/content-explorer/index.js";
export * from "./patterns/content-picker/index.js";
export * from "./patterns/content-uploader/index.js";
export * from "./patterns/content-sidebar/index.js";
export * from "./patterns/form-wizard/index.js";
export * from "./patterns/timeline/index.js";
export * from "./patterns/diff/index.js";
export * from "./patterns/work-queue/index.js";
export * from "./patterns/versions/index.js";
export * from "./patterns/lineage/index.js";
export * from "./patterns/agent-chat/index.js";
export * from "./patterns/audit/index.js";
export * from "./patterns/notifications/index.js";

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
