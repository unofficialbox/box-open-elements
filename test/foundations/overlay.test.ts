import { describe, expect, it } from "vitest";

import {
  parsePlacement,
  resolvePosition,
  type Rect,
  type Size,
} from "../../src/foundations/overlay/index.js";

const anchor: Rect = { top: 100, left: 100, width: 80, height: 30 };
const floating: Size = { width: 200, height: 120 };
const viewport: Size = { width: 1000, height: 800 };

describe("foundations/overlay resolvePosition", () => {
  it("places bottom-start directly below the anchor's left edge", () => {
    const r = resolvePosition(anchor, floating, viewport, {
      placement: { side: "bottom", align: "start" },
      offset: 4,
    });
    expect(r).toMatchObject({ side: "bottom", align: "start" });
    expect(r.x).toBe(100); // anchor.left
    expect(r.y).toBe(100 + 30 + 4); // anchor.top + height + offset
  });

  it("centers on the cross axis for align=center", () => {
    const r = resolvePosition(anchor, floating, viewport, {
      placement: { side: "bottom", align: "center" },
    });
    // anchor.left + anchor.width/2 - floating.width/2 = 100 + 40 - 100 = 40
    expect(r.x).toBe(40);
  });

  it("aligns the trailing edge for align=end", () => {
    const r = resolvePosition(anchor, floating, viewport, {
      placement: { side: "bottom", align: "end" },
    });
    // anchor.left + anchor.width - floating.width = 100 + 80 - 200 = -20 → shifted to padding
    expect(r.x).toBe(8); // clamped to padding (would be -20)
  });

  it("positions to the right of the anchor for side=right", () => {
    const r = resolvePosition(anchor, floating, viewport, {
      placement: { side: "right", align: "start" },
      offset: 6,
    });
    expect(r.side).toBe("right");
    expect(r.x).toBe(100 + 80 + 6); // anchor.left + width + offset
    expect(r.y).toBe(100); // align start = anchor.top
  });

  it("flips bottom→top when there is no room below but room above", () => {
    const lowAnchor: Rect = { top: 720, left: 100, width: 80, height: 30 };
    const r = resolvePosition(lowAnchor, floating, viewport, {
      placement: { side: "bottom", align: "start" },
    });
    // below has 800 - 750 = 50px (< 124 needed); above has 720px → flip to top
    expect(r.side).toBe("top");
    expect(r.y).toBe(720 - 120 - 4);
  });

  it("does not flip when flip is disabled even if it overflows", () => {
    const lowAnchor: Rect = { top: 720, left: 100, width: 80, height: 30 };
    const r = resolvePosition(lowAnchor, floating, viewport, {
      placement: { side: "bottom", align: "start" },
      flip: false,
    });
    expect(r.side).toBe("bottom");
  });

  it("flips right→left when the right edge would overflow", () => {
    const rightAnchor: Rect = { top: 100, left: 940, width: 40, height: 30 };
    const r = resolvePosition(rightAnchor, floating, viewport, {
      placement: { side: "right", align: "start" },
    });
    // right space = 1000 - 980 = 20 (< 204 needed); left space = 940 → flip to left
    expect(r.side).toBe("left");
    expect(r.x).toBe(940 - 200 - 4);
  });

  it("shifts a bottom overlay left to stay inside the right edge", () => {
    const rightAnchor: Rect = { top: 100, left: 900, width: 80, height: 30 };
    const r = resolvePosition(rightAnchor, floating, viewport, {
      placement: { side: "bottom", align: "start" },
      padding: 8,
    });
    // start x = 900, but 900 + 200 > 1000 - 8 → clamp to 1000 - 200 - 8 = 792
    expect(r.x).toBe(792);
  });

  it("respects shift=false (allows overflow)", () => {
    const rightAnchor: Rect = { top: 100, left: 900, width: 80, height: 30 };
    const r = resolvePosition(rightAnchor, floating, viewport, {
      placement: { side: "bottom", align: "start" },
      shift: false,
    });
    expect(r.x).toBe(900);
  });

  it("defaults to bottom-start", () => {
    const r = resolvePosition(anchor, floating, viewport);
    expect(r).toMatchObject({ side: "bottom", align: "start" });
  });
});

describe("foundations/overlay parsePlacement", () => {
  it("parses side-align strings", () => {
    expect(parsePlacement("bottom-start")).toEqual({ side: "bottom", align: "start" });
    expect(parsePlacement("top-center")).toEqual({ side: "top", align: "center" });
    expect(parsePlacement("right-end")).toEqual({ side: "right", align: "end" });
  });

  it("treats a bare side as align=start", () => {
    expect(parsePlacement("top")).toEqual({ side: "top", align: "start" });
  });

  it("maps legacy popover names start→left, end→right", () => {
    expect(parsePlacement("start")).toEqual({ side: "left", align: "start" });
    expect(parsePlacement("end")).toEqual({ side: "right", align: "start" });
  });

  it("accepts 'middle' as center", () => {
    expect(parsePlacement("bottom-middle")).toEqual({ side: "bottom", align: "center" });
  });

  it("returns undefined for empty or unknown input", () => {
    expect(parsePlacement("")).toBeUndefined();
    expect(parsePlacement(null)).toBeUndefined();
    expect(parsePlacement("sideways")).toBeUndefined();
  });
});
