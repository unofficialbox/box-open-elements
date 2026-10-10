// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { TraceWaterfall, traceWaterfallLayout, traceSpanDuration, validTraceSpans } from "../../../src/patterns/run/trace-waterfall.js";
import type { TraceSpan } from "../../../src/patterns/run/trace-waterfall.js";

const spans: TraceSpan[] = [
  { id: "run", label: "Upload files", kind: "Run", startMs: 0, durationMs: 1000, status: "ok", detail: { input: { files: 3 }, response: "Uploaded", attributes: { host: "Box" } } },
  { id: "auth", parentId: "run", label: "Sign in", kind: "Action", startMs: 10, durationMs: 200, status: "ok", markers: [{ atMs: 250, label: "95% completed" }] },
  { id: "upload", parentId: "run", label: "files.upload", kind: "Action", startMs: 120, durationMs: 587, status: "failed" },
  { id: "system", parentId: "run", label: "Scheduler", kind: "System", startMs: 0, durationMs: 0, status: "skipped", system: true },
];
const fixture = (): TraceWaterfall => { const element = new TraceWaterfall(); element.spans = structuredClone(spans); document.body.append(element); return element; };
const rows = (element: TraceWaterfall): HTMLElement[] => [...element.shadowRoot!.querySelectorAll<HTMLElement>('[part="row"]')];
const click = (element: TraceWaterfall, part: string): void => element.shadowRoot!.querySelector<HTMLButtonElement>(`[part="${part}"]`)!.click();
const key = (element: HTMLElement, key: string): void => { element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })); };
afterEach(() => { document.body.innerHTML = ""; });

describe("trace waterfall layout", () => {
  it("keeps nested overlapping spans on one zero-based axis", () => {
    const layout = traceWaterfallLayout(spans);
    expect(layout.rows.map(row => [row.span.id, row.depth])).toEqual([["run", 0], ["auth", 1], ["upload", 1]]);
    expect(layout.endMs).toBe(1000); expect(layout.hiddenCount).toBe(1);
    expect(layout.rows[1]!.span.startMs + layout.rows[1]!.span.durationMs).toBeGreaterThan(layout.rows[2]!.span.startMs);
  });
  it("aligns comparison-only branches and preserves earlier markers", () => {
    const current: TraceSpan[] = [{ ...spans[0]!, id: "A", durationMs: 100 }];
    const comparison: TraceSpan[] = [{ ...current[0]!, markers: [{ atMs: 300, label: "Earlier marker" }] }, { ...spans[1]!, id: "B", parentId: "A", startMs: 100, durationMs: 500 }];
    const layout = traceWaterfallLayout(current, { comparisonSpans: comparison });
    expect(layout.endMs).toBe(600);
    expect(layout.rows.map(row => [row.span.id, row.comparisonOnly])).toEqual([["A", false], ["B", true]]);
    const element = new TraceWaterfall(); element.spans = current; element.comparisonSpans = comparison; document.body.append(element);
    expect(rows(element)[1]!.querySelector('[part="bar"]')).toBeNull();
    expect(rows(element)[1]!.querySelector('[part="comparison-bar"]')).not.toBeNull();
    expect(rows(element)[0]!.querySelector('[part="comparison-marker"]')).not.toBeNull();
    expect(rows(element)[0]!.getAttribute("aria-label")).toContain("comparison marker Earlier marker");
    expect(rows(element)[1]!.getAttribute("aria-label")).toContain("Not in current trace");
    rows(element)[1]!.click(); expect(element.selectedSpanId).toBe("B");
    click(element, "table-toggle"); expect(element.shadowRoot!.textContent).toContain("Not in current trace");
    expect(element.shadowRoot!.textContent).toContain("Comparison marker Earlier marker");
  });
  it("reparents visible children of hidden system spans", () => {
    const input = [...spans, { ...spans[1]!, id: "child", parentId: "system" }];
    expect(traceWaterfallLayout(input).rows.find(row => row.span.id === "child")?.parentId).toBe("run");
    expect(traceWaterfallLayout(input, { showSystem: true }).rows.find(row => row.span.id === "child")?.depth).toBe(2);
  });
  it("retains ancestors of search results and reveals collapsed paths", () => {
    const layout = traceWaterfallLayout(spans, { search: "files.upload", collapsed: new Set(["run"]) });
    expect(layout.rows.map(row => row.span.id)).toEqual(["run", "upload"]);
    expect(layout.rows[0]!.expanded).toBe(true);
    expect(traceWaterfallLayout(spans, { collapsed: new Set(["run"]) }).rows).toHaveLength(1);
  });
  it("bounds live growth and includes markers/comparison outside the current trace", () => {
    const input = [{ ...spans[0]!, status: "running" as const, durationMs: 0 }];
    expect(traceSpanDuration(input[0]!, 2500)).toBe(2500);
    expect(traceSpanDuration(input[0]!, -1)).toBe(0);
    expect(traceWaterfallLayout(input, { nowMs: 2500 }).endMs).toBe(2500);
    expect(traceWaterfallLayout(spans, { comparisonSpans: [{ ...spans[0]!, startMs: 500, durationMs: 2000 }] }).endMs).toBe(2500);
    expect(traceWaterfallLayout([{ ...spans[0]!, markers: [{ atMs: 3000, label: "95% completed" }] }]).endMs).toBe(3000);
  });
  it("ignores malformed marker records from serialized host traces", () => {
    const input = JSON.parse(JSON.stringify([{ ...spans[0]!, markers: {} }, { ...spans[1]!, markers: [null, { atMs: 5000 }, { atMs: -1, label: "invalid" }] }])) as TraceSpan[];
    expect(traceWaterfallLayout(input).endMs).toBe(1000);
    const element = new TraceWaterfall(); element.setAttribute("spans", JSON.stringify(input)); document.body.append(element);
    expect(rows(element)).toHaveLength(2);
    expect(element.shadowRoot!.querySelector('[part="marker"]')).toBeNull();
  });
  it("tolerates missing/cyclic parents and rejects invalid/duplicate timing", () => {
    const input = [{ ...spans[0]!, parentId: "auth" }, { ...spans[1]!, parentId: "run" }, { ...spans[2]!, parentId: "missing" }];
    expect(traceWaterfallLayout(input).rows.map(row => row.depth)).toEqual([0, 0, 0]);
    expect(validTraceSpans([...spans, { ...spans[0]! }, { ...spans[1]!, id: "bad", durationMs: NaN }, { ...spans[2]!, id: "negative", startMs: -1 }])).toHaveLength(4);
    expect(traceWaterfallLayout([]).endMs).toBe(1);
  });
});

