// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxCheckboxElement, defineBoxCheckboxElement } from "../../../src/components/forms/checkbox.js";
import { getMirroredFormValue } from "../../../src/core/index.js";

describe("BoxCheckboxElement", () => {
  beforeEach(() => {
    defineBoxCheckboxElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits checked changes", () => {
    const element = document.createElement("box-checkbox") as BoxCheckboxElement;
    const changed = vi.fn();
    element.addEventListener("checked-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.checked = true;
    input?.dispatchEvent(new Event("change", { bubbles: true }));

    expect(element.checked).toBe(true);
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { checked: true },
      }),
    );
  });

  it("supports disabled state", () => {
    const element = document.createElement("box-checkbox") as BoxCheckboxElement;
    element.disabled = true;
    element.label = "Remember choice";

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    expect(input?.disabled).toBe(true);
    expect(input?.getAttribute("aria-label")).toBe("Remember choice");
  });

  it("retains focus on the internal input when attributes or properties change", () => {
    const element = document.createElement("box-checkbox") as BoxCheckboxElement;
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement;

    // Focus the internal input
    input.focus();
    expect(element.shadowRoot?.activeElement).toBe(input);

    // Change attributes/properties
    element.label = "Remember me";
    element.checked = true;

    // Check that label and checked updated in DOM
    expect(input.checked).toBe(true);
    expect(input.getAttribute("aria-label")).toBe("Remember me");

    // Assert focus is still on the internal input
    expect(element.shadowRoot?.activeElement).toBe(input);
  });

  it("includes focus-visible styles for the input", () => {
    const element = document.createElement("box-checkbox") as BoxCheckboxElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="input"]:focus-visible');
    expect(styles).toContain('[part="field"]:hover:not(:has([part="input"]:disabled))');
    expect(styles).toContain('[part="field"]:active:not(:has([part="input"]:disabled))');
    expect(styles).toContain("--boe-token-surface-surface-brand");
    expect(styles).toContain("--boe-token-surface-surface-brand-pressed");
  });

  it("submits the value attribute when checked and null when unchecked", () => {
    const element = document.createElement("box-checkbox") as BoxCheckboxElement;
    element.value = "remember";
    document.body.append(element);

    expect(getMirroredFormValue(element.internals)).toBeNull();

    element.checked = true;
    expect(getMirroredFormValue(element.internals)).toBe("remember");

    element.checked = false;
    expect(getMirroredFormValue(element.internals)).toBeNull();
  });

  it("defaults form value to on when checked without a custom value", () => {
    const element = document.createElement("box-checkbox") as BoxCheckboxElement;
    document.body.append(element);

    element.checked = true;

    expect(element.value).toBe("on");
    expect(getMirroredFormValue(element.internals)).toBe("on");
  });
});
