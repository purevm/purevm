import { TransportError } from "./TransportError.js";

export class RpcSerializationError extends TransportError {
  constructor(cause?: unknown) {
    super("Failed to serialize JSON-RPC request.", {
      cause,
      code: "RPC_SERIALIZATION",
      retryable: false,
    });
  }
}
