import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ActivityDensityStrip } from "../../../src/patterns/audit/activity-density.js";
import { AuditLog } from "../../../src/patterns/audit/audit-log.js";
import type { AuditEvent } from "../../../src/patterns/audit/types.js";

AuditLog.register();
ActivityDensityStrip.register();

const REFERENCE_TIME = "2026-08-13T12:00:00.000Z";

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const events: AuditEvent[] = [
  {
    id: "a1",
    action: "Approved MSA_Acme_v4",
    actor: { name: "Morgan Lee" },
    summary: "Second-line approval recorded.",
    timestamp: "2026-08-13T09:00:00.000Z",
    tone: "success",
    badge: "Policy: pass",
    correlationId: "run-8842",
    evidence: [{ id: "e1", label: "MSA_Acme §4.2", href: "/contracts/acme#4-2" }],
  },
  {
    id: "a2",
    action: "Redlined clause 4.2",
    actor: { name: "Avery Chen" },
    timestamp: "2026-08-13T23:30:00.000Z",
    correlationId: "run-9001",
  },
  {
    id: "a3",
    action: "Approved MSA_Acme_v4",
    actor: { name: "Morgan Lee" },
    timestamp: "2026-08-12T10:00:00.000Z",
    correlationId: "run-8842",
  },
  { id: "a4", action: "Imported from legacy archive", timestamp: "2026-08-01T08:00:00.000Z" },
];

const mountLog = async (records: AuditEvent[] = events): Promise<AuditLog> => {
  const element = document.createElement("box-audit-log") as AuditLog;
  element.referenceTime = REFERENCE_TIME;
  element.events = records;
  document.body.append(element);
  await flush();
  return element;
};

const mountStrip = async (records: AuditEvent[] = events): Promise<ActivityDensityStrip> => {
  const element = document.createElement("box-activity-density") as ActivityDensityStrip;
  element.referenceTime = REFERENCE_TIME;
  element.weeks = 3;
  element.events = records;
  document.body.append(element);
  await flush();
  return element;
};

const query = (element: HTMLElement, selector: string): HTMLElement | null =>
  element.shadowRoot!.querySelector(selector);

const queryAll = (element: HTMLElement, selector: string): HTMLElement[] =>
  Array.from(element.shadowRoot!.querySelectorAll(selector));

afterEach(() => {
  document.body.innerHTML = "";
});

