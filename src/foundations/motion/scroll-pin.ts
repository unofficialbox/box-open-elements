export interface ScrollPinState { pinned: boolean; behind: boolean }

/** Scroll following is changed by user intent, never by resize-induced scroll events. */
export class ScrollPinController {
  pinned = true;
  behind = false;
  private cleanup: Array<() => void> = [];
  private observer?: ResizeObserver;
  private pointer = false;
  private lastTop = 0;
  private lastHeight = 0;
  private content: Element;
  private lastNotified?: ScrollPinState;
  private touchY = 0;
  constructor(private readonly viewport: HTMLElement, private readonly onChange: (state: ScrollPinState) => void = () => {}) {
    this.content = viewport;
  }
  connect(content: Element = this.viewport): void {
    this.disconnect();
    this.content = content;
    this.lastHeight = content.scrollHeight;
    this.lastTop = this.viewport.scrollTop;
    this.behind = false;
    this.lastNotified = undefined;
    const on = <K extends keyof HTMLElementEventMap>(kind: K, fn: (e: HTMLElementEventMap[K]) => void): void => {
      this.viewport.addEventListener(kind, fn); this.cleanup.push(() => this.viewport.removeEventListener(kind, fn));
    };
    on("wheel", e => { if (e.deltaY < 0) this.unpin(); });
    on("keydown", e => { if (["ArrowUp", "PageUp", "Home"].includes(e.key)) this.unpin(); });
    on("touchstart", e => { this.touchY = e.touches[0]?.clientY ?? 0; });
    on("touchmove", e => { const y = e.touches[0]?.clientY ?? this.touchY; if (y > this.touchY) this.unpin(); this.touchY = y; });
    on("pointerdown", e => {
      const bounds = this.viewport.getBoundingClientRect();
      const gutter = Math.max(0, bounds.width - this.viewport.clientWidth);
      this.pointer = gutter > 0 && (e.clientX < bounds.left + gutter || e.clientX > bounds.right - gutter);
      this.lastTop = this.viewport.scrollTop;
    });
    const release = (): void => { this.pointer = false; };
    this.viewport.ownerDocument.addEventListener("pointerup", release);
    this.cleanup.push(() => this.viewport.ownerDocument.removeEventListener("pointerup", release));
    this.viewport.ownerDocument.addEventListener("pointercancel", release);
    this.cleanup.push(() => this.viewport.ownerDocument.removeEventListener("pointercancel", release));
    on("scroll", () => {
      if (this.pointer && this.viewport.scrollTop < this.lastTop) this.unpin();
      this.lastTop = this.viewport.scrollTop;
      if (this.atBottom()) { this.pinned = true; this.behind = false; }
      this.notify();
    });
    if (typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(() => this.contentChanged());
      this.observer.observe(this.viewport); if (content !== this.viewport) this.observer.observe(content);
    }
  }
  atBottom(): boolean { return this.viewport.scrollHeight - this.viewport.clientHeight - this.viewport.scrollTop < 40; }
  private notify(): void {
    const state = { pinned: this.pinned, behind: this.behind };
    if (this.lastNotified?.pinned === state.pinned && this.lastNotified.behind === state.behind) return;
    this.lastNotified = state;
    this.onChange(state);
  }
  unpin(): void { this.pinned = false; this.notify(); }
  contentChanged(newMessage = false): void {
    const height = this.content.scrollHeight;
    if (newMessage) { this.pinned = true; this.behind = false; }
    else if (!this.pinned && height > this.lastHeight) this.behind = true;
    this.lastHeight = height;
    if (this.pinned) this.viewport.scrollTop = this.viewport.scrollHeight;
    this.notify();
  }
  jump(): void {
    this.pinned = true;
    this.behind = false;
    const reduced = this.viewport.ownerDocument.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    this.viewport.scrollTo?.({top: this.viewport.scrollHeight, behavior: reduced ? "instant" : "smooth"}); this.notify();
  }
  disconnect(): void { this.cleanup.forEach(fn => fn()); this.cleanup = []; this.observer?.disconnect(); }
}
