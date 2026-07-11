export type Unsubscribe = () => void;

export type EventMap = object;

export class TypedEventEmitter<TEvents extends EventMap> {
  private listeners = new Map<keyof TEvents, Set<(payload: unknown) => void>>();

  on<TKey extends keyof TEvents>(eventName: TKey, listener: (payload: TEvents[TKey]) => void): Unsubscribe {
    const eventListeners = this.listeners.get(eventName) ?? new Set<(payload: unknown) => void>();
    eventListeners.add(listener as (payload: unknown) => void);
    this.listeners.set(eventName, eventListeners);

    return () => {
      this.off(eventName, listener);
    };
  }

  off<TKey extends keyof TEvents>(eventName: TKey, listener: (payload: TEvents[TKey]) => void): void {
    const eventListeners = this.listeners.get(eventName);
    if (!eventListeners) {
      return;
    }

    eventListeners.delete(listener as (payload: unknown) => void);

    if (eventListeners.size === 0) {
      this.listeners.delete(eventName);
    }
  }

  emit<TKey extends keyof TEvents>(eventName: TKey, payload: TEvents[TKey]): void {
    const eventListeners = this.listeners.get(eventName);
    if (!eventListeners) {
      return;
    }

    for (const listener of eventListeners) {
      listener(payload);
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
