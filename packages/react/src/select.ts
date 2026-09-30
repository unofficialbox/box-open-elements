import { Select as SelectElement } from "@unofficialbox/box-open-elements/select";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";
import type { CustomEventHandler, ValueChangedDetail } from "./events.js";

SelectElement.register();

export type SelectOption = {
  label: string;
  value: string;
};

export type SelectProps = WebComponentProps & {
  label?: string;
  value?: string;
  options?: SelectOption[];
  disabled?: boolean;
  name?: string;
  invalid?: boolean;
  errorMessage?: string;
  description?: string;
  required?: boolean;
  hideLabel?: boolean;
  onValueChanged?: CustomEventHandler<SelectElement, ValueChangedDetail>;
};

/** React wrapper for `<box-select>`, including its structured `options` property. */
export const Select = createWebComponent<SelectElement, SelectProps>({
  tagName: "box-select",
  displayName: "Select",
  propertyNames: [
    "label",
    "value",
    "options",
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
    if (props.options !== undefined) {
      element.options = props.options;
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
