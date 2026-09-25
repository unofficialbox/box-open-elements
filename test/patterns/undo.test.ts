import { afterEach, describe, expect, it, vi } from "vitest";
import { offerUndo, removeAt, removeKey, removeFromMapList } from "../../src/patterns/undo/index.js";
afterEach(() => { document.body.innerHTML = ""; vi.useRealTimers(); });
describe("undo removal", () => {
  it("restores identity once and clamps after intervening edits", () => {
    const item = {}; const list = [{}, item];
    const restore = removeAt(list, 1); list.pop(); restore(); restore();
    expect(list).toEqual([item]); expect(list[0]).toBe(item);
    removeAt(list, -1)(); removeAt(list, 99)(); expect(list).toHaveLength(1);
  });
  it("does not clobber recreated map keys", () => {
    const original = {}; const newer = {}; const map = { key: original };
    const restore = removeKey(map, "key"); map.key = newer; restore();
    expect(map.key).toBe(newer);
    const undo = removeKey(map, "key"); undo(); undo(); expect(map.key).toBe(newer);
    removeKey(map, "missing")(); expect(Object.keys(map)).toEqual(["key"]);
  });
  it("restores into edited map lists and safely recreates empty keys", () => {
    const item = {}; const map: Record<string, object[]> = { key: [item] };
    const original = map.key; const undo = removeFromMapList(map, "key", 0);
    expect(map.key).toBeUndefined(); undo(); undo(); expect(map.key).toBe(original); expect(map.key[0]).toBe(item);
    const again = removeFromMapList(map, "key", 0); const edit = {}; map.key = [edit]; again();
    expect(map.key).toEqual([item, edit]);
    removeFromMapList(map, "key", 99)(); removeFromMapList(map, "missing", 0)();
    expect(map.key).toHaveLength(2);
  });
  it("offers one undo with keyboard ownership and cleanup", () => {
    vi.useFakeTimers(); const restore = vi.fn();
    const offer = offerUndo("Step removed", restore);
    const action = offer.toast?.querySelector("box-button");
    expect(action?.getAttribute("label")).toBe("Undo");
    expect(action?.getAttribute("tone")).toBe("neutral");
    expect(action?.getAttribute("size")).toBe("small");
    expect(action?.getAttribute("aria-keyshortcuts")).toMatch(/(?:Meta|Control)\+Z/);
    const input = document.createElement("input"); document.body.append(input);
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true, composed: true }));
    expect(restore).not.toHaveBeenCalled();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, cancelable: true }));
    expect(restore).toHaveBeenCalledOnce(); expect(offer.toast?.isConnected).toBe(false);
    offer.undo(); expect(restore).toHaveBeenCalledOnce();
  });
  it("expires and replaces offers without leaking shortcuts", () => {
    vi.useFakeTimers(); const old = vi.fn(); const current = vi.fn();
    const first = offerUndo("Removed", old); const second = offerUndo("Removed again", current);
    expect(first.toast?.isConnected).toBe(false);
    vi.advanceTimersByTime(8000);
    second.undo(); document.dispatchEvent(new KeyboardEvent("keydown", { key: "z", metaKey: true }));
    expect(old).not.toHaveBeenCalled(); expect(current).not.toHaveBeenCalled();
  });
});
