import { Controller } from "../../core/controller.js";
import type {
  WorkItem,
  WorkQueueEvents,
  WorkQueueFilters,
  WorkQueueMutationKind,
  WorkQueueSessionConfig,
  WorkQueueState,
} from "./types.js";

const createInitialState = (config: WorkQueueSessionConfig): WorkQueueState => ({
  connected: false,
  loading: false,
  items: [],
  filters: { ...(config.filters ?? {}) },
  error: null,
});

/**
 * Headless work-queue session shared by both projections (`box-work-queue`
 * and `box-workload-board`): filtered loads with abort-superseded requests,
 * and the four governed mutations (claim / reassign / complete / escalate)
 * with reload-on-success — the transport owns the actual state transition.
 */
export class WorkQueueController extends Controller<WorkQueueState, WorkQueueEvents> {
  readonly config: WorkQueueSessionConfig;

  private activeLoadRequestId = 0;

  private activeLoadAbortController: AbortController | null = null;

  constructor(config: WorkQueueSessionConfig) {
    super(createInitialState(config));
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.state.connected) {
      return;
    }

    this.setState({ ...this.state, connected: true });
    this.emit("connected", undefined);
    await this.reload();
  }

  disconnect(): void {
    if (!this.state.connected) {
      return;
    }

    this.activeLoadRequestId += 1;
    this.activeLoadAbortController?.abort();
    this.activeLoadAbortController = null;
    this.setState(createInitialState(this.config));
    this.emit("disconnected", undefined);
  }

  /** Merge a filter patch (undefined values clear a filter) and reload. */
  async setFilters(patch: WorkQueueFilters): Promise<void> {
    const filters: WorkQueueFilters = { ...this.state.filters };
    for (const [key, value] of Object.entries(patch) as Array<
      [keyof WorkQueueFilters, WorkQueueFilters[keyof WorkQueueFilters]]
    >) {
      if (value === undefined) {
        delete filters[key];
      } else {
        (filters as Record<string, unknown>)[key] = value;
      }
    }

    this.setState({ ...this.state, filters });
    this.emit("filtersChanged", { filters });

    if (this.state.connected) {
      await this.reload();
    }
  }

  async reload(): Promise<void> {
    if (!this.state.connected) {
      return;
    }

    const requestId = this.activeLoadRequestId + 1;
    this.activeLoadRequestId = requestId;
    this.activeLoadAbortController?.abort();
    const abortController = typeof AbortController === "function" ? new AbortController() : null;
    this.activeLoadAbortController = abortController;

    this.setState({ ...this.state, loading: true, error: null });
    this.emit("loadingChanged", { loading: true });

    try {
      const result = await this.config.transport.loadItems({
        filters: this.state.filters,
        token: this.config.token,
        ...(abortController ? { signal: abortController.signal } : {}),
      });
      if (requestId !== this.activeLoadRequestId) {
        return;
      }

      this.setState({ ...this.state, items: result.items, loading: false });
      this.emit("loadingChanged", { loading: false });
      this.emit("itemsChanged", { items: result.items });
    } catch (error) {
      if (requestId !== this.activeLoadRequestId) {
        return;
      }
      const message = error instanceof Error ? error.message : "Failed to load work items";
      this.setState({ ...this.state, loading: false, error: message });
      this.emit("loadingChanged", { loading: false });
      this.emit("loadFailed", { message });
    } finally {
      if (this.activeLoadAbortController === abortController) {
        this.activeLoadAbortController = null;
      }
    }
  }

  getItem(itemId: string): WorkItem | undefined {
    return this.state.items.find(item => item.id === itemId);
  }

  /** Claim an item for `assigneeId` (typically the current user). */
  async claimItem(itemId: string, assigneeId: string): Promise<WorkItem | null> {
    const claimItem = this.config.transport.claimItem;
    if (!claimItem) {
      throw new Error("Work-queue transport does not support claim");
    }
    return this.runMutation("claim", itemId, () =>
      claimItem({ itemId, assigneeId, token: this.config.token }),
    );
  }

  async reassignItem(itemId: string, assigneeId: string): Promise<WorkItem | null> {
    const reassignItem = this.config.transport.reassignItem;
    if (!reassignItem) {
      throw new Error("Work-queue transport does not support reassign");
    }
    return this.runMutation("reassign", itemId, () =>
      reassignItem({ itemId, assigneeId, token: this.config.token }),
    );
  }

  async completeItem(itemId: string): Promise<WorkItem | null> {
    const completeItem = this.config.transport.completeItem;
    if (!completeItem) {
      throw new Error("Work-queue transport does not support complete");
    }
    return this.runMutation("complete", itemId, () =>
      completeItem({ itemId, token: this.config.token }),
    );
  }

  async escalateItem(itemId: string, reason?: string): Promise<WorkItem | null> {
    const escalateItem = this.config.transport.escalateItem;
    if (!escalateItem) {
      throw new Error("Work-queue transport does not support escalate");
    }
    return this.runMutation("escalate", itemId, () =>
      escalateItem({ itemId, reason, token: this.config.token }),
    );
  }

  private async runMutation(
    kind: WorkQueueMutationKind,
    itemId: string,
    perform: () => Promise<WorkItem>,
  ): Promise<WorkItem | null> {
    if (!this.state.connected || !this.getItem(itemId)) {
      return null;
    }

    try {
      const item = await perform();
      this.emit("itemMutated", { kind, item });
      await this.reload();
      return item;
    } catch (error) {
      const message = error instanceof Error ? error.message : `Work-queue ${kind} failed`;
      this.setState({ ...this.state, error: message });
      this.emit("mutationFailed", { kind, itemId, message });
      return null;
    }
  }
}
