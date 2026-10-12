// @vitest-environment jsdom

import type { InviteCollaboratorsTransport, InviteResult } from "../../../src/patterns/share/invite-collaborators-contracts.js";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  InviteCollaboratorsModal,
} from "../../../src/patterns/share/invite-collaborators-modal.js";

const createTransport = () => ({
  sendInvites: vi.fn(async () => ({ invited: ["morgan@box.com"] })),
});

const openModal = (
  transport: InviteCollaboratorsTransport,
): InviteCollaboratorsModal => {
  const element = document.createElement("box-invite-collaborators-modal") as InviteCollaboratorsModal;
  element.transport = transport;
  element.itemId = "42";
  element.open = true;
  document.body.append(element);
  return element;
};

const addRecipient = (element: InviteCollaboratorsModal, email: string): void => {
  const input = element.shadowRoot?.querySelector('[part="recipient-input"]') as HTMLInputElement;
  input.value = email;
  input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
};

describe("InviteCollaboratorsModal", () => {
  beforeEach(() => {
    InviteCollaboratorsModal.register();
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

  it("includes brand focus-visible and interactive states for modal controls", () => {
    const element = openModal(createTransport());

    const styles = element.shadowRoot?.querySelector("style")?.textContent ?? "";
    expect(styles).toContain('[part="submit"]:focus-visible');
    expect(styles).toContain('[part="cancel"]:hover:not(:disabled)');
    expect(styles).toContain('[part="submit"]:active:not(:disabled)');
    expect(styles).toContain('[part="submit"]:disabled');
    expect(styles).toContain("--boe-token-surface-surface-brand");
  });
});


const deferredTransport = () => {
  let resolve!: (result: InviteResult) => void;
  let reject!: (error: Error) => void;
  return {
    sendInvites: vi.fn(() => new Promise<InviteResult>((yes, no) => { resolve = yes; reject = no; })),
    resolve: (result: InviteResult) => resolve(result),
    reject: (error: Error) => reject(error),
  };
};
const submitModal = (element: InviteCollaboratorsModal): Promise<void> =>
  (element as unknown as { submit(): Promise<void> }).submit();

describe("InviteCollaboratorsModal request ownership", () => {
  afterEach(() => { document.body.replaceChildren(); });

  it.each(["item", "transport", "detach", "reconnect", "cancel", "reopen"] as const)(
    "ignores stale success after %s and allows the replacement session to submit",
    async action => {
      const transport = deferredTransport();
      const element = openModal(transport);
      addRecipient(element, "audit@example.test");
      const submitted = vi.fn();
      element.addEventListener("submitted", submitted);
      const pending = submitModal(element);
      expect(transport.sendInvites).toHaveBeenCalledTimes(1);
      // Repeated submit during the same request is a no-op.
      await submitModal(element);
      expect(transport.sendInvites).toHaveBeenCalledTimes(1);

      if (action === "item") element.itemId = "B";
      if (action === "transport") element.transport = createTransport();
      if (action === "detach" || action === "reconnect") element.remove();
      if (action === "reconnect") document.body.append(element);
      if (action === "cancel" || action === "reopen") {
        (element.shadowRoot!.querySelector('[part="cancel"]') as HTMLButtonElement).click();
        if (action === "reopen") element.open = true;
      }
      const outside = document.createElement("button");
      document.body.append(outside);
      outside.focus();
      transport.resolve({ invited: ["audit@example.test"] });
      await expect(pending).resolves.toBeUndefined();
      expect(submitted).not.toHaveBeenCalled();
      expect(element.open).toBe(action !== "cancel");
      expect(document.activeElement).toBe(outside);

      if (action !== "detach" && action !== "cancel") {
        addRecipient(element, "new@example.test");
        const next = submitModal(element);
        if (action !== "transport") transport.resolve({ invited: ["new@example.test"] });
        await next;
        expect(submitted).toHaveBeenCalledTimes(1);
        expect(submitted.mock.calls[0]![0].detail.result).toEqual(
          { invited: [action === "transport" ? "morgan@box.com" : "new@example.test"] },
        );
        expect(element.open).toBe(false);
      }
    },
  );

  it.each(["item", "transport", "detach", "reopen"] as const)("ignores a stale failure after %s", async action => {
    const transport = deferredTransport();
    const element = openModal(transport);
    addRecipient(element, "audit@example.test");
    const pending = submitModal(element);
    if (action === "item") element.itemId = "B";
    if (action === "transport") element.transport = createTransport();
    if (action === "detach") element.remove();
    if (action === "reopen") { element.open = false; element.open = true; }
    transport.reject(new Error("old failure"));
    await pending;
    expect(element.open).toBe(true);
    expect((element.shadowRoot!.querySelector('[part="error"]') as HTMLElement).hidden).toBe(true);
  });

  it("preserves the request for same-value item/transport writes and unrelated updates", async () => {
    const transport = deferredTransport();
    const element = openModal(transport);
    addRecipient(element, "audit@example.test");
    const submitted = vi.fn();
    element.addEventListener("submitted", submitted);
    const pending = submitModal(element);
    element.itemId = element.itemId;
    element.transport = transport;
    element.setAttribute("open", "true");
    element.heading = "Still the same session";
    transport.resolve({ invited: ["audit@example.test"] });
    await pending;
    expect(submitted).toHaveBeenCalledTimes(1);
    expect(submitted.mock.calls[0]![0].detail.result).toEqual({ invited: ["audit@example.test"] });
    expect(element.open).toBe(false);
  });

  it("leaves a replacement opened by a submitted listener open", async () => {
    const element = openModal(createTransport());
    addRecipient(element, "audit@example.test");
    element.addEventListener("submitted", () => { element.itemId = "B"; element.open = true; });
    await submitModal(element);
    expect(element.itemId).toBe("B");
    expect(element.open).toBe(true);
  });

  it("permits retry after a live-session error", async () => {
    const transport = deferredTransport();
    const element = openModal(transport);
    addRecipient(element, "audit@example.test");
    const submitted = vi.fn();
    element.addEventListener("submitted", submitted);
    const first = submitModal(element);
    transport.reject(new Error("try again"));
    await first;
    expect(element.open).toBe(true);
    expect(element.shadowRoot!.querySelector('[part="error"]')!.textContent).toBe("try again");
    const second = submitModal(element);
    transport.resolve({ invited: ["audit@example.test"] });
    await second;
    expect(submitted).toHaveBeenCalledTimes(1);
    expect(element.open).toBe(false);
  });
});
