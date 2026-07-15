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
    expect(skeleton?.style.width).toBe("180px");
    expect(skeleton?.style.height).toBe("24px");
  });

  it("does not allow attribute values to inject markup", () => {
    const element = document.createElement("box-skeleton") as BoxSkeletonElement;
    element.width = '16px" aria-hidden="false"><img src=x onerror=alert(1)>';
    document.body.append(element);

    // No markup was injected: the shadow root contains only the single span.
    expect(element.shadowRoot?.querySelector("img")).toBeNull();
    expect(element.shadowRoot?.querySelectorAll('[part="skeleton"]').length).toBe(1);
    // The malformed value was rejected by the CSSOM rather than reflected.
    const skeleton = element.shadowRoot?.querySelector('[part="skeleton"]') as HTMLSpanElement | null;
    expect(skeleton?.style.width).toBe("");
  });

  it("keeps correct styles when width and height are set to the same values again", () => {
    const element = document.createElement("box-skeleton") as BoxSkeletonElement;
    element.width = "100px";
    element.height = "16px";
    document.body.append(element);

    const skeleton = element.shadowRoot?.querySelector('[part="skeleton"]') as HTMLSpanElement | null;
    expect(skeleton?.style.width).toBe("100px");
    expect(skeleton?.style.height).toBe("16px");

    element.width = "100px";
    element.height = "16px";

    expect(skeleton?.style.width).toBe("100px");
    expect(skeleton?.style.height).toBe("16px");
  });

  it("updates styles when width changes", () => {
    const element = document.createElement("box-skeleton") as BoxSkeletonElement;
    element.width = "100px";
    element.height = "16px";
    document.body.append(element);

    const skeleton = element.shadowRoot?.querySelector('[part="skeleton"]') as HTMLSpanElement | null;
    element.width = "200px";

    expect(skeleton?.style.width).toBe("200px");
    expect(skeleton?.style.height).toBe("16px");
  });
});
