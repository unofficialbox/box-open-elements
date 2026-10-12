// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContentExplorerController } from "../../src/patterns/content-explorer/controller.js";
import { ExplorerSelectionController } from "../../src/patterns/content-explorer/selection/controller.js";
import { ContentExplorer } from "../../src/patterns/content-explorer/content-explorer.js";
import { ContentPicker } from "../../src/patterns/content-picker/content-picker.js";
import { ExplorerList } from "../../src/patterns/content-explorer/adapters/list.js";
import { WorkQueueController } from "../../src/patterns/work-queue/controller.js";
import { CallConsoleController } from "../../src/patterns/call-console/controller.js";
import { CallConsole } from "../../src/patterns/call-console/call-console.js";
import type { ExplorerTransportResult } from "../../src/patterns/content-explorer/types.js";
import type { CallEntry } from "../../src/patterns/call-console/types.js";

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve(); };
const result: ExplorerTransportResult = {
  folderId: "R", folder: { id: "R", name: "Root", type: "folder" }, breadcrumbs: [],
  items: [{ id: "a", name: "Alpha", type: "file" }, { id: "b", name: "Beta", type: "file" }],
  pagination: { hasMoreItems: false, limit: 100, offset: 0, totalCount: 2 },
};
const item = { id: "w", title: "Synthetic", type: "review" as const, status: "open" as const };
const entry: CallEntry = { id: "c", service: "Box", method: "GET", url: "/synthetic", summary: "Synthetic", startedAt: 1, durationMs: 1, status: 200, pending: false, statusText: "OK", requestHeaders: {}, responseHeaders: {} };
afterEach(() => { document.body.replaceChildren(); });

describe("controlled selection echoes", () => {
  it.each(["facade", "primitive"])("suppresses normalized echoes in the %s", async kind => {
    const c = kind === "facade"
      ? new ContentExplorerController({ rootFolderId: "R", token: "synthetic", transport: { loadFolderItems: async () => result } })
      : new ExplorerSelectionController();
    if (c instanceof ContentExplorerController) await c.connect(); else c.setItems(result.items);
    const changes: string[][] = [];
    c.subscribe("selectionChanged", ({ selectedItemIds }) => {
      changes.push([...selectedItemIds]);
      // A controlled host echoes the current value, with an unavailable ID filtered out.
      if (changes.length < 8) c.select([...selectedItemIds, "missing"]);
    });
    c.select(["a"]);
    expect(changes).toEqual([["a"]]);
    c.toggleSelection("missing");
    c.select(["a"]);
    expect(changes).toHaveLength(1);
    c.clearSelection(); c.clearSelection();
    expect(changes).toEqual([["a"], []]);
    if (c instanceof ContentExplorerController) c.disconnect();
    c.destroy();
  });
  it("emits once when available items prune selection and respects single mode", () => {
    const c = new ExplorerSelectionController({ selectionMode: "single" });
    c.setItems(result.items); c.select(["a", "b"]);
    const changed = vi.fn(); c.subscribe("selectionChanged", changed);
    c.select(["a", "b"]); c.setItems(result.items);
    expect(changed).not.toHaveBeenCalled();
    c.setItems([result.items[1]!]);
    expect(changed).toHaveBeenCalledExactlyOnceWith({ selectedItemIds: [] });
  });
});

