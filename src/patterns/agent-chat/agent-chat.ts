import { AgentChatController } from "./controller.js";
import type {
  AgentChatEvents,
  AgentChatMessage,
  AgentChatTransport,
  AgentCitation,
} from "./types.js";
import { BaseElement } from "../../core/index.js";
import { boeMotionDuration, boeMotionEasing } from "../../foundations/motion/index.js";
import { boePanel, boeRadius } from "../../foundations/geometry/index.js";

const DEFAULT_TAG_NAME = "box-agent-chat";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

/** Same downgrade rule as the timeline: unsafe hrefs render as buttons. */
const isSafeHref = (value: string): boolean =>
  /^https?:\/\//.test(value) || value.startsWith("/") || value.startsWith("#");

const initialsOf = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");

const elementStyles = `
        [hidden] {
          display: none !important;
        }

        :host {
          display: block;
          color: inherit;
          font: inherit;
        }

        section[part="panel"] {
          display: grid;
          gap: ${boePanel.gap};
          padding: ${boePanel.padding};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: ${boePanel.radius};
          background: ${boePanel.background};
        }

        [part="header"] {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
        }

        [part="title"] {
          margin: 0;
          font: inherit;
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="status"] {
          margin-inline-start: auto;
          font-size: 0.78rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="thread"] {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 0.6rem;
          max-block-size: 26rem;
          overflow-y: auto;
        }

        [part="message"] {
          display: grid;
          gap: 0.35rem;
          padding: 0.6rem 0.7rem;
          border-radius: ${boeRadius.large};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 52%, transparent);
          background: var(--boe-token-surface-surface, #ffffff);
        }

        [part="message"][data-role="user"] {
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
          margin-inline-start: 2.5rem;
        }

        [part="message"][data-status="error"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 40%, transparent);
        }

        [part="message-header"] {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        [part="avatar"] {
          display: inline-grid;
          place-items: center;
          inline-size: 1.5rem;
          block-size: 1.5rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 12%, var(--boe-token-surface-surface, #ffffff) 88%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        [part="author"] {
          font-weight: 700;
          font-size: 0.85rem;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="body"] {
          margin: 0;
          white-space: pre-wrap;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="error"] {
          margin: 0;
          font-size: 0.84rem;
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 74%, black 26%);
        }

        [part="caret"] {
          display: inline-block;
          inline-size: 0.5rem;
          block-size: 1em;
          vertical-align: text-bottom;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 60%, transparent);
          animation: boe-agent-caret 1s steps(2, start) infinite;
        }

        @keyframes boe-agent-caret {
          to {
            opacity: 0.15;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [part="caret"] {
            animation: none;
          }
        }

        [part="citations"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
        }

        [part="citation"] {
          appearance: none;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font: inherit;
          font-size: 0.74rem;
          font-weight: 600;
          padding: 0.18rem 0.5rem;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 60%, transparent);
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          text-decoration: none;
          cursor: pointer;
        }

        [part="citation"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="citation"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="proposal"] {
          display: grid;
          gap: 0.35rem;
          padding: 0.55rem 0.6rem;
          border-radius: ${boeRadius.med};
          border: 1px solid color-mix(in srgb, var(--boe-token-surface-status-surface-warning, #f5b31b) 45%, transparent);
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-warning, #f5b31b) 8%, var(--boe-token-surface-surface, #ffffff));
        }

        [part="proposal"][data-decision="approved"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26a27b) 45%, transparent);
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26a27b) 8%, var(--boe-token-surface-surface, #ffffff));
        }

        [part="proposal"][data-decision="rejected"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 45%, transparent);
          background: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 6%, var(--boe-token-surface-surface, #ffffff));
        }

        [part="proposal-title"] {
          font-weight: 700;
          font-size: 0.88rem;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="proposal-summary"],
        [part="proposal-note"] {
          margin: 0;
          font-size: 0.82rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="proposal-params"] {
          margin: 0;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 0.15rem 0.5rem;
          font-size: 0.8rem;
        }

        [part="param-label"] {
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="param-value"] {
          margin: 0;
          color: var(--boe-token-text-text, #1f1e1b);
        }

        [part="proposal-actions"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
        }

        [part="proposal-action"] {
          appearance: none;
          font: inherit;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.26rem 0.65rem;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 60%, transparent);
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="proposal-action"]:hover {
          background: var(--boe-token-surface-surface-hover, #f4f4f4);
        }

        [part="proposal-action"][data-action="approve"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26a27b) 55%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-success, #26a27b) 62%, black 38%);
        }

        [part="proposal-action"][data-action="reject"] {
          border-color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 45%, transparent);
          color: color-mix(in srgb, var(--boe-token-surface-status-surface-error, #ed3757) 74%, black 26%);
        }

        [part="proposal-action"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="decision"] {
          display: inline-flex;
          padding: 0.12rem 0.45rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          background: var(--boe-token-surface-item-surface-selected, #f2f7fd);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="empty"] {
          padding: ${boePanel.padding};
          border-radius: ${boeRadius.large};
          border: 1px dashed color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="composer"] {
          display: grid;
          gap: 0.4rem;
        }

        [part="input"] {
          font: inherit;
          font-size: 0.9rem;
          padding: 0.5rem 0.6rem;
          border-radius: ${boeRadius.med};
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 70%, transparent);
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
          resize: vertical;
          min-block-size: 3.5rem;
        }

        [part="input"]:focus-visible {
          outline: none;
          border-color: var(--boe-token-surface-surface-brand, #0061d5);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 18%, transparent);
        }

        [part="composer-actions"] {
          display: flex;
          gap: 0.4rem;
          justify-content: flex-end;
        }

        [part="send"],
        [part="stop"] {
          appearance: none;
          font: inherit;
          font-size: 0.82rem;
          font-weight: 600;
          padding: 0.35rem 0.85rem;
          border-radius: 999px;
          border: 1px solid transparent;
          cursor: pointer;
          transition: background ${boeMotionDuration.interactive} ${boeMotionEasing.standard};
        }

        [part="send"] {
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="send"]:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        [part="stop"] {
          background: var(--boe-token-surface-surface, #ffffff);
          border-color: color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 60%, transparent);
          color: inherit;
        }

        [part="send"]:focus-visible,
        [part="stop"]:focus-visible {
          outline: none;
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 30%, transparent);
        }
      `;

