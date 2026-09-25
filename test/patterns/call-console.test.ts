import {afterEach,describe,it,expect,vi} from "vitest";
import {CallConsoleController,type CallConsoleTransport} from "../../src/patterns/call-console/controller.js";
import {CallConsole,copyCallText} from "../../src/patterns/call-console/call-console.js";
import {createCallConsoleTransport} from "../../src/patterns/call-console/http-transport.js";
import {callFailed,callStatus,formatCallHttp,type CallEntry,type CallEvent} from "../../src/patterns/call-console/types.js";
const entry:CallEntry={id:"1",startedAt:0,durationMs:15,pending:false,service:"Box",summary:"tools/call get_file",method:"POST",url:"https://example.com",requestHeaders:{accept:"application/json"},requestBody:"{}",status:200,statusText:"OK",responseHeaders:{},responseBody:"{}"};
afterEach(()=>{document.body.replaceChildren();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe("call console",()=>{
  it("adapts the snapshot, named SSE and delete wire contract",async()=>{
    class Events extends EventTarget {static instance:Events;onopen?:()=>void;onerror?:()=>void;close=vi.fn();constructor(readonly url:string){super();Events.instance=this;}}
    vi.stubGlobal("EventSource",Events);const fetcher=vi.fn(async()=>({ok:true,json:async()=>[entry]}));vi.stubGlobal("fetch",fetcher);
    const transport=createCallConsoleTransport();expect(await transport.snapshot(new AbortController().signal)).toEqual([entry]);
    const event=vi.fn(),state=vi.fn();const close=transport.subscribe(event,state);Events.instance.onopen?.();expect(state).toHaveBeenCalledWith("live");
    Events.instance.dispatchEvent(new MessageEvent("call",{data:JSON.stringify({type:"call",entry})}));expect(event).toHaveBeenCalledWith({type:"call",entry});
    Events.instance.dispatchEvent(new MessageEvent("call",{data:JSON.stringify(entry)}));expect(event).toHaveBeenCalledWith({type:"call",entry});
    Events.instance.dispatchEvent(new MessageEvent("snapshot",{data:JSON.stringify([entry])}));expect(event).toHaveBeenCalledWith({type:"snapshot",entries:[entry]});
    Events.instance.dispatchEvent(new MessageEvent("clear",{data:"{}"}));expect(event).toHaveBeenCalledWith({type:"clear"});
    Events.instance.dispatchEvent(new MessageEvent("call",{data:"bad"}));expect(state).toHaveBeenCalledWith("reconnecting");Events.instance.onerror?.();
    await transport.clear();expect(fetcher).toHaveBeenCalledWith("/calls",{method:"DELETE"});close();expect(Events.instance.close).toHaveBeenCalled();
    fetcher.mockImplementation(async()=>({ok:false,status:404} as any));await expect(transport.snapshot(new AbortController().signal)).rejects.toThrow("404");await expect(transport.clear()).rejects.toThrow("404");
  });
  it("counts tool errors as failures and expected responses separately",()=>{
    expect(callFailed({...entry,rpcError:"tool"})).toBe(true);expect(callStatus({...entry,rpcError:"tool"})).toBe("Tool error");
    expect(callFailed({...entry,status:405,expected:"MCP"})).toBe(false);expect(callStatus({...entry,status:405,expected:"MCP"})).toBe("Expected");
    expect(callFailed({...entry,status:302})).toBe(false);
    expect(callFailed({...entry,status:0})).toBe(true);
    expect(callFailed({...entry,pending:true,error:"network"})).toBe(true);
    expect(callFailed({...entry,error:"network",expected:"known"})).toBe(false);
    expect(callStatus({...entry,pending:true})).toBe("Pending");expect(callStatus({...entry,error:"network"})).toBe("Failed");expect(callStatus(entry)).toBe("Done");
    expect(formatCallHttp(entry)).toContain("HTTP 200 OK");expect(formatCallHttp(entry,"request")).toContain("POST https://example.com");
  });
  it("updates same-id entries, filters failures and renders response details",async()=>{
    let event!:(e:CallEvent)=>void;const close=vi.fn();
    const transport:CallConsoleTransport={snapshot:async()=>[entry],subscribe:(fn,state)=>{event=fn;state("live");return close;},clear:async()=>{}};
    const c=new CallConsoleController(transport);const el=new CallConsole();el.callController=c;document.body.append(el);await c.connect();
    expect(el.shadowRoot!.querySelector("#connection")!.textContent).toBe("Live");
    event({type:"call",entry:{...entry,rpcError:"isError"}});expect(c.entries).toHaveLength(1);
    event({type:"call",entry:{...entry,id:"2",service:"CRM"}});
    const errors=el.shadowRoot!.querySelector<HTMLInputElement>("#errors")!;errors.checked=true;errors.dispatchEvent(new Event("change"));
    expect(el.shadowRoot!.querySelectorAll('[part="call"]')).toHaveLength(1);expect(el.shadowRoot!.querySelector("#response")!.getAttribute("code")).toContain("isError");
    await c.clear();expect(c.entries).toEqual([]);c.destroy();expect(close).toHaveBeenCalled();
  });
  it("caps history and lets hosts label services, headings, and failures",async()=>{
    const c=new CallConsoleController({snapshot:async()=>[entry,{...entry,id:"2"},{...entry,id:"3"}],subscribe:()=>()=>{},clear:async()=>{}},2);
    const el=new CallConsole();el.heading="Activity";el.serviceLabels={Box:"Box API"};el.isFailed=e=>e.id==="2";el.callController=c;document.body.append(el);await c.connect();
    expect(c.entries.map(e=>e.id)).toEqual(["1","2"]);
    expect(el.shadowRoot!.querySelector("h2")?.textContent).toBe("Activity");
    expect(el.shadowRoot!.querySelector('option[value="Box"]')?.textContent).toBe("Box API");
    const errors=el.shadowRoot!.querySelector<HTMLInputElement>("#errors")!;errors.checked=true;errors.dispatchEvent(new Event("change"));
    expect(el.shadowRoot!.querySelectorAll('[part="call"]')).toHaveLength(1);
    expect(el.shadowRoot!.querySelector("#metadata")?.textContent).toContain("Box API");
    el.setAttribute("hide-heading","");expect(el.shadowRoot!.querySelector<HTMLElement>('[part="heading"]')?.hidden).toBe(true);
    c.apply({type:"call",entry:{...entry,id:"4"}});expect(c.entries.map(e=>e.id)).toEqual(["4","1"]);
    c.destroy();
  });
  it("reports absent endpoints and aborts stale connect results",async()=>{
    const c=new CallConsoleController({snapshot:async()=>{throw new Error("404");},subscribe:()=>()=>{},clear:async()=>{}});await c.connect();expect(c.connection).toBe("unavailable");
    const listener=vi.fn();const stop=c.subscribe(listener);c.apply({type:"snapshot",entries:[entry]});expect(listener).toHaveBeenCalled();stop();c.destroy();
  });
  it("uses textarea fallback when clipboard is unavailable",async()=>{
    const copy=vi.fn(()=>true);Object.defineProperty(document,"execCommand",{configurable:true,value:copy});
    expect(await copyCallText("hello")).toBe(true);expect(copy).toHaveBeenCalledWith("copy");expect(document.querySelector("textarea")).toBeNull();
  });
  it("searches safely, reports filtered emptiness, and emits selection without payloads",async()=>{
    const c=new CallConsoleController({snapshot:async()=>[entry,{...entry,id:"2",summary:"<script>secret</script>",service:"CRM"}],subscribe:(_fn,state)=>{state("live");return ()=>{};},clear:async()=>{}});
    const el=new CallConsole();el.callController=c;document.body.append(el);await c.connect();
    const selected=vi.fn();el.addEventListener("call-selected",selected);
    el.shadowRoot!.querySelectorAll<HTMLButtonElement>('[part="call"]')[1]!.click();
    expect(selected.mock.calls[0][0].detail).toEqual({id:"2"});expect(el.shadowRoot!.querySelector("script")).toBeNull();
    const search=el.shadowRoot!.querySelector<HTMLInputElement>("#search")!;search.value="nothing";search.dispatchEvent(new Event("input"));
    expect(el.shadowRoot!.querySelector("#list-empty")!.textContent).toContain("No requests match");
    expect(el.shadowRoot!.querySelector<HTMLElement>("#inspector")!.hidden).toBe(true);
    search.value="CRM";search.dispatchEvent(new Event("input"));expect(el.shadowRoot!.querySelectorAll('[part="call"]')).toHaveLength(1);
    c.destroy();
  });
  it("shows no-controller and unavailable states, and reconnects",async()=>{
    const el=new CallConsole();document.body.append(el);expect(el.shadowRoot!.querySelector("#list-empty")!.textContent).toContain("Connect a call controller");
    let fail=true;const c=new CallConsoleController({snapshot:async()=>{if(fail)throw new Error("404");return [entry];},subscribe:(_fn,state)=>{state("live");return ()=>{};},clear:async()=>{}});
    el.callController=c;await c.connect();expect(el.shadowRoot!.querySelector<HTMLElement>("#retry")!.hidden).toBe(false);
    fail=false;el.shadowRoot!.querySelector<HTMLElement>("#retry")!.click();await Promise.resolve();await Promise.resolve();expect(c.connection).toBe("live");c.destroy();
  });
  it("retains calls and reports failed clear requests",async()=>{
    const c=new CallConsoleController({snapshot:async()=>[entry],subscribe:(_fn,state)=>{state("live");return ()=>{};},clear:async()=>{throw new Error("denied");}});
    const el=new CallConsole();el.callController=c;document.body.append(el);await c.connect();el.shadowRoot!.querySelector<HTMLElement>("#clear")!.click();await Promise.resolve();await Promise.resolve();
    expect(c.entries).toHaveLength(1);expect(el.shadowRoot!.querySelector("#copy-status")!.textContent).toContain("Unable to clear");c.destroy();
  });
  it("supports keyboard request selection and preserves unchanged status glyphs",async()=>{
    const c=new CallConsoleController({snapshot:async()=>[entry,{...entry,id:"2"}],subscribe:(_fn,state)=>{state("live");return ()=>{};},clear:async()=>{}});
    const el=new CallConsole();el.callController=c;document.body.append(el);await c.connect();
    const row=el.shadowRoot!.querySelector<HTMLButtonElement>('[part="call"]')!;const glyph=row.querySelector("svg");row.focus();row.dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowDown",bubbles:true}));
    expect(el.shadowRoot!.activeElement?.getAttribute("data-call-id")).toBe("2");expect(row.querySelector("svg")).toBe(glyph);c.destroy();
  });
});
