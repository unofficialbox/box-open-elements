import { describe, expect, it, vi } from "vitest";

import { applyRailVersion } from "../../docs-site/rail-version.js";

describe("applyRailVersion", () => {
  it("uses the inlined version and does not touch the network (static host)", () => {
    const el = document.createElement("span");
    const fetchStatus = vi.fn(() => Promise.resolve({ version: "9.9.9" }));
    applyRailVersion(el, "1.2.3", fetchStatus);
    expect(el.textContent).toBe("v1.2.3");
    expect(fetchStatus).not.toHaveBeenCalled();
  });

  it("fetches /api/status and populates the footer when no version is inlined (dev)", async () => {
    const el = document.createElement("span");
    const fetchStatus = vi.fn(() => Promise.resolve({ version: "0.1.0" }));
    applyRailVersion(el, null, fetchStatus);
    expect(fetchStatus).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(el.textContent).toBe("v0.1.0"));
  });

  it("swallows fetch failures (footer stays blank, no throw)", async () => {
    const el = document.createElement("span");
    applyRailVersion(el, null, () => Promise.reject(new Error("network")));
    // Give the rejected promise a tick to settle; text stays empty.
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(el.textContent).toBe("");
  });

  it("is a no-op when the element is absent", () => {
    expect(() => applyRailVersion(null, "1.2.3", () => Promise.resolve({ version: "x" }))).not.toThrow();
  });
});
