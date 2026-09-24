import { afterEach, describe, expect, it, vi } from "vitest";
import { Toast } from "../../../src/components/feedback/toast.js";
import { installAnnouncer } from "../../../src/foundations/a11y/index.js";

afterEach(() => { document.body.innerHTML = ""; installAnnouncer()(); vi.useRealTimers(); });

describe("Toast lifecycle", () => {
  it("pauses remaining time across overlapping pointer and focus holds", () => {
    vi.useFakeTimers();
    const toast = new Toast();
    document.body.append(toast);
    const dismissed = vi.fn();
    toast.addEventListener("dismiss", dismissed);
    toast.show("Removed", { duration: 8000 });
    vi.advanceTimersByTime(3000);
    toast.dispatchEvent(new Event("pointerenter"));
    toast.dispatchEvent(new FocusEvent("focusin"));
    vi.advanceTimersByTime(10000);
    toast.dispatchEvent(new Event("pointerleave"));
    vi.advanceTimersByTime(10000);
    expect(toast.open).toBe(true);
    toast.dispatchEvent(new FocusEvent("focusout"));
    vi.advanceTimersByTime(4999);
    expect(toast.open).toBe(true);
    vi.advanceTimersByTime(1);
    expect(toast.open).toBe(false);
    expect(dismissed).toHaveBeenCalledOnce();
    expect(dismissed.mock.calls[0][0].detail).toEqual({ source: "timeout" });
  });

  it("emits the close source but not a dismissal for programmatic hide", () => {
    const toast = new Toast();
    document.body.append(toast);
    const dismissed = vi.fn();
    toast.addEventListener("dismiss", dismissed);
    toast.show("Saved", { duration: 0 });
    toast.hide();
    expect(dismissed).not.toHaveBeenCalled();
    toast.show("Saved", { duration: 0 });
    (toast.shadowRoot!.querySelector('[part="dismiss"]') as HTMLButtonElement).click();
    expect(dismissed.mock.calls[0][0].detail.source).toBe("close-button");
  });

  it("keeps the announcer mounted after hiding the toast", async () => {
    vi.useFakeTimers();
    const toast = new Toast();
    document.body.append(toast);
    toast.show("Saved", { duration: 100 });
    await Promise.resolve();
    vi.advanceTimersByTime(100);
    expect(toast.hidden).toBe(true);
    expect(document.querySelector('[data-boe-announcer] [role="status"]')?.textContent).toContain("Saved");
  });

  it("announces a repeated show of the same message", async () => {
    vi.useFakeTimers();
    const toast = new Toast(); document.body.append(toast);
    toast.show("Saved", { duration: 0 });
    await Promise.resolve();
    vi.advanceTimersByTime(20);
    const region = document.querySelector('[data-boe-announcer] [role="status"]')!;
    expect(region.textContent).toContain("Saved");
    toast.show("Saved", { duration: 0 });
    await Promise.resolve();
    vi.advanceTimersByTime(100);
    expect(region.textContent).toBe("");
    vi.advanceTimersByTime(20);
    expect(region.textContent).toContain("Saved");
  });
});
