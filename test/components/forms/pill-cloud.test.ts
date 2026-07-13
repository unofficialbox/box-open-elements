// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxPillCloudElement, defineBoxPillCloudElement } from "../../../src/components/forms/pill-cloud.js";

const sampleOptions = [
  { value: "pdf", label: "PDF" },
  { value: "doc", label: "Docs" },
  { value: "img", label: "Images", disabled: true },
];

const createCloud = (): BoxPillCloudElement => {
  const element = document.createElement("box-pill-cloud") as BoxPillCloudElement;
  element.options = sampleOptions;
  document.body.append(element);
  return element;
};

const pillFor = (element: BoxPillCloudElement, value: string): HTMLButtonElement =>
  element.shadowRoot?.querySelector(`[part~="pill"][data-value="${value}"]`) as HTMLButtonElement;

describe("BoxPillCloudElement", () => {
  beforeEach(() => {
    defineBoxPillCloudElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a labelled group of toggle pills", () => {
    const element = createCloud();

    const group = element.shadowRoot?.querySelector('[part="cloud"]');
    expect(group?.getAttribute("role")).toBe("group");
    expect(group?.getAttribute("aria-label")).toBe("Filters");
    expect(element.shadowRoot?.querySelectorAll('[part~="pill"]').length).toBe(3);
    expect(pillFor(element, "img").disabled).toBe(true);
  });

  it("toggles selection on click and emits value-changed", () => {
    const element = createCloud();
    const onChange = vi.fn();
    element.addEventListener("value-changed", onChange);

    pillFor(element, "pdf").click();
    expect(element.value).toEqual(["pdf"]);
    expect(pillFor(element, "pdf").getAttribute("aria-pressed")).toBe("true");
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ detail: { value: ["pdf"] } }));

    pillFor(element, "doc").click();
    expect(element.value).toEqual(["pdf", "doc"]);

    // Toggling off removes it.
    pillFor(element, "pdf").click();
    expect(element.value).toEqual(["doc"]);
    expect(pillFor(element, "pdf").getAttribute("aria-pressed")).toBe("false");
  });

  it("reflects a preset value onto pressed state", () => {
    const element = document.createElement("box-pill-cloud") as BoxPillCloudElement;
    element.options = sampleOptions;
    element.value = ["doc"];
    document.body.append(element);

    expect(pillFor(element, "doc").getAttribute("aria-pressed")).toBe("true");
    expect(pillFor(element, "pdf").getAttribute("aria-pressed")).toBe("false");
  });

  it("renders an empty affordance when there are no options", () => {
    const element = document.createElement("box-pill-cloud") as BoxPillCloudElement;
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="cloud"]')).toBeNull();
    expect(element.shadowRoot?.querySelector('[part="empty"]')?.textContent).toContain("No options");
  });
});
