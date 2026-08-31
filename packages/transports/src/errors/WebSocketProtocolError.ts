import { RpcResponseError } from "./RpcResponseError.js";

export class WebSocketProtocolError extends RpcResponseError {
  readonly raw: string | undefined;

  constructor(message: string, response: unknown, raw?: string, cause?: unknown) {
    super(message, response, cause, "WEBSOCKET_PROTOCOL");
    this.raw = raw;
  }
}
