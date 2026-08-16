// ===========================================================
// Types
// ===========================================================

export type WsUrl = `ws://${string}`;
export type WssUrl = `wss://${string}`;

// ===========================================================
// Functions
// ===========================================================

export function getWebSocketUrl(
    url: string | WsUrl | WssUrl,
): WsUrl | WssUrl {
    if (url.trim() !== url) {
        throw new Error(
            "Please provide a valid WebSocket url without surrounding whitespace",
        );
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        throw new Error("Please provide a valid WebSocket url (ws:// or wss://)");
    }

    if (
        (parsedUrl.protocol !== "ws:" && parsedUrl.protocol !== "wss:") ||
        !parsedUrl.hostname
    ) {
        throw new Error("Please provide a valid WebSocket url (ws:// or wss://)");
    }

    return url as WsUrl | WssUrl;
}
