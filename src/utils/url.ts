// ===========================================================
// Types
// ===========================================================

export type HttpUrl = `http://${string}`;

export type HttpsUrl = `https://${string}`;

export type WsUrl = `ws://${string}`;

export type WssUrl = `wss://${string}`;

// ===========================================================
// Functions
// ===========================================================

/**
 * Validates a HTTP or HTTPS URL and returns it if it is valid.
 */
export function getHttpUrl(url: string | HttpUrl | HttpsUrl): HttpUrl | HttpsUrl {
    if (url.trim() !== url) {
        throw new Error('Please provide a valid url (without leading or trailing whitespace)');
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        throw new Error('Please provide a valid url (http:// or https://)');
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Please provide a valid url (http:// or https://)');
    }

    if (!parsedUrl.hostname) {
        throw new Error('Please provide a valid url with a hostname');
    }

    return url as HttpUrl | HttpsUrl;
}

/**
 * Validates a WebSocket URL and returns it if it is valid.
 */
export function getWebSocketUrl(url: string): WsUrl | WssUrl {
    if (url.trim() !== url) {
        throw new Error("Please provide a valid WebSocket url without surrounding whitespace");
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        throw new Error("Please provide a valid WebSocket url (ws:// or wss://)");
    }

    if (parsedUrl.protocol !== "ws:" && parsedUrl.protocol !== "wss:") {
        throw new Error("Please provide a valid WebSocket url (ws:// or wss://)");
    }

    if (!parsedUrl.hostname) {
        throw new Error("Please provide a valid WebSocket url (ws:// or wss://)");
    }

    return url as WsUrl | WssUrl;
}
