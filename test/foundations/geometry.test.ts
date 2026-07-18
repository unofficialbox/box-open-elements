import { describe, expect, it } from "vitest";

import {
  boeControl,
  boeInputControlStyles,
  boeOverlay,
  boePanel,
  boeRadius,
  boeSpace,
} from "../../src/foundations/geometry/index.js";

describe("geometry foundation (BDL)", () => {
  it("exposes the BUE 4px grid and radius ladder", () => {
    expect(boeSpace.unit).toBe("4px");
    expect(boeSpace[4]).toBe("16px");
    expect(boeRadius.size).toBe("4px");
    expect(boeRadius.med).toBe("12px");
    expect(boeRadius.large).toBe("16px");
    expect(boeRadius.xlarge).toBe("20px");
  });

  it("exposes 32px control height and input chrome helpers", () => {
    expect(boeControl.height).toBe("32px");
    expect(boeControl.heightLarge).toBe("40px");
    expect(boeControl.inputPadding).toBe("7px");
    expect(boeControl.disabledOpacity).toBe("0.4");

    const css = boeInputControlStyles('[part="input"]');
    expect(css).toContain("min-height: 32px");
    expect(css).toContain("border-radius: 12px");
    expect(css).toContain("inset 0 2px 4px");
    expect(css).toContain("outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5)");
  });

  it("exposes BUE overlay / modal chrome", () => {
    expect(boeOverlay.padding).toBe("12px");
    expect(boeOverlay.radius).toBe("20px");
    expect(boeOverlay.itemMinHeight).toBe("30px");
    expect(boeOverlay.itemPadding).toBe("8px 48px 8px 8px");
    expect(boeOverlay.modalWidth).toBe("460px");
    expect(boeOverlay.modalRadius).toBe("24px");
    expect(boeOverlay.modalBackdrop).toBe("rgba(0, 0, 0, 0.75)");
  });

  it("exposes BUE pattern panel shell chrome", () => {
    expect(boePanel.padding).toBe("12px");
    expect(boePanel.radius).toBe("16px");
    expect(boePanel.gap).toBe("12px");
    expect(boePanel.drawerWidth).toBe("340px");
  });
});
