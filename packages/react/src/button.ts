import type { MouseEventHandler } from "react";

import {
  BoxButtonElement,
  defineBoxButtonElement,
} from "../../../src/components/actions/button.js";
import { createWebComponent, type BoxWebComponentProps } from "./create-web-component.js";

export type BoxButtonProps = BoxWebComponentProps & {
  /** Button label text (maps to the `label` property / attribute). */
  label?: string;
  /** Visual tone: `primary` (default), `neutral`, `danger`. */
  tone?: string;
  /** Control size: `small`, `medium` (default), `large`. */
  size?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<BoxButtonElement>;
};

/**
 * React wrapper for `<box-button>`. Registers the custom element on first render
 * and syncs props as element properties so React 18/19 both behave.
 */
export const BoxButton = createWebComponent<BoxButtonElement, BoxButtonProps>({
  tagName: "box-button",
  define: defineBoxButtonElement,
  displayName: "BoxButton",
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
