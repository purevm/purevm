import { RpcResponseError } from "./RpcResponseError.js";

export class RpcInvalidResponseError extends RpcResponseError {
  constructor(
    response: unknown,
    cause?: unknown,
    message = "Invalid JSON-RPC response.",
    code = "RPC_INVALID_RESPONSE",
  ) {
    super(message, response, cause, code);
  }
}
