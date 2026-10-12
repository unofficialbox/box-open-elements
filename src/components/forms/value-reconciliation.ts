/** Internal focused-value contract shared by native-backed form controls. */
export class ValueReconciliation {
  private reflecting = 0;
  private emitting = 0;
  private authoritative = false;
  private readonly nativeInputs = new Set<Event>();

  /** Keep the original event scoped through composed host listeners and nested inputs. */
  trackNativeInput(event: Event): void {
    this.pruneNativeInputs();
    this.nativeInputs.add(event);
  }

  private pruneNativeInputs(): void {
    // Dispatch resets eventPhase to NONE synchronously; a later host write is
    // authoritative even before the next microtask runs.
    for (const event of this.nativeInputs) {
      if (event.eventPhase === 0) this.nativeInputs.delete(event);
    }
  }

  /** A host write wins even when its value is unchanged, except an input echo. */
  hostWrite(unchanged: boolean): void {
    this.pruneNativeInputs();
    const inputEcho = unchanged && (this.emitting > 0 || this.nativeInputs.size > 0);
    if (!this.reflecting && !inputEcho) this.authoritative = true;
  }

  reflect(action: () => void): void {
    this.reflecting++;
    try { action(); } finally { this.reflecting--; }
  }

  emit(action: () => boolean): boolean {
    this.emitting++;
    try { return action(); } finally { this.emitting--; }
  }

  shouldSync(focused: boolean): boolean {
    return this.authoritative || !focused;
  }

  complete(): void {
    this.authoritative = false;
  }
}
