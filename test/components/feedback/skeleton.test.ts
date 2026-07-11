// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BoxSkeletonElement, defineBoxSkeletonElement } from "../../../src/components/feedback/skeleton.js";

describe("BoxSkeletonElement", () => {
  beforeEach(() => {
    defineBoxSkeletonElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders with the provided dimensions", () => {
    const element = document.createElement("box-skeleton") as BoxSkeletonElement;
    element.width = "180px";
    element.height = "24px";

    document.body.append(element);

    const skeleton = element.shadowRoot?.querySelector('[part="skeleton"]') as HTMLSpanElement | null;
    expect(skeleton?.getAttribute("style")).toContain("width:180px");
    expect(skeleton?.getAttribute("style")).toContain("height:24px");
  });
});
