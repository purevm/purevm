import { TransportError } from "./TransportError.js";

export class RpcResponseError extends TransportError {
  readonly response: unknown;

  constructor(message: string, response: unknown, cause?: unknown, code = "RPC_RESPONSE") {
    super(message, { cause, code, retryable: false });
    this.response = response;
  }
}
