import type { ReactNode } from "react";

import { Dialog as DialogElement } from "@unofficialbox/box-open-elements/dialog";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";
import type { CustomEventHandler } from "./events.js";

DialogElement.register();

export type DialogSize = "small" | "medium" | "large" | "fullscreen";

export type DialogProps = WebComponentProps & {
  children?: ReactNode;
  open?: boolean;
  heading?: string;
  description?: string;
  confirmLabel?: string;
  size?: DialogSize;
  onOpenChanged?: CustomEventHandler<DialogElement, { open: boolean }>;
  onConfirm?: CustomEventHandler<DialogElement, null>;
  onCancel?: CustomEventHandler<DialogElement, null>;
};

/** React wrapper for the controlled `<box-dialog>` overlay. */
export const Dialog = createWebComponent<DialogElement, DialogProps>({
  tagName: "box-dialog",
  displayName: "Dialog",
  propertyNames: ["open", "heading", "description", "confirmLabel", "size"],
  events: [
    { propName: "onOpenChanged", eventName: "open-changed" },
    { propName: "onConfirm", eventName: "confirm" },
    { propName: "onCancel", eventName: "cancel" },
  ],
  sync: (element, props) => {
    if (props.heading !== undefined) {
      element.heading = props.heading;
    }
    if (props.description !== undefined) {
      element.description = props.description;
    }
    if (props.confirmLabel !== undefined) {
      element.confirmLabel = props.confirmLabel;
    }
    if (props.size !== undefined) {
      element.size = props.size;
    }
    if (props.open !== undefined) {
      element.open = props.open;
    }
  },
});
