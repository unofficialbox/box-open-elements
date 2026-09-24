import type { ReactNode } from "react";
import { Tabs as TabsRef } from "@unofficialbox/box-open-elements/tabs";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";
import type { CustomEventHandler } from "./events.js";

export type { TabsRef };
export type TabsProps = WebComponentProps & {
  children?: ReactNode;
  label?: string;
  value?: string;
  layout?: "attached" | "separated";
  options?: TabsRef["options"];
  onValueChanged?: CustomEventHandler<TabsRef, { value: string }>;
};

/** Omitted props preserve imperative state; supplied props are synchronized. */
export const Tabs = createWebComponent<TabsRef, TabsProps>({
  tagName: TabsRef.tagName,
  displayName: "Tabs",
  propertyNames: ["label","value","layout","options"],
  events: [{ propName: "onValueChanged", eventName: "value-changed" }],
  sync: (element, props) => {
    if (props.label !== undefined) element.label = props.label;
    if (props.value !== undefined) element.value = props.value;
    if (props.layout !== undefined) element.layout = props.layout;
    if (props.options !== undefined) element.options = props.options;
  },
});