describe("work queue mutation session ownership", () => {
  it.each(["success", "failure"])("ignores old mutation %s after reconnect", async outcome => {
    const pending = deferred<typeof item>();
    const loadItems = vi.fn(async () => ({ items: [item] }));
    const c = new WorkQueueController({ token: "synthetic", transport: { loadItems, claimItem: () => pending.promise } });
    await c.connect();
    const mutated = vi.fn(), failed = vi.fn();
    c.subscribe("itemMutated", mutated); c.subscribe("mutationFailed", failed);
    const mutation = c.claimItem("w", "host");
    c.disconnect(); await c.connect();
    if (outcome === "success") pending.resolve(item); else pending.reject(new Error("old session failure"));
    expect(await mutation).toBeNull();
    expect(c.getState().error).toBeNull();
    expect(c.getState().items).toEqual([item]);
    expect(mutated).not.toHaveBeenCalled(); expect(failed).not.toHaveBeenCalled();
    expect(loadItems).toHaveBeenCalledTimes(2);
    c.disconnect();
  });
  it("keeps in-session mutations valid across a filter reload", async () => {
    const pending = deferred<typeof item>();
    const c = new WorkQueueController({ token: "synthetic", transport: { loadItems: async () => ({ items: [item] }), completeItem: () => pending.promise } });
    await c.connect(); const mutation = c.completeItem("w");
    await c.setFilters({ status: "open" });
    pending.resolve(item); expect(await mutation).toEqual(item);
    c.disconnect();
  });
});

describe("owned explorer teardown", () => {
  it.each([ContentExplorer, ContentPicker])("aborts owned loads on detach and replacement: %s", async Element => {
    const first = deferred<ExplorerTransportResult>();
    let signal: AbortSignal | undefined;
    const el = new Element(); el.token = "synthetic"; el.rootFolderId = "R";
    el.transport = { loadFolderItems: request => { signal = request.signal; return first.promise; } };
    document.body.append(el); await flush();
    const owned = el instanceof ContentPicker ? el.pickerController!.explorer : el.explorerController!;
    el.remove(); expect(signal?.aborted).toBe(true); expect(owned.getState().connected).toBe(false);
    el.transport = { loadFolderItems: async () => result };
    document.body.append(el); await flush();
    const replacement = el instanceof ContentPicker ? el.pickerController!.explorer : el.explorerController!;
    expect(replacement).not.toBe(owned); expect(replacement.getState().items).toEqual(result.items);
    first.resolve({ ...result, items: [{ id: "stale", name: "Stale", type: "file" }] }); await flush();
    expect(owned.getState().items).toEqual([]); expect(replacement.getState().items).toEqual(result.items);
    // Configuration replacement also tears down an owned session.
    el.rootFolderId = "next"; await flush(); expect(replacement.getState().connected).toBe(false);
  });
  it("leaves a host-owned controller connected when a shared adapter detaches", async () => {
    const c = new ContentExplorerController({ rootFolderId: "R", token: "synthetic", transport: { loadFolderItems: async () => result } });
    await c.connect(); const disconnect = vi.spyOn(c, "disconnect");
    const el = new ExplorerList(); el.controller = c; document.body.append(el); el.remove();
    expect(disconnect).not.toHaveBeenCalled(); expect(c.getState().connected).toBe(true);
    document.body.append(el); c.select(["a"]); expect(c.getState().selectedItemIds).toEqual(["a"]);
    c.disconnect(); c.destroy();
  });
});

describe("call console clear session ownership", () => {
  it.each(["swap-success", "swap-failure", "reconnect-success"])("ignores %s and permits current clear", async scenario => {
    const old = deferred<void>(), current = deferred<void>();
    let clearCount = 0;
    const a = new CallConsoleController({ snapshot: async () => [entry], subscribe: () => () => {}, clear: () => ++clearCount === 1 ? old.promise : current.promise });
    const b = new CallConsoleController({ snapshot: async () => [{ ...entry, id: "b" }], subscribe: () => () => {}, clear: () => current.promise });
    await a.connect(); await b.connect();
    const el = new CallConsole(); el.callController = a; document.body.append(el);
    const cleared = vi.fn(); el.addEventListener("calls-cleared", cleared);
    const click = () => el.shadowRoot!.querySelector<HTMLElement>("#clear")!.click();
    click();
    if (scenario.startsWith("swap")) el.callController = b; else { el.remove(); document.body.append(el); }
    click();
    if (scenario === "swap-failure") old.reject(new Error("old failure")); else old.resolve();
    await flush();
    expect(cleared).not.toHaveBeenCalled();
    expect(el.shadowRoot!.querySelector("#copy-status")!.textContent).not.toContain("Unable");
    expect(el.shadowRoot!.querySelector("#clear")!.hasAttribute("disabled")).toBe(true);
    if (scenario.startsWith("swap")) expect(b.entries).toHaveLength(1);
    current.resolve(); await flush(); expect(cleared).toHaveBeenCalledTimes(1);
    // The element only owns its subscription, not the host's controller connection.
    const disconnect = vi.spyOn(b, "disconnect"); el.remove(); expect(disconnect).not.toHaveBeenCalled();
    a.destroy(); b.destroy();
  });
});

