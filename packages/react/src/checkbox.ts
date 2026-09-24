import type { ReactNode } from "react";
import { Checkbox as CheckboxRef } from "@unofficialbox/box-open-elements/checkbox";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";
import type { CustomEventHandler } from "./events.js";

export type { CheckboxRef };
export type CheckboxProps = WebComponentProps & {
  children?: ReactNode;
  label?: string;
  checked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  value?: string;
  name?: string;
  required?: boolean;
  description?: string;
  invalid?: boolean;
  errorMessage?: string;
  onCheckedChanged?: CustomEventHandler<CheckboxRef, { checked: boolean }>;
};

/** Omitted props preserve imperative state; supplied props are synchronized. */
export const Checkbox = createWebComponent<CheckboxRef, CheckboxProps>({
  tagName: CheckboxRef.tagName,
  displayName: "Checkbox",
  propertyNames: ["label","checked","indeterminate","disabled","value","name","required","description","invalid","errorMessage"],
  events: [{ propName: "onCheckedChanged", eventName: "checked-changed" }],
  sync: (element, props) => {
    if (props.label !== undefined) element.label = props.label;
    if (props.checked !== undefined) element.checked = props.checked;
    if (props.indeterminate !== undefined) element.indeterminate = props.indeterminate;
    if (props.disabled !== undefined) element.disabled = props.disabled;
    if (props.value !== undefined) element.value = props.value;
    if (props.name !== undefined) element.name = props.name;
    if (props.required !== undefined) element.required = props.required;
    if (props.description !== undefined) element.description = props.description;
    if (props.invalid !== undefined) element.invalid = props.invalid;
    if (props.errorMessage !== undefined) element.errorMessage = props.errorMessage;
  },
});
