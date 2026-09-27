import { isRecord, isRpcId } from "../common/rpc.js";
import { WebSocketProtocolError } from "../errors/index.js";
import type { RpcId } from "../types.js";

export type RpcMessage =
  | { type: "response"; id: RpcId; response: unknown }
  | { type: "subscription"; id: string; result: unknown };

export function parseWebSocketMessage(data: unknown): RpcMessage {
  const text = messageText(data);
  let message: unknown;
  try {
    message = JSON.parse(text);
  } catch (cause) {
    throw new WebSocketProtocolError("WebSocket message is not valid JSON.", text, text, cause);
  }

  if (isSubscriptionMessage(message)) {
    return {
      type: "subscription",
      id: message.params.subscription,
      result: message.params.result,
    };
  }
  if (!isRecord(message) || !isRpcId(message["id"])) {
    throw new WebSocketProtocolError("Invalid JSON-RPC WebSocket message.", message, text);
  }
  return { type: "response", id: message["id"], response: message };
}

function isSubscriptionMessage(
  value: unknown,
): value is { params: { result: unknown; subscription: string } } {
  return (
    isRecord(value) &&
    value["jsonrpc"] === "2.0" &&
    value["method"] === "eth_subscription" &&
    isRecord(value["params"]) &&
    typeof value["params"]["subscription"] === "string" &&
    Object.hasOwn(value["params"], "result")
  );
}

function messageText(data: unknown): string {
  if (typeof data === "string") return data;
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    throw new WebSocketProtocolError(
      'Blob WebSocket messages are not supported. Set binaryType to "arraybuffer".',
      data,
    );
  }
  if (data instanceof ArrayBuffer) return new TextDecoder().decode(data);
  if (ArrayBuffer.isView(data)) {
    const bytes = new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.byteLength);
    return new TextDecoder().decode(bytes);
  }
  throw new WebSocketProtocolError("Unsupported WebSocket message type.", data);
}
