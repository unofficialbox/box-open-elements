// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { anchorFloating, trackAnchor } from "../../src/foundations/overlay/index.js";

describe("foundations/overlay anchorFloating", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("applies fixed positioning coordinates to the floating element", () => {
    const anchor = document.createElement("div");
    const floating = document.createElement("div");
    document.body.append(anchor, floating);

    anchorFloating(anchor, floating, { offset: 6 });

    expect(floating.style.position).toBe("fixed");
    expect(floating.style.top).not.toBe("");
    expect(floating.style.left).not.toBe("");
    expect(floating.style.margin).toBe("0px");
  });
});

describe("foundations/overlay trackAnchor", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("positions immediately even when no onReposition callback is provided", () => {
    const anchor = document.createElement("div");
    const floating = document.createElement("div");
    document.body.append(anchor, floating);

    // Regression: optional-call must not short-circuit the initial anchorFloating.
    const cleanup = trackAnchor(anchor, floating, { offset: 4 });

    expect(floating.style.position).toBe("fixed");
    cleanup();
  });

  it("invokes onReposition with the resolved placement", () => {
    const anchor = document.createElement("div");
    const floating = document.createElement("div");
    document.body.append(anchor, floating);
    const onReposition = vi.fn();

    const cleanup = trackAnchor(anchor, floating, { placement: { side: "top", align: "center" } }, onReposition);

    expect(onReposition).toHaveBeenCalledTimes(1);
    expect(onReposition.mock.calls[0][0]).toMatchObject({ side: expect.any(String) });
    cleanup();
  });

  it("repositions on scroll and stops after cleanup", () => {
    const anchor = document.createElement("div");
    const floating = document.createElement("div");
    document.body.append(anchor, floating);
    const onReposition = vi.fn();

    const cleanup = trackAnchor(anchor, floating, {}, onReposition);
    expect(onReposition).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("scroll"));
    expect(onReposition).toHaveBeenCalledTimes(2);

    cleanup();
    window.dispatchEvent(new Event("scroll"));
    expect(onReposition).toHaveBeenCalledTimes(2);
  });
});
