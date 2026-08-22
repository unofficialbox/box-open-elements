import { afterEach, describe, expect, it, vi } from "vitest";

import { CompareView } from "../../../src/patterns/diff/compare-view.js";
import { mapScrollPosition, scrollableRange } from "../../../src/patterns/diff/types.js";

CompareView.register();

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

/**
 * jsdom has no layout, so `scrollHeight`/`clientHeight` are always 0 and
 * assigning `scrollTop` is a no-op. Give each scroller a real backing store so
 * the sync logic — which is the point of this component — can be exercised.
 */
const makeScrollable = (
  element: HTMLElement,
  { scrollHeight, clientHeight }: { scrollHeight: number; clientHeight: number },
): { scrollEvents: number } => {
  let top = 0;
  const state = { scrollEvents: 0 };
  Object.defineProperty(element, "scrollHeight", { configurable: true, get: () => scrollHeight });
  Object.defineProperty(element, "clientHeight", { configurable: true, get: () => clientHeight });
  Object.defineProperty(element, "scrollTop", {
    configurable: true,
    get: () => top,
    set: (value: number) => {
      // Browsers store an integral scroll offset. That rounding is what makes
      // a sync round-trip lossy, and therefore what makes a missing echo
      // guard observable at all.
      const clamped = Math.round(
        Math.min(Math.max(0, value), Math.max(0, scrollHeight - clientHeight)),
      );
      if (clamped === top) {
        return; // A real element fires no scroll event when nothing moves.
      }
      top = clamped;
      state.scrollEvents += 1;
      element.dispatchEvent(new Event("scroll"));
    },
  });
  return state;
};

interface Mounted {
  element: CompareView;
  left: HTMLElement;
  right: HTMLElement;
  leftState: { scrollEvents: number };
  rightState: { scrollEvents: number };
}

