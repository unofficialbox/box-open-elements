// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxTagInputElement, defineBoxTagInputElement } from "../../../src/components/forms/tag-input.js";

const inputOf = (element: BoxTagInputElement): HTMLInputElement =>
  element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement;

describe("BoxTagInputElement", () => {
  beforeEach(() => {
    defineBoxTagInputElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("seeds tags from the value attribute", () => {
    const element = document.createElement("box-tag-input") as BoxTagInputElement;
    element.setAttribute("value", "marketing, legal");
    document.body.append(element);

    expect(element.tags).toEqual(["marketing", "legal"]);
    expect(element.shadowRoot?.querySelectorAll('[part="tag"]').length).toBe(2);
  });

  it("adds a tag on Enter and emits tags-changed", () => {
    const element = document.createElement("box-tag-input") as BoxTagInputElement;
    document.body.append(element);
    const changed = vi.fn();
    element.addEventListener("tags-changed", changed);

    const input = inputOf(element);
    input.value = "launch";
    // Dispatch a real input event so the component's draft state is populated,
    // exercising the same path as actual typing.
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(element.tags).toEqual(["launch"]);
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { tags: ["launch"] } }),
    );
    // The freshly rendered input must be cleared, not retain the committed text.
    expect(inputOf(element).value).toBe("");
  });

  it("ignores duplicate tags case-insensitively", () => {
    const element = document.createElement("box-tag-input") as BoxTagInputElement;
    element.tags = ["Launch"];
    document.body.append(element);

    expect(element.addTag("launch")).toBe(false);
    expect(element.tags).toEqual(["Launch"]);
  });

  it("removes the last tag on Backspace when the field is empty", () => {
    const element = document.createElement("box-tag-input") as BoxTagInputElement;
    element.tags = ["a", "b"];
    document.body.append(element);
    const removed = vi.fn();
    element.addEventListener("tag-removed", removed);

    const input = inputOf(element);
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Backspace", bubbles: true }));

    expect(element.tags).toEqual(["a"]);
    expect(removed).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { tag: "b" } }),
    );
  });

  it("removes a tag when its dismiss button is clicked", () => {
    const element = document.createElement("box-tag-input") as BoxTagInputElement;
    element.tags = ["one", "two"];
    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[data-tag="one"]') as HTMLButtonElement | null;
    button?.click();

    expect(element.tags).toEqual(["two"]);
    expect(element.shadowRoot?.activeElement).toBe(inputOf(element));
  });

  it("honors the max attribute", () => {
    const element = document.createElement("box-tag-input") as BoxTagInputElement;
    element.setAttribute("max", "2");
    element.tags = ["a", "b"];
    document.body.append(element);

    expect(element.addTag("c")).toBe(false);
    expect(element.tags).toEqual(["a", "b"]);
    expect(inputOf(element).disabled).toBe(true);
  });

  it("reflects tags to the value attribute", () => {
    const element = document.createElement("box-tag-input") as BoxTagInputElement;
    document.body.append(element);
    element.addTag("q3");

    expect(element.getAttribute("value")).toBe("q3");
    expect(element.value).toBe("q3");
  });
});
