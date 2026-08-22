import { afterEach, describe, expect, it, vi } from "vitest";

import { Timeline } from "../../../src/patterns/timeline/timeline.js";
import {
  isTimelineEventRecord,
  resolveTimelineTone,
} from "../../../src/patterns/timeline/types.js";
import type { TimelineEvent } from "../../../src/patterns/timeline/types.js";

Timeline.register();

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const sampleEvents: TimelineEvent[] = [
  {
    id: "e3",
    action: "approved the contract",
    actor: { name: "Morgan Lee" },
    badge: "Policy: pass",
    timestamp: "2026-07-12T10:00:00.000Z",
    tone: "success",
    correlationId: "corr-8842",
    evidence: [
      { id: "ev1", label: "Risk summary", href: "https://example.com/risk" },
      { id: "ev2", label: "Model rationale" },
    ],
  },
  {
    id: "e2",
    action: "requested changes",
    actor: { name: "Avery Chen" },
    summary: "Liability cap must match the 2026 template.",
    timestamp: "2026-07-11T16:20:00.000Z",
    tone: "warning",
  },
  { id: "e1", action: "uploaded MSA_Acme_v4.pdf", timestamp: "2026-07-10T09:00:00.000Z" },
];

const mountTimeline = async (configure?: (element: Timeline) => void): Promise<Timeline> => {
  const element = document.createElement("box-timeline") as Timeline;
  element.events = sampleEvents;
  configure?.(element);
  document.body.append(element);
  await flush();
  return element;
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("timeline types", () => {
  it("resolves tones with a neutral fallback", () => {
    expect(resolveTimelineTone("success")).toBe("success");
    expect(resolveTimelineTone("sneaky")).toBe("neutral");
    expect(resolveTimelineTone(null)).toBe("neutral");
  });

  it("validates event records including evidence entries", () => {
    expect(isTimelineEventRecord(sampleEvents[0])).toBe(true);
    expect(isTimelineEventRecord(null)).toBe(false);
    expect(isTimelineEventRecord({ id: "", action: "x" })).toBe(false);
    expect(isTimelineEventRecord({ id: "a", action: 1 })).toBe(false);
    expect(isTimelineEventRecord({ id: "a", action: "x", evidence: [{ id: 1, label: "b" }] })).toBe(false);
  });
});

describe("box-timeline", () => {
  it("renders events with actor, action, badge, summary, and correlation id", async () => {
    const element = await mountTimeline();

    const items = element.shadowRoot?.querySelectorAll('[part="event"]');
    expect(items).toHaveLength(3);
    const text = element.shadowRoot?.textContent ?? "";
    expect(text).toContain("Morgan Lee");
    expect(text).toContain("approved the contract");
    expect(text).toContain("Policy: pass");
    expect(text).toContain("Liability cap must match the 2026 template.");
    expect(text).toContain("corr-8842");
    expect(text).toContain("Jul 12, 2026");
  });

  it("renders the empty state without events", async () => {
    const element = document.createElement("box-timeline") as Timeline;
    document.body.append(element);
    await flush();

    expect((element.shadowRoot?.querySelector('[part="empty"]') as HTMLElement).hidden).toBe(false);
    expect((element.shadowRoot?.querySelector('[part="events"]') as HTMLElement).hidden).toBe(true);
  });

  it("emits evidence-selected for both linked and unlinked evidence", async () => {
    const element = await mountTimeline();
    const selected = vi.fn();
    element.addEventListener("evidence-selected", selected);

    const link = element.shadowRoot?.querySelector('a[part="evidence-link"]') as HTMLAnchorElement;
    link.addEventListener("click", event => event.preventDefault());
    link.click();
    const button = element.shadowRoot?.querySelector('button[part="evidence-link"]') as HTMLButtonElement;
    button.click();

    expect(selected).toHaveBeenCalledTimes(2);
    expect(selected.mock.calls[0]?.[0]?.detail.evidence).toMatchObject({ id: "ev1", label: "Risk summary" });
    expect(selected.mock.calls[1]?.[0]?.detail.evidence).toMatchObject({ id: "ev2" });
    expect(selected.mock.calls[1]?.[0]?.detail.event).toMatchObject({ id: "e3" });
  });

  it("drops unsafe evidence hrefs to buttons", async () => {
    const element = await mountTimeline(el => {
      el.events = [
        {
          id: "x",
          action: "attached evidence",
          evidence: [
            // eslint-disable-next-line no-script-url
            { id: "bad", label: "Sneaky", href: "javascript:alert(1)" },
            // A protocol-relative href resolves to an external origin, so it
            // is no safer than an absolute one to an attacker's host.
            { id: "proto", label: "Protocol relative", href: "//evil.example/x" },
            { id: "slash", label: "Backslash", href: "/\\evil.example/x" },
          ],
        },
      ];
    });

    expect(element.shadowRoot?.querySelector('a[part="evidence-link"]')).toBeNull();
    expect(element.shadowRoot?.querySelectorAll('button[part="evidence-link"]')).toHaveLength(3);
  });

  it("shows the load-more affordance only when has-more is set and emits load-more", async () => {
    const element = await mountTimeline(el => {
      el.hasMore = true;
    });
    const more = vi.fn();
    element.addEventListener("load-more", more);

    const region = element.shadowRoot?.querySelector('[part="load-more-region"]') as HTMLElement;
    expect(region.hidden).toBe(false);
    (region.querySelector('[part="load-more"]') as HTMLButtonElement).click();
    expect(more).toHaveBeenCalledTimes(1);

    element.hasMore = false;
    await flush();
    expect(region.hidden).toBe(true);
  });

  it("gates the composer on composable and submits trimmed comments", async () => {
    const element = await mountTimeline(el => {
      el.composable = true;
    });
    const submitted = vi.fn();
    element.addEventListener("entry-submitted", submitted);

    const composer = element.shadowRoot?.querySelector('[part="composer"]') as HTMLElement;
    expect(composer.hidden).toBe(false);
    const input = element.shadowRoot?.querySelector('[part="composer-input"]') as HTMLTextAreaElement;

    input.value = "   ";
    (element.shadowRoot?.querySelector('[part="composer-submit"]') as HTMLButtonElement).click();
    expect(submitted).not.toHaveBeenCalled();

    input.value = "  Escalating to privacy review.  ";
    (element.shadowRoot?.querySelector('[part="composer-submit"]') as HTMLButtonElement).click();
    expect(submitted).toHaveBeenCalledTimes(1);
    expect(submitted.mock.calls[0]?.[0]?.detail).toEqual({ body: "Escalating to privacy review." });
    expect(input.value).toBe("");
  });

  it("hides the composer by default", async () => {
    const element = await mountTimeline();

    expect((element.shadowRoot?.querySelector('[part="composer"]') as HTMLElement).hidden).toBe(true);
  });

  it("ignores malformed events payloads", async () => {
    const element = document.createElement("box-timeline") as Timeline;
    element.setAttribute("events", '[{"id":"a"}]');
    document.body.append(element);
    await flush();

    expect(element.events).toEqual([]);
    expect((element.shadowRoot?.querySelector('[part="empty"]') as HTMLElement).hidden).toBe(false);
  });

  it("patches nothing when the events attribute is unchanged", async () => {
    const element = await mountTimeline();
    const firstEvent = element.shadowRoot?.querySelector('[part="event"]');

    element.heading = "Audit trail";
    await flush();

    expect(element.shadowRoot?.querySelector('[part="event"]')).toBe(firstEvent);
    expect(element.shadowRoot?.textContent).toContain("Audit trail");
  });
});
