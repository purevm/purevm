import { TransportError } from "./TransportError.js";

export class RpcTimeoutError extends TransportError {
  readonly timeoutMs: number;

  constructor(timeoutMs: number, cause?: unknown) {
    super(`RPC request timed out after ${timeoutMs}ms.`, {
      cause,
      code: "RPC_TIMEOUT",
      retryable: true,
    });
    this.timeoutMs = timeoutMs;
  }
}
