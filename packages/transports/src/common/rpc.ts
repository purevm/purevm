import {
  RpcIdMismatchError,
  RpcInvalidResponseError,
  RpcProviderError,
} from "../errors/index.js";
import type { RpcErrorObject, RpcId } from "../types.js";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isRpcId(value: unknown): value is RpcId {
  return value === null || typeof value === "string" || Number.isSafeInteger(value);
}

export function parseRpcResponse(response: unknown, expectedId: RpcId): unknown {
  if (!isRecord(response) || response["jsonrpc"] !== "2.0" || !isRpcId(response["id"])) {
    throw new RpcInvalidResponseError(response);
  }
  if (response["id"] !== expectedId) {
    throw new RpcIdMismatchError(expectedId, response["id"], response);
  }

  const hasResult = Object.hasOwn(response, "result");
  const hasError = Object.hasOwn(response, "error");
  if (hasResult === hasError) {
    throw new RpcInvalidResponseError(
      response,
      undefined,
      "JSON-RPC response must contain result or error.",
    );
  }
  if (hasError) {
    if (!isRpcErrorObject(response["error"])) {
      throw new RpcInvalidResponseError(response, undefined, "Invalid JSON-RPC error response.");
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
