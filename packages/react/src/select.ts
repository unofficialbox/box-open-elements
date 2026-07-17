import {
  BoxSelectElement,
  defineBoxSelectElement,
} from "../../../src/components/forms/select.js";
import { createWebComponent, type BoxWebComponentProps } from "./create-web-component.js";
import type { BoxCustomEventHandler, BoxValueChangedDetail } from "./events.js";

export type BoxSelectOption = {
  label: string;
  value: string;
};

export type BoxSelectProps = BoxWebComponentProps & {
  label?: string;
  value?: string;
  options?: BoxSelectOption[];
  disabled?: boolean;
  name?: string;
  invalid?: boolean;
  errorMessage?: string;
  onValueChanged?: BoxCustomEventHandler<BoxSelectElement, BoxValueChangedDetail>;
};

/** React wrapper for `<box-select>`, including its structured `options` property. */
export const BoxSelect = createWebComponent<BoxSelectElement, BoxSelectProps>({
  tagName: "box-select",
  define: defineBoxSelectElement,
  displayName: "BoxSelect",
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