/**
 * The agent conversation surface (opportunity 1 of the component roadmap):
 * a streaming message thread over the headless `AgentChatController`, with
 * the two card types that matter more than the bubbles — citation chips
 * (same contract as `box-timeline` evidence, deep-linking into a preview)
 * and human-in-the-loop action cards where the agent's proposed action is
 * approved or rejected inline.
 *
 * The composer lives outside the patched thread region, so a streaming
 * reply never disturbs what the user is typing.
 */
export class AgentChat extends BaseElement {
  static readonly tagName: string = DEFAULT_TAG_NAME;
  static get observedAttributes(): string[] {
    return ["agent-name", "heading", "placeholder", "token"];
  }

  private controller: AgentChatController | null = null;

  private ownsController = false;

  private pendingStart = false;

  private unsubscribeFns: Array<() => void> = [];

  private transportValue: AgentChatTransport | null = null;

  private threadEl!: HTMLElement;

  private inputEl!: HTMLTextAreaElement;

  private sendEl!: HTMLButtonElement;

  private stopEl!: HTMLButtonElement;

  private statusEl!: HTMLElement;

  get heading(): string {
    return this.getAttribute("heading") ?? "Agent";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get token(): string | null {
    return this.getAttribute("token");
  }

  set token(value: string | null) {
    if (!value) {
      this.removeAttribute("token");
      return;
    }
    this.setAttribute("token", value);
  }

  /** Display name on agent bubbles. */
  get agentName(): string {
    return this.getAttribute("agent-name") ?? "Agent";
  }

  set agentName(value: string) {
    this.setAttribute("agent-name", value);
  }

  get placeholder(): string {
    return this.getAttribute("placeholder") ?? "Ask the agent…";
  }

  set placeholder(value: string) {
    this.setAttribute("placeholder", value);
  }

  get transport(): AgentChatTransport | null {
    return this.transportValue;
  }

  set transport(value: AgentChatTransport | null) {
    this.transportValue = value;
    this.scheduleStart();
  }

  /**
   * The live session controller. Assign one to share a conversation with
   * another surface; otherwise the element creates and owns its own from
   * `transport` + `token`.
   */
  get chatController(): AgentChatController | null {
    return this.controller;
  }

  set chatController(value: AgentChatController | null) {
    this.adoptController(value);
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === "token") {
      this.scheduleStart();
    } else if (name === "agent-name") {
      // A display label must never discard the conversation: keep the live
      // session and just refresh what new replies will be stamped with.
      if (this.controller && this.ownsController) {
        this.controller.config.agentName = this.agentName;
      }
      if (this.isRendered) {
        this.update();
      }
    }
    super.attributeChangedCallback(name, oldValue, newValue);
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.scheduleStart();
  }

  disconnectedCallback(): void {
    this.teardownController();
  }

