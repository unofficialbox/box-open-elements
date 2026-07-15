// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxSearchFieldElement, defineBoxSearchFieldElement } from "../../../src/components/forms/search-field.js";

describe("BoxSearchFieldElement", () => {
  beforeEach(() => {
    defineBoxSearchFieldElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits value changes and search submissions", () => {
    const element = document.createElement("box-search-field") as BoxSearchFieldElement;
    const valueChanged = vi.fn();
    const searched = vi.fn();
    element.addEventListener("value-changed", valueChanged);
    element.addEventListener("search", searched);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "quarterly";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(valueChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "quarterly" },
      }),
    );

    const submit = element.shadowRoot?.querySelector('[part="submit"]') as HTMLButtonElement | null;
    submit?.click();

    expect(searched).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "quarterly" },
      }),
    );
  });

  it("clears the current value", () => {
    const element = document.createElement("box-search-field") as BoxSearchFieldElement;
    const cleared = vi.fn();
    element.value = "marketing";
    element.addEventListener("clear", cleared);

    document.body.append(element);

    const clearButton = element.shadowRoot?.querySelector('[part="clear"]') as HTMLButtonElement | null;
    clearButton?.click();

    expect(cleared).toHaveBeenCalled();
    expect(element.value).toBe("");
  });

  it("keeps the same input element while typing", () => {
    const element = document.createElement("box-search-field") as BoxSearchFieldElement;

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "a";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    const nextInput = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;

    expect(nextInput).toBe(input);
    expect(element.value).toBe("a");
  });

  it("forwards disabled state to the input and action buttons", () => {
    const element = document.createElement("box-search-field") as BoxSearchFieldElement;
    element.disabled = true;

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    const submit = element.shadowRoot?.querySelector('[part="submit"]') as HTMLButtonElement | null;
    const clear = element.shadowRoot?.querySelector('[part="clear"]') as HTMLButtonElement | null;

    expect(input?.disabled).toBe(true);
    expect(submit?.disabled).toBe(true);
    expect(clear?.disabled).toBe(true);
  });

  it("does not lose focus when label attribute changes while input is focused", () => {
    const element = document.createElement("box-search-field") as BoxSearchFieldElement;
    element.label = "Search";
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.focus();

    element.label = "Find files";

    expect(document.activeElement).toBe(element);
  });
});
