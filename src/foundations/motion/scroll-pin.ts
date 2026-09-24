/** Scroll following is changed by user intent, never by resize-induced scroll events. */
export class ScrollPinController {
  pinned = true;
  private cleanup: Array<() => void> = [];
  private observer?: ResizeObserver;
  private pointer = false;
  private lastTop = 0;
  private touchY = 0;
  constructor(private readonly viewport: HTMLElement, private readonly onChange: (showJump: boolean) => void = () => {}) {}
  connect(content: Element = this.viewport): void {
    this.disconnect();
    const on = <K extends keyof HTMLElementEventMap>(kind: K, fn: (e: HTMLElementEventMap[K]) => void): void => {
      this.viewport.addEventListener(kind, fn); this.cleanup.push(() => this.viewport.removeEventListener(kind, fn));
    };
    on("wheel", e => { if (e.deltaY < 0) this.unpin(); });
    on("keydown", e => { if (["ArrowUp", "PageUp", "Home"].includes(e.key)) this.unpin(); });
    on("touchstart", e => { this.touchY = e.touches[0]?.clientY ?? 0; });
    on("touchmove", e => { const y = e.touches[0]?.clientY ?? this.touchY; if (y > this.touchY) this.unpin(); this.touchY = y; });
    on("pointerdown", () => { this.pointer = true; this.lastTop = this.viewport.scrollTop; });
    const release = (): void => { this.pointer = false; };
    this.viewport.ownerDocument.addEventListener("pointerup", release);
    this.cleanup.push(() => this.viewport.ownerDocument.removeEventListener("pointerup", release));
    on("scroll", () => {
      if (this.pointer && this.viewport.scrollTop < this.lastTop) this.unpin();
      this.lastTop = this.viewport.scrollTop;
      if (this.atBottom()) this.pinned = true;
      this.notify();
    });
    if (typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(() => this.contentChanged());
      this.observer.observe(this.viewport); if (content !== this.viewport) this.observer.observe(content);
    }
  }
  private atBottom(): boolean { return this.viewport.scrollHeight - this.viewport.clientHeight - this.viewport.scrollTop < 40; }
  private notify(): void { this.onChange(!this.pinned && !this.atBottom()); }
  unpin(): void { this.pinned = false; this.notify(); }
  contentChanged(newMessage = false): void { if (newMessage) this.pinned = true; if (this.pinned) this.viewport.scrollTop = this.viewport.scrollHeight; this.notify(); }
  jump(): void {
    this.pinned = true;
    const reduced = this.viewport.ownerDocument.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    this.viewport.scrollTo?.({top: this.viewport.scrollHeight, behavior: reduced ? "instant" : "smooth"}); this.onChange(false);
  }
  disconnect(): void { this.cleanup.forEach(fn => fn()); this.cleanup = []; this.observer?.disconnect(); }
}
