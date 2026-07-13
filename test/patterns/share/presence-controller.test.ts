import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PresenceController } from "../../../src/patterns/share/presence-controller.js";
import type { PresenceTransport, PresenceUser } from "../../../src/patterns/share/presence-contracts.js";

type MockTransport = PresenceTransport & {
  push: (users: PresenceUser[]) => void;
  unsubscribed: boolean;
};

const createMockTransport = (): MockTransport => {
  let listener: ((users: PresenceUser[]) => void) | null = null;
  const transport: MockTransport = {
    unsubscribed: false,
    push(users) {
      listener?.(users);
    },
    subscribe(next) {
      listener = next;
      return () => {
        listener = null;
        transport.unsubscribed = true;
      };
    },
  };
  return transport;
};

describe("PresenceController", () => {
  let transport: MockTransport;

  beforeEach(() => {
    transport = createMockTransport();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts disconnected with any initial users", () => {
    const controller = new PresenceController({
      transport,
      initialUsers: [{ id: "1", name: "Morgan Lee" }],
    });

    expect(controller.connected).toBe(false);
    expect(controller.users).toEqual([{ id: "1", name: "Morgan Lee" }]);
  });

  it("subscribes on connect and mirrors roster updates into state + events", () => {
    const controller = new PresenceController({ transport });
    const onChange = vi.fn();
    const onConnected = vi.fn();
    controller.subscribe("presenceChanged", onChange);
    controller.subscribe("connected", onConnected);

    controller.connect();
    expect(controller.connected).toBe(true);
    expect(onConnected).toHaveBeenCalledTimes(1);

    transport.push([{ id: "1", name: "Morgan Lee", activity: "editing" }]);
    expect(controller.users).toEqual([{ id: "1", name: "Morgan Lee", activity: "editing" }]);
    expect(onChange).toHaveBeenCalledWith({ users: [{ id: "1", name: "Morgan Lee", activity: "editing" }] });
  });

  it("does not double-subscribe when connect is called twice", () => {
    const controller = new PresenceController({ transport });
    const subscribeSpy = vi.spyOn(transport, "subscribe");

    controller.connect();
    controller.connect();

    expect(subscribeSpy).toHaveBeenCalledTimes(1);
  });

  it("unsubscribes and emits disconnected on disconnect", () => {
    const controller = new PresenceController({ transport });
    const onDisconnected = vi.fn();
    controller.subscribe("disconnected", onDisconnected);

    controller.connect();
    controller.disconnect();

    expect(controller.connected).toBe(false);
    expect(transport.unsubscribed).toBe(true);
    expect(onDisconnected).toHaveBeenCalledTimes(1);

    // Updates after disconnect no longer reach state.
    transport.push([{ id: "9", name: "Late Arrival" }]);
    expect(controller.users).toEqual([]);
  });

  it("tears down the subscription on destroy", () => {
    const controller = new PresenceController({ transport });
    controller.connect();
    controller.destroy();

    expect(transport.unsubscribed).toBe(true);
  });
});
