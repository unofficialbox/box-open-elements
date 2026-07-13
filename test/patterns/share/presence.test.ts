// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BoxPresenceElement, defineBoxPresenceElement } from "../../../src/patterns/share/presence.js";
import type { PresenceTransport, PresenceUser } from "../../../src/patterns/share/presence-contracts.js";

type MockTransport = PresenceTransport & {
  push: (users: PresenceUser[]) => void;
  subscribeCount: number;
  unsubscribeCount: number;
  activeListeners: number;
};

const createMockTransport = (): MockTransport => {
  let listener: ((users: PresenceUser[]) => void) | null = null;
  const transport: MockTransport = {
    subscribeCount: 0,
    unsubscribeCount: 0,
    activeListeners: 0,
    push(users) {
      listener?.(users);
    },
    subscribe(next) {
      transport.subscribeCount += 1;
      transport.activeListeners += 1;
      listener = next;
      return () => {
        // Only the current subscription's teardown adjusts the counters; a stale
        // unsubscribe (from a prior cycle) must be a no-op.
        if (listener === next) {
          listener = null;
          transport.unsubscribeCount += 1;
          transport.activeListeners -= 1;
        }
      };
    },
  };
  return transport;
};

describe("BoxPresenceElement", () => {
  beforeEach(() => {
    defineBoxPresenceElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders static users as an avatar pile with a live summary", () => {
    const element = document.createElement("box-presence") as BoxPresenceElement;
    element.users = [
      { id: "1", name: "Morgan Lee", activity: "editing" },
      { id: "2", name: "Alex Kim", activity: "viewing" },
    ];
    document.body.append(element);

    const group = element.shadowRoot?.querySelector('[part="presence"]');
    expect(group?.getAttribute("role")).toBe("group");
    expect(element.shadowRoot?.querySelectorAll('[part="avatar"]').length).toBe(2);
    const summary = element.shadowRoot?.querySelector('[part="summary"]');
    expect(summary?.getAttribute("aria-live")).toBe("polite");
    expect(summary?.textContent).toContain("2 people here");
    expect(summary?.textContent).toContain("1 editing");
  });

  it("exposes each avatar's name and activity to assistive tech", () => {
    const element = document.createElement("box-presence") as BoxPresenceElement;
    element.users = [
      { id: "1", name: "Morgan Lee", activity: "editing" },
      { id: "2", name: "Alex Kim", activity: "viewing" },
    ];
    document.body.append(element);

    const avatars = element.shadowRoot?.querySelectorAll('[part="avatar"]');
    expect(avatars?.[0].getAttribute("role")).toBe("img");
    expect(avatars?.[0].getAttribute("aria-label")).toBe("Morgan Lee, editing");
    expect(avatars?.[1].getAttribute("aria-label")).toBe("Alex Kim, viewing");
  });

  it("shows an empty summary when no one is present", () => {
    const element = document.createElement("box-presence") as BoxPresenceElement;
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="avatar"]')).toBeNull();
    expect(element.shadowRoot?.querySelector('[part="summary"]')?.textContent).toContain("No one else here");
  });

  it("caps avatars at max and shows a +N overflow", () => {
    const element = document.createElement("box-presence") as BoxPresenceElement;
    element.max = 2;
    element.users = [
      { id: "1", name: "Morgan Lee" },
      { id: "2", name: "Alex Kim" },
      { id: "3", name: "Sam Patel" },
    ];
    document.body.append(element);

    expect(element.shadowRoot?.querySelectorAll('[part="avatar"]').length).toBe(2);
    expect(element.shadowRoot?.querySelector('[part="overflow"]')?.textContent).toContain("+1");
  });

  it("connects a controller from a transport and re-renders on live updates", () => {
    const transport = createMockTransport();
    const element = document.createElement("box-presence") as BoxPresenceElement;
    element.transport = transport;
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="summary"]')?.textContent).toContain("No one else here");

    transport.push([
      { id: "1", name: "Morgan Lee" },
      { id: "2", name: "Alex Kim" },
    ]);

    expect(element.shadowRoot?.querySelectorAll('[part="avatar"]').length).toBe(2);
    expect(element.shadowRoot?.querySelector('[part="summary"]')?.textContent).toContain("2 people here");
    expect(element.users.map(user => user.id)).toEqual(["1", "2"]);
  });

  it("keeps the live-region summary node stable across roster updates", () => {
    const transport = createMockTransport();
    const element = document.createElement("box-presence") as BoxPresenceElement;
    element.transport = transport;
    document.body.append(element);

    const before = element.shadowRoot?.querySelector('[part="summary"]');
    transport.push([{ id: "1", name: "Morgan Lee" }]);
    const after = element.shadowRoot?.querySelector('[part="summary"]');

    // Same node, only its text changed — so aria-live announces the update.
    expect(after).toBe(before);
    expect(after?.textContent).toContain("1 person here");
  });

  it("does not subscribe until inserted and cleans up exactly once on removal", () => {
    const transport = createMockTransport();
    const element = document.createElement("box-presence") as BoxPresenceElement;
    element.transport = transport;

    // Assigned while detached: no subscription yet.
    expect(transport.subscribeCount).toBe(0);
    expect(transport.activeListeners).toBe(0);

    document.body.append(element);
    expect(transport.subscribeCount).toBe(1);
    expect(transport.activeListeners).toBe(1);

    element.remove();
    expect(transport.unsubscribeCount).toBe(1);
    expect(transport.activeListeners).toBe(0);

    // Reattaching resubscribes exactly once — no duplicate/leaked subscriptions.
    document.body.append(element);
    expect(transport.subscribeCount).toBe(2);
    expect(transport.activeListeners).toBe(1);

    element.remove();
    expect(transport.unsubscribeCount).toBe(2);
    expect(transport.activeListeners).toBe(0);
  });

  it("preserves the last roster across detach and reattach", () => {
    const transport = createMockTransport();
    const element = document.createElement("box-presence") as BoxPresenceElement;
    element.transport = transport;
    document.body.append(element);

    transport.push([
      { id: "1", name: "Morgan Lee" },
      { id: "2", name: "Alex Kim" },
    ]);
    expect(element.shadowRoot?.querySelectorAll('[part="avatar"]').length).toBe(2);

    element.remove();
    document.body.append(element);

    // The last roster renders immediately, before the transport pushes again.
    expect(element.shadowRoot?.querySelectorAll('[part="avatar"]').length).toBe(2);
    expect(element.shadowRoot?.querySelector('[part="summary"]')?.textContent).toContain("2 people here");

    // Live updates still flow after the reconnect.
    transport.push([{ id: "1", name: "Morgan Lee" }]);
    expect(element.shadowRoot?.querySelectorAll('[part="avatar"]').length).toBe(1);
  });
});
