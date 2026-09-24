import {afterEach, describe, expect, it, vi} from "vitest";
import {AgentChatController} from "../../src/patterns/agent-chat/controller.js";
import type {AgentSendRequest} from "../../src/patterns/agent-chat/types.js";
import {readNdjson} from "../../src/patterns/agent-chat/ndjson.js";
import {AgentChat} from "../../src/patterns/agent-chat/agent-chat.js";
import {AgentWorkspaceController, conversationTitle, conversationDetails} from "../../src/patterns/agent-workspace/controller.js";
import {AgentWorkspace} from "../../src/patterns/agent-workspace/agent-workspace.js";
import {formatElapsed, progress, splitStepTitle} from "../../src/patterns/run/progress.js";
import {RunSummary} from "../../src/patterns/run/run-summary.js";
import {StatusIcon} from "../../src/components/feedback/status-icon.js";
import {ResultBlocks,renderResultBlock,resultDocumentIds} from "../../src/components/collections/result-blocks.js";
import {FactList} from "../../src/components/collections/fact-list.js";
import {CheckList} from "../../src/components/collections/check-list.js";
import {DocumentList} from "../../src/components/collections/document-list.js";
import {toStatusKind,statusLabel,boeStatusGlyph} from "../../src/foundations/status/index.js";
import {ScrollPinController,boeDisclosureStyles,boeEntrance,boeReducedMotionPolicy} from "../../src/foundations/motion/index.js";
const session = (sendMessage: (r: AgentSendRequest)=>Promise<void> = async () => {}) => {
  const c = new AgentChatController({token:"test",transport:{sendMessage}}); c.connect(); return c;
};
afterEach(()=>{document.body.replaceChildren(); vi.useRealTimers(); vi.restoreAllMocks();});
describe("stream extensions",()=>{
  it("folds updates by id, carries identity, snapshots and timings, reports missing events",async()=>{
    const c = session(async r=>{
      expect(r.messageId).toBe("agent-1");
      r.onEvent({kind:"delta",text:"A",seq:1}); r.onEvent({kind:"delta",text:"duplicate",seq:1});
      r.onEvent({kind:"block",block:{id:"b",type:"facts",rows:[]},seq:3});
      r.onEvent({kind:"block",block:{id:"b",type:"facts",rows:[{label:"L",value:"V"}]},seq:4});
      r.onEvent({kind:"trace",step:{id:"t",title:"Tool",status:"running"}});
      r.onEvent({kind:"trace",step:{id:"t",title:"Tool",status:"succeeded"}});
      r.onEvent({kind:"todos",todos:[{id:"todo",content:"Extract",status:"completed"}]});
      r.onEvent({kind:"options",options:[{label:"Next",prompt:"next"}]});
      r.onEvent({kind:"context",context:{record:"R1"}});
      r.onEvent({kind:"citation",citation:{id:"f",label:"old"}});
      r.onEvent({kind:"citation",citation:{id:"f",label:"new"}});
      r.onEvent({kind:"done",status:"needs_input",seq:5});
      r.onEvent({kind:"delta",text:"late"});
    });
    const m = await c.send("test");
    expect(m?.body).toBe("A"); expect(m?.blocks).toHaveLength(1); expect(m?.trace).toHaveLength(1);
    expect(m?.context).toEqual({record:"R1"}); expect(m?.citations).toEqual([{id:"f",label:"new"}]);
    expect(m?.completeness).toEqual({status:"incomplete",missing:[2]}); expect(m?.endedAt).toBeGreaterThanOrEqual(m!.startedAt!);
  });
  it.each(["complete","needs_input","error"] as const)("records terminal %s",async status=>{
    const m = await session(async r=>{r.onEvent({kind:"done",status,seq:1});}).send("x");
    expect(m?.completeness?.status).toBe(status); expect(m?.status).toBe(status === "error" ? "error" : "complete");
  });
  it("marks missing done and abort as incomplete, ignores late callbacks",async()=>{
    let request!:AgentSendRequest; let finish!:()=>void;
    const c=session(r=>{request=r; return new Promise(resolve=>{finish=resolve;});});
    const sent=c.send("x"); c.stop(); request.onEvent({kind:"delta",text:"late"}); finish();
    expect((await sent)?.completeness?.status).toBe("incomplete"); expect(c.getMessage("agent-1")?.body).toBe("");
  });
  it("rejects invalid sequence input",async()=>{
    const m=await session(async r=>r.onEvent({kind:"delta",text:"x",seq:-1})).send("x"); expect(m?.status).toBe("error");
  });
  it("suppresses concurrent approvals and preserves failed execution outcome",async()=>{
    const c=session(async r=>{r.onEvent({kind:"proposal",proposal:{id:"p",title:"Write"}});});
    let finish!:(p:any)=>void;
    const resolve=vi.fn(()=>new Promise<any>(r=>{finish=r;})); c.config.transport.resolveAction=resolve;
    await c.send("write"); const pending=c.resolveAction("p","approved");
    expect(c.getMessage("agent-1")?.proposals[0]?.resolving).toBe("approved");
    expect(await c.resolveAction("p","approved")).toBeNull();
    finish({id:"p",title:"Write",decision:"approved",outcome:"failed",note:"Item not found"});
    expect((await pending)?.outcome).toBe("failed"); expect(resolve).toHaveBeenCalledTimes(1);
    expect(c.getMessage("agent-1")?.proposals[0]?.resolving).toBeUndefined();
  });
  it("decodes split UTF-8, CRLF, empty lines, and an unterminated final record",async()=>{
    const bytes=new TextEncoder().encode('{"text":"é"}\r\n\n{"n":2}');
    const stream=new ReadableStream<Uint8Array>({start(c){for(const byte of bytes)c.enqueue(new Uint8Array([byte]));c.close();}});
    const out=[];for await(const value of readNdjson(stream))out.push(value);
    expect(out).toEqual([{text:"é"},{n:2}]); expect(stream.locked).toBe(false);
  });
  it("cancels malformed, oversized and abandoned streams",async()=>{
    for(const [text,limit] of [["{bad}\n",100],["abcdef",2]] as const){
      const cancel=vi.fn(); const stream=new ReadableStream<Uint8Array>({start(c){c.enqueue(new TextEncoder().encode(text));},cancel});
      await expect(async()=>{for await(const _ of readNdjson(stream,{maxLineLength:limit})){} }).rejects.toThrow();expect(cancel).toHaveBeenCalled();
    }
  });
});
describe("motion, status and results",()=>{
  it("maps all vocabularies to one decorative glyph family with words",()=>{
    for(const [input,kind] of Object.entries({running:"active",in_progress:"active",succeeded:"done",completed:"done",pass:"done",warn:"warning",fail:"failed",info:"pending",skipped:"skipped"}))expect(toStatusKind(input)).toBe(kind);
    for(const kind of ["pending","active","done","warning","failed","skipped"] as const){expect(statusLabel(kind)).toBeTruthy();expect(boeStatusGlyph(kind)).toContain('aria-hidden="true"');}
    const icon=new StatusIcon();document.body.append(icon);icon.kind="done"; const glyph=icon.shadowRoot!.querySelector("svg");icon.kind="done";expect(icon.shadowRoot!.querySelector("svg")).toBe(glyph);
    expect(icon.shadowRoot!.textContent).toContain("Done");
    expect(boeDisclosureStyles()).toContain("min-height: 0");expect(boeEntrance("pop")).toContain("boe-pop");expect(boeReducedMotionPolicy).toContain("animation-delay: 0ms");
  });
  it("renders semantic escaped results and safe whole-document links",()=>{
    const el=new ResultBlocks(); el.blocks=[{type:"facts",rows:[{label:"<script>",value:"$4.8M"}]},{type:"checks",rows:[{label:"LTV",status:"warn",detail:"Needs review"}]},{type:"table",columns:["Metric","This record"],rows:[{cells:["LTV","80%"],status:"fail",note:"Mismatch"}],footnote:"Data"},{type:"documents",items:[{id:"1",name:"Unsafe",href:"javascript:alert(1)"},{id:"2",name:"Safe",href:"https://app.box.com/file/2",detail:"PDF"}]}];
    document.body.append(el);expect(el.shadowRoot!.querySelector("script")).toBeNull();expect(el.shadowRoot!.querySelector("dl")).not.toBeNull();
    expect(el.shadowRoot!.querySelector("table th[scope=row]")?.textContent).toContain("Mismatch");expect(el.shadowRoot!.querySelector('[role="region"]')?.getAttribute("tabindex")).toBe("0");
    expect(el.shadowRoot!.querySelector('button[data-document-id="1"]')).not.toBeNull();expect(el.documentIds).toEqual(["1","2"]);
    const selected=vi.fn();el.addEventListener("document-selected",selected);el.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();expect(selected).toHaveBeenCalled();
    const first=el.shadowRoot!.querySelector("section");el.blocks=[el.blocks[0]!];expect(el.shadowRoot!.querySelector("section")).toBe(first);
    expect(resultDocumentIds([{type:"documents",items:[{id:"x",name:"X"},{id:"x",name:"Y"}]}])).toEqual(["x"]);
    expect(renderResultBlock({type:"checks",rows:[{label:"rule",status:"pass",value:"Passed"}]})).toContain("Passed");
    const facts=new FactList();facts.rows=[{label:"a",value:"b"}];expect(facts.rows).toHaveLength(1);
    const checks=new CheckList();checks.rows=[{label:"a",status:"info"}];expect(checks.rows).toHaveLength(1);
    const docs=new DocumentList();docs.items=[{id:"1",name:"One"}];expect(docs.items).toHaveLength(1);
  });
  it("keeps scroll pinned through resize but respects upward user intent",()=>{
    const el=document.createElement("div");Object.defineProperties(el,{scrollHeight:{value:1000,configurable:true},clientHeight:{value:100,configurable:true}});document.body.append(el);
    const changed=vi.fn();const pin=new ScrollPinController(el,changed);pin.connect();pin.contentChanged();expect(el.scrollTop).toBe(1000);
    el.dispatchEvent(new WheelEvent("wheel",{deltaY:-10}));el.scrollTop=500;pin.contentChanged();expect(el.scrollTop).toBe(500);expect(pin.pinned).toBe(false);
    el.dispatchEvent(new Event("scroll"));expect(pin.pinned).toBe(false);pin.contentChanged(true);expect(pin.pinned).toBe(true);
    el.dispatchEvent(new KeyboardEvent("keydown",{key:"PageUp"}));expect(pin.pinned).toBe(false);pin.jump();expect(pin.pinned).toBe(true);pin.disconnect();
  });
});
describe("run summary",()=>{
  it("formats elapsed and active/settled outcomes",()=>{
    expect([0,400,12000,65000,-1].map(formatElapsed)).toEqual(["<0.1 s","0.4 s","12 s","1 min 5 s",""]);
    expect(splitStepTitle("Box · get_file")).toEqual({source:"Box",action:"get_file"});expect(splitStepTitle("Think")).toEqual({action:"Think"});
    const turn={startedAt:0,steps:[],todos:[]};expect(progress(turn,false,3000)).toEqual({kind:"active",label:"Thinking…",elapsed:"3 s"});
    expect(progress({...turn,todos:[{id:"1",content:"Extract",status:"in_progress"}]},false,100).label).toBe("Extract…");
    expect(progress({...turn,endedAt:2400}).label).toBe("Worked for 2.4 s");expect(progress({...turn,endedAt:2400,incomplete:true}).kind).toBe("warning");
    expect(progress({...turn,endedAt:2400},true).kind).toBe("failed");
    expect(progress({...turn,endedAt:2400,steps:[{id:"w",title:"Warning",status:"warning"}]}).label).toContain("1 warning");
  });
  it("discloses without clock announcements and cleans up its timer",()=>{
    vi.useFakeTimers();vi.setSystemTime(5000);const el=new RunSummary();el.turn={startedAt:0,steps:[],todos:[{id:"1",content:"Extract",status:"in_progress"}]};document.body.append(el);
    expect(el.shadowRoot!.querySelector<HTMLElement>("#details")!.inert).toBe(true);el.shadowRoot!.querySelector<HTMLButtonElement>("button")!.click();expect(el.open).toBe(true);
    vi.advanceTimersByTime(1000);expect(el.shadowRoot!.querySelector('[part="clock"]')!.textContent).toBe("6 s");expect(el.shadowRoot!.querySelector('[role="status"]')!.textContent).toBe("Extract…");
    el.turn={...el.turn,endedAt:6000};expect(el.shadowRoot!.querySelector('[part="label"]')!.textContent).toBe("Worked for 6.0 s");el.remove();expect(vi.getTimerCount()).toBe(0);
  });
});
describe("chat and workspace",()=>{
  it("switches between persistent panes and mutually exclusive drawers",async()=>{
    let width=1400;
    const c=new AgentWorkspaceController(()=>session(async r=>{
      r.onEvent({kind:"context",context:{record:"R1"}});r.onEvent({kind:"citation",citation:{id:"1",label:"File",href:"https://app.box.com/file/1"}});
      r.onEvent({kind:"block",block:{type:"documents",items:[{id:"1",name:"Duplicate"},{id:"2",name:"Second"}]}});
      r.onEvent({kind:"proposal",proposal:{id:"p",title:"Write"}});
    }));
    const chat=c.newChat();await chat.controller.send("Review");
    const el=new AgentWorkspace();vi.spyOn(el,"getBoundingClientRect").mockImplementation(()=>({width} as DOMRect));el.workspaceController=c;document.body.append(el);
    expect(el.shadowRoot!.querySelector<HTMLElement>("aside#details")!.inert).toBe(false);
    expect(c.details.sources.map(s=>s.id)).toEqual(["1","2"]);expect(c.details.context).toEqual({record:"R1"});expect(c.summaries[0]?.status).toBe("Needs your approval");
    const toggle=el.shadowRoot!.querySelector<HTMLButtonElement>('[data-toggle="details"]')!;toggle.click();expect(el.shadowRoot!.querySelector<HTMLElement>("aside#details")!.inert).toBe(true);
    el.remove();width=390;document.body.append(el);expect(el.hasAttribute("data-mobile")).toBe(true);
    const chats=el.shadowRoot!.querySelector<HTMLButtonElement>('[data-toggle="chats"]')!;chats.click();expect(el.shadowRoot!.querySelector("#chats")!.getAttribute("role")).toBe("dialog");
    toggle.click();expect(el.shadowRoot!.querySelector<HTMLElement>("#chats")!.inert).toBe(true);
    el.shadowRoot!.querySelector<HTMLButtonElement>("#scrim")!.click();expect(el.shadowRoot!.querySelector<HTMLElement>("aside#details")!.inert).toBe(true);
    chats.click();el.shadowRoot!.querySelector<HTMLButtonElement>("#new")!.click();expect(c.chats).toHaveLength(2);
    el.shadowRoot!.querySelector<HTMLButtonElement>('[data-chat-id="chat-1"]')!.click();expect(c.activeId).toBe("chat-1");
    const replacement=new AgentWorkspaceController(()=>session());replacement.newChat();el.workspaceController=replacement;expect(el.shadowRoot!.querySelectorAll("box-agent-chat")).toHaveLength(1);
    c.destroy();replacement.destroy();
  });
  it("guards IME and scopes labels and proposal anchors",async()=>{
    const send=vi.fn(async()=>{});const c=session(send);const el=new AgentChat();el.chatController=c;document.body.append(el);
    const other=new AgentChat();document.body.append(other);
    const field=el.shadowRoot!.querySelector("textarea")!;field.value="hello";field.dispatchEvent(new Event("compositionstart"));field.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));expect(send).not.toHaveBeenCalled();
    field.dispatchEvent(new Event("compositionend"));field.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));await Promise.resolve();expect(send).toHaveBeenCalledTimes(1);
    expect(field.getAttribute("aria-labelledby")).not.toBe(other.shadowRoot!.querySelector("textarea")!.getAttribute("aria-labelledby"));
    expect(el.proposalAnchor("agent-1","p")).not.toBe(other.proposalAnchor("agent-1","p"));el.focusComposer();expect(el.shadowRoot!.activeElement).toBe(field);
  });
  it("renders failed approval honestly and suppresses success followups",async()=>{
    const c=session(async r=>{r.onEvent({kind:"proposal",proposal:{id:"p",title:"Write",decision:"approved",outcome:"failed",note:"Not found"}});r.onEvent({kind:"options",options:[{label:"Sign",prompt:"sign"}]});});
    const el=new AgentChat();el.chatController=c;document.body.append(el);await c.send("Write");
    expect(el.shadowRoot!.querySelector('[part="proposal"][role="alert"]')?.textContent).toContain("Approved · didn't complete");expect(el.shadowRoot!.querySelector('[part="option"]')).toBeNull();expect(el.shadowRoot!.querySelector('[part="retry"]')).not.toBeNull();
  });
  it("reuses empty chats and keeps hidden sessions running",async()=>{
    const workspace=new AgentWorkspaceController(()=>session());const first=workspace.newChat();expect(workspace.newChat()).toBe(first);
    await first.controller.send("A first message whose words define the title");const second=workspace.newChat();expect(second).not.toBe(first);
    const el=new AgentWorkspace();el.workspaceController=workspace;document.body.append(el);workspace.select(first.id);
    const hosts=el.shadowRoot!.querySelectorAll("box-agent-chat");expect(hosts).toHaveLength(2);expect(second.controller.getState().connected).toBe(true);
    expect(workspace.summaries[0]?.title).toContain("A first message");expect(conversationTitle("words words words",10)).toBe("words…");
    expect(conversationDetails(first.controller.getState()).sources).toEqual([]);
    workspace.destroy();expect(first.controller.getState().connected).toBe(false);
  });
});
