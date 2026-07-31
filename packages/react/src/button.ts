import type { MouseEventHandler } from "react";

import { Button as ButtonElement } from "@unofficialbox/box-open-elements/button";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";

ButtonElement.register();

export type ButtonProps = WebComponentProps & {
  /** Button label text (maps to the `label` property / attribute). */
  label?: string;
  /** Visual tone: `primary` (default), `neutral`, `danger`. */
  tone?: string;
  /** Control size: `small`, `medium` (default), `large`. */
  size?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<ButtonElement>;
};

/**
 * React wrapper for `<box-button>`. Registers the custom element on first render
 * and syncs props as element properties for the supported React 19 contract.
 */
export const Button = createWebComponent<ButtonElement, ButtonProps>({
  tagName: "box-button",
  displayName: "Button",
  propertyNames: ["label", "tone", "size", "disabled"],
  sync: (element, props) => {
    if (props.label !== undefined) {
      element.label = props.label;
    }
    if (props.tone !== undefined) {
      element.tone = props.tone;
    }
    if (props.size !== undefined) {
      element.size = props.size;
    }
    element.disabled = Boolean(props.disabled);
  },
});
