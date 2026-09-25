export interface CallEntry {
  id: string; startedAt: number; durationMs: number; pending: boolean;
  service: string; summary: string; method: string; url: string;
  requestHeaders: Record<string,string>; requestBody?: string;
  status: number; statusText: string; responseHeaders: Record<string,string>; responseBody?: string;
  error?: string; expected?: string; rpcError?: string;
}
export type CallEvent = {type: "snapshot"; entries: CallEntry[]} | {type: "call"; entry: CallEntry} | {type: "clear"};
export type CallConnection = "connecting" | "live" | "reconnecting" | "unavailable";
export const callFailed = (entry: CallEntry): boolean => Boolean(entry.rpcError || (!entry.expected && (entry.error || entry.status === 0 || entry.status >= 400)));
export const callStatus = (entry: CallEntry, isFailed: (entry: CallEntry) => boolean = callFailed): string => entry.rpcError ? "Tool error" : entry.expected && !isFailed(entry) ? "Expected" : isFailed(entry) ? "Failed" : entry.pending ? "Pending" : "Done";
export const formatCallHttp = (entry: CallEntry, side: "request" | "response" | "both" = "both"): string => {
  const headers = (h: Record<string,string>): string => Object.entries(h).map(([k,v]) => `${k}: ${v}`).join("\n");
  const request = `${entry.method} ${entry.url}\n${headers(entry.requestHeaders)}\n\n${entry.requestBody ?? ""}`;
  const response = `HTTP ${entry.status} ${entry.statusText}\n${headers(entry.responseHeaders)}\n\n${entry.responseBody ?? ""}${entry.rpcError || entry.error ? `\n${entry.rpcError ?? entry.error}` : ""}`;
  return side === "request" ? request : side === "response" ? response : `${request}\n\n${response}`;
};
