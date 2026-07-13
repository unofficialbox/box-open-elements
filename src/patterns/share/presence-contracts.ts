import type { Unsubscribe } from "../../core/index.js";

/**
 * One person currently present on an item. `activity` distinguishes passive
 * viewers from active editors; `initials`/`src` drive the avatar rendering.
 */
export interface PresenceUser {
  id: string;
  name: string;
  initials?: string;
  src?: string;
  activity?: "viewing" | "editing";
}

/** The controller's observable state: whether the live feed is connected and who is present. */
export interface PresenceState {
  connected: boolean;
  users: PresenceUser[];
}

/**
 * The live-presence data source. `subscribe` registers a listener for the
 * current roster and every subsequent change, returning an unsubscribe handle.
 * The workflow owns the subscription lifecycle; the transport owns delivery
 * (websocket, polling, SSE — the contract is neutral).
 */
export interface PresenceTransport {
  subscribe(listener: (users: PresenceUser[]) => void): Unsubscribe;
}