describe("box-audit-log", () => {
  it("renders day sections newest first with counts and actor tallies", async () => {
    const element = await mountLog();

    const labels = queryAll(element, '[part="group-label"]').map(node => node.textContent);
    expect(labels).toEqual(["Today", "Yesterday", "Aug 1, 2026"]);

    const counts = queryAll(element, '[part="group-count"]').map(node => node.textContent);
    expect(counts[0]).toBe("2 events · 2 actors");
    expect(counts[1]).toBe("1 event · 1 actor");
    // An all-unattributed section says nothing about actors rather than "0".
    expect(counts[2]).toBe("1 event");

    expect(query(element, '[part="result-summary"]')?.textContent).toBe("4 events in 3 groups");
  });

  it("regroups by actor and by action", async () => {
    const element = await mountLog();

    const [, actorOption, actionOption] = queryAll(element, '[part="group-by-option"]');
    actorOption!.click();
    await flush();
    expect(queryAll(element, '[part="group-label"]').map(node => node.textContent)).toEqual([
      "Morgan Lee",
      "Avery Chen",
      "Unattributed",
    ]);
    expect(actorOption!.getAttribute("aria-pressed")).toBe("true");

    actionOption!.click();
    await flush();
    expect(queryAll(element, '[part="group-label"]').map(node => node.textContent)).toEqual([
      "Approved MSA_Acme_v4",
      "Imported from legacy archive",
      "Redlined clause 4.2",
    ]);
  });

  it("collapses a section without rebuilding the log", async () => {
    const element = await mountLog();

    const toggle = queryAll(element, '[part="group-toggle"]')[0]!;
    const body = queryAll(element, '[part="group-body"]')[0]!;
    const firstEvent = queryAll(element, '[part="event"]')[0]!;
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(body.hidden).toBe(false);

    toggle.click();
    await flush();

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(body.hidden).toBe(true);
    // Collapse is a state flip, not a re-render: the same nodes survive, so
    // the reader's scroll position and focus are untouched.
    expect(queryAll(element, '[part="group-toggle"]')[0]).toBe(toggle);
    expect(queryAll(element, '[part="event"]')[0]).toBe(firstEvent);
  });

  it("wires the region to its toggle for assistive tech", async () => {
    const element = await mountLog();

    const toggle = queryAll(element, '[part="group-toggle"]')[0]!;
    const body = queryAll(element, '[part="group-body"]')[0]!;
    expect(toggle.getAttribute("aria-controls")).toBe(body.id);
    expect(body.getAttribute("aria-labelledby")).toBe(toggle.id);
    expect(body.getAttribute("role")).toBe("region");
  });

  it("drops the collapse state when the grouping dimension changes", async () => {
    const element = await mountLog();

    queryAll(element, '[part="group-toggle"]')[0]!.click();
    await flush();
    expect(queryAll(element, '[part="group-body"]')[0]!.hidden).toBe(true);

    queryAll(element, '[part="group-by-option"]')[1]!.click();
    await flush();
    expect(queryAll(element, '[part="group-body"]').every(body => !body.hidden)).toBe(true);

    // Back to day sections: the old collapse must not come back with them.
    // Section keys belong to a dimension, so carrying one across can collapse
    // an unrelated section whose key happens to match.
    queryAll(element, '[part="group-by-option"]')[0]!.click();
    await flush();
    expect(queryAll(element, '[part="group-label"]')[0]?.textContent).toBe("Today");
    expect(queryAll(element, '[part="group-body"]').every(body => !body.hidden)).toBe(true);
  });

  it("narrows by the actor facet and reports the filtered count", async () => {
    const element = await mountLog();
    const changed = vi.fn();
    element.addEventListener("facets-changed", changed);

    const select = query(element, '[part="facet-actor"]') as HTMLSelectElement;
    // Options are ordered by frequency, with an all-values option first.
    expect(Array.from(select.options).map(option => option.value)).toEqual([
      "",
      "Morgan Lee",
      "Avery Chen",
    ]);

    select.value = "Morgan Lee";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();

    expect(element.getAttribute("facet-actor")).toBe("Morgan Lee");
    expect(element.visibleEvents.map(event => event.id)).toEqual(["a1", "a3"]);
    expect(query(element, '[part="result-summary"]')?.textContent).toBe(
      "Showing 2 of 4 events in 2 groups",
    );
    expect(changed).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { facets: { actor: "Morgan Lee" } } }),
    );
  });

  it("keeps every facet option available after one is chosen", async () => {
    const element = await mountLog();

    const actorSelect = query(element, '[part="facet-actor"]') as HTMLSelectElement;
    actorSelect.value = "Morgan Lee";
    actorSelect.dispatchEvent(new Event("change", { bubbles: true }));
    await flush();

    // Options come from the unfiltered set, so the reader can always switch
    // facets instead of dead-ending on an empty list.
    const actionSelect = query(element, '[part="facet-action"]') as HTMLSelectElement;
    expect(Array.from(actionSelect.options).map(option => option.value)).toEqual([
      "",
      "Approved MSA_Acme_v4",
      "Imported from legacy archive",
      "Redlined clause 4.2",
    ]);
  });

  it("drills down to one workflow run from a correlation id", async () => {
    const element = await mountLog();
    const selected = vi.fn();
    element.addEventListener("correlation-selected", selected);

    const correlation = queryAll(element, '[part="correlation"]').find(
      button => button.getAttribute("data-correlation-id") === "run-8842",
    )!;
    correlation.click();
    await flush();

    expect(element.getAttribute("facet-correlation-id")).toBe("run-8842");
    expect(element.visibleEvents.map(event => event.id)).toEqual(["a1", "a3"]);
    expect(selected.mock.calls[0]?.[0].detail.events.map((event: AuditEvent) => event.id)).toEqual([
      "a1",
      "a3",
    ]);

    const drilldown = query(element, '[part="drilldown"]')!;
    expect(drilldown.hidden).toBe(false);
    expect(query(element, '[part="drilldown-id"]')?.textContent).toBe("run-8842");

    (query(element, '[part="drilldown-clear"]') as HTMLButtonElement).click();
    await flush();
    expect(element.hasAttribute("facet-correlation-id")).toBe(false);
    expect(element.visibleEvents).toHaveLength(4);
  });

  it("clears every facet from the toolbar", async () => {
    const element = await mountLog();
    element.facets = { actor: "Morgan Lee", correlationId: "run-8842", from: "2026-08-01" };
    await flush();

    const clear = query(element, '[part="clear-filters"]') as HTMLButtonElement;
    expect(clear.hidden).toBe(false);
    clear.click();
    await flush();

    expect(element.facets).toEqual({});
    expect(clear.hidden).toBe(true);
    expect(element.visibleEvents).toHaveLength(4);
  });

  it("exports only what the filters left on screen", async () => {
    const element = await mountLog();
    element.exportable = true;
    element.facets = { actor: "Morgan Lee" };
    await flush();

    const requested = vi.fn();
    element.addEventListener("export-requested", requested);
    (query(element, '[part="export"]') as HTMLButtonElement).click();

    const detail = requested.mock.calls[0]?.[0].detail;
    expect(detail.format).toBe("csv");
    expect(detail.events.map((event: AuditEvent) => event.id)).toEqual(["a1", "a3"]);
    expect(detail.csv.split("\r\n")).toHaveLength(3);
    expect(detail.csv).not.toContain("Avery Chen");
  });

  it("hides the export button unless the surface is exportable", async () => {
    const element = await mountLog();
    expect(query(element, '[part="export"]')?.hidden).toBe(true);
  });

  it("emits event and evidence selections", async () => {
    const element = await mountLog();
    const eventSelected = vi.fn();
    const evidenceSelected = vi.fn();
    element.addEventListener("event-selected", eventSelected);
    element.addEventListener("evidence-selected", evidenceSelected);

    queryAll(element, '[part="event-action"]')[0]!.click();
    expect(eventSelected.mock.calls[0]?.[0].detail.event.id).toBe("a2");

    const link = queryAll(element, '[part="evidence-link"]')[0]!;
    link.addEventListener("click", event => {
      event.preventDefault();
    });
    link.click();
    expect(evidenceSelected.mock.calls[0]?.[0].detail.evidence.id).toBe("e1");
  });

  it("downgrades unsafe evidence hrefs to buttons and keeps safe ones as links", async () => {
    const element = await mountLog([
      {
        id: "u1",
        action: "Escalated",
        timestamp: "2026-08-13T09:00:00.000Z",
        evidence: [
          { id: "js", label: "Script", href: "javascript:alert(1)" },
          // Protocol-relative and backslash-normalized forms both resolve to
          // an external origin, so neither may become an anchor.
          { id: "proto", label: "Protocol relative", href: "//evil.example/report" },
          { id: "slash", label: "Backslash", href: "/\\evil.example/report" },
          { id: "path", label: "Rooted path", href: "/contracts/1" },
          { id: "root", label: "Root", href: "/" },
          { id: "frag", label: "Fragment", href: "#clause-4-2" },
          { id: "upper", label: "Uppercase scheme", href: "HTTPS://example.com/x" },
        ],
      },
    ]);

    const byId = new Map(
      queryAll(element, '[part="evidence-link"]').map(chip => [
        chip.getAttribute("data-evidence-id"),
        chip.tagName,
      ]),
    );
    expect(byId.get("js")).toBe("BUTTON");
    expect(byId.get("proto")).toBe("BUTTON");
    expect(byId.get("slash")).toBe("BUTTON");
    expect(byId.get("path")).toBe("A");
    expect(byId.get("root")).toBe("A");
    expect(byId.get("frag")).toBe("A");
    expect(byId.get("upper")).toBe("A");
  });

  it("escapes hostile content in every rendered field", async () => {
    const element = await mountLog([
      {
        id: "<img src=x onerror=alert(1)>",
        action: "<script>alert('action')</script>",
        actor: { name: "<b>actor</b>" },
        summary: "<i>summary</i>",
        badge: "<u>badge</u>",
        correlationId: "<em>run</em>",
        timestamp: "2026-08-13T09:00:00.000Z",
        evidence: [{ id: "e1", label: "<s>evidence</s>", href: "/ok" }],
      },
    ]);

    // Assert on the DOM, not on serialized innerHTML: attribute values are
    // re-serialized without escaping `<`, so a correctly-escaped payload sitting
    // safely inside `data-event-id` still reads as raw markup in that string.
    // What matters is that no element was ever created from the payload.
    expect(element.shadowRoot!.querySelector("script")).toBeNull();
    expect(element.shadowRoot!.querySelector("img")).toBeNull();
    expect(element.shadowRoot!.querySelector("b")).toBeNull();
    expect(query(element, '[part="event-action"]')?.textContent).toBe(
      "<script>alert('action')</script>",
    );
    expect(query(element, '[part="actor"]')?.textContent).toBe("<b>actor</b>");
    expect(query(element, '[part="event-summary"]')?.textContent).toBe("<i>summary</i>");
    expect(query(element, '[part="correlation"]')?.textContent).toBe("<em>run</em>");
    expect(query(element, '[part="evidence-link"]')?.textContent).toBe("<s>evidence</s>");
  });

  it("ignores malformed event payloads", async () => {
    const element = document.createElement("box-audit-log") as AuditLog;
    element.setAttribute("events", '[{"id":"ok","action":"Fine"},{"action":"no id"}]');
    document.body.append(element);
    await flush();

    // One bad record invalidates the payload rather than rendering a partial,
    // silently wrong audit trail.
    expect(element.events).toEqual([]);
    expect(query(element, '[part="empty"]')?.hidden).toBe(false);
  });

  it("re-reads events when the payload changes and never hands out its cache", async () => {
    const element = await mountLog();

    // The parse is memoized on the raw attribute; a stale cache here would
    // silently render the previous payload.
    expect(element.events.map(event => event.id)).toEqual(["a1", "a2", "a3", "a4"]);
    element.events = [{ id: "z1", action: "Sealed", timestamp: "2026-08-13T01:00:00.000Z" }];
    await flush();
    expect(element.events.map(event => event.id)).toEqual(["z1"]);

    // Two reads must not share one array, or a caller could mutate the cache.
    const first = element.events;
    first.push({ id: "injected", action: "Nope" });
    expect(element.events.map(event => event.id)).toEqual(["z1"]);
  });

  it("restores focus to the equivalent control after a rebuild", async () => {
    const element = await mountLog();

    const action = queryAll(element, '[part="event-action"]')[0]!;
    action.focus();
    expect(element.shadowRoot!.activeElement).toBe(action);

    // Changing the reference time re-mints the sections.
    element.referenceTime = "2026-08-14T12:00:00.000Z";
    await flush();

    const restored = element.shadowRoot!.activeElement as HTMLElement | null;
    expect(restored?.getAttribute("part")).toBe("event-action");
    expect(restored?.getAttribute("data-event-id")).toBe("a2");
    expect(restored).not.toBe(action);
  });

  it("keeps the toolbar controls across content rebuilds", async () => {
    const element = await mountLog();

    const select = query(element, '[part="facet-actor"]') as HTMLSelectElement;
    element.events = [...events, { id: "a5", action: "Sealed", timestamp: "2026-08-13T01:00:00Z" }];
    await flush();

    // The toolbar is built once: a re-render below it can never close an open
    // dropdown or drop a half-typed date.
    expect(query(element, '[part="facet-actor"]')).toBe(select);
  });
});

