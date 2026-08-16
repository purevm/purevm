import type { JsonRpcErrorObject } from "../types.js";

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isJsonRpcErrorObject(
    value: unknown,
): value is JsonRpcErrorObject {
    return (
        isRecord(value) &&
        typeof value["code"] === "number" &&
        typeof value["message"] === "string"
    );
}

export function parseWebSocketMessage(
    raw: string,
): { readonly ok: true; readonly value: unknown } |
    { readonly ok: false; readonly error: Error } {
    try {
        return { ok: true, value: JSON.parse(raw) };
    } catch (cause) {
        return {
            ok: false,
            error: cause instanceof Error
                ? cause
                : new Error("Failed to parse WebSocket message"),
        };
    }
}
