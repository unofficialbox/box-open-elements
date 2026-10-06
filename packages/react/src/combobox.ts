import { Combobox as ComboboxElement } from "@unofficialbox/box-open-elements/combobox";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";
import type { CustomEventHandler, ValueChangedDetail } from "./events.js";

ComboboxElement.register();

export type ComboboxOption = {
  label: string;
  value: string;
  description?: string;
  group?: string;
  disabled?: boolean;
};

export type ComboboxProps = WebComponentProps & {
  label?: string;
  value?: string;
  options?: ComboboxOption[];
  placeholder?: string;
  placement?: string;
  disabled?: boolean;
  name?: string;
  invalid?: boolean;
  errorMessage?: string;
  description?: string;
  required?: boolean;
  hideLabel?: boolean;
  onValueChanged?: CustomEventHandler<ComboboxElement, ValueChangedDetail>;
};

/** React wrapper for the value-bearing `<box-combobox>` form control. */
export const Combobox = createWebComponent<ComboboxElement, ComboboxProps>({
  tagName: "box-combobox",
  displayName: "Combobox",
  propertyNames: [
    "label", "value", "options", "placeholder", "placement", "disabled",
    "name", "invalid", "errorMessage", "description", "required", "hideLabel",
  ],
  events: [{ propName: "onValueChanged", eventName: "value-changed" }],
  sync: (element, props) => {
    if (props.label !== undefined) element.label = props.label;
    if (props.value !== undefined) element.value = props.value;
    if (props.options !== undefined) element.options = props.options;
    if (props.placeholder !== undefined) element.placeholder = props.placeholder;
    if (props.placement !== undefined) element.placement = props.placement;
    if (props.name !== undefined) element.name = props.name;
    if (props.errorMessage !== undefined) element.errorMessage = props.errorMessage;
    if (props.description !== undefined) element.description = props.description;
    if (props.required !== undefined) element.required = props.required;
    if (props.hideLabel !== undefined) element.hideLabel = props.hideLabel;
    element.disabled = Boolean(props.disabled);
    element.invalid = Boolean(props.invalid);
  },
});
