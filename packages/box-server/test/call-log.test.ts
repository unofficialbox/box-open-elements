// @vitest-environment node
import {describe,expect,it,vi} from "vitest";
import {CallLog,loggedFetch,redactBody,redactHeaders,redactUrl,detectRpcError,createCallLogHandler} from "../src/call-log.js";
import type {CallEntry} from "../src/call-log.js";
const entry=():CallEntry=>({id:"1",startedAt:0,durationMs:1,pending:false,service:"box",summary:"test",method:"GET",url:"https://example.com",requestHeaders:{},status:200,statusText:"OK",responseHeaders:{}});
describe("server call logging",()=>{
  it("redacts headers, nested JSON, OAuth forms and URL credentials before emission",()=>{
    expect(redactHeaders({Authorization:"Bearer SECRET",Cookie:"SECRET","x-api-key":"SECRET"})).toEqual({authorization:"[redacted]",cookie:"[redacted]","x-api-key":"[redacted]"});
    expect(redactBody(JSON.stringify({nested:[{accessToken:"SECRET",client_secret:"SECRET",password:"SECRET"}],safe:"ok"}))).not.toContain("SECRET");
    expect(redactBody("code=SECRET&code_verifier=SECRET&client_secret=SECRET&grant_type=refresh_token","application/x-www-form-urlencoded")).not.toContain("SECRET");
    expect(redactUrl("https://user:SECRET@example.com/?access_token=SECRET#SECRET")).not.toContain("SECRET");
    expect(redactBody("secret plain text")).toBe("[non-JSON body omitted]");
    const log=new CallLog();const listener=vi.fn();log.subscribe(listener);
    log.put({...entry(),requestHeaders:{authorization:"SECRET","content-type":"application/json"},requestBody:'{"token":"SECRET"}'});
    expect(JSON.stringify(listener.mock.calls)).not.toContain("SECRET");expect(JSON.stringify(log.list())).not.toContain("SECRET");
  });
  it("understands successful HTTP with failed RPC and SSE payloads",()=>{
    expect(detectRpcError('{"result":{"isError":true}}')).toContain("Tool");
    expect(detectRpcError('data: {"error":{"code":-1}}\n',"text/event-stream")).toContain("JSON-RPC");
    expect(detectRpcError('{"result":{}}')).toBeUndefined();
    expect(redactBody('event: message\ndata: {"token":"SECRET","result":1}\n\n',"text/event-stream")).not.toContain("SECRET");
  });
  it("records pending before fetch and returns an untouched response",async()=>{
    const log=new CallLog();const inner=vi.fn(async()=>{expect(log.list()[0]?.pending).toBe(true);return new Response('{"result":{"isError":true},"token":"SECRET"}',{headers:{"content-type":"application/json","set-cookie":"SECRET"}});});
    const response=await loggedFetch(log,"box",inner as typeof fetch)("https://example.com/mcp",{method:"POST",body:'{"method":"tools/call","params":{"name":"get_file"}}'});
    expect(await response.text()).toContain("SECRET");
    await vi.waitFor(()=>expect(log.list()[0]?.pending).toBe(false));
    expect(log.list()[0]?.rpcError).toContain("Tool");expect(log.list()[0]?.summary).toBe("tools/call get_file");expect(JSON.stringify(log.list())).not.toContain("SECRET");
  });
  it("labels 405 expected only for explicitly configured MCP operations",async()=>{
    for(const mcp of [false,true]){
      const log=new CallLog();await loggedFetch(log,"box",(async()=>new Response(null,{status:405})) as typeof fetch,{mcp})("https://example.com/mcp");
      expect(Boolean(log.list()[0]?.expected)).toBe(mcp);
    }
  });
  it("does not consume long-lived event streams, masks network errors and isolates observers",async()=>{
    const log=new CallLog();log.subscribe(()=>{throw new Error("observer");});
    const stream=new ReadableStream<Uint8Array>();
    const result=await loggedFetch(log,"box",(async()=>new Response(stream,{headers:{"content-type":"text/event-stream"}})) as typeof fetch)("https://example.com");
    expect(result.bodyUsed).toBe(false);expect(log.list()[0]?.pending).toBe(false);
    await expect(loggedFetch(log,"box",(async()=>{throw new Error("SECRET");}) as typeof fetch)("https://example.com")).rejects.toThrow("SECRET");
    expect(JSON.stringify(log.list())).not.toContain("SECRET");
  });
  it("bounds storage, replaces IDs and protects snapshots from mutation",()=>{
    const log=new CallLog(1);log.put(entry());log.put({...entry(),status:500});expect(log.list()).toHaveLength(1);expect(log.list()[0]?.status).toBe(500);
    log.list()[0]!.status=400;expect(log.list()[0]?.status).toBe(500);log.put({...entry(),id:"2"});expect(log.list()[0]?.id).toBe("2");log.clear();expect(log.list()).toEqual([]);
  });
  it("serves authorized snapshots, SSE updates and clears",async()=>{
    const log=new CallLog();log.put(entry());const handler=createCallLogHandler(log,()=>true);
    expect((await handler(new Request("https://host/calls"))).status).toBe(200);
    expect((await createCallLogHandler(log,()=>false)(new Request("https://host/calls"))).status).toBe(403);
    expect((await handler(new Request("https://host/nope"))).status).toBe(404);
    const response=await handler(new Request("https://host/calls/stream"));const reader=response.body!.getReader();
    expect(new TextDecoder().decode((await reader.read()).value)).toContain("event: snapshot");
    log.put({...entry(),id:"2"});expect(new TextDecoder().decode((await reader.read()).value)).toContain("event: call");
    expect((await handler(new Request("https://host/calls",{method:"DELETE"}))).status).toBe(204);
    expect(new TextDecoder().decode((await reader.read()).value)).toContain("event: clear");await reader.cancel();
  });
});
