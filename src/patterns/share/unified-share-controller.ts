import { Controller } from "../../core/index.js";
import type { CollaboratorSummary, ShareDataSource, SharedLinkState } from "./contracts.js";

export interface UnifiedShareControllerConfig {
  itemId: string;
  itemType?: "file" | "folder";
  dataSource: ShareDataSource;
}

export type UnifiedShareTab = "link" | "people";
export type UnifiedShareStatus = "idle" | "loading" | "ready" | "error";

export interface UnifiedShareState {
  status: UnifiedShareStatus;
  sharedLink: SharedLinkState | null;
  collaborators: CollaboratorSummary[];
  activeTab: UnifiedShareTab;
  updatingLink: boolean;
  error: string | null;
}

type UnifiedShareEvents = {
  stateChanged: { state: UnifiedShareState };
  loaded: { sharedLink: SharedLinkState | null; collaborators: CollaboratorSummary[] };
  linkChanged: { sharedLink: SharedLinkState | null };
  error: { error: string };
};

/**
 * The orchestration behind the unified share surface. It loads the item's share
 * state (shared link + collaborators) from a `ShareDataSource`, drives shared-
 * link access changes back through the same source, and tracks the active tab.
 * Purely headless — the modal element renders `getState()` and reacts to
 * `stateChanged`.
 */
export class UnifiedShareController extends Controller<UnifiedShareState, UnifiedShareEvents> {
  private readonly config: Required<Pick<UnifiedShareControllerConfig, "itemType">> & UnifiedShareControllerConfig;

  // Shared in-flight guard: load() and setAccess() both talk to the same data
  // source and write the same sharedLink/collaborators state, so they must not
  // overlap — otherwise a slower response could clobber a newer one and silently
  // revert the user's access change. Only one runs at a time.
  private inFlight = false;

  constructor(config: UnifiedShareControllerConfig) {
    super({
      status: "idle",
      sharedLink: null,
      collaborators: [],
      activeTab: "link",
      updatingLink: false,
      error: null,
    });
    this.config = { itemType: "file", ...config };
  }

  private update(patch: Partial<UnifiedShareState>): void {
    this.setState({ ...this.state, ...patch });
    this.emit("stateChanged", { state: this.state });
  }

  private toMessage(caught: unknown, fallback: string): string {
    return caught instanceof Error ? caught.message : fallback;
  }

  /** Load the item's shared link and collaborators. No-op while any request is in flight. */
  async load(): Promise<void> {
    if (this.inFlight) {
      return;
    }

    this.inFlight = true;
    this.update({ status: "loading", error: null });
    try {
      const shareState = await this.config.dataSource.getShareState({
        itemId: this.config.itemId,
        itemType: this.config.itemType,
      });
      this.update({
        status: "ready",
        sharedLink: shareState.sharedLink,
        collaborators: shareState.collaborators,
      });
      this.emit("loaded", { sharedLink: shareState.sharedLink, collaborators: shareState.collaborators });
    } catch (caught) {
      const error = this.toMessage(caught, "Failed to load share settings");
      this.update({ status: "error", error });
      this.emit("error", { error });
    } finally {
      this.inFlight = false;
    }
  }

  /** Change the shared-link access level through the data source. No-op while any request is in flight. */
  async setAccess(access: NonNullable<SharedLinkState["access"]>): Promise<void> {
    if (this.inFlight) {
      return;
    }

    const nextLink: SharedLinkState = { ...(this.state.sharedLink ?? {}), access };
    this.inFlight = true;
    this.update({ updatingLink: true, error: null });
    try {
      const shareState = await this.config.dataSource.updateSharedLink({
        itemId: this.config.itemId,
        itemType: this.config.itemType,
        sharedLink: nextLink,
      });
      this.update({
        updatingLink: false,
        sharedLink: shareState.sharedLink,
        collaborators: shareState.collaborators,
      });
      this.emit("linkChanged", { sharedLink: shareState.sharedLink });
    } catch (caught) {
      const error = this.toMessage(caught, "Failed to update the shared link");
      this.update({ updatingLink: false, error });
      this.emit("error", { error });
    } finally {
      this.inFlight = false;
    }
  }

  setActiveTab(tab: UnifiedShareTab): void {
    if (tab !== this.state.activeTab) {
      this.update({ activeTab: tab });
    }
  }
}
