// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxSkeletonElement, defineBoxSkeletonElement } from "../../../src/components/feedback/skeleton.js";
import { boeMotionDuration, boeMotionEasing } from "../../../src/foundations/motion/index.js";

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

  it("skips CSSOM writes when dimensions are unchanged", () => {
    const element = document.createElement("box-skeleton") as BoxSkeletonElement;
    element.width = "100px";
    element.height = "16px";
    document.body.append(element);

    const skeleton = element.shadowRoot?.querySelector('[part="skeleton"]') as HTMLSpanElement;
    const setProperty = vi.spyOn(skeleton.style, "setProperty");

    element.width = "100px";
    element.height = "16px";

    expect(setProperty).not.toHaveBeenCalled();
    expect(skeleton.style.width).toBe("100px");
    expect(skeleton.style.height).toBe("16px");
  });

  it("uses shared motion vocabulary for shimmer and reduced-motion", () => {
    const element = document.createElement("box-skeleton") as BoxSkeletonElement;
    document.body.append(element);

    const styleText = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styleText).toContain(
      `animation: boe-skeleton-shimmer ${boeMotionDuration.shimmer} ${boeMotionEasing.standard} infinite`,
    );
    expect(styleText).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styleText).toContain('[part="skeleton"]');
    expect(styleText).toContain("animation: none;");
  });

  it("writes only the changed dimension", () => {
    const element = document.createElement("box-skeleton") as BoxSkeletonElement;
    element.width = "100px";
    element.height = "16px";
    document.body.append(element);

    const skeleton = element.shadowRoot?.querySelector('[part="skeleton"]') as HTMLSpanElement;
    const setProperty = vi.spyOn(skeleton.style, "setProperty");

    element.width = "200px";

    expect(setProperty).toHaveBeenCalledTimes(1);
    expect(setProperty).toHaveBeenCalledWith("width", "200px");
    expect(skeleton.style.width).toBe("200px");
    expect(skeleton.style.height).toBe("16px");
  });
});