describe("review: async completion boundaries", () => {
  it.each(["controller-reconnect", "element-remount"])("preserves the fresh snapshot after %s during an old clear", async scenario => {
    const pending = deferred<void>(); let snapshots = 0;
    const c = new CallConsoleController({ snapshot: async () => [{ ...entry, id: ++snapshots === 1 ? "old" : "fresh" }], subscribe: () => () => {}, clear: () => pending.promise });
    await c.connect(); const el = new CallConsole(); el.callController = c; document.body.append(el);
    const cleared = vi.fn(); el.addEventListener("calls-cleared", cleared);
    el.shadowRoot!.querySelector<HTMLElement>("#clear")!.click();
    if (scenario === "element-remount") { el.remove(); document.body.append(el); }
    await c.connect(); expect(c.entries.map(e => e.id)).toEqual(["fresh"]);
    pending.resolve(); await flush();
    expect(c.entries.map(e => e.id)).toEqual(["fresh"]); expect(cleared).not.toHaveBeenCalled();
    expect(el.shadowRoot!.querySelector("#copy-status")!.textContent).not.toContain("Unable"); c.destroy();
  });
  it("preserves a host-owned clear operation across element detach", async () => {
    const pending = deferred<void>();
    const c = new CallConsoleController({ snapshot: async () => [entry], subscribe: () => () => {}, clear: () => pending.promise });
    await c.connect(); const el = new CallConsole(); el.callController = c; document.body.append(el);
    el.shadowRoot!.querySelector<HTMLElement>("#clear")!.click(); el.remove(); document.body.append(el);
    const disconnect = vi.spyOn(c, "disconnect");
    pending.resolve(); await flush();
    expect(c.entries).toEqual([]); expect(disconnect).not.toHaveBeenCalled(); c.destroy();
  });
  it("does not reload a replacement WorkQueue session from a synchronous itemMutated listener", async () => {
    const nextLoad = deferred<{ items: typeof item[] }>(); let loads = 0; let signal: AbortSignal | undefined;
    const c = new WorkQueueController({ token: "synthetic", transport: { loadItems: request => { if (++loads === 1) return Promise.resolve({ items: [item] }); signal = request.signal; return nextLoad.promise; }, completeItem: async () => item } });
    await c.connect(); c.subscribe("itemMutated", () => { c.disconnect(); void c.connect(); });
    const mutation = c.completeItem("w"); await flush();
    expect(loads).toBe(2); expect(signal?.aborted).toBe(false);
    nextLoad.resolve({ items: [{ ...item, id: "fresh" }] }); expect(await mutation).toBeNull();
    expect(c.getState().items[0]!.id).toBe("fresh"); c.disconnect();
  });
  it("returns no obsolete mutation success when its reload finishes in a replacement session", async () => {
    const reload = deferred<{ items: typeof item[] }>(); let loads = 0;
    const c = new WorkQueueController({ token: "synthetic", transport: { loadItems: () => ++loads === 2 ? reload.promise : Promise.resolve({ items: [item] }), completeItem: async () => item } });
    await c.connect(); const mutation = c.completeItem("w"); await flush(); expect(loads).toBe(2);
    c.disconnect(); await c.connect(); reload.resolve({ items: [] });
    expect(await mutation).toBeNull(); expect(c.getState().items).toEqual([item]); c.disconnect();
  });
});
