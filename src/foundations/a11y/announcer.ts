export type Politeness = "polite" | "assertive";

type Channel = { region: HTMLElement; queue: string[]; timer?: ReturnType<typeof setTimeout> };
type Announcer = { host: HTMLElement; channels: Record<Politeness, Channel>; dispose: () => void };
const instances = new WeakMap<Document, Announcer>();

/** Install once near application startup. The returned cleanup removes both regions. SSR-safe. */
export function installAnnouncer(doc: Document | undefined = globalThis.document): () => void {
  if (!doc?.body) return () => {};
  const existing = instances.get(doc);
  if (existing?.host.isConnected) return existing.dispose;
  existing?.dispose();
  const host = doc.createElement("div");
  host.dataset.boeAnnouncer = "";
  host.style.cssText = "position:fixed;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0;pointer-events:none";
  const makeChannel = (politeness: Politeness): Channel => {
    const region = doc.createElement("div");
    region.setAttribute("role", politeness === "assertive" ? "alert" : "status");
    region.setAttribute("aria-live", politeness);
    region.setAttribute("aria-atomic", "true");
    host.append(region);
    return { region, queue: [] };
  };
  const channels = { polite: makeChannel("polite"), assertive: makeChannel("assertive") };
  const dispose = () => {
    for (const channel of Object.values(channels)) clearTimeout(channel.timer);
    host.remove();
    if (instances.get(doc)?.host === host) instances.delete(doc);
  };
  doc.body.append(host);
  instances.set(doc, { host, channels, dispose });
  return dispose;
}

/** Queue text, including repeated messages, into an already-mounted live region. */
export function announce(message: string, politeness: Politeness = "polite", doc: Document | undefined = globalThis.document): void {
  if (!doc?.body || !message.trim()) return;
  installAnnouncer(doc);
  const channel = instances.get(doc)!.channels[politeness];
  channel.queue.push(message);
  if (channel.timer !== undefined) return;
  const next = () => {
    channel.region.textContent = "";
    // A separate rendering opportunity ensures an empty region exists first.
    channel.timer = setTimeout(() => {
      channel.region.textContent = channel.queue.shift() ?? "";
      channel.timer = setTimeout(() => {
        channel.timer = undefined;
        if (channel.queue.length) next();
      }, 100);
    }, 20);
  };
  next();
}

/** Coalesce synchronous property updates and avoid duplicate component announcements. */
export class FeedbackAnnouncement {
  private previous = "";
  private revision = 0;

  update(host: HTMLElement, message: string, politeness: Politeness): void {
    const revision = ++this.revision;
    if (!message) { this.previous = ""; return; }
    queueMicrotask(() => {
      const key = `${politeness}:${message}`;
      if (revision !== this.revision || !host.isConnected || key === this.previous) return;
      this.previous = key;
      announce(message, politeness, host.ownerDocument);
    });
  }

  reset(): void { ++this.revision; this.previous = ""; }
}
