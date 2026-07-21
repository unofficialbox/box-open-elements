/**
 * Viewport-aware anchored positioning for overlays (popover, tooltip, dropdown,
 * menu, context-menu). box-open-elements has no portal, so floating surfaces
 * position with `position: fixed` in viewport coordinates — which also lets them
 * escape `overflow: hidden` / stacking-context ancestors, the job a portal does
 * in box-ui-elements.
 *
 * The geometry core (`resolvePosition`) is pure and DOM-free so it can be unit
 * tested with plain rects; the DOM helpers (`anchorFloating`, `trackAnchor`)
 * read live rects and apply styles.
 *
 * Behaviour mirrors box-ui-elements' flyout: a preferred placement, `flip` to
 * the opposite side when it would overflow, and `shift` along the cross axis to
 * stay within the viewport.
 */

/** Primary side the floating element sits on, relative to the anchor. */
export type OverlaySide = "top" | "bottom" | "left" | "right";

/** Cross-axis alignment of the floating element against the anchor edge. */
export type OverlayAlign = "start" | "center" | "end";

export interface OverlayPlacement {
  side: OverlaySide;
  align: OverlayAlign;
}

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface PositionOptions {
  /** Preferred placement. Default `{ side: "bottom", align: "start" }`. */
  placement?: OverlayPlacement;
  /** Gap between the anchor edge and the floating element, in px. Default 4. */
  offset?: number;
  /** Flip to the opposite side when the preferred side would overflow. Default true. */
  flip?: boolean;
  /** Shift along the cross axis to keep the element inside the viewport. Default true. */
  shift?: boolean;
  /** Minimum gap kept from each viewport edge, in px. Default 8. */
  padding?: number;
}

export interface PositionResult {
  /** Viewport x (use as `left` for a `position: fixed` element). */
  x: number;
  /** Viewport y (use as `top`). */
  y: number;
  /** The side actually used (may differ from the request after a flip). */
  side: OverlaySide;
  /** The cross-axis alignment used. */
  align: OverlayAlign;
}

const OPPOSITE: Record<OverlaySide, OverlaySide> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

const isVertical = (side: OverlaySide): boolean => side === "top" || side === "bottom";

/** Cross-axis start coordinate for an alignment. */
const alignStart = (anchorStart: number, anchorSize: number, floatingSize: number, align: OverlayAlign): number => {
  if (align === "center") return anchorStart + anchorSize / 2 - floatingSize / 2;
  if (align === "end") return anchorStart + anchorSize - floatingSize;
  return anchorStart;
};

/** Main-axis coordinate for a side (top/left of the floating element). */
const sideCoord = (anchor: Rect, floating: Size, side: OverlaySide, offset: number): number => {
  switch (side) {
    case "bottom":
      return anchor.top + anchor.height + offset;
    case "top":
      return anchor.top - floating.height - offset;
    case "right":
      return anchor.left + anchor.width + offset;
    case "left":
      return anchor.left - floating.width - offset;
  }
};

/** Space available between the anchor and the viewport edge on a given side. */
const spaceOn = (anchor: Rect, viewport: Size, side: OverlaySide): number => {
  switch (side) {
    case "top":
      return anchor.top;
    case "bottom":
      return viewport.height - (anchor.top + anchor.height);
    case "left":
      return anchor.left;
    case "right":
      return viewport.width - (anchor.left + anchor.width);
  }
};

const clamp = (value: number, min: number, max: number): number =>
  max < min ? min : Math.min(Math.max(value, min), max);

/**
 * Compute the viewport position of a floating element against an anchor. Pure —
 * pass plain rects (e.g. from `getBoundingClientRect()`) and the viewport size.
 */
export const resolvePosition = (
  anchor: Rect,
  floating: Size,
  viewport: Size,
  options: PositionOptions = {},
): PositionResult => {
  const { side: wantSide, align } = options.placement ?? { side: "bottom", align: "start" };
  const offset = options.offset ?? 4;
  const flip = options.flip ?? true;
  const shift = options.shift ?? true;
  const padding = options.padding ?? 8;

  // Flip: if the preferred side lacks room for the element (+offset) and the
  // opposite side has more, use the opposite side.
  let side = wantSide;
  if (flip) {
    const need = (isVertical(wantSide) ? floating.height : floating.width) + offset;
    const room = spaceOn(anchor, viewport, wantSide);
    if (room < need) {
      const opposite = OPPOSITE[wantSide];
      if (spaceOn(anchor, viewport, opposite) > room) side = opposite;
    }
  }

  let x: number;
  let y: number;
  if (isVertical(side)) {
    y = sideCoord(anchor, floating, side, offset);
    x = alignStart(anchor.left, anchor.width, floating.width, align);
    if (shift) x = clamp(x, padding, viewport.width - floating.width - padding);
  } else {
    x = sideCoord(anchor, floating, side, offset);
    y = alignStart(anchor.top, anchor.height, floating.height, align);
    if (shift) y = clamp(y, padding, viewport.height - floating.height - padding);
  }

  return { x, y, side, align };
};

/** Parse a placement string like `"bottom-start"` / `"top"` / `"right-center"`. */
export const parsePlacement = (value: string | null | undefined): OverlayPlacement | undefined => {
  if (!value) return undefined;
  const [rawSide, rawAlign] = value.trim().toLowerCase().split("-");
  const sideMap: Record<string, OverlaySide> = {
    top: "top",
    bottom: "bottom",
    left: "left",
    right: "right",
    // Legacy popover names (start = inline-start = left, end = right).
    start: "left",
    end: "right",
  };
  const side = sideMap[rawSide];
  if (!side) return undefined;
  const alignMap: Record<string, OverlayAlign> = {
    start: "start",
    center: "center",
    middle: "center",
    end: "end",
  };
  return { side, align: alignMap[rawAlign] ?? "start" };
};

const viewportSize = (): Size => ({
  width: window.innerWidth,
  height: window.innerHeight,
});

/**
 * Position `floating` against `anchor` once, applying `position: fixed` and the
 * resolved coordinates. Returns the resolved placement (e.g. for arrow styling).
 */
export const anchorFloating = (
  anchor: HTMLElement,
  floating: HTMLElement,
  options: PositionOptions = {},
): PositionResult => {
  const a = anchor.getBoundingClientRect();
  const f = floating.getBoundingClientRect();
  const result = resolvePosition(
    { top: a.top, left: a.left, width: a.width, height: a.height },
    { width: f.width, height: f.height },
    viewportSize(),
    options,
  );
  floating.style.position = "fixed";
  floating.style.left = `${Math.round(result.x)}px`;
  floating.style.top = `${Math.round(result.y)}px`;
  floating.style.margin = "0";
  return result;
};

/**
 * Keep `floating` positioned against `anchor` while it is open: reposition on
 * scroll (capture, to catch scrolling ancestors) and resize. Returns a cleanup
 * that removes the listeners. Call `anchorFloating` once up front is handled
 * internally.
 */
export const trackAnchor = (
  anchor: HTMLElement,
  floating: HTMLElement,
  options: PositionOptions = {},
  onReposition?: (result: PositionResult) => void,
): (() => void) => {
  const reposition = (): void => {
    if (!anchor.isConnected || !floating.isConnected) return;
    onReposition?.(anchorFloating(anchor, floating, options));
  };
  reposition();
  window.addEventListener("scroll", reposition, true);
  window.addEventListener("resize", reposition);
  return () => {
    window.removeEventListener("scroll", reposition, true);
    window.removeEventListener("resize", reposition);
  };
};
