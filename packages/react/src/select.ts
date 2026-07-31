import { Select as SelectElement } from "../../../src/components/forms/select.js";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";
import type { CustomEventHandler, ValueChangedDetail } from "./events.js";

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
  ],
  events: [{ propName: "onValueChanged", eventName: "value-changed" }],
  sync: (element, props) => {
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
