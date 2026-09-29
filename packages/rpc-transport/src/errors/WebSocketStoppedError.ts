import { WebSocketClosedError } from "./WebSocketClosedError.js";

export class WebSocketStoppedError extends WebSocketClosedError {
  constructor(message = "WebSocket transport is stopped.", cause?: unknown) {
    super(message, cause, "WEBSOCKET_STOPPED");
  }
}
