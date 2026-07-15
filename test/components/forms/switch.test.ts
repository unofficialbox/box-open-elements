// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxSwitchElement, defineBoxSwitchElement } from "../../../src/components/forms/switch.js";

describe("BoxSwitchElement", () => {
  beforeEach(() => {
    defineBoxSwitchElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("emits checked-changed when toggled", () => {
    const element = document.createElement("box-switch") as BoxSwitchElement;
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
    const element = document.createElement("box-switch") as BoxSwitchElement;
    element.disabled = true;

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="switch"]') as HTMLButtonElement | null;
    button?.click();

    expect(element.checked).toBe(false);
  });

  it("exposes an accessible label", () => {
    const element = document.createElement("box-switch") as BoxSwitchElement;
    element.label = "Enable alerts";

    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="switch"]') as HTMLButtonElement | null;
    expect(button?.getAttribute("aria-label")).toBe("Enable alerts");
  });

  it("exposes checked state through part names for styling", () => {
    const element = document.createElement("box-switch") as BoxSwitchElement;

    document.body.append(element);
    element.checked = true;

    const track = element.shadowRoot?.querySelector('[data-checked="true"]') as HTMLElement | null;
    const thumb = track?.querySelector('[data-checked="true"]') as HTMLElement | null;

    expect(track?.getAttribute("part")).toContain("track-checked");
    expect(thumb?.getAttribute("part")).toContain("thumb-checked");
  });

  it("does not lose focus when toggled via setter while switch is focused", () => {
    const element = document.createElement("box-switch") as BoxSwitchElement;
    document.body.append(element);

    const button = element.shadowRoot?.querySelector('[part="switch"]') as HTMLButtonElement | null;
    button?.focus();

    element.checked = true;

    expect(document.activeElement).toBe(element);
  });
});
