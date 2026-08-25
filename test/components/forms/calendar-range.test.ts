// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Calendar } from "../../../src/components/forms/calendar.js";

describe("box-calendar range mode", () => {
  beforeEach(() => {
    Calendar.register();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const mount = (configure: (element: Calendar) => void = () => {}): Calendar => {
    const element = document.createElement("box-calendar") as Calendar;
    element.setAttribute("mode", "range");
    element.setAttribute("month", "2026-08");
    element.setAttribute("today", "2026-08-15");
    configure(element);
    document.body.append(element);
    return element;
  };

  const day = (element: Calendar, iso: string): HTMLButtonElement =>
    element.shadowRoot!.querySelector<HTMLButtonElement>(`[data-date="${iso}"]`)!;

  const inRange = (element: Calendar, iso: string): string | undefined =>
    day(element, iso).dataset.inRange;

  it("stays single-select unless asked", () => {
    // The default must not change: every existing host relies on it.
    const element = document.createElement("box-calendar") as Calendar;
    document.body.append(element);
    expect(element.mode).toBe("single");
    expect(element.getAttribute("mode")).toBeNull();
  });

  it("picks a start on the first click", () => {
    const element = mount();
    day(element, "2026-08-10").click();

    expect(element.start).toBe("2026-08-10");
    expect(element.end).toBe("");
  });

  it("closes the range on the second click", () => {
    const element = mount();
    day(element, "2026-08-10").click();
    day(element, "2026-08-14").click();

    expect(element.start).toBe("2026-08-10");
    expect(element.end).toBe("2026-08-14");
  });

  it("swaps the ends when the second click is earlier", () => {
    // Dragging backwards through a calendar means the same thing as dragging
    // forwards; refusing it would be pedantry.
    const element = mount();
    day(element, "2026-08-14").click();
    day(element, "2026-08-10").click();

    expect(element.start).toBe("2026-08-10");
    expect(element.end).toBe("2026-08-14");
  });

  it("starts over once a range is complete", () => {
    const element = mount(el => {
      el.setAttribute("start", "2026-08-10");
      el.setAttribute("end", "2026-08-14");
    });
    day(element, "2026-08-20").click();

    expect(element.start).toBe("2026-08-20");
    expect(element.end).toBe("");
  });

  it("marks the days strictly between the ends", () => {
    const element = mount(el => {
      el.setAttribute("start", "2026-08-10");
      el.setAttribute("end", "2026-08-14");
    });

    // The endpoints are selected, not in-range: they keep the brand fill.
    expect(day(element, "2026-08-10").dataset.selected).toBe("true");
    expect(inRange(element, "2026-08-10")).toBe("false");
    expect(inRange(element, "2026-08-12")).toBe("true");
    expect(day(element, "2026-08-14").dataset.selected).toBe("true");
    expect(inRange(element, "2026-08-14")).toBe("false");
    expect(inRange(element, "2026-08-15")).toBe("false");
  });

  it("marks nothing in-range while only one end is chosen", () => {
    const element = mount(el => el.setAttribute("start", "2026-08-10"));

    expect(day(element, "2026-08-10").dataset.selected).toBe("true");
    expect(inRange(element, "2026-08-12")).toBe("false");
  });

  it("emits the range on every click", () => {
    const element = mount();
    const changed = vi.fn();
    element.addEventListener("range-changed", changed);

    day(element, "2026-08-10").click();
    day(element, "2026-08-14").click();

    expect(changed).toHaveBeenCalledTimes(2);
    expect(changed.mock.calls[0][0].detail).toEqual({ start: "2026-08-10", end: "" });
    expect(changed.mock.calls[1][0].detail).toEqual({ start: "2026-08-10", end: "2026-08-14" });
  });

  it("leaves value alone in range mode", () => {
    // Overloading `value` with two dates would mean inventing a separator and
    // making every host parse it back out.
    const element = mount();
    day(element, "2026-08-10").click();

    expect(element.getAttribute("value")).toBeNull();
  });

  it("still refuses days outside min and max", () => {
    const element = mount(el => {
      el.setAttribute("min", "2026-08-05");
      el.setAttribute("max", "2026-08-20");
    });

    expect(day(element, "2026-08-03").disabled).toBe(true);
    day(element, "2026-08-03").click();
    expect(element.start).toBe("");
  });
});
