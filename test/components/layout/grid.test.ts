// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Grid } from "../../../src/components/layout/grid.js";
import {
  BOE_GRID_COLUMNS,
  BOE_GRID_GUTTER_PROPERTY,
  boeGridGutterStyles,
  isBoeGridPlacementRecord,
  resolveBoeGridPlacement,
  resolveGridCount,
} from "../../../src/foundations/layout/index.js";

describe("responsive grid foundation", () => {
  it("uses Spectrum's twelve columns", () => {
    expect(BOE_GRID_COLUMNS).toBe(12);
  });

  it("emits Spectrum's gutter scale against the given selector", () => {
    const css = boeGridGutterStyles(":host");
    // Fixed values per breakpoint, not a proportion of the grid.
    for (const [width, gutter] of [
      ["768px", "24px"],
      ["1280px", "32px"],
      ["1768px", "40px"],
      ["2160px", "48px"],
    ]) {
      expect(css).toContain(`@media (min-width: ${width})`);
      expect(css).toContain(`${BOE_GRID_GUTTER_PROPERTY}: ${gutter}`);
    }
    // The smallest breakpoint is unconditional — a media query with min-width 0
    // would be noise, and the value has to apply below 768px.
    expect(css).toContain(`${BOE_GRID_GUTTER_PROPERTY}: 16px`);
    expect(css).not.toContain("@media (min-width: 0px)");
  });

  it("scopes the scale to whatever selector it is handed", () => {
    expect(boeGridGutterStyles(".canvas")).toContain(".canvas {");
    expect(boeGridGutterStyles(".canvas")).not.toContain(":host {");
  });

  it("confines a region to the grid it was given", () => {
    expect(resolveBoeGridPlacement({ span: 9, rowSpan: 5 }, 3, 3)).toEqual({
      span: 3,
      rowSpan: 3,
      offset: 0,
    });
  });

  it("leaves room for the region after an offset", () => {
    expect(resolveBoeGridPlacement({ span: 3, offset: 2 }, 3, 1)).toEqual({
      span: 1,
      rowSpan: 1,
      offset: 2,
    });
  });

  it("validates placement records", () => {
    expect(isBoeGridPlacementRecord({})).toBe(true);
    expect(isBoeGridPlacementRecord({ span: 2 })).toBe(true);
    expect(isBoeGridPlacementRecord({ span: "2" })).toBe(false);
    expect(isBoeGridPlacementRecord([])).toBe(false);
    expect(isBoeGridPlacementRecord(null)).toBe(false);
  });

  it("falls back when a count attribute is absent or junk", () => {
    expect(resolveGridCount("4", 12)).toBe(4);
    expect(resolveGridCount(null, 12)).toBe(12);
    expect(resolveGridCount("banana", 12)).toBe(12);
    // Below one is meaningless for a track count.
    expect(resolveGridCount("0", 12)).toBe(1);
    expect(resolveGridCount("-3", 12)).toBe(1);
  });
});

describe("box-grid", () => {
  beforeEach(() => {
    Grid.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const mount = (html = "", configure: (element: Grid) => void = () => {}): Grid => {
    const element = document.createElement("box-grid") as Grid;
    element.innerHTML = html;
    configure(element);
    document.body.append(element);
    return element;
  };

  const styles = (element: Grid): string =>
    element.shadowRoot?.querySelector("style")?.textContent ?? "";

  const gridEl = (element: Grid): HTMLElement =>
    element.shadowRoot!.querySelector('[part="grid"]')!;

  it("defaults to Spectrum's twelve columns", () => {
    const element = mount();
    expect(element.columns).toBe(12);
    expect(gridEl(element).style.getPropertyValue("--boe-grid-columns")).toBe("12");
  });

  it("takes a column count and falls back for junk", () => {
    expect(mount("", el => (el.columns = 4)).columns).toBe(4);
    expect(mount("", el => el.setAttribute("columns", "nonsense")).columns).toBe(12);
  });

  it("dissolves the slot so children become grid items", () => {
    // Without display: contents the slot is the single grid item and every
    // child lands in one cell.
    expect(styles(mount())).toMatch(/slot \{\s*display: contents;/);
  });

  it("places children from their own attributes, leaving the light DOM alone", () => {
    const element = mount(`<div id="a" data-span="8"></div><div id="b" data-span="4"></div>`);
    const a = element.querySelector("#a") as HTMLElement;
    const b = element.querySelector("#b") as HTMLElement;

    // The rules are CSS, so nothing is written onto the author's nodes.
    expect(a.getAttribute("style")).toBeNull();
    expect(b.getAttribute("style")).toBeNull();
    expect(styles(element)).toContain('::slotted([data-span="8"]) { grid-column-end: span 8; }');
    expect(styles(element)).toContain('::slotted([data-span="4"]) { grid-column-end: span 4; }');
  });

  it("sets column start and end in separate rules so offset and span compose", () => {
    // One rule per value rather than per offset x span pair — 24 + 23 rules
    // instead of 576.
    const css = styles(mount());
    expect(css).toContain('::slotted([data-offset="3"]) { grid-column-start: 4; }');
    expect(css).toContain('::slotted([data-span="6"]) { grid-column-end: span 6; }');
    expect(css).not.toMatch(/grid-column:\s*\d+\s*\/\s*span/);
  });

  it("spans rows when asked", () => {
    expect(styles(mount())).toContain('::slotted([data-row-span="2"]) { grid-row: span 2; }');
  });

  it("gives an unplaced child a single column", () => {
    expect(styles(mount())).toMatch(/::slotted\(\*\) \{\s*grid-column-end: span 1;/);
  });

  it("leaves row height unset so rows fit their content", () => {
    // A layout grid's rows should be as tall as what is in them; pinning a
    // height by default would crop real content.
    const element = mount();
    expect(element.rowHeight).toBe("");
    expect(element.hasAttribute("row-height")).toBe(false);
    expect(styles(element)).toContain(':host([row-height]) [part="grid"]');
  });

  it("applies a row height when one is given, and clears it again", () => {
    const element = mount("", el => (el.rowHeight = "80px"));
    expect(gridEl(element).style.getPropertyValue("--boe-grid-row-height")).toBe("80px");

    element.rowHeight = "";
    expect(element.hasAttribute("row-height")).toBe(false);
  });

  it("keeps a hostile row height out of markup", () => {
    // Custom properties are NOT validated the way a standard property like
    // `width` is — setProperty stores almost any token sequence, so the value
    // survives verbatim. What matters is that it never reaches an HTML string:
    // no attribute breaks out, and no element is injected.
    const element = mount("", el =>
      el.setAttribute("row-height", '80px" onload="alert(1)'),
    );

    // The text "onload" does appear in the serialized style attribute — but
    // escaped, which is exactly the point: the quote that would have closed the
    // attribute comes back as &quot;, so it cannot become an attribute of its
    // own. Asserting the substring is absent would be testing the wrong thing.
    expect(element.shadowRoot?.querySelectorAll('[part="grid"]').length).toBe(1);
    expect(gridEl(element).getAttribute("onload")).toBeNull();
    expect(gridEl(element).outerHTML).not.toContain('" onload="');
    expect(gridEl(element).outerHTML).toContain("&quot;");
  });

  it("carries the shared gutter scale, not a private one", () => {
    // box-skeleton reads the same property, so overriding it once keeps a
    // placeholder matching the layout it stands in for.
    const css = styles(mount());
    expect(css).toContain("--boe-grid-gutter: 16px");
    expect(css).toContain("gap: var(--boe-grid-gutter)");
  });
});