describe("TraceWaterfall", () => {
  it("renders overlapping geometry, zero ticks, status words, markers and comparison", () => {
    const element = fixture(); element.showSystem = true; element.comparisonSpans = [{ ...spans[1]!, startMs: 30, durationMs: 100 }];
    const rendered = rows(element);
    expect(rendered).toHaveLength(4);
    expect(rendered[1]!.querySelector<HTMLElement>('[part="bar"]')!.style.left).toBe("1%");
    expect(rendered[2]!.querySelector<HTMLElement>('[part="bar"]')!.style.left).toBe("12%");
    expect(rendered[3]!.querySelector<HTMLElement>('[part="bar"]')!.style.width).toBe("0%");
    expect(rendered[1]!.getAttribute("aria-label")).toContain("95% completed at 250 ms");
    expect(rendered[1]!.querySelector('[part="comparison-bar"]')).not.toBeNull();
    expect(rendered[2]!.textContent).toContain("× Failed");
  });
  it("navigates the tree with arrows/Home/End and selects using Enter/Space", () => {
    const element = fixture(); const selected = vi.fn(); element.addEventListener("span-selected", selected);
    rows(element)[0]!.focus(); key(rows(element)[0]!, "ArrowRight"); expect(element.shadowRoot!.activeElement).toBe(rows(element)[1]);
    key(rows(element)[1]!, "ArrowDown"); expect(element.shadowRoot!.activeElement).toBe(rows(element)[2]);
    key(rows(element)[2]!, "Enter"); expect(element.selectedSpanId).toBe("upload"); expect(selected).toHaveBeenCalledOnce();
    key(rows(element)[2]!, "ArrowLeft"); expect(element.shadowRoot!.activeElement).toBe(rows(element)[0]);
    key(rows(element)[0]!, "ArrowLeft"); expect(rows(element)).toHaveLength(1);
    key(rows(element)[0]!, "ArrowRight"); expect(rows(element)).toHaveLength(3);
    key(rows(element)[0]!, "End"); expect(element.shadowRoot!.activeElement).toBe(rows(element)[2]);
    key(rows(element)[2]!, "Home"); key(rows(element)[0]!, " "); expect(element.selectedSpanId).toBe("run");
  });
  it("preserves focus and expansion through repeated live updates", () => {
    const element = fixture(); rows(element)[1]!.focus(); element.spans = [...spans, { ...spans[2]!, id: "next", status: "running" }]; element.nowMs = 2000;
    expect(element.shadowRoot!.activeElement?.getAttribute("data-span-id")).toBe("auth");
    click(element, "expand"); expect(rows(element)).toHaveLength(1);
    element.spans = [...spans]; expect(rows(element)).toHaveLength(1);
    click(element, "expand"); expect(rows(element)).toHaveLength(3);
  });
  it("filters search without stealing its focus or changing the shared axis", () => {
    const element = fixture(); const input = element.shadowRoot!.querySelector<HTMLInputElement>('[part="search"]')!; input.focus(); input.value = "files.upload"; input.dispatchEvent(new Event("input"));
    expect(rows(element).map(row => row.dataset.spanId)).toEqual(["run", "upload"]);
    expect(element.shadowRoot!.activeElement?.getAttribute("part")).toBe("search");
    expect(element.layout.endMs).toBe(1000);
  });
  it("provides details, text/code, adjacent spans, Escape and a host slot", () => {
    const element = fixture(); rows(element)[0]!.click();
    expect(element.shadowRoot!.querySelector('[part="details"]')!.textContent).toContain("Uploaded");
    expect(element.shadowRoot!.querySelector('slot[name="details"]')).not.toBeNull();
    click(element, "detail-mode"); expect(element.shadowRoot!.querySelector("pre")!.textContent).toContain('"files": 3');
    click(element, "next-span"); expect(element.selectedSpanId).toBe("auth");
    click(element, "previous-span"); expect(element.selectedSpanId).toBe("run");
    key(element.shadowRoot!.querySelector<HTMLButtonElement>('[part="close-details"]')!, "Escape");
    expect(element.selectedSpanId).toBe(""); expect(element.shadowRoot!.activeElement).toBe(rows(element)[0]);
  });
  it("offers table fallback and toggles hidden system spans", () => {
    const element = fixture(); expect(element.shadowRoot!.textContent).toContain("Show 1 hidden"); click(element, "system-toggle"); expect(rows(element)).toHaveLength(4);
    click(element, "system-toggle"); expect(rows(element)).toHaveLength(3);
    click(element, "table-toggle"); expect(element.shadowRoot!.querySelectorAll("tbody tr")).toHaveLength(3); expect(element.shadowRoot!.textContent).toContain("95% completed");
    element.shadowRoot!.querySelector<HTMLButtonElement>("[data-select-id=auth]")!.click(); expect(element.selectedSpanId).toBe("auth");
    click(element, "table-toggle"); expect(rows(element)).toHaveLength(3);
  });
  it("escapes all host-provided labels/details and survives malformed JSON", () => {
    const element = fixture(); element.spans = [{ ...spans[0]!, label: '<img src=x onerror="alert(1)">', detail: { input: "<script>bad</script>" } }]; rows(element)[0]!.click();
    expect(element.shadowRoot!.querySelector("img,script")).toBeNull();
    const empty = new TraceWaterfall(); empty.setAttribute("spans", "bad JSON"); document.body.append(empty); expect(rows(empty)).toHaveLength(0);
  });
  it("keeps menu focus and restores table selection after closing details", () => {
    const element = fixture(); const menu = element.shadowRoot!.querySelector<HTMLDetailsElement>('[part="menu"]')!; menu.open = true;
    click(element, "collapse-all"); expect(rows(element)).toHaveLength(1); expect(element.shadowRoot!.querySelector<HTMLDetailsElement>('[part="menu"]')!.open).toBe(true);
    expect(element.shadowRoot!.activeElement?.getAttribute("part")).toBe("collapse-all");
    click(element, "expand-all"); expect(rows(element)).toHaveLength(3);
    click(element, "table-toggle"); element.shadowRoot!.querySelector<HTMLButtonElement>("[data-select-id=auth]")!.click(); click(element, "close-details");
    expect(element.shadowRoot!.activeElement?.getAttribute("data-select-id")).toBe("auth");
  });
  it("expands in a native modal dialog and restores focus on Escape/cancel", () => {
    const element = fixture(); click(element, "fullscreen-toggle");
    expect(element.shadowRoot!.querySelector("dialog[open]")).not.toBeNull();
    expect(element.shadowRoot!.textContent).toContain("Exit full screen");
    key(element.shadowRoot!.querySelector<HTMLButtonElement>('[part="fullscreen-toggle"]')!, "Escape");
    expect(element.shadowRoot!.querySelector("dialog")).toBeNull();
    expect(element.shadowRoot!.activeElement?.getAttribute("part")).toBe("fullscreen-toggle");
    click(element, "fullscreen-toggle"); element.shadowRoot!.querySelector("dialog")!.dispatchEvent(new Event("cancel", { cancelable: true }));
    expect(element.shadowRoot!.querySelector("dialog")).toBeNull();
  });
  it("retains table and options focus across live replacements and uses an enabled detail endpoint", () => {
    const element = fixture(); click(element, "table-toggle");
    element.shadowRoot!.querySelector<HTMLButtonElement>('[data-select-id="auth"]')!.focus();
    element.nowMs = 2000;
    expect(element.shadowRoot!.activeElement?.getAttribute("data-select-id")).toBe("auth");
    const summary = element.shadowRoot!.querySelector<HTMLElement>("summary")!; summary.focus();
    element.spans = [...spans];
    expect(element.shadowRoot!.activeElement?.tagName).toBe("SUMMARY");
    click(element, "table-toggle"); rows(element)[1]!.click();
    click(element, "previous-span");
    expect(element.shadowRoot!.activeElement?.getAttribute("part")).toBe("next-span");
    click(element, "next-span"); click(element, "next-span");
    expect(element.shadowRoot!.activeElement?.getAttribute("part")).toBe("previous-span");
  });
  it("has clean automated treegrid/table semantics", async () => {
    const element = fixture();
    expect((await axe.run(element, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } })).violations).toEqual([]);
    click(element, "table-toggle");
    expect((await axe.run(element, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } })).violations).toEqual([]);
  });
});
