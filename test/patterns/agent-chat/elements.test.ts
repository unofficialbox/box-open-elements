import { afterEach, describe, expect, it, vi } from "vitest";

import { AgentChat } from "../../../src/patterns/agent-chat/agent-chat.js";
import type {
  AgentChatTransport,
  AgentSendRequest,
} from "../../../src/patterns/agent-chat/types.js";

AgentChat.register();

const flush = async (): Promise<void> => {
  await Promise.resolve();
  await new Promise(resolve => setTimeout(resolve, 0));
};

const createTransport = (
  overrides: Partial<AgentChatTransport> = {},
  extras: (request: AgentSendRequest) => void = () => {},
): AgentChatTransport => ({
  sendMessage: vi.fn(async (request: AgentSendRequest) => {
    request.onEvent({ kind: "delta", text: "Clause 4.2 raises the cap to 2x." });
    extras(request);
    await Promise.resolve();
  }),
  ...overrides,
});

const mount = async (
  transport: AgentChatTransport,
  configure?: (element: AgentChat) => void,
): Promise<AgentChat> => {
  const element = document.createElement("box-agent-chat") as AgentChat;
  element.transport = transport;
  element.token = "token";
  element.agentName = "Box AI";
  configure?.(element);
  document.body.append(element);
  await flush();
  return element;
};

