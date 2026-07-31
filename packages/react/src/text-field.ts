import { TextField as TextFieldElement } from "@unofficialbox/box-open-elements/text-field";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";
import type { CustomEventHandler, ValueChangedDetail } from "./events.js";

TextFieldElement.register();

export type TextFieldProps = WebComponentProps & {
  label?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  invalid?: boolean;
  errorMessage?: string;
  onValueChanged?: CustomEventHandler<TextFieldElement, ValueChangedDetail>;
};

/** React wrapper for the value-bearing `<box-text-field>` form control. */
export const TextField = createWebComponent<TextFieldElement, TextFieldProps>({
  tagName: "box-text-field",
  displayName: "TextField",
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