  /** Send the composer's contents (or an explicit body) as a user turn. */
  async send(body?: string): Promise<void> {
    const text = body ?? this.inputEl?.value ?? "";
    if (!text.trim()) {
      return;
    }
    // Clear only once the controller has accepted the turn, so a refused
    // send (no controller, or a disconnected session) never loses typing.
    const sent = await this.controller?.send(text);
    if (sent && body === undefined && this.inputEl) {
      this.inputEl.value = "";
      this.syncComposer();
    }
  }

  /** Stop the in-flight generation; the partial reply is kept. */
  stop(): void {
    this.controller?.stop();
  }

  private scheduleStart(): void {
    if (this.pendingStart) {
      return;
    }
    this.pendingStart = true;
    queueMicrotask(() => {
      this.pendingStart = false;
      this.startController();
    });
  }

  private startController(): void {
    if (!this.isConnected || (this.controller && !this.ownsController)) {
      return;
    }

    if (!this.transportValue || !this.token) {
      this.teardownController();
      if (this.isRendered) {
        this.update();
      }
      return;
    }

    this.teardownController();
    const controller = new AgentChatController({
      token: this.token,
      transport: this.transportValue,
      agentName: this.agentName,
    });
    this.controller = controller;
    this.ownsController = true;
    this.subscribeToController(controller);
    controller.connect();
    if (this.isRendered) {
      this.update();
    }
  }

  private adoptController(controller: AgentChatController | null): void {
    this.teardownController();
    if (!controller) {
      if (this.isRendered) {
        this.update();
      }
      // Fall back to the documented owned session from transport + token.
      this.scheduleStart();
      return;
    }
    this.controller = controller;
    this.ownsController = false;
    this.subscribeToController(controller);
    if (this.isRendered) {
      this.update();
    }
  }

  private subscribeToController(controller: AgentChatController): void {
    const events: Array<[keyof AgentChatEvents, string]> = [
      ["messagesChanged", "messages-changed"],
      ["streamingChanged", "streaming-changed"],
      ["sendFailed", "send-failed"],
      ["actionResolved", "action-resolved"],
    ];

    this.unsubscribeFns = events.map(([eventName, domEventName]) =>
      controller.subscribe(eventName, payload => {
        this.dispatchEvent(
          new CustomEvent(domEventName, {
            bubbles: true,
            composed: true,
            detail: payload,
          }),
        );
        if (this.isRendered) {
          this.update();
        }
      }),
    );
  }

  private teardownController(): void {
    for (const unsubscribe of this.unsubscribeFns) {
      unsubscribe();
    }
    this.unsubscribeFns = [];

    if (this.controller && this.ownsController) {
      this.controller.disconnect();
      this.controller.destroy();
    }
    this.controller = null;
    this.ownsController = false;
  }

  private citationHtml(messageId: string, citation: AgentCitation): string {
    const attrs = `part="citation" data-message-id="${escapeHtml(messageId)}" data-citation-id="${escapeHtml(citation.id)}"`;
    // Unsafe hrefs downgrade to buttons — the host still gets the event.
    return citation.href && isSafeHref(citation.href)
      ? `<a ${attrs} href="${escapeHtml(citation.href)}">${escapeHtml(citation.label)}</a>`
      : `<button type="button" ${attrs}>${escapeHtml(citation.label)}</button>`;
  }

  private proposalHtml(message: AgentChatMessage): string {
    const canResolve = Boolean(this.controller?.config.transport.resolveAction);
    return message.proposals
      .map(proposal => {
        const params = (proposal.params ?? [])
          .map(
            param => `
              <dt part="param-label">${escapeHtml(param.label)}</dt>
              <dd part="param-value">${escapeHtml(param.value)}</dd>
            `,
          )
          .join("");
        const actions =
          canResolve && !proposal.decision
            ? `
              <div part="proposal-actions">
                <button type="button" part="proposal-action" data-action="approve" data-proposal-id="${escapeHtml(proposal.id)}">Approve</button>
                <button type="button" part="proposal-action" data-action="reject" data-proposal-id="${escapeHtml(proposal.id)}">Reject</button>
                <button type="button" part="proposal-action" data-action="modify" data-proposal-id="${escapeHtml(proposal.id)}">Modify</button>
              </div>
            `
            : "";
        return `
          <div part="proposal" data-proposal-id="${escapeHtml(proposal.id)}"${proposal.decision ? ` data-decision="${escapeHtml(proposal.decision)}"` : ""}>
            <span part="proposal-title">${escapeHtml(proposal.title)}</span>
            ${proposal.summary ? `<p part="proposal-summary">${escapeHtml(proposal.summary)}</p>` : ""}
            ${params ? `<dl part="proposal-params">${params}</dl>` : ""}
            ${proposal.decision ? `<span part="decision">${proposal.decision === "approved" ? "Approved" : "Rejected"}</span>` : ""}
            ${proposal.note ? `<p part="proposal-note">${escapeHtml(proposal.note)}</p>` : ""}
            ${actions}
          </div>
        `;
      })
      .join("");
  }

