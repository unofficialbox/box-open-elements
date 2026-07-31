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
    expect(boeSpace.unit).toBe("var(--boe-profile-space-unit, 4px)");
    expect(boeSpace[4]).toBe("var(--boe-profile-space-4, 16px)");
    expect(boeRadius.size).toBe("var(--boe-profile-radius-size, 4px)");
    expect(boeRadius.med).toBe("var(--boe-profile-radius-medium, 12px)");
    expect(boeRadius.large).toBe("var(--boe-profile-radius-large, 16px)");
    expect(boeRadius.xlarge).toBe("var(--boe-profile-radius-xlarge, 20px)");
  });

  it("exposes 32px control height and input chrome helpers", () => {
    expect(boeControl.height).toBe("var(--boe-profile-control-height, 32px)");
    expect(boeControl.heightLarge).toBe("var(--boe-profile-control-height-large, 40px)");
    expect(boeControl.inputPadding).toBe("var(--boe-profile-input-padding, 7px)");
    expect(boeControl.disabledOpacity).toBe("var(--boe-profile-disabled-opacity, 0.4)");

    const css = boeInputControlStyles('[part="input"]');
    expect(css).toContain(`min-height: ${boeControl.height}`);
    expect(css).toContain(`border-radius: ${boeRadius.med}`);
    expect(css).toContain("inset 0 2px 4px");
    expect(css).toContain("outline: 2px solid var(--boe-token-surface-surface-brand, #0061d5)");
  });

  it("exposes BUE overlay / modal chrome", () => {
    expect(boeOverlay.padding).toBe("var(--boe-profile-overlay-padding, 12px)");
    expect(boeOverlay.radius).toBe("var(--boe-profile-radius-xlarge, 20px)");
    expect(boeOverlay.itemMinHeight).toBe("var(--boe-profile-overlay-item-min-height, 30px)");
    expect(boeOverlay.itemPadding).toBe("var(--boe-profile-overlay-item-padding, 8px 48px 8px 8px)");
    expect(boeOverlay.modalWidth).toBe("var(--boe-profile-modal-width, 460px)");
    expect(boeOverlay.modalRadius).toBe("var(--boe-profile-radius-field, 24px)");
    expect(boeOverlay.modalBackdrop).toBe("rgba(0, 0, 0, 0.75)");
  });

  it("exposes BUE pattern panel shell chrome", () => {
    expect(boePanel.padding).toBe("var(--boe-profile-panel-padding, 12px)");
    expect(boePanel.radius).toBe("var(--boe-profile-radius-large, 16px)");
    expect(boePanel.gap).toBe("var(--boe-profile-panel-gap, 12px)");
    expect(boePanel.drawerWidth).toBe("var(--boe-profile-drawer-width, 340px)");
  });
});
