/**
 * `@box-open-elements/react` — optional React wrappers for box-open-elements
 * Web Components. Core stays framework-agnostic; this package is an adapter
 * layer only.
 */

export { createWebComponent, type BoxWebComponentProps } from "./create-web-component.js";
export type { BoxCustomEventHandler, BoxValueChangedDetail } from "./events.js";
export { BoxButton, type BoxButtonProps } from "./button.js";
export { BoxSelect, type BoxSelectOption, type BoxSelectProps } from "./select.js";
export { BoxTextField, type BoxTextFieldProps } from "./text-field.js";
export type { BoxButtonElement } from "../../../src/components/actions/button.js";
export type { BoxSelectElement } from "../../../src/components/forms/select.js";
export type { BoxTextFieldElement } from "../../../src/components/forms/text-field.js";
