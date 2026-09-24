import { afterEach, describe, expect, it, vi } from "vitest";
import { announce, installAnnouncer } from "../../src/foundations/a11y/index.js";
import { Alert } from "../../src/components/feedback/alert.js";

afterEach(() => { installAnnouncer()(); document.body.innerHTML = ""; vi.useRealTimers(); });

describe("persistent announcer", () => {
  it("installs once and cleans up queued work", () => {
    vi.useFakeTimers();
    const dispose = installAnnouncer();
    expect(installAnnouncer()).toBe(dispose);
    expect(document.querySelectorAll("[data-boe-announcer]")).toHaveLength(1);
    announce("Saved");
    dispose();
    vi.runAllTimers();
    expect(document.querySelector("[data-boe-announcer]")).toBeNull();
  });

  it("announces repeated messages through separate empty states without dropping queued messages", () => {
    vi.useFakeTimers();
    announce("Saved");
    announce("Saved");
    const status = document.querySelector('[role="status"]')!;
    expect(status.textContent).toBe("");
    vi.advanceTimersByTime(20);
    expect(status.textContent).toBe("Saved");
    vi.advanceTimersByTime(100);
    expect(status.textContent).toBe("");
    vi.advanceTimersByTime(20);
    expect(status.textContent).toBe("Saved");
    announce("Failed", "assertive");
    vi.advanceTimersByTime(20);
    expect(document.querySelector('[role="alert"]')?.textContent).toBe("Failed");
  });

  it("coalesces Alert properties into one assertive message, with no nested live region", async () => {
    vi.useFakeTimers();
    const alert = new Alert();
    document.body.append(alert);
    alert.message = "Try again";
    alert.heading = "Upload failed";
    alert.tone = "error";
    await Promise.resolve();
    vi.advanceTimersByTime(20);
    expect(document.querySelector('[role="alert"]')?.textContent).toContain("Upload failed: Try again");
    expect(alert.shadowRoot?.querySelector("[aria-live]")).toBeNull();
    alert.dismiss();
    alert.remove();
    document.body.append(alert);
    expect(alert.open).toBe(false);
  });
});
