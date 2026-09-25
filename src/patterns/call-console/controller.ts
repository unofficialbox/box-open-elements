import type { CallConnection, CallEntry, CallEvent } from "./types.js";
export interface CallConsoleTransport {
  snapshot(signal: AbortSignal): Promise<CallEntry[]>;
  subscribe(onEvent: (event: CallEvent) => void, onConnection: (state: CallConnection) => void): () => void;
  clear(): Promise<void>;
}
/** Transport injection keeps networking out of the component. */
export class CallConsoleController {
  entries: CallEntry[] = [];
  connection: CallConnection = "connecting";
  private listeners = new Set<() => void>();
  private abort?: AbortController;
  private close?: () => void;
  constructor(readonly transport: CallConsoleTransport, readonly maxEntries = 300) {}
  subscribe(fn: () => void): () => void {this.listeners.add(fn); return () => this.listeners.delete(fn);}
  private emit(): void {this.listeners.forEach(fn => fn());}
  apply(event: CallEvent): void {
    if (event.type === "snapshot") this.entries = event.entries.slice(0, this.maxEntries);
    else if (event.type === "clear") this.entries = [];
    else this.entries = (this.entries.some(e => e.id === event.entry.id) ? this.entries.map(e => e.id === event.entry.id ? event.entry : e) : [event.entry, ...this.entries]).slice(0, this.maxEntries);
    this.emit();
  }
  async connect(): Promise<void> {
    this.disconnect(); const abort = new AbortController(); this.abort = abort;
    this.connection = "connecting"; this.emit();
    try {
      const entries = await this.transport.snapshot(abort.signal);
      if (abort.signal.aborted) return;
      this.apply({type: "snapshot", entries});
      this.close = this.transport.subscribe(event => {if (!abort.signal.aborted) this.apply(event);}, state => {if (!abort.signal.aborted) {this.connection = state; this.emit();}});
    } catch (error) { if (!abort.signal.aborted) {this.connection = error instanceof Error && error.message === "404" ? "unavailable" : "reconnecting"; this.emit();} }
  }
  async clear(): Promise<void> { await this.transport.clear(); this.apply({type: "clear"}); }
  disconnect(): void {this.abort?.abort(); this.close?.(); this.close = undefined;}
  destroy(): void {this.disconnect(); this.listeners.clear();}
}
