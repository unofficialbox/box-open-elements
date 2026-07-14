/**
 * Minimal HTTP primitives shared across the Box server adapter. The package
 * talks to the Box REST API with the platform `fetch` — no SDK — so it stays
 * dependency-free and runnable on any runtime that provides `fetch`.
 */

export interface FetchLike {
  (input: string | URL, init?: RequestInit): Promise<Response>;
}

/** A structured error carrying the upstream Box status so routes can map it. */
export class BoxApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;

  constructor(message: string, options: { status: number; code?: string; requestId?: string }) {
    super(message);
    this.name = "BoxApiError";
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
  }
}

export const resolveFetch = (providedFetch?: FetchLike): FetchLike => {
  if (providedFetch) {
    return providedFetch;
  }
  if (typeof globalThis.fetch !== "function") {
    throw new Error("A fetch implementation is required. Pass `fetch` explicitly on older runtimes.");
  }
  return globalThis.fetch.bind(globalThis) as FetchLike;
};

interface BoxErrorPayload {
  code?: string;
  message?: string;
  request_id?: string;
  context_info?: { message?: string };
}

/** Convert a non-ok Box response into a {@link BoxApiError}. */
export const toBoxApiError = async (response: Response): Promise<BoxApiError> => {
  let payload: BoxErrorPayload = {};
  try {
    payload = (await response.json()) as BoxErrorPayload;
  } catch {
    // Non-JSON error body — fall back to status text below.
  }
  const message =
    payload.context_info?.message ||
    payload.message ||
    response.statusText ||
    `Box request failed with status ${response.status}`;
  return new BoxApiError(message, {
    status: response.status,
    code: payload.code,
    requestId: payload.request_id,
  });
};
