import type { CallConsoleTransport } from "./controller.js";
import type { CallEntry, CallEvent } from "./types.js";
/** Optional browser adapter for the documented snapshot/SSE/DELETE contract. */
export function createCallConsoleTransport(base = "/calls"): CallConsoleTransport {
  return {
    async snapshot(signal) { const response = await fetch(base, {signal}); if (!response.ok) throw new Error(String(response.status)); return await response.json() as CallEntry[]; },
    subscribe(onEvent, onConnection) {
      const events = new EventSource(`${base}/stream`);
      events.onopen = () => onConnection("live"); events.onerror = () => onConnection("reconnecting");
      for (const type of ["snapshot", "call", "clear"] as const) events.addEventListener(type, event => {
        try {
          const data = JSON.parse((event as MessageEvent).data) as CallEvent;
          if (data.type === type) onEvent(data);
        } catch { onConnection("reconnecting"); }
      });
      return () => events.close();
    },
    async clear() { const response = await fetch(base, {method: "DELETE"}); if (!response.ok) throw new Error(String(response.status)); },
  };
}
