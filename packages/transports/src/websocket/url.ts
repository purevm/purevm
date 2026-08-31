export function parseWebSocketUrl(value: string): string {
  if (value.trim() !== value) throw new TypeError("WebSocket URL contains surrounding whitespace.");

  const url = new URL(value);
  if (url.protocol !== "ws:" && url.protocol !== "wss:") {
    throw new TypeError("WebSocket URL must use ws: or wss:.");
  }
  return url.toString();
}
