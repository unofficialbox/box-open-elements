import { BoxApiError } from "../http.js";
import type { MetadataRequestContext } from "../../../../src/patterns/metadata/contracts.js";

/**
 * Framework-neutral route helpers. Handlers accept a standard `Request` and
 * return a standard `Response`, so they adapt to any runtime that speaks the
 * Fetch API (Bun, Deno, Node 18+, Cloudflare Workers, Next route handlers…).
 */
export type RouteHandler = (request: Request) => Promise<Response>;

export const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

/** Map a thrown error to a JSON error response, preserving Box status codes. */
export const errorResponse = (error: unknown): Response => {
  if (error instanceof BoxApiError) {
    return jsonResponse(
      { code: error.code ?? "box_error", message: error.message, requestId: error.requestId },
      error.status,
    );
  }
  const message = error instanceof Error ? error.message : "Internal server error";
  return jsonResponse({ code: "internal_error", message }, 500);
};

/** Derive a pattern request context (locale, request id) from request headers. */
export const contextFromRequest = (request: Request): MetadataRequestContext => {
  const locale = request.headers.get("accept-language") ?? undefined;
  const requestId = request.headers.get("x-request-id") ?? undefined;
  return {
    ...(locale ? { locale } : {}),
    ...(requestId ? { requestId } : {}),
  };
};

export const readNumber = (value: string | null): number | undefined => {
  if (value === null || value.trim() === "") {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * Match a URL pathname against a `/a/:b/c` template, returning captured params
 * or null. Keeps the handlers router-agnostic without a routing dependency.
 */
export const matchPath = (
  template: string,
  pathname: string,
): Record<string, string> | null => {
  const templateParts = template.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);
  if (templateParts.length !== pathParts.length) {
    return null;
  }
  const params: Record<string, string> = {};
  for (let index = 0; index < templateParts.length; index += 1) {
    const templatePart = templateParts[index];
    const pathPart = pathParts[index];
    if (templatePart.startsWith(":")) {
      params[templatePart.slice(1)] = decodeURIComponent(pathPart);
    } else if (templatePart !== pathPart) {
      return null;
    }
  }
  return params;
};
