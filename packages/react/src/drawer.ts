import type { ReactNode } from "react";
import { Drawer as DrawerRef } from "@unofficialbox/box-open-elements/drawer";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";
import type { CustomEventHandler } from "./events.js";

export type { DrawerRef };
export type DrawerProps = WebComponentProps & {
  children?: ReactNode;
  heading?: string;
  description?: string;
  open?: boolean;
  position?: string;
  size?: string;
  busy?: boolean;
  onOpenChanged?: CustomEventHandler<DrawerRef, { open: boolean }>;
  onDismiss?: CustomEventHandler<DrawerRef, { source: "close-button" | "backdrop" | "escape" }>;
};

/** Omitted props preserve imperative state; supplied props are synchronized. */
export const Drawer = createWebComponent<DrawerRef, DrawerProps>({
  tagName: DrawerRef.tagName,
  displayName: "Drawer",
  propertyNames: ["heading","description","open","position","size","busy"],
  events: [{ propName: "onOpenChanged", eventName: "open-changed" }, { propName: "onDismiss", eventName: "dismiss" }],
  sync: (element, props) => {
    if (props.heading !== undefined) element.heading = props.heading;
    if (props.description !== undefined) element.description = props.description;
    if (props.open !== undefined) element.open = props.open;
    if (props.position !== undefined) element.position = props.position;
    if (props.size !== undefined) element.size = props.size;
    if (props.busy !== undefined) element.busy = props.busy;
  },
});
