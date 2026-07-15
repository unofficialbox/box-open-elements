// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  BoxInviteCollaboratorsModalElement,
  defineBoxInviteCollaboratorsModalElement,
} from "../../../src/patterns/share/invite-collaborators-modal.js";

const createTransport = () => ({
  sendInvites: vi.fn(async () => ({ invited: ["morgan@box.com"] })),
});

const openModal = (
  transport: ReturnType<typeof createTransport>,
): BoxInviteCollaboratorsModalElement => {
  const element = document.createElement("box-invite-collaborators-modal") as BoxInviteCollaboratorsModalElement;
  element.transport = transport;
  element.itemId = "42";
  element.open = true;
  document.body.append(element);
  return element;
};

const addRecipient = (element: BoxInviteCollaboratorsModalElement, email: string): void => {
  const input = element.shadowRoot?.querySelector('[part="recipient-input"]') as HTMLInputElement;
  input.value = email;
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
};

describe("BoxInviteCollaboratorsModalElement", () => {
  beforeEach(() => {
    defineBoxInviteCollaboratorsModalElement();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders a modal dialog when open and nothing when closed", () => {
    const element = openModal(createTransport());

    const dialog = element.shadowRoot?.querySelector('[part="dialog"]');
    expect(dialog?.getAttribute("role")).toBe("dialog");
    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(element.shadowRoot?.querySelector('[part="title"]')?.textContent).toContain("Invite collaborators");

    element.open = false;
    expect(element.shadowRoot?.querySelector('[part="dialog"]')).toBeNull();
  });

  it("adds a validated recipient as a pill and clears the input", () => {
    const element = openModal(createTransport());

    addRecipient(element, "Morgan@Box.com");

    const pills = element.shadowRoot?.querySelectorAll('[part="pill"]');
    expect(pills?.length).toBe(1);
    expect(pills?.[0].textContent).toContain("morgan@box.com");
    expect((element.shadowRoot?.querySelector('[part="recipient-input"]') as HTMLInputElement).value).toBe("");
  });

  it("ignores an invalid email", () => {
    const element = openModal(createTransport());

    addRecipient(element, "not-an-email");

    expect(element.shadowRoot?.querySelectorAll('[part="pill"]').length).toBe(0);
  });

  it("removes a recipient via its pill button", () => {
    const element = openModal(createTransport());
    addRecipient(element, "morgan@box.com");

    (element.shadowRoot?.querySelector('[part="pill-remove"]') as HTMLButtonElement).click();

    expect(element.shadowRoot?.querySelectorAll('[part="pill"]').length).toBe(0);
  });

  it("keeps submit disabled until there is at least one recipient", () => {
    const element = openModal(createTransport());
    const submit = () => element.shadowRoot?.querySelector('[part="submit"]') as HTMLButtonElement;

    expect(submit().disabled).toBe(true);
    addRecipient(element, "morgan@box.com");
    expect(submit().disabled).toBe(false);
  });

  it("submits through the transport, emits submitted, and closes", async () => {
    const transport = createTransport();
    const element = openModal(transport);
    addRecipient(element, "morgan@box.com");

    const onSubmitted = vi.fn();
    element.addEventListener("submitted", onSubmitted);

    (element.shadowRoot?.querySelector('[part="submit"]') as HTMLButtonElement).click();

    await vi.waitFor(() => expect(onSubmitted).toHaveBeenCalled());
    expect(transport.sendInvites).toHaveBeenCalledWith(
      expect.objectContaining({ itemId: "42", recipients: ["morgan@box.com"] }),
    );
    expect(onSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({ detail: { result: { invited: ["morgan@box.com"] } } }),
    );
    expect(element.open).toBe(false);
  });

  it("emits cancel and closes when cancelled", () => {
    const element = openModal(createTransport());
    const onCancel = vi.fn();
    element.addEventListener("cancel", onCancel);

    (element.shadowRoot?.querySelector('[part="cancel"]') as HTMLButtonElement).click();

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(element.open).toBe(false);
  });

  it("regenerates role options when roles change after open", () => {
    const element = openModal(createTransport());
    const role = () => element.shadowRoot?.querySelector('[part="role"]') as HTMLSelectElement;

    expect([...role().options].map(option => option.value)).toEqual([
      "co-owner",
      "editor",
      "viewer",
    ]);

    element.roles = [
      { value: "uploader", label: "Uploader" },
      { value: "previewer", label: "Previewer" },
    ];

    expect([...role().options].map(option => option.value)).toEqual(["uploader", "previewer"]);
    expect(role().value).toBe("uploader");
  });
});