const shadow = (element: AgentChat, selector: string): HTMLElement | null =>
  element.shadowRoot?.querySelector(selector) as HTMLElement | null;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("box-agent-chat", () => {
  it("renders the user turn and the streamed agent reply", async () => {
    const element = await mount(createTransport());

    await element.send("What changed?");
    await flush();

    const messages = Array.from(element.shadowRoot?.querySelectorAll('[part="message"]') ?? []);
    expect(messages.map(message => message.getAttribute("data-role"))).toEqual(["user", "agent"]);
    expect(messages[1]?.textContent).toContain("Clause 4.2 raises the cap to 2x.");
    expect(messages[1]?.getAttribute("data-status")).toBe("complete");
    expect(messages[1]?.textContent).toContain("Box AI");
  });

  it("sends the composer contents and clears the input", async () => {
    const transport = createTransport();
    const element = await mount(transport);

    const input = shadow(element, '[part="input"]') as HTMLTextAreaElement;
    input.value = "Summarize the redline";
    input.dispatchEvent(new Event("input"));
    (shadow(element, '[part="send"]') as HTMLButtonElement).click();
    await flush();

    expect(transport.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ body: "Summarize the redline", token: "token" }),
    );
    expect(input.value).toBe("");
  });

  it("keeps the composer intact while a reply streams", async () => {
    let release: (() => void) | null = null;
    const transport: AgentChatTransport = {
      sendMessage: (request: AgentSendRequest) =>
        new Promise<void>(resolve => {
          request.onEvent({ kind: "delta", text: "Thinking" });
          release = resolve;
        }),
    };
    const element = await mount(transport);
    const input = shadow(element, '[part="input"]') as HTMLTextAreaElement;

    const pending = element.send("Start");
    await flush();
    // The reader types a follow-up while the reply streams.
    input.value = "draft follow-up";
    input.dispatchEvent(new Event("input"));

    const streamingMessage = shadow(element, '[part="message"][data-status="streaming"]');
    expect(streamingMessage?.textContent).toContain("Thinking");
    expect(shadow(element, '[part="stop"]')?.hidden).toBe(false);
    // The same node survived the stream patch, so typing was not disturbed.
    expect(shadow(element, '[part="input"]')).toBe(input);
    expect(input.value).toBe("draft follow-up");

    release?.();
    await pending;
    await flush();
    expect(shadow(element, '[part="stop"]')?.hidden).toBe(true);
  });

  it("reconciles the thread in place so streaming deltas do not replace messages", async () => {
    let emit: ((text: string) => void) | null = null;
    let release: (() => void) | null = null;
    const transport: AgentChatTransport = {
      sendMessage: (request: AgentSendRequest) =>
        new Promise<void>(resolve => {
          emit = text => request.onEvent({ kind: "delta", text });
          release = resolve;
          request.onEvent({ kind: "delta", text: "One" });
        }),
    };
    const element = await mount(transport);

    const pending = element.send("stream");
    await flush();
    const userNode = element.shadowRoot?.querySelector('[part="message"][data-role="user"]');
    const agentNode = element.shadowRoot?.querySelector('[part="message"][data-role="agent"]');
    const bodyNode = agentNode?.querySelector('[part="body"]');

    emit?.(" two");
    emit?.(" three");
    await flush();

    // Same nodes across deltas: role="log" sees no additions, so assistive
    // tech does not re-announce the conversation token by token.
    expect(element.shadowRoot?.querySelector('[part="message"][data-role="user"]')).toBe(userNode);
    expect(element.shadowRoot?.querySelector('[part="message"][data-role="agent"]')).toBe(agentNode);
    expect(agentNode?.querySelector('[part="body"]')).toBe(bodyNode);
    expect(bodyNode?.textContent).toContain("One two three");
    // The streaming caret survives the text patch.
    expect(agentNode?.querySelector('[part="caret"]')).not.toBeNull();

    release?.();
    await pending;
    await flush();
    expect(agentNode?.getAttribute("data-status")).toBe("complete");
    expect(agentNode?.querySelector('[part="caret"]')).toBeNull();
  });

  it("keeps the conversation when only the agent-name label changes", async () => {
    const element = await mount(createTransport());
    await element.send("hello");
    await flush();
    const before = element.chatController;

    element.agentName = "Contract Copilot";
    await flush();

    // A display label must not discard the session or its messages.
    expect(element.chatController).toBe(before);
    expect(element.shadowRoot?.querySelectorAll('[part="message"]')).toHaveLength(2);
    expect(element.chatController?.getState().messages).toHaveLength(2);
  });

  it("keeps typed text when the send is refused", async () => {
    const element = document.createElement("box-agent-chat") as AgentChat;
    document.body.append(element);
    await flush();

    const input = element.shadowRoot?.querySelector('[part="input"]') as HTMLTextAreaElement;
    input.value = "no session yet";
    input.dispatchEvent(new Event("input"));
    await element.send();

    // No transport/token means no controller — the typing must survive.
    expect(input.value).toBe("no session yet");
  });

  it("emits citation-selected and downgrades unsafe hrefs to buttons", async () => {
    const element = await mount(
      createTransport({}, request => {
        request.onEvent({
          kind: "citation",
          citation: { id: "c1", label: "MSA_Acme §4.2", href: "https://example.com/doc" },
        });
        request.onEvent({
          kind: "citation",
          citation: { id: "c2", label: "Hostile", href: "javascript:alert(1)" },
        });
      }),
    );
    const selected = vi.fn();
    element.addEventListener("citation-selected", selected);
    // The safe citation is a real link; stop jsdom from attempting navigation.
    element.addEventListener("click", event => event.preventDefault());

    await element.send("cite it");
    await flush();

    const citations = Array.from(element.shadowRoot?.querySelectorAll('[part="citation"]') ?? []);
    expect(citations[0]?.tagName).toBe("A");
    expect(citations[1]?.tagName).toBe("BUTTON");

    (citations[0] as HTMLElement).click();
    expect(selected.mock.calls[0]?.[0]?.detail.citation.id).toBe("c1");
  });

  it("renders HITL cards only when the transport can resolve them", async () => {
    const withProposal = (request: AgentSendRequest): void => {
      request.onEvent({
        kind: "proposal",
        proposal: {
          id: "p1",
          title: "Apply standard liability clause",
          summary: "Replaces the negotiated 2x cap.",
          params: [{ label: "Clause", value: "4.2" }],
        },
      });
    };

    const readOnly = await mount(createTransport({}, withProposal));
    await readOnly.send("propose");
    await flush();
    expect(readOnly.shadowRoot?.querySelector('[part="proposal"]')).not.toBeNull();
    expect(readOnly.shadowRoot?.querySelectorAll('[part="proposal-action"]')).toHaveLength(0);
    document.body.innerHTML = "";

    const resolveAction = vi
      .fn()
      .mockResolvedValue({ id: "p1", title: "Apply standard liability clause", decision: "approved" });
    const element = await mount(createTransport({ resolveAction }, withProposal));
    await element.send("propose");
    await flush();

    expect(element.shadowRoot?.querySelectorAll('[part="proposal-action"]')).toHaveLength(3);
    expect(element.shadowRoot?.querySelector('[part="proposal"]')?.textContent).toContain("4.2");

    (shadow(element, '[part="proposal-action"][data-action="approve"]') as HTMLButtonElement).click();
    await flush();

    expect(resolveAction).toHaveBeenCalledWith(
      expect.objectContaining({ proposalId: "p1", decision: "approved" }),
    );
    const card = shadow(element, '[part="proposal"]');
    expect(card?.getAttribute("data-decision")).toBe("approved");
    // A decided proposal drops its action row.
    expect(element.shadowRoot?.querySelectorAll('[part="proposal-action"]')).toHaveLength(0);
  });

  it("surfaces Modify as intent for the host's own editor", async () => {
    const element = await mount(
      createTransport({ resolveAction: vi.fn() }, request => {
        request.onEvent({ kind: "proposal", proposal: { id: "p9", title: "Redline §7" } });
      }),
    );
    const modifyRequested = vi.fn();
    element.addEventListener("proposal-modify-requested", modifyRequested);

    await element.send("propose");
    await flush();
    (shadow(element, '[part="proposal-action"][data-action="modify"]') as HTMLButtonElement).click();

    expect(modifyRequested.mock.calls[0]?.[0]?.detail.proposalId).toBe("p9");
  });

  it("renders a failed reply as an alert", async () => {
    const element = await mount({
      sendMessage: () => Promise.reject(new Error("model unavailable")),
    });

    await element.send("hello");
    await flush();

    const error = shadow(element, '[part="error"]');
    expect(error?.getAttribute("role")).toBe("alert");
    expect(error?.textContent).toBe("model unavailable");
  });

  it("escapes hostile wire content in bodies, citations, and proposals", async () => {
    const element = await mount(
      createTransport({ resolveAction: vi.fn() }, request => {
        request.onEvent({ kind: "delta", text: '<img data-pwn src=x>' });
        request.onEvent({
          kind: "citation",
          citation: { id: '"><b data-pwn>', label: '<script data-pwn>alert(1)</script>' },
        });
        request.onEvent({
          kind: "proposal",
          proposal: { id: "p1", title: '"><img data-pwn src=x>', decision: '"><i data-pwn>' as never },
        });
      }),
    );

    await element.send("hostile");
    await flush();

    expect(element.shadowRoot?.querySelector("[data-pwn]")).toBeNull();
    // The agent bubble carries the hostile text as literal, escaped content.
    const agentBody = shadow(element, '[part="message"][data-role="agent"] [part="body"]');
    expect(agentBody?.textContent).toContain("<img data-pwn src=x>");
    expect(shadow(element, '[part="citation"]')?.textContent).toBe(
      "<script data-pwn>alert(1)</script>",
    );
    expect(shadow(element, '[part="proposal-title"]')?.textContent).toBe('"><img data-pwn src=x>');
  });

  it("falls back to its owned session when a shared controller is cleared", async () => {
    const sharedTransport = createTransport();
    const shared = new (await import("../../../src/patterns/agent-chat/controller.js")).AgentChatController(
      { token: "token", transport: sharedTransport },
    );
    shared.connect();

    const ownTransport = createTransport();
    const element = await mount(ownTransport, el => {
      el.chatController = shared;
    });
    expect(element.chatController).toBe(shared);

    element.chatController = null;
    await flush();

    expect(element.chatController).not.toBeNull();
    expect(element.chatController).not.toBe(shared);
    // Clearing must not destroy the shared session it never owned.
    expect(shared.getState().connected).toBe(true);
  });
});
