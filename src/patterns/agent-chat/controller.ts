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
  private finishActive?: () => void;
  private readonly resolving = new Set<string>();

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
    this.stop();
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
    this.finishActive?.();
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

    this.stop();
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
      startedAt: Date.now(),
      blocks: [], trace: [], todos: [], options: [],
      completeness: { status: "streaming", missing: [] },
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

    const sequences = new Set<number>();
    let highSequence = 0;
    let done: "complete" | "needs_input" | "error" | undefined;
    const missing = (): number[] => Array.from({length: highSequence}, (_, i) => i + 1).filter(i => !sequences.has(i));
    const upsert = <T extends {id?: string}>(items: T[], item: T): T[] => item.id && items.some(i => i.id === item.id)
      ? items.map(i => i.id === item.id ? item : i) : [...items, item];
    const onEvent = (event: AgentStreamEvent): void => {
      const current = this.getMessage(agentMessage.id);
      if (!current || current.status !== "streaming" || abortController?.signal.aborted || turn !== this.sendCounter || done) {
        return;
      }
      if (event.seq !== undefined) {
        if (!Number.isSafeInteger(event.seq) || event.seq < 1 || event.seq > 100000) throw new Error("Invalid stream sequence");
        if (sequences.has(event.seq)) return;
        sequences.add(event.seq); highSequence = Math.max(highSequence, event.seq);
      }
      let patch: Partial<AgentChatMessage> = {};
      if (event.kind === "delta") {
        patch = { body: current.body + event.text };
      } else if (event.kind === "citation") {
        patch = { citations: upsert(current.citations, event.citation) };
      } else if (event.kind === "proposal") {
        patch = { proposals: upsert(current.proposals, event.proposal) };
      } else if (event.kind === "block") {
        patch = { blocks: upsert(current.blocks ?? [], event.block) };
      } else if (event.kind === "trace") {
        patch = { trace: upsert(current.trace ?? [], event.step) };
      } else if (event.kind === "todos") {
        patch = { todos: event.todos };
      } else if (event.kind === "options") {
        patch = { options: event.options };
      } else if (event.kind === "context") {
        patch = { context: event.context };
      } else if (event.kind === "done") {
        done = event.status;
      }
      patchAgentMessage({...patch, completeness: {status: "streaming", missing: missing()}});
    };

    let finished = false;
    const finish = (patch: Partial<AgentChatMessage>): void => {
      if (finished) return;
      finished = true;
      const gaps = missing();
      patchAgentMessage({...patch, endedAt: Date.now(), completeness: {
        status: patch.status === "error" ? "error" : !done || gaps.length ? "incomplete" : done,
        missing: gaps,
      }});
      // A superseded send must not clear the newer send's streaming flag.
      if (turn === this.sendCounter) {
        this.setState({ ...this.state, streaming: false });
        this.emit("streamingChanged", { streaming: false });
      }
    };
    this.finishActive = () => finish({status: "complete"});

    try {
      await this.config.transport.sendMessage({
        body: trimmed,
        messageId: agentMessage.id,
        token: this.config.token,
        onEvent,
        ...(abortController ? { signal: abortController.signal } : {}),
      });
      finish({ status: done === "error" ? "error" : "complete" });
    } catch (error) {
      if (abortController?.signal.aborted) {
        // A stop is not a failure: keep the partial reply.
        finish({ status: "complete" });
      } else {
        const message = error instanceof Error ? error.message : "The agent reply failed";
        finish({ status: "error", errorMessage: message });
        if (turn === this.sendCounter) {
          this.setState({ ...this.state, error: message });
          this.emit("sendFailed", { message });
        }
      }
    } finally {
      if (this.activeAbortController === abortController) {
        this.activeAbortController = null;
        this.finishActive = undefined;
      }
    }

    return this.getMessage(agentMessage.id) ?? null;
  }

  /** Resolve a HITL proposal through the transport capability. */
  async resolveAction(
    proposalId: string,
    decision: AgentActionDecision,
    note?: string,
    messageId?: string,
  ): Promise<AgentActionProposal | null> {
    const transport = this.config.transport;
    if (!transport.resolveAction) {
      throw new Error("Agent-chat transport does not support resolveAction");
    }
    const holder = this.state.messages.find(message => (!messageId || message.id === messageId) &&
      message.proposals.some(proposal => proposal.id === proposalId),
    );
    const pending = holder?.proposals.find(proposal => proposal.id === proposalId);
    const key = `${holder?.id}:${proposalId}`;
    if (!this.state.connected || !holder || !pending || pending.decision || this.resolving.has(key)) {
      return null;
    }
    const patch = (value: Partial<AgentActionProposal>): void => {
      this.setState({...this.state, messages: this.state.messages.map(m => m.id === holder.id ? {
        ...m, proposals: m.proposals.map(p => p.id === proposalId ? {...p, ...value} : p),
      } : m)});
      this.emit("messagesChanged", {messages: this.state.messages});
    };
    this.resolving.add(key);
    patch({resolving: decision});
    try {
      // Called on the transport so class-based implementations keep `this`.
      const response = await transport.resolveAction({
        proposalId,
        messageId: holder.id,
        decision,
        ...(note !== undefined ? { note } : {}),
        token: this.config.token,
      });
      const resolved = { ...pending, ...response, decision };
      delete resolved.resolving;
      this.setState({
        ...this.state,
        messages: this.state.messages.map(message =>
          message.id === holder.id
            ? {
                ...message,
                proposals: message.proposals.map(proposal =>
                  proposal.id === proposalId ? { ...pending, ...resolved, decision } : proposal,
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
    } finally {
      this.resolving.delete(key);
      const current = this.getMessage(holder.id)?.proposals.find(p => p.id === proposalId);
      if (current?.resolving) {
        const clean = {...current}; delete clean.resolving;
        this.setState({...this.state, messages: this.state.messages.map(m => m.id === holder.id ? {...m, proposals: m.proposals.map(p => p.id === proposalId ? clean : p)} : m)});
        this.emit("messagesChanged", {messages: this.state.messages});
      }
    }
  }
}
