import { InviteCollaboratorsController } from "./invite-collaborators-controller.js";
import type { InviteCollaboratorsTransport, InviteRole } from "./invite-collaborators-contracts.js";
import { BaseElement } from "../../core/index.js";

const DEFAULT_TAG_NAME = "box-invite-collaborators-modal";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const DEFAULT_ROLES: InviteRole[] = [
  { value: "co-owner", label: "Co-owner" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

/**
 * The invite-collaborators workflow surface: a modal that collects recipient
 * emails (as removable pills), a role, and an optional message, then submits via
 * an `InviteCollaboratorsController` it owns (created from the injected
 * `transport` + `item-id`). Emits `submitted` on success and `cancel` on
 * dismissal, closing itself in both cases. Structure is built once per open so
 * the live inputs keep focus while only the pills/status update.
 */
export class BoxInviteCollaboratorsModalElement extends BaseElement {
  static get observedAttributes(): string[] {
    return ["heading", "item-id", "open", "submit-label"];
  }

  private controller: InviteCollaboratorsController | null = null;
  private controllerUnsubscribe: (() => void) | null = null;
  private transportValue: InviteCollaboratorsTransport | null = null;
  private rolesValue: InviteRole[] = DEFAULT_ROLES;


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

  get heading(): string {
    return this.getAttribute("heading") ?? "Invite collaborators";
  }

  set heading(value: string) {
    this.setAttribute("heading", value);
  }

  get submitLabel(): string {
    return this.getAttribute("submit-label") ?? "Send invites";
  }

  set submitLabel(value: string) {
    this.setAttribute("submit-label", value);
  }

  get transport(): InviteCollaboratorsTransport | null {
    return this.transportValue;
  }

  set transport(value: InviteCollaboratorsTransport | null) {
    this.transportValue = value;
    this.ensureController(true);
    this.refresh();
  }

  get roles(): InviteRole[] {
    return this.rolesValue;
  }

  set roles(value: InviteRole[]) {
    this.rolesValue = value.length ? value : DEFAULT_ROLES;
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

  attributeChangedCallback(name: string): void {
    if (name === "item-id") {
      this.ensureController(true);
    }
    this.refresh();
  }

  private ensureController(recreate: boolean): void {
    if (recreate) {
      this.teardownController();
    }
    if (this.controller || !this.transportValue || !this.itemId) {
      return;
    }

    this.controller = new InviteCollaboratorsController({
      itemId: this.itemId,
      transport: this.transportValue,
      role: this.rolesValue[0]?.value,
    });
    this.controllerUnsubscribe = this.controller.subscribe("stateChanged", () => this.updateDynamic());
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
      this.buildStructure();
      // Focus the recipients field so keyboard users land in the form.
      (this.shadowRoot.querySelector('[part="recipient-input"]') as HTMLInputElement | null)?.focus();
    }
    this.updateDynamic();
  }

  private buildStructure(): void {
    if (!this.shadowRoot) {
      return;
    }

    const roleOptions = this.rolesValue
      .map(role => `<option value="${escapeHtml(role.value)}">${escapeHtml(role.label)}</option>`)
      .join("");

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
          inline-size: min(30rem, 100%);
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

        [part="title"] { margin: 0; font-size: 1.2rem; font-weight: 700; }

        [part="field"] { display: grid; gap: 0.35rem; }

        [part="label"] {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
        }

        [part="recipients"] {
          display: flex;
          flex-wrap: wrap;
          gap: 0.35rem;
          padding: 0.4rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 0.6rem;
        }

        [part="pill"] {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.3rem 0.2rem 0.55rem;
          border-radius: 999px;
          background: color-mix(in srgb, var(--boe-token-surface-surface-secondary, #fbfbfb) 70%, var(--boe-token-surface-surface, #ffffff) 30%);
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          font-size: 0.8rem;
          font-weight: 600;
        }

        [part="pill-remove"] {
          appearance: none;
          inline-size: 1.05rem;
          block-size: 1.05rem;
          display: inline-grid;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: var(--boe-token-text-text-secondary, #6f6f6f);
          cursor: pointer;
        }

        [part="pill-remove"] svg { inline-size: 0.6rem; block-size: 0.6rem; }

        [part="recipient-input"] {
          flex: 1 1 8rem;
          min-inline-size: 8rem;
          border: 0;
          outline: none;
          background: transparent;
          font: inherit;
          color: inherit;
        }

        [part="role"],
        [part="message"] {
          inline-size: 100%;
          box-sizing: border-box;
          padding: 0.55rem 0.65rem;
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          border-radius: 0.6rem;
          background: var(--boe-token-surface-surface, #ffffff);
          font: inherit;
          color: inherit;
        }

        [part="message"] { min-block-size: 4rem; resize: vertical; }

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

        [part="cancel"],
        [part="submit"] {
          appearance: none;
          border-radius: 999px;
          font: inherit;
          font-weight: 600;
          padding: 0.55rem 1rem;
          cursor: pointer;
        }

        [part="cancel"] {
          border: 1px solid color-mix(in srgb, var(--boe-token-stroke-stroke, #e8e8e8) 82%, transparent);
          background: var(--boe-token-surface-surface, #ffffff);
          color: inherit;
        }

        [part="submit"] {
          border: 1px solid transparent;
          background: var(--boe-token-surface-surface-brand, #0061d5);
          color: var(--boe-token-text-text-on-brand, #ffffff);
        }

        [part="submit"]:disabled { opacity: 0.55; cursor: not-allowed; }

        [part="cancel"]:focus-visible,
        [part="submit"]:focus-visible,
        [part="recipient-input"]:focus-visible {
          outline: 2px solid color-mix(in srgb, var(--boe-token-surface-surface-brand, #0061d5) 34%, transparent);
          outline-offset: 2px;
        }
      </style>
      <div part="backdrop">
        <section part="dialog" role="dialog" aria-modal="true" aria-labelledby="invite-title">
          <h2 part="title" id="invite-title">${escapeHtml(this.heading)}</h2>
          <div part="field">
            <span part="label">People</span>
            <div part="recipients">
              <span part="pills"></span>
              <input part="recipient-input" type="email" placeholder="Add email and press Enter" aria-label="Add collaborator email" />
            </div>
          </div>
          <div part="field">
            <label part="label" for="invite-role">Role</label>
            <select part="role" id="invite-role">${roleOptions}</select>
          </div>
          <div part="field">
            <label part="label" for="invite-message">Message</label>
            <textarea part="message" id="invite-message" placeholder="Add an optional note"></textarea>
          </div>
          <p part="error" role="alert" hidden></p>
          <div part="actions">
            <button type="button" part="cancel">Cancel</button>
            <button type="button" part="submit">${escapeHtml(this.submitLabel)}</button>
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

    const input = this.shadowRoot.querySelector('[part="recipient-input"]') as HTMLInputElement | null;
    input?.addEventListener("keydown", event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === "Enter" || keyboardEvent.key === ",") {
        keyboardEvent.preventDefault();
        if (this.controller?.addRecipient(input.value)) {
          input.value = "";
        }
      }
    });

    this.shadowRoot.querySelector('[part="role"]')?.addEventListener("change", event => {
      this.controller?.setRole((event.currentTarget as HTMLSelectElement).value);
    });

    this.shadowRoot.querySelector('[part="message"]')?.addEventListener("input", event => {
      this.controller?.setMessage((event.currentTarget as HTMLTextAreaElement).value);
    });

    this.shadowRoot.querySelector('[part="cancel"]')?.addEventListener("click", () => this.close("cancel"));
    this.shadowRoot.querySelector('[part="backdrop"]')?.addEventListener("click", event => {
      if (event.target === event.currentTarget) {
        this.close("cancel");
      }
    });

    this.shadowRoot.querySelector('[part="submit"]')?.addEventListener("click", () => {
      void this.submit();
    });

    this.shadowRoot.querySelectorAll('[part="pill-remove"]').forEach(button => {
      button.addEventListener("click", () => {
        this.controller?.removeRecipient((button as HTMLButtonElement).dataset.value ?? "");
      });
    });
  }

  private async submit(): Promise<void> {
    if (!this.controller) {
      return;
    }
    const ok = await this.controller.submit();
    if (ok) {
      const result = this.controller.getState().result;
      this.dispatchEvent(
        new CustomEvent("submitted", { bubbles: true, composed: true, detail: { result } }),
      );
      this.open = false;
    }
  }

  private close(reason: "cancel"): void {
    this.dispatchEvent(new CustomEvent(reason, { bubbles: true, composed: true }));
    this.open = false;
  }

  private updateDynamic(): void {
    if (!this.shadowRoot || !this.open) {
      return;
    }

    const state = this.controller?.getState();
    const pills = this.shadowRoot.querySelector('[part="pills"]');
    const error = this.shadowRoot.querySelector('[part="error"]') as HTMLElement | null;
    const submit = this.shadowRoot.querySelector('[part="submit"]') as HTMLButtonElement | null;
    const role = this.shadowRoot.querySelector('[part="role"]') as HTMLSelectElement | null;
    if (!pills || !error || !submit) {
      return;
    }

    const recipients = state?.recipients ?? [];
    pills.innerHTML = recipients
      .map(
        recipient => `
          <span part="pill">
            <span>${escapeHtml(recipient)}</span>
            <button type="button" part="pill-remove" data-value="${escapeHtml(recipient)}" aria-label="Remove ${escapeHtml(recipient)}">
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
          </span>
        `,
      )
      .join("");
    // Re-bind the freshly rendered remove buttons.
    pills.querySelectorAll('[part="pill-remove"]').forEach(button => {
      button.addEventListener("click", () => {
        this.controller?.removeRecipient((button as HTMLButtonElement).dataset.value ?? "");
      });
    });

    if (role && state) {
      role.value = state.role;
    }

    const submitting = state?.status === "submitting";
    submit.disabled = submitting || recipients.length === 0;
    submit.textContent = submitting ? "Sending…" : this.submitLabel;

    if (state?.error) {
      error.textContent = state.error;
      error.hidden = false;
    } else {
      error.textContent = "";
      error.hidden = true;
    }
  }
}

export const defineBoxInviteCollaboratorsModalElement = (
  tagName = DEFAULT_TAG_NAME,
): typeof BoxInviteCollaboratorsModalElement => {
  const existingElement = customElements.get(tagName);
  if (existingElement) {
    return existingElement as typeof BoxInviteCollaboratorsModalElement;
  }

  customElements.define(tagName, BoxInviteCollaboratorsModalElement);
  return BoxInviteCollaboratorsModalElement;
};
