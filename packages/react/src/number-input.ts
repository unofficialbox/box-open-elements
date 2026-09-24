import type { ReactNode } from "react";
import { NumberInput as NumberInputRef } from "@unofficialbox/box-open-elements/number-input";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";
import type { CustomEventHandler } from "./events.js";

export type { NumberInputRef };
export type NumberInputProps = WebComponentProps & {
  children?: ReactNode;
  label?: string;
  value?: number;
  min?: number | null;
  max?: number | null;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  name?: string;
  required?: boolean;
  hideLabel?: boolean;
  description?: string;
  invalid?: boolean;
  errorMessage?: string;
  onValueChanged?: CustomEventHandler<NumberInputRef, { value: number }>;
};

/** Omitted props preserve imperative state; supplied props are synchronized. */
export const NumberInput = createWebComponent<NumberInputRef, NumberInputProps>({
  tagName: NumberInputRef.tagName,
  displayName: "NumberInput",
  propertyNames: ["label","value","min","max","step","placeholder","disabled","name","required","hideLabel","description","invalid","errorMessage"],
  events: [{ propName: "onValueChanged", eventName: "value-changed" }],
  sync: (element, props) => {
    if (props.label !== undefined) element.label = props.label;
    if (props.value !== undefined) element.value = props.value;
    if (props.min !== undefined) element.min = props.min;
    if (props.max !== undefined) element.max = props.max;
    if (props.step !== undefined) element.step = props.step;
    if (props.placeholder !== undefined) element.placeholder = props.placeholder;
    if (props.disabled !== undefined) element.disabled = props.disabled;
    if (props.name !== undefined) element.name = props.name;
    if (props.required !== undefined) element.required = props.required;
    if (props.hideLabel !== undefined) element.hideLabel = props.hideLabel;
    if (props.description !== undefined) element.description = props.description;
    if (props.invalid !== undefined) element.invalid = props.invalid;
    if (props.errorMessage !== undefined) element.errorMessage = props.errorMessage;
  },
});
