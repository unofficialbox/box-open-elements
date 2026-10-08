// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ModeIndicator } from "../../../src/components/feedback/mode-indicator.js";

describe("box-mode-indicator", () => {
  beforeEach(() => { ModeIndicator.register(); });
  afterEach(() => { document.body.innerHTML = ""; });
  it("names dry/live mode and sends activation only when interactive", () => {
    const indicator = document.createElement("box-mode-indicator") as ModeIndicator;
    indicator.mode = "dry";
    indicator.detail = "simulated Box";
    indicator.namePrefix = "Next run";
    document.body.append(indicator);
    expect(indicator.shadowRoot!.querySelector('[part="indicator"]')!.getAttribute("role")).toBe("group");
    expect(indicator.shadowRoot!.querySelector('[part="indicator"]')!.getAttribute("aria-label")).toBe("Next run: Dry run, simulated Box");
    let activations = 0;
    indicator.addEventListener("activate", () => activations++);
    indicator.interactive = true;
    const button = indicator.shadowRoot!.querySelector("button")!;
    expect(button).toBeTruthy();
    button.click();
    expect(activations).toBe(1);
    indicator.mode = "live";
    expect(button.getAttribute("aria-label")).toBe("Next run: Live, simulated Box");
    indicator.interactive = false;
    expect(indicator.shadowRoot!.querySelector("button")).toBeNull();
    indicator.shadowRoot!.querySelector<HTMLElement>('[part="indicator"]')!.click();
    expect(activations).toBe(1);
    expect(indicator.shadowRoot!.querySelector("style")!.textContent).toContain("min-block-size:24px");
  });
});
