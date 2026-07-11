import { BoxExplorerListElement } from "./list.js";

const DEFAULT_TAG_NAME = "box-explorer-items";

export class BoxExplorerItemsElement extends BoxExplorerListElement {}

export const defineBoxExplorerItemsElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxExplorerItemsElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxExplorerItemsElement;
  }

  customElements.define(tagName, BoxExplorerItemsElement);
  return BoxExplorerItemsElement;
};
