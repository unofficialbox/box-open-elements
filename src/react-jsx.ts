/**
 * GENERATED FILE — do not edit by hand.
 * Regenerate with: bun run types:generate
 * Native custom-element properties and CustomEvent details from component source.
 * Type-only: importing this entry never registers or renders an element.
 */
import type * as React from "react";
import type { BoxElementTagName } from "./element-maps.js";
import type {
  BoxElementEventHandlerProps,
  BoxElementProperties,
  BoxElementPropertyKeys,
} from "./native-types.js";

type BoxReactProps<Tag extends BoxElementTagName> =
  Omit<React.HTMLAttributes<HTMLElementTagNameMap[Tag]>,
    BoxElementPropertyKeys[Tag] | keyof BoxElementEventHandlerProps<Tag>> &
  BoxElementProperties<Tag> &
  BoxElementEventHandlerProps<Tag> &
  React.RefAttributes<HTMLElementTagNameMap[Tag]>;

type BoxReactIntrinsicElements = {
  [Tag in BoxElementTagName]: BoxReactProps<Tag>;
};

/** Opt in with a type-only import of the react-jsx subpath. */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends BoxReactIntrinsicElements {}
  }
}

export {};
