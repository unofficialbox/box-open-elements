import type { CallEntry, CallEvent } from "../../../src/patterns/call-console/types.js";
export type { CallEntry, CallEvent } from "../../../src/patterns/call-console/types.js";
const secret = /authorization|cookie|token|secret|password|api[-_]?key|^code$|code[-_]?verifier/i;
const REDACTED = "[redacted]";
export function redactHeaders(headers: HeadersInit): Record<string,string> {
  const result: Record<string,string> = {};
  new Headers(headers).forEach((value,key) => {result[key] = secret.test(key) ? REDACTED : value;});
  return result;
}
export function redactJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactJson);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key,val]) => [key, secret.test(key) ? REDACTED : redactJson(val)]));
  return value;
}
export function redactUrl(raw: string): string {
  try {const url = new URL(raw); url.username = ""; url.password = ""; url.hash = ""; url.searchParams.forEach((_value,key) => {if (secret.test(key)) url.searchParams.set(key, REDACTED);}); return url.toString();}
  catch {return "[invalid URL]";}
}
/** Unknown text is omitted deliberately: arbitrary bodies may contain credentials. */
export function redactBody(text: string, contentType = ""): string {
  if (!text) return "";
  if (/event-stream/i.test(contentType) && text.includes("data:")) return JSON.stringify(text.split(/\r?\n/).filter(l => l.startsWith("data:")).map(l => {try {return redactJson(JSON.parse(l.slice(5).trim()));} catch {return "[non-JSON event omitted]";}}));
  if (/x-www-form-urlencoded/i.test(contentType)) {const params = new URLSearchParams(text); params.forEach((_value,key) => {if (secret.test(key)) params.set(key,REDACTED);}); return params.toString();}
  try {return JSON.stringify(redactJson(JSON.parse(text)), null, 2);} catch {return "[non-JSON body omitted]";}
}
export function detectRpcError(text: string, contentType = ""): string | undefined {
  const payloads = /event-stream/i.test(contentType) ? text.split(/\r?\n/).filter(l => l.startsWith("data:")).map(l => l.slice(5).trim()) : [text];
  for (const payload of payloads) {
    try {const data = JSON.parse(payload); if (data?.error != null) return "JSON-RPC error"; if (data?.result?.isError === true || data?.isError === true) return "Tool result reported isError";} catch {}
  }
  return undefined;
}
/** The store accepts only sanitized entries; even direct callers cannot bypass redaction. */
export class CallLog {
  private entries: CallEntry[] = [];
  private listeners = new Set<(event: CallEvent) => void>();
  private seq = 0;
  constructor(readonly maxEntries = 300) {}
  nextId(): string {return `call-${++this.seq}`;}
  list(): CallEntry[] {return structuredClone(this.entries);}
  put(entry: CallEntry): void {
    const safe = structuredClone(entry);
    safe.url = redactUrl(safe.url); safe.requestHeaders = redactHeaders(safe.requestHeaders); safe.responseHeaders = redactHeaders(safe.responseHeaders);
    if (safe.requestBody) safe.requestBody = redactBody(safe.requestBody, safe.requestHeaders["content-type"]);
    if (safe.responseBody) safe.responseBody = redactBody(safe.responseBody, safe.responseHeaders["content-type"]);
    this.entries = this.entries.some(e => e.id === safe.id) ? this.entries.map(e => e.id === safe.id ? safe : e) : [safe,...this.entries].slice(0, Math.max(1,this.maxEntries));
    this.emit({type:"call",entry:safe});
  }
  clear(): void {this.entries = []; this.emit({type:"clear"});}
  subscribe(fn:(event:CallEvent)=>void):()=>void {this.listeners.add(fn); return ()=>this.listeners.delete(fn);}
  private emit(event: CallEvent): void {this.listeners.forEach(fn => {try {fn(structuredClone(event));} catch { /* Observers must never break application requests. */ }});}
}
async function boundedBody(body: ReadableStream<Uint8Array> | null, limit = 1048576): Promise<string> {
  if (!body) return "";
  const reader = body.getReader(); const decoder = new TextDecoder(); let bytes = 0; let text = "";
  try {while (true) {const chunk = await reader.read(); if (chunk.done) return text + decoder.decode(); bytes += chunk.value.byteLength; if (bytes > limit) {void reader.cancel(); return "";} text += decoder.decode(chunk.value,{stream:true});}}
  finally {reader.releaseLock();}
}
export interface LoggedFetchOptions { mcp?: boolean; }
/** Records before dispatch; returns the original response without consuming its body. */
export function loggedFetch(log: CallLog, service: string, inner: typeof fetch = fetch, options: LoggedFetchOptions = {}): typeof fetch {
  return async (input, init) => {
    const request = new Request(input, init);
    const startedAt = Date.now(); const method = request.method;
    // Never tee a caller's unbounded request stream just to inspect it.
    const raw = typeof init?.body === "string" ? init.body : init?.body instanceof URLSearchParams ? init.body.toString() : "";
    let summary = `${method} ${new URL(request.url).pathname}`;
    try {const json = JSON.parse(raw); if (typeof json.method === "string") summary = json.method === "tools/call" && typeof json.params?.name === "string" ? `tools/call ${json.params.name}` : json.method;} catch {}
    if (/x-www-form-urlencoded/i.test(request.headers.get("content-type") ?? "")) summary = `OAuth token (${new URLSearchParams(raw).get("grant_type") ?? "unknown"})`;
    if (options.mcp && method === "GET") summary = "open event stream";
    const entry: CallEntry = {id:log.nextId(),startedAt,durationMs:0,pending:true,service,summary,method,url:redactUrl(request.url),requestHeaders:redactHeaders(request.headers),requestBody:redactBody(raw,request.headers.get("content-type") ?? ""),status:0,statusText:"",responseHeaders:{}};
    log.put(entry);
    try {
      const response = await inner(request);
      const contentType = response.headers.get("content-type") ?? "";
      Object.assign(entry,{status:response.status,statusText:response.statusText,responseHeaders:redactHeaders(response.headers),durationMs:Date.now()-startedAt});
      if (options.mcp && response.status === 405 && ["GET","DELETE"].includes(method)) entry.expected = "MCP server does not support this optional operation";
      if (!response.body || /event-stream/i.test(contentType) && method === "GET") {entry.pending = false; log.put(entry); return response;}
      log.put(entry);
      void boundedBody(response.clone().body).then(text => {
        entry.responseBody = redactBody(text,contentType);
        entry.rpcError = detectRpcError(text,contentType);
        entry.pending = false; entry.durationMs = Date.now()-startedAt; log.put(entry);
      }, () => {entry.pending = false; entry.error = "Unable to read response body"; log.put(entry);});
      return response;
    } catch (error) {entry.pending = false; entry.durationMs = Date.now()-startedAt; entry.error = "Network request failed"; log.put(entry); throw error;}
  };
}
/** Mount behind the host's developer authorization. Never expose on the product route. */
export function createCallLogHandler(log: CallLog, authorize: (request: Request) => boolean | Promise<boolean>): (request: Request) => Promise<Response> {
  return async request => {
    if (!await authorize(request)) return new Response("Forbidden",{status:403});
    const path = new URL(request.url).pathname;
    if (path === "/calls" && request.method === "GET") return Response.json(log.list());
    if (path === "/calls" && request.method === "DELETE") {log.clear(); return new Response(null,{status:204});}
    if (path === "/calls/stream" && request.method === "GET") {
      let stop: (()=>void) | undefined;
      let cleanup = (): void => {};
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const send = (event:CallEvent):void => controller.enqueue(new TextEncoder().encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`));
          send({type:"snapshot",entries:log.list()}); stop = log.subscribe(send);
          const abort = ():void => {stop?.(); controller.close();};
          request.signal.addEventListener("abort",abort,{once:true});
          cleanup = () => {stop?.(); request.signal.removeEventListener("abort",abort);};
          if (request.signal.aborted) abort();
        }, cancel() {cleanup();},
      });
      return new Response(stream,{headers:{"content-type":"text/event-stream","cache-control":"no-store"}});
    }
    return new Response("Not found",{status:404});
  };
}