describe("box-activity-density", () => {
  it("renders a weekday-by-week grid ending on the reference day", async () => {
    const element = await mountStrip();

    expect(queryAll(element, '[part="weekday"]').map(node => node.textContent)).toEqual([
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ]);
    expect(queryAll(element, '[part="cell"]')).toHaveLength(2 * 7 + 5);
    expect(query(element, '[part="caption"]')?.textContent).toBe(
      "4 events from Jul 26, 2026 to Aug 13, 2026",
    );
  });

  it("labels only the days with activity, each with its own count", async () => {
    const element = await mountStrip();

    const buttons = queryAll(element, '[part="cell-button"]');
    expect(buttons.map(button => button.getAttribute("data-date"))).toEqual([
      "2026-08-12",
      "2026-08-13",
      "2026-08-01",
    ]);
    expect(buttons.map(button => button.getAttribute("aria-label"))).toEqual([
      "1 event on Aug 12, 2026",
      "2 events on Aug 13, 2026",
      "1 event on Aug 1, 2026",
    ]);
    // A quiet day is an inert cell — no extra tab stop, nothing to drill into.
    const quiet = queryAll(element, '[part="cell"]').find(
      cell => cell.getAttribute("data-date") === "2026-08-11",
    );
    expect(quiet?.querySelector('[part="cell-button"]')).toBeNull();
  });

  it("scales the level against the busiest day in the window", async () => {
    const element = await mountStrip();

    const level = (date: string) =>
      queryAll(element, '[part="cell"]')
        .find(cell => cell.getAttribute("data-date") === date)
        ?.getAttribute("data-level");

    expect(level("2026-08-13")).toBe("4");
    expect(level("2026-08-12")).toBe("2");
    expect(level("2026-08-11")).toBe("0");
  });

  it("emits day-selected with that day's events", async () => {
    const element = await mountStrip();
    const selected = vi.fn();
    element.addEventListener("day-selected", selected);

    const target = queryAll(element, '[part="cell-button"]').find(
      button => button.getAttribute("data-date") === "2026-08-13",
    )!;
    target.click();

    expect(selected.mock.calls[0]?.[0].detail).toMatchObject({ date: "2026-08-13", count: 2 });
    expect(selected.mock.calls[0]?.[0].detail.events.map((event: AuditEvent) => event.id)).toEqual([
      "a1",
      "a2",
    ]);
  });

  it("moves roving focus by day and by week, skipping quiet cells", async () => {
    const element = await mountStrip();

    const buttons = queryAll(element, '[part="cell-button"]') as HTMLButtonElement[];
    // DOM order is weekday-major, so the tab stop is asserted by date: the
    // most recent day with activity, not whichever button lands last.
    const tabStop = buttons.find(button => button.tabIndex === 0);
    expect(tabStop?.getAttribute("data-date")).toBe("2026-08-13");
    expect(buttons.filter(button => button.tabIndex === 0)).toHaveLength(1);

    const aug13 = buttons.find(button => button.getAttribute("data-date") === "2026-08-13")!;
    aug13.focus();
    aug13.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    // Aug 12 is the Wednesday directly above Aug 13's Thursday.
    expect(
      (element.shadowRoot!.activeElement as HTMLElement).getAttribute("data-date"),
    ).toBe("2026-08-12");

    const active = element.shadowRoot!.activeElement as HTMLButtonElement;
    active.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    // Nothing to the left in that row — focus holds rather than jumping rows.
    expect(
      (element.shadowRoot!.activeElement as HTMLElement).getAttribute("data-date"),
    ).toBe("2026-08-12");

    // Home/End reach the ends of the window by date. Weekday-major DOM order
    // would land on Aug 12 and Aug 1 respectively — both wrong.
    active.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    const home = element.shadowRoot!.activeElement as HTMLButtonElement;
    expect(home.getAttribute("data-date")).toBe("2026-08-01");

    home.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(
      (element.shadowRoot!.activeElement as HTMLElement).getAttribute("data-date"),
    ).toBe("2026-08-13");
  });

  it("exposes the computed window and per-day events", async () => {
    const element = await mountStrip();

    expect(element.density).toMatchObject({ total: 4, max: 2, weeks: 3, end: "2026-08-13" });
    expect(element.eventsOn("2026-08-13").map(event => event.id)).toEqual(["a1", "a2"]);
    expect(element.eventsOn("2026-08-11")).toEqual([]);
  });
});

