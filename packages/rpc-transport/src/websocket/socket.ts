import { createTimeoutContext } from "../common/timeout.js";
import { RpcAbortError, RpcTimeoutError, WebSocketConnectionError } from "../errors/index.js";
import type { WebSocketFactory, WebSocketLike, WebSocketListener } from "./types.js";

export async function openWebSocket(
  url: string,
  createWebSocket: WebSocketFactory,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<WebSocketLike> {
  let socket: WebSocketLike;
  try {
    socket = createWebSocket(url);
  } catch (cause) {
    throw new WebSocketConnectionError(undefined, cause);
  }
  // Blob payloads decode asynchronously and would reorder messages.
  if ("binaryType" in socket) socket.binaryType = "arraybuffer";
  const timeout = createTimeoutContext(timeoutMs, signal);

  try {
    return await new Promise<WebSocketLike>((resolve, reject) => {
      const opened: WebSocketListener = () => finish(() => resolve(socket));
      const failed: WebSocketListener = (event) => {
        finish(() => reject(new WebSocketConnectionError(undefined, event.error)));
        socket.close(1_000, "Connection failed");
      };
      const closed: WebSocketListener = (event) =>
        finish(() => reject(new WebSocketConnectionError(closeMessage(event))));
      const aborted = () => {
        finish(() => {
          if (timeout.timedOut) reject(new RpcTimeoutError(timeoutMs, timeout.signal.reason));
          else reject(new RpcAbortError(signal?.reason));
        });
        socket.close(1_000, "Connection cancelled");
      };

      function finish(settle: () => void): void {
        socket.removeEventListener("open", opened);
        socket.removeEventListener("error", failed);
        socket.removeEventListener("close", closed);
        timeout.signal.removeEventListener("abort", aborted);
        settle();
      }

      socket.addEventListener("open", opened);
      socket.addEventListener("error", failed);
      socket.addEventListener("close", closed);
      timeout.signal.addEventListener("abort", aborted, { once: true });
      if (timeout.signal.aborted) aborted();
    });
  } finally {
    timeout.dispose();
  }
}

export function defaultWebSocketFactory(url: string): WebSocketLike {
  const WebSocketConstructor = (
    globalThis as unknown as { WebSocket?: new (url: string) => WebSocketLike }
  ).WebSocket;
  if (!WebSocketConstructor) {
    throw new WebSocketConnectionError("No WebSocket implementation available.");
  }
  return new WebSocketConstructor(url);
}

export function closeMessage(event: {
  code?: number | undefined;
  reason?: string | undefined;
}): string {
  const code = event.code === undefined ? "" : ` (${event.code})`;
  const reason = event.reason ? `: ${event.reason}` : "";
  return `WebSocket connection closed${code}${reason}.`;
}
