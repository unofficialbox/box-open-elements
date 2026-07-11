// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxTextAreaElement, defineBoxTextAreaElement } from "../../../src/components/forms/text-area.js";

describe("BoxTextAreaElement", () => {
  beforeEach(() => {
    defineBoxTextAreaElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits value changes while typing", () => {
    const element = document.createElement("box-text-area") as BoxTextAreaElement;
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const textarea = element.shadowRoot?.querySelector('[part="textarea"]') as HTMLTextAreaElement | null;
    textarea!.value = "Notes";
    textarea?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "Notes" },
      }),
    );
  });

  it("forwards disabled state to the textarea", () => {
    const element = document.createElement("box-text-area") as BoxTextAreaElement;
    element.disabled = true;

    document.body.append(element);

    const textarea = element.shadowRoot?.querySelector('[part="textarea"]') as HTMLTextAreaElement | null;

    expect(textarea?.disabled).toBe(true);
  });
});
