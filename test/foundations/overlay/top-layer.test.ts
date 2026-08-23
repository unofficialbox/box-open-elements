// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import {
  dismissModal,
  dismissPopover,
  promoteModal,
  promotePopover,
} from "../../../src/foundations/overlay/top-layer.js";

/**
 * jsdom implements neither `showModal` nor `showPopover`, which is exactly why
 * these guards exist — and why the real promotion is verified in a browser
 * rather than here. What is testable here is every path *around* the call: the
 * unsupported engine, the already-open element, and the throw.
 */
const element = (overrides: Record<string, unknown> = {}): HTMLElement =>
  Object.assign(document.createElement("div"), overrides) as HTMLElement;

describe("promoteModal", () => {
  it("promotes a dialog that supports showModal", () => {
    const showModal = vi.fn();
    expect(promoteModal(element({ showModal, open: false }))).toBe(true);
    expect(showModal).toHaveBeenCalledTimes(1);
  });

  it("does nothing where the engine has no showModal", () => {
    // The jsdom case, and the old-browser case. The overlay still renders; it
    // just does not get the top layer.
    expect(promoteModal(element())).toBe(false);
  });

  it("does not re-promote an already-open dialog", () => {
    // showModal() on an open dialog throws InvalidStateError.
    const showModal = vi.fn();
    expect(promoteModal(element({ showModal, open: true }))).toBe(false);
    expect(showModal).not.toHaveBeenCalled();
  });

  it("swallows the throw from a detached or hidden element", () => {
    const showModal = vi.fn(() => {
      throw new Error("NotAllowedError");
    });
    expect(() => promoteModal(element({ showModal, open: false }))).not.toThrow();
    expect(promoteModal(element({ showModal, open: false }))).toBe(false);
  });

  it("tolerates a null element", () => {
    expect(promoteModal(null)).toBe(false);
  });
});

describe("dismissModal", () => {
  it("closes an open dialog", () => {
    const close = vi.fn();
    dismissModal(element({ close, open: true }));
    expect(close).toHaveBeenCalledTimes(1);
  });

  it("does not close one that is already closed", () => {
    const close = vi.fn();
    dismissModal(element({ close, open: false }));
    expect(close).not.toHaveBeenCalled();
  });

  it("tolerates a missing API, a throw, and null", () => {
    expect(() => dismissModal(element({ open: true }))).not.toThrow();
    expect(() =>
      dismissModal(
        element({
          open: true,
          close: () => {
            throw new Error("InvalidStateError");
          },
        }),
      ),
    ).not.toThrow();
    expect(() => dismissModal(null)).not.toThrow();
  });
});

describe("promotePopover", () => {
  it("promotes an element that supports showPopover", () => {
    const showPopover = vi.fn();
    expect(promotePopover(element({ showPopover }))).toBe(true);
    expect(showPopover).toHaveBeenCalledTimes(1);
  });

  it("does nothing where the engine has no showPopover", () => {
    expect(promotePopover(element())).toBe(false);
  });

  it("swallows the throw from an already-showing or disconnected element", () => {
    const showPopover = vi.fn(() => {
      throw new Error("InvalidStateError");
    });
    expect(promotePopover(element({ showPopover }))).toBe(false);
  });

  it("tolerates a null element", () => {
    expect(promotePopover(null)).toBe(false);
  });
});

describe("dismissPopover", () => {
  it("hides a popover", () => {
    const hidePopover = vi.fn();
    dismissPopover(element({ hidePopover }));
    expect(hidePopover).toHaveBeenCalledTimes(1);
  });

  it("tolerates a missing API, a throw, and null", () => {
    expect(() => dismissPopover(element())).not.toThrow();
    expect(() =>
      dismissPopover(
        element({
          hidePopover: () => {
            throw new Error("InvalidStateError");
          },
        }),
      ),
    ).not.toThrow();
    expect(() => dismissPopover(null)).not.toThrow();
  });
});
