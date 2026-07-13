import { Controller } from "../../core/index.js";
import type {
  InviteCollaboratorsState,
  InviteCollaboratorsTransport,
  InviteResult,
} from "./invite-collaborators-contracts.js";

export interface InviteCollaboratorsControllerConfig {
  itemId: string;
  transport: InviteCollaboratorsTransport;
  role?: string;
}

type InviteCollaboratorsEvents = {
  stateChanged: { state: InviteCollaboratorsState };
  submitted: { result: InviteResult };
  error: { error: string };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Headless controller for the invite-collaborators flow. It owns the form state
 * — the recipient list (validated, de-duplicated emails), the granted role, and
 * an optional message — plus the async submission lifecycle, delegating actual
 * delivery to the injected transport. Consumers subscribe to `stateChanged` and
 * render; `submit()` resolves to whether the invite succeeded.
 */
export class InviteCollaboratorsController extends Controller<
  InviteCollaboratorsState,
  InviteCollaboratorsEvents
> {
  private readonly config: InviteCollaboratorsControllerConfig;

  constructor(config: InviteCollaboratorsControllerConfig) {
    super({
      recipients: [],
      role: config.role ?? "editor",
      message: "",
      status: "idle",
      error: null,
      result: null,
    });
    this.config = config;
  }

  get recipients(): string[] {
    return this.state.recipients;
  }

  private update(patch: Partial<InviteCollaboratorsState>): void {
    this.setState({ ...this.state, ...patch });
    this.emit("stateChanged", { state: this.state });
  }

  /** Add a validated, lower-cased email. Returns false for invalid or duplicate input. */
  addRecipient(email: string): boolean {
    const value = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(value) || this.state.recipients.includes(value)) {
      return false;
    }
    this.update({ recipients: [...this.state.recipients, value], error: null });
    return true;
  }

  removeRecipient(email: string): void {
    if (!this.state.recipients.includes(email)) {
      return;
    }
    this.update({ recipients: this.state.recipients.filter(item => item !== email) });
  }

  setRole(role: string): void {
    if (role && role !== this.state.role) {
      this.update({ role });
    }
  }

  setMessage(message: string): void {
    this.update({ message });
  }

  reset(): void {
    this.update({
      recipients: [],
      message: "",
      status: "idle",
      error: null,
      result: null,
    });
  }

  /** Submit the current recipients via the transport. No-op without recipients or while submitting. */
  async submit(): Promise<boolean> {
    if (!this.state.recipients.length || this.state.status === "submitting") {
      return false;
    }

    this.update({ status: "submitting", error: null });
    try {
      const result = await this.config.transport.sendInvites({
        itemId: this.config.itemId,
        recipients: [...this.state.recipients],
        role: this.state.role,
        message: this.state.message || undefined,
      });
      this.update({ status: "success", result });
      this.emit("submitted", { result });
      return true;
    } catch (caught) {
      const error = caught instanceof Error ? caught.message : "Failed to send invitations";
      this.update({ status: "error", error });
      this.emit("error", { error });
      return false;
    }
  }
}
