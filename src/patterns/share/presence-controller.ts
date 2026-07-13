import { Controller, type Unsubscribe } from "../../core/index.js";
import type { PresenceState, PresenceTransport, PresenceUser } from "./presence-contracts.js";

export interface PresenceControllerConfig {
  transport: PresenceTransport;
  initialUsers?: PresenceUser[];
}

type PresenceEvents = {
  presenceChanged: { users: PresenceUser[] };
  connected: undefined;
  disconnected: undefined;
};

/**
 * Headless controller for a live presence feed. `connect` opens the transport
 * subscription and mirrors every roster update into state, emitting
 * `presenceChanged`; `disconnect` tears the subscription down. It owns the
 * subscription lifecycle so the presentation layer (e.g. `box-presence`) only
 * has to render `users` and re-render on the event.
 */
export class PresenceController extends Controller<PresenceState, PresenceEvents> {
  private readonly config: PresenceControllerConfig;
  private unsubscribe: Unsubscribe | null = null;

  constructor(config: PresenceControllerConfig) {
    super({ connected: false, users: config.initialUsers ?? [] });
    this.config = config;
  }

  get users(): PresenceUser[] {
    return this.state.users;
  }

  get connected(): boolean {
    return this.state.connected;
  }

  connect(): void {
    if (this.state.connected) {
      return;
    }

    this.unsubscribe = this.config.transport.subscribe(users => {
      this.setState({ ...this.state, users });
      this.emit("presenceChanged", { users });
    });
    this.setState({ ...this.state, connected: true });
    this.emit("connected", undefined);
  }

  disconnect(): void {
    if (!this.state.connected) {
      return;
    }

    this.unsubscribe?.();
    this.unsubscribe = null;
    this.setState({ ...this.state, connected: false });
    this.emit("disconnected", undefined);
  }

  destroy(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    super.destroy();
  }
}
