import { RpcResponseError } from "./RpcResponseError.js";

export class RpcInvalidResponseError extends RpcResponseError {
  constructor(response: unknown, cause?: unknown, message = "Invalid JSON-RPC response.") {
    super(message, response, cause, "RPC_INVALID_RESPONSE");
  }
}
