import { TransportError } from "./TransportError.js";

export class RpcAbortError extends TransportError {
  constructor(cause?: unknown) {
    super("RPC request aborted.", { cause, code: "RPC_ABORTED", retryable: false });
  }
}
