// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tree } from "../../src/components/collections/tree.js";
import { TreeGrid } from "../../src/components/collections/tree-grid.js";
import { ProgressSteps } from "../../src/components/feedback/progress-steps.js";
import { Calendar } from "../../src/components/forms/calendar.js";
afterEach(() => document.body.replaceChildren());
const branch = [{ value: "a", label: "Projects", children: [{ value: "child", label: "Report" }] }];
function control(e: HTMLElement, selector: string) { return e.shadowRoot!.querySelector<HTMLButtonElement>(selector)!; }
function outside() { const input = document.createElement("input"); input.value = "Host draft"; document.body.append(input); return input; }
function key(button: HTMLElement, name: string) { button.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true })); }
for (const Constructor of [Tree, TreeGrid]) describe(`${Constructor.tagName} expansion input ownership`, () => {
 function setup() { const e = new Constructor(); if (e instanceof TreeGrid) e.columns = [{ key: "name", label: "Name" }]; e.items = branch; document.body.append(e); return e; }
 it("preserves a collapsed branch through property and identical attribute echoes", async () => {
  const e = setup(); control(e, '[part~="toggle"]').click(); await Promise.resolve();
  expect(control(e, '[part~="toggle"]').getAttribute("aria-expanded")).toBe("false");
  e.items = branch.map(item => ({ ...item })); e.setAttribute("items", e.getAttribute("items")!); e.label = "Current label";
  expect(control(e, '[part~="toggle"]').getAttribute("aria-expanded")).toBe("false");
 });
 it("preserves expansion on reconnect with unchanged data", async () => {
  const e = setup(); control(e, '[part~="toggle"]').click(); await Promise.resolve(); e.remove(); document.body.append(e);
  expect(control(e, '[part~="toggle"]').getAttribute("aria-expanded")).toBe("false");
 });
 it("still seeds top-level expansion for genuine new data, including detached updates", () => {
  const e = setup(); control(e, '[part~="toggle"]').click(); e.items = [{ ...branch[0], label: "New input" }];
  expect(control(e, '[part~="toggle"]').getAttribute("aria-expanded")).toBe("true");
  e.remove(); e.items = [{ value: "new", label: "Replacement", children: [{ value: "new-child", label: "New child" }] }]; document.body.append(e);
  expect(control(e, '[part~="toggle"]').getAttribute("aria-expanded")).toBe("true"); expect(e.shadowRoot!.textContent).toContain("New child");
 });
});
describe("Tree separate expander name", () => {
 it("names the current branch and expansion action with literal authored text", async () => {
  const e = new Tree(); e.items = [{ label: "R&D and Bob's <Projects>", children: [{ label: "Report" }] }]; document.body.append(e);
  expect(control(e, '[part~="toggle"]').getAttribute("aria-label")).toBe("Collapse R&D and Bob's <Projects>");
  control(e, '[part~="toggle"]').click(); await Promise.resolve();
  expect(control(e, '[part~="toggle"]').getAttribute("aria-label")).toBe("Expand R&D and Bob's <Projects>"); expect(e.shadowRoot!.querySelector("projects")).toBeNull();
 });
});
function steps() { const e = new ProgressSteps(); e.items = [{ value: "a", label: "Start" }, { value: "b", label: "Review" }, { value: "c", label: "Finish" }]; e.value = "a"; document.body.append(e); control(e, '[data-value="a"]').focus(); return e; }
describe("ProgressSteps focus handoff", () => {
 it("finishes keyboard focus before notifying the host and preserves its caret", async () => {
  const e = steps(), input = outside(); const observed: string[] = [];
  e.addEventListener("value-changed", event => { observed.push(e.shadowRoot!.activeElement?.getAttribute("data-value") ?? ""); input.focus(); input.setSelectionRange(2, 5); });
  key(control(e, '[data-value="a"]'), "ArrowRight"); await Promise.resolve();
  expect(observed).toEqual(["b"]); expect(e.value).toBe("b"); expect(document.activeElement).toBe(input); expect([input.selectionStart, input.selectionEnd]).toEqual([2, 5]);
 });
 it("does not resume old indexed focus or updates after host event reentry", async () => {
  const e = steps(), input = outside(), events: unknown[] = [];
  e.addEventListener("value-changed", event => { events.push((event as CustomEvent).detail); e.items = [{ value: "c", label: "Host current" }, { value: "a", label: "Start" }]; e.value = "c"; input.focus(); });
  key(control(e, '[data-value="a"]'), "ArrowRight"); await Promise.resolve();
  expect(events).toEqual([{ value: "b" }]); expect(e.value).toBe("c"); expect(document.activeElement).toBe(input);
 });
 it("cancels a pending selection superseded by focusin A→B→A reentry", async () => {
  const e = steps(), events = vi.fn(); e.addEventListener("value-changed", events);
  control(e, '[data-value="b"]').addEventListener("focusin", () => { e.value = "c"; e.value = "b"; }, { once: true });
  key(control(e, '[data-value="a"]'), "ArrowRight"); await Promise.resolve(); expect(events).not.toHaveBeenCalled(); expect(e.value).toBe("b");
 });
 it("retains same-session echoes and emits current data after focusin label refresh", async () => {
  const e = steps(), events = vi.fn(); e.addEventListener("value-changed", events);
  control(e, '[data-value="b"]').addEventListener("focusin", () => { e.value = e.value; e.items = e.items.map(item => ({ ...item, label: item.value === "b" ? "Current review" : item.label })); }, { once: true });
  key(control(e, '[data-value="a"]'), "ArrowRight"); await Promise.resolve(); expect(events).toHaveBeenCalledTimes(1); expect(events.mock.calls[0][0].detail).toEqual({ value: "b" });
  expect(e.shadowRoot!.querySelector('[part="live"]')!.textContent).toContain("Current review");
 });
 it("cancels after detach/reconnect during opening focus and permits a later action", async () => {
  const e = steps(), events = vi.fn(); e.addEventListener("value-changed", events);
  control(e, '[data-value="b"]').addEventListener("focusin", () => { e.remove(); document.body.append(e); }, { once: true });
  key(control(e, '[data-value="a"]'), "ArrowRight"); await Promise.resolve(); expect(events).not.toHaveBeenCalled();
  control(e, '[data-value="b"]').focus(); key(control(e, '[data-value="b"]'), "ArrowRight"); await Promise.resolve(); expect(events).toHaveBeenCalledTimes(1); expect(e.value).toBe("c");
 });
 it("does not activate a retained detached button", () => {
  const e = steps(), old = control(e, '[data-value="b"]'), events = vi.fn(); e.addEventListener("value-changed", events); e.remove(); old.click(); expect(events).not.toHaveBeenCalled(); expect(e.value).toBe("a");
 });
});
function calendar(mode = "single") { const e = new Calendar(); e.today = "2026-10-12"; e.month = "2026-10"; e.value = "2026-10-10"; e.mode = mode; document.body.append(e); control(e, '[data-date="2026-10-10"]').focus(); return e; }
describe("Calendar active date and range ownership", () => {
 it("preserves active navigation through identical controlled value echoes", () => {
  const e = calendar(); for (let i = 0; i < 4; i++) key(e.shadowRoot!.activeElement as HTMLElement, "ArrowRight");
  expect(e.shadowRoot!.activeElement?.getAttribute("data-date")).toBe("2026-10-14"); e.value = e.value;
  key(e.shadowRoot!.activeElement as HTMLElement, "ArrowRight"); expect(e.shadowRoot!.activeElement?.getAttribute("data-date")).toBe("2026-10-15");
 });
 it("retains intentional new-value and new-month roving resets", () => {
  const e = calendar(); key(e.shadowRoot!.activeElement as HTMLElement, "ArrowRight"); e.value = "2026-10-20";
  expect(control(e, '[data-date="2026-10-20"]').tabIndex).toBe(0); e.month = "2026-11"; expect(control(e, '[data-date="2026-11-01"]').tabIndex).toBe(0);
 });
 it.each(["single", "range"])("completes %s selection focus before the host handoff", mode => {
  const e = calendar(mode), input = outside(), observed: string[] = [];
  e.addEventListener(mode === "range" ? "range-changed" : "value-changed", () => { observed.push(e.shadowRoot!.activeElement?.getAttribute("data-date") ?? ""); input.focus(); input.setSelectionRange(2, 5); });
  control(e, '[data-date="2026-10-13"]').click(); expect(observed).toEqual(["2026-10-13"]); expect(document.activeElement).toBe(input); expect([input.selectionStart, input.selectionEnd]).toEqual([2, 5]);
 });
 it("keeps activation-time range data and the newer host range/month after reentry", () => {
  const e = calendar("range"), input = outside(), events: unknown[] = [];
  e.addEventListener("range-changed", event => { events.push((event as CustomEvent).detail); e.start = "2026-11-15"; e.end = "2026-11-16"; e.month = "2026-11"; input.focus(); });
  control(e, '[data-date="2026-10-13"]').click(); expect(events).toEqual([{ start: "2026-10-13", end: "" }]); expect([e.start, e.end, e.month]).toEqual(["2026-11-15", "2026-11-16", "2026-11"]); expect(document.activeElement).toBe(input);
 });
 it("does not notify a range action superseded by focusin rollback", () => {
  const e = calendar("range"), events = vi.fn(); e.addEventListener("range-changed", events);
  // Selection rebuilds the grid before its final focus; listen on the stable grid.
  e.shadowRoot!.querySelector('[part="grid"]')!.addEventListener("focusin", () => { e.start = "2026-10-15"; e.start = "2026-10-13"; }, { once: true });
  control(e, '[data-date="2026-10-13"]').click(); expect(events).not.toHaveBeenCalled(); expect(e.start).toBe("2026-10-13");
 });
 it("does not activate a retained detached range button", () => {
  const e = calendar("range"), old = control(e, '[data-date="2026-10-13"]'), events = vi.fn(); e.addEventListener("range-changed", events); e.remove(); old.click(); expect(events).not.toHaveBeenCalled(); expect(e.start).toBe("");
 });
});
