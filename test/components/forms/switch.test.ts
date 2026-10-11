// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Switch } from "../../../src/components/forms/switch.js";

describe("Switch", () => {
  beforeEach(() => {
    Switch.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits checked-changed when toggled", () => {
    const element = document.createElement("box-switch") as Switch;
    const changed = vi.fn();
    element.addEventListener("checked-changed", changed);

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="switch"]') as HTMLButtonElement | null;
    button?.click();

    expect(element.checked).toBe(true);
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { checked: true },
      }),
    );
  });

  it("does not toggle when disabled", () => {
    const element = document.createElement("box-switch") as Switch;
    element.disabled = true;

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="switch"]') as HTMLButtonElement | null;
    button?.click();

    expect(element.checked).toBe(false);
  });

  it("exposes an accessible label", () => {
    const element = document.createElement("box-switch") as Switch;
    element.label = "Enable alerts";

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="switch"]') as HTMLButtonElement | null;
    expect(button?.getAttribute("aria-label")).toBe("Enable alerts");
  });

  it("exposes checked state through part names for styling", () => {
    const element = document.createElement("box-switch") as Switch;

    document.body.append(element);
    element.checked = true;

    const track = element.shadowRoot?.querySelector('[data-checked="true"]') as HTMLElement | null;
    const thumb = track?.querySelector('[data-checked="true"]') as HTMLElement | null;

    expect(track?.getAttribute("part")).toContain("track-checked");
    expect(thumb?.getAttribute("part")).toContain("thumb-checked");
  });

  it("does not lose focus when toggled via setter while switch is focused", () => {
    const element = document.createElement("box-switch") as Switch;
    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="switch"]') as HTMLButtonElement | null;
    button?.focus();

    element.checked = true;

    expect(document.activeElement).toBe(element);
  });

  it.each([false, true])("associates policy descriptions when disabled=%s without changing name or state", disabled => {
    const element = document.createElement("box-switch") as Switch;
    element.label = "Included";element.description = disabled ? "Required" : "Optional";
    element.checked = true;element.disabled = disabled;document.body.append(element);
    const button = element.shadowRoot!.querySelector('[part="switch"]')!;
    const id = button.getAttribute("aria-describedby");
    expect(id).toBeTruthy();
    expect(element.shadowRoot!.getElementById(id!)?.textContent).toBe(element.description);
    expect(button.getAttribute("aria-label")).toBe("Included");
    expect(button.getAttribute("aria-checked")).toBe("true");
    expect(button.getAttribute("aria-disabled")).toBe(String(disabled));
  });
  it("updates and removes descriptions while retaining the independent error association", () => {
    const element = document.createElement("box-switch") as Switch;
    element.description = "Optional";element.invalid = true;element.errorMessage = "Choose an option";document.body.append(element);
    const button = element.shadowRoot!.querySelector('[part="switch"]')!;
    const errorId = button.getAttribute("aria-errormessage")!;
    expect(element.shadowRoot!.getElementById(errorId)?.textContent).toBe("Choose an option");
    element.description = "Required";
    expect(element.shadowRoot!.getElementById(button.getAttribute("aria-describedby")!)?.textContent).toBe("Required");
    expect(button.getAttribute("aria-errormessage")).toBe(errorId);
    element.description = "";
    expect(button.hasAttribute("aria-describedby")).toBe(false);
    expect(button.getAttribute("aria-errormessage")).toBe(errorId);
    element.invalid = false;
    expect(button.hasAttribute("aria-errormessage")).toBe(false);
  });
  it("uses BUE toggle track geometry", () => {
    const element = document.createElement("box-switch") as Switch;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("inline-size: 40px");
    expect(styles).toContain("block-size: 20px");
    expect(styles).toContain("inline-size: 16px");
    expect(styles).toContain("transform: translateX(20px)");
  });
});
