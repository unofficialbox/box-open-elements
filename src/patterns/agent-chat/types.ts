export type AgentRole = "user" | "agent";

export type AgentMessageStatus = "streaming" | "complete" | "error";

/** Same shape as the timeline's evidence chips — deep-linkable supporting content. */
export interface AgentCitation {
  id: string;
  label: string;
  /** Optional deep link; the shell always emits `citation-selected` either way. */
  href?: string;
}

export type AgentActionDecision = "approved" | "rejected";

/**
 * A human-in-the-loop proposal: the agent wants to take a governed action
 * and the card renders the review inline — the CLM "human-governed AI
 * recommendations" requirement, delivered where the conversation happens.
 */
export interface AgentActionProposal {
  id: string;
  /** Short imperative title: "Apply standard liability clause". */
  title: string;
  summary?: string;
  /** Reviewable parameters rendered on the card. */
  params?: Array<{ label: string; value: string }>;
  /** Present once a decision has landed. */
  decision?: AgentActionDecision;
  note?: string;
}

export interface AgentChatMessage {
  id: string;
  role: AgentRole;
  body: string;
  status: AgentMessageStatus;
  actor?: { name: string; initials?: string };
  timestamp?: string;
  citations: AgentCitation[];
  proposals: AgentActionProposal[];
  /** Human-readable failure detail when `status` is "error". */
  errorMessage?: string;
}

/** Typed stream events a transport delivers while a reply generates. */
export type AgentStreamEvent =
  | { kind: "delta"; text: string }
  | { kind: "citation"; citation: AgentCitation }
  | { kind: "proposal"; proposal: AgentActionProposal };

export interface AgentSendRequest {
  body: string;
  token: string;
  signal?: AbortSignal;
  /** Called for each stream event; the returned promise settles when the reply ends. */
  onEvent: (event: AgentStreamEvent) => void;
}

export interface AgentResolveActionRequest {
  proposalId: string;
  decision: AgentActionDecision;
  note?: string;
  token: string;
}

/**
 * One narrow contract for the conversation. `sendMessage` streams a reply
 * through `onEvent` and settles when generation ends (an abort via `signal`
 * settles early with whatever streamed). `resolveAction` is an optional
 * capability: the shell only renders Approve/Reject when the transport
 * provides it, and invoking it on the controller without the capability
 * throws a descriptive error (a programming error, not a runtime state).
 */
export interface AgentChatTransport {
  sendMessage(request: AgentSendRequest): Promise<void>;
  resolveAction?(request: AgentResolveActionRequest): Promise<AgentActionProposal>;
}

export interface AgentChatSessionConfig {
  token: string;
  transport: AgentChatTransport;
  /** Display name for agent bubbles; defaults to "Agent". */
  agentName?: string;
}

export interface AgentChatState {
  connected: boolean;
  streaming: boolean;
  messages: AgentChatMessage[];
  error: string | null;
}

export interface AgentChatEvents {
  connected: undefined;
  disconnected: undefined;
  messagesChanged: { messages: AgentChatMessage[] };
  streamingChanged: { streaming: boolean };
  sendFailed: { message: string };
  actionResolved: { proposal: AgentActionProposal; decision: AgentActionDecision };
}
