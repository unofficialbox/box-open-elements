import { CallConsoleController, type CallConsoleTransport } from "../../src/patterns/call-console/controller.js";
import type { CallConnection, CallEntry, CallEvent } from "../../src/patterns/call-console/types.js";
import type { CallConsole } from "../../src/patterns/call-console/call-console.js";

const base: CallEntry = {
  id: "files", startedAt: Date.UTC(2026, 8, 24, 10, 30), durationMs: 184, pending: false,
  service: "Box", summary: "List contract files", method: "GET", url: "https://api.box.com/2.0/folders/123/items",
  requestHeaders: { authorization: "[redacted]", accept: "application/json" },
  status: 200, statusText: "OK", responseHeaders: { "content-type": "application/json", "x-request-id": "demo-request-1" },
  responseBody: JSON.stringify({ total_count: 2, entries: [{ id: "101", name: "Services agreement.pdf" }, { id: "102", name: "Order form.pdf" }] }, null, 2),
};
export const callConsoleFixtures: CallEntry[] = [
  base,
  { ...base, id: "tool", summary: "tools/call get_file", method: "POST", url: "https://api.box.com/mcp", durationMs: 142,
    requestBody: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "get_file", arguments: { file_id: "999" } } }, null, 2),
    responseBody: JSON.stringify({ jsonrpc: "2.0", id: 1, result: { isError: true, content: [{ type: "text", text: "File not found or not accessible." }] } }, null, 2), rpcError: "File not found or not accessible." },
  { ...base, id: "crm", service: "Salesforce", summary: "Retrieve account record", url: "https://example.my.salesforce.com/services/data/v64.0/sobjects/Account/demo", durationMs: 76, status: 403, statusText: "Forbidden", responseBody: JSON.stringify({ errorCode: "INSUFFICIENT_ACCESS", message: "The connected user cannot access this record." }, null, 2) },
  { ...base, id: "stream", summary: "Open optional MCP event stream", url: "https://api.box.com/mcp", durationMs: 24, status: 405, statusText: "Method Not Allowed", responseBody: "", expected: "This MCP server does not support an optional GET event stream. Tool requests remain available." },
  { ...base, id: "pending", service: "Agent", summary: "Extract contract terms", method: "POST", url: "https://agent.example.test/extract", pending: true, status: 0, statusText: "", requestBody: JSON.stringify({ fileId: "101", fields: ["effective_date", "renewal_term"] }, null, 2), responseBody: undefined },
];
export type CallConsoleDemoState = CallConnection | "empty";
export const callConsoleDemoHtml = `<div style="display:grid;gap:12px;min-width:0"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><box-button data-simulate label="Simulate request" tone="neutral"></box-button><box-button data-reset label="Reset demo" tone="neutral"></box-button><small>Simulated data · no network requests</small></div><box-call-console></box-call-console></div>`;
export const callConsoleSetupCode = `import { CallConsole, CallConsoleController, createCallConsoleTransport } from "@unofficialbox/box-open-elements/call-console";

CallConsole.register(); // Explicit use also keeps registration in optimized builds.
const consoleView = document.querySelector("box-call-console");
const controller = new CallConsoleController(createCallConsoleTransport("/calls"));
consoleView.callController = controller;
await controller.connect();

// Protect /calls and /calls/stream with developer-only authorization.
// On route teardown (the host owns the controller lifecycle):
// controller.destroy();`;

export function setupCallConsoleDemo(root: HTMLElement, mode: CallConsoleDemoState = "live"): () => void {
  let rows = mode === "empty" ? [] : structuredClone(callConsoleFixtures);
  let emit: ((event: CallEvent) => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let serial = 0;
  const transport: CallConsoleTransport = {
    async snapshot(signal) {
      if (mode === "unavailable") throw new Error("404");
      if (mode === "connecting") return new Promise<CallEntry[]>((_, reject) => {
        signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      });
      return structuredClone(rows);
    },
    subscribe(onEvent, onState) { emit = onEvent; onState(mode === "reconnecting" ? "reconnecting" : "live"); return () => { emit = undefined; }; },
    async clear() { rows = []; if (timer) clearTimeout(timer); timer=undefined; },
  };
  const controller = new CallConsoleController(transport);
  root.querySelector<CallConsole>("box-call-console")!.callController = controller;
  const simulate = (): void => {
    if (timer) return;
    const row = { ...base, id: `simulated-${++serial}`, startedAt: Date.now(), summary: "Refresh folder contents", pending: true, status: 0, responseBody: undefined };
    rows = [row, ...rows]; emit?.({ type: "call", entry: row });
    timer = setTimeout(() => { const done = { ...row, pending: false, status: 200, durationMs: 1200, responseBody: base.responseBody }; rows = rows.map(r => r.id === done.id ? done : r); emit?.({ type: "call", entry: done }); timer = undefined; }, 1200);
  };
  const reset = (): void => { if (timer) clearTimeout(timer); timer=undefined; rows = structuredClone(callConsoleFixtures); emit?.({ type: "snapshot", entries: rows }); };
  const simulateButton = root.querySelector<HTMLElement>("[data-simulate]");
  const resetButton = root.querySelector<HTMLElement>("[data-reset]");
  for (const button of [simulateButton, resetButton]) button?.toggleAttribute("disabled", mode === "connecting" || mode === "unavailable");
  simulateButton?.addEventListener("click", simulate); resetButton?.addEventListener("click", reset);
  void controller.connect();
  return () => { if (timer) clearTimeout(timer); simulateButton?.removeEventListener("click", simulate); resetButton?.removeEventListener("click", reset); controller.destroy(); };
}
