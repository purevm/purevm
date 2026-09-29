import { TransportError } from "./TransportError.js";

export class WebSocketConnectionError extends TransportError {
  constructor(message = "WebSocket connection failed.", cause?: unknown) {
    super(message, { cause, code: "WEBSOCKET_CONNECTION", retryable: true });
  }
}
