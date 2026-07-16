// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxSelectElement, defineBoxSelectElement } from "../../../src/components/forms/select.js";

describe("BoxSelectElement", () => {
  beforeEach(() => {
    defineBoxSelectElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders options and emits value changes", () => {
    const element = document.createElement("box-select") as BoxSelectElement;
    const changed = vi.fn();
    element.label = "View";
    element.options = [
      { label: "List", value: "list" },
      { label: "Table", value: "table" },
    ];
    element.value = "list";
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const select = element.shadowRoot?.querySelector('[part="select"]') as HTMLSelectElement | null;
    select!.value = "table";
    select?.dispatchEvent(new Event("change", { bubbles: true }));

    expect(element.value).toBe("table");
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: "table" },
      }),
    );
  });

  it("uses tighter select control padding", () => {
    const element = document.createElement("box-select") as BoxSelectElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("gap: 0.35rem;");
    expect(styles).toContain("padding: 0.5rem 2.1rem 0.5rem 0.7rem;");
    expect(styles).toContain("border-radius: 0.65rem;");
  });

  it("forwards disabled state to the select", () => {
    const element = document.createElement("box-select") as BoxSelectElement;
    element.disabled = true;

    document.body.append(element);

    const select = element.shadowRoot?.querySelector('[part="select"]') as HTMLSelectElement | null;

    expect(select?.disabled).toBe(true);
  });
});
