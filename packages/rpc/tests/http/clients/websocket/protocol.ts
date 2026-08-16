import type { RpcRequest } from "../types.js";
import type { ClassifiedMessage } from "./types.js";

// ============================================================
// JSON-RPC subscription protocol helpers (pure functions)
// ============================================================

/** Narrow an unknown value to a plain object (not null, not array). */
export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Build an `eth_subscribe` request frame. */
export function buildSubscribeRequest(id: number, params: unknown[]): RpcRequest {
    return { id, jsonrpc: "2.0", method: "eth_subscribe", params };
}

/** Build an `eth_unsubscribe` request frame for a node subscription id. */
export function buildUnsubscribeRequest(id: number, subscriptionId: string): RpcRequest {
    return { id, jsonrpc: "2.0", method: "eth_unsubscribe", params: [subscriptionId] };
}

/** Parse a raw frame into JSON, returning a tagged result instead of throwing. */
export function parseFrame(
    raw: string,
): { ok: true; value: unknown } | { ok: false; error: Error } {
    try {
        return { ok: true, value: JSON.parse(raw) };
    } catch (error) {
        return { ok: false, error: error instanceof Error ? error : new Error("invalid JSON frame") };
    }
}

/** Classify a parsed JSON-RPC frame into the single action the client takes for it. */
export function classifyMessage(message: unknown): ClassifiedMessage {
    if (!isRecord(message)) return { kind: "unknown" };
    if (message["jsonrpc"] !== "2.0") return { kind: "unknown" };

    // Push notification: `eth_subscription` with a `params.subscription` id.
    if (message["method"] === "eth_subscription") {
        const params = message["params"];
        if (isRecord(params) && typeof params["subscription"] === "string") {
            return {
                kind: "notification",
                subscriptionId: params["subscription"],
                result: params["result"],
            };
        }
        return { kind: "unknown" };
    }

    // Everything below is a response and must carry a numeric id.
    if (typeof message["id"] !== "number") return { kind: "unknown" };

    if (typeof message["result"] === "string") {
        return { kind: "ack", id: message["id"], subscriptionId: message["result"] };
    }

    const error = message["error"];
    if (isRecord(error)) {
        return {
            kind: "error",
            id: message["id"],
            code: typeof error["code"] === "number" ? error["code"] : null,
            message: typeof error["message"] === "string" ? error["message"] : "unknown",
        };
    }

    return { kind: "unknown" };
}
