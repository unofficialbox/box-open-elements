import { Button as ButtonElement } from "@unofficialbox/box-open-elements/button";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";
import type { NativeEventHandler } from "./events.js";

ButtonElement.register();

// `onClick` is redeclared below with a native-event signature, so React's own
// must come off the base first — an intersection of two function types is an
// overload, and no single handler would satisfy both. `onCancel` is omitted
// from WebComponentProps for the same reason, on Dialog's behalf.
export type ButtonProps = Omit<WebComponentProps, "onClick"> & {
  /** Button label text (maps to the `label` property / attribute). */
  label?: string;
  /** Visual tone: `primary` (default), `neutral`, `danger`. */
  tone?: string;
  /** Control size: `small`, `medium` (default), `large`. */
  size?: string;
  disabled?: boolean;
  /**
   * Click callback, bound directly to the element.
   *
   * Receives a **native** `MouseEvent`, not a React `SyntheticEvent`. See
   * `NativeEventHandler` for why the binding is direct.
   */
  onClick?: NativeEventHandler<ButtonElement, MouseEvent>;
};

/**
 * React wrapper for `<box-button>`. Registers the custom element on first render
 * and syncs props as element properties for the supported React 19 contract.
 *
 * `click` is bound through the factory's `events` map rather than left to
 * React's `onClick`. React delegates from its root container, so a button that
 * has been relocated out of it — every button inside a `box-drawer`, which
 * portals to `document.body` on open — never sees a delegated event and the
 * callback silently does nothing. A listener on the element travels with it.
 * The other adapters already bind this way; Button was the one that didn't.
 */
export const Button = createWebComponent<ButtonElement, ButtonProps>({
  tagName: "box-button",
  displayName: "Button",
  propertyNames: ["label", "tone", "size", "disabled"],
  events: [{ propName: "onClick", eventName: "click" }],
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
