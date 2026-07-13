// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { BoxPresenceElement, defineBoxPresenceElement } from "../../../src/patterns/share/presence.js";
import type { PresenceTransport, PresenceUser } from "../../../src/patterns/share/presence-contracts.js";

type MockTransport = PresenceTransport & { push: (users: PresenceUser[]) => void; unsubscribed: boolean };

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

    // No one yet.
    expect(element.shadowRoot?.querySelector('[part="summary"]')?.textContent).toContain("No one else here");

    transport.push([
      { id: "1", name: "Morgan Lee" },
      { id: "2", name: "Alex Kim" },
    ]);

    expect(element.shadowRoot?.querySelectorAll('[part="avatar"]').length).toBe(2);
    expect(element.shadowRoot?.querySelector('[part="summary"]')?.textContent).toContain("2 people here");
    expect(element.users.map(user => user.id)).toEqual(["1", "2"]);
  });

  it("tears down the transport subscription when removed from the DOM", () => {
    const transport = createMockTransport();
    const element = document.createElement("box-presence") as BoxPresenceElement;
    element.transport = transport;
    document.body.append(element);

    element.remove();

    expect(transport.unsubscribed).toBe(true);
  });
});
