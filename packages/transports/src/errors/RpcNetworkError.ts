import { TransportError } from "./TransportError.js";

export class RpcNetworkError extends TransportError {
  constructor(cause?: unknown) {
    super("RPC network request failed.", {
      cause,
      code: "RPC_NETWORK",
      retryable: true,
    });
  }
}
