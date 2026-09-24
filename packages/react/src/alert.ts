import type { ReactNode } from "react";
import { Alert as AlertRef } from "@unofficialbox/box-open-elements/alert";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";
import type { CustomEventHandler } from "./events.js";

export type { AlertRef };
export type AlertProps = WebComponentProps & {
  children?: ReactNode;
  heading?: string;
  message?: string;
  description?: string;
  tone?: string;
  open?: boolean;
  onOpenChanged?: CustomEventHandler<AlertRef, { open: boolean }>;
  onDismiss?: CustomEventHandler<AlertRef, unknown>;
};

/** Omitted props preserve imperative state; supplied props are synchronized. */
export const Alert = createWebComponent<AlertRef, AlertProps>({
  tagName: AlertRef.tagName,
  displayName: "Alert",
  propertyNames: ["heading","message","description","tone","open"],
  events: [{ propName: "onOpenChanged", eventName: "open-changed" }, { propName: "onDismiss", eventName: "dismiss" }],
  sync: (element, props) => {
    if (props.heading !== undefined) element.heading = props.heading;
    if (props.message !== undefined) element.message = props.message;
    if (props.description !== undefined) element.description = props.description;
    if (props.tone !== undefined) element.tone = props.tone;
    if (props.open !== undefined) element.open = props.open;
  },
});
