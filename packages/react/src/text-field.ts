import { TextField as TextFieldElement } from "@unofficialbox/box-open-elements/text-field";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";
import type { CustomEventHandler, ValueChangedDetail } from "./events.js";

TextFieldElement.register();

export type TextFieldProps = WebComponentProps & {
  label?: string;
  value?: string;
  placeholder?: string;
  type?: "text" | "password" | "email" | "tel" | "url" | "search" | "number";
  reveal?: boolean;
  revealLabel?: string;
  autocomplete?: string;
  disabled?: boolean;
  name?: string;
  invalid?: boolean;
  errorMessage?: string;
  description?: string;
  required?: boolean;
  hideLabel?: boolean;
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
    "type", "reveal", "revealLabel", "autocomplete",
    "disabled",
    "name",
    "invalid",
    "errorMessage",
    "description", "required", "hideLabel",
  ],
  events: [{ propName: "onValueChanged", eventName: "value-changed" }],
  sync: (element, props) => {
    if (props.description !== undefined) element.description = props.description;
    if (props.required !== undefined) element.required = props.required;
    if (props.hideLabel !== undefined) element.hideLabel = props.hideLabel;
    if (props.label !== undefined) {
      element.label = props.label;
    }
    if (props.value !== undefined) {
      element.value = props.value;
    }
    if (props.placeholder !== undefined) {
      element.placeholder = props.placeholder;
    }
    if (props.type !== undefined) element.type = props.type;
    if (props.reveal !== undefined) element.reveal = props.reveal;
    if (props.revealLabel !== undefined) element.revealLabel = props.revealLabel;
    if (props.autocomplete !== undefined) element.autocomplete = props.autocomplete;
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
