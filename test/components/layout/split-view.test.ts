// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BoxSplitViewElement, defineBoxSplitViewElement } from "../../../src/components/layout/split-view.js";

describe("BoxSplitViewElement", () => {
  beforeEach(() => {
    defineBoxSplitViewElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders primary and secondary slots inside the split surface", () => {
    const element = document.createElement("box-split-view") as BoxSplitViewElement;
    element.label = "Review Split";
    element.ratio = 0.4;

    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="split-view"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="primary"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="secondary"]')).toBeTruthy();
  });

  it("renders a separator and updates ratio when resizable", () => {
    const element = document.createElement("box-split-view") as BoxSplitViewElement;
    element.label = "Review Split";
    element.ratio = 0.4;
    element.resizable = true;

    document.body.append(element);

    Object.defineProperty(element, "getBoundingClientRect", {
      value: () =>
        ({
          left: 0,
          width: 1000,
        }) as DOMRect,
    });

    const separator = element.shadowRoot?.querySelector('[part="separator"]') as HTMLElement | null;
    expect(separator).toBeTruthy();

    separator?.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, bubbles: true }));
    separator?.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 700, bubbles: true }));
    separator?.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1, bubbles: true }));

    expect(element.ratio).toBe(0.7);
  });
});
