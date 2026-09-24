import { afterEach, expect, it, vi } from "vitest";
import { AgentWorkspace } from "../../src/patterns/agent-workspace/agent-workspace.js";
import { workspaceDemoHtml, setupWorkspaceDemo } from "../../storybook/fixtures/agent-workspace.js";
AgentWorkspace.register();

afterEach(() => { document.body.replaceChildren(); vi.useRealTimers(); vi.restoreAllMocks(); });
const mount = (mode: Parameters<typeof setupWorkspaceDemo>[1] = "overview") => {
  const root = document.createElement("div"); root.innerHTML = workspaceDemoHtml; document.body.append(root);
  const dispose = setupWorkspaceDemo(root, mode);
  const host = root.querySelector<AgentWorkspace>("box-agent-workspace")!;
  return { root, host, workspace: host.workspaceController!, dispose };
};

it("populates independent conversations, context, sources and options", async () => {
  const { host, workspace, dispose } = mount(); await Promise.resolve();
  expect(workspace.chats).toHaveLength(2);
  expect(workspace.details.context?.record).toBe("CTR-1042");
  expect(workspace.details.sources[0]?.label).toBe("Services agreement.pdf");
  expect(workspace.chats[0]!.controller.getState().messages.at(-1)?.options).toHaveLength(1);
  const chats = host.shadowRoot!.querySelectorAll("box-agent-chat");
  workspace.select(workspace.chats[1]!.id);
  expect(host.shadowRoot!.querySelectorAll("box-agent-chat")[0]).toBe(chats[0]);
  dispose(); expect(host.workspaceController).toBeNull();
  expect(workspace.chats.every(c => !c.controller.getState().connected)).toBe(true);
});

it("continues a hidden stream and cancels pending work on teardown", async () => {
  vi.useFakeTimers(); const { root, workspace, dispose } = mount("streaming");
  const first = workspace.chats[0]!;
  expect(first.controller.getState().streaming).toBe(true);
  workspace.select(workspace.chats[1]!.id);
  await vi.advanceTimersByTimeAsync(1800);
  expect(first.controller.getState().streaming).toBe(false);
  expect(first.controller.getState().messages.at(-1)?.completeness?.status).toBe("complete");
  root.querySelector<HTMLElement>("[data-run]")!.click();
  dispose(); await vi.runAllTimersAsync();
  expect(vi.getTimerCount()).toBe(0);
  expect(workspace.chats.every(c => c.controller.getState().messages.length === 0)).toBe(true);
});

it("sends the chosen follow-up in its own conversation", async () => {
  vi.useFakeTimers(); const { host, workspace, dispose } = mount(); await Promise.resolve();
  const chat = host.shadowRoot!.querySelector("box-agent-chat:not([hidden])")!;
  chat.shadowRoot!.querySelector<HTMLButtonElement>('[part="option"]')!.click();
  expect(workspace.chats[0]!.controller.getState().messages.at(-2)?.body).toBe("Review the renewal terms");
  expect(workspace.chats[1]!.controller.getState().messages).toHaveLength(2);
  dispose(); await vi.runAllTimersAsync();
});

it.each(["approved", "rejected"] as const)("models %s without claiming a real write", async decision => {
  const { workspace, dispose } = mount("approval"); await Promise.resolve();
  expect(workspace.details.approvals).toHaveLength(1);
  const chat = workspace.chats[0]!.controller;
  const result = await chat.resolveAction("share-review", decision, undefined, "agent-1");
  expect(result?.decision).toBe(decision);
  expect(result?.outcome).toBe(decision === "approved" ? "failed" : undefined);
  dispose();
});

it("renders the failure variant and an untouched empty conversation", async () => {
  const failed = mount("failure"); await Promise.resolve();
  expect(failed.workspace.chats[0]!.controller.getState().error).toContain("Simulated access failure");
  failed.dispose();
  const empty = mount("empty");
  expect(empty.workspace.chats).toHaveLength(1);
  expect(empty.workspace.chats[0]!.controller.getState().messages).toHaveLength(0);
  empty.dispose();
});
