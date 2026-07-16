// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxErrorMaskElement, defineBoxErrorMaskElement } from "../../../src/components/feedback/error-mask.js";

describe("BoxErrorMaskElement", () => {
  beforeEach(() => {
    defineBoxErrorMaskElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders an assertive alert with a default heading", () => {
    const element = document.createElement("box-error-mask") as BoxErrorMaskElement;
    document.body.append(element);

    const section = element.shadowRoot?.querySelector('[part="error-mask"]');
    expect(section?.getAttribute("role")).toBe("alert");
    expect(section?.getAttribute("aria-live")).toBe("assertive");
    expect(element.shadowRoot?.querySelector('[part="title"]')?.textContent).toContain("Something went wrong");
  });

  it("renders a custom heading and message", () => {
    const element = document.createElement("box-error-mask") as BoxErrorMaskElement;
    element.heading = "Couldn't load files";
    element.message = "Check your connection and try again.";
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="title"]')?.textContent).toContain("Couldn't load files");
    expect(element.shadowRoot?.querySelector('[part~="message"]')?.textContent).toContain(
      "Check your connection and try again.",
    );
  });

  it("accepts a heading via the heading property", () => {
    const element = document.createElement("box-error-mask") as BoxErrorMaskElement;
    element.heading = "Access denied";
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="title"]')?.textContent).toContain("Access denied");
    expect(element.heading).toBe("Access denied");
  });

  it("omits the action button until an action label is set", () => {
    const element = document.createElement("box-error-mask") as BoxErrorMaskElement;
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="action"]')).toBeNull();

    element.actionLabel = "Retry";
    expect(element.shadowRoot?.querySelector('[part="action"]')?.textContent).toContain("Retry");
  });

  it("emits a retry event when the action is activated", () => {
    const element = document.createElement("box-error-mask") as BoxErrorMaskElement;
    element.actionLabel = "Try again";
    document.body.append(element);

    const onRetry = vi.fn();
    element.addEventListener("retry", onRetry);

    (element.shadowRoot?.querySelector('[part="action"]') as HTMLButtonElement).click();

    expect(onRetry).toHaveBeenCalledWith(expect.objectContaining({ detail: { label: "Try again" } }));
  });

  it("uses BUE error-mask shell styles", () => {
    const element = document.createElement("box-error-mask") as BoxErrorMaskElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("padding: 40px;");
    expect(styles).toContain("border-radius: 6px;");
    expect(styles).toContain("border: 1px dashed");
    expect(styles).toContain("min-height: 32px;");
  });
});
