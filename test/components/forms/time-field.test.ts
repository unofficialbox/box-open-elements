// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxTimeFieldElement, defineBoxTimeFieldElement } from "../../../src/components/forms/time-field.js";

describe("BoxTimeFieldElement", () => {
  beforeEach(() => {
    defineBoxTimeFieldElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits value changes when the time changes", () => {
    const element = document.createElement("box-time-field") as BoxTimeFieldElement;
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "14:30";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "14:30" },
      }),
    );
  });
});
