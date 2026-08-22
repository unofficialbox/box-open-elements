import { afterEach, describe, expect, it, vi } from "vitest";

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
