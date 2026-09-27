import { parseRpcResponse } from "../common/rpc.js";
import { HttpStatusError, RpcParseBodyError, RpcProviderError } from "../errors/index.js";
import type { RpcId } from "../types.js";

export function parseHttpResponse(response: Response, body: string, id: RpcId): unknown {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch (cause) {
    if (!response.ok) throw new HttpStatusError(response.status, response.statusText, body);
    throw new RpcParseBodyError(body, cause);
  }

  if (response.ok) return parseRpcResponse(json, id);

  // Keep a well-formed JSON-RPC error, otherwise the HTTP status is the meaningful failure.
  let cause: unknown;
  try {
    parseRpcResponse(json, id);
  } catch (error) {
    if (error instanceof RpcProviderError) throw error;
    cause = error;
  }
  throw new HttpStatusError(response.status, response.statusText, body, cause);
}
