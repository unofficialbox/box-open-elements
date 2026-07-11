// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxProgressStepsElement,
  defineBoxProgressStepsElement,
} from "../../../src/components/feedback/progress-steps.js";

describe("BoxProgressStepsElement", () => {
  beforeEach(() => {
    defineBoxProgressStepsElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the current step", () => {
    const element = document.createElement("box-progress-steps") as BoxProgressStepsElement;
    element.items = [
      { label: "Draft", value: "draft" },
      { label: "Review", value: "review" },
      { label: "Publish", value: "publish" },
    ];
    element.value = "review";

    document.body.append(element);

    expect(element.shadowRoot?.textContent).toContain("Review");
    expect(element.shadowRoot?.querySelector('[part="step"][data-state="current"]')).not.toBeNull();
  });

  it("emits value-changed when a new step is selected", () => {
    const element = document.createElement("box-progress-steps") as BoxProgressStepsElement;
    const changed = vi.fn();
    element.items = [
      { label: "Draft", value: "draft" },
      { label: "Review", value: "review" },
      { label: "Publish", value: "publish" },
    ];
    element.value = "draft";
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const steps = element.shadowRoot?.querySelectorAll('[part="step"]') ?? [];
    (steps[1] as HTMLButtonElement | undefined)?.click();

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "review" },
      }),
    );
  });

  it("uses tab semantics and supports arrow key navigation", () => {
    const element = document.createElement("box-progress-steps") as BoxProgressStepsElement;
    element.items = [
      { label: "Draft", value: "draft" },
      { label: "Review", value: "review" },
      { label: "Publish", value: "publish" },
    ];
    element.value = "draft";

    document.body.append(element);

    const steps = element.shadowRoot?.querySelectorAll('[part="step"]') ?? [];
    const firstStep = steps[0] as HTMLButtonElement | undefined;

    expect(element.shadowRoot?.querySelector('[part="steps"]')?.getAttribute("role")).toBe("tablist");
    expect(firstStep?.getAttribute("role")).toBe("tab");

    firstStep?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    expect(element.value).toBe("review");
  });
});
