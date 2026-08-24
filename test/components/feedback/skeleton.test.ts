// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SKELETON_DEFAULT_COLUMNS,
  Skeleton,
  isSkeletonGridItemRecord,
  resolveSkeletonGridItem,
} from "../../../src/components/feedback/skeleton.js";
import { boeMotionDuration, boeMotionEasing } from "../../../src/foundations/motion/index.js";

describe("Skeleton", () => {
  beforeEach(() => {
    Skeleton.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders with the provided dimensions", () => {
    const element = document.createElement("box-skeleton") as Skeleton;
    element.width = "180px";
    element.height = "24px";

    document.body.append(element);

    const skeleton = element.shadowRoot?.querySelector('[part="skeleton"]') as HTMLSpanElement | null;
    expect(skeleton?.style.width).toBe("180px");
    expect(skeleton?.style.height).toBe("24px");
  });

  it("does not allow attribute values to inject markup", () => {
    const element = document.createElement("box-skeleton") as Skeleton;
    element.width = '16px" aria-hidden="false"><img src=x onerror=alert(1)>';
    document.body.append(element);

    // No markup was injected: the shadow root contains only the single span.
    expect(element.shadowRoot?.querySelector("img")).toBeNull();
    expect(element.shadowRoot?.querySelectorAll('[part="skeleton"]').length).toBe(1);
    // The malformed value was rejected by the CSSOM rather than reflected.
    const skeleton = element.shadowRoot?.querySelector('[part="skeleton"]') as HTMLSpanElement | null;
    expect(skeleton?.style.width).toBe("");
  });

  it("skips CSSOM writes when dimensions are unchanged", () => {
    const element = document.createElement("box-skeleton") as Skeleton;
    element.width = "100px";
    element.height = "16px";
    document.body.append(element);

    const skeleton = element.shadowRoot?.querySelector('[part="skeleton"]') as HTMLSpanElement;
    const setProperty = vi.spyOn(skeleton.style, "setProperty");

    element.width = "100px";
    element.height = "16px";

    expect(setProperty).not.toHaveBeenCalled();
    expect(skeleton.style.width).toBe("100px");
    expect(skeleton.style.height).toBe("16px");
  });

  it("uses shared motion vocabulary for shimmer and reduced-motion", () => {
    const element = document.createElement("box-skeleton") as Skeleton;
    document.body.append(element);

    const styleText = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styleText).toContain(
      `animation: boe-skeleton-shimmer ${boeMotionDuration.shimmer} ${boeMotionEasing.standard} infinite`,
    );
    expect(styleText).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styleText).toContain('[part="skeleton"]');
    expect(styleText).toContain("animation: none;");
  });

  it("writes only the changed dimension", () => {
    const element = document.createElement("box-skeleton") as Skeleton;
    element.width = "100px";
    element.height = "16px";
    document.body.append(element);

    const skeleton = element.shadowRoot?.querySelector('[part="skeleton"]') as HTMLSpanElement;
    const setProperty = vi.spyOn(skeleton.style, "setProperty");

    element.width = "200px";

    expect(setProperty).toHaveBeenCalledTimes(1);
    expect(setProperty).toHaveBeenCalledWith("width", "200px");
    expect(skeleton.style.width).toBe("200px");
    expect(skeleton.style.height).toBe("16px");
  });
});

describe("resolveSkeletonGridItem", () => {
  it("confines a region to the grid it was given", () => {
    // The point of the clamps: a region cannot push the layout past the totals
    // the author declared, however the host computed its numbers.
    expect(resolveSkeletonGridItem({ span: 9, rowSpan: 5 }, 3, 3)).toEqual({
      span: 3,
      rowSpan: 3,
      offset: 0,
    });
  });

  it("leaves room for the region after an offset", () => {
    // offset 2 of 3 columns leaves one, so a span of 3 has to become 1.
    expect(resolveSkeletonGridItem({ span: 3, offset: 2 }, 3, 1)).toEqual({
      span: 1,
      rowSpan: 1,
      offset: 2,
    });
    // An offset that would leave no room at all is itself clamped.
    expect(resolveSkeletonGridItem({ offset: 7 }, 3, 1)).toEqual({
      span: 1,
      rowSpan: 1,
      offset: 2,
    });
  });

  it("floors each value at one, so a zero or negative span still draws", () => {
    expect(resolveSkeletonGridItem({ span: 0, rowSpan: -4 }, 3, 3)).toEqual({
      span: 1,
      rowSpan: 1,
      offset: 0,
    });
  });

  it("defaults an unspecified region to a single cell", () => {
    expect(resolveSkeletonGridItem({}, 12, 4)).toEqual({ span: 1, rowSpan: 1, offset: 0 });
  });

  it("truncates fractional spans rather than producing a fractional track", () => {
    expect(resolveSkeletonGridItem({ span: 2.9 }, 12, 1).span).toBe(2);
  });
});

