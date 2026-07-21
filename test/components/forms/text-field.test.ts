// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxTextFieldElement, defineBoxTextFieldElement } from "../../../src/components/forms/text-field.js";
import { getMirroredFormValue } from "../../../src/core/index.js";

describe("BoxTextFieldElement", () => {
  beforeEach(() => {
    defineBoxTextFieldElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits value changes while typing", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    const changed = vi.fn();
    element.label = "Name";
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "Roadmap";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "Roadmap" },
      }),
    );
  });

  it("forwards disabled state to the input", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    element.disabled = true;

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;

    expect(input?.disabled).toBe(true);
  });

  it("does not lose focus when label attribute changes while input is focused", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    element.label = "Name";
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.focus();

    element.label = "Full name";

    expect(document.activeElement).toBe(element);
  });

  it("mirrors typed value for form submission", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    element.name = "title";
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "Release notes";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(getMirroredFormValue(element.internals)).toBe("Release notes");
  });

  it("exposes invalid state on the internal input", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    element.invalid = true;
    element.errorMessage = "Too short";
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    const error = element.shadowRoot?.querySelector('[part="error-message"]') as HTMLElement | null;

    expect(input?.getAttribute("aria-invalid")).toBe("true");
    expect(error?.textContent).toBe("Too short");
  });

  it("uses BUE box-inputs geometry", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("min-height: 32px");
    expect(styles).toContain("padding: 7px");
    expect(styles).toContain("border-radius: 12px");
    expect(styles).toContain("inset 0 2px 4px");
  });
});

describe("BoxTextFieldElement — shared field features", () => {
  it("shows a required indicator and sets aria-required", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    element.label = "Name";
    element.required = true;
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]');
    expect(input?.getAttribute("aria-required")).toBe("true");
    expect(element.shadowRoot?.querySelector(".boe-required-mark")?.textContent).toBe("*");

    element.required = false;
    expect(element.shadowRoot?.querySelector(".boe-required-mark")).toBeNull();
    expect(input?.getAttribute("aria-required")).toBe("false");
  });

  it("renders a description and links it via aria-describedby", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    element.label = "API key";
    element.description = "Found in your account settings.";
    document.body.append(element);

    const desc = element.shadowRoot?.querySelector('[part="description"]') as HTMLElement | null;
    expect(desc?.textContent).toBe("Found in your account settings.");
    expect(desc?.hidden).toBe(false);
    const input = element.shadowRoot?.querySelector('[part="input"]');
    expect(input?.getAttribute("aria-describedby")).toBe("boe-field-description");

    element.description = "";
    expect(desc?.hidden).toBe(true);
    expect(input?.getAttribute("aria-describedby")).toBeNull();
  });

  it("keeps the label accessible when hidden visually", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    element.label = "Search";
    element.hideLabel = true;
    document.body.append(element);

    // Label text stays in the DOM (screen readers) — only visually hidden via CSS.
    expect(element.shadowRoot?.querySelector('[part="label"]')?.textContent).toContain("Search");
    expect(element.hasAttribute("hide-label")).toBe(true);
  });

  it("re-appends the required mark after a label re-render", () => {
    const element = document.createElement("box-text-field") as BoxTextFieldElement;
    element.label = "Name";
    element.required = true;
    document.body.append(element);
    // Changing the label triggers update(), which resets label textContent.
    element.label = "Full name";
    expect(element.shadowRoot?.querySelector(".boe-required-mark")).not.toBeNull();
  });
});
