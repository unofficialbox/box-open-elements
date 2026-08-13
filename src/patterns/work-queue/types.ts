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

/** Urgency buckets for the triage list, most urgent first. */
export type DueBucket = "overdue" | "today" | "this-week" | "later" | "none";

export const DUE_BUCKET_ORDER: readonly DueBucket[] = ["overdue", "today", "this-week", "later", "none"];

export const DUE_BUCKET_LABELS: Record<DueBucket, string> = {
  overdue: "Overdue",
  today: "Due today",
  "this-week": "Due this week",
  later: "Later",
  none: "No due date",
};

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Bucket a due timestamp relative to `now`. Pure and timezone-independent:
 * callers supply the reference time and day boundaries resolve against the
 * reference time's UTC day, so the same inputs bucket identically on every
 * host. A host that wants local-day semantics offsets the reference time it
 * passes.
 */
export const resolveDueBucket = (dueAt: string | undefined, now: Date): DueBucket => {
  if (!dueAt) {
    return "none";
  }
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) {
    return "none";
  }

  if (due.getTime() < now.getTime()) {
    return "overdue";
  }

  const endOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) - 1;
  if (due.getTime() <= endOfToday) {
    return "today";
  }

  if (due.getTime() <= endOfToday + 6 * DAY_MS) {
    return "this-week";
  }

  return "later";
};

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
    if (resolveDueBucket(item.dueAt, now) === "overdue" && item.status !== "completed") {
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
