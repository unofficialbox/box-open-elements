import type { ReactNode } from "react";
import { Toast as ToastRef } from "@unofficialbox/box-open-elements/toast";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";
import type { CustomEventHandler } from "./events.js";

export type { ToastRef };
export type ToastProps = WebComponentProps & {
  children?: ReactNode;
  heading?: string;
  message?: string;
  tone?: string;
  open?: boolean;
  mode?: ToastRef["mode"];
  duration?: number;
  onOpenChanged?: CustomEventHandler<ToastRef, { open: boolean }>;
  onDismiss?: CustomEventHandler<ToastRef, { source: "timeout" | "close-button" }>;
};

/** Omitted props preserve imperative state; supplied props are synchronized. */
export const Toast = createWebComponent<ToastRef, ToastProps>({
  tagName: ToastRef.tagName,
  displayName: "Toast",
  propertyNames: ["heading","message","tone","open","mode","duration"],
  events: [{ propName: "onOpenChanged", eventName: "open-changed" }, { propName: "onDismiss", eventName: "dismiss" }],
  sync: (element, props) => {
    if (props.heading !== undefined) element.heading = props.heading;
    if (props.message !== undefined) element.message = props.message;
    if (props.tone !== undefined) element.tone = props.tone;
    if (props.open !== undefined) element.open = props.open;
    if (props.mode !== undefined) element.mode = props.mode;
    if (props.duration !== undefined) element.duration = props.duration;
  },
});
