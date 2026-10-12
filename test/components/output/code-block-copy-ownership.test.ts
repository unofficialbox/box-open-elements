// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeBlock } from "../../../src/components/output/code-block.js";
const flush = async () => { for (let i=0;i<10;i++) await Promise.resolve(); };
const pending = () => { let resolve!: () => void, reject!: (e: Error) => void; const promise = new Promise<void>((yes,no)=>{resolve=yes;reject=no;}); return {promise,resolve,reject}; };
const mount = (slot = false) => { const e = new CodeBlock(); e.code = "Alpha synthetic"; if(slot)e.textContent="Alpha slotted";document.body.append(e);return e; };
const click = (e: CodeBlock) => e.shadowRoot!.querySelector<HTMLButtonElement>('[part="copy"]')!.click();
const state = (e: CodeBlock) => e.shadowRoot!.querySelector<HTMLElement>('[part="copy"]')!.dataset.copied;
const clipboard = (writeText: (text:string)=>Promise<void>) => Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText}});
afterEach(()=>{document.body.replaceChildren();Reflect.deleteProperty(navigator,"clipboard");vi.useRealTimers();vi.restoreAllMocks();});

describe("CodeBlock copy source and completion ownership",()=>{
  for (const flow of ["replace","reconnect","slot-text","slot-child","attribute-ABA","slot-ABA"]) {
    it.each(["success","failure"])(`ignores stale ${flow} clipboard %s`,async outcome=>{
      const request=pending();clipboard(()=>request.promise);const e=mount(flow.startsWith("slot"));await flush();
      const events=vi.fn();e.addEventListener("code-copied",events);click(e);
      if(flow==="replace")e.code="Beta synthetic";
      if(flow==="reconnect"){e.remove();document.body.append(e);}
      if(flow==="slot-text")e.firstChild!.textContent="Beta slotted";
      if(flow==="slot-child"){const span=document.createElement("span");span.textContent="Beta slotted";e.replaceChildren(span);}
      if(flow==="attribute-ABA"){e.code="Beta synthetic";e.code="Alpha synthetic";}
      if(flow==="slot-ABA"){e.firstChild!.textContent="Beta slotted";e.firstChild!.textContent="Alpha slotted";}
      if(outcome==="success")request.resolve();else request.reject(new Error("synthetic denied"));await flush();
      expect(events).not.toHaveBeenCalled();expect(state(e)).toBe("false");
    });
  }
  it("copies the exact visible slotted snippet, preserving highlight nodes and whitespace",async()=>{
    const write=vi.fn(async()=>{});clipboard(write);const e=new CodeBlock();e.code="Hidden attribute";
    const span=document.createElement("span");span.textContent="  <synthetic>\n";const tail=document.createTextNode("  Beta  ");e.append(span,tail);document.body.append(e);
    const before=[...e.childNodes];click(e);await flush();
    expect(write).toHaveBeenCalledExactlyOnceWith("  <synthetic>\n  Beta  ");expect([...e.childNodes]).toEqual(before);expect(span.parentNode).toBe(e);expect(state(e)).toBe("true");
  });
  it("uses attribute fallback again after assigned content is removed",async()=>{
    const write=vi.fn(async()=>{});clipboard(write);const e=mount(true);await flush();e.replaceChildren();click(e);await flush();
    expect(write).toHaveBeenCalledExactlyOnceWith("Alpha synthetic");expect(state(e)).toBe("true");
  });
  it("keeps current copy valid through identical echoes, presentation edits and hidden fallback updates",async()=>{
    const request=pending();const write=vi.fn(()=>request.promise);clipboard(write);const e=mount(true);click(e);
    e.code="Hidden updated attribute";e.label="Current label";e.copyLabel="Copy synthetic";e.language="ts";
    request.resolve();await flush();expect(write).toHaveBeenCalledExactlyOnceWith("Alpha slotted");expect(state(e)).toBe("true");
  });
  it("confirms only the newest copy request while preserving its failure",async()=>{
    const first=pending(),second=pending();const write=vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);clipboard(write);const e=mount();await flush();
    const events=vi.fn();e.addEventListener("code-copied",events);click(e);click(e);second.reject(new Error("synthetic denied"));await flush();first.resolve();await flush();
    expect(events).toHaveBeenCalledTimes(1);expect(events.mock.calls[0]![0].detail).toEqual({copied:false});expect(state(e)).toBe("false");
  });
  it("resets confirmed UI on replacement/detach and still confirms current valid copies",async()=>{
    vi.useFakeTimers();clipboard(async()=>{});const e=mount();const events=vi.fn();e.addEventListener("code-copied",events);click(e);await flush();expect(state(e)).toBe("true");
    e.code="Beta synthetic";expect(state(e)).toBe("false");expect(events).toHaveBeenCalledTimes(1);
    click(e);await flush();expect(state(e)).toBe("true");await vi.advanceTimersByTimeAsync(1600);expect(state(e)).toBe("false");
    click(e);await flush();e.remove();document.body.append(e);expect(state(e)).toBe("false");
  });
});
