import type { ReactNode } from "react";
import { Card as CardRef } from "@unofficialbox/box-open-elements/card";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";

export type { CardRef };
export type CardProps = WebComponentProps & {
  children?: ReactNode;
  heading?: string;
  eyebrow?: string;

};

/** Omitted props preserve imperative state; supplied props are synchronized. */
export const Card = createWebComponent<CardRef, CardProps>({
  tagName: CardRef.tagName,
  displayName: "Card",
  propertyNames: ["heading","eyebrow"],
  events: [],
  sync: (element, props) => {
    if (props.heading !== undefined) element.heading = props.heading;
    if (props.eyebrow !== undefined) element.eyebrow = props.eyebrow;
  },
});
