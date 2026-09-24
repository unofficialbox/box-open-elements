/** Incremental UTF-8 decoding with a bounded line buffer and early-reader cleanup. */
export async function* readNdjson<T = unknown>(stream: ReadableStream<Uint8Array>, options: { maxLineLength?: number; signal?: AbortSignal } = {}): AsyncGenerator<T> {
  const reader = stream.getReader();
  const decoder = new TextDecoder("utf-8", {fatal: true});
  const limit = options.maxLineLength ?? 1048576;
  let buffer = "";
  let finished = false;
  const abort = (): void => { void reader.cancel(options.signal?.reason); };
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
        if (line) yield JSON.parse(line) as T;
      }
      if (buffer.length > limit) throw new Error("NDJSON line exceeds limit");
      if (done) { finished = true; if (buffer.trim()) yield JSON.parse(buffer) as T; break; }
    }
  } finally {
    options.signal?.removeEventListener("abort", abort);
    if (!finished) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
