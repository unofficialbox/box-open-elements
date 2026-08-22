export type WorkItemStatus = "open" | "in-progress" | "completed" | "escalated";

export type WorkItemPriority = "low" | "medium" | "high" | "urgent";

export type WorkItemRisk = "low" | "medium" | "high";

export interface WorkItemAssignee {
  id: string;
  name: string;
  initials?: string;
}

/**
 * One unit of governed work: a review, approval, signature, or intake task
 * bound to an entity (typically a contract). `type` is an open vocabulary —
 * hosts add their own kinds without a schema change.
 */
export interface WorkItem {
  id: string;
  title: string;
  type: string;
  status: WorkItemStatus;
  entityRef?: { id: string; label?: string };
  assignee?: WorkItemAssignee | null;
  priority?: WorkItemPriority;
  riskLevel?: WorkItemRisk;
  /** ISO due timestamp; drives the urgency buckets and SLA affordances. */
  dueAt?: string;
  createdAt?: string;
}

export interface WorkQueueFilters {
  assigneeId?: string;
  status?: WorkItemStatus;
  type?: string;
  riskLevel?: WorkItemRisk;
}

export interface WorkQueueLoadRequest {
  filters?: WorkQueueFilters;
  token: string;
  signal?: AbortSignal;
}

export interface WorkQueueMutationRequest {
  itemId: string;
  token: string;
}

/**
 * One narrow contract for queue data and the four governed mutations. All
 * mutations are optional capabilities: the shells only render actions for
 * capabilities the transport provides, and invoking a missing capability on
 * the controller throws a descriptive error (a programming error, not a
 * runtime state).
 */
export interface WorkQueueTransport {
  loadItems(request: WorkQueueLoadRequest): Promise<{ items: WorkItem[] }>;
  claimItem?(request: WorkQueueMutationRequest & { assigneeId: string }): Promise<WorkItem>;
  reassignItem?(request: WorkQueueMutationRequest & { assigneeId: string }): Promise<WorkItem>;
  completeItem?(request: WorkQueueMutationRequest): Promise<WorkItem>;
  escalateItem?(request: WorkQueueMutationRequest & { reason?: string }): Promise<WorkItem>;
}

export interface WorkQueueSessionConfig {
  token: string;
  transport: WorkQueueTransport;
  filters?: WorkQueueFilters;
  /** Team roster for workload lanes; assignees found on items fill any gaps. */
  team?: WorkItemAssignee[];
}

export type WorkQueueMutationKind = "claim" | "reassign" | "complete" | "escalate";

export interface WorkQueueState {
  connected: boolean;
  loading: boolean;
  items: WorkItem[];
  filters: WorkQueueFilters;
  error: string | null;
}

export interface WorkQueueEvents {
  connected: undefined;
  disconnected: undefined;
  loadingChanged: { loading: boolean };
  itemsChanged: { items: WorkItem[] };
  filtersChanged: { filters: WorkQueueFilters };
  loadFailed: { message: string };
  itemMutated: { kind: WorkQueueMutationKind; item: WorkItem };
  mutationFailed: { kind: WorkQueueMutationKind; itemId: string; message: string };
}

/**
 * Urgency buckets live with `box-due-badge` — patterns compose components,
 * not the other way round — and are re-exported here so this pattern's
 * public import path is unchanged.
 */
export {
  DUE_BUCKET_LABELS,
  DUE_BUCKET_ORDER,
  daysUntilDue,
  formatDueLabel,
  resolveDueBucket,
} from "../../components/feedback/due-types.js";
export type { DueBucket } from "../../components/feedback/due-types.js";

import { resolveDueBucket as bucketOf } from "../../components/feedback/due-types.js";

export interface WorkloadLane {
  /** Null for the unassigned lane. */
  assignee: WorkItemAssignee | null;
  items: WorkItem[];
  total: number;
  overdue: number;
  inProgress: number;
}

/**
 * Group items into per-assignee lanes for the supervisor board. The roster
 * fixes lane order (people with zero items still get a lane — visible spare
 * capacity); assignees found only on items are appended, and unassigned
 * items land in a trailing lane.
 */
export const summarizeWorkload = (
  items: readonly WorkItem[],
  team: readonly WorkItemAssignee[],
  now: Date,
): WorkloadLane[] => {
  const lanes = new Map<string, WorkloadLane>();
  const laneFor = (assignee: WorkItemAssignee | null): WorkloadLane => {
    const key = assignee?.id ?? "";
    let lane = lanes.get(key);
    if (!lane) {
      lane = { assignee, items: [], total: 0, overdue: 0, inProgress: 0 };
      lanes.set(key, lane);
    }
    return lane;
  };

  for (const member of team) {
    laneFor(member);
  }
  for (const item of items) {
    const lane = laneFor(item.assignee ?? null);
    lane.items.push(item);
    lane.total += 1;
    if (bucketOf(item.dueAt, now) === "overdue" && item.status !== "completed") {
      lane.overdue += 1;
    }
    if (item.status === "in-progress") {
      lane.inProgress += 1;
    }
  }

  const ordered = [...lanes.values()].filter(lane => lane.assignee !== null);
  const unassigned = lanes.get("");
  if (unassigned && unassigned.total > 0) {
    ordered.push(unassigned);
  }
  return ordered;
};
