/** Incremental UTF-8 decoding with a bounded line buffer and early-reader cleanup. */
export async function* readNdjson<T = unknown>(stream: ReadableStream<Uint8Array>, options: { maxLineLength?: number; signal?: AbortSignal; onInvalidLine?: (line: string, error: Error) => "skip" | "throw" } = {}): AsyncGenerator<T> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8", {fatal: true});
  const limit = options.maxLineLength ?? 1048576;
  let buffer = "";
  let finished = false;
  const abort = (): void => { void reader.cancel(options.signal?.reason); };
  const parse = (line: string): T | undefined => {
    try { return JSON.parse(line) as T; }
    catch (error) { if (options.onInvalidLine?.(line, error as Error) !== "skip") throw error; return undefined; }
  };
  options.signal?.addEventListener("abort", abort, {once: true});
  try {
    while (true) {
      options.signal?.throwIfAborted();
      const {value, done} = await reader.read();
      options.signal?.throwIfAborted();
      buffer += decoder.decode(value, {stream: !done});
      let newline: number;
      while ((newline = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newline).trim(); buffer = buffer.slice(newline + 1);
        if (line.length > limit) throw new Error("NDJSON line exceeds limit");
        if (line) { const record = parse(line); if (record !== undefined) yield record; }
      }
      if (buffer.length > limit) throw new Error("NDJSON line exceeds limit");
      if (done) { finished = true; if (buffer.trim()) { const record = parse(buffer); if (record !== undefined) yield record; } break; }
    }
  } finally {
    options.signal?.removeEventListener("abort", abort);
    if (!finished) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
