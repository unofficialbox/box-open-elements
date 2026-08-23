// @vitest-environment node

import { describe, expect, it } from "vitest";

import { resolveRailReveal } from "../../docs-site/rail-reveal.js";

const geometry = (overrides: Partial<Parameters<typeof resolveRailReveal>[0]> = {}) => ({
  itemTop: 0,
  itemHeight: 28,
  viewTop: 0,
  viewHeight: 600,
  scrollHeight: 2000,
  ...overrides,
});

describe("resolveRailReveal", () => {
  it("leaves a fully visible entry alone", () => {
    // The restored scroll position is deliberate; yanking it for an entry the
    // reader can already see would undo their own scrolling.
    expect(resolveRailReveal(geometry({ itemTop: 100 }))).toBeNull();
    expect(resolveRailReveal(geometry({ itemTop: 400, viewTop: 200 }))).toBeNull();
    // Flush against either edge still counts as visible.
    expect(resolveRailReveal(geometry({ itemTop: 200, viewTop: 200 }))).toBeNull();
    expect(resolveRailReveal(geometry({ itemTop: 772, viewTop: 200 }))).toBeNull();
  });

  it("centres an entry below the fold", () => {
    // The Signature/Runs case: a deep link lands with the rail at the top and
    // the active entry far down the list.
    const next = resolveRailReveal(geometry({ itemTop: 1200, viewTop: 0 }));
    expect(next).toBe(1200 - (600 - 28) / 2);
  });

  it("centres an entry above the current scroll", () => {
    const next = resolveRailReveal(geometry({ itemTop: 100, viewTop: 900 }));
    expect(next).toBe(0); // centring would go negative; clamped to the top
  });

  it("clamps to the real scroll range so the last entry leaves no empty space", () => {
    const next = resolveRailReveal(
      geometry({ itemTop: 1960, itemHeight: 28, viewTop: 0, viewHeight: 600, scrollHeight: 2000 }),
    );
    expect(next).toBe(1400); // scrollHeight - viewHeight
  });

  it("never returns a negative offset", () => {
    const next = resolveRailReveal(geometry({ itemTop: 4, viewTop: 300 }));
    expect(next).toBe(0);
  });

  it("returns an integer offset", () => {
    // Odd arithmetic must not produce a fractional scrollTop.
    const next = resolveRailReveal(geometry({ itemTop: 1201, itemHeight: 27, viewTop: 0 }));
    expect(Number.isInteger(next)).toBe(true);
  });

  it("does nothing when the rail has no measurable viewport", () => {
    // An unlaid-out or hidden rail (and every jsdom layout box) — there is no
    // "in view" to reason about, so scrolling blind would be a guess.
    expect(resolveRailReveal(geometry({ viewHeight: 0 }))).toBeNull();
    expect(
      resolveRailReveal({
        itemTop: 0,
        itemHeight: 0,
        viewTop: 0,
        viewHeight: 0,
        scrollHeight: 0,
      }),
    ).toBeNull();
  });

  it("aligns an entry taller than the viewport to its top edge", () => {
    const next = resolveRailReveal(
      geometry({ itemTop: 800, itemHeight: 900, viewTop: 0, viewHeight: 600 }),
    );
    // Centring a too-tall entry would push its first line off-screen — you read
    // a list entry from the top, so alignment beats centring here.
    expect(next).toBe(800);
  });
});
