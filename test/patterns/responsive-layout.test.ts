import { afterEach, describe, expect, it, vi } from "vitest";
import { LineageGraph } from "../../src/patterns/lineage/lineage-graph.js";
import { NotificationInbox } from "../../src/patterns/notifications/notification-inbox.js";
import { ExplorerToolbar } from "../../src/patterns/content-explorer/adapters/toolbar.js";
import { FactList } from "../../src/components/collections/fact-list.js";

afterEach(() => { document.body.replaceChildren(); });
const longText = "QuarterlyRevenueForecast_InternationalMarkets_2026_FinalApproved.xlsx";

describe("narrow-container layout contracts", () => {
  it("keeps full lineage text and comparisons in a named keyboard-scrollable region", () => {
    const graph = new LineageGraph();
    graph.nodes = [{ id: "a", label: longText }, { id: "b", label: "Executed contract", parents: [{ id: "a", deviation: "minor" }] }];
    document.body.append(graph);
    const region = graph.shadowRoot!.querySelector<HTMLElement>('[part="graph"]')!;
    expect(region.tabIndex).toBe(0);
    expect(region.getAttribute("role")).toBe("region");
    expect(region.getAttribute("aria-label")).toContain("scroll horizontally");
    expect(region.textContent).toContain(longText);
    const selected = vi.fn(); graph.addEventListener("edge-selected", selected);
    region.querySelector<HTMLButtonElement>('[part="edge-chip"]')!.click();
    expect(selected).toHaveBeenCalledOnce();
    const styles = graph.shadowRoot!.querySelector("style")!.textContent;
    expect(styles).toContain("flex-wrap: nowrap");
    expect(styles).toContain("inline-size: max-content");
  });

  it("preserves complete fact values and supports stacked label/value rows", () => {
    const facts = new FactList();
    facts.rows = [{ label: "Document identifier", value: longText }, { label: "Notes", value: "" }];
    document.body.append(facts);
    expect(facts.shadowRoot!.querySelector("dd")!.textContent).toBe(longText);
    expect(facts.shadowRoot!.querySelectorAll("dt")).toHaveLength(2);
    const styles = facts.shadowRoot!.querySelector("style")!.textContent;
    expect(styles).toContain("overflow-wrap:anywhere");
    expect(styles).toContain("@container boe-result-block (max-width:28rem)");
    facts.rows = [];
    expect(facts.shadowRoot!.querySelectorAll("dt")).toHaveLength(0);
  });

  it("allows toolbar search to shrink below the old 12rem minimum", () => {
    const toolbar = new ExplorerToolbar(); document.body.append(toolbar);
    const styles = toolbar.shadowRoot!.querySelector("style")!.textContent;
    expect(styles).not.toContain("min-width: 12rem");
    expect(styles).toContain("min-width: 0");
    expect(toolbar.shadowRoot!.querySelector('[part="refresh"]')!.textContent).toBe("Refresh");
    const search = toolbar.shadowRoot!.querySelector("box-search-field")!;
    expect(search.shadowRoot!.querySelector("style")!.textContent).toContain("@container boe-search-field (max-width: 22rem)");
  });

  it("retains full notification text and read intents with responsive actions", () => {
    const inbox = new NotificationInbox();
    inbox.notifications = [{ id: "n", type: "approval", title: longText, timestamp: "2026-09-24T12:00:00Z" }];
    document.body.append(inbox);
    expect(inbox.shadowRoot!.querySelector('[part="item-title"]')!.textContent).toBe(longText);
    const read = vi.fn(); inbox.addEventListener("mark-read-requested", read);
    const button = inbox.shadowRoot!.querySelector<HTMLButtonElement>('[data-action="read"]')!;
    expect(button.getAttribute("aria-label")).toContain(longText);
    button.click();
    expect(read).toHaveBeenCalledOnce();
    const styles = inbox.shadowRoot!.querySelector("style")!.textContent;
    expect(styles).toContain("@container boe-notification-inbox (max-width: 32rem)");
    expect(styles).toContain("grid-column: 2");
  });
});
