import { RpcProviderError, RpcResponseError } from "../errors/index.js";
import type { RpcErrorObject, RpcId } from "../types.js";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isRpcId(value: unknown): value is RpcId {
  return value === null || typeof value === "string" || Number.isSafeInteger(value);
}

export function parseRpcResponse(response: unknown, expectedId: RpcId): unknown {
  if (!isRecord(response) || response["jsonrpc"] !== "2.0" || !isRpcId(response["id"])) {
    throw new RpcResponseError("Invalid JSON-RPC response.", response);
  }
  if (response["id"] !== expectedId) {
    throw new RpcResponseError("JSON-RPC response id does not match request id.", response);
  }

  const hasResult = Object.hasOwn(response, "result");
  const hasError = Object.hasOwn(response, "error");
  if (hasResult === hasError) {
    throw new RpcResponseError("JSON-RPC response must contain result or error.", response);
  }
  if (hasError) {
    if (!isRpcErrorObject(response["error"])) {
      throw new RpcResponseError("Invalid JSON-RPC error response.", response);
    }
    throw new RpcProviderError(response["error"]);
  }
  return response["result"];
}

function isRpcErrorObject(value: unknown): value is RpcErrorObject {
  return (
    isRecord(value) && typeof value["code"] === "number" && typeof value["message"] === "string"
  );
}
