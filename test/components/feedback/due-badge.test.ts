import { afterEach, describe, expect, it } from "vitest";

import { DueBadge } from "../../../src/components/feedback/due-badge.js";
import {
  daysUntilDue,
  formatDueLabel,
  resolveDueBucket,
} from "../../../src/components/feedback/due-types.js";

DueBadge.register();

const NOW = new Date("2026-08-13T12:00:00.000Z");

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const mount = async (configure: (element: DueBadge) => void = () => {}): Promise<DueBadge> => {
  const element = document.createElement("box-due-badge") as DueBadge;
  element.referenceTime = NOW.toISOString();
  configure(element);
  document.body.append(element);
  await flush();
  return element;
};

const badge = (element: DueBadge): HTMLElement =>
  element.shadowRoot!.querySelector('[part="badge"]')!;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("daysUntilDue", () => {
  it("measures whole UTC days, not elapsed milliseconds", () => {
    // 23 hours away but the next calendar day — "tomorrow" either way.
    expect(daysUntilDue("2026-08-14T11:00:00.000Z", NOW)).toBe(1);
    expect(daysUntilDue("2026-08-14T13:00:00.000Z", NOW)).toBe(1);
    expect(daysUntilDue("2026-08-13T23:59:00.000Z", NOW)).toBe(0);
    expect(daysUntilDue("2026-08-10T09:00:00.000Z", NOW)).toBe(-3);
  });

  it("returns null for a missing or unparseable date", () => {
    expect(daysUntilDue(undefined, NOW)).toBeNull();
    expect(daysUntilDue("not a date", NOW)).toBeNull();
  });
});

describe("formatDueLabel", () => {
  it("states aging in days rather than a bare date", () => {
    expect(formatDueLabel("2026-08-10T09:00:00.000Z", NOW)).toBe("Overdue by 3 days");
    expect(formatDueLabel("2026-08-12T09:00:00.000Z", NOW)).toBe("Overdue by 1 day");
    expect(formatDueLabel("2026-08-13T20:00:00.000Z", NOW)).toBe("Due today");
    expect(formatDueLabel("2026-08-14T09:00:00.000Z", NOW)).toBe("Due tomorrow");
    expect(formatDueLabel("2026-08-18T09:00:00.000Z", NOW)).toBe("Due in 5 days");
    expect(formatDueLabel(undefined, NOW)).toBe("No due date");
  });

  it("says plain Overdue when a same-day deadline has already passed", () => {
    // Zero days out but the bucket is overdue — "Overdue by 0 days" is wrong.
    expect(formatDueLabel("2026-08-13T09:00:00.000Z", NOW)).toBe("Overdue");
    expect(resolveDueBucket("2026-08-13T09:00:00.000Z", NOW)).toBe("overdue");
  });
});

describe("box-due-badge", () => {
  it("renders the urgency in words, not only in colour", async () => {
    const element = await mount(el => (el.dueAt = "2026-08-10T09:00:00.000Z"));

    expect(element.shadowRoot!.querySelector('[part="text"]')?.textContent).toBe(
      "Overdue by 3 days",
    );
    expect(badge(element).getAttribute("data-bucket")).toBe("overdue");
    expect(badge(element).getAttribute("aria-label")).toBe("Overdue by 3 days");
  });

  it("tones each bucket distinctly", async () => {
    const cases: Array<[string | undefined, string]> = [
      ["2026-08-10T09:00:00.000Z", "overdue"],
      ["2026-08-13T20:00:00.000Z", "today"],
      ["2026-08-17T09:00:00.000Z", "this-week"],
      ["2026-09-30T09:00:00.000Z", "later"],
      [undefined, "none"],
    ];
    for (const [dueAt, bucket] of cases) {
      const element = await mount(el => {
        if (dueAt) el.dueAt = dueAt;
      });
      expect(badge(element).getAttribute("data-bucket")).toBe(bucket);
      expect(element.bucket).toBe(bucket);
      element.remove();
    }
  });

  it("keeps the exact timestamp reachable behind the relative label", async () => {
    const element = await mount(el => (el.dueAt = "2026-08-10T09:00:00.000Z"));

    expect(badge(element).getAttribute("title")).toBe("2026-08-10T09:00:00.000Z");
    expect(element.getAttribute("datetime")).toBe("2026-08-10T09:00:00.000Z");
  });

  it("drops the timestamp affordances when there is no due date", async () => {
    const element = await mount();

    expect(element.shadowRoot!.querySelector('[part="text"]')?.textContent).toBe("No due date");
    expect(badge(element).hasAttribute("title")).toBe(false);
    expect(element.hasAttribute("datetime")).toBe(false);
  });

  it("lets a supplied label override the wording but not the tone", async () => {
    const element = await mount(el => {
      el.dueAt = "2026-08-10T09:00:00.000Z";
      el.label = "SLA breached";
    });

    expect(element.shadowRoot!.querySelector('[part="text"]')?.textContent).toBe("SLA breached");
    // The urgency is still derived — an override must not make it look calm.
    expect(badge(element).getAttribute("data-bucket")).toBe("overdue");
    expect(element.resolvedLabel).toBe("SLA breached");
  });

  it("escapes a hostile label", async () => {
    const element = await mount(el => {
      el.dueAt = "2026-08-10T09:00:00.000Z";
      el.label = "<img src=x onerror=alert(1)>";
    });

    expect(element.shadowRoot!.querySelector("img")).toBeNull();
    expect(element.shadowRoot!.querySelector('[part="text"]')?.textContent).toBe(
      "<img src=x onerror=alert(1)>",
    );
  });

  it("re-renders when the due date or reference time changes", async () => {
    const element = await mount(el => (el.dueAt = "2026-08-14T09:00:00.000Z"));
    expect(element.resolvedLabel).toBe("Due tomorrow");

    element.dueAt = "2026-08-18T09:00:00.000Z";
    await flush();
    expect(element.resolvedLabel).toBe("Due in 5 days");

    // Time passes: the same date is now overdue.
    element.referenceTime = "2026-08-20T12:00:00.000Z";
    await flush();
    expect(badge(element).getAttribute("data-bucket")).toBe("overdue");
    expect(element.resolvedLabel).toBe("Overdue by 2 days");
  });

  it("falls back to the wall clock when the reference time is unusable", async () => {
    const element = document.createElement("box-due-badge") as DueBadge;
    element.setAttribute("reference-time", "not a date");
    element.dueAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    document.body.append(element);
    await flush();

    expect(badge(element).getAttribute("data-bucket")).not.toBe("overdue");
  });

  it("marks the compact variant without changing the wording", async () => {
    const element = await mount(el => {
      el.dueAt = "2026-08-13T20:00:00.000Z";
      el.compact = true;
    });

    expect(badge(element).getAttribute("data-compact")).toBe("true");
    expect(element.resolvedLabel).toBe("Due today");
  });
});
