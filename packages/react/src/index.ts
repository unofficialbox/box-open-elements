/**
 * `@box-open-elements/react` — optional React wrappers for box-open-elements
 * Web Components. Core stays framework-agnostic; this package is an adapter
 * layer only.
 */

export { createWebComponent, type BoxWebComponentProps } from "./create-web-component.js";
export { BoxButton, type BoxButtonProps } from "./button.js";
export type { BoxButtonElement } from "../../../src/components/actions/button.js";
