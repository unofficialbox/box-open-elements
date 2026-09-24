import { afterEach, expect, it, vi } from "vitest";
import { CallConsole } from "../../src/patterns/call-console/call-console.js";
import { callConsoleDemoHtml, setupCallConsoleDemo } from "../../storybook/fixtures/call-console.js";
afterEach(()=>{document.body.replaceChildren();vi.useRealTimers();});
it("demonstrates multiple services, pending updates, clear and reset without network",async()=>{
  vi.useFakeTimers();const root=document.createElement("div");root.innerHTML=callConsoleDemoHtml;document.body.append(root);
  const cleanup=setupCallConsoleDemo(root);await Promise.resolve();await Promise.resolve();
  const el=root.querySelector<CallConsole>("box-call-console")!;const controller=el.callController!;
  expect(controller.entries).toHaveLength(5);expect(new Set(controller.entries.map(e=>e.service)).size).toBe(3);
  root.querySelector<HTMLElement>("[data-simulate]")!.click();expect(controller.entries[0]?.pending).toBe(true);
  await vi.advanceTimersByTimeAsync(1200);expect(controller.entries[0]?.pending).toBe(false);
  await controller.clear();expect(controller.entries).toHaveLength(0);
  root.querySelector<HTMLElement>("[data-reset]")!.click();expect(controller.entries).toHaveLength(5);
  root.querySelector<HTMLElement>("[data-simulate]")!.click();cleanup();await vi.advanceTimersByTimeAsync(1500);
  expect(controller.entries[0]?.pending).toBe(true);
});
it.each(["empty","connecting","reconnecting","unavailable"] as const)("renders %s explicitly",async mode=>{
  const root=document.createElement("div");root.innerHTML=callConsoleDemoHtml;document.body.append(root);
  const cleanup=setupCallConsoleDemo(root,mode);await Promise.resolve();await Promise.resolve();
  const controller=root.querySelector<CallConsole>("box-call-console")!.callController!;
  expect(mode==="empty" ? controller.entries.length : controller.connection).toBe(mode==="empty" ? 0 : mode);
  cleanup();
});
