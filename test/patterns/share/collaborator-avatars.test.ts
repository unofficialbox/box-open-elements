// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxCollaboratorAvatarsElement,
  defineBoxCollaboratorAvatarsElement,
} from "../../../src/patterns/share/collaborator-avatars.js";

const people = [
  { id: "1", name: "Morgan Lee" },
  { id: "2", name: "Alex Kim" },
  { id: "3", name: "Sam Patel" },
  { id: "4", name: "Jordan Rivera" },
  { id: "5", name: "Robin Cho" },
];

const create = (max?: number): BoxCollaboratorAvatarsElement => {
  const element = document.createElement("box-collaborator-avatars") as BoxCollaboratorAvatarsElement;
  element.collaborators = people;
  if (max !== undefined) {
    element.max = max;
  }
  document.body.append(element);
  return element;
};

describe("BoxCollaboratorAvatarsElement", () => {
  beforeEach(() => {
    defineBoxCollaboratorAvatarsElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a labelled group with initials avatars", () => {
    const element = create();

    const group = element.shadowRoot?.querySelector('[part="group"]');
    expect(group?.getAttribute("role")).toBe("group");
    expect(group?.getAttribute("aria-label")).toBe("Collaborators");
    const avatars = element.shadowRoot?.querySelectorAll('[part="avatar"]');
    expect(avatars?.length).toBe(5);
    expect(avatars?.[0].textContent?.trim()).toBe("ML");
    expect(avatars?.[0].getAttribute("aria-label")).toBe("Morgan Lee");
  });

  it("uses explicitly supplied initials over the derived ones", () => {
    const element = document.createElement("box-collaborator-avatars") as BoxCollaboratorAvatarsElement;
    element.collaborators = [{ id: "1", name: "Morgan Lee", initials: "MX" }];
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="avatar"]')?.textContent?.trim()).toBe("MX");
  });

  it("uses a supplied label as the group accessible name", () => {
    const element = document.createElement("box-collaborator-avatars") as BoxCollaboratorAvatarsElement;
    element.collaborators = people;
    element.label = "Shared with";
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="group"]')?.getAttribute("aria-label")).toBe("Shared with");
  });

  it("caps visible avatars at max and shows a +N overflow chip", () => {
    const element = create(3);

    expect(element.shadowRoot?.querySelectorAll('[part="avatar"]').length).toBe(3);
    const overflow = element.shadowRoot?.querySelector('[part="overflow"]');
    expect(overflow?.textContent?.trim()).toBe("+2");
    expect(overflow?.getAttribute("aria-label")).toBe("2 more");
  });

  it("renders an image avatar when src is provided", () => {
    const element = document.createElement("box-collaborator-avatars") as BoxCollaboratorAvatarsElement;
    element.collaborators = [{ id: "1", name: "Morgan Lee", src: "https://example.com/a.png" }];
    document.body.append(element);

    expect(element.shadowRoot?.querySelector('[part="avatar-image"]')).toBeTruthy();
  });

  it("emits select with the collaborator on avatar click", () => {
    const element = create();
    const onSelect = vi.fn();
    element.addEventListener("select", onSelect);

    (element.shadowRoot?.querySelectorAll('[part="avatar"]')[1] as HTMLButtonElement).click();

    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { id: "2", name: "Alex Kim" } }),
    );
  });

  it("emits overflow with the hidden count when the +N chip is clicked", () => {
    const element = create(2);
    const onOverflow = vi.fn();
    element.addEventListener("overflow", onOverflow);

    (element.shadowRoot?.querySelector('[part="overflow"]') as HTMLButtonElement).click();

    expect(onOverflow).toHaveBeenCalledWith(expect.objectContaining({ detail: { count: 3 } }));
  });

  it("keeps the labelled group and shows an empty affordance with no collaborators", () => {
    const element = document.createElement("box-collaborator-avatars") as BoxCollaboratorAvatarsElement;
    document.body.append(element);

    const group = element.shadowRoot?.querySelector('[part="group"]');
    expect(group?.getAttribute("role")).toBe("group");
    expect(group?.getAttribute("aria-label")).toBe("Collaborators");
    expect(element.shadowRoot?.querySelector('[part="empty"]')?.textContent).toContain("No collaborators");
  });

  it("drops malformed collaborator records", () => {
    const element = document.createElement("box-collaborator-avatars") as BoxCollaboratorAvatarsElement;
    element.setAttribute("collaborators", JSON.stringify([null, { name: "Morgan Lee" }, { id: 5 }]));
    document.body.append(element);

    const avatars = element.shadowRoot?.querySelectorAll('[part="avatar"]');
    expect(avatars?.length).toBe(1);
    expect(avatars?.[0].getAttribute("aria-label")).toBe("Morgan Lee");
  });
});
