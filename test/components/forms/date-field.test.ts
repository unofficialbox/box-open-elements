// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxDateFieldElement, defineBoxDateFieldElement } from "../../../src/components/forms/date-field.js";

describe("BoxDateFieldElement", () => {
  beforeEach(() => {
    defineBoxDateFieldElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits value changes when the date changes", () => {
    const element = document.createElement("box-date-field") as BoxDateFieldElement;
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "2026-04-03";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "2026-04-03" },
      }),
    );
  });
});
