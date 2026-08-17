import { describe, expect, it, vi } from "vitest";

import { AgentChatController } from "../../../src/patterns/agent-chat/controller.js";
import type {
  AgentChatTransport,
  AgentSendRequest,
} from "../../../src/patterns/agent-chat/types.js";

/** A transport that streams the given words as deltas, then settles. */
const streamingTransport = (
  words: string[],
  extras: (request: AgentSendRequest) => void = () => {},
): AgentChatTransport => ({
  sendMessage: vi.fn(async (request: AgentSendRequest) => {
    for (const word of words) {
      request.onEvent({ kind: "delta", text: word });
    }
    extras(request);
    await Promise.resolve();
  }),
});

const createController = (transport: AgentChatTransport): AgentChatController =>
  new AgentChatController({ token: "token", transport, agentName: "Box AI" });

describe("AgentChatController", () => {
  it("appends the user turn and folds deltas into one streaming reply", async () => {
    const controller = createController(streamingTransport(["Reviewing ", "clause 4.2."]));
    const streamingChanged = vi.fn();
    controller.subscribe("streamingChanged", streamingChanged);
    controller.connect();

    await controller.send("What changed?");

    const messages = controller.getState().messages;
    expect(messages.map(message => message.role)).toEqual(["user", "agent"]);
    expect(messages[0]?.body).toBe("What changed?");
    expect(messages[1]).toMatchObject({
      body: "Reviewing clause 4.2.",
      status: "complete",
      actor: { name: "Box AI" },
    });
    expect(controller.getState().streaming).toBe(false);
    expect(streamingChanged.mock.calls.map(call => call[0].streaming)).toEqual([true, false]);
  });

  it("collects citations and proposals from the stream", async () => {
    const transport = streamingTransport(["Here is the clause."], request => {
      request.onEvent({ kind: "citation", citation: { id: "c1", label: "MSA_Acme §4.2" } });
      request.onEvent({
        kind: "proposal",
        proposal: { id: "p1", title: "Apply standard liability clause", summary: "Replaces the 2x cap." },
      });
    });
    const controller = createController(transport);
    controller.connect();

    await controller.send("Fix the cap");

    const agent = controller.getState().messages[1]!;
    expect(agent.citations).toEqual([{ id: "c1", label: "MSA_Acme §4.2" }]);
    expect(agent.proposals[0]?.title).toBe("Apply standard liability clause");
  });

  it("ignores empty sends and sends while disconnected", async () => {
    const transport = streamingTransport(["hi"]);
    const controller = createController(transport);

    expect(await controller.send("hello")).toBeNull();
    controller.connect();
    expect(await controller.send("   ")).toBeNull();
    expect(transport.sendMessage).not.toHaveBeenCalled();
  });

  it("keeps the partial reply when a generation is stopped", async () => {
    let resolveSend: (() => void) | null = null;
    const transport: AgentChatTransport = {
      sendMessage: (request: AgentSendRequest) =>
        new Promise<void>((resolve, reject) => {
          request.onEvent({ kind: "delta", text: "Partial answer" });
          resolveSend = resolve;
          request.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    };
    const controller = createController(transport);
    controller.connect();

    const pending = controller.send("Summarize");
    controller.stop();
    await pending;
    resolveSend?.();

    const agent = controller.getState().messages[1]!;
    expect(agent.body).toBe("Partial answer");
    // A stop is not a failure.
    expect(agent.status).toBe("complete");
    expect(controller.getState().error).toBeNull();
    expect(controller.getState().streaming).toBe(false);
  });

  it("marks the reply as errored and emits sendFailed on transport failure", async () => {
    const controller = createController({
      sendMessage: () => Promise.reject(new Error("model unavailable")),
    });
    const failed = vi.fn();
    controller.subscribe("sendFailed", failed);
    controller.connect();

    await controller.send("Anything?");

    const agent = controller.getState().messages[1]!;
    expect(agent).toMatchObject({ status: "error", errorMessage: "model unavailable" });
    expect(failed).toHaveBeenCalledWith({ message: "model unavailable" });
    expect(controller.getState().streaming).toBe(false);
  });

  it("resolves a proposal through the transport capability", async () => {
    const resolveAction = vi
      .fn()
      .mockResolvedValue({ id: "p1", title: "Apply clause", decision: "approved" });
    const transport: AgentChatTransport = {
      ...streamingTransport(["ok"], request => {
        request.onEvent({ kind: "proposal", proposal: { id: "p1", title: "Apply clause" } });
      }),
      resolveAction,
    };
    const controller = createController(transport);
    const resolved = vi.fn();
    controller.subscribe("actionResolved", resolved);
    controller.connect();
    await controller.send("Fix it");

    const result = await controller.resolveAction("p1", "approved");

    expect(result?.decision).toBe("approved");
    expect(resolveAction).toHaveBeenCalledWith({
      proposalId: "p1",
      decision: "approved",
      token: "token",
    });
    expect(controller.getState().messages[1]?.proposals[0]?.decision).toBe("approved");
    expect(resolved.mock.calls[0]?.[0]?.decision).toBe("approved");

    // Already-decided proposals are not re-resolved.
    expect(await controller.resolveAction("p1", "rejected")).toBeNull();
    expect(resolveAction).toHaveBeenCalledTimes(1);
  });

  it("refuses proposal resolution without the transport capability", async () => {
    const controller = createController(streamingTransport(["ok"]));
    controller.connect();
    await controller.send("hi");

    await expect(controller.resolveAction("p1", "approved")).rejects.toThrow(
      "does not support resolveAction",
    );
  });

  it("does not let a superseded send clear the newer send's streaming flag", async () => {
    let releaseFirst: (() => void) | null = null;
    const transport: AgentChatTransport = {
      sendMessage: (request: AgentSendRequest) =>
        new Promise<void>(resolve => {
          if (!releaseFirst) {
            releaseFirst = resolve;
            request.signal?.addEventListener("abort", () => resolve());
            return;
          }
          request.onEvent({ kind: "delta", text: "second" });
          // Second send stays open so streaming must remain true.
        }),
    };
    const controller = createController(transport);
    controller.connect();

    const first = controller.send("one");
    const second = controller.send("two");
    await first;

    expect(controller.getState().streaming).toBe(true);
    void second;
  });

  it("disconnect resets the session", async () => {
    const controller = createController(streamingTransport(["hi"]));
    controller.connect();
    await controller.send("hello");

    controller.disconnect();

    expect(controller.getState()).toMatchObject({
      connected: false,
      streaming: false,
      messages: [],
      error: null,
    });
  });
});
