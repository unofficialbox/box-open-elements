import { UnifiedShareController } from "./unified-share-controller.js";
import type { UnifiedShareState, UnifiedShareTab } from "./unified-share-controller.js";
import type { CollaboratorSummary, ShareDataSource, SharedLinkState } from "./contracts.js";
import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-unified-share-modal";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

interface AccessOption {
  value: NonNullable<SharedLinkState["access"]>;
  label: string;
  description: string;
}

const ACCESS_OPTIONS: AccessOption[] = [
  { value: "collaborators", label: "Invited people only", description: "Only people with access can open this link." },
  { value: "company", label: "People in your company", description: "Anyone in your company with the link." },
  { value: "open", label: "Anyone with the link", description: "Anyone on the internet with the link." },
];

const accessLabel = (access: SharedLinkState["access"]): string =>
  ACCESS_OPTIONS.find(option => option.value === access)?.label ?? "Invited people only";

const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) ?? "" : "";
  return (first + last).toUpperCase() || "?";
};

/**
 * The unified share surface: a modal that loads an item's shared link and
 * collaborators through a `ShareDataSource` (via a `UnifiedShareController` it
 * owns), then presents them across a "Shared link" tab (copyable URL + access
 * level) and a "People" tab (collaborator roster + an invite affordance). Emits
 * `invite` when the user asks to add people (host delegates to the invite modal),
 * `linkcopied` after a successful copy, and `close` on dismissal. Structure is
 * built once per open so the tab controls keep focus while the body re-renders.
 */
export class BoxUnifiedShareModalElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["heading", "item-id", "item-type", "open"];
  }

  private controller: UnifiedShareController | null = null;
  private controllerUnsubscribe: (() => void) | null = null;
  private dataSourceValue: ShareDataSource | null = null;
  // Structural signature of the currently-rendered body; null after a shell
  // (re)build so the next updateDynamic renders fresh. See updateDynamic().
  private bodySignature: string | null = null;


  get open(): boolean {
    return this.hasAttribute("open");
  }

  set open(value: boolean) {
    this.toggleAttribute("open", value);
  }

  get itemId(): string {
    return this.getAttribute("item-id") ?? "";
  }

  set itemId(value: string) {
    this.setAttribute("item-id", value);
  }

  get itemType(): "file" | "folder" {
    return this.getAttribute("item-type") === "folder" ? "folder" : "file";
  }

  set itemType(value: "file" | "folder") {
    this.setAttribute("item-type", value);
  }

  get heading(): string {
    return this.getAttribute("heading") ?? "Share";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get dataSource(): ShareDataSource | null {
    return this.dataSourceValue;
  }

  set dataSource(value: ShareDataSource | null) {
    this.dataSourceValue = value;
    this.ensureController(true);
    this.refresh();
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.ensureController(false);
    this.refresh();
  }

  disconnectedCallback(): void {
    this.teardownController();
  }

  attributeChangedCallback(name: string, previous: string | null, next: string | null): void {
    if (previous === next) {
      return;
    }
    if (name === "item-id" || name === "item-type") {
      this.ensureController(true);
    }
    if (name === "open" && this.open) {
      // Kick off a fresh load whenever the modal is (re)opened.
      void this.controller?.load();
    }
    this.refresh();
  }

  private ensureController(recreate: boolean): void {
    if (recreate) {
      this.teardownController();
    }
    if (this.controller || !this.dataSourceValue || !this.itemId) {
      return;
    }

    this.controller = new UnifiedShareController({
      itemId: this.itemId,
      itemType: this.itemType,
      dataSource: this.dataSourceValue,
    });
    this.controllerUnsubscribe = this.controller.subscribe("stateChanged", () => this.updateDynamic());
    if (this.open) {
      void this.controller.load();
    }
  }

  private teardownController(): void {
    this.controllerUnsubscribe?.();
    this.controllerUnsubscribe = null;
    this.controller?.destroy();
    this.controller = null;
  }


  private refresh(): void {
    if (this.isRendered) {
      this.update();
    }
  }

  protected renderTemplate(): void {
    if (!this.shadowRoot) {
      return;
    }
    // Styles and open content are owned by update()/buildStructure so closed
    // state can clear the dialog without dropping the BaseElement lifecycle.
    this.shadowRoot.innerHTML = "";
  }

  protected update(): void {
    if (!this.shadowRoot) {
      return;
    }

    if (!this.open) {
      this.shadowRoot.innerHTML = "";
      return;
    }

    const built = this.shadowRoot.querySelector('[part="dialog"]');
    if (!built) {
      this.bodySignature = null;
      this.buildStructure();
      (this.shadowRoot.querySelector('[part="tab-link"]') as HTMLButtonElement | null)?.focus();
    }
    this.updateDynamic();
  }

  private buildStructure(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: contents; color: inherit; font: inherit; }

        [part="backdrop"] {
          position: fixed;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 1rem;
          background: rgba(15, 23, 42, 0.45);
          z-index: 1000;
        }

        [part="dialog"] {
          inline-size: min(32rem, 100%);
          max-block-size: calc(100vh - 2rem);
          overflow: auto;
          display: grid;
          gap: 0.85rem;
          padding: 1.25rem;
          border-radius: 1rem;
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
        }

        [part="header"] {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
        }

        [part="title"] { margin: 0; font-size: 1.2rem; font-weight: 700; }

        [part="close"] {
          appearance: none;
          inline-size: 1.9rem;
          block-size: 1.9rem;
          display: inline-grid;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          cursor: pointer;
        }

        [part="close"] svg { inline-size: 0.85rem; block-size: 0.85rem; }

        [part="tablist"] {
          display: inline-flex;
          gap: 0.25rem;
          padding: 0.25rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 70%, var(--boe-token-surface-surface, #ffffff) 30%);
        }

        [part^="tab-"] {
          appearance: none;
          border: 0;
          border-radius: 999px;
          padding: 0.4rem 0.9rem;
          font: inherit;
          font-weight: 600;
          background: transparent;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          cursor: pointer;
        }

        [part^="tab-"][aria-selected="true"] {
          background: var(--boe-token-surface-surface, #ffffff);
          color: var(--boe-token-text-text, #222222);
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.12);
        }

        [part="body"] { display: grid; gap: 0.85rem; min-block-size: 6rem; }

        [part="label"] {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="link-row"] { display: flex; gap: 0.5rem; }

        [part="link-url"] {
          flex: 1 1 auto;
          min-inline-size: 0;
          box-sizing: border-box;
          padding: 0.55rem 0.65rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 0.6rem;
          background: var(--boe-token-surface-surface-secondary, #fbfbfb);
          font: inherit;
          color: inherit;
        }

        [part="copy"] {
          appearance: none;
          border-radius: 0.6rem;
          border: 1px solid transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
          font: inherit;
          font-weight: 600;
          padding: 0.55rem 0.9rem;
          cursor: pointer;
          white-space: nowrap;
        }

        [part="access"] {
          inline-size: 100%;
          box-sizing: border-box;
          padding: 0.55rem 0.65rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 0.6rem;
          background: var(--boe-token-surface-surface, #ffffff);
          font: inherit;
          color: inherit;
        }

        [part="access-hint"] {
          margin: 0;
          font-size: 0.82rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="field"] { display: grid; gap: 0.35rem; }

        [part="roster"] { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }

        [part="collaborator"] {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        [part="avatar"] {
          flex: 0 0 auto;
          inline-size: 2rem;
          block-size: 2rem;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 16%, var(--boe-token-surface-surface, #ffffff) 84%);
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font-size: 0.72rem;
          font-weight: 700;
        }

        [part="collaborator-name"] { font-weight: 600; }

        [part="collaborator-meta"] {
          font-size: 0.8rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="collaborator-role"] {
          margin-inline-start: auto;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          text-transform: capitalize;
        }

        [part="invite"] {
          appearance: none;
          justify-self: start;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 40%, transparent);
          background: transparent;
          color: var(--boe-token-surface-surface-brand, #0061d5);
          font: inherit;
          font-weight: 600;
          padding: 0.5rem 0.9rem;
          cursor: pointer;
        }

        [part="status"] {
          margin: 0;
          font-size: 0.9rem;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="error"] {
          margin: 0;
          color: var(--boe-token-text-text-danger, #b3261e);
          font-size: 0.85rem;
        }

        [part="error"][hidden] { display: none; }

        [part="actions"] {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-block-start: 0.25rem;
        }

        [part="done"] {
          appearance: none;
          border-radius: 999px;
          border: 1px solid transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
          font: inherit;
          font-weight: 600;
          padding: 0.55rem 1rem;
          cursor: pointer;
        }

        [part^="tab-"]:focus-visible,
        [part="copy"]:focus-visible,
        [part="invite"]:focus-visible,
        [part="done"]:focus-visible,
        [part="close"]:focus-visible,
        [part="access"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }
      </style>
      <div part="backdrop">
        <section part="dialog" role="dialog" aria-modal="true" aria-labelledby="unified-share-title">
          <div part="header">
            <h2 part="title" id="unified-share-title">${escapeHtml(this.heading)}</h2>
            <button type="button" part="close" aria-label="Close">
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
          </div>
          <div part="tablist" role="tablist" aria-label="Share options">
            <button type="button" part="tab-link" role="tab" id="unified-share-tab-link" aria-controls="unified-share-body" aria-selected="true">Shared link</button>
            <button type="button" part="tab-people" role="tab" id="unified-share-tab-people" aria-controls="unified-share-body" aria-selected="false">People</button>
          </div>
          <div part="body" id="unified-share-body" role="tabpanel" tabindex="0"></div>
          <div part="actions">
            <button type="button" part="done">Done</button>
          </div>
        </section>
      </div>
    `;

    this.attachListeners();
  }

  private attachListeners(): void {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.querySelector('[part="tab-link"]')?.addEventListener("click", () => {
      this.controller?.setActiveTab("link");
    });
    this.shadowRoot.querySelector('[part="tab-people"]')?.addEventListener("click", () => {
      this.controller?.setActiveTab("people");
    });

    this.shadowRoot.querySelector('[part="tablist"]')?.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key !== "ArrowLeft" && keyboardEvent.key !== "ArrowRight") {
        return;
      }
      keyboardEvent.preventDefault();
      const next: UnifiedShareTab = keyboardEvent.key === "ArrowRight" ? "people" : "link";
      this.controller?.setActiveTab(next);
      const target = next === "people" ? '[part="tab-people"]' : '[part="tab-link"]';
      (this.shadowRoot?.querySelector(target) as HTMLButtonElement | null)?.focus();
    });

    this.shadowRoot.querySelector('[part="close"]')?.addEventListener("click", () => this.close());
    this.shadowRoot.querySelector('[part="done"]')?.addEventListener("click", () => this.close());
    this.shadowRoot.querySelector('[part="backdrop"]')?.addEventListener("click", event => {
      if (event.target === event.currentTarget) {
        this.close();
      }
    });

    // Dialog-level keyboard contract: Escape dismisses, and Tab is trapped so
    // focus cannot leave the modal while aria-modal is set.
    this.shadowRoot.querySelector('[part="dialog"]')?.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Escape") {
        keyboardEvent.stopPropagation();
        this.close();
        return;
      }
      if (keyboardEvent.key === "Tab") {
        this.trapFocus(keyboardEvent);
      }
    });
  }

  /** Keep Tab / Shift+Tab focus cycling inside the dialog's tabbable controls. */
  private trapFocus(event: KeyboardEvent): void {
    const dialog = this.shadowRoot?.querySelector('[part="dialog"]');
    if (!dialog) {
      return;
    }

    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>('button, select, input, [tabindex]'),
    ).filter(element => !element.hasAttribute("disabled") && element.tabIndex !== -1);
    if (focusables.length === 0) {
      return;
    }

    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = this.shadowRoot?.activeElement as HTMLElement | null;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private close(): void {
    this.dispatchEvent(new CustomEvent("close", { bubbles: true, composed: true }));
    this.open = false;
  }

  private async copyLink(url: string): Promise<void> {
    // No clipboard API (insecure context / unsupported / test env) is not a
    // rejection — bail before claiming a success the host would toast.
    if (!navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard access can be denied — don't claim success the host would toast.
      return;
    }
    this.dispatchEvent(new CustomEvent("linkcopied", { bubbles: true, composed: true, detail: { url } }));
  }

  private updateDynamic(): void {
    if (!this.shadowRoot || !this.open) {
      return;
    }

    // Keep the observed `heading` attribute reflected after the shell is built.
    const title = this.shadowRoot.querySelector('[part="title"]');
    if (title) {
      title.textContent = this.heading;
    }

    const state = this.controller?.getState();
    const body = this.shadowRoot.querySelector('[part="body"]');
    const tabLink = this.shadowRoot.querySelector('[part="tab-link"]') as HTMLButtonElement | null;
    const tabPeople = this.shadowRoot.querySelector('[part="tab-people"]') as HTMLButtonElement | null;
    if (!body || !tabLink || !tabPeople) {
      return;
    }

    const activeTab: UnifiedShareTab = state?.activeTab ?? "link";
    tabLink.setAttribute("aria-selected", String(activeTab === "link"));
    tabPeople.setAttribute("aria-selected", String(activeTab === "people"));
    tabLink.tabIndex = activeTab === "link" ? 0 : -1;
    tabPeople.tabIndex = activeTab === "people" ? 0 : -1;
    body.setAttribute(
      "aria-labelledby",
      activeTab === "people" ? "unified-share-tab-people" : "unified-share-tab-link",
    );

    const phase = !state || state.status === "loading" || state.status === "idle"
      ? "loading"
      : state.status === "error"
        ? "error"
        : "ready";
    const hasLink = Boolean(state?.sharedLink?.url);
    // Only rebuild the body when its structure actually changes (phase / tab /
    // whether a link exists). Within a phase, patch dynamic values in place so a
    // focused control — e.g. the access <select> toggling disabled during
    // setAccess — is never destroyed and focus stays inside the dialog.
    const signature = `${phase}|${activeTab}|${hasLink}`;
    if (signature !== this.bodySignature) {
      this.bodySignature = signature;
      if (phase === "loading") {
        body.innerHTML = `<p part="status">Loading share settings…</p>`;
        return;
      }
      if (phase === "error") {
        body.innerHTML = `<p part="error">${escapeHtml(state?.error ?? "Something went wrong.")}</p>`;
        return;
      }
      body.innerHTML = activeTab === "link" ? this.renderLinkTab(state!) : this.renderPeopleTab(state!);
      this.attachBodyListeners();
    }

    if (phase === "ready" && state && activeTab === "link") {
      this.patchLinkTab(state);
    }
  }

  /** In-place refresh of the link tab's dynamic values (no DOM teardown). */
  private patchLinkTab(state: UnifiedShareState): void {
    if (!this.shadowRoot) {
      return;
    }

    const access = state.sharedLink?.access ?? "collaborators";
    const select = this.shadowRoot.querySelector('[part="access"]') as HTMLSelectElement | null;
    if (select) {
      // aria-busy (not disabled) so an actively-focused select is never blurred
      // mid-update; the controller's in-flight guard ignores overlapping changes.
      select.setAttribute("aria-busy", state.updatingLink ? "true" : "false");
      if (select.value !== access) {
        select.value = access;
      }
    }
    const hint = this.shadowRoot.querySelector('[part="access-hint"]');
    if (hint) {
      hint.textContent = ACCESS_OPTIONS.find(option => option.value === access)?.description ?? "";
    }
    const url = this.shadowRoot.querySelector('[part="link-url"]') as HTMLInputElement | null;
    if (url && state.sharedLink?.url && url.value !== state.sharedLink.url) {
      url.value = state.sharedLink.url;
    }
  }

  private renderLinkTab(state: UnifiedShareState): string {
    const url = state.sharedLink?.url ?? "";
    const access = state.sharedLink?.access ?? "collaborators";
    const options = ACCESS_OPTIONS.map(
      option =>
        `<option value="${option.value}"${option.value === access ? " selected" : ""}>${escapeHtml(option.label)}</option>`,
    ).join("");
    const description = ACCESS_OPTIONS.find(option => option.value === access)?.description ?? "";

    const linkSection = url
      ? `
        <div part="field">
          <span part="label">Shared link</span>
          <div part="link-row">
            <input part="link-url" type="text" readonly value="${escapeHtml(url)}" aria-label="Shared link URL" />
            <button type="button" part="copy">Copy</button>
          </div>
        </div>`
      : `<p part="status">No shared link yet. Choose who can access this item to create one.</p>`;

    return `
      ${linkSection}
      <div part="field">
        <label part="label" for="unified-share-access">Who has access</label>
        <select part="access" id="unified-share-access" aria-busy="${state.updatingLink ? "true" : "false"}">${options}</select>
        <p part="access-hint">${escapeHtml(description)}</p>
      </div>
    `;
  }

  private renderPeopleTab(state: UnifiedShareState): string {
    const roster = state.collaborators.length
      ? `<ul part="roster">${state.collaborators.map(collaborator => this.renderCollaborator(collaborator)).join("")}</ul>`
      : `<p part="status">No people have been added yet.</p>`;

    return `
      ${roster}
      <button type="button" part="invite">Invite people</button>
    `;
  }

  private renderCollaborator(collaborator: CollaboratorSummary): string {
    const name = collaborator.name.trim() || "Unknown";
    const meta = collaborator.status ? escapeHtml(collaborator.status) : escapeHtml(collaborator.type);
    return `
      <li part="collaborator">
        <span part="avatar" role="img" aria-label="${escapeHtml(name)}">${escapeHtml(initials(name))}</span>
        <span>
          <span part="collaborator-name">${escapeHtml(name)}</span><br />
          <span part="collaborator-meta">${meta}</span>
        </span>
        <span part="collaborator-role">${escapeHtml(collaborator.role)}</span>
      </li>
    `;
  }

  // Attached once per body rebuild; each handler reads live controller state at
  // event time so it stays correct across in-place patches (no rebuild).
  private attachBodyListeners(): void {
    if (!this.shadowRoot) {
      return;
    }

    const copy = this.shadowRoot.querySelector('[part="copy"]');
    copy?.addEventListener("click", () => {
      void this.copyLink(this.controller?.getState().sharedLink?.url ?? "");
    });

    const access = this.shadowRoot.querySelector('[part="access"]');
    access?.addEventListener("change", event => {
      const value = (event.currentTarget as HTMLSelectElement).value as NonNullable<SharedLinkState["access"]>;
      void this.controller?.setAccess(value);
    });

    const invite = this.shadowRoot.querySelector('[part="invite"]');
    invite?.addEventListener("click", () => {
      const current = this.controller?.getState();
      this.dispatchEvent(
        new CustomEvent("invite", {
          bubbles: true,
          composed: true,
          detail: { itemId: this.itemId, itemType: this.itemType, access: accessLabel(current?.sharedLink?.access) },
        }),
      );
    });
  }
}

export const defineBoxUnifiedShareModalElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxUnifiedShareModalElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxUnifiedShareModalElement;
  }

  customElements.define(tagName, BoxUnifiedShareModalElement);
  return BoxUnifiedShareModalElement;
};
