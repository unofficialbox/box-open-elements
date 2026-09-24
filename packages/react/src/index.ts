/**
 * `@unofficialbox/box-open-elements-react` — optional React wrappers for box-open-elements
 * Web Components. Core stays framework-agnostic; this package is an adapter
 * layer only.
 */

export { createWebComponent, type WebComponentProps } from "./create-web-component.js";
export type { CustomEventHandler, ValueChangedDetail } from "./events.js";
export { Button, type ButtonProps } from "./button.js";
export { Dialog, type DialogProps, type DialogSize } from "./dialog.js";
export {
  ExplorerSelectionController,
  useExplorerSelectionController,
  type ExplorerSelectionState,
} from "./explorer-selection.js";
export { Select, type SelectOption, type SelectProps } from "./select.js";
export { TextField, type TextFieldProps } from "./text-field.js";
export { NumberInput, type NumberInputProps, type NumberInputRef } from "./number-input.js";
export { Checkbox, type CheckboxProps, type CheckboxRef } from "./checkbox.js";
export { Tabs, type TabsProps, type TabsRef } from "./tabs.js";
export { Card, type CardProps, type CardRef } from "./card.js";
export { Alert, type AlertProps, type AlertRef } from "./alert.js";
export { Toast, type ToastProps, type ToastRef } from "./toast.js";
export { Drawer, type DrawerProps, type DrawerRef } from "./drawer.js";
export { CodeBlock, type CodeBlockProps, type CodeBlockRef } from "./code-block.js";
