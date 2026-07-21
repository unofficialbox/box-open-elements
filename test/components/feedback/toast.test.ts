// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxToastElement, defineBoxToastElement } from "../../../src/components/feedback/toast.js";

describe("BoxToastElement", () => {
  beforeEach(() => {
    defineBoxToastElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("shows and dismisses a toast", () => {
    const element = document.createElement("box-toast") as BoxToastElement;
    const dismissed = vi.fn();
    element.addEventListener("dismiss", dismissed);

    document.body.append(element);
    element.show("Saved", { duration: 0, tone: "success" });

    expect(element.open).toBe(true);
    expect(element.shadowRoot?.textContent).toContain("Saved");

    const dismiss = element.shadowRoot?.querySelector('[part="dismiss"]') as HTMLButtonElement | null;
    dismiss?.click();

    expect(dismissed).toHaveBeenCalled();
    expect(element.open).toBe(false);
  });

  it("uses BUE notification toast styles", () => {
    const element = document.createElement("box-toast") as BoxToastElement;
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("inline-size: fit-content;");
    expect(styles).toContain("min-height: 48px;");
    expect(styles).toContain("padding: 10px 10px 10px 20px;");
    expect(styles).toContain("border-radius: 16px;");
    expect(styles).toContain("border: 2px solid");
    expect(styles).toContain("font-size: 15px;");
  });

  it("auto-hides after the provided duration", () => {
    vi.useFakeTimers();
    const element = document.createElement("box-toast") as BoxToastElement;

    document.body.append(element);
    element.show("Done", { duration: 100 });
    vi.advanceTimersByTime(100);

    expect(element.open).toBe(false);
  });

  it("auto-hides per a declarative duration when opened via the property", () => {
    vi.useFakeTimers();
    const element = document.createElement("box-toast") as BoxToastElement;
    element.message = "Copied";
    element.duration = 200;
    document.body.append(element);

    element.open = true;
    expect(element.open).toBe(true);
    vi.advanceTimersByTime(199);
    expect(element.open).toBe(true);
    vi.advanceTimersByTime(1);
    expect(element.open).toBe(false);
  });

  it("reveals the action slot only when content is assigned", () => {
    const element = document.createElement("box-toast") as BoxToastElement;
    element.message = "File deleted";
    document.body.append(element);

    const actionSlot = element.shadowRoot?.querySelector('slot[name="action"]') as HTMLSlotElement;
    expect(actionSlot.classList.contains("has-content")).toBe(false);

    const undo = document.createElement("button");
    undo.slot = "action";
    undo.textContent = "Undo";
    element.append(undo);
    return new Promise<void>(resolve => {
      setTimeout(() => {
        expect(actionSlot.classList.contains("has-content")).toBe(true);
        resolve();
      }, 0);
    });
  });
});
