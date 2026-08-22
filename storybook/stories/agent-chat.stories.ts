import type { StoryModule } from "../metadata.js";

const agentChat: StoryModule = {
  title: "Patterns/Agent Chat/Agent Chat",
  meta: {
    id: "agent-chat",
    tag: "box-agent-chat",
    shortDescription:
      "Streaming agent conversation with citation chips and human-in-the-loop action cards.",
    docsDescription:
      "The AI surface shaped as a workflow pattern rather than a widget. AgentChatTransport is one narrow contract: sendMessage streams typed AgentStreamEvents (delta / citation / proposal) through an onEvent channel and settles when generation ends, so any backend is interchangeable; resolveAction is an optional capability. The controller folds the stream into one growing message — stop() aborts a generation and keeps the partial reply, because a stop is not a failure. Two details carry most of the value: the composer lives outside the patched thread region, so a streaming reply never disturbs what the reader is typing, and the thread follows the stream only when they are already at the bottom. Citation chips reuse the timeline's evidence contract, including its unsafe-href downgrade; action cards render Approve/Reject only when the transport can resolve them, with Modify surfaced as intent for the host's own editor.",
    sourceSnippet: `<box-agent-chat heading="Contract assistant" agent-name="Box AI" token="…"></box-agent-chat>`,
    referenceRows: [
      { kind: "attribute", name: "heading", type: "string", description: "Panel heading." },
      { kind: "attribute", name: "agent-name", type: "string", description: "Display name on agent turns. Changing it re-renders without discarding the session." },
      { kind: "attribute", name: "placeholder", type: "string", description: "Composer placeholder." },
      { kind: "attribute", name: "token", type: "string", description: "Auth token passed to the transport. Changing it restarts the session." },
      { kind: "property", name: "transport", type: "AgentChatTransport", description: "sendMessage streams events; resolveAction is the optional HITL capability." },
      { kind: "property", name: "chatController", type: "AgentChatController", description: "Adopt an external session so several surfaces share one conversation." },
      { kind: "event", name: "citation-selected", description: "A citation chip was activated — deep-link into a preview." },
      { kind: "event", name: "action-resolved", description: "A proposal was approved or rejected through the transport." },
      { kind: "event", name: "proposal-modify-requested", description: "Modify was activated — the host opens its own editor." },
    ],
  },
  variants: [
    {
      name: "Streaming reply with citations and an action card",
      html: `<box-agent-chat heading="Contract assistant" agent-name="Box AI" placeholder="Ask about MSA_Acme_v4…" token="demo-token"></box-agent-chat>`,
      note: "The reply streams a few words at a time, then attaches two citation chips and a human-in-the-loop proposal. Approve/Reject appear because this transport implements resolveAction.",
    },
  ],
};

export default agentChat;
