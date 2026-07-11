import { TypedEventEmitter, type EventMap, type Unsubscribe } from "./event-emitter.js";

export abstract class Controller<TState, TEvents extends EventMap> {
  protected readonly events = new TypedEventEmitter<TEvents>();

  protected state: TState;

  protected constructor(initialState: TState) {
    this.state = initialState;
  }

  getState(): Readonly<TState> {
    return this.state;
  }

  subscribe<TKey extends keyof TEvents>(eventName: TKey, listener: (payload: TEvents[TKey]) => void): Unsubscribe {
    return this.events.on(eventName, listener);
  }

  protected setState(nextState: TState): void {
    this.state = nextState;
  }

  protected emit<TKey extends keyof TEvents>(eventName: TKey, payload: TEvents[TKey]): void {
    this.events.emit(eventName, payload);
  }

  destroy(): void {
    this.events.clear();
  }
}
