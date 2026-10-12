import { afterEach, describe, expect, it, vi } from "vitest";
import { Popover } from "../../src/components/overlays/popover.js";
import { Tooltip } from "../../src/components/overlays/tooltip.js";
import { Dialog } from "../../src/components/overlays/dialog.js";
import { SplitView } from "../../src/components/layout/split-view.js";
import { AgentWorkspace } from "../../src/patterns/agent-workspace/agent-workspace.js";
const flush = async () => { await Promise.resolve(); await new Promise(resolve => setTimeout(resolve, 0)); };
const escape = (target: Element, prevented = false) => { const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, composed: true, cancelable: true }); if (prevented) event.preventDefault(); target.dispatchEvent(event); return event; };
afterEach(() => { document.body.replaceChildren(); document.body.style.cursor = ""; document.body.style.userSelect = ""; localStorage.clear(); vi.restoreAllMocks(); });

describe("overlay Escape ownership", () => {
  it("preserves a child-handled/cancelled Escape, then handles the next Escape", async () => {
    const element = new Popover(); const child = document.createElement("button"); child.textContent = "Child"; element.append(child); document.body.append(element); element.show(); await flush();
    const handled = (event: KeyboardEvent) => event.preventDefault(); child.addEventListener("keydown", handled);
    escape(child); expect(element.open).toBe(true); child.removeEventListener("keydown", handled);
    escape(child); expect(element.open).toBe(false);
  });
  it("closes only the active inner popover and preserves outer cancellation", async () => {
    const outer = new Popover(); const inner = new Popover(); inner.append(document.createElement("button")); outer.append(inner); document.body.append(outer); outer.show(); inner.show(); await flush();
    escape(inner.shadowRoot!.querySelector('[part="surface"]')!); expect(inner.open).toBe(false); expect(outer.open).toBe(true);
    escape(outer.shadowRoot!.querySelector('[part="surface"]')!, true); expect(outer.open).toBe(true);
  });
  it("lets a closed tooltip pass Escape to its dialog; an open tooltip consumes its own dismissal", () => {
    const dialog = new Dialog(); const tooltip = new Tooltip(); const trigger = document.createElement("button"); tooltip.append(trigger); dialog.append(tooltip); document.body.append(dialog); dialog.open = true; trigger.focus(); tooltip.hide();
    escape(trigger); expect(dialog.open).toBe(false);
    dialog.open = true; tooltip.show(); escape(trigger); expect(tooltip.open).toBe(false); expect(dialog.open).toBe(true);
    tooltip.show(); escape(trigger, true); expect(tooltip.open).toBe(true); expect(dialog.open).toBe(true);
  });
  it("does not run an old queued popover focus after close or detach", async () => {
    const element = new Popover(); const inside = document.createElement("button"); element.append(inside); document.body.append(element);
    const outside = document.createElement("input"); document.body.append(outside); outside.focus();
    element.show(); element.hide(); outside.focus(); await flush(); expect(document.activeElement).toBe(outside);
    element.show(); element.remove(); outside.focus(); await flush(); expect(document.activeElement).toBe(outside);
  });
});

