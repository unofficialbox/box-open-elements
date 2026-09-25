import { AgentChatController } from "../agent-chat/controller.js";
import type { AgentActionProposal, AgentCitation, AgentChatState } from "../agent-chat/types.js";
export interface WorkspaceChat { id: string; controller: AgentChatController; }
export interface WorkspaceSummary { id: string; title: string; status: string; }
export interface WorkspaceDetails { context?: Record<string, unknown>; approvals: {messageId: string; proposal: AgentActionProposal}[]; sources: AgentCitation[]; }
export const conversationTitle = (body: string, max = 48): string => {
  const text = body.trim().replace(/\s+/g, " ");
  if (text.length <= max) return text || "New chat";
  const cut = text.slice(0, max); const space = cut.lastIndexOf(" ");
  const end = space >= max / 2 ? cut.slice(0, space) : cut;
  return `${end.replace(/[\s,.;:!?-]+$/g, "")}…`;
};
export function conversationDetails(state: Readonly<AgentChatState>): WorkspaceDetails {
  const sources = new Map<string, AgentCitation>();
  const approvals: WorkspaceDetails["approvals"] = [];
  let context: Record<string, unknown> | undefined;
  for (const message of state.messages) {
    if (message.context) context = message.context;
    for (const citation of message.citations) if (!sources.has(citation.id)) sources.set(citation.id, citation);
    for (const block of message.blocks ?? []) if (block.type === "documents") for (const item of block.items) {
      if (!sources.has(item.id)) sources.set(item.id, {id: item.id, label: item.name, ...(item.href ? {href: item.href} : {})});
    }
    for (const proposal of message.proposals) approvals.push({messageId: message.id, proposal});
  }
  return { ...(context ? {context} : {}), approvals, sources: [...sources.values()] };
}
/** Owns independent sessions. Selecting a chat never disconnects another one. */
export class AgentWorkspaceController {
  readonly chats: WorkspaceChat[] = [];
  private readonly removed = new Map<string, { chat: WorkspaceChat; index: number }>();
  activeId: string | null = null;
  private seq = 0;
  private listeners = new Set<() => void>();
  private subscriptions: (() => void)[] = [];
  constructor(private readonly createSession: (id: string, seed?: unknown) => AgentChatController) {}
  subscribe(listener: () => void): () => void { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  private emit(): void { this.listeners.forEach(fn => fn()); }
  newChat(): WorkspaceChat {
    let chat = this.chats.find(c => c.controller.getState().messages.length === 0);
    if (!chat) {
      const id = `chat-${++this.seq}`;
      chat = {id, controller: this.createSession(id)};
      chat.controller.connect(); this.chats.push(chat);
      this.subscriptions.push(chat.controller.subscribe("messagesChanged", () => this.emit()), chat.controller.subscribe("streamingChanged", () => this.emit()));
    }
    this.select(chat.id); return chat;
  }
  select(id: string): void { if (!this.chats.some(c => c.id === id)) return; this.activeId = id; this.emit(); }
  /** Temporarily remove a conversation without destroying its stream or history. */
  remove(id: string): boolean {
    const index = this.chats.findIndex(chat => chat.id === id);
    if (index < 0) return false;
    const [chat] = this.chats.splice(index, 1);
    chat!.controller.stop();
    this.removed.set(id, { chat: chat!, index });
    if (this.activeId === id) this.activeId = this.chats[Math.min(index, this.chats.length - 1)]?.id ?? null;
    this.emit(); return true;
  }
  restore(id: string, seed?: unknown): WorkspaceChat | null {
    const removed = this.removed.get(id);
    if (this.chats.some(chat => chat.id === id)) return null;
    if (removed) {
      this.removed.delete(id);
      this.chats.splice(Math.min(removed.index, this.chats.length), 0, removed.chat);
      this.select(id); return removed.chat;
    }
    const chat = {id, controller: this.createSession(id, seed)};
    chat.controller.connect(); this.chats.push(chat);
    this.subscriptions.push(chat.controller.subscribe("messagesChanged", () => this.emit()), chat.controller.subscribe("streamingChanged", () => this.emit()));
    const match = /^chat-(\d+)$/.exec(id); if (match) this.seq = Math.max(this.seq, Number(match[1]));
    this.select(id); return chat;
  }
  removeChat(id: string): boolean { return this.remove(id); }
  restoreChat(id: string, seed?: unknown): boolean { return this.restore(id, seed) !== null; }
  get summaries(): WorkspaceSummary[] { return this.chats.map(c => {
    const state = c.controller.getState();
    return {id: c.id, title: conversationTitle(state.messages.find(m => m.role === "user")?.body ?? ""),
      status: state.messages.some(m => m.proposals.some(p => !p.decision)) ? "Needs your approval" : state.streaming ? "Working…" : ""};
  }); }
  get details(): WorkspaceDetails { const chat = this.chats.find(c => c.id === this.activeId); return chat ? conversationDetails(chat.controller.getState()) : {approvals: [], sources: []}; }
  destroy(): void { this.subscriptions.forEach(fn => fn()); this.subscriptions = []; [...this.chats, ...[...this.removed.values()].map(item => item.chat)].forEach(c => {c.controller.disconnect(); c.controller.destroy();}); this.removed.clear(); this.listeners.clear(); }
}
