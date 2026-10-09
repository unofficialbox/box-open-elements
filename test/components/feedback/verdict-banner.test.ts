// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { VerdictBanner } from "../../../src/components/feedback/verdict-banner.js";

describe("box-verdict-banner", () => {
  beforeEach(() => { VerdictBanner.register(); });
  afterEach(() => { document.body.innerHTML = ""; });
  it("renders a labelled group, heading level, reasons, and independent actions", () => {
    const banner = document.createElement("box-verdict-banner") as VerdictBanner;
    banner.tone = "passed";
    banner.heading = "Passed: both targets met";
    banner.headingLevel = 3;
    banner.reasons = ["Error rate below 1%", "Median latency below 300 ms"];
    const action = document.createElement("button");
    action.slot = "action";
    action.textContent = "View run";
    const secondary = document.createElement("button");
    secondary.slot = "secondary-action";
    secondary.textContent = "Change the load";
    banner.append(action, secondary);
    document.body.append(banner);
    const shadow = banner.shadowRoot!;
    expect(shadow.querySelector('[role="group"]')!.getAttribute("aria-labelledby")).toBe(shadow.querySelector('[part="heading"]')!.id);
    expect(shadow.querySelector('[part="heading"]')!.getAttribute("aria-level")).toBe("3");
    expect(shadow.querySelectorAll("li")).toHaveLength(2);
    expect(action.closest("button")).toBe(action);
    expect(shadow.querySelector('slot[name="action"]')).not.toBeNull();
    expect(shadow.querySelector('slot[name="secondary-action"]')).not.toBeNull();
    expect(shadow.querySelector("style")!.textContent).toContain("flex-wrap:wrap");
    expect(shadow.querySelector("style")!.textContent).toContain("16rem");
  });
  it("supports a prominent heading without changing its semantic level", () => {
    const banner = document.createElement("box-verdict-banner") as VerdictBanner;
    banner.heading = "Passed";
    banner.headingLevel = 3;
    banner.size = "large";
    document.body.append(banner);
    expect(banner.size).toBe("large");
    expect(banner.shadowRoot!.querySelector('[part="heading"]')!.getAttribute("aria-level")).toBe("3");
    expect(banner.shadowRoot!.querySelector("style")!.textContent).toContain(':host([size="large"])');
  });
  it("lets the host own the finished-run announcement", async () => {
    const banner = document.createElement("box-verdict-banner") as VerdictBanner;
    banner.tone = "passed";
    banner.heading = "Passed";
    banner.announce = "off";
    document.body.append(banner);
    await Promise.resolve();
    expect(document.querySelector("[data-boe-announcer]")).toBeNull();
    expect(banner.announce).toBe("off");
  });
});