  private messageInnerHtml(message: AgentChatMessage): string {
    const name = message.role === "user" ? "You" : (message.actor?.name ?? this.agentName);
    const initials = message.actor?.initials ?? initialsOf(name);
    const citations = message.citations
      .map(citation => this.citationHtml(message.id, citation))
      .join("");

    return `
      <div part="message-header">
        <span part="avatar" aria-hidden="true">${escapeHtml(initials)}</span>
        <span part="author">${escapeHtml(name)}</span>
      </div>
      <p part="body">${escapeHtml(message.body)}${message.status === "streaming" ? `<span part="caret" aria-hidden="true"></span>` : ""}</p>
      ${message.status === "error" && message.errorMessage ? `<p part="error" role="alert">${escapeHtml(message.errorMessage)}</p>` : ""}
      ${citations ? `<div part="citations">${citations}</div>` : ""}
      ${this.proposalHtml(message)}
    `;
  }

  /**
   * Everything about a message except its body text. While this is stable,
   * a delta only rewrites one text node — so `role="log"` sees no additions
   * and assistive tech does not re-announce the conversation per token.
   */
  private messageSignature(message: AgentChatMessage): string {
    return [
      message.status,
      message.errorMessage ?? "",
      message.actor?.name ?? "",
      this.agentName,
      message.citations.map(citation => `${citation.id}:${citation.href ?? ""}`).join(","),
      message.proposals
        .map(proposal => `${proposal.id}:${proposal.decision ?? ""}:${proposal.note ?? ""}`)
        .join(","),
      this.controller?.config.transport.resolveAction ? "resolvable" : "read-only",
    ].join("|");
  }

  private createMessageNode(message: AgentChatMessage): HTMLElement {
    const template = document.createElement("template");
    template.innerHTML = `
      <li part="message" data-message-id="${escapeHtml(message.id)}" data-role="${escapeHtml(message.role)}" data-status="${escapeHtml(message.status)}" data-signature="${escapeHtml(this.messageSignature(message))}">
        ${this.messageInnerHtml(message)}
      </li>
    `.trim();
    return template.content.firstElementChild as HTMLElement;
  }

  /** The streaming hot path: one text-node write, nothing else touched. */
  private patchBody(node: HTMLElement, message: AgentChatMessage): void {
    const body = node.querySelector('[part="body"]');
    if (!body) {
      return;
    }
    const first = body.firstChild;
    if (first && first.nodeType === Node.TEXT_NODE) {
      if (first.textContent !== message.body) {
        first.textContent = message.body;
      }
      return;
    }
    body.insertBefore(document.createTextNode(message.body), body.firstChild);
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }

