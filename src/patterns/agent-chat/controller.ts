import { Controller } from "../../core/controller.js";
import type {
  AgentActionDecision,
  AgentActionProposal,
  AgentChatEvents,
  AgentChatMessage,
  AgentChatSessionConfig,
  AgentChatState,
  AgentStreamEvent,
} from "./types.js";

const createInitialState = (): AgentChatState => ({
  connected: false,
  streaming: false,
  messages: [],
  error: null,
});

/**
 * Headless conversation session: sends turns through the streaming
 * `AgentChatTransport`, folds typed stream events (deltas, citations,
 * action proposals) into one growing agent message, supports stopping a
 * generation mid-stream (the partial reply is kept), and routes HITL
 * decisions through the transport's `resolveAction` capability.
 */
export class AgentChatController extends Controller<AgentChatState, AgentChatEvents> {
  readonly config: AgentChatSessionConfig;

  private sendCounter = 0;

  private activeAbortController: AbortController | null = null;

  constructor(config: AgentChatSessionConfig) {
    super(createInitialState());
    this.config = config;
  }

  connect(): void {
    if (this.state.connected) {
      return;
    }
    this.setState({ ...this.state, connected: true });
    this.emit("connected", undefined);
  }

  disconnect(): void {
    if (!this.state.connected) {
      return;
    }
    this.activeAbortController?.abort();
    this.activeAbortController = null;
    this.setState(createInitialState());
    this.emit("disconnected", undefined);
  }

  getMessage(messageId: string): AgentChatMessage | undefined {
    return this.state.messages.find(message => message.id === messageId);
  }

  /** Abort the in-flight generation; whatever already streamed is kept. */
  stop(): void {
    this.activeAbortController?.abort();
  }

  /**
   * Send a user turn and stream the agent's reply. One send at a time: a
   * new send while a reply is streaming stops the previous generation.
   */
  async send(body: string): Promise<AgentChatMessage | null> {
    const trimmed = body.trim();
    if (!this.state.connected || trimmed.length === 0) {
      return null;
    }

    this.activeAbortController?.abort();
    const abortController = typeof AbortController === "function" ? new AbortController() : null;
    this.activeAbortController = abortController;

    this.sendCounter += 1;
    const turn = this.sendCounter;
    const userMessage: AgentChatMessage = {
      id: `user-${String(turn)}`,
      role: "user",
      body: trimmed,
      status: "complete",
      citations: [],
      proposals: [],
    };
    const agentMessage: AgentChatMessage = {
      id: `agent-${String(turn)}`,
      role: "agent",
      body: "",
      status: "streaming",
      ...(this.config.agentName ? { actor: { name: this.config.agentName } } : {}),
      citations: [],
      proposals: [],
    };

    this.setState({
      ...this.state,
      streaming: true,
      error: null,
      messages: [...this.state.messages, userMessage, agentMessage],
    });
    this.emit("streamingChanged", { streaming: true });
    this.emit("messagesChanged", { messages: this.state.messages });

    const patchAgentMessage = (patch: Partial<AgentChatMessage>): void => {
      this.setState({
        ...this.state,
        messages: this.state.messages.map(message =>
          message.id === agentMessage.id ? { ...message, ...patch } : message,
        ),
      });
      this.emit("messagesChanged", { messages: this.state.messages });
    };

    const onEvent = (event: AgentStreamEvent): void => {
      const current = this.getMessage(agentMessage.id);
      if (!current || current.status !== "streaming") {
        return;
      }
      if (event.kind === "delta") {
        patchAgentMessage({ body: current.body + event.text });
      } else if (event.kind === "citation") {
        patchAgentMessage({ citations: [...current.citations, event.citation] });
      } else {
        patchAgentMessage({ proposals: [...current.proposals, event.proposal] });
      }
    };

    const finish = (patch: Partial<AgentChatMessage>): void => {
      patchAgentMessage(patch);
      // A superseded send must not clear the newer send's streaming flag.
      if (turn === this.sendCounter) {
        this.setState({ ...this.state, streaming: false });
        this.emit("streamingChanged", { streaming: false });
      }
    };

    try {
      await this.config.transport.sendMessage({
        body: trimmed,
        token: this.config.token,
        onEvent,
        ...(abortController ? { signal: abortController.signal } : {}),
      });
      finish({ status: "complete" });
    } catch (error) {
      if (abortController?.signal.aborted) {
        // A stop is not a failure: keep the partial reply.
        finish({ status: "complete" });
      } else {
        const message = error instanceof Error ? error.message : "The agent reply failed";
        finish({ status: "error", errorMessage: message });
        this.setState({ ...this.state, error: message });
        this.emit("sendFailed", { message });
      }
    } finally {
      if (this.activeAbortController === abortController) {
        this.activeAbortController = null;
      }
    }

    return this.getMessage(agentMessage.id) ?? null;
  }

  /** Resolve a HITL proposal through the transport capability. */
  async resolveAction(
    proposalId: string,
    decision: AgentActionDecision,
    note?: string,
  ): Promise<AgentActionProposal | null> {
    const resolveAction = this.config.transport.resolveAction;
    if (!resolveAction) {
      throw new Error("Agent-chat transport does not support resolveAction");
    }
    const holder = this.state.messages.find(message =>
      message.proposals.some(proposal => proposal.id === proposalId),
    );
    const pending = holder?.proposals.find(proposal => proposal.id === proposalId);
    if (!this.state.connected || !holder || !pending || pending.decision) {
      return null;
    }

    try {
      const resolved = await resolveAction({
        proposalId,
        decision,
        ...(note !== undefined ? { note } : {}),
        token: this.config.token,
      });
      this.setState({
        ...this.state,
        messages: this.state.messages.map(message =>
          message.id === holder.id
            ? {
                ...message,
                proposals: message.proposals.map(proposal =>
                  proposal.id === proposalId ? { ...proposal, ...resolved } : proposal,
                ),
              }
            : message,
        ),
      });
      this.emit("messagesChanged", { messages: this.state.messages });
      this.emit("actionResolved", { proposal: { ...pending, ...resolved }, decision });
      return { ...pending, ...resolved };
    } catch (error) {
      const message = error instanceof Error ? error.message : `Agent action ${decision} failed`;
      this.setState({ ...this.state, error: message });
      this.emit("sendFailed", { message });
      return null;
    }
  }
}
