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

  /** Load the item's shared link and collaborators. No-op while already loading. */
  async load(): Promise<void> {
    if (this.state.status === "loading") {
      return;
    }

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
    }
  }

  /** Change the shared-link access level through the data source. No-op while updating. */
  async setAccess(access: NonNullable<SharedLinkState["access"]>): Promise<void> {
    if (this.state.updatingLink) {
      return;
    }

    const nextLink: SharedLinkState = { ...(this.state.sharedLink ?? {}), access };
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
    }
  }

  setActiveTab(tab: UnifiedShareTab): void {
    if (tab !== this.state.activeTab) {
      this.update({ activeTab: tab });
    }
  }
}