    // The composer is part of the stable shell: a streaming reply patches
    // only [part="thread"], so typing is never interrupted.
    this.shadowRoot.innerHTML = `
      <style>${elementStyles}</style>
      <section part="panel">
        <div part="header">
          <h2 part="title"></h2>
          <span part="status" role="status" aria-live="polite"></span>
        </div>
        <ol part="thread" role="log" aria-live="polite" aria-relevant="additions"></ol>
        <div part="composer">
          <textarea part="input" rows="2"></textarea>
          <div part="composer-actions">
            <button type="button" part="stop" hidden>Stop</button>
            <button type="button" part="send">Send</button>
          </div>
        </div>
      </section>
    `;
    this.threadEl = this.shadowRoot.querySelector('[part="thread"]')!;
    this.inputEl = this.shadowRoot.querySelector('[part="input"]')!;
    this.sendEl = this.shadowRoot.querySelector('[part="send"]')!;
    this.stopEl = this.shadowRoot.querySelector('[part="stop"]')!;
    this.statusEl = this.shadowRoot.querySelector('[part="status"]')!;
  }

  protected setupListeners(): void {
    this.sendEl.addEventListener("click", () => {
      void this.send();
    });
    this.stopEl.addEventListener("click", () => {
      this.stop();
    });
    this.inputEl.addEventListener("keydown", event => {
      // Enter sends, Shift+Enter makes a newline — the conversational default.
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void this.send();
      }
    });
    this.inputEl.addEventListener("input", () => {
      this.syncComposer();
    });

    this.threadEl.addEventListener("click", event => {
      const target = event.target as HTMLElement;

      const proposalButton = target.closest('[part="proposal-action"]') as HTMLButtonElement | null;
      if (proposalButton && this.threadEl.contains(proposalButton)) {
        const proposalId = proposalButton.getAttribute("data-proposal-id") ?? "";
        const action = proposalButton.getAttribute("data-action") ?? "";
        if (action === "approve") {
          void this.controller?.resolveAction(proposalId, "approved");
        } else if (action === "reject") {
          void this.controller?.resolveAction(proposalId, "rejected");
        } else if (action === "modify") {
          // Modifying needs the host's own editor, so this surfaces intent.
          this.dispatchEvent(
            new CustomEvent("proposal-modify-requested", {
              bubbles: true,
              composed: true,
              detail: { proposalId },
            }),
          );
        }
        return;
      }

      const citation = target.closest('[part="citation"]') as HTMLElement | null;
      if (citation && this.threadEl.contains(citation)) {
        const messageId = citation.getAttribute("data-message-id") ?? "";
        const citationId = citation.getAttribute("data-citation-id") ?? "";
        const message = this.controller?.getMessage(messageId);
        const found = message?.citations.find(entry => entry.id === citationId);
        if (found) {
          this.dispatchEvent(
            new CustomEvent("citation-selected", {
              bubbles: true,
              composed: true,
              detail: { citation: found, messageId },
            }),
          );
        }
      }
    });
  }

  /** Composer affordances reflect stream state without rebuilding the input. */
  private syncComposer(): void {
    const streaming = this.controller?.getState().streaming ?? false;
    this.inputEl.placeholder = this.placeholder;
    this.sendEl.disabled = streaming || this.inputEl.value.trim().length === 0;
    this.stopEl.hidden = !streaming;
    this.statusEl.textContent = streaming ? "Agent is responding…" : "";
  }

  protected update(): void {
    if (!this.threadEl) {
      return;
    }

    const active = this.shadowRoot?.activeElement as HTMLElement | null;
    const focusKey =
      active && this.threadEl.contains(active)
        ? {
            part: active.getAttribute("part") ?? "",
            proposalId: active.getAttribute("data-proposal-id"),
            citationId: active.getAttribute("data-citation-id"),
            action: active.getAttribute("data-action"),
          }
        : null;

    const state = this.controller?.getState() ?? null;
    const messages = state?.messages ?? [];
    const atBottom =
      this.threadEl.scrollHeight - this.threadEl.scrollTop - this.threadEl.clientHeight < 40;

    this.shadowRoot!.querySelector('[part="title"]')!.textContent = this.heading;

    if (messages.length === 0) {
      if (!this.threadEl.querySelector('[part="empty"]')) {
        this.threadEl.innerHTML = `<li part="empty">No messages yet.</li>`;
      }
      this.syncComposer();
      return;
    }
    this.threadEl.querySelector('[part="empty"]')?.remove();

    // Reconcile by message id so a streaming delta touches one text node
    // rather than replacing every list item.
    const existing = new Map<string, HTMLElement>();
    for (const node of Array.from(this.threadEl.children)) {
      const id = node.getAttribute("data-message-id");
      if (id) {
        existing.set(id, node as HTMLElement);
      }
    }

    let previous: ChildNode | null = null;
    for (const message of messages) {
      let node = existing.get(message.id);
      if (node) {
        existing.delete(message.id);
        const signature = this.messageSignature(message);
        if (node.getAttribute("data-signature") === signature) {
          this.patchBody(node, message);
        } else {
          node.setAttribute("data-signature", signature);
          node.setAttribute("data-status", message.status);
          node.innerHTML = this.messageInnerHtml(message);
        }
      } else {
        node = this.createMessageNode(message);
      }

      const anchor: ChildNode | null = previous
        ? previous.nextSibling
        : this.threadEl.firstChild;
      if (node !== anchor) {
        this.threadEl.insertBefore(node, anchor);
      }
      previous = node;
    }
    for (const stale of existing.values()) {
      stale.remove();
    }

    if (focusKey?.part) {
      const target = Array.from(this.threadEl.querySelectorAll(`[part="${focusKey.part}"]`)).find(
        node =>
          node.getAttribute("data-proposal-id") === focusKey.proposalId &&
          node.getAttribute("data-citation-id") === focusKey.citationId &&
          (!focusKey.action || node.getAttribute("data-action") === focusKey.action),
      ) as HTMLElement | undefined;
      target?.focus();
    }

    // Follow the stream only when the reader is already at the bottom.
    if (atBottom) {
      this.threadEl.scrollTop = this.threadEl.scrollHeight;
    }

    this.syncComposer();
  }
}

AgentChat.register();
