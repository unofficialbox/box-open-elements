import { AgentChatController } from "../../src/patterns/agent-chat/controller.js";
import { AgentWorkspaceController } from "../../src/patterns/agent-workspace/controller.js";
import type { AgentWorkspace } from "../../src/patterns/agent-workspace/agent-workspace.js";
import type { AgentActionProposal, AgentChatTransport } from "../../src/patterns/agent-chat/types.js";

export const workspaceDemoModes = ["overview", "streaming", "approval", "failure", "empty"] as const;
export type WorkspaceDemoMode = typeof workspaceDemoModes[number];
const proposal: AgentActionProposal = {
  id: "share-review", title: "Share the review package", summary: "Grant the review team viewer access. This is a simulated action.",
  params: [{ label: "Folder", value: "Contract review" }, { label: "Permission", value: "Viewer" }],
};

/** Abortable delays remove both timers and listeners on completion or teardown. */
const pause = (ms: number, signal?: AbortSignal): Promise<void> => new Promise(resolve => {
  if (signal?.aborted) { resolve(); return; }
  const finish = (): void => { clearTimeout(timer); signal?.removeEventListener("abort", finish); resolve(); };
  const timer = setTimeout(finish, ms);
  signal?.addEventListener("abort", finish, { once: true });
});

export function createWorkspaceDemoTransport(mode: WorkspaceDemoMode, delay: () => number): AgentChatTransport {
  return {
    async sendMessage(request) {
      const emit = request.onEvent;
      emit({ kind: "context", context: { record: "CTR-1042", folder: "Contract review", environment: "Simulated" } });
      emit({ kind: "delta", text: "Reviewing the contract package. " });
      emit({ kind: "todos", todos: [{ id: "review", content: "Check terms and sources", status: "in_progress" }] });
      emit({ kind: "trace", step: { id: "review", title: "Box · Review package", status: "running" } });
      if (delay()) await pause(delay(), request.signal);
      if (request.signal?.aborted) return;
      if (mode === "failure") throw new Error("Simulated access failure: the connected user cannot read this package.");
      emit({ kind: "delta", text: "The agreement is ready for a human review; renewal terms need confirmation." });
      emit({ kind: "block", block: { id: "terms", type: "facts", title: "Extracted terms", rows: [{ label: "Value", value: "$240,000" }, { label: "Renewal", value: "Annual, subject to review" }] } });
      emit({ kind: "block", block: { id: "checks", type: "checks", rows: [{ label: "Source available", status: "pass" }, { label: "Renewal terms", status: "warn", detail: "Confirm the notice period before sharing." }] } });
      emit({ kind: "citation", citation: { id: "agreement", label: "Services agreement.pdf" } });
      emit({ kind: "todos", todos: [{ id: "review", content: "Check terms and sources", status: "completed" }] });
      emit({ kind: "trace", step: { id: "review", title: "Box · Review package", status: "succeeded" } });
      if (mode === "approval") emit({ kind: "proposal", proposal: { ...proposal } });
      else emit({ kind: "options", options: [{ label: "Review renewal terms", prompt: "Review the renewal terms" }] });
      emit({ kind: "done", status: mode === "approval" ? "needs_input" : "complete" });
    },
    async resolveAction(request) {
      // Deliberately model approval != successful execution; no real write occurs.
      return { ...proposal, decision: request.decision,
        ...(request.decision === "approved" ? { outcome: "failed" as const, note: "Simulated permission failure. No access was granted." } : { note: "Sharing was cancelled. No access was changed." }) };
    },
  };
}

export const workspaceDemoHtml = `<div data-workspace-demo style="display:flex;flex-direction:column;gap:12px;min-width:0;background:var(--boe-token-surface-surface,#fff);color:var(--boe-token-text-text,#222)">
<style>[data-workspace-demo]:fullscreen{padding:16px;overflow:auto}[data-workspace-demo]:fullscreen box-agent-workspace{height:auto!important;flex:1;min-height:0}</style>
<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><box-button data-run label="Run scenario" tone="neutral"></box-button><box-button data-expand label="Expand workspace" tone="neutral"></box-button><small>Simulated data · no network requests. Expand for the desktop three-pane layout.</small></div>
<box-agent-workspace style="height:600px;min-height:0" viewer-key="docs-workspace"></box-agent-workspace></div>`;

export const workspaceSetupCode = `import { AgentWorkspace, AgentWorkspaceController, AgentChatController } from "@unofficialbox/box-open-elements";

AgentWorkspace.register();
// Implement your authorized AgentChatTransport. Never embed a server secret.
function mountWorkspace(host, transport, token) {
  const workspace = new AgentWorkspaceController(() =>
    new AgentChatController({ token, transport, agentName: "Review assistant" }));
  workspace.newChat();
  host.workspaceController = workspace;
  return () => {
    host.workspaceController = null;
    workspace.destroy(); // aborts streams and tears down every owned session
  };
}
// On route mount: const dispose = mountWorkspace(host, transport, token);
// On route teardown: dispose();`;

export function setupWorkspaceDemo(root: HTMLElement, mode: WorkspaceDemoMode = "overview"): () => void {
  const host = root.querySelector<AgentWorkspace>("box-agent-workspace")!;
  const container = root.querySelector<HTMLElement>("[data-workspace-demo]")!;
  let seeding = true;
  const workspace = new AgentWorkspaceController(() => new AgentChatController({
    token: "simulated-only", agentName: "Review assistant",
    transport: createWorkspaceDemoTransport(mode, () => seeding ? 0 : 1800),
  }));
  host.workspaceController = workspace;
  if (mode === "empty") workspace.newChat();
  else {
    const first = workspace.newChat();
    void first.controller.send("Review the services agreement");
    const second = workspace.newChat();
    void second.controller.send("Check the renewal notice period");
    workspace.select(first.id);
  }
  seeding = false;
  const run = (): void => { const chat = workspace.chats.find(c => c.id === workspace.activeId) ?? workspace.newChat(); void chat.controller.send("Review the package again"); };
  if (mode === "streaming") run();
  const runButton = root.querySelector<HTMLElement>("[data-run]")!;
  const expandButton = root.querySelector<HTMLElement>("[data-expand]")!;
  const sync = (): void => { expandButton.setAttribute("label", document.fullscreenElement === container ? "Exit expanded view" : "Expand workspace"); };
  const expand = (): void => { void (document.fullscreenElement === container ? document.exitFullscreen() : container.requestFullscreen()).catch(() => { expandButton.setAttribute("label", "Fullscreen unavailable"); }); };
  expandButton.hidden = !document.fullscreenEnabled;
  expandButton.addEventListener("click", expand); document.addEventListener("fullscreenchange", sync);
  runButton.addEventListener("click", run);
  return () => {
    runButton.removeEventListener("click", run); expandButton.removeEventListener("click", expand); document.removeEventListener("fullscreenchange", sync);
    if (document.fullscreenElement === container) void document.exitFullscreen().catch(() => {});
    host.workspaceController = null;
    workspace.destroy();
  };
}
