// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { PresenceController } from "../../src/patterns/share/presence-controller.js";
import type { PresenceUser } from "../../src/patterns/share/presence-contracts.js";
import { Preview } from "../../src/patterns/preview/preview-element.js";
import { createContentPreviewAdapter } from "../../src/patterns/preview/content-preview-adapter.js";

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); });
const roster = (id: string): PresenceUser[] => [{ id, name: id }];
describe("Presence subscription ownership", () => {
  it("ignores queued old callbacks after reconnect while delivering the current roster", async () => {
    const callbacks: Array<(users: PresenceUser[]) => void> = [];
    const close = vi.fn();
    const c = new PresenceController({ transport: { subscribe: fn => { callbacks.push(fn); return close; } } });
    const changed = vi.fn(); c.subscribe("presenceChanged", changed);
    c.connect(); callbacks[0]!(roster("A"));
    queueMicrotask(() => callbacks[0]!(roster("stale A")));
    c.disconnect(); c.connect(); callbacks[1]!(roster("B")); await Promise.resolve();
    expect(c.users).toEqual(roster("B")); expect(changed).toHaveBeenCalledTimes(2);
    expect(close).toHaveBeenCalledTimes(1); expect(c.connected).toBe(true);
    c.destroy();
  });
  it.each(["disconnect", "destroy"] as const)("fences callbacks invoked by %s cleanup and afterwards", stop => {
    let callback!: (users: PresenceUser[]) => void;
    const close = vi.fn(() => callback(roster("cleanup")));
    const c = new PresenceController({ transport: { subscribe: fn => { callback = fn; return close; } } });
    c.connect(); callback(roster("current")); const changed = vi.fn(); c.subscribe("presenceChanged", changed);
    c[stop](); callback(roster("late"));
    expect(c.users).toEqual(roster("current")); expect(changed).not.toHaveBeenCalled();
    expect(c.connected).toBe(false); expect(close).toHaveBeenCalledTimes(1);
    c.destroy(); expect(close).toHaveBeenCalledTimes(1);
  });
  it("accepts synchronous initial rosters and subscribes once per connection", () => {
    const subscribe = vi.fn((fn: (users: PresenceUser[]) => void) => { fn(roster("sync")); return () => {}; });
    const c = new PresenceController({ transport: { subscribe } }); const changed = vi.fn(); c.subscribe("presenceChanged", changed);
    c.connect(); c.connect(); expect(subscribe).toHaveBeenCalledTimes(1); expect(c.users).toEqual(roster("sync"));
    expect(changed).toHaveBeenCalledExactlyOnceWith({ users: roster("sync") }); c.destroy();
  });
});

describe("Preview adapter identity and actual adapter lifecycle", () => {
  it("preserves viewer, value, focus and subscription across the same adapter echo and heading updates", () => {
    let input!: HTMLInputElement;
    const createViewer = vi.fn((node: HTMLElement) => { input = document.createElement("input"); input.value = "Engine state"; node.append(input); return () => input.remove(); });
    const onUnmount = vi.fn();
    const adapter = createContentPreviewAdapter({ createViewer, onUnmount }); const subscribe = vi.spyOn(adapter, "subscribe");
    const el = new Preview(); el.providerAdapter = adapter; document.body.append(el); input.focus(); const original = input;
    el.providerAdapter = adapter; el.heading = "Current heading";
    expect(createViewer).toHaveBeenCalledTimes(1); expect(onUnmount).not.toHaveBeenCalled(); expect(subscribe).toHaveBeenCalledTimes(1);
    expect(input).toBe(original); expect(el.shadowRoot!.activeElement).toBe(original); expect(original.value).toBe("Engine state");
    adapter.setState({ status: "ready", page: 2, pageCount: 3 }); expect(el.shadowRoot!.textContent).toContain("Current heading");
    expect(adapter.getMountedContainer()?.contains(original)).toBe(true);
  });
  it("unmounts exactly once on actual replacement/null and mounts again after detach/reconnect", () => {
    const cleanupA = vi.fn(), cleanupB = vi.fn();
    const a = createContentPreviewAdapter({ createViewer: () => cleanupA });
    const mountB = vi.fn(() => cleanupB); const b = createContentPreviewAdapter({ createViewer: mountB });
    const el = new Preview(); el.providerAdapter = a; document.body.append(el); const node = a.getMountedContainer();
    el.providerAdapter = b; expect(cleanupA).toHaveBeenCalledTimes(1); expect(a.getMountedContainer()).toBeNull();
    expect(b.getMountedContainer()).toBe(node); expect(mountB).toHaveBeenCalledTimes(1);
    el.remove(); expect(cleanupB).toHaveBeenCalledTimes(1); expect(b.getState()).toMatchObject({ ready: false, status: "idle" });
    // Assigning the same object while detached must still permit a real remount on connect.
    el.providerAdapter = b; document.body.append(el); expect(mountB).toHaveBeenCalledTimes(2);
    expect(b.getState()).toMatchObject({ ready: true, status: "ready" });
    el.providerAdapter = null; el.providerAdapter = null; expect(cleanupB).toHaveBeenCalledTimes(2);
    expect(el.shadowRoot!.querySelector<HTMLElement>('[part="stage-mount"]')!.hidden).toBe(true);
  });
  it("keeps host-owned adapter subscriptions alive when a preview element detaches", () => {
    const adapter = createContentPreviewAdapter(); const host = vi.fn(); const stop = adapter.subscribe!(host);
    const el = new Preview(); el.providerAdapter = adapter; document.body.append(el); el.remove(); host.mockClear();
    adapter.setState({ status: "loading" }); expect(host).toHaveBeenCalledTimes(1);
    stop();
  });
});
