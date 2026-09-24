import type { ReactNode } from "react";
import { CodeBlock as CodeBlockRef } from "@unofficialbox/box-open-elements/code-block";
import { createWebComponent, type WebComponentProps } from "./create-web-component.js";
import type { CustomEventHandler } from "./events.js";

export type { CodeBlockRef };
export type CodeBlockProps = WebComponentProps & {
  children?: ReactNode;
  code?: string;
  language?: string;
  copyLabel?: string;
  onCodeCopied?: CustomEventHandler<CodeBlockRef, { copied: boolean }>;
};

/** Omitted props preserve imperative state; supplied props are synchronized. */
export const CodeBlock = createWebComponent<CodeBlockRef, CodeBlockProps>({
  tagName: CodeBlockRef.tagName,
  displayName: "CodeBlock",
  propertyNames: ["code","language","copyLabel"],
  events: [{ propName: "onCodeCopied", eventName: "code-copied" }],
  sync: (element, props) => {
    if (props.code !== undefined) element.code = props.code;
    if (props.language !== undefined) element.language = props.language;
    if (props.copyLabel !== undefined) element.copyLabel = props.copyLabel;
  },
});