describe("isSkeletonGridItemRecord", () => {
  it("accepts an empty record and rejects non-numeric fields", () => {
    expect(isSkeletonGridItemRecord({})).toBe(true);
    expect(isSkeletonGridItemRecord({ span: 2, rowSpan: 1, offset: 0 })).toBe(true);
    // Present but wrong means the host built the payload wrong; substituting a
    // default would hide that.
    expect(isSkeletonGridItemRecord({ span: "2" })).toBe(false);
    expect(isSkeletonGridItemRecord({ span: Number.NaN })).toBe(false);
    expect(isSkeletonGridItemRecord({ span: Infinity })).toBe(false);
    expect(isSkeletonGridItemRecord(null)).toBe(false);
    expect(isSkeletonGridItemRecord([])).toBe(false);
  });
});

describe("Skeleton variants", () => {
  beforeEach(() => {
    Skeleton.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const mount = (configure: (element: Skeleton) => void = () => {}): Skeleton => {
    const element = document.createElement("box-skeleton") as Skeleton;
    configure(element);
    document.body.append(element);
    return element;
  };

  const bars = (element: Skeleton): HTMLElement[] =>
    Array.from(element.shadowRoot!.querySelectorAll('[part="skeleton"]'));

  it("falls back to the box variant for an unknown value", () => {
    expect(mount(el => el.setAttribute("variant", "hexagon")).variant).toBe("box");
    expect(mount(el => el.setAttribute("variant", "")).variant).toBe("box");
  });

  it("draws the requested number of lines", () => {
    const element = mount(el => {
      el.variant = "line";
      el.lines = 4;
    });

    expect(bars(element)).toHaveLength(4);
    expect(element.shadowRoot?.querySelector('[part="lines"]')).not.toBeNull();
  });

  it("defaults to three lines and floors the count at one", () => {
    expect(bars(mount(el => (el.variant = "line")))).toHaveLength(3);
    expect(
      bars(
        mount(el => {
          el.variant = "line";
          el.lines = 0;
        }),
      ),
    ).toHaveLength(1);
  });

  it("adds and removes bars in place when the count changes", () => {
    // Replacing every node on each update would restart the shimmer, so the
    // surviving bars have to be the same elements.
    const element = mount(el => {
      el.variant = "line";
      el.lines = 2;
    });
    const [first] = bars(element);

    element.lines = 5;
    expect(bars(element)).toHaveLength(5);
    expect(bars(element)[0]).toBe(first);

    element.lines = 1;
    expect(bars(element)).toHaveLength(1);
    expect(bars(element)[0]).toBe(first);
  });

  it("sizes each line with the height attribute", () => {
    const element = mount(el => {
      el.variant = "line";
      el.lines = 2;
      el.height = "22px";
    });

    expect(bars(element).map(bar => bar.style.height)).toEqual(["22px", "22px"]);
  });

  it("fills a bare grid with one region per cell", () => {
    // rows and columns alone describe a uniform grid.
    const element = mount(el => {
      el.variant = "grid";
      el.columns = 3;
      el.rows = 2;
    });

    expect(bars(element)).toHaveLength(6);
    expect(element.resolvedItems.every(item => item.span === 1 && item.rowSpan === 1)).toBe(true);
  });

  it("spans the columns and rows each region asks for", () => {
    // The reported case: three columns, and a row holding a 1-wide region
    // beside a 2-wide one.
    const element = mount(el => {
      el.variant = "grid";
      el.columns = 3;
      el.rows = 3;
      el.items = [{ span: 3 }, { span: 1, rowSpan: 2 }, { span: 2 }];
    });

    expect(bars(element).map(bar => bar.style.gridColumn)).toEqual([
      "span 3",
      "span 1",
      "span 2",
    ]);
    expect(bars(element).map(bar => bar.style.gridRow)).toEqual(["span 1", "span 2", "span 1"]);
  });

  it("confines a region to the declared totals", () => {
    const element = mount(el => {
      el.variant = "grid";
      el.columns = 3;
      el.rows = 2;
      el.items = [{ span: 12, rowSpan: 9 }];
    });

    expect(bars(element)[0]?.style.gridColumn).toBe("span 3");
    expect(bars(element)[0]?.style.gridRow).toBe("span 2");
  });

  it("renders an offset as a spacer rather than an explicit column start", () => {
    // An explicit grid-column-start makes the item hunt for a row where that
    // column is free, which reorders the regions the author listed.
    const element = mount(el => {
      el.variant = "grid";
      el.columns = 4;
      el.items = [{ span: 2, offset: 2 }];
    });

    const spacer = element.shadowRoot?.querySelector('[part="grid-offset"]') as HTMLElement | null;
    expect(spacer?.style.gridColumn).toBe("span 2");
    expect(bars(element)).toHaveLength(1);
    expect(bars(element)[0]?.style.gridColumn).toBe("span 2");
    // The spacer comes first, so the region lands after the gap.
    expect(element.shadowRoot?.querySelector('[part="grid"]')?.firstElementChild).toBe(spacer);
  });

  it("emits no spacer when there is no offset", () => {
    const element = mount(el => {
      el.variant = "grid";
      el.items = [{ span: 2 }];
    });

    expect(element.shadowRoot?.querySelector('[part="grid-offset"]')).toBeNull();
  });

  it("defaults to Spectrum's twelve columns", () => {
    const element = mount(el => (el.variant = "grid"));
    expect(element.columns).toBe(SKELETON_DEFAULT_COLUMNS);
    expect(SKELETON_DEFAULT_COLUMNS).toBe(12);
    expect(
      (element.shadowRoot?.querySelector('[part="grid"]') as HTMLElement).style.getPropertyValue(
        "--boe-skeleton-columns",
      ),
    ).toBe("12");
  });

  it("carries Spectrum's per-breakpoint gutters", () => {
    // Fixed values per breakpoint, not a proportion of the grid.
    const styles =
      mount(el => (el.variant = "grid")).shadowRoot?.querySelector("style")?.textContent ?? "";
    for (const [width, gutter] of [
      ["768px", "24px"],
      ["1280px", "32px"],
      ["1768px", "40px"],
      ["2160px", "48px"],
    ]) {
      expect(styles).toContain(`@media (min-width: ${width})`);
      expect(styles).toContain(`--boe-skeleton-gutter: ${gutter}`);
    }
    expect(styles).toContain("gap: var(--boe-skeleton-gutter)");
  });

  it("ignores a malformed items payload", () => {
    const element = mount(el => {
      el.variant = "grid";
      el.columns = 2;
      el.rows = 1;
      el.setAttribute("items", '[{"span":1},{"span":"wide"}]');
    });

    // Rejected wholesale, falling back to the uniform fill rather than
    // rendering half the layout the host asked for.
    expect(element.items).toEqual([]);
    expect(bars(element)).toHaveLength(2);
  });

  it("never shares its items cache", () => {
    const element = mount(el => {
      el.variant = "grid";
      el.items = [{ span: 2 }];
    });

    const first = element.items;
    first.push({ span: 9 });
    expect(element.items).toEqual([{ span: 2 }]);
  });

  it("restores the single box when the variant goes back", () => {
    const element = mount(el => {
      el.variant = "line";
      el.lines = 4;
    });
    expect(bars(element)).toHaveLength(4);

    element.variant = "box";
    element.width = "180px";
    expect(bars(element)).toHaveLength(1);
    expect(element.shadowRoot?.querySelector('[part="lines"]')).toBeNull();
    expect(bars(element)[0]?.style.width).toBe("180px");
  });
});
