import { PresenceController } from "./presence-controller.js";
import type { PresenceTransport, PresenceUser } from "./presence-contracts.js";
import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-presence";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const initialsFromName = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(segment => segment[0] ?? "")
    .join("")
    .toUpperCase();

const summarize = (users: PresenceUser[]): string => {
  if (!users.length) {
    return "No one else here";
  }
  const editing = users.filter(user => user.activity === "editing").length;
  const people = users.length === 1 ? "1 person" : `${users.length} people`;
  return editing ? `${people} here · ${editing} editing` : `${people} here`;
};

/**
 * The live-presence surface: an avatar pile of who is currently on an item, kept
 * in sync with a live feed. Drive it either by setting a `transport` (the
 * element owns a `PresenceController`, connects it, and re-renders on every
 * update) or by injecting a static `users` array. A polite live region
 * announces roster changes. Pair the transport with your realtime backend.
 */
export class BoxPresenceElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["label", "max"];
  }

  private controller: PresenceController | null = null;
  private transportValue: PresenceTransport | null = null;
  private usersValue: PresenceUser[] = [];
  private controllerUnsubscribe: (() => void) | null = null;

  get transport(): PresenceTransport | null {
    return this.transportValue;
  }

  set transport(value: PresenceTransport | null) {
    if (this.transportValue === value) {
      return;
    }
    this.transportValue = value;
    this.startController();
  }

  get users(): PresenceUser[] {
    return this.controller ? this.controller.users : [...this.usersValue];
  }

  set users(value: PresenceUser[]) {
    this.usersValue = [...value];
    if (!this.controller && this.isRendered) {
      this.update();
    }
  }

  get label(): string {
    return this.getAttribute("label")?.trim() || "Presence";
  }

  set label(value: string) {
    this.setAttribute("label", value);
  }

  get max(): number {
    const raw = Number(this.getAttribute("max") ?? "5");
    if (!Number.isFinite(raw) || raw < 1) {
      return 5;
    }
    return Math.floor(raw);
  }

  set max(value: number) {
    this.setAttribute("max", String(value));
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.startController();
  }

  disconnectedCallback(): void {
    this.teardownController();
  }

  private refresh(): void {
    if (this.isRendered) {
      this.update();
    }
  }

  private startController(): void {
    this.teardownController();
    // Only open a subscription once the element is in the DOM, so setting a
    // transport before insertion (or on a never-inserted element) cannot leak.
    if (!this.isConnected || !this.transportValue) {
      this.refresh();
      return;
    }

    this.controller = new PresenceController({
      transport: this.transportValue,
      initialUsers: this.usersValue,
    });
    this.controllerUnsubscribe = this.controller.subscribe("presenceChanged", () => this.refresh());
    this.controller.connect();
    this.refresh();
  }

  private teardownController(): void {
    if (this.controller) {
      // Preserve the last live roster so a reconnect renders it immediately,
      // before the transport delivers its first update.
      this.usersValue = this.controller.users;
    }
    this.controllerUnsubscribe?.();
    this.controllerUnsubscribe = null;
    this.controller?.destroy();
    this.controller = null;
  }

  // Build the shadow structure once. Keeping the [part="summary"] aria-live node
  // stable across roster updates lets assistive tech announce the change rather
  // than treat the replaced node as fresh, static content.
  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          color: inherit;
          font: inherit;
          font-family: var(--boe-token-font-family-base, InterVariable, Inter, 'Helvetica Neue', Helvetica, Arial, sans-serif);
        }

        [part="presence"] {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
        }

        [part="stack"] {
          display: inline-flex;
          align-items: center;
        }

        [part="stack"][hidden] {
          display: none;
        }

        [part="avatar"],
        [part="overflow"] {
          position: relative;
          display: inline-grid;
          place-items: center;
          inline-size: 2rem;
          block-size: 2rem;
          margin-inline-start: -0.5rem;
          overflow: visible;
          border: 2px solid var(--boe-token-surface-surface, #ffffff);
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
          color: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 72%, var(--boe-token-text-text, #222222));
          font-size: 0.76rem;
          font-weight: 700;
        }

        [part="stack"] > :first-child {
          margin-inline-start: 0;
        }

        [part="avatar"] [part="avatar-image"] {
          inline-size: 100%;
          block-size: 100%;
          border-radius: 999px;
          object-fit: cover;
        }

        [part="dot"] {
          position: absolute;
          inset-block-end: -1px;
          inset-inline-end: -1px;
          inline-size: 0.6rem;
          block-size: 0.6rem;
          border: 2px solid var(--boe-token-surface-surface, #ffffff);
          border-radius: 999px;
          background: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="dot"][data-activity="viewing"] {
          background: var(--boe-token-surface-status-surface-success, #26c281);
        }

        [part="dot"][data-activity="editing"] {
          background: var(--boe-token-surface-surface-brand, #0061d5);
        }

        [part="overflow"] {
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 82%, var(--boe-token-surface-surface, #ffffff) 18%);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="summary"] {
          font-size: 0.84rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }
      </style>
      <div part="presence" role="group">
        <span part="stack" hidden></span>
        <span part="summary" aria-live="polite"></span>
      </div>
    `;
  }

  protected update(): void {
    if (!this.shadowRoot) {
      return;
    }

    const presence = this.shadowRoot.querySelector('[part="presence"]') as HTMLElement | null;
    const stack = this.shadowRoot.querySelector('[part="stack"]') as HTMLElement | null;
    const summary = this.shadowRoot.querySelector('[part="summary"]') as HTMLElement | null;
    if (!presence || !stack || !summary) {
      return;
    }

    presence.setAttribute("aria-label", this.label);

    const users = this.users;
    const max = this.max;
    const visible = users.slice(0, max);
    const overflow = Math.max(0, users.length - visible.length);

    const avatarsMarkup = visible
      .map((user, index) => {
        const initials = user.initials || initialsFromName(user.name) || "?";
        const inner = user.src
          ? `<img part="avatar-image" src="${escapeHtml(user.src)}" alt="" />`
          : escapeHtml(initials);
        const activity = user.activity === "editing" ? "editing" : "viewing";
        return `
          <span
            part="avatar"
            role="img"
            aria-label="${escapeHtml(`${user.name}, ${activity}`)}"
            data-activity="${activity}"
            style="z-index:${visible.length - index};"
          >${inner}<span part="dot" data-activity="${activity}" aria-hidden="true"></span></span>
        `;
      })
      .join("");

    const overflowMarkup = overflow ? `<span part="overflow">+${overflow}</span>` : "";

    // Update the pile in place; the summary's aria-live node is never replaced,
    // only its text, so roster changes are announced.
    stack.innerHTML = `${avatarsMarkup}${overflowMarkup}`;
    stack.hidden = users.length === 0;
    summary.textContent = summarize(users);
  }
}

export const defineBoxPresenceElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxPresenceElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxPresenceElement;
  }

  customElements.define(tagName, BoxPresenceElement);
  return BoxPresenceElement;
};
