import type { HttpHeaders } from "./types.js";

export function createHeaders(
  authorization?: string,
  transport?: HttpHeaders,
  request?: HttpHeaders,
): Headers {
  const headers = new Headers();
  if (authorization) headers.set("authorization", authorization);
  applyHeaders(headers, transport);
  applyHeaders(headers, request);
  if (!headers.has("content-type")) headers.set("content-type", "application/json");
  return headers;
}

function applyHeaders(target: Headers, source?: HttpHeaders): void {
  if (!source) return;
  for (const [name, value] of new Headers(source)) target.set(name, value);
}
