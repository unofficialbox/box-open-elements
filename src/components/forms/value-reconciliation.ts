/** Internal focused-value contract shared by native-backed form controls. */
export class ValueReconciliation {
  private reflecting = 0;
  private emitting = 0;
  private authoritative = false;

  /** A host write wins even when its value is unchanged, except an input echo. */
  hostWrite(unchanged: boolean): void {
    if (!this.reflecting && !(this.emitting && unchanged)) this.authoritative = true;
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
