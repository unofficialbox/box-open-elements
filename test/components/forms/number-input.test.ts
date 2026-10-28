// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NumberInput } from "../../../src/components/forms/number-input.js";
import { getMirroredFormValue } from "../../../src/core/index.js";

describe("NumberInput", () => {
  it("shares sentence-case labels, hidden-label support, required and description semantics", () => {
    const element = new NumberInput();
    element.label = "Retry count";
    element.hideLabel = true;
    element.required = true;
    element.description = "Maximum retry attempts";
    document.body.append(element);
    const styles = element.shadowRoot!.querySelector("style")!.textContent!;
    expect(styles).not.toContain("text-transform: uppercase");
    expect(styles).toContain(":host([hide-label])");
    expect(element.shadowRoot!.querySelector('[part="label"]')!.textContent).toBe("Retry count*");
    expect(element.shadowRoot!.querySelector("input")!.getAttribute("aria-required")).toBe("true");
    const description = element.shadowRoot!.querySelector('[part="description"]')!;
    expect(description.textContent).toBe("Maximum retry attempts");
    expect(element.shadowRoot!.querySelector("input")!.getAttribute("aria-describedby")).toContain(description.id);
  });
  beforeEach(() => {
    NumberInput.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits numeric value changes while typing", () => {
    const element = document.createElement("box-number-input") as NumberInput;
    const changed = vi.fn();
    element.label = "Version";
    element.addEventListener("value-changed", changed);

    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "7";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { value: 7 },
      }),
    );
  });

  it("does not lose focus when label attribute changes while input is focused", () => {
    const element = document.createElement("box-number-input") as NumberInput;
    element.label = "Version";
    element.value = 3;
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input?.focus();
    // Mid-edit value that has not been committed yet.
    input!.value = "99";

    element.label = "Build";

    expect(document.activeElement).toBe(element);
    expect(element.shadowRoot?.activeElement).toBe(input);
    expect(input?.value).toBe("99");
  });

  it("clamps values to min and max bounds", () => {
    const element = document.createElement("box-number-input") as NumberInput;
    element.min = 0;
    element.max = 10;
    document.body.append(element);

    element.value = 99;
    expect(element.value).toBe(10);
    expect(getMirroredFormValue(element.internals)).toBe("10");

    element.value = -5;
    expect(element.value).toBe(0);
    expect(getMirroredFormValue(element.internals)).toBe("0");
  });

  it("does not revert to a stale pre-clamp value when max is relaxed", () => {
    const element = document.createElement("box-number-input") as NumberInput;
    element.min = 0;
    element.max = 10;
    element.value = 7;
    document.body.append(element);

    element.max = 3;
    expect(element.value).toBe(3);
    expect(getMirroredFormValue(element.internals)).toBe("3");

    element.max = 8;
    expect(element.value).toBe(3);
    expect(getMirroredFormValue(element.internals)).toBe("3");
  });

  it("clamps user input to min and max bounds", () => {
    const element = document.createElement("box-number-input") as NumberInput;
    element.min = 1;
    element.max = 5;
    document.body.append(element);

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLInputElement | null;
    input!.value = "9";
    input?.dispatchEvent(new Event("input", { bubbles: true }));

    expect(element.value).toBe(5);
    expect(input?.value).toBe("5");
    expect(element.shadowRoot?.querySelector('[part="clamp-status"]')?.textContent).toBe("Changed to 5, the most allowed");
    expect(getMirroredFormValue(element.internals)).toBe("5");
  });
});

describe("optional empty numbers", () => {
  it("supports nullable values, NaN and placeholder without clamping an empty optional field", () => {
    const element = new NumberInput(); element.allowEmpty = true; element.min = 5; element.max = 10; element.placeholder = "No floor"; element.required = true;
    document.body.append(element);
    const input = element.shadowRoot!.querySelector("input")!;
    expect(element.value).toBeNull(); expect(Number.isNaN(element.valueAsNumber)).toBe(true); expect(input.value).toBe(""); expect(input.placeholder).toBe("No floor"); expect(input.required).toBe(false);
    element.value = 7; expect(input.value).toBe("7"); expect(input.required).toBe(true);
    element.valueAsNumber = NaN; expect(element.value).toBeNull(); expect(input.value).toBe("");
    element.allowEmpty = false; expect(element.value).toBe(5);
  });
  it("emits null when cleared, supports controlled echoes, restores/reset empty and keeps default zero", () => {
    const element = new NumberInput(); element.allowEmpty = true; document.body.append(element); const fn = vi.fn(); element.addEventListener("value-changed", fn);
    const input = element.shadowRoot!.querySelector("input")!; input.focus(); input.value = "3"; input.dispatchEvent(new Event("input", { bubbles:true }));
    input.value = ""; input.dispatchEvent(new Event("input", { bubbles:true })); expect(fn.mock.calls.at(-1)![0].detail.value).toBeNull(); expect(element.value).toBeNull();
    element.value = 8; element.formResetCallback(); expect(element.value).toBeNull(); element.formStateRestoreCallback("4"); expect(element.value).toBe(4); element.formStateRestoreCallback(null); expect(element.value).toBeNull();
    const normal = new NumberInput(); document.body.append(normal); expect(normal.value).toBe(0);
  });
});

it("retains default attribute fallbacks and reflects clamped bounds",()=>{
  const element=new NumberInput();document.body.append(element);element.value=7;
  element.setAttribute("value", "");expect(element.value).toBe(7);element.removeAttribute("value");expect(element.value).toBe(7);
  element.setAttribute("value","bad");expect(element.value).toBe(7);element.max=5;expect(element.value).toBe(5);expect(element.getAttribute("value")).toBe("5");
});

it("reflects normalized values when optional mode is disabled and reenabled",()=>{
  const element=new NumberInput();element.allowEmpty=true;document.body.append(element);element.value=null;element.allowEmpty=false;
  expect(element.value).toBe(0);expect(element.getAttribute("value")).toBe("0");element.allowEmpty=true;expect(element.value).toBe(0);
});
