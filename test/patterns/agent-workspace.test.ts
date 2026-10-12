import { afterEach, describe, expect, it, vi } from "vitest";
import { AgentWorkspace } from "../../src/patterns/agent-workspace/agent-workspace.js";

afterEach(() => { document.body.replaceChildren(); localStorage.clear(); vi.restoreAllMocks(); });
const mount = (width = 1400) => {
  const element = new AgentWorkspace();
  element.setAttribute("viewer-key", "synthetic-echo-test");
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ width } as DOMRect);
  document.body.append(element); return element;
};

describe("AgentWorkspace controlled pane echoes", () => {
  it.each([1400, 390])("emits one change per actual pane transition at width %s", width => {
    const element = mount(width); const changes: Array<{ pane: "chats" | "details"; open: boolean }> = [];
    element.addEventListener("pane-change", event => {
      const detail = (event as CustomEvent<{ pane: "chats" | "details"; open: boolean }>).detail;
      changes.push({ pane: detail.pane, open: detail.open });
      if (changes.length < 10) element.panes = { [detail.pane]: detail.open };
    });
    const next = !element.panes.chats; element.panes = { chats: next }; element.panes = element.panes;
    expect(changes).toEqual([{ pane: "chats", open: next }]);
    element.open("chats", !next);
    expect(changes.at(-1)).toEqual({ pane: "chats", open: !next }); expect(changes).toHaveLength(2);
    if (width === 390) {
      element.open("chats", true); changes.length = 0; element.panes = { details: true };
      expect(element.panes).toEqual({ chats: false, details: true });
      expect(changes).toEqual([{ pane: "chats", open: false }, { pane: "details", open: true }]);
    }
  });

  it("publishes current state before listeners trigger a render", () => {
    const element = mount(); const changes: string[] = [];
    element.addEventListener("pane-change", event => {
      changes.push((event as CustomEvent<{ pane: string }>).detail.pane);
      if (changes.length < 10) element.toggleAttribute("hide-toggles");
    });
    element.panes = { chats: false, details: false };
    expect(changes).toEqual(["chats", "details"]);
  });

  it("preserves host DOM, external focus and pane transitions after reconnect", () => {
    const element = mount(390); const input = document.createElement("input"); input.slot = "details"; input.value = "Draft"; element.append(input);
    element.panes = { details: true }; input.focus(); input.setSelectionRange(1, 3);
    element.panes = element.panes;
    element.open("details", true);
    expect(document.activeElement).toBe(input); expect([input.selectionStart, input.selectionEnd]).toEqual([1, 3]);
    element.remove(); document.body.append(element); const change = vi.fn(); element.addEventListener("pane-change", change);
    element.panes = { details: false }; element.panes = { details: false };
    expect(change).toHaveBeenCalledTimes(1); expect(element.querySelector("input")).toBe(input);
  });
});