describe("AuditLog virtualization", () => {
  // jsdom has no ResizeObserver, so the element's observer path is inert here
  // and only the browser exercises it for real. A stub makes the *wiring*
  // testable — whether the observer exists and is re-armed — which is the part
  // that broke.
  class StubResizeObserver {
    static instances: StubResizeObserver[] = [];
    observed: Element[] = [];
    constructor(readonly callback: () => void) {
      StubResizeObserver.instances.push(this);
    }
    observe(target: Element): void {
      this.observed.push(target);
    }
    disconnect(): void {
      this.observed = [];
    }
    unobserve(): void {
      /* not used */
    }
  }

  beforeEach(() => {
    StubResizeObserver.instances = [];
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
      StubResizeObserver;
  });

  afterEach(() => {
    document.body.innerHTML = "";
    delete (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver;
  });

  const manyEvents = (days: number, perDay: number): AuditEvent[] => {
    const all: AuditEvent[] = [];
    for (let day = 0; day < days; day++) {
      const date = `2026-${String(1 + Math.floor(day / 28)).padStart(2, "0")}-${String((day % 28) + 1).padStart(2, "0")}`;
      for (let index = 0; index < perDay; index++) {
        all.push({
          id: `d${String(day)}-e${String(index)}`,
          action: `Action ${String(index)}`,
          actor: { name: "Morgan Lee" },
          timestamp: `${date}T09:${String(index % 60).padStart(2, "0")}:00.000Z`,
        });
      }
    }
    return all;
  };

  /**
   * jsdom has no layout, so the scrolling viewport is faked before the events
   * exist: the element renders its shell on connect, and assigning events
   * afterwards is what drives the first windowed render.
   */
  const create = (
    days: number,
    perDay: number,
    { virtualize = true, viewportHeight = 600 } = {},
  ): AuditLog => {
    const element = document.createElement("box-audit-log") as AuditLog;
    element.setAttribute("reference-time", "2026-06-01T00:00:00.000Z");
    if (virtualize) element.setAttribute("virtualize", "");
    element.setAttribute("heading-height", "28");
    element.setAttribute("row-height", "64");
    document.body.append(element);

    const scroller = element.shadowRoot?.querySelector('[part="groups"]') as HTMLElement;
    Object.defineProperty(scroller, "clientHeight", {
      value: viewportHeight,
      configurable: true,
    });

    element.events = manyEvents(days, perDay);
    return element;
  };

  const scrollerOf = (element: AuditLog): HTMLElement =>
    element.shadowRoot?.querySelector('[part="groups"]') as HTMLElement;

  const scrollTo = async (element: AuditLog, top: number): Promise<void> => {
    const scroller = scrollerOf(element);
    scroller.scrollTop = top;
    scroller.dispatchEvent(new Event("scroll"));
    await new Promise(resolve => requestAnimationFrame(() => resolve(null)));
  };

  const renderedEvents = (element: AuditLog): number =>
    element.shadowRoot?.querySelectorAll('[part="event"]').length ?? 0;

  const renderedGroupKeys = (element: AuditLog): string[] =>
    Array.from(element.shadowRoot?.querySelectorAll('[part="group"]') ?? []).map(
      section => section.getAttribute("data-group-key") ?? "",
    );

  it("renders every section when virtualization is off", () => {
    const element = create(6, 5, { virtualize: false });
    expect(renderedEvents(element)).toBe(30);
    expect(element.renderedWindow).toBeNull();
  });

  it("renders a slice of a long log instead of every event", () => {
    const element = create(40, 50); // 2,000 events across 40 sections
    expect(renderedEvents(element)).toBeGreaterThan(0);
    expect(renderedEvents(element)).toBeLessThan(40);
    expect(element.renderedWindow?.totalHeight).toBe(40 * (28 + 50 * 64));
  });

  it("pads with spacers so the scroll range covers the whole log", async () => {
    const element = create(40, 50);
    await scrollTo(element, 20_000);

    const spacers = Array.from(
      element.shadowRoot?.querySelectorAll<HTMLElement>('[part="spacer"]') ?? [],
    );
    expect(spacers.map(spacer => spacer.dataset.position)).toEqual(["top", "bottom"]);
    // Spacers are not sections: nothing that walks groups may see them.
    expect(spacers.every(spacer => spacer.getAttribute("part") !== "group")).toBe(true);
    expect(spacers.every(spacer => spacer.getAttribute("aria-hidden") === "true")).toBe(true);
  });

  it("moves the window to sections further down the log", async () => {
    const element = create(40, 50);
    const before = renderedGroupKeys(element);
    await scrollTo(element, 60_000);
    const after = renderedGroupKeys(element);

    expect(after).not.toEqual(before);
    expect(after.some(key => before.includes(key))).toBe(false);
  });

  it("renders the heading of a section scrolled into from the middle", async () => {
    // The straddling case: [part="group-body"] is aria-labelledby the toggle in
    // its own heading, so a section that arrives without one is unlabelled and
    // cannot be collapsed.
    const element = create(40, 50);
    await scrollTo(element, 1_000); // inside the first section

    const first = element.shadowRoot?.querySelector('[part="group"]');
    const toggle = first?.querySelector('[part="group-toggle"]');
    const body = first?.querySelector('[part="group-body"]');
    expect(toggle).not.toBeNull();
    expect(body?.getAttribute("aria-labelledby")).toBe(toggle?.getAttribute("id"));
  });

  it("skips the re-render while the resolved window is unchanged", async () => {
    const element = create(40, 50);
    const before = element.renderedWindow;
    const firstSection = element.shadowRoot?.querySelector('[part="group"]');

    await scrollTo(element, 4); // same slice
    expect(element.renderedWindow).toEqual(before);
    expect(element.shadowRoot?.querySelector('[part="group"]')).toBe(firstSection);

    await scrollTo(element, 30_000); // a different slice
    expect(element.renderedWindow).not.toEqual(before);
  });

  it("ignores scroll entirely when not virtualizing", async () => {
    const element = create(6, 5, { virtualize: false });
    const firstSection = element.shadowRoot?.querySelector('[part="group"]');
    await scrollTo(element, 3_000);
    expect(element.shadowRoot?.querySelector('[part="group"]')).toBe(firstSection);
    expect(renderedEvents(element)).toBe(30);
  });

  it("shrinks the scroll range when a section is collapsed", () => {
    const element = create(40, 50);
    const before = element.renderedWindow!.totalHeight;

    element.collapseAll();

    // Every section is now a heading only, so the log is a fraction as tall.
    expect(element.renderedWindow!.totalHeight).toBe(40 * 28);
    expect(element.renderedWindow!.totalHeight).toBeLessThan(before);
    expect(renderedEvents(element)).toBe(0);
  });

  it("restores the scroll range when sections are expanded again", () => {
    const element = create(40, 50);
    const expanded = element.renderedWindow!.totalHeight;
    element.collapseAll();
    element.expandAll();
    expect(element.renderedWindow!.totalHeight).toBe(expanded);
    expect(renderedEvents(element)).toBeGreaterThan(0);
  });

  it("does no work at all while the resolved window is unchanged", () => {
    // The content signature already prevents a needless DOM rebuild, so node
    // identity cannot distinguish this. What the scroll-frame check buys is
    // skipping the whole update pass — re-filtering, re-grouping and
    // re-summarising several thousand events — dozens of times a second.
    const element = create(40, 50);
    const update = vi.spyOn(
      element as unknown as { update: () => void },
      "update",
    );

    const scroller = scrollerOf(element);
    for (const top of [1, 2, 3, 4]) {
      scroller.scrollTop = top;
      scroller.dispatchEvent(new Event("scroll"));
    }
    return new Promise<void>(resolve => {
      requestAnimationFrame(() => {
        expect(update).not.toHaveBeenCalled();

        scroller.scrollTop = 40_000;
        scroller.dispatchEvent(new Event("scroll"));
        requestAnimationFrame(() => {
          expect(update).toHaveBeenCalledTimes(1);
          update.mockRestore();
          resolve();
        });
      });
    });
  });

  it("updates the bottom spacer when a section below the window collapses", () => {
    // Collapsing something off-screen does not move the window — same slice,
    // same top spacer — but it does make the log shorter. If the render is
    // keyed only on the window, the bottom spacer keeps the old height and the
    // scroll range outlives the content it described.
    const element = create(40, 50);
    const bottomOf = (): number =>
      Number.parseFloat(
        (
          element.shadowRoot?.querySelector<HTMLElement>('[part="spacer"][data-position="bottom"]')
            ?.style.blockSize ?? "0"
        ).replace("px", ""),
      );

    const before = bottomOf();
    const windowBefore = element.renderedWindow!;

    // A section far below the viewport, so the window itself cannot move.
    element.toggleGroup(element.groups[30]!.key);

    expect(element.renderedWindow!.startIndex).toBe(windowBefore.startIndex);
    expect(element.renderedWindow!.endIndex).toBe(windowBefore.endIndex);
    expect(bottomOf()).toBeLessThan(before);
    expect(bottomOf()).toBe(element.renderedWindow!.paddingBottom);
  });

  it("stops adopting measured heights instead of re-rendering forever", () => {
    // Event rows are not uniform — summary, evidence and correlationId are each
    // optional — so a height sampled from one row can disagree with the next
    // window's first row. Chromium, before this was bounded: 55 full rebuilds
    // in 0.9s while nothing scrolled, the sample flipping 33px <-> 166.5px.
    // jsdom reports zero heights, so the loop itself cannot be reproduced here;
    // what is testable is the budget that stops it.
    const element = create(40, 50);
    let call = 0;
    const heights = [40, 90, 40, 90, 40, 90, 40, 90];
    // Alternating measurements: the pathological case, forced.
    vi.spyOn(
      element as unknown as { meanHeight: (part: string) => number },
      "meanHeight",
    ).mockImplementation((part: string) =>
      part === "group-heading" ? 28 : (heights[call++ % heights.length] ?? 40),
    );

    const update = vi.spyOn(element as unknown as { update: () => void }, "update");
    for (let attempt = 0; attempt < 20; attempt++) {
      (element as unknown as { measureRowHeights: () => void }).measureRowHeights();
      (element as unknown as { measureFrame: number }).measureFrame = 0;
    }

    // Bounded per row set, however many times it is asked.
    expect(update.mock.calls.length).toBe(0); // adoption schedules a frame, not a sync update
    expect(
      (element as unknown as { adoptionCount: number }).adoptionCount,
    ).toBeLessThanOrEqual(3);
  });

  it("plans a window as soon as an unmeasured viewport becomes measurable", () => {
    // The circle this breaks: an unmeasured scroller plans an empty window, an
    // empty window renders nothing, and nothing rendered means nothing to
    // measure. In Chromium the log stayed blank on first paint and never
    // recovered. Here the viewport starts at zero and the observer fires.
    const element = document.createElement("box-audit-log") as AuditLog;
    element.setAttribute("reference-time", "2026-06-01T00:00:00.000Z");
    element.setAttribute("virtualize", "");
    element.setAttribute("heading-height", "28");
    element.setAttribute("row-height", "64");
    document.body.append(element);

    const scroller = element.shadowRoot?.querySelector('[part="groups"]') as HTMLElement;
    Object.defineProperty(scroller, "clientHeight", { value: 0, configurable: true });
    element.events = manyEvents(10, 20);

    expect(element.shadowRoot?.querySelectorAll('[part="event"]').length).toBe(0);

    // Layout arrives; the observer is the only thing that can notice.
    Object.defineProperty(scroller, "clientHeight", { value: 600, configurable: true });
    StubResizeObserver.instances.at(-1)?.callback();

    expect(element.shadowRoot?.querySelectorAll('[part="event"]').length).toBeGreaterThan(0);
  });

  it("measures the mean rendered height, not the first row's", () => {
    // Averaging is what makes the estimate insensitive to which rows happen to
    // be on screen; sampling one row is what let the adoption loop alternate.
    // jsdom reports every height as zero, so the rects are faked directly.
    const element = create(6, 5);
    const events = Array.from(
      element.shadowRoot?.querySelectorAll<HTMLElement>('[part="event"]') ?? [],
    );
    expect(events.length).toBeGreaterThan(2);

    events.forEach((node, index) => {
      const height = index === 0 ? 200 : 20; // one tall outlier, the rest short
      node.getBoundingClientRect = () => ({ height }) as DOMRect;
    });

    const mean = (element as unknown as { meanHeight: (part: string) => number }).meanHeight(
      "event",
    );
    const expected = (200 + 20 * (events.length - 1)) / events.length;
    expect(mean).toBeCloseTo(expected, 5);
    expect(mean).not.toBe(200); // the first row's height, which is the bug
  });

  it("re-arms the viewport observer after being removed and re-inserted", () => {
    // BaseElement.setupListeners runs once, on first connection, but
    // disconnectedCallback tears the observer down every time. Without
    // re-arming, a re-inserted log keeps its listeners and loses its observer,
    // so container resizes silently stop re-planning.
    const element = create(40, 50);
    const observerOf = (): unknown =>
      (element as unknown as { viewportObserver: unknown }).viewportObserver;

    expect(observerOf()).not.toBeNull();

    element.remove();
    expect(observerOf()).toBeNull();

    document.body.append(element);
    expect(observerOf()).not.toBeNull();
  });

  it("reuses the grouped rows and offset index across scroll frames", async () => {
    // The scroll path asks "did the window move?" every frame. Recomputing that
    // answer meant re-parsing the whole events attribute, re-filtering,
    // re-grouping, re-flattening and rebuilding the offset array — O(n) twice
    // per frame on the surface whose point is not being O(n).
    const element = create(40, 50);
    const build = vi.spyOn(
      element as unknown as { cachedRows: () => unknown },
      "cachedRows",
    );
    const grouped = vi.fn();
    const original = (element as unknown as { rowCache: { signature: string } | null }).rowCache;
    expect(original).not.toBeNull();

    await scrollTo(element, 10);
    await scrollTo(element, 20);
    await scrollTo(element, 30);

    // Same signature throughout, so the cached object is never replaced.
    expect(
      (element as unknown as { rowCache: unknown }).rowCache,
    ).toBe(original);
    expect(build.mock.calls.length).toBeGreaterThan(0);
    expect(grouped).not.toHaveBeenCalled();
  });

  it("rebuilds the cached rows when the collapse state changes", () => {
    const element = create(40, 50);
    const before = (element as unknown as { rowCache: unknown }).rowCache;
    element.collapseAll();
    expect((element as unknown as { rowCache: unknown }).rowCache).not.toBe(before);
  });

  it("keeps the export tied to the filtered set, not the rendered window", () => {
    // Windowing is a rendering concern. An export that shipped only what
    // happened to be on screen would be a compliance hazard.
    const element = create(10, 20);
    const csv = element.exportCsv();
    expect(csv.trim().split("\n")).toHaveLength(200 + 1); // + header
    expect(renderedEvents(element)).toBeLessThan(200);
  });
});
