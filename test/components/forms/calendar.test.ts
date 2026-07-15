// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { BoxCalendarElement, defineBoxCalendarElement } from "../../../src/components/forms/calendar.js";

const create = (attrs: Record<string, string> = {}): BoxCalendarElement => {
  const element = document.createElement("box-calendar") as BoxCalendarElement;
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
  document.body.append(element);
  return element;
};

describe("BoxCalendarElement", () => {
  beforeEach(() => {
    defineBoxCalendarElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders the displayed month with the right number of days", () => {
    const element = create({ month: "2026-02" });
    const days = element.shadowRoot?.querySelectorAll('[part~="day"]');
    // February 2026 has 28 days.
    expect(days?.length).toBe(28);
    expect(element.shadowRoot?.querySelector('[part="title"]')?.textContent).toContain("February 2026");
  });

  it("marks the selected value", () => {
    const element = create({ value: "2026-07-18", month: "2026-07" });
    const selected = element.shadowRoot?.querySelector('[data-selected="true"]');
    expect(selected?.getAttribute("data-date")).toBe("2026-07-18");
  });

  it("emits value-changed when a day is clicked", () => {
    const element = create({ month: "2026-07" });
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);

    const day = element.shadowRoot?.querySelector('[data-date="2026-07-10"]') as HTMLButtonElement | null;
    day?.click();

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { value: "2026-07-10" } }),
    );
    expect(element.value).toBe("2026-07-10");
  });

  it("restores roving focus on the selected day after click", () => {
    const element = create({ month: "2026-07" });

    const day = element.shadowRoot?.querySelector('[data-date="2026-07-10"]') as HTMLButtonElement | null;
    day?.click();

    expect(element.shadowRoot?.activeElement?.getAttribute("data-date")).toBe("2026-07-10");
    expect(
      element.shadowRoot?.querySelector('[part~="day"][tabindex="0"]')?.getAttribute("data-date"),
    ).toBe("2026-07-10");
  });

  it("advances the month with the next-month control", () => {
    const element = create({ month: "2026-12" });
    const changed = vi.fn();
    element.addEventListener("month-changed", changed);

    const next = element.shadowRoot?.querySelector('[part~="nav-next"]') as HTMLButtonElement | null;
    next?.click();

    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { month: "2027-01" } }),
    );
    expect(element.shadowRoot?.querySelector('[part="title"]')?.textContent).toContain("January 2027");
  });

  it("disables days outside the min/max range", () => {
    const element = create({ month: "2026-07", min: "2026-07-10", max: "2026-07-20" });
    const early = element.shadowRoot?.querySelector('[data-date="2026-07-05"]') as HTMLButtonElement | null;
    const inside = element.shadowRoot?.querySelector('[data-date="2026-07-15"]') as HTMLButtonElement | null;
    const late = element.shadowRoot?.querySelector('[data-date="2026-07-25"]') as HTMLButtonElement | null;

    expect(early?.disabled).toBe(true);
    expect(inside?.disabled).toBe(false);
    expect(late?.disabled).toBe(true);
  });

  it("does not select an out-of-range day", () => {
    const element = create({ month: "2026-07", min: "2026-07-10" });
    const changed = vi.fn();
    element.addEventListener("value-changed", changed);

    const early = element.shadowRoot?.querySelector('[data-date="2026-07-05"]') as HTMLButtonElement | null;
    early?.click();

    expect(changed).not.toHaveBeenCalled();
    expect(element.value).toBe("");
  });

  it("moves roving focus across a month boundary with arrow keys", () => {
    const element = create({ value: "2026-07-31", month: "2026-07" });
    const grid = element.shadowRoot?.querySelector('[part="grid"]') as HTMLElement | null;
    grid?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    // Rolling past July 31 lands on August, so the grid re-renders to August.
    expect(element.shadowRoot?.querySelector('[part="title"]')?.textContent).toContain("August 2026");
    expect(element.month).toBe("2026-08");
    // Roving focus must follow into the new month's grid.
    expect(element.shadowRoot?.activeElement?.getAttribute("data-date")).toBe("2026-08-01");
  });

  it("groups day cells into week rows for the ARIA grid pattern", () => {
    const element = create({ month: "2026-02" });
    const grid = element.shadowRoot?.querySelector('[part="grid"]');
    // The weekdays header row and every week row must live inside the grid so the
    // ARIA grid pattern has a valid owning ancestor for its rows.
    const weeks = grid?.querySelectorAll('[part="week"]');
    // February 2026 starts on a Sunday and has 28 days: exactly four full weeks.
    expect(weeks?.length).toBe(4);
    // Header row + week rows are all owned by the grid, and each spans seven cells.
    const rows = grid?.querySelectorAll('[role="row"]');
    expect(rows?.length).toBe(5);
    for (const row of Array.from(rows ?? [])) {
      expect(row.childElementCount).toBe(7);
    }
  });

  it("keeps a tabbable cell when the default active day is out of range", () => {
    // A month with no selection and not the current month defaults its active day
    // to the 1st, which here is out of range and must clamp to the first enabled day.
    const element = create({ month: "2027-03", min: "2027-03-15" });
    const tabbable = element.shadowRoot?.querySelector('[part~="day"][tabindex="0"]') as
      | HTMLButtonElement
      | null;
    expect(tabbable?.getAttribute("data-date")).toBe("2027-03-15");
    expect(tabbable?.disabled).toBe(false);
  });
});
