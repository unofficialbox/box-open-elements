import { toStatusKind, type StatusKind } from "../../foundations/status/index.js";
import { resolveRunSteps, type RunStep } from "./types.js";
export interface AgentTodo { id: string; content: string; status: "pending" | "in_progress" | "completed" | "skipped"; }
export interface RunTurn { steps: RunStep[]; todos: AgentTodo[]; startedAt: number; endedAt?: number; incomplete?: boolean | string; }
export function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "";
  if (ms < 100) return "<0.1 s";
  if (ms < 10000) return `${(ms / 1000).toFixed(1)} s`;
  const seconds = Math.round(ms / 1000);
  return seconds < 60 ? `${seconds} s` : `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
}
export function splitStepTitle(title: string): { source?: string; action: string } {
  const at = title.indexOf(" · ");
  return at < 0 ? { action: title } : { source: title.slice(0, at), action: title.slice(at + 3) };
}
export function progress(turn: RunTurn, failed = false, now = Date.now(), threshold = 2000): {kind: StatusKind; label: string; elapsed?: string} {
  const resolved = resolveRunSteps(turn.steps);
  if (turn.endedAt === undefined) {
    const step = [...resolved.steps].reverse().find(s => s.status === "running");
    const label = turn.todos.find(t => t.status === "in_progress")?.content ?? (step ? splitStepTitle(step.step.title).action : "Thinking");
    const elapsed = Math.max(0, now - turn.startedAt);
    return { kind: "active", label: `${label}…`, ...(elapsed >= threshold ? {elapsed: `${Math.floor(elapsed / 1000)} s`} : {}) };
  }
  const took = formatElapsed(turn.endedAt - turn.startedAt);
  if (failed || resolved.status === "failed") return {kind: "failed", label: `Stopped after ${took}`};
  if (turn.incomplete) return {kind: "warning", label: `${typeof turn.incomplete === "string" ? turn.incomplete : "Cut short"} after ${took}`};
  const warnings = resolved.steps.filter(s => toStatusKind(s.status) === "warning").length;
  return {kind: warnings ? "warning" : "done", label: `Worked for ${took}${warnings ? ` · ${warnings} warning${warnings === 1 ? "" : "s"}` : ""}`};
}
