/**
 * `@unofficialbox/box-open-elements-react` — optional React wrappers for box-open-elements
 * Web Components. Core stays framework-agnostic; this package is an adapter
 * layer only.
 */

export { createWebComponent, type WebComponentProps } from "./create-web-component.js";
export type { CustomEventHandler, ValueChangedDetail } from "./events.js";
export { Button, type ButtonProps } from "./button.js";
export { Dialog, type DialogProps, type DialogSize } from "./dialog.js";
export { useExplorerSelectionController } from "./explorer-selection.js";
export { Select, type SelectOption, type SelectProps } from "./select.js";
export { TextField, type TextFieldProps } from "./text-field.js";
