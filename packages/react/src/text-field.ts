import {
  BoxTextFieldElement,
  defineBoxTextFieldElement,
} from "../../../src/components/forms/text-field.js";
import { createWebComponent, type BoxWebComponentProps } from "./create-web-component.js";
import type { BoxCustomEventHandler, BoxValueChangedDetail } from "./events.js";

export type BoxTextFieldProps = BoxWebComponentProps & {
  label?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  invalid?: boolean;
  errorMessage?: string;
  onValueChanged?: BoxCustomEventHandler<BoxTextFieldElement, BoxValueChangedDetail>;
};

/** React wrapper for the value-bearing `<box-text-field>` form control. */
export const BoxTextField = createWebComponent<BoxTextFieldElement, BoxTextFieldProps>({
  tagName: "box-text-field",
  define: defineBoxTextFieldElement,
  displayName: "BoxTextField",
  propertyNames: [
    "label",
    "value",
    "placeholder",
    "disabled",
    "name",
    "invalid",
    "errorMessage",
  ],
  events: [{ propName: "onValueChanged", eventName: "value-changed" }],
  sync: (element, props) => {
    if (props.label !== undefined) {
      element.label = props.label;
    }
    if (props.value !== undefined) {
      element.value = props.value;
    }
    if (props.placeholder !== undefined) {
      element.placeholder = props.placeholder;
    }
    if (props.name !== undefined) {
      element.name = props.name;
    }
    if (props.errorMessage !== undefined) {
      element.errorMessage = props.errorMessage;
    }
    element.disabled = Boolean(props.disabled);
    element.invalid = Boolean(props.invalid);
  },
});
