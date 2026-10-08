// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { VerdictBanner } from "../../../src/components/feedback/verdict-banner.js";

describe("box-verdict-banner", () => {
  beforeEach(() => { VerdictBanner.register(); });
  afterEach(() => { document.body.innerHTML = ""; });
  it("renders a labelled group, heading level, reasons, and independent action", () => {
    const banner = document.createElement("box-verdict-banner") as VerdictBanner;
    banner.tone = "passed";
    banner.heading = "Passed: both targets met";
    banner.headingLevel = 3;
    banner.reasons = ["Error rate below 1%", "Median latency below 300 ms"];
    const action = document.createElement("button");
    action.slot = "action";
    action.textContent = "View run";
    banner.append(action);
    document.body.append(banner);
    const shadow = banner.shadowRoot!;
    expect(shadow.querySelector('[role="group"]')!.getAttribute("aria-labelledby")).toBe(shadow.querySelector('[part="heading"]')!.id);
    expect(shadow.querySelector('[part="heading"]')!.getAttribute("aria-level")).toBe("3");
    expect(shadow.querySelectorAll("li")).toHaveLength(2);
    expect(action.closest("button")).toBe(action);
    expect(shadow.querySelector("style")!.textContent).toContain("@container (max-width:320px)");
  });
});
