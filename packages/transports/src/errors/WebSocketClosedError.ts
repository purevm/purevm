import { TransportError } from "./TransportError.js";

export class WebSocketClosedError extends TransportError {
  constructor(message = "WebSocket transport is closed.", cause?: unknown, code = "WEBSOCKET_CLOSED") {
    super(message, { cause, code, retryable: false });
  }
}
