/**
 * A run is a machine execution trace — a job, pipeline, or agent run —
 * rendered forward-chronologically. This is deliberately not
 * `box-timeline`: that surface is an append-only *human* activity feed
 * (newest first, actors, comments); a run reads top-down, has exactly one
 * step in flight, and a failure shadows everything queued behind it.
 */

export type RunStepStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "warning"
  | "failed"
  | "skipped";

export type RunStatus = "pending" | "running" | "completed" | "failed";

/** A nested unit of work under a step, with optional live progress. */
export interface RunChildTask {
  id: string;
  label: string;
  /** 0–100; omit for indeterminate work that only has a status. */
  progress?: number;
  status?: RunStepStatus;
}

export interface RunStep {
  id: string;
  title: string;
  /** Expandable detail under the title. */
  description?: string;
  /**
   * Explicit status wins. Absent, the status derives from timestamps and
   * the failure shadow — see `resolveRunSteps`.
   */
  status?: RunStepStatus;
  /** ISO timestamps; duration renders when both are present. */
  startedAt?: string;
  finishedAt?: string;
  children?: RunChildTask[];
}

export interface ResolvedRunStep {
  step: RunStep;
  status: RunStepStatus;
  /** 1-based position, for "step 2 of 5" phrasing. */
  position: number;
}

export interface RunResolution {
  steps: ResolvedRunStep[];
  status: RunStatus;
  total: number;
  /** Steps in a terminal state (succeeded, warning, failed, or skipped). */
  settled: number;
}

const STEP_STATUSES = new Set<RunStepStatus>([
  "pending",
  "running",
  "succeeded",
  "warning",
  "failed",
  "skipped",
]);

/** Attribute payloads are author input — validate every record. */
export const isRunStepRecord = (value: unknown): value is RunStep => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const step = value as Record<string, unknown>;
  if (
    typeof step.id !== "string" ||
    step.id.length === 0 ||
    typeof step.title !== "string" ||
    step.title.length === 0
  ) {
    return false;
  }
  if (step.status !== undefined && !STEP_STATUSES.has(step.status as RunStepStatus)) {
    return false;
  }
  // A non-string description would reach escapeHtml and throw mid-render.
  if (step.description !== undefined && typeof step.description !== "string") {
    return false;
  }
  if (step.children !== undefined) {
    if (!Array.isArray(step.children)) {
      return false;
    }
    for (const entry of step.children) {
      const child = entry as Record<string, unknown> | null;
      if (
        typeof child !== "object" ||
        child === null ||
        typeof child.id !== "string" ||
        typeof child.label !== "string" ||
        (child.progress !== undefined && typeof child.progress !== "number") ||
        (child.status !== undefined && !STEP_STATUSES.has(child.status as RunStepStatus))
      ) {
        return false;
      }
    }
  }
  return true;
};

const TERMINAL = new Set<RunStepStatus>(["succeeded", "warning", "failed", "skipped"]);

/**
 * The run rules, pure and DOM-free, so a host can drive notifications or a
 * "retry from here" affordance from the same function the surface renders.
 *
 * Per step, in priority order:
 * 1. An explicit `status` wins.
 * 2. A failure shadows what is queued behind it: steps after a failed step
 *    are `skipped` — a dead run must not show work as still coming, the
 *    same rule `resolveCeremony` applies after a decline.
 * 3. `finishedAt` ⇒ succeeded; `startedAt` alone ⇒ running; neither ⇒ pending.
 */
export const resolveRunSteps = (steps: readonly RunStep[]): RunResolution => {
  let failed = false;
  const resolved = steps.map((step, index) => {
    let status: RunStepStatus;
    if (step.status) {
      status = step.status;
    } else if (failed) {
      status = "skipped";
    } else if (step.finishedAt) {
      status = "succeeded";
    } else if (step.startedAt) {
      status = "running";
    } else {
      status = "pending";
    }
    // An explicit failed also shadows what follows; an explicit status on a
    // later step still overrides the shadow (rule 1 beats rule 2).
    if (status === "failed") {
      failed = true;
    }
    return { step, status, position: index + 1 };
  });

  const settled = resolved.filter(entry => TERMINAL.has(entry.status)).length;
  const anyRunning = resolved.some(entry => entry.status === "running");
  const status: RunStatus = failed
    ? "failed"
    : anyRunning
      ? "running"
      : resolved.length > 0 && settled === resolved.length
        ? "completed"
        : settled > 0
          ? "running"
          : "pending";

  return { steps: resolved, status, total: resolved.length, settled };
};

/** One line a host can put in a toast or heading — same rules as the surface. */
export const formatRunSummary = (resolution: RunResolution): string => {
  if (resolution.total === 0) {
    return "No steps";
  }
  if (resolution.status === "failed") {
    const failedStep = resolution.steps.find(entry => entry.status === "failed");
    return failedStep ? `Failed at ${failedStep.step.title}` : "Failed";
  }
  if (resolution.status === "completed") {
    const warnings = resolution.steps.filter(entry => entry.status === "warning").length;
    return warnings > 0
      ? `Completed with ${String(warnings)} warning${warnings === 1 ? "" : "s"}`
      : "Completed";
  }
  if (resolution.status === "running") {
    const runningStep = resolution.steps.find(entry => entry.status === "running");
    return runningStep
      ? `Running ${runningStep.step.title} — step ${String(runningStep.position)} of ${String(resolution.total)}`
      : `${String(resolution.settled)} of ${String(resolution.total)} steps done`;
  }
  return "Not started";
};

/**
 * "4m 12s"-style duration between two ISO timestamps; empty when either is
 * missing or unparseable, so callers can simply omit the segment.
 */
export const formatRunDuration = (startedAt?: string, finishedAt?: string): string => {
  if (!startedAt || !finishedAt) {
    return "";
  }
  const start = Date.parse(startedAt);
  const finish = Date.parse(finishedAt);
  if (Number.isNaN(start) || Number.isNaN(finish) || finish < start) {
    return "";
  }
  const totalSeconds = Math.round((finish - start) / 1000);
  if (totalSeconds < 60) {
    return `${String(totalSeconds)}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) {
    return seconds ? `${String(minutes)}m ${String(seconds)}s` : `${String(minutes)}m`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${String(hours)}h ${String(rest)}m` : `${String(hours)}h`;
};