const mount = async (
  options: {
    left?: { scrollHeight: number; clientHeight: number };
    right?: { scrollHeight: number; clientHeight: number };
    configure?: (element: CompareView) => void;
  } = {},
): Promise<Mounted> => {
  const element = document.createElement("box-compare-view") as CompareView;
  options.configure?.(element);
  document.body.append(element);
  await flush();

  const left = element.shadowRoot!.querySelector<HTMLElement>('[part="scroller"][data-side="left"]')!;
  const right = element.shadowRoot!.querySelector<HTMLElement>('[part="scroller"][data-side="right"]')!;
  const leftState = makeScrollable(left, options.left ?? { scrollHeight: 1000, clientHeight: 200 });
  const rightState = makeScrollable(right, options.right ?? { scrollHeight: 1000, clientHeight: 200 });
  return { element, left, right, leftState, rightState };
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("scrollableRange", () => {
  it("is the overflow, and never negative", () => {
    expect(scrollableRange({ scrollTop: 0, scrollHeight: 1000, clientHeight: 200 })).toBe(800);
    expect(scrollableRange({ scrollTop: 0, scrollHeight: 150, clientHeight: 200 })).toBe(0);
  });
});

describe("mapScrollPosition", () => {
  const source = { scrollTop: 400, scrollHeight: 1000, clientHeight: 200 }; // range 800, 50%

  it("maps by fraction of range so unequal documents stay aligned", () => {
    // Half way down a short document is half way down a long one.
    expect(mapScrollPosition(source, { scrollTop: 0, scrollHeight: 5000, clientHeight: 200 })).toBe(
      2400,
    );
    expect(mapScrollPosition(source, { scrollTop: 0, scrollHeight: 400, clientHeight: 200 })).toBe(
      100,
    );
  });

  it("keeps the same pixel offset in absolute mode", () => {
    expect(
      mapScrollPosition(source, { scrollTop: 0, scrollHeight: 5000, clientHeight: 200 }, "absolute"),
    ).toBe(400);
  });

  it("clamps absolute mode to what the target can actually scroll", () => {
    expect(
      mapScrollPosition(source, { scrollTop: 0, scrollHeight: 500, clientHeight: 200 }, "absolute"),
    ).toBe(300);
  });

  it("returns 0 rather than NaN when either side cannot scroll", () => {
    // A target with nowhere to go, and a source with no position to map:
    // the fraction would be 0/0.
    expect(mapScrollPosition(source, { scrollTop: 0, scrollHeight: 100, clientHeight: 200 })).toBe(0);
    expect(
      mapScrollPosition(
        { scrollTop: 0, scrollHeight: 100, clientHeight: 200 },
        { scrollTop: 0, scrollHeight: 1000, clientHeight: 200 },
      ),
    ).toBe(0);
  });
});

describe("box-compare-view", () => {
  it("scrolls the right pane to match the left", async () => {
    const { left, right } = await mount();
    left.scrollTop = 400;
    await flush();
    expect(right.scrollTop).toBe(400);
  });

  it("does not drag the source back when the target clamps (absolute mode)", async () => {
    // The sharpest case for the echo guard. Scrolling the tall pane past the
    // short pane's end clamps the target; without the guard that clamped
    // position syncs straight back and yanks the pane the user is dragging.
    const { left, right } = await mount({
      left: { scrollHeight: 1000, clientHeight: 200 }, // range 800
      right: { scrollHeight: 500, clientHeight: 200 }, // range 300
      configure: el => (el.syncMode = "absolute"),
    });

    left.scrollTop = 500;
    await flush();

    expect(right.scrollTop).toBe(300); // clamped, as it must be
    expect(left.scrollTop).toBe(500); // and the user's pane stayed put
  });

  it("does not jitter the source when proportional mapping rounds", async () => {
    // 401/800 of a 300px range is 150.375, which the target rounds to 150;
    // mapping 150 back gives 400. Without the guard the source twitches by a
    // pixel on every scroll step.
    const { left, right } = await mount({
      left: { scrollHeight: 1000, clientHeight: 200 }, // range 800
      right: { scrollHeight: 500, clientHeight: 200 }, // range 300
    });

    left.scrollTop = 401;
    await flush();

    expect(right.scrollTop).toBe(150);
    expect(left.scrollTop).toBe(401);
  });

  it("does not bounce back — one gesture moves each pane once", async () => {
    const { left, right, leftState, rightState } = await mount();
    const leftBefore = leftState.scrollEvents;

    left.scrollTop = 400;
    await flush();

    // The right pane moved once in response. Crucially the left pane did NOT
    // move again: without the echo guard, the right pane's scroll event syncs
    // back and the two fight.
    expect(rightState.scrollEvents).toBe(1);
    expect(leftState.scrollEvents).toBe(leftBefore + 1);
    expect(left.scrollTop).toBe(400);
  });

  it("stays responsive after a sync that could not move the target", async () => {
    // The right pane cannot scroll, so the programmatic assignment does
    // nothing and fires no event. If the echo mark survived that, it would
    // swallow the next genuine scroll on the right pane.
    const { left, right, leftState } = await mount({
      right: { scrollHeight: 100, clientHeight: 200 },
    });
    left.scrollTop = 400;
    await flush();
    expect(right.scrollTop).toBe(0);

    right.dispatchEvent(new Event("scroll"));
    await flush();
    // The right pane's scroll was honoured, not eaten: it mapped its own
    // position (0) onto the left pane.
    expect(leftState.scrollEvents).toBeGreaterThan(1);
    expect(left.scrollTop).toBe(0);
  });

  it("syncs in both directions", async () => {
    const { left, right } = await mount();
    right.scrollTop = 800;
    await flush();
    expect(left.scrollTop).toBe(800);
  });

  it("maps proportionally between documents of different lengths", async () => {
    const { left, right } = await mount({
      left: { scrollHeight: 1000, clientHeight: 200 }, // range 800
      right: { scrollHeight: 4200, clientHeight: 200 }, // range 4000
    });
    left.scrollTop = 400; // 50%
    await flush();
    expect(right.scrollTop).toBe(2000);
  });

  it("honours absolute mode", async () => {
    const { left, right } = await mount({
      left: { scrollHeight: 1000, clientHeight: 200 },
      right: { scrollHeight: 4200, clientHeight: 200 },
      configure: el => (el.syncMode = "absolute"),
    });
    left.scrollTop = 400;
    await flush();
    expect(right.scrollTop).toBe(400);
  });

  it("stops syncing when the lock is off", async () => {
    const { element, left, right } = await mount({ configure: el => (el.sync = false) });
    left.scrollTop = 400;
    await flush();

    expect(element.sync).toBe(false);
    expect(right.scrollTop).toBe(0);
  });

  it("toggles the lock, emits the intent, and realigns on re-engage", async () => {
    const { element, left, right } = await mount();
    const toggled = vi.fn();
    element.addEventListener("sync-toggled", toggled);
    const toggle = element.shadowRoot!.querySelector<HTMLButtonElement>('[part="sync-toggle"]')!;

    toggle.click();
    await flush();
    expect(element.sync).toBe(false);
    expect((toggled.mock.calls[0]![0] as CustomEvent<{ sync: boolean }>).detail).toEqual({
      sync: false,
    });

    // Drift apart while unlocked.
    left.scrollTop = 600;
    await flush();
    expect(right.scrollTop).toBe(0);

    toggle.click();
    await flush();
    expect(element.sync).toBe(true);
    // Re-engaging aligns immediately rather than waiting for the next scroll,
    // which would leave the panes visibly out of step while claiming to be locked.
    expect(right.scrollTop).toBe(600);
  });

  it("labels the panes and names the toggle by its state", async () => {
    const { element } = await mount({
      configure: el => {
        el.heading = "Clause 4.2";
        el.leftLabel = "Template 2026";
        el.rightLabel = "MSA_Acme v4";
      },
    });
    const q = (selector: string): HTMLElement | null =>
      element.shadowRoot!.querySelector(selector);

    expect(q('[part="heading"]')?.textContent).toBe("Clause 4.2");
    expect(q("#compare-left-label")?.textContent).toBe("Template 2026");
    expect(q("#compare-right-label")?.textContent).toBe("MSA_Acme v4");

    const toggle = q('[part="sync-toggle"]')!;
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(toggle.getAttribute("aria-label")).toBe("Scroll lock on, disable");

    (toggle as HTMLButtonElement).click();
    await flush();
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(toggle.getAttribute("aria-label")).toBe("Scroll lock off, enable");
  });

  it("gives each pane an accessible name from its label", async () => {
    const { element, left, right } = await mount({
      configure: el => {
        el.leftLabel = "Before";
        el.rightLabel = "After";
      },
    });
    const nameOf = (pane: HTMLElement): string | null | undefined =>
      element.shadowRoot!.querySelector(`#${pane.getAttribute("aria-labelledby")!}`)?.textContent;

    expect(left.getAttribute("role")).toBe("region");
    expect(right.getAttribute("role")).toBe("region");
    expect(nameOf(left)).toBe("Before");
    expect(nameOf(right)).toBe("After");
  });

  it("escapes hostile label content", async () => {
    const { element } = await mount({
      configure: el => {
        el.heading = "<script>alert('h')</script>";
        el.leftLabel = "<img src=x onerror=alert(1)>";
      },
    });

    expect(element.shadowRoot!.querySelector("script")).toBeNull();
    expect(element.shadowRoot!.querySelector("img")).toBeNull();
    expect(element.shadowRoot!.querySelector('[part="heading"]')?.textContent).toBe(
      "<script>alert('h')</script>",
    );
  });
});
