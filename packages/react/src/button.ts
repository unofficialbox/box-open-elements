import type { MouseEventHandler } from "react";

import { Button as ButtonElement } from "../../../src/components/actions/button.js";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";

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
 * and syncs props as element properties so React 18/19 both behave.
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