describe("Tooltip description token ownership", () => {
  it("preserves host IDs and live additions across refresh, close, detach and reconnect", async () => {
    const element = new Tooltip(); element.label = "Tooltip details"; const trigger = document.createElement("button"); trigger.textContent = "Help"; trigger.setAttribute("aria-describedby", "help error"); element.append(trigger); document.body.append(element); element.show();
    const tokens = () => (trigger.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean);
    expect(tokens()).toContain("help"); expect(tokens()).toContain("error");
    const own = tokens().filter(id => !["help", "error"].includes(id)); expect(own).toHaveLength(1);
    expect(document.getElementById(own[0])?.textContent).toContain("Tooltip details");
    trigger.setAttribute("aria-describedby", `${trigger.getAttribute("aria-describedby")} later`); element.label = "Updated details";
    expect(tokens()).toEqual(["help", "error", "later", own[0]]); element.hide(); expect(trigger.getAttribute("aria-describedby")).toBe("help error later");
    element.show(); element.remove(); expect(trigger.getAttribute("aria-describedby")).toBe("help error later"); expect(document.getElementById(own[0])).toBeNull();
    document.body.append(element); element.hide(); expect(trigger.getAttribute("aria-describedby")).toBe("help error later");
  });
  it("does not remove a description token that the caller already supplied", () => {
    const element = new Tooltip(); document.body.append(element); const trigger = element.shadowRoot!.querySelector('[part="trigger"]')!;
    const id = element.shadowRoot!.querySelector('[part="tooltip"]')!.id; trigger.setAttribute("aria-describedby", `host ${id}`);
    element.show(); element.hide(); expect(trigger.getAttribute("aria-describedby")).toBe(`host ${id}`);
  });
  it("cleans the old trigger without erasing host associations when the trigger is replaced", async () => {
    const element = new Tooltip(); const first = document.createElement("button"); first.setAttribute("aria-describedby", "first-help"); element.append(first); document.body.append(element); element.show();
    const second = document.createElement("button"); second.setAttribute("aria-describedby", "second-help"); first.replaceWith(second); await flush();
    expect(first.getAttribute("aria-describedby")).toBe("first-help"); expect(second.getAttribute("aria-describedby")?.split(/\s+/)).toContain("second-help"); element.hide(); expect(second.getAttribute("aria-describedby")).toBe("second-help");
  });
});

const pointer = (target: Element, type: string, id = 1, x = 100) => { const event = new MouseEvent(type, { bubbles: true, clientX: x }); Object.defineProperty(event, "pointerId", { value: id }); target.dispatchEvent(event); };
const mountSplit = () => { const element = new SplitView(); element.resizable = true; element.collapse = "never"; vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ left: 0, width: 500 } as DOMRect); document.body.append(element); return { element, separator: element.shadowRoot!.querySelector('[part="separator"]')! }; };
describe("SplitView drag lifetime and style ownership", () => {
  it.each(["detach", "pointerup", "pointercancel", "lostpointercapture"])("restores original owned styles on %s and permits a later drag", reason => {
    document.body.style.setProperty("cursor", "crosshair", "important"); document.body.style.userSelect = "text";
    const { element, separator } = mountSplit(); pointer(separator, "pointerdown"); pointer(separator, "pointermove", 1, 200); expect(document.body.style.cursor).toBe("col-resize");
    if (reason === "detach") element.remove(); else pointer(separator, reason);
    expect(document.body.style.cursor).toBe("crosshair"); expect(document.body.style.getPropertyPriority("cursor")).toBe("important"); expect(document.body.style.userSelect).toBe("text");
    const ratio = element.ratio; pointer(separator, "pointermove", 1, 350); expect(element.ratio).toBe(ratio);
    if (!element.isConnected) document.body.append(element); pointer(separator, "pointerdown", 2); pointer(separator, "pointerup", 2); expect(document.body.style.cursor).toBe("crosshair");
  });
  it("does not overwrite host style changes or process a different pointer", () => {
    const { element, separator } = mountSplit(); pointer(separator, "pointerdown", 1); const ratio = element.ratio;
    pointer(separator, "pointermove", 2, 350); pointer(separator, "pointerup", 2); expect(element.ratio).toBe(ratio); expect(document.body.style.cursor).toBe("col-resize");
    document.body.style.cursor = "wait"; document.body.style.userSelect = "all"; element.remove(); expect(document.body.style.cursor).toBe("wait"); expect(document.body.style.userSelect).toBe("all");
  });
  it("does not clear unowned styles after an inactive pointerup", () => {
    const { separator } = mountSplit(); document.body.style.cursor = "progress"; document.body.style.userSelect = "text"; pointer(separator, "pointerup"); expect(document.body.style.cursor).toBe("progress"); expect(document.body.style.userSelect).toBe("text");
  });
});

