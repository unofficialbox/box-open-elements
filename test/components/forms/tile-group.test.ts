// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TileGroup, isTileOptionRecord } from "../../../src/components/forms/tile-group.js";

const OPTIONS = [
  { id: "team", label: "Team", description: "Up to 25 people." },
  { id: "business", label: "Business", description: "Unlimited storage." },
  { id: "legacy", label: "Legacy", disabled: true },
];

describe("tile option records", () => {
  it("validates author payloads", () => {
    expect(isTileOptionRecord({ id: "a", label: "A" })).toBe(true);
    expect(isTileOptionRecord({ id: "a" })).toBe(false);
    expect(isTileOptionRecord({ label: "A" })).toBe(false);
    expect(isTileOptionRecord(null)).toBe(false);
    expect(isTileOptionRecord([])).toBe(false);
  });
});

describe("box-tile-group", () => {
  beforeEach(() => {
    TileGroup.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const mount = (configure: (element: TileGroup) => void = () => {}): TileGroup => {
    const element = document.createElement("box-tile-group") as TileGroup;
    element.options = OPTIONS;
    element.name = "plan";
    configure(element);
    document.body.append(element);
    return element;
  };

  const tiles = (element: TileGroup): HTMLElement[] =>
    Array.from(element.shadowRoot!.querySelectorAll<HTMLElement>('[part="tile"]'));

  const controls = (element: TileGroup): HTMLInputElement[] =>
    Array.from(element.shadowRoot!.querySelectorAll<HTMLInputElement>('[part="control"]'));

  it("wraps a real radio per tile, so grouping is the platform's", () => {
    // Arrow-key navigation, roving focus and form participation all come free;
    // reimplementing them on divs is where these controls usually go wrong.
    const element = mount();

    expect(tiles(element)).toHaveLength(3);
    expect(controls(element).every(input => input.type === "radio")).toBe(true);
    expect(controls(element).every(input => input.name === "plan")).toBe(true);
  });

  it("switches to checkboxes when several may be chosen", () => {
    expect(controls(mount(el => (el.multiple = true))).every(i => i.type === "checkbox")).toBe(true);
  });

  it("reflects the selected value onto the control and the tile", () => {
    const element = mount(el => (el.value = "business"));

    expect(element.selected).toEqual(["business"]);
    expect(tiles(element)[1]?.dataset.selected).toBe("true");
    expect(controls(element)[1]?.checked).toBe(true);
    expect(tiles(element)[0]?.dataset.selected).toBe("false");
  });

  it("reads several selections back as an array", () => {
    const element = mount(el => {
      el.multiple = true;
      el.value = "team,business";
    });

    expect(element.selected).toEqual(["team", "business"]);
  });

  it("emits the new selection on change", () => {
    const element = mount();
    const changed = vi.fn();
    element.addEventListener("tile-change", changed);

    controls(element)[0]!.checked = true;
    controls(element)[0]!.dispatchEvent(new Event("change", { bubbles: true }));

    expect(element.value).toBe("team");
    expect(changed.mock.calls[0][0].detail).toEqual({ selected: ["team"] });
  });

  it("disables the control, not just the styling", () => {
    // A tile that only looks disabled is still focusable and still submits.
    const element = mount();

    expect(controls(element)[2]?.disabled).toBe(true);
    expect(tiles(element)[2]?.dataset.disabled).toBe("true");
  });

  it("escapes author-supplied labels", () => {
    const element = mount(el => {
      el.options = [{ id: "x", label: '<img src=x onerror="alert(1)">' }];
    });

    expect(element.shadowRoot?.querySelector("img")).toBeNull();
    expect(element.shadowRoot?.querySelector('[part="tile-label"]')?.textContent).toContain("<img");
  });

  it("ignores a malformed options payload rather than rendering junk", () => {
    const element = mount(el => el.setAttribute("options", "not json"));
    expect(tiles(element)).toHaveLength(0);

    element.setAttribute("options", JSON.stringify([{ id: "a" }]));
    expect(tiles(element)).toHaveLength(0);
  });

  it("shows focus on the tile, since the control itself is hidden", () => {
    // Without this the keyboard focus ring would be invisible.
    const styles = mount().shadowRoot?.querySelector("style")?.textContent ?? "";

    expect(styles).toContain('[part="tile"]:has(input:focus-visible)');
  });

  it("keeps the legend after a rebuild", () => {
    // The legend lives inside the fieldset the rebuild wipes.
    const element = mount(el => (el.legend = "Choose a plan"));
    expect(element.shadowRoot?.querySelector('[part="legend"]')?.textContent).toBe("Choose a plan");

    element.options = [{ id: "solo", label: "Solo" }];
    expect(element.shadowRoot?.querySelector('[part="legend"]')?.textContent).toBe("Choose a plan");
  });
});
