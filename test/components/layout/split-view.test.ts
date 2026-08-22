// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SplitView } from "../../../src/components/layout/split-view.js";

describe("SplitView", () => {
  beforeEach(() => {
    SplitView.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders primary and secondary slots inside the split surface", () => {
    const element = document.createElement("box-split-view") as SplitView;
    element.label = "Review Split";
    element.ratio = 0.4;

    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="split-view"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="primary"]')).toBeTruthy();
    expect(element.shadowRoot?.querySelector('[part="secondary"]')).toBeTruthy();
  });

  it("renders a separator and updates ratio when resizable", () => {
    const element = document.createElement("box-split-view") as SplitView;
    element.label = "Review Split";
    element.ratio = 0.4;
    element.resizable = true;

    document.body.append(element);

    Object.defineProperty(element, "getBoundingClientRect", {
      value: () =>
        ({
          left: 0,
          width: 1000,
        }) as DOMRect,
    });

    const separator = element.shadowRoot?.querySelector('[part="separator"]') as HTMLElement | null;
    expect(separator).toBeTruthy();

    separator?.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, bubbles: true }));
    separator?.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 700, bubbles: true }));
    separator?.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1, bubbles: true }));

    expect(element.ratio).toBe(0.7);
  });

  it("emits ratio-changed while resizing via pointer", () => {
    const element = document.createElement("box-split-view") as SplitView;
    element.resizable = true;
    element.ratio = 0.4;
    const changed = vi.fn();
    element.addEventListener("ratio-changed", changed);

    document.body.append(element);

    Object.defineProperty(element, "getBoundingClientRect", {
      value: () =>
        ({
          left: 0,
          width: 1000,
        }) as DOMRect,
    });

    const separator = element.shadowRoot?.querySelector('[part="separator"]') as HTMLElement | null;
    separator?.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, bubbles: true }));
    separator?.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 600, bubbles: true }));
    separator?.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1, bubbles: true }));

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({
        bubbles: true,
        composed: true,
        detail: { ratio: 0.6 },
      }),
    );
  });

  it("keeps the same separator node when ratio changes during a drag", () => {
    const element = document.createElement("box-split-view") as SplitView;
    element.resizable = true;
    element.ratio = 0.4;
    document.body.append(element);

    Object.defineProperty(element, "getBoundingClientRect", {
      value: () =>
        ({
          left: 0,
          width: 1000,
        }) as DOMRect,
    });

    const separator = element.shadowRoot?.querySelector('[part="separator"]') as HTMLElement | null;
    expect(separator).toBeTruthy();

    separator?.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, bubbles: true }));
    separator?.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 550, bubbles: true }));

    expect(element.shadowRoot?.querySelector('[part="separator"]')).toBe(separator);
    expect(element.ratio).toBe(0.55);

    separator?.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1, bubbles: true }));
  });
});


describe("SplitView master-detail collapse (dispatch intake round 6)", () => {
  beforeEach(() => {
    SplitView.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("ships the container-driven collapse rules, opt-in via collapse=auto", () => {
    const element = document.createElement("box-split-view") as SplitView;
    element.setAttribute("collapse", "auto");
    document.body.append(element);

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain("container-type: inline-size");
    expect(styles).toContain("@container (max-width: 640px)");
    expect(styles).toContain(':host([collapse="auto"]) [part="secondary"]');
    expect(styles).toContain(':host([collapse="auto"][detail-open]) [part="secondary"]');
    expect(element.collapse).toBe("auto");
  });

  it("reflects detail-open both ways", () => {
    const element = document.createElement("box-split-view") as SplitView;
    document.body.append(element);

    element.detailOpen = true;
    expect(element.hasAttribute("detail-open")).toBe(true);
    element.removeAttribute("detail-open");
    expect(element.detailOpen).toBe(false);
  });

  it("Escape in a collapsed open detail asks the host via detail-dismissed", () => {
    const element = document.createElement("box-split-view") as SplitView;
    element.setAttribute("collapse", "auto");
    element.detailOpen = true;
    document.body.append(element);

    const dismissed = vi.fn();
    element.addEventListener("detail-dismissed", dismissed);
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(dismissed).toHaveBeenCalledTimes(1);
    expect(dismissed.mock.calls[0][0].detail).toEqual({ source: "escape" });
    // The host owns detail-open: the component only asks.
    expect(element.detailOpen).toBe(true);
  });

  it("Escape does nothing when not collapsed or not open", () => {
    const element = document.createElement("box-split-view") as SplitView;
    document.body.append(element);
    const dismissed = vi.fn();
    element.addEventListener("detail-dismissed", dismissed);

    element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    element.setAttribute("collapse", "auto"); // still not open
    element.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    expect(dismissed).not.toHaveBeenCalled();
  });
});

describe("SplitView Escape gating on actual width (PR #188 review)", () => {
  beforeEach(() => {
    SplitView.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const createOpen = (width: number): SplitView => {
    const element = document.createElement("box-split-view") as SplitView;
    element.setAttribute("collapse", "auto");
    element.detailOpen = true;
    Object.defineProperty(element, "offsetWidth", { value: width, configurable: true });
    document.body.append(element);
    return element;
  };

  it("emits detail-dismissed only while the container is actually narrow", () => {
    // Wide: the slide-over does not exist, so Escape must mean nothing.
    const wide = createOpen(1200);
    const wideDismissed = vi.fn();
    wide.addEventListener("detail-dismissed", wideDismissed);
    wide.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(wideDismissed).not.toHaveBeenCalled();

    // Narrow: the slide-over is visible; Escape asks the host to close it.
    const narrow = createOpen(480);
    const narrowDismissed = vi.fn();
    narrow.addEventListener("detail-dismissed", narrowDismissed);
    narrow.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(narrowDismissed).toHaveBeenCalledTimes(1);
  });
});