describe("AgentWorkspace initial responsive ownership", () => {
  it.each([360, 1440])("honors explicit preconnect state at width %s without rebuilding host editors", width => {
    const element = new AgentWorkspace(); vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ width } as DOMRect); element.panes = { chats: false, details: true };
    const input = document.createElement("input"); input.slot = "details"; input.value = "Host draft"; element.append(input); document.body.append(element);
    expect(element.panes).toEqual({ chats: false, details: true }); expect(element.querySelector("input")).toBe(input);
    element.remove(); document.body.append(element); expect(element.panes).toEqual({ chats: false, details: true });
  });
  it("retains a same-default explicit pane value while applying defaults only to the other pane", () => {
    const element = new AgentWorkspace(); vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ width: 360 } as DOMRect); element.panes = { chats: true }; document.body.append(element);
    expect(element.panes).toEqual({ chats: true, details: false });
  });
  it("keeps responsive defaults for unowned state and mobile mutual exclusion", () => {
    const element = new AgentWorkspace(); vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ width: 360 } as DOMRect); document.body.append(element); expect(element.panes).toEqual({ chats: false, details: false });
    element.panes = { chats: true, details: true }; expect(element.panes).toEqual({ chats: false, details: true });
  });
});


describe("reviewed rich-content and overlapping-drag ownership", () => {
  it("includes rich slot text in the same-tree description and refreshes it", async () => {
    const element = new Tooltip(); element.label = "Preview";
    const trigger = document.createElement("button"); trigger.textContent = "Help";
    const content = document.createElement("span"); content.slot = "content"; content.innerHTML = "<strong>Retention policy</strong> and <em>details</em>";
    element.append(trigger, content); document.body.append(element); element.show();
    const id = trigger.getAttribute("aria-describedby")!;
    expect(document.getElementById(id)?.textContent).toContain("Retention policy and details");
    content.textContent = "Updated rich details"; await flush();
    expect(document.getElementById(id)?.textContent).toContain("Updated rich details");
    element.remove(); expect(document.getElementById(id)).toBeNull();
  });
  it.each(["detach", "pointerup", "pointercancel", "lostpointercapture"].flatMap(reason => ["first", "second"].map(first => [reason, first])))("keeps global drag styles until all drags finish on %s, ending %s first", (reason, first) => {
    document.body.style.cursor = "crosshair"; document.body.style.userSelect = "text";
    const a = mountSplit(), b = mountSplit(); pointer(a.separator, "pointerdown", 1); pointer(b.separator, "pointerdown", 2);
    const ended = first === "first" ? a : b, remaining = first === "first" ? b : a;
    if (reason === "detach") ended.element.remove(); else pointer(ended.separator, reason, first === "first" ? 1 : 2);
    expect(document.body.style.cursor).toBe("col-resize"); expect(document.body.style.userSelect).toBe("none");
    remaining.element.remove(); expect(document.body.style.cursor).toBe("crosshair"); expect(document.body.style.userSelect).toBe("text");
  });
  it("preserves live host overrides when overlapping drags finish", () => {
    const a = mountSplit(), b = mountSplit(); pointer(a.separator, "pointerdown", 1); pointer(b.separator, "pointerdown", 2);
    document.body.style.cursor = "wait"; document.body.style.userSelect = "all"; a.element.remove(); b.element.remove();
    expect(document.body.style.cursor).toBe("wait"); expect(document.body.style.userSelect).toBe("all");
  });
});


it("does not acquire global styles if pointer capture has already become unavailable", () => {
  const { element, separator } = mountSplit();
  (separator as HTMLElement).setPointerCapture = () => { throw new DOMException("No active pointer", "NotFoundError"); };
  document.body.style.cursor = "wait"; document.body.style.userSelect = "text";
  pointer(separator, "pointerdown"); element.remove();
  expect(document.body.style.cursor).toBe("wait"); expect(document.body.style.userSelect).toBe("text");
});
