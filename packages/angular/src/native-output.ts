import { EventEmitter, getDebugNode } from "@angular/core";

/** Internal relay for outputs that share the native event's name. */
export class NativeOutput<T> extends EventEmitter<T> {
  private nativeEmission = false;

  constructor(
    private host: (() => HTMLElement) | null,
    private readonly eventName: string,
  ) {
    super();
  }

  releaseHost(): void {
    this.host = null;
  }

  private withSource(native: boolean, emit: () => void): void {
    const previous = this.nativeEmission;
    this.nativeEmission = native;
    try {
      emit();
    } finally {
      this.nativeEmission = previous;
    }
  }

  override emit(value?: T): void {
    this.withSource(false, () => super.emit(value));
  }

  override next(value: T): void {
    this.withSource(false, () => super.next(value));
  }

  emitNative(value: T): void {
    this.withSource(true, () => super.emit(value));
  }

  override subscribe(
    observerOrNext?: any,
    error?: any,
    complete?: any,
  ): ReturnType<EventEmitter<T>["subscribe"]> {
    // Angular registers the native listener before subscribing that same
    // callback to the output. Public DOM listener metadata identifies that
    // route without suppressing native observers or comparing event payloads.
    const hasDomRoute = typeof observerOrNext === "function" &&
      typeof Node !== "undefined" && this.host &&
      getDebugNode(this.host())?.listeners.some(listener =>
        listener.name === this.eventName && listener.callback === observerOrNext,
      );
    if (hasDomRoute) {
      return super.subscribe((value: T) => {
        if (!this.nativeEmission) observerOrNext(value);
      }, error, complete);
    }
    return super.subscribe(observerOrNext, error, complete);
  }
}

export const emitNative = <T>(output: EventEmitter<T>, value: T): void => {
  // Preserve subclasses/hosts that replace an emitter with their own stream.
  if (output instanceof NativeOutput) output.emitNative(value);
  else output.emit(value);
};
