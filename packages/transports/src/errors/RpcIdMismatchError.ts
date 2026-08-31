import type { RpcId } from "../types.js";
import { RpcInvalidResponseError } from "./RpcInvalidResponseError.js";

export class RpcIdMismatchError extends RpcInvalidResponseError {
  readonly expectedId: RpcId;
  readonly responseId: RpcId;

  constructor(expectedId: RpcId, responseId: RpcId, response: unknown, cause?: unknown) {
    super(
      response,
      cause,
      `JSON-RPC response id mismatch: expected ${String(expectedId)}, got ${String(responseId)}.`,
      "RPC_ID_MISMATCH",
    );
    this.expectedId = expectedId;
    this.responseId = responseId;
  }
}
