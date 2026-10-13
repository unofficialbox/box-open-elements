import { Button as ButtonElement } from "@unofficialbox/box-open-elements/button";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";
import type { NativeEventHandler } from "./events.js";

ButtonElement.register();

export type ButtonProps = Omit<WebComponentProps, "onClick"> & {
  label?: string;
  accessibleLabel?: string;
  tone?: string;
  size?: string;
  disabled?: boolean;
  onClick?: NativeEventHandler<ButtonElement, MouseEvent>;
};

export const Button = createWebComponent<ButtonElement, ButtonProps>({
  tagName: "box-button",
  propertyNames: ["label", "accessibleLabel", "tone", "size", "disabled"],
  events: [{ propName: "onClick", eventName: "click" }],
  sync: (element, props) => {
    if (props.label !== undefined) {
      element.label = props.label;
    }
    if (props.accessibleLabel !== undefined) element.accessibleLabel = props.accessibleLabel;
    if (props.tone !== undefined) {
      element.tone = props.tone;
    }
    if (props.size !== undefined) {
      element.size = props.size;
    }
    element.disabled = Boolean(props.disabled);
  },
});
