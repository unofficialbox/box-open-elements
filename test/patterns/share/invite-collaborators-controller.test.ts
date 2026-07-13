import { describe, expect, it, vi } from "vitest";

import { InviteCollaboratorsController } from "../../../src/patterns/share/invite-collaborators-controller.js";
import type {
  InviteCollaboratorsInput,
  InviteCollaboratorsTransport,
  InviteResult,
} from "../../../src/patterns/share/invite-collaborators-contracts.js";

const createTransport = (
  impl?: (input: InviteCollaboratorsInput) => Promise<InviteResult>,
): InviteCollaboratorsTransport & { sendInvites: ReturnType<typeof vi.fn> } => ({
  sendInvites: vi.fn(impl ?? (async () => ({ invited: [] }))),
});

describe("InviteCollaboratorsController", () => {
  it("adds valid, lower-cased, de-duplicated emails and rejects invalid input", () => {
    const controller = new InviteCollaboratorsController({ itemId: "1", transport: createTransport() });

    expect(controller.addRecipient("Morgan@Box.com")).toBe(true);
    expect(controller.recipients).toEqual(["morgan@box.com"]);
    expect(controller.addRecipient("morgan@box.com")).toBe(false);
    expect(controller.addRecipient("not-an-email")).toBe(false);
    expect(controller.recipients).toEqual(["morgan@box.com"]);
  });

  it("removes a recipient", () => {
    const controller = new InviteCollaboratorsController({ itemId: "1", transport: createTransport() });
    controller.addRecipient("a@box.com");
    controller.addRecipient("b@box.com");

    controller.removeRecipient("a@box.com");
    expect(controller.recipients).toEqual(["b@box.com"]);
  });

  it("emits stateChanged on updates", () => {
    const controller = new InviteCollaboratorsController({ itemId: "1", transport: createTransport() });
    const onChange = vi.fn();
    controller.subscribe("stateChanged", onChange);

    controller.addRecipient("a@box.com");
    expect(onChange).toHaveBeenCalledWith({ state: expect.objectContaining({ recipients: ["a@box.com"] }) });
  });

  it("submits recipients through the transport and emits submitted", async () => {
    const transport = createTransport(async () => ({ invited: ["a@box.com"] }));
    const controller = new InviteCollaboratorsController({ itemId: "42", transport, role: "editor" });
    controller.addRecipient("a@box.com");
    controller.setMessage("Join us");
    const onSubmitted = vi.fn();
    controller.subscribe("submitted", onSubmitted);

    const ok = await controller.submit();

    expect(ok).toBe(true);
    expect(transport.sendInvites).toHaveBeenCalledWith({
      itemId: "42",
      recipients: ["a@box.com"],
      role: "editor",
      message: "Join us",
    });
    expect(controller.getState().status).toBe("success");
    expect(onSubmitted).toHaveBeenCalledWith({ result: { invited: ["a@box.com"] } });
  });

  it("does not submit without recipients", async () => {
    const transport = createTransport();
    const controller = new InviteCollaboratorsController({ itemId: "1", transport });

    expect(await controller.submit()).toBe(false);
    expect(transport.sendInvites).not.toHaveBeenCalled();
  });

  it("surfaces transport errors as error state + event", async () => {
    const transport = createTransport(async () => {
      throw new Error("network down");
    });
    const controller = new InviteCollaboratorsController({ itemId: "1", transport });
    controller.addRecipient("a@box.com");
    const onError = vi.fn();
    controller.subscribe("error", onError);

    const ok = await controller.submit();

    expect(ok).toBe(false);
    expect(controller.getState().status).toBe("error");
    expect(controller.getState().error).toBe("network down");
    expect(onError).toHaveBeenCalledWith({ error: "network down" });
  });
});
