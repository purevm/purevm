import { parseRpcResponse } from "../common/rpc.js";
import { HttpStatusError, RpcResponseError } from "../errors/index.js";
import type { RpcId } from "../types.js";

export function parseHttpResponse(response: Response, body: string, id: RpcId): unknown {
  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch (cause) {
    if (!response.ok) throw new HttpStatusError(response.status, response.statusText, body);
    throw new RpcResponseError("HTTP response body is not valid JSON.", body, cause);
  }

  const result = parseRpcResponse(json, id);
  if (!response.ok) throw new HttpStatusError(response.status, response.statusText, body);
  return result;
}
